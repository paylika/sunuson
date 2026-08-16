// `server-only` fait échouer la compilation si ce module est importé depuis un
// composant client. D1 n'est de toute façon joignable que depuis le Worker,
// mais ce garde-fou rend l'erreur explicite au lieu d'un plantage obscur.
import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * La base D1, via le binding déclaré dans wrangler.jsonc.
 *
 * En `next dev`, OpenNext branche ce binding sur un SQLite local rangé dans
 * .wrangler/ — aucun contact avec le compte Cloudflare.
 */
export async function db(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  const binding = env.DB;

  if (!binding) {
    throw new Error(
      "Binding D1 « DB » introuvable. Vérifie wrangler.jsonc, puis lance " +
        "`npm run db:local` pour créer la base locale.",
    );
  }
  return binding;
}
