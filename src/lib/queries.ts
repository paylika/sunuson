import "server-only";
import { supabase as client } from "./db";
import { AUDIO_BUCKET, COVERS_BUCKET } from "./storage";
import type { Artist, Clip, Collaborator, Support, Track } from "./types";
import type { PaymentMethod } from "./config";
import { CONTEXTE_VIDE, type Candidat, type Contexte } from "./reco";

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
export function imageUrl(key: string | null | undefined): string | undefined {
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
  release_type?: string | null;
  release_title?: string | null;
  release_id?: string | null;
  styles?: string[] | null;
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
};

const TRACK_COLS =
  "id, artist_id, title, duration, plays, released_at, audio_key, cover_key, label, locked, support_mode, support_amount";

// Les colonnes de projet arrivent par la migration 006. Les demander avant
// qu'elle soit jouée ferait échouer toute lecture de morceau — donc les pages
// d'artistes et la playlist. On les demande à part, avec repli.
const TRACK_COLS_PROJET = `${TRACK_COLS}, release_type, release_title, release_id, styles`;

/**
 * La base ne stocke que la clé ; l'URL publique se compose ici.
 *
 * AUDIO_BASE_URL n'est renseignée que le jour où les fichiers passeront sur
 * Cloudflare R2, pour l'egress gratuit. Tant qu'elle est vide on sert depuis
 * Supabase Storage — auparavant on ne servait rien du tout, et tout morceau
 * déposé restait muet.
 */
