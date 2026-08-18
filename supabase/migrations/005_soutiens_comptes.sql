-- Rattache les soutiens aux comptes.
--
-- À jouer dans le SQL Editor de Supabase, après 003 et 004.
--
-- La colonne est VOLONTAIREMENT facultative. Écouter et soutenir sans compte
-- est la règle fondatrice du produit : au Sénégal, exiger une inscription
-- avant de laisser envoyer 1 000 FCFA ferait perdre l'essentiel des soutiens.
-- On enregistre donc le compte quand il existe, et on ne le réclame jamais.

alter table public.supports
  add column if not exists user_id uuid references auth.users (id) on delete set null;

-- Un fan connecté relit ses propres soutiens : la requête filtre sur user_id,
-- donc l'index porte aussi la date pour servir la liste déjà triée.
create index if not exists supports_user_idx
  on public.supports (user_id, created_at desc) where user_id is not null;

-- ------------------------------------------------------------------ lecture

-- La policy publique ne montre que les soutiens payés, sans distinction de
-- lecteur. Elle reste : c'est elle qui alimente les murs de soutiens.
--
-- Celle-ci s'y ajoute pour le fan connecté, afin qu'il retrouve AUSSI ses
-- soutiens encore en attente — sinon un paiement en cours disparaîtrait de
-- son historique et donnerait l'impression que l'argent s'est perdu.
drop policy if exists "fan voit ses soutiens" on public.supports;

create policy "fan voit ses soutiens" on public.supports
  for select using (auth.uid() = user_id);

-- Toujours aucune policy d'insertion : le navigateur ne peut pas créer de
-- soutien, même en se réclamant d'un compte. Seul le serveur en est capable.
