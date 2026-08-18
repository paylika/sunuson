import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { APP_NAME } from "@/lib/config";
import {
  getArtistBySlug,
  getSupportsByArtist,
  getTracksByArtist,
} from "@/lib/queries";
import { viewer } from "@/lib/auth";
import { ArtistView } from "@/components/artist-view";
import { Shell } from "@/components/shell";

type Props = { params: Promise<{ slug: string }> };

// Les soutiens tombent en continu : la page se rend à chaque requête plutôt
// que d'être figée au build.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) return { title: APP_NAME };
  return { title: `${artist.name} — ${APP_NAME}`, description: artist.bio };
}

export default async function ArtistPage({ params }: Props) {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) notFound();

  const [tracks, supports, { user }] = await Promise.all([
    getTracksByArtist(artist.id),
    getSupportsByArtist(artist.id),
    viewer(),
  ]);

  const nomDuFan = (user?.user_metadata as { display_name?: string } | null)
    ?.display_name;

  return (
    <Shell>
      <ArtistView
        artist={artist}
        tracks={tracks}
        supports={supports}
        nomDuFan={nomDuFan}
      />
    </Shell>
  );
}
