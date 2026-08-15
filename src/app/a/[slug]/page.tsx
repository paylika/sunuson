import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { APP_NAME } from "@/lib/config";
import {
  artists,
  getArtistBySlug,
  getClipsByArtist,
  getTracksByArtist,
} from "@/lib/data";
import { ArtistView } from "@/components/artist-view";
import { Shell } from "@/components/shell";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return artists.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) return { title: APP_NAME };
  return {
    title: `${artist.name} — ${APP_NAME}`,
    description: artist.bio,
  };
}

export default async function ArtistPage({ params }: Props) {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) notFound();

  return (
    <Shell>
      <ArtistView
        artist={artist}
        tracks={getTracksByArtist(artist.id)}
        clips={getClipsByArtist(artist.id)}
      />
    </Shell>
  );
}
