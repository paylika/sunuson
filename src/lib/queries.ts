import "server-only";
import { supabase as client } from "./db";
import { COVERS_BUCKET } from "./storage";
import type { Artist, Clip, Support, Track } from "./types";
import type { PaymentMethod } from "./config";

/**
 * Toutes les lectures de la base passent par ici, et uniquement depuis le
 * serveur. Signature identique aux sélecteurs de src/lib/data.ts : les
 * composants ne connaissent que les types, jamais la provenance des données.
 *
 * Changer de base un jour revient à réécrire ce fichier et db.ts. Rien
 * d'autre ne bouge — c'est ce qui a rendu les allers-retours indolores.
 */

/* ------------------------------------------------------------- conversions */

/**
 * La base ne stocke que la clé de l'objet ; l'URL publique se compose ici.
 * Le jour où les images passent sur un autre CDN, seule cette fonction bouge.
 */
function imageUrl(key: string | null | undefined): string | undefined {
  if (!key) return undefined;
  const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return undefined;
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${COVERS_BUCKET}/${key}`;
}

type ArtistRow = {
  id: string;
  slug: string;
  name: string;
  city: string;
  bio: string;
  label: string | null;
  gradient_from: string;
  gradient_to: string;
  avatar_key: string | null;
  cover_key: string | null;
  verified: boolean;
  monthly_listeners: number;
};

const ARTIST_COLS =
  "id, slug, name, city, bio, label, gradient_from, gradient_to, avatar_key, cover_key, verified, monthly_listeners";

function toArtist(r: ArtistRow): Artist {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    city: r.city,
    bio: r.bio,
    label: r.label ?? undefined,
    gradient: [r.gradient_from, r.gradient_to],
    avatarUrl: imageUrl(r.avatar_key),
    coverUrl: imageUrl(r.cover_key),
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
  released_at: string;
  audio_key: string | null;
  cover_key: string | null;
  label: string | null;
  locked: boolean;
  support_mode: string;
  support_amount: number | null;
  featuring: string | null;
};

const TRACK_COLS =
  "id, artist_id, title, duration, plays, released_at, audio_key, cover_key, label, locked, support_mode, support_amount, featuring";

/** La base ne stocke que la clé ; l'URL publique se compose ici. */
function audioUrl(key: string | null): string | undefined {
  const base =
    process.env.AUDIO_BASE_URL || process.env.NEXT_PUBLIC_AUDIO_BASE_URL;
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
    coverUrl: imageUrl(r.cover_key),
    label: r.label ?? undefined,
    locked: r.locked,
    supportMode: r.support_mode === "fixe" ? "fixe" : "libre",
    supportAmount: r.support_amount ?? undefined,
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

const SUPPORT_COLS =
  "id, artist_id, track_id, supporter_name, amount, message, method, created_at";

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

/** Une requête ratée doit remonter, pas se transformer en page vide. */
function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  return res.data as T;
}

/* ---------------------------------------------------------------- artistes */

export async function getArtists(): Promise<Artist[]> {
  const supabase = client();
  const rows = unwrap(
    await supabase
      .from("artists")
      .select(ARTIST_COLS)
      .order("monthly_listeners", { ascending: false })
      .returns<ArtistRow[]>(),
  );
  return rows.map(toArtist);
}

export async function getArtistBySlug(slug: string): Promise<Artist | null> {
  const supabase = client();
  const row = unwrap(
    await supabase
      .from("artists")
      .select(ARTIST_COLS)
      .eq("slug", slug)
      .maybeSingle<ArtistRow>(),
  );
  return row ? toArtist(row) : null;
}

/* -------------------------------------------------------------------- sons */

export async function getTracksByArtist(artistId: string): Promise<Track[]> {
  const supabase = client();
  const rows = unwrap(
    await supabase
      .from("tracks")
      .select(TRACK_COLS)
      .eq("artist_id", artistId)
      .order("position")
      .returns<TrackRow[]>(),
  );
  return rows.map(toTrack);
}

/**
 * Titres de tous les morceaux, groupés par artiste. Sert uniquement à la
 * recherche : elle se fait côté client sur un index léger, sans aller-retour
 * réseau à chaque frappe. À remplacer par une recherche plein texte en base
 * le jour où le catalogue dépassera quelques centaines de titres.
 */
export async function getTrackTitles(): Promise<Map<string, string[]>> {
  const supabase = client();
  const rows = unwrap(
    await supabase
      .from("tracks")
      .select("artist_id, title")
      .returns<{ artist_id: string; title: string }[]>(),
  );

  const byArtist = new Map<string, string[]>();
  for (const r of rows) {
    const list = byArtist.get(r.artist_id);
    if (list) list.push(r.title);
    else byArtist.set(r.artist_id, [r.title]);
  }
  return byArtist;
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
  const supabase = client();
  const rows = unwrap(
    await supabase
      .from("clips")
      .select("id, artist_id, title, youtube_id, views")
      .eq("artist_id", artistId)
      .order("created_at")
      .returns<ClipRow[]>(),
  );
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
export async function getSupportsByArtist(artistId: string): Promise<Support[]> {
  const supabase = client();
  const rows = unwrap(
    await supabase
      .from("supports")
      .select(SUPPORT_COLS)
      .eq("artist_id", artistId)
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .returns<SupportRow[]>(),
  );
  return rows.map(toSupport);
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
  const supabase = client();
  const rows = unwrap(
    await supabase.from("artist_balances").select("*").returns<BalanceRow[]>(),
  );
  return new Map(rows.map((r) => [r.artist_id, toBalance(r)]));
}

export async function getBalance(artistId: string): Promise<Balance> {
  const supabase = client();
  const row = unwrap(
    await supabase
      .from("artist_balances")
      .select("*")
      .eq("artist_id", artistId)
      .maybeSingle<BalanceRow>(),
  );
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
