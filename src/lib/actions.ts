"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "./db";
import { currentUser, supabaseSession } from "./auth";
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
  /** Seconde du morceau au moment de l'envoi, pour l'épingler sur l'onde. */
  positionSec?: number;
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

  // Le compte, s'il y en a un. Un soutien anonyme reste parfaitement valable :
  // exiger une inscription avant de laisser envoyer 1 000 FCFA ferait perdre
  // l'essentiel des soutiens.
  const user = await currentUser().catch(() => null);

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
      user_id: user?.id ?? null,
      provider_ref: `demo_${crypto.randomUUID()}`,
      position_sec:
        input.trackId && Number.isFinite(input.positionSec)
          ? Math.max(0, Math.round(input.positionSec as number))
          : null,
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

/** Texte du profil : bio, ville, label. */
export async function updateArtistProfile(input: {
  artistId: string;
  artistSlug: string;
  bio: string;
  city: string;
  label: string;
}): Promise<ActionResult> {
  const bio = (input.bio || "").trim().slice(0, 300);
  const city = (input.city || "").trim().slice(0, 60);
  const label = (input.label || "").trim().slice(0, 60);

  const { error } = await supabaseAdmin()
    .from("artists")
    .update({ bio, city, label: label || null })
    .eq("id", input.artistId);

  if (error) return { ok: false, error: error.message };

  revalidateAll(input.artistSlug);
  return { ok: true };
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

/** Fans ayant soutenu un morceau, avec l'instant où ils l'ont fait. */
export async function trackSupporters(trackId: string) {
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

/* ================================================================ compte */

/**
 * Transforme un compte en compte d'artiste.
 *
 * Il n'y a pas de « type de compte » choisi à l'inscription : tout le monde
 * crée le même compte, et devient artiste en créant sa page. Un artiste reste
 * donc un fan — il peut soutenir les autres et garder sa playlist. Demander
 * « fan ou artiste ? » à quelqu'un qui n'a pas encore vu le produit ferait
 * perdre ceux qui hésitent, pour une question qu'on peut poser plus tard.
 */
export async function createArtistProfile(input: {
  name: string;
  city: string;
}): Promise<ActionResult & { slug?: string }> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Connecte-toi d'abord." };

  const name = (input.name || "").trim().slice(0, 60);
  const city = (input.city || "").trim().slice(0, 60);

  if (name.length < 2) {
    return { ok: false, error: "Ton nom d'artiste fait au moins 2 lettres." };
  }

  const admin = supabaseAdmin();

  // Un compte, une page. Sans ce garde-fou, un double clic sur le bouton
  // créerait deux artistes et l'un des deux deviendrait inatteignable.
  const existant = unwrapOrNull(
    await admin.from("artists").select("slug").eq("user_id", user.id).maybeSingle(),
  );
  if (existant) return { ok: true, slug: (existant as { slug: string }).slug };

  const slug = await slugLibre(name);

  const { error } = await admin.from("artists").insert({
    user_id: user.id,
    slug,
    name,
    city,
  });

  if (error) return { ok: false, error: error.message };

  revalidateAll(slug);
  return { ok: true, slug };
}

/**
 * Le compte qui reçoit l'argent.
 *
 * Il n'existait aucun écran pour le renseigner : `requestPayout` créait donc
 * des demandes de retrait sans destination. C'est le premier réglage qu'un
 * artiste doit pouvoir poser.
 */
export async function updatePayout(input: {
  artistId: string;
  method: PaymentMethod;
  number: string;
}): Promise<ActionResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Connecte-toi d'abord." };

  if (input.method !== "wave" && input.method !== "orange_money") {
    return { ok: false, error: "Moyen de paiement inconnu." };
  }

  // Chiffres seulement : les fans dictent leur numéro avec des espaces, des
  // points ou un +221 selon l'habitude, et l'agrégateur n'en veut rien.
  const number = (input.number || "").replace(/\D/g, "");
  if (number.length < 9 || number.length > 15) {
    return { ok: false, error: "Numéro invalide." };
  }

  // Le filtre sur user_id est la sécurité : sans lui, une Server Action
  // appelée à la main changerait le numéro de retrait d'un autre artiste.
  const { error } = await supabaseAdmin()
    .from("artists")
    .update({ payout_method: input.method, payout_number: number })
    .eq("id", input.artistId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/parametres");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Déconnexion. Une Server Action peut écrire les cookies, pas une page. */
export async function signOut(): Promise<void> {
  const supabase = await supabaseSession();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}

/**
 * Une adresse lisible dérivée du nom, unique en base.
 *
 * Le slug part dans la bio Instagram de l'artiste : il doit rester court et
 * prononçable. En cas de collision on suffixe un nombre plutôt que de coller
 * un identifiant aléatoire, illisible à dicter au téléphone.
 */
async function slugLibre(name: string): Promise<string> {
  const base =
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 24) || "artiste";

  const admin = supabaseAdmin();

  for (let i = 0; i < 50; i++) {
    const essai = i === 0 ? base : `${base}${i + 1}`;
    const pris = unwrapOrNull(
      await admin.from("artists").select("id").eq("slug", essai).maybeSingle(),
    );
    if (!pris) return essai;
  }

  // Cinquante homonymes : on cède et on prend l'identifiant du compte.
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

/** Comme unwrap, mais une absence de ligne n'est pas une erreur. */
function unwrapOrNull<T>(res: { data: T | null; error: unknown }): T | null {
  return res.data ?? null;
}

/* ---------------------------------------------------------------------- */

/** Les montants apparaissent sur les quatre écrans : tout se rafraîchit. */
function revalidateAll(artistSlug?: string) {
  if (artistSlug) revalidatePath(`/a/${artistSlug}`);
  revalidatePath("/");
  revalidatePath("/dashboard");
}

/**
 * Nom d'affichage d'un compte fan.
 *
 * Sans lui, un fan n'est qu'une adresse électronique — et c'est cette adresse
 * qui s'afficherait partout où il apparaît. Personne ne veut voir son courriel
 * exposé sous un soutien public.
 */
export async function updateFanName(name: string): Promise<ActionResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Connecte-toi d'abord." };

  // Même longueur que supporter_name : c'est le même nom qui s'affichera un
  // jour sous les soutiens, il ne doit pas casser la mise en page.
  const propre = (name || "").trim().replace(/\s+/g, " ").slice(0, 28);
  if (propre.length < 2) {
    return { ok: false, error: "Ton nom fait au moins 2 lettres." };
  }

  const supabase = await supabaseSession();
  const { error } = await supabase.auth.updateUser({
    data: { display_name: propre },
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/parametres");
  return { ok: true };
}

/**
 * Photo de profil d'un compte fan.
 *
 * Elle vit dans les métadonnées du compte Supabase, pas dans une table à
 * part : un fan n'a rien d'autre à stocker que ça, et une table de profils
 * imposerait une migration pour un seul champ. Les métadonnées sont
 * modifiables par leur propriétaire — sans conséquence ici, puisque rien
 * d'officiel ne dépend de cette image.
 */
export async function updateFanAvatar(
  formData: FormData,
): Promise<ActionResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Connecte-toi d'abord." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Aucun fichier reçu." };
  }

  const put = await putImage(file, `fans/${user.id}`, PHOTO_RULES);
  if (!put.ok) return put;

  // Par la session, jamais par la clé d'administration : on ne peut ainsi
  // modifier que le compte connecté, quoi qu'arrive dans le formulaire.
  const supabase = await supabaseSession();
  const { error } = await supabase.auth.updateUser({
    data: { avatar_key: put.key },
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/parametres");
  return { ok: true };
}