function audioUrl(key: string | null): string | undefined {
  if (!key) return undefined;

  const cdn = process.env.AUDIO_BASE_URL || process.env.NEXT_PUBLIC_AUDIO_BASE_URL;
  if (cdn) return `${cdn.replace(/\/$/, "")}/${key}`;

  const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return undefined;
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${AUDIO_BUCKET}/${key}`;
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
    releaseType:
      (r.release_type as Track["releaseType"] | undefined) ?? "single",
    releaseTitle: r.release_title ?? undefined,
    releaseId: r.release_id ?? undefined,
    styles: r.styles ?? [],
    collaborators: [],
  };
}

type CollabRow = {
  id: string;
  track_id: string;
  artist_id: string | null;
  display_name: string;
  share_percent: number;
  artists: {
    slug: string;
    avatar_key: string | null;
    gradient_from: string;
    gradient_to: string;
  } | null;
};

/**
 * Charge les invités de plusieurs morceaux d'un coup. Une requête par morceau
 * ferait exploser le nombre d'allers-retours sur une page qui en liste vingt.
 */
async function collaboratorsFor(
  trackIds: string[],
): Promise<Map<string, Collaborator[]>> {
  const byTrack = new Map<string, Collaborator[]>();
  if (trackIds.length === 0) return byTrack;

  const res = await client()
    .from("track_collaborators")
    .select(
      "id, track_id, artist_id, display_name, share_percent, artists(slug, avatar_key, gradient_from, gradient_to)",
    )
    .in("track_id", trackIds)
    .returns<CollabRow[]>();

  // Le featuring est une donnée d'appoint : s'il manque, un morceau perd sa
  // mention « feat. », il ne disparaît pas. Faire tomber toute la page pour
  // ça — typiquement quand la migration n'a pas encore été jouée — serait
  // disproportionné. Les autres lectures restent strictes.
  if (res.error) {
    console.warn(`Featuring indisponible : ${res.error.message}`);
    return byTrack;
  }

  for (const r of res.data ?? []) {
    const entry: Collaborator = {
      id: r.id,
      artistId: r.artist_id ?? undefined,
      slug: r.artists?.slug,
      name: r.display_name,
      avatarUrl: imageUrl(r.artists?.avatar_key),
      gradient: r.artists
        ? [r.artists.gradient_from, r.artists.gradient_to]
        : undefined,
      share: Number(r.share_percent),
    };
    const list = byTrack.get(r.track_id);
    if (list) list.push(entry);
    else byTrack.set(r.track_id, [entry]);
  }
  return byTrack;
}

type SupportRow = {
  id: string;
  artist_id: string;
  track_id: string | null;
  user_id?: string | null;
  supporter_name: string;
  amount: number;
  message: string | null;
  method: string;
  created_at: string;
};

const SUPPORT_COLS =
  "id, artist_id, track_id, supporter_name, amount, message, method, created_at";

// `user_id` arrive par la migration 005. Tant qu'elle n'est pas jouée, la
// demander ferait échouer TOUTES les lectures de soutiens — donc les murs de
// soutiens et l'atelier. On la demande à part, avec repli.
const SUPPORT_COLS_COMPTE = `${SUPPORT_COLS}, user_id`;

function toSupport(r: SupportRow): Support {
  return {
    id: r.id,
    artistId: r.artist_id,
    trackId: r.track_id ?? undefined,
    userId: r.user_id ?? undefined,
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

/**
 * La page d'artiste rattachée à un compte, ou null.
 *
 * C'est cette requête qui définit ce qu'est « être artiste » ici : posséder
 * une ligne dans `artists`. Il n'y a pas de type de compte déclaré à
 * l'inscription — on le devient en créant sa page, et on reste fan par
 * ailleurs.
 */
export async function getArtistByUser(userId: string): Promise<Artist | null> {
  const supabase = client();
  const row = unwrap(
    await supabase
      .from("artists")
      .select(ARTIST_COLS)
      .eq("user_id", userId)
      .maybeSingle<ArtistRow>(),
  );
  return row ? toArtist(row) : null;
}

/**
 * Le moyen de retrait d'un artiste. **Jamais dans le type `Artist`.**
 *
 * `Artist` part dans le navigateur de chaque visiteur sur toutes les pages
 * publiques. Y glisser le numéro de retrait afficherait le téléphone de chaque
 * rappeur à qui veut lire le HTML — précisément ce que le produit existe pour
 * éviter. Cette lecture-ci est réservée à l'écran de paramètres, et filtrée
 * sur le compte propriétaire.
 */
export async function getPayoutSettings(
  artistId: string,
  userId: string,
): Promise<{ method: PaymentMethod; number: string } | null> {
  const supabase = client();
  const row = unwrap(
    await supabase
      .from("artists")
      .select("payout_method, payout_number")
      .eq("id", artistId)
      .eq("user_id", userId)
      .maybeSingle<{ payout_method: string; payout_number: string | null }>(),
  );

  if (!row) return null;
  return {
    method: (row.payout_method as PaymentMethod) ?? "wave",
    number: row.payout_number ?? "",
  };
}

/* -------------------------------------------------------------------- sons */

export async function getTracksByArtist(artistId: string): Promise<Track[]> {
  const requete = (colonnes: string) =>
    client()
      .from("tracks")
      .select(colonnes)
      .eq("artist_id", artistId)
      .order("position")
      .returns<TrackRow[]>();

  // Avec les colonnes de projet si la migration 006 est passée, sans elles
  // sinon : la page d'un artiste doit s'afficher dans tous les cas.
  let res = await requete(TRACK_COLS_PROJET);
  if (res.error) res = await requete(TRACK_COLS);

  const tracks = unwrap(res).map(toTrack);
  const collabs = await collaboratorsFor(tracks.map((t) => t.id));
  for (const t of tracks) t.collaborators = collabs.get(t.id) ?? [];
  return tracks;
}

/**
 * Recherche d'artistes pour le champ « @ » du featuring.
 * `ilike` suffit à cette échelle ; passer à une recherche plein texte le jour
 * où le catalogue dépassera quelques milliers de profils.
 */
export async function searchArtists(
  query: string,
  excludeId?: string,
): Promise<Artist[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  let request = client()
    .from("artists")
    .select(ARTIST_COLS)
    .ilike("name", `%${q}%`)
    .limit(6);

  if (excludeId) request = request.neq("id", excludeId);

  return unwrap(await request.returns<ArtistRow[]>()).map(toArtist);
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
  const requete = (colonnes: string) =>
    client()
      .from("supports")
      .select(colonnes)
      .eq("artist_id", artistId)
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .returns<SupportRow[]>();

  // Avec le compte si la migration 005 est passée, sans lui sinon : un artiste
  // doit voir ses soutiens dans tous les cas, quitte à ne pas savoir lesquels
  // viennent d'un compte.
  let res = await requete(SUPPORT_COLS_COMPTE);
  if (res.error) res = await requete(SUPPORT_COLS);

  return unwrap(res).map(toSupport);
}

/**
 * Résout une liste d'identifiants en morceaux, chacun avec son artiste.
 * Sert la playlist, dont les identifiants vivent dans le navigateur du fan.
 */
export async function getTracksByIds(
  ids: string[],
): Promise<{ track: Track; artist: Artist }[]> {
  if (ids.length === 0) return [];

  const supabase = client();

  const parIds = (colonnes: string) =>
    supabase
      .from("tracks")
      .select(colonnes)
      .in("id", ids.slice(0, 200))
      .returns<TrackRow[]>();

  let resTracks = await parIds(TRACK_COLS_PROJET);
  if (resTracks.error) resTracks = await parIds(TRACK_COLS);

  const rows = unwrap(resTracks);
  if (rows.length === 0) return [];

  const artistRows = unwrap(
    await supabase
      .from("artists")
      .select(ARTIST_COLS)
      .in("id", [...new Set(rows.map((r) => r.artist_id))])
      .returns<ArtistRow[]>(),
  );

  const artists = new Map(artistRows.map((a) => [a.id, toArtist(a)]));
  const tracks = rows.map(toTrack);

  const collabs = await collaboratorsFor(tracks.map((t) => t.id));
  for (const t of tracks) t.collaborators = collabs.get(t.id) ?? [];

  // On respecte l'ordre d'ajout du fan, pas celui que renvoie la base.
  const byId = new Map(tracks.map((t) => [t.id, t]));
  return ids
    .map((id) => byId.get(id))
    .filter((t): t is Track => !!t)
    .map((track) => ({ track, artist: artists.get(track.artistId)! }))
    .filter((x) => !!x.artist);
}

/**
 * Qui a soutenu CE morceau. Sans montant : la liste sert de preuve sociale,
 * comme des « j'aime » — voir des noms pousse à en ajouter un.
 */
export type TrackSupporter = {
  name: string;
  createdAt: string;
  /** Seconde du morceau où le soutien a été envoyé. Absente si inconnue. */
  positionSec?: number;
};

export async function getSupportersOfTrack(
  trackId: string,
): Promise<TrackSupporter[]> {
  const supabase = client();
  const base = "supporter_name, created_at";

  type Row = {
    supporter_name: string;
    created_at: string;
    position_sec?: number | null;
  };

  const query = (cols: string) =>
    supabase
      .from("supports")
      .select(cols)
      .eq("track_id", trackId)
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .limit(60)
      .returns<Row[]>();

  // On demande la position, et on retombe sur la requête sans elle si la
  // colonne n'existe pas encore. Le repère sur l'onde disparaît alors, mais
  // la liste des soutiens reste — une migration en retard ne doit pas vider
  // l'écran de lecture.
  let res = await query(`${base}, position_sec`);
  if (res.error) res = await query(base);
  const rows = unwrap(res);

  // Un même fan qui soutient trois fois n'apparaît qu'une fois.
  const seen = new Set<string>();
  const out: TrackSupporter[] = [];
  for (const r of rows) {
    const key = r.supporter_name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      name: r.supporter_name,
      createdAt: new Date(r.created_at).toISOString(),
      positionSec: r.position_sec ?? undefined,
    });
  }
  return out;
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

/* ------------------------------------------------------- soutiens du fan */

export type SoutienDuFan = Support & {
  artistName: string;
  artistSlug: string;
  artistGradient: [string, string];
  artistAvatarUrl?: string;
  /** En attente de confirmation du paiement. */
  enAttente: boolean;
};

type SoutienRow = SupportRow & {
  status: string;
  artists: {
    name: string;
    slug: string;
    gradient_from: string;
    gradient_to: string;
    avatar_key: string | null;
  } | null;
};

/**
 * Ce qu'un fan a soutenu.
 *
 * Les soutiens en attente sont inclus : un paiement en cours qui disparaîtrait
 * de l'historique donnerait l'impression que l'argent s'est perdu. Ils sont
 * marqués comme tels plutôt que masqués.
 */
export async function getSupportsByUser(
  userId: string,
): Promise<SoutienDuFan[]> {
  const res = await client()
    .from("supports")
    .select(
      `${SUPPORT_COLS_COMPTE}, status, artists(name, slug, gradient_from, gradient_to, avatar_key)`,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<SoutienRow[]>();

  // La colonne user_id vient d'une migration : tant qu'elle n'est pas jouée,
  // un fan voit un historique vide plutôt qu'une page en erreur.
  if (res.error) {
    console.warn(`Historique des soutiens indisponible : ${res.error.message}`);
    return [];
  }

  return (res.data ?? []).map((r) => ({
    ...toSupport(r),
    artistName: r.artists?.name ?? "Artiste",
    artistSlug: r.artists?.slug ?? "",
    artistGradient: [
      r.artists?.gradient_from ?? "#2a2d34",
      r.artists?.gradient_to ?? "#141619",
    ],
    artistAvatarUrl: imageUrl(r.artists?.avatar_key),
    enAttente: r.status !== "paid",
  }));
}

/* ---------------------------------------------------------- suggestions */

/**
 * Des morceaux d'AUTRES artistes, pour la bande de découverte.
 *
 * Un fan arrive par le lien d'un rappeur et repart aussitôt : c'est le
 * schéma normal ici, mais c'est aussi une occasion perdue. Une bande de
 * pochettes en bas de page transforme une visite d'un artiste en découverte
 * de trois.
 *
 * Les morceaux verrouillés sont écartés : proposer un inédit à quelqu'un qui
 * découvre la plateforme, c'est lui montrer une porte fermée en guise
 * d'accueil.
 */
export async function getSuggestions(
  excludeArtistId: string,
  limite = 12,
  /** Foy Tewal de l'artiste écouté : on remonte ses voisins d'abord. */
  region?: string,
): Promise<{ track: Track; artist: Artist }[]> {
  const supabase = client();

  const requete = (colonnes: string) =>
    supabase
      .from("tracks")
      .select(colonnes)
      .neq("artist_id", excludeArtistId)
      .eq("locked", false)
      .order("plays", { ascending: false })
      .limit(limite)
      .returns<TrackRow[]>();

  let res = await requete(TRACK_COLS_PROJET);
  if (res.error) res = await requete(TRACK_COLS);
  if (res.error) return [];

  const rows = res.data ?? [];
  if (rows.length === 0) return [];

  const artistRows = unwrap(
    await supabase
      .from("artists")
      .select(ARTIST_COLS)
      .in("id", [...new Set(rows.map((r) => r.artist_id))])
      .returns<ArtistRow[]>(),
  );

  const parId = new Map(artistRows.map((a) => [a.id, toArtist(a)]));

  const items = rows
    .map((r) => {
      const artist = parId.get(r.artist_id);
      return artist ? { track: toTrack(r), artist } : null;
    })
    .filter((x): x is { track: Track; artist: Artist } => x !== null);

  // Il n'existe pas de genre en base, et en inventer un obligerait chaque
  // artiste à se ranger dans une case au moment de l'inscription. Le Foy
  // Tewal en tient lieu : à Dakar, les scènes sont d'abord des quartiers, et
  // quelqu'un qui écoute un rappeur de Pikine a plus de chances d'aimer un
  // autre rappeur de Pikine qu'un artiste pris au hasard.
  if (!region) return items;

  return [
    ...items.filter((i) => i.artist.city === region),
    ...items.filter((i) => i.artist.city !== region),
  ];
}

/* -------------------------------------------------------- recommandation */

/**
 * Tout ce qu'il faut pour classer : les morceaux écoutables, leurs artistes,
 * et le nombre de soutiens reçus par chacun.
 *
 * Les morceaux verrouillés sont écartés : proposer une porte fermée à
 * quelqu'un qui découvre est le plus sûr moyen de le faire partir.
 */
export async function getCandidats(): Promise<Candidat[]> {
  const supabase = client();

  const requete = (colonnes: string) =>
    supabase
      .from("tracks")
      .select(colonnes)
      .eq("locked", false)
      .order("released_at", { ascending: false })
      .limit(200)
      .returns<TrackRow[]>();

  let res = await requete(TRACK_COLS_PROJET);
  if (res.error) res = await requete(TRACK_COLS);
  if (res.error) return [];

  const rows = res.data ?? [];
  if (rows.length === 0) return [];

  const [artistRows, balances, collabs] = await Promise.all([
    supabase
      .from("artists")
      .select(ARTIST_COLS)
      .in("id", [...new Set(rows.map((r) => r.artist_id))])
      .returns<ArtistRow[]>()
      .then((r) => r.data ?? []),
    getBalances(),
    collaboratorsFor(rows.map((r) => r.id)),
  ]);

  const parId = new Map(artistRows.map((a) => [a.id, toArtist(a)]));

  return rows
    .map((r) => {
      const artist = parId.get(r.artist_id);
      if (!artist) return null;

      const track = toTrack(r);
      track.collaborators = collabs.get(r.id) ?? [];

      return {
        track,
        artist,
        soutiens: balances.get(artist.id)?.supportCount ?? 0,
      };
    })
    .filter((c): c is Candidat => c !== null);
}

/**
 * Ce que la plateforme sait d'un fan connecté — uniquement par ses soutiens.
 *
 * Ses écoutes ne comptent pas, et c'est délibéré : elles sont anonymes, donc
 * elles ne rattachent rien à personne. Le soutien, lui, est un geste public et
 * volontaire ; s'en servir ne trahit aucune promesse.
 *
 * Un visiteur sans compte reçoit un contexte vide, et l'algorithme se rabat
 * alors sur la fraîcheur et la preuve sociale.
 */
export async function getContexte(userId?: string): Promise<Contexte> {
  if (!userId) return CONTEXTE_VIDE;

  const res = await client()
    .from("supports")
    .select("artist_id")
    .eq("user_id", userId)
    .eq("status", "paid")
    .limit(200)
    .returns<{ artist_id: string }[]>();

  // La colonne vient de la migration 005 : sans elle, pas de personnalisation,
  // mais surtout pas de page en erreur.
  if (res.error || !res.data || res.data.length === 0) return CONTEXTE_VIDE;

  const artistesSoutenus = [...new Set(res.data.map((r) => r.artist_id))];

  const [artistRows, trackRows] = await Promise.all([
    client()
      .from("artists")
      .select("city")
      .in("id", artistesSoutenus)
      .returns<{ city: string }[]>()
      .then((r) => r.data ?? []),
    client()
      .from("tracks")
      .select("styles")
      .in("artist_id", artistesSoutenus)
      .returns<{ styles: string[] | null }[]>()
      .then((r) => r.data ?? []),
  ]);

  return {
    artistesSoutenus,
    regions: [...new Set(artistRows.map((a) => a.city).filter(Boolean))],
    stylesAimes: [
      ...new Set(trackRows.flatMap((t) => t.styles ?? [])),
    ],
  };
}
