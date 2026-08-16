-- =============================================================================
--  Schéma Cloudflare D1 (SQLite). Idempotent, relançable sans risque.
--
--  Différences avec Postgres, à connaître :
--    · pas de type uuid    -> TEXT, l'identifiant est généré par l'app
--    · pas de booléen      -> INTEGER, 0 ou 1
--    · pas de timestamptz  -> TEXT au format ISO 8601 (UTC)
--
--  Pas de RLS non plus : D1 n'est joignable que depuis le Worker. Le
--  navigateur ne voit jamais la base, c'est le serveur qui est la frontière.
-- =============================================================================

-- ------------------------------------------------------------------ artistes

create table if not exists artists (
  id                text primary key,
  owner_email       text,
  slug              text not null unique,
  name              text not null,
  city              text not null default '',
  bio               text not null default '',
  gradient_from     text not null default '#e04ec8',
  gradient_to       text not null default '#5b21b6',
  verified          integer not null default 0 check (verified in (0, 1)),
  monthly_listeners integer not null default 0,
  payout_method     text not null default 'wave'
                      check (payout_method in ('wave', 'orange_money')),
  payout_number     text,
  created_at        text not null default (datetime('now'))
);

create index if not exists artists_owner_email_idx on artists (owner_email);

-- ---------------------------------------------------------------------- sons

create table if not exists tracks (
  id          text primary key,
  artist_id   text not null references artists (id) on delete cascade,
  title       text not null,
  duration    integer not null default 0,
  plays       integer not null default 0,
  -- Clé de l'objet dans le bucket R2. Pas l'URL complète : le domaine du
  -- CDN peut changer, la clé non.
  audio_key   text,
  locked      integer not null default 0 check (locked in (0, 1)),
  featuring   text,
  rights_ok   integer not null default 0 check (rights_ok in (0, 1)),
  released_at text not null default (date('now')),
  position    integer not null default 0,
  created_at  text not null default (datetime('now'))
);

create index if not exists tracks_artist_idx on tracks (artist_id, position);

-- --------------------------------------------------------------------- clips

-- Aucune vidéo hébergée : seulement l'identifiant YouTube.
create table if not exists clips (
  id         text primary key,
  artist_id  text not null references artists (id) on delete cascade,
  title      text not null,
  youtube_id text not null,
  views      integer not null default 0,
  created_at text not null default (datetime('now'))
);

create index if not exists clips_artist_idx on clips (artist_id);

-- ------------------------------------------------------------------ soutiens

create table if not exists supports (
  id             text primary key,
  artist_id      text not null references artists (id) on delete cascade,
  track_id       text references tracks (id) on delete set null,
  supporter_name text not null default 'Anonyme',
  amount         integer not null check (amount >= 100),
  message        text,
  method         text not null check (method in ('wave', 'orange_money')),
  -- 'pending' à la création, 'paid' seulement sur confirmation du webhook.
  status         text not null default 'pending'
                   check (status in ('pending', 'paid', 'failed')),
  -- Unique : si l'agrégateur rejoue son webhook — ça arrive régulièrement —
  -- le soutien n'est pas compté deux fois.
  provider_ref   text unique,
  created_at     text not null default (datetime('now')),
  paid_at        text
);

create index if not exists supports_artist_paid_idx
  on supports (artist_id, created_at desc) where status = 'paid';

-- ------------------------------------------------------------------ retraits

create table if not exists payouts (
  id         text primary key,
  artist_id  text not null references artists (id) on delete cascade,
  amount     integer not null check (amount > 0),
  status     text not null default 'en_attente'
               check (status in ('en_attente', 'envoye')),
  created_at text not null default (datetime('now')),
  sent_at    text
);

create index if not exists payouts_artist_idx on payouts (artist_id);

-- ----------------------------------------------------------- soldes artistes

-- La commission vit aussi dans src/lib/config.ts (COMMISSION_RATE).
-- Les deux doivent rester alignées.
drop view if exists artist_balances;
create view artist_balances as
select
  a.id                                                  as artist_id,
  coalesce(s.gross, 0)                                  as gross,
  cast(round(coalesce(s.gross, 0) * 0.85) as integer)   as net,
  cast(round(coalesce(s.gross, 0) * 0.85) as integer)
    - coalesce(p.withdrawn, 0)                          as available,
  coalesce(s.cnt, 0)                                    as support_count
from artists a
left join (
  select artist_id, sum(amount) as gross, count(*) as cnt
  from supports where status = 'paid' group by artist_id
) s on s.artist_id = a.id
left join (
  select artist_id, sum(amount) as withdrawn
  from payouts group by artist_id
) p on p.artist_id = a.id;
