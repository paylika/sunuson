-- =============================================================================
--  Schéma Supabase — coller tel quel dans le SQL Editor du projet.
--  Idempotent : relançable sans rien casser.
-- =============================================================================

-- ------------------------------------------------------------------ artistes

create table if not exists public.artists (
  id                uuid primary key default gen_random_uuid(),
  -- Rattachement au compte Supabase Auth. Null tant qu'il n'y a pas de login.
  user_id           uuid references auth.users (id) on delete set null,
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

create index if not exists artists_user_id_idx on public.artists (user_id);

-- ---------------------------------------------------------------------- sons

create table if not exists public.tracks (
  id          uuid primary key default gen_random_uuid(),
  artist_id   uuid not null references public.artists (id) on delete cascade,
  title       text not null,
  duration    integer not null default 0,
  plays       integer not null default 0,
  -- Clé de l'objet, pas l'URL complète : le domaine du CDN peut changer.
  -- Bucket Supabase au début, Cloudflare R2 dès que l'egress serre.
  audio_key   text,
  locked      boolean not null default false,
  featuring   text,
  rights_ok   boolean not null default false,
  released_at date not null default current_date,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists tracks_artist_idx on public.tracks (artist_id, position);

-- --------------------------------------------------------------------- clips

-- Aucune vidéo hébergée : seulement l'identifiant YouTube.
create table if not exists public.clips (
  id         uuid primary key default gen_random_uuid(),
  artist_id  uuid not null references public.artists (id) on delete cascade,
  title      text not null,
  youtube_id text not null,
  views      integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists clips_artist_idx on public.clips (artist_id);

-- ------------------------------------------------------------------ soutiens

create table if not exists public.supports (
  id             uuid primary key default gen_random_uuid(),
  artist_id      uuid not null references public.artists (id) on delete cascade,
  track_id       uuid references public.tracks (id) on delete set null,
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
  created_at     timestamptz not null default now(),
  paid_at        timestamptz
);

create index if not exists supports_artist_paid_idx
  on public.supports (artist_id, created_at desc) where status = 'paid';

-- ------------------------------------------------------------------ retraits

create table if not exists public.payouts (
  id         uuid primary key default gen_random_uuid(),
  artist_id  uuid not null references public.artists (id) on delete cascade,
  amount     integer not null check (amount > 0),
  status     text not null default 'en_attente'
               check (status in ('en_attente', 'envoye')),
  created_at timestamptz not null default now(),
  sent_at    timestamptz
);

create index if not exists payouts_artist_idx on public.payouts (artist_id);

-- ----------------------------------------------------------- soldes artistes

-- Vue en security definer (le défaut) : elle doit voir les payouts, que la RLS
-- masque au public. Ce n'est pas une fuite — elle n'expose que des agrégats,
-- et son propre WHERE ne compte que les soutiens 'paid'.
--
-- La commission vit aussi dans src/lib/config.ts (COMMISSION_RATE).
-- Les deux doivent rester alignées.
create or replace view public.artist_balances as
select
  a.id                                    as artist_id,
  coalesce(s.gross, 0)                    as gross,
  round(coalesce(s.gross, 0) * 0.85)::int as net,
  round(coalesce(s.gross, 0) * 0.85)::int - coalesce(p.withdrawn, 0) as available,
  coalesce(s.cnt, 0)                      as support_count
from public.artists a
left join (
  select artist_id, sum(amount)::int as gross, count(*)::int as cnt
  from public.supports where status = 'paid' group by artist_id
) s on s.artist_id = a.id
left join (
  select artist_id, sum(amount)::int as withdrawn
  from public.payouts group by artist_id
) p on p.artist_id = a.id;

-- =============================================================================
--  RLS
--
--  L'app lit avec la clé ANON, même côté serveur : la RLS s'applique donc
--  vraiment. C'est volontaire — si une policy est mal écrite, la fuite reste
--  bornée. La clé service_role n'est réservée qu'aux écritures du webhook.
-- =============================================================================

alter table public.artists  enable row level security;
alter table public.tracks   enable row level security;
alter table public.clips    enable row level security;
alter table public.supports enable row level security;
alter table public.payouts  enable row level security;

drop policy if exists "artists lisibles"          on public.artists;
drop policy if exists "artiste gère sa fiche"     on public.artists;
drop policy if exists "tracks lisibles"           on public.tracks;
drop policy if exists "artiste gère ses sons"     on public.tracks;
drop policy if exists "clips lisibles"            on public.clips;
drop policy if exists "artiste gère ses clips"    on public.clips;
drop policy if exists "soutiens payés lisibles"   on public.supports;
drop policy if exists "artiste voit ses retraits" on public.payouts;

create policy "artists lisibles" on public.artists
  for select using (true);

create policy "artiste gère sa fiche" on public.artists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tracks lisibles" on public.tracks
  for select using (true);

create policy "artiste gère ses sons" on public.tracks
  for all using (
    exists (select 1 from public.artists a
            where a.id = tracks.artist_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.artists a
            where a.id = tracks.artist_id and a.user_id = auth.uid())
  );

create policy "clips lisibles" on public.clips
  for select using (true);

create policy "artiste gère ses clips" on public.clips
  for all using (
    exists (select 1 from public.artists a
            where a.id = clips.artist_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.artists a
            where a.id = clips.artist_id and a.user_id = auth.uid())
  );

-- Un soutien 'pending' n'existe pas pour le public.
-- Aucune policy d'insertion : le navigateur ne PEUT PAS créer de soutien,
-- même s'il essaie. Seul le webhook (service_role) en a le droit.
create policy "soutiens payés lisibles" on public.supports
  for select using (status = 'paid');

create policy "artiste voit ses retraits" on public.payouts
  for select using (
    exists (select 1 from public.artists a
            where a.id = payouts.artist_id and a.user_id = auth.uid())
  );

-- =============================================================================
--  Stockage audio
--  Utilisable au début, mais l'egress du palier gratuit part vite : ~5 Go/mois,
--  soit environ 1 200 écoutes à 4 Mo le morceau. Dès les premières écoutes
--  réelles, basculer sur Cloudflare R2 (egress gratuit) : seul
--  NEXT_PUBLIC_AUDIO_BASE_URL change, audio_key reste identique.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('audio', 'audio', true)
on conflict (id) do nothing;

-- =============================================================================
--  Évolutions
--  Ajoutées après coup, séparées pour rester relançables sur une base
--  existante : `create table if not exists` n'ajoute rien à une table déjà là.
-- =============================================================================

-- ------------------------------------------------- identité de l'artiste

alter table public.artists add column if not exists label      text;
alter table public.artists add column if not exists avatar_key text;
alter table public.artists add column if not exists cover_key  text;

-- ------------------------------------------------------------ un morceau

alter table public.tracks add column if not exists cover_key text;
alter table public.tracks add column if not exists label     text;

-- Comment le fan paie CE morceau :
--   'libre' -> il choisit son montant, comme sur la page de l'artiste
--   'fixe'  -> l'artiste impose un prix, le fan ne peut pas le changer
-- C'est ce qui transforme un inédit en vente plutôt qu'en don.
alter table public.tracks add column if not exists support_mode text
  not null default 'libre';

alter table public.tracks add column if not exists support_amount integer;

do $$
begin
  alter table public.tracks
    add constraint tracks_support_mode_check
    check (support_mode in ('libre', 'fixe'));
exception
  when duplicate_object then null;
end $$;

-- Un montant fixe sans prix n'a pas de sens : on l'interdit en base plutôt
-- que d'espérer que l'interface y pense toujours.
do $$
begin
  alter table public.tracks
    add constraint tracks_fixe_needs_amount
    check (support_mode <> 'fixe' or support_amount >= 100);
exception
  when duplicate_object then null;
end $$;

-- ------------------------------------------------------- stockage images

-- Pochettes et photos de profil. Bucket public : ces images sont faites
-- pour être partagées, et un lien signé casserait les aperçus sur les
-- réseaux sociaux — là où le lien de l'artiste circule.
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;
