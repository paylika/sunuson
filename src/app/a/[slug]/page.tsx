import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { APP_NAME } from "@/lib/config";
import {
  getArtistBySlug,
  getClipsByArtist,
  getSupportsByArtist,
  getTracksByArtist,
} from "@/lib/queries";
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

  const [tracks, clips, supports] = await Promise.all([
    getTracksByArtist(artist.id),
    getClipsByArtist(artist.id),
    getSupportsByArtist(artist.id),
  ]);

  return (
    <Shell>
      <ArtistView
        artist={artist}
        tracks={tracks}
        clips={clips}
        supports={supports}
      />
    </Shell>
  );
}
