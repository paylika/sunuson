-- Single, EP, mixtape, album.
--
-- À jouer dans le SQL Editor de Supabase, après 005.
--
-- Pas de table `releases` séparée : un projet n'a que trois attributs — un
-- type, un titre, une pochette — et la pochette est déjà portée par chaque
-- morceau. Une table de plus imposerait une jointure sur toutes les lectures
-- pour ranger trois colonnes.

alter table public.tracks
  add column if not exists release_type text not null default 'single',
  add column if not exists release_title text,
  add column if not exists release_id uuid;

-- Le type est contraint en base, pas seulement dans le formulaire : c'est lui
-- qui décidera de l'affichage sur la page de l'artiste, et une valeur inconnue
-- y produirait une section fantôme.
do $$
begin
  alter table public.tracks
    add constraint tracks_release_type_check
    check (release_type in ('single', 'ep', 'mixtape', 'album'));
exception
  when duplicate_object then null;
end $$;

-- Les morceaux d'un même projet se retrouvent par cet identifiant, jamais par
-- leur titre : deux projets peuvent porter le même nom chez deux artistes, et
-- un titre se corrige.
create index if not exists tracks_release_idx
  on public.tracks (release_id) where release_id is not null;
