-- Extrait court, à coller seul dans le SQL Editor.
-- Position de lecture au moment du soutien : sert à épingler les fans sur
-- la forme d'onde du morceau.
alter table public.supports add column if not exists position_sec integer;
