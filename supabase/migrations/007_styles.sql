-- Le style d'un morceau.
--
-- À jouer dans le SQL Editor de Supabase, après 006.
--
-- Sans cette colonne, « recommander selon le type de son » est impossible :
-- rien en base ne dit qu'un morceau ressemble à un autre. Le genre est le
-- signal de similarité le plus direct, et le seul qu'on puisse obtenir dès le
-- premier morceau publié — les featurings et les co-soutiens demandent, eux,
-- des mois d'usage.
--
-- Un tableau plutôt qu'une colonne unique : un morceau est souvent à cheval,
-- et forcer un seul genre produit des étiquettes fausses que personne ne
-- corrige ensuite.
--
-- Les valeurs sont contrôlées côté application (src/lib/styles.ts) plutôt que
-- par une contrainte SQL : la liste évoluera avec la scène, et une contrainte
-- imposerait une migration à chaque ajout de style.

alter table public.tracks
  add column if not exists styles text[] not null default '{}';

-- Index d'intersection : « les morceaux qui partagent au moins un style avec
-- celui-ci » est la requête centrale de la recommandation.
create index if not exists tracks_styles_idx
  on public.tracks using gin (styles);
