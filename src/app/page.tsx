import { viewer } from "@/lib/auth";
import {
  getArtists,
  getBalances,
  getCandidats,
  getContexte,
  getTrackTitles,
} from "@/lib/queries";
import { recommander } from "@/lib/reco";
import { DiscoverView } from "@/components/discover-view";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

/**
 * Découvrir, et racine du site.
 *
 * L'écran ne classe plus les artistes par auditeurs mensuels. C'était un
 * chiffre semé, jamais calculé : le seul artiste réellement inscrit arrivait
 * dernier, derrière cinq personnages de démonstration. Un classement qui ne
 * classe rien vaut moins que pas de classement du tout.
 *
 * Les morceaux passent donc par l'algorithme, et les artistes restent en
 * annuaire consultable — l'un pour écouter, l'autre pour chercher quelqu'un.
 */
export default async function DecouvrirPage() {
  const { user } = await viewer();

  const [candidats, contexte, artists, balances, titles] = await Promise.all([
    getCandidats(),
    getContexte(user?.id),
    getArtists(),
    getBalances(),
    getTrackTitles(),
  ]);

  const feed = recommander(candidats, contexte, { limite: 18 });

  const rows = artists.map((artist) => ({
    artist,
    total: balances.get(artist.id)?.gross ?? 0,
    count: balances.get(artist.id)?.supportCount ?? 0,
    titles: titles.get(artist.id) ?? [],
  }));

  const trackCount = [...titles.values()].reduce((n, t) => n + t.length, 0);

  return (
    <Shell>
      <DiscoverView
        rows={rows}
        trackCount={trackCount}
        feed={feed.map((r) => ({
          track: r.track,
          artist: r.artist,
          raison: r.raison,
        }))}
        personnalise={contexte.artistesSoutenus.length > 0}
      />
    </Shell>
  );
}
