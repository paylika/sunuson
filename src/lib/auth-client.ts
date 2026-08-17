"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Client d'authentification du navigateur.
 *
 * L'URL et la clé publique lui sont PASSÉES par le serveur plutôt que lues
 * dans des variables préfixées NEXT_PUBLIC_. Next fige ces préfixes au
 * moment du build : les utiliser rendrait le build dépendant de la
 * configuration, ce qu'on a justement corrigé. La clé anon est publique par
 * nature, la faire transiter par le rendu ne coûte rien.
 */
export function supabaseBrowser(url: string, anonKey: string) {
  return createBrowserClient(url, anonKey);
}
