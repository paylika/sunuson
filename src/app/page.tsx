import { getArtists, getBalances, getTracksByArtist } from "@/lib/queries";
import { HomeView } from "@/components/home-view";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function AccueilPage() {
  const artists = await getArtists();
  const featured = artists[0] ?? null;

  const [balances, featuredTracks] = await Promise.all([
    getBalances(),
    featured ? getTracksByArtist(featured.id) : Promise.resolve([]),
  ]);

  // Le classement se fait sur les montants réellement encaissés, pas sur le
  // nombre d'auditeurs : c'est l'argent qui raconte l'histoire du produit.
  const ranking = artists
    .map((a) => ({
      artist: a,
      total: balances.get(a.id)?.gross ?? 0,
      count: balances.get(a.id)?.supportCount ?? 0,
    }))
    .sort((x, y) => y.total - x.total);

  return (
    <Shell>
      <HomeView
        featured={featured}
        featuredTracks={featuredTracks}
        featuredTotal={featured ? (balances.get(featured.id)?.gross ?? 0) : 0}
        ranking={ranking}
      />
    </Shell>
  );
}
