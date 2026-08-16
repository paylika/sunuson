-- =============================================================================
--  Schéma Neon (Postgres pur) — idempotent, relançable sans risque.
--
--  Différence majeure avec la version Supabase : il n'y a plus de RLS.
--  Ce n'est pas un oubli. Avec Neon, le navigateur ne parle JAMAIS à la base :
--  tout passe par le serveur Next.js, qui seul détient DATABASE_URL.
--  La frontière de sécurité se déplace de la base vers le serveur.
--
--  Conséquence à ne pas rater : une insertion de soutien ne doit exister que
--  dans une route serveur appelée par le webhook de l'agrégateur de paiement,
--  jamais dans une Server Action déclenchable depuis le navigateur.
-- =============================================================================

-- ------------------------------------------------------------------ artistes

create table if not exists artists (
  id                uuid primary key default gen_random_uuid(),
  -- L'authentification viendra plus tard ; on garde l'email du propriétaire
  -- pour rattacher le compte le jour venu.
  owner_email       text,
  slug              text not null unique,
  name              text not null,
  city              text not null default '',
  bio               text not null default '',
  gradient_from     text not null default '#e04ec8',
  gradient_to       text not null default '#5b21b6',
  verified          boolean not null default false,
  monthly_listeners integer not null default 0,
  payout_method     text not null default 'wave'
                      check (payout_method in ('wave', 'orange_money')),
  payout_number     text,
  created_at        timestamptz not null default now()
);

create index if not exists artists_owner_email_idx on artists (owner_email);

-- ---------------------------------------------------------------------- sons

create table if not exists tracks (
  id          uuid primary key default gen_random_uuid(),
  artist_id   uuid not null references artists (id) on delete cascade,
  title       text not null,
  duration    integer not null default 0,
  plays       integer not null default 0,
  -- Clé de l'objet chez Cloudflare R2. On ne stocke pas l'URL complète :
  -- le domaine du CDN peut changer, la clé non.
  audio_key   text,
  locked      boolean not null default false,
  featuring   text,
  rights_ok   boolean not null default false,
  released_at date not null default current_date,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists tracks_artist_id_idx on tracks (artist_id, position);

-- --------------------------------------------------------------------- clips

-- Aucune vidéo hébergée : seulement l'identifiant YouTube.
create table if not exists clips (
  id         uuid primary key default gen_random_uuid(),
  artist_id  uuid not null references artists (id) on delete cascade,
  title      text not null,
  youtube_id text not null,
  views      integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists clips_artist_id_idx on clips (artist_id);

-- ------------------------------------------------------------------ soutiens

create table if not exists supports (
  id             uuid primary key default gen_random_uuid(),
  artist_id      uuid not null references artists (id) on delete cascade,
  track_id       uuid references tracks (id) on delete set null,
  supporter_name text not null default 'Anonyme',
  amount         integer not null check (amount >= 100),
  message        text,
  method         text not null check (method in ('wave', 'orange_money')),
  -- 'pending' à la création, 'paid' seulement sur confirmation du webhook.
  -- Le mur public ne lit que les 'paid'.
  status         text not null default 'pending'
                   check (status in ('pending', 'paid', 'failed')),
  -- Référence de l'agrégateur, unique : empêche de compter deux fois si le
  -- webhook est rejoué (ils le sont, régulièrement).
  provider_ref   text unique,
  created_at     timestamptz not null default now(),
  paid_at        timestamptz
);

create index if not exists supports_artist_paid_idx
  on supports (artist_id, created_at desc) where status = 'paid';

-- ------------------------------------------------------------------ retraits

create table if not exists payouts (
  id         uuid primary key default gen_random_uuid(),
  artist_id  uuid not null references artists (id) on delete cascade,
  amount     integer not null check (amount > 0),
  status     text not null default 'en_attente'
               check (status in ('en_attente', 'envoye')),
  created_at timestamptz not null default now(),
  sent_at    timestamptz
);

create index if not exists payouts_artist_id_idx on payouts (artist_id);

-- ---------------------------------------------------------- soldes artistes

-- La commission vit aussi dans src/lib/config.ts (COMMISSION_RATE).
-- Les deux doivent rester alignées.
create or replace view artist_balances as
select
  a.id as artist_id,
  coalesce(s.gross, 0)                                as gross,
  round(coalesce(s.gross, 0) * 0.85)::int             as net,
  round(coalesce(s.gross, 0) * 0.85)::int
    - coalesce(p.withdrawn, 0)                        as available,
  coalesce(s.count, 0)                                as support_count
from artists a
left join (
  select artist_id, sum(amount)::int as gross, count(*)::int as count
  from supports where status = 'paid' group by artist_id
) s on s.artist_id = a.id
left join (
  select artist_id, sum(amount)::int as withdrawn
  from payouts group by artist_id
) p on p.artist_id = a.id;
