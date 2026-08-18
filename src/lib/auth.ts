import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { getArtistByUser } from "./queries";
import { createServerClient } from "@supabase/ssr";

/**
 * Session côté serveur.
 *
 * Distinct de src/lib/db.ts : celui-ci lit la session du visiteur depuis les
 * cookies, l'autre sert les lectures publiques sans identité. Les mélanger
 * ferait qu'une page publique dépendrait de qui la consulte, et casserait la
 * mise en cache.
 */
function env(name: string): string {
  const value =
    process.env[name] || process.env[`NEXT_PUBLIC_${name}`] || "";
  if (!value) throw new Error(`${name} est requis. Voir .env.example.`);
  return value;
}

export async function supabaseSession() {
  const store = await cookies();

  return createServerClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        // Dans un composant serveur, l'écriture de cookies est interdite :
        // c'est le middleware qui rafraîchit la session. On avale donc
        // l'erreur plutôt que de faire tomber la page.
        try {
          list.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          /* rafraîchissement délégué au middleware */
        }
      },
    },
  });
}

/** L'utilisateur connecté, ou null. */
export async function currentUser() {
  const supabase = await supabaseSession();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/**
 * Qui regarde, et s'il a une page d'artiste.
 *
 * Mis en cache pour la durée d'une requête : la coquille en a besoin pour
 * dessiner la barre de navigation, et l'espace artiste pour son contenu.
 * Sans ce cache, la même paire de requêtes partirait deux fois par page.
 */
export const viewer = cache(async () => {
  const user = await currentUser().catch(() => null);
  if (!user) return { user: null, artist: null };

  const artist = await getArtistByUser(user.id).catch(() => null);
  return { user, artist };
});
