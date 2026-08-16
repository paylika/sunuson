import "server-only";
import { sql } from "./db";
import type { Artist, Clip, Support, Track } from "./types";
import type { PaymentMethod } from "./config";

/**
 * Toutes les lectures de la base passent par ici, et uniquement depuis le
 * serveur. Ces fonctions remplacent les sélecteurs de src/lib/data.ts : la
 * signature est identique, les composants n'ont pas à changer.
 */

/* ------------------------------------------------------------- conversions */

type ArtistRow = {
  id: string;
  slug: string;
  name: string;
  city: string;
  bio: string;
  gradient_from: string;
  gradient_to: string;
  verified: boolean;
  monthly_listeners: number;
};

function toArtist(r: ArtistRow): Artist {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    city: r.city,
    bio: r.bio,
    gradient: [r.gradient_from, r.gradient_to],
    verified: r.verified,
    monthlyListeners: r.monthly_listeners,
  };
}

type TrackRow = {
  id: string;
  artist_id: string;
  title: string;
  duration: number;
  plays: number;
  released_at: string | Date;
  audio_key: string | null;
  locked: boolean;
  featuring: string | null;
};

/** La base ne stocke que la clé R2 ; l'URL publique se compose ici. */
function audioUrl(key: string | null): string | undefined {
  const base = process.env.NEXT_PUBLIC_AUDIO_BASE_URL;
  if (!key || !base) return undefined;
  return `${base.replace(/\/$/, "")}/${key}`;
}

function toTrack(r: TrackRow): Track {
  return {
    id: r.id,
    artistId: r.artist_id,
    title: r.title,
    duration: r.duration,
    plays: r.plays,
    releasedAt: String(r.released_at).slice(0, 10),
    audioUrl: audioUrl(r.audio_key),
    locked: r.locked,
    featuring: r.featuring ?? undefined,
  };
}

type SupportRow = {
  id: string;
  artist_id: string;
  track_id: string | null;
  supporter_name: string;
  amount: number;
  message: string | null;
  method: string;
  created_at: string | Date;
};

function toSupport(r: SupportRow): Support {
  return {
    id: r.id,
    artistId: r.artist_id,
    trackId: r.track_id ?? undefined,
    supporterName: r.supporter_name,
    amount: r.amount,
    message: r.message ?? undefined,
    method: r.method as PaymentMethod,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

/* ---------------------------------------------------------------- artistes */

export async function getArtists(): Promise<Artist[]> {
  const rows = (await sql`
    select id, slug, name, city, bio, gradient_from, gradient_to,
           verified, monthly_listeners
    from artists
    order by monthly_listeners desc
  `) as ArtistRow[];
  return rows.map(toArtist);
}

export async function getArtistBySlug(slug: string): Promise<Artist | null> {
  const rows = (await sql`
    select id, slug, name, city, bio, gradient_from, gradient_to,
           verified, monthly_listeners
    from artists
    where slug = ${slug}
    limit 1
  `) as ArtistRow[];
  return rows[0] ? toArtist(rows[0]) : null;
}

/* -------------------------------------------------------------------- sons */

export async function getTracksByArtist(artistId: string): Promise<Track[]> {
  const rows = (await sql`
    select id, artist_id, title, duration, plays, released_at,
           audio_key, locked, featuring
    from tracks
    where artist_id = ${artistId}
    order by position, created_at
  `) as TrackRow[];
  return rows.map(toTrack);
}

/* ------------------------------------------------------------------- clips */

export async function getClipsByArtist(artistId: string): Promise<Clip[]> {
  const rows = (await sql`
    select id, artist_id, title, youtube_id, views
    from clips
    where artist_id = ${artistId}
    order by created_at
  `) as { id: string; artist_id: string; title: string; youtube_id: string; views: number }[];
  return rows.map((r) => ({
    id: r.id,
    artistId: r.artist_id,
    title: r.title,
    youtubeId: r.youtube_id,
    views: r.views,
  }));
}

/* ---------------------------------------------------------------- soutiens */

/** Seuls les soutiens confirmés sont visibles : un 'pending' n'existe pas. */
export async function getSupportsByArtist(
  artistId: string,
): Promise<Support[]> {
  const rows = (await sql`
    select id, artist_id, track_id, supporter_name, amount, message,
           method, created_at
    from supports
    where artist_id = ${artistId} and status = 'paid'
    order by created_at desc
  `) as SupportRow[];
  return rows.map(toSupport);
}

export type Balance = {
  artistId: string;
  gross: number;
  net: number;
  available: number;
  supportCount: number;
};

export async function getBalances(): Promise<Map<string, Balance>> {
  const rows = (await sql`
    select artist_id, gross, net, available, support_count
    from artist_balances
  `) as {
    artist_id: string;
    gross: number;
    net: number;
    available: number;
    support_count: number;
  }[];

  return new Map(
    rows.map((r) => [
      r.artist_id,
      {
        artistId: r.artist_id,
        gross: r.gross,
        net: r.net,
        available: r.available,
        supportCount: r.support_count,
      },
    ]),
  );
}

export async function getBalance(artistId: string): Promise<Balance> {
  const rows = (await sql`
    select artist_id, gross, net, available, support_count
    from artist_balances
    where artist_id = ${artistId}
  `) as {
    artist_id: string;
    gross: number;
    net: number;
    available: number;
    support_count: number;
  }[];

  const r = rows[0];
  return {
    artistId,
    gross: r?.gross ?? 0,
    net: r?.net ?? 0,
    available: r?.available ?? 0,
    supportCount: r?.support_count ?? 0,
  };
}
