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

  // Classement par NOMBRE de soutiens, jamais par montant : un palmarès des
  // revenus expose ce que gagne chaque artiste, et humilie ceux du bas. Le
  // compte donne la même preuve sociale sans afficher d'argent.
  const ranking = artists
    .map((a) => ({
      artist: a,
      total: balances.get(a.id)?.gross ?? 0,
      count: balances.get(a.id)?.supportCount ?? 0,
    }))
    .sort((x, y) => y.count - x.count || y.total - x.total);

  return (
    <Shell>
      <HomeView
        featured={featured}
        featuredTracks={featuredTracks}
        featuredSupports={
          featured ? (balances.get(featured.id)?.supportCount ?? 0) : 0
        }
        ranking={ranking}
      />
    </Shell>
  );
}
