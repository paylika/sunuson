import "server-only";
import { db } from "./db";
import type { Artist, Clip, Support, Track } from "./types";
import type { PaymentMethod } from "./config";

/**
 * Toutes les lectures de la base passent par ici, et uniquement depuis le
 * serveur. Signature identique aux sélecteurs de src/lib/data.ts : les
 * composants ne connaissent que les types, jamais la provenance des données.
 *
 * Changer de base un jour (Postgres, Turso…) revient à réécrire ce fichier
 * et db.ts. Rien d'autre ne bouge.
 */

/* ------------------------------------------------------------- conversions */

/** SQLite ne connaît pas les booléens : ils reviennent en 0 / 1. */
const bool = (v: number | boolean) => v === 1 || v === true;

type ArtistRow = {
  id: string;
  slug: string;
  name: string;
  city: string;
  bio: string;
  gradient_from: string;
  gradient_to: string;
  verified: number;
  monthly_listeners: number;
};

const ARTIST_COLS =
  "id, slug, name, city, bio, gradient_from, gradient_to, verified, monthly_listeners";

function toArtist(r: ArtistRow): Artist {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    city: r.city,
    bio: r.bio,
    gradient: [r.gradient_from, r.gradient_to],
    verified: bool(r.verified),
    monthlyListeners: r.monthly_listeners,
  };
}

type TrackRow = {
  id: string;
  artist_id: string;
  title: string;
  duration: number;
  plays: number;
  released_at: string;
  audio_key: string | null;
  locked: number;
  featuring: string | null;
};

const TRACK_COLS =
  "id, artist_id, title, duration, plays, released_at, audio_key, locked, featuring";

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
    releasedAt: r.released_at.slice(0, 10),
    audioUrl: audioUrl(r.audio_key),
    locked: bool(r.locked),
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
  created_at: string;
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
  const { results } = await (await db())
    .prepare(
      `select ${ARTIST_COLS} from artists order by monthly_listeners desc`,
    )
    .all<ArtistRow>();
  return results.map(toArtist);
}

export async function getArtistBySlug(slug: string): Promise<Artist | null> {
  const row = await (await db())
    .prepare(`select ${ARTIST_COLS} from artists where slug = ?1`)
    .bind(slug)
    .first<ArtistRow>();
  return row ? toArtist(row) : null;
}

/* -------------------------------------------------------------------- sons */

export async function getTracksByArtist(artistId: string): Promise<Track[]> {
  const { results } = await (await db())
    .prepare(
      `select ${TRACK_COLS} from tracks where artist_id = ?1
       order by position, created_at`,
    )
    .bind(artistId)
    .all<TrackRow>();
  return results.map(toTrack);
}

/* ------------------------------------------------------------------- clips */

type ClipRow = {
  id: string;
  artist_id: string;
  title: string;
  youtube_id: string;
  views: number;
};

export async function getClipsByArtist(artistId: string): Promise<Clip[]> {
  const { results } = await (await db())
    .prepare(
      `select id, artist_id, title, youtube_id, views from clips
       where artist_id = ?1 order by created_at`,
    )
    .bind(artistId)
    .all<ClipRow>();
  return results.map((r) => ({
    id: r.id,
    artistId: r.artist_id,
    title: r.title,
    youtubeId: r.youtube_id,
    views: r.views,
  }));
}

/* ---------------------------------------------------------------- soutiens */

/** Seuls les soutiens confirmés sont visibles : un 'pending' n'existe pas. */
export async function getSupportsByArtist(artistId: string): Promise<Support[]> {
  const { results } = await (await db())
    .prepare(
      `select id, artist_id, track_id, supporter_name, amount, message,
              method, created_at
       from supports
       where artist_id = ?1 and status = 'paid'
       order by created_at desc`,
    )
    .bind(artistId)
    .all<SupportRow>();
  return results.map(toSupport);
}

/* ------------------------------------------------------------------ soldes */

export type Balance = {
  artistId: string;
  gross: number;
  net: number;
  available: number;
  supportCount: number;
};

type BalanceRow = {
  artist_id: string;
  gross: number;
  net: number;
  available: number;
  support_count: number;
};

const toBalance = (r: BalanceRow): Balance => ({
  artistId: r.artist_id,
  gross: r.gross,
  net: r.net,
  available: r.available,
  supportCount: r.support_count,
});

export async function getBalances(): Promise<Map<string, Balance>> {
  const { results } = await (await db())
    .prepare("select * from artist_balances")
    .all<BalanceRow>();
  return new Map(results.map((r) => [r.artist_id, toBalance(r)]));
}

export async function getBalance(artistId: string): Promise<Balance> {
  const row = await (await db())
    .prepare("select * from artist_balances where artist_id = ?1")
    .bind(artistId)
    .first<BalanceRow>();
  return (
    (row && toBalance(row)) ?? {
      artistId,
      gross: 0,
      net: 0,
      available: 0,
      supportCount: 0,
    }
  );
}
