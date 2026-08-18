import { getArtists, getBalances, getTrackTitles } from "@/lib/queries";
import { DiscoverView } from "@/components/discover-view";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

/**
 * La racine est l'écran Découvrir.
 *
 * Il y avait avant un accueil distinct : artiste à la une, classement, rappel
 * du fonctionnement. Il montrait des listes d'artistes que Découvrir montrait
 * déjà, et reposait sur une hypothèse fausse ici — qu'on ouvre l'application
 * pour la parcourir. Les fans arrivent par le lien d'un artiste partagé dans
 * WhatsApp et atterrissent sur /a/son-nom. Le classement, seul contenu qui
 * lui était propre, a été remonté en tête de cet écran.
 */
export default async function AccueilPage() {
  const [artists, balances, titles] = await Promise.all([
    getArtists(),
    getBalances(),
    getTrackTitles(),
  ]);

  const rows = artists.map((artist) => ({
    artist,
    total: balances.get(artist.id)?.gross ?? 0,
    count: balances.get(artist.id)?.supportCount ?? 0,
    titles: titles.get(artist.id) ?? [],
  }));

  const trackCount = [...titles.values()].reduce((n, t) => n + t.length, 0);

  return (
    <Shell>
      <DiscoverView rows={rows} trackCount={trackCount} />
    </Shell>
  );
}
