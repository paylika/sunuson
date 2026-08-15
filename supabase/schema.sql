-- =============================================================================
--  Schéma Supabase — à exécuter tel quel dans le SQL Editor.
--  Reflète exactement les types de src/lib/types.ts.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------ artistes

create table if not exists public.artists (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users (id) on delete cascade,
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

-- -------------------------------------------------------------------- sons

create table if not exists public.tracks (
  id          uuid primary key default gen_random_uuid(),
  artist_id   uuid not null references public.artists (id) on delete cascade,
  title       text not null,
  duration    integer not null default 0,
  plays       integer not null default 0,
  audio_path  text,                      -- chemin dans le bucket (ou clé R2)
  locked      boolean not null default false,
  featuring   text,
  rights_ok   boolean not null default false,
  released_at date not null default current_date,
  created_at  timestamptz not null default now()
);

create index if not exists tracks_artist_id_idx on public.tracks (artist_id);

-- ------------------------------------------------------------------- clips

-- On n'héberge aucune vidéo : seulement l'identifiant YouTube.
create table if not exists public.clips (
  id         uuid primary key default gen_random_uuid(),
  artist_id  uuid not null references public.artists (id) on delete cascade,
  title      text not null,
  youtube_id text not null,
  views      integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists clips_artist_id_idx on public.clips (artist_id);

-- ---------------------------------------------------------------- soutiens

create table if not exists public.supports (
  id             uuid primary key default gen_random_uuid(),
  artist_id      uuid not null references public.artists (id) on delete cascade,
  track_id       uuid references public.tracks (id) on delete set null,
  supporter_name text not null default 'Anonyme',
  amount         integer not null check (amount >= 100),
  message        text,
  method         text not null check (method in ('wave', 'orange_money')),
  -- pending tant que l'agrégateur n'a pas confirmé le paiement
  status         text not null default 'pending'
                   check (status in ('pending', 'paid', 'failed')),
  provider_ref   text,
  created_at     timestamptz not null default now()
);

create index if not exists supports_artist_id_idx  on public.supports (artist_id);
create index if not exists supports_created_at_idx on public.supports (created_at desc);

-- ---------------------------------------------------------------- retraits

create table if not exists public.payouts (
  id         uuid primary key default gen_random_uuid(),
  artist_id  uuid not null references public.artists (id) on delete cascade,
  amount     integer not null check (amount > 0),
  status     text not null default 'en_attente'
               check (status in ('en_attente', 'envoye')),
  created_at timestamptz not null default now(),
  sent_at    timestamptz
);

-- =============================================================================
--  RLS
--  Lecture publique de ce qui est public. Écriture réservée au propriétaire.
--  Les soutiens ne sont JAMAIS insérés depuis le navigateur : c'est le webhook
--  de l'agrégateur (service_role) qui les crée après confirmation du paiement.
-- =============================================================================

alter table public.artists  enable row level security;
alter table public.tracks   enable row level security;
alter table public.clips    enable row level security;
alter table public.supports enable row level security;
alter table public.payouts  enable row level security;

-- Artistes : lisibles par tous, modifiables par leur propriétaire.
create policy "artists lisibles" on public.artists
  for select using (true);

create policy "artiste gère sa fiche" on public.artists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Sons et clips : mêmes règles.
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

-- Soutiens : seuls les paiements confirmés sont visibles publiquement.
create policy "soutiens payés lisibles" on public.supports
  for select using (status = 'paid');

-- Retraits : visibles seulement par l'artiste concerné.
create policy "artiste voit ses retraits" on public.payouts
  for select using (
    exists (select 1 from public.artists a
            where a.id = payouts.artist_id and a.user_id = auth.uid())
  );

-- =============================================================================
--  Vue de solde — ce que l'artiste peut retirer.
-- =============================================================================

create or replace view public.artist_balances as
select
  a.id as artist_id,
  coalesce(sum(s.amount) filter (where s.status = 'paid'), 0)::int as gross,
  round(coalesce(sum(s.amount) filter (where s.status = 'paid'), 0) * 0.85)::int
    as net,
  round(coalesce(sum(s.amount) filter (where s.status = 'paid'), 0) * 0.85)::int
    - coalesce((select sum(p.amount) from public.payouts p
                where p.artist_id = a.id), 0)::int as available
from public.artists a
left join public.supports s on s.artist_id = a.id
group by a.id;

-- =============================================================================
--  Stockage
--  L'audio peut vivre ici au tout début, mais l'egress Supabase se paie vite.
--  Dès les premières centaines d'écoutes, basculer les fichiers sur
--  Cloudflare R2 (egress gratuit) et ne garder que le chemin dans audio_path.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('audio', 'audio', true)
on conflict (id) do nothing;
