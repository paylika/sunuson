"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "./db";
import {
  getSupportersOfTrack,
  getTracksByIds,
  searchArtists,
} from "./queries";
import { MAX_SUPPORT, MIN_SUPPORT, type PaymentMethod } from "./config";
import {
  checkImageFile,
  COVER_RULES,
  COVERS_BUCKET,
  extensionFor,
  PHOTO_RULES,
} from "./storage";

/**
 * Une Server Action est un point d'entrée public : tout ce qui arrive ici
 * vient du navigateur et doit être considéré comme hostile. D'où la
 * validation systématique avant toute écriture.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

/* ============================================================== soutiens */

export type SupportResult =
  | { ok: true; supportId: string }
  | { ok: false; error: string };

export async function createSupport(input: {
  artistSlug: string;
  artistId: string;
  trackId?: string;
  supporterName: string;
  amount: number;
  message?: string;
  method: PaymentMethod;
}): Promise<SupportResult> {
  const amount = Math.round(Number(input.amount));

  if (!Number.isFinite(amount) || amount < MIN_SUPPORT || amount > MAX_SUPPORT) {
    return { ok: false, error: "Montant invalide." };
  }
  if (input.method !== "wave" && input.method !== "orange_money") {
    return { ok: false, error: "Moyen de paiement inconnu." };
  }

  const admin = supabaseAdmin();

  // Prix imposé : on le revérifie ici. Le navigateur peut annoncer ce qu'il
  // veut, seule la valeur en base fait foi.
  if (input.trackId) {
    const { data: track } = await admin
      .from("tracks")
      .select("support_mode, support_amount")
      .eq("id", input.trackId)
      .maybeSingle();

    if (
      track?.support_mode === "fixe" &&
      track.support_amount &&
      amount < track.support_amount
    ) {
      return {
        ok: false,
        error: `Ce morceau est à ${track.support_amount} FCFA.`,
      };
    }
  }

  const supporterName =
    (input.supporterName || "").trim().slice(0, 28) || "Anonyme";
  const message = (input.message || "").trim().slice(0, 120) || null;

  // Le soutien naît en 'pending'. Il ne devient visible qu'une fois confirmé :
  // c'est la confirmation qui compte, pas l'intention.
  const { data, error } = await admin
    .from("supports")
    .insert({
      artist_id: input.artistId,
      track_id: input.trackId ?? null,
      supporter_name: supporterName,
      amount,
      message,
      method: input.method,
      status: "pending",
      provider_ref: `demo_${crypto.randomUUID()}`,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Insertion impossible." };
  }

  // ⚠️ DÉMO UNIQUEMENT. Aucun agrégateur n'est branché, donc on confirme
  // nous-mêmes. En production c'est le webhook — et lui seul — qui a le droit
  // de faire passer un soutien en 'paid'. Ce bloc ne s'exécute jamais hors dev.
  if (process.env.NODE_ENV !== "production") {
    await admin
      .from("supports")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", data.id);
  }

  revalidateAll(input.artistSlug);
  return { ok: true, supportId: data.id };
}

/* ================================================================ images */

/** Dépose un fichier dans le bucket public et renvoie sa clé. */
async function putImage(
  file: File,
  prefix: string,
  rules: { types: readonly string[]; maxBytes: number },
): Promise<{ ok: true; key: string } | { ok: false; error: string }> {
  const check = checkImageFile(file, rules);
  if (!check.ok) return check;

  const key = `${prefix}/${crypto.randomUUID()}.${extensionFor(file.type)}`;
  const { error } = await supabaseAdmin()
    .storage.from(COVERS_BUCKET)
    .upload(key, await file.arrayBuffer(), {
      contentType: file.type,
      // Clé unique à chaque envoi : l'ancienne image reste servie par les
      // caches et les aperçus déjà partagés sur les réseaux.
      upsert: false,
    });

  if (error) return { ok: false, error: error.message };
  return { ok: true, key };
}

/** Photo de profil ou bannière de l'artiste. */
export async function updateArtistImage(
  formData: FormData,
): Promise<ActionResult> {
  const artistId = String(formData.get("artistId") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const slug = String(formData.get("artistSlug") ?? "");
  const file = formData.get("file");

  if (kind !== "avatar" && kind !== "cover") {
    return { ok: false, error: "Type d'image inconnu." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Aucun fichier reçu." };
  }

  const put = await putImage(file, `artists/${artistId}`, PHOTO_RULES);
  if (!put.ok) return put;

  const { error } = await supabaseAdmin()
    .from("artists")
    .update({ [`${kind}_key`]: put.key })
    .eq("id", artistId);

  if (error) return { ok: false, error: error.message };

  revalidateAll(slug);
  return { ok: true };
}

/* ================================================================== sons */

/**
 * Crée la fiche d'un morceau, avec sa pochette. Le fichier audio n'est pas
 * encore envoyé : `audio_key` reste vide et le lecteur simule la lecture.
 */
export async function createTrack(formData: FormData): Promise<ActionResult> {
  const artistId = String(formData.get("artistId") ?? "");
  const artistSlug = String(formData.get("artistSlug") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 60);
  const label = String(formData.get("label") ?? "").trim().slice(0, 60);
  const locked = formData.get("locked") === "1";
  const rightsOk = formData.get("rightsOk") === "1";
  const supportMode = formData.get("supportMode") === "fixe" ? "fixe" : "libre";
  const supportAmount = Math.round(Number(formData.get("supportAmount") ?? 0));

  if (title.length < 2) return { ok: false, error: "Titre trop court." };
  if (!rightsOk) {
    return { ok: false, error: "Il faut confirmer que tu détiens les droits." };
  }
  if (supportMode === "fixe") {
    if (!Number.isFinite(supportAmount) || supportAmount < MIN_SUPPORT) {
      return {
        ok: false,
        error: `Un prix fixe doit valoir au moins ${MIN_SUPPORT} FCFA.`,
      };
    }
    if (supportAmount > MAX_SUPPORT) {
      return { ok: false, error: "Prix trop élevé." };
    }
  }

  // Les invités arrivent en JSON. Un partage de revenus se valide ici, jamais
  // sur la seule foi de l'interface.
  let guests: { artistId?: string; name: string; share: number }[] = [];
  try {
    const raw = String(formData.get("collaborators") ?? "[]");
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      guests = parsed
        .map((g) => {
          const item = g as Record<string, unknown>;
          return {
            artistId:
              typeof item.artistId === "string" ? item.artistId : undefined,
            name: String(item.name ?? "").trim().slice(0, 60),
            share: Math.round(Number(item.share ?? 0) * 100) / 100,
          };
        })
        .filter((g) => g.name.length > 0);
    }
  } catch {
    return { ok: false, error: "Liste des invités illisible." };
  }

  if (guests.some((g) => !Number.isFinite(g.share) || g.share < 0 || g.share > 100)) {
    return { ok: false, error: "Chaque part doit être comprise entre 0 et 100 %." };
  }

  const totalShare = guests.reduce((sum, g) => sum + g.share, 0);
  if (totalShare > 100) {
    return {
      ok: false,
      error: `Les parts totalisent ${totalShare} %. Il ne te resterait rien.`,
    };
  }
  if (guests.some((g) => g.artistId === artistId)) {
    return { ok: false, error: "Tu ne peux pas t'inviter sur ton propre son." };
  }

  let coverKey: string | null = null;
  const cover = formData.get("cover");
  if (cover instanceof File && cover.size > 0) {
    const put = await putImage(cover, `tracks/${artistId}`, COVER_RULES);
    if (!put.ok) return put;
    coverKey = put.key;
  }

  const admin = supabaseAdmin();

  // Le nouveau morceau passe en tête de liste.
  const { data: last } = await admin
    .from("tracks")
    .select("position")
    .eq("artist_id", artistId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: track, error } = await admin
    .from("tracks")
    .insert({
      artist_id: artistId,
      title,
      label: label || null,
      cover_key: coverKey,
      locked,
      rights_ok: true,
      duration: 0,
      support_mode: supportMode,
      support_amount: supportMode === "fixe" ? supportAmount : null,
      position: (last?.position ?? 0) + 1,
    })
    .select("id")
    .single();

  if (error || !track) {
    return { ok: false, error: error?.message ?? "Insertion impossible." };
  }

  if (guests.length > 0) {
    const { error: guestError } = await admin
      .from("track_collaborators")
      .insert(
        guests.map((g) => ({
          track_id: track.id,
          artist_id: g.artistId ?? null,
          display_name: g.name,
          share_percent: g.share,
        })),
      );

    // Le morceau existe déjà : on le retire plutôt que de le laisser publié
    // avec un partage incomplet — le désaccord sur l'argent vient après.
    if (guestError) {
      await admin.from("tracks").delete().eq("id", track.id);
      return { ok: false, error: guestError.message };
    }
  }

  revalidateAll(artistSlug);
  return { ok: true };
}

/**
 * Quelques morceaux au hasard, pour remplir une playlist vide pendant le
 * développement. Bornée à `NODE_ENV !== "production"` : en ligne, une
 * playlist vide doit le rester tant que le fan n'a rien enregistré.
 */
export async function sampleTrackIds(): Promise<string[]> {
  if (process.env.NODE_ENV === "production") return [];

  const { data } = await supabaseAdmin()
    .from("tracks")
    .select("id")
    .order("plays", { ascending: false })
    .limit(8);

  return (data ?? []).map((r) => r.id as string);
}

/** Résout la playlist du fan, dont les identifiants vivent dans son navigateur. */
export async function playlistTracks(ids: string[]) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  return getTracksByIds(ids.filter((id) => typeof id === "string"));
}

/** Noms des fans ayant soutenu un morceau, pour l'écran de lecture. */
export async function trackSupporters(
  trackId: string,
): Promise<{ name: string; createdAt: string }[]> {
  if (!trackId) return [];
  return getSupportersOfTrack(trackId);
}

/** Alimente le champ « @ » du featuring. */
export async function findArtists(
  query: string,
  excludeId?: string,
): Promise<{ id: string; slug: string; name: string; avatarUrl?: string; gradient: [string, string] }[]> {
  const results = await searchArtists(query, excludeId);
  return results.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    avatarUrl: a.avatarUrl,
    gradient: a.gradient,
  }));
}

/* ============================================================== retraits */

/** Enregistre une demande de retrait. Le virement se fait à la main. */
export async function requestPayout(
  artistId: string,
  amount: number,
): Promise<ActionResult> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Montant invalide." };
  }

  const { error } = await supabaseAdmin()
    .from("payouts")
    .insert({ artist_id: artistId, amount: Math.round(amount) });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

/* ---------------------------------------------------------------------- */

/** Les montants apparaissent sur les quatre écrans : tout se rafraîchit. */
function revalidateAll(artistSlug?: string) {
  if (artistSlug) revalidatePath(`/a/${artistSlug}`);
  revalidatePath("/");
  revalidatePath("/decouvrir");
  revalidatePath("/dashboard");
}
