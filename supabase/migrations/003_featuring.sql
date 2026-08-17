-- =============================================================================
--  Featuring et partage des revenus — extrait court de supabase/schema.sql.
--
--  Rejouer le fichier complet prend beaucoup de verrous d'un coup et peut
--  provoquer un « deadlock detected ». Celui-ci ne fait que le nécessaire.
--  Idempotent : relançable sans risque.
--
--  À exécuter EN DEUX FOIS si le deadlock revient : d'abord la partie 1,
--  puis la partie 2.
-- =============================================================================

-- ─────────────────────────────── PARTIE 1 ───────────────────────────────

create table if not exists public.track_collaborators (
  id            uuid primary key default gen_random_uuid(),
  track_id      uuid not null references public.tracks (id) on delete cascade,
  artist_id     uuid references public.artists (id) on delete set null,
  display_name  text not null,
  share_percent numeric(5, 2) not null default 0
                  check (share_percent >= 0 and share_percent <= 100),
  created_at    timestamptz not null default now(),
  unique (track_id, artist_id)
);

create index if not exists track_collab_track_idx  on public.track_collaborators (track_id);
create index if not exists track_collab_artist_idx on public.track_collaborators (artist_id);

alter table public.track_collaborators enable row level security;

drop policy if exists "collaborateurs lisibles" on public.track_collaborators;
create policy "collaborateurs lisibles" on public.track_collaborators
  for select using (true);

-- La somme des parts ne peut pas dépasser 100 % : règle d'argent, elle vit
-- en base et pas seulement dans l'interface.
create or replace function public.check_track_shares()
returns trigger language plpgsql as $$
declare total numeric;
begin
  select coalesce(sum(share_percent), 0) into total
  from public.track_collaborators
  where track_id = new.track_id and id <> new.id;

  if total + new.share_percent > 100 then
    raise exception 'Les parts dépassent 100 %% sur ce morceau (% + %)',
      total, new.share_percent;
  end if;
  return new;
end $$;

drop trigger if exists track_shares_guard on public.track_collaborators;
create trigger track_shares_guard
  before insert or update on public.track_collaborators
  for each row execute function public.check_track_shares();

-- ─────────────────────────────── PARTIE 2 ───────────────────────────────

-- Un soutien sur un morceau se répartit selon les parts déclarées.
-- Un soutien sur la page de l'artiste (sans morceau) lui revient en entier.
create or replace view public.artist_balances as
with track_share as (
  select t.id as track_id,
         t.artist_id,
         100 - coalesce(sum(c.share_percent), 0) as owner_percent
  from public.tracks t
  left join public.track_collaborators c on c.track_id = t.id
  group by t.id, t.artist_id
),
earnings as (
  select s.artist_id, s.amount::numeric as amount
  from public.supports s
  where s.status = 'paid' and s.track_id is null

  union all

  select ts.artist_id, s.amount * ts.owner_percent / 100.0
  from public.supports s
  join track_share ts on ts.track_id = s.track_id
  where s.status = 'paid'

  union all

  select c.artist_id, s.amount * c.share_percent / 100.0
  from public.supports s
  join public.track_collaborators c on c.track_id = s.track_id
  where s.status = 'paid' and c.artist_id is not null
),
totals as (
  select artist_id, sum(amount) as gross from earnings group by artist_id
),
counts as (
  select artist_id, count(*)::int as cnt
  from public.supports where status = 'paid' group by artist_id
)
select
  a.id                                    as artist_id,
  round(coalesce(t.gross, 0))::int        as gross,
  round(coalesce(t.gross, 0) * 0.85)::int as net,
  round(coalesce(t.gross, 0) * 0.85)::int - coalesce(p.withdrawn, 0) as available,
  coalesce(c.cnt, 0)                      as support_count
from public.artists a
left join totals t on t.artist_id = a.id
left join counts c on c.artist_id = a.id
left join (
  select artist_id, sum(amount)::int as withdrawn
  from public.payouts group by artist_id
) p on p.artist_id = a.id;
