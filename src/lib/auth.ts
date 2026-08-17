import "server-only";
import { cookies } from "next/headers";
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
