import { getArtists, getBalances, getTrackTitles } from "@/lib/queries";
import { DiscoverView } from "@/components/discover-view";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function DecouvrirPage() {
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
