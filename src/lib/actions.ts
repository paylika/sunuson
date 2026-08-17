"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "./db";
import { MAX_SUPPORT, MIN_SUPPORT, type PaymentMethod } from "./config";

/**
 * Une Server Action est un point d'entrée public : tout ce qui arrive ici
 * vient du navigateur et doit être considéré comme hostile. D'où la
 * validation systématique avant toute écriture.
 */

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

  const supporterName = (input.supporterName || "").trim().slice(0, 28) || "Anonyme";
  const message = (input.message || "").trim().slice(0, 120) || null;

  const admin = supabaseAdmin();

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

  revalidatePath(`/a/${input.artistSlug}`);
  revalidatePath("/");
  revalidatePath("/decouvrir");
  revalidatePath("/dashboard");

  return { ok: true, supportId: data.id };
}

/**
 * Crée la fiche d'un morceau. Le fichier audio n'est pas encore envoyé :
 * `audio_key` reste vide, et le lecteur simule la lecture jusque-là.
 */
export async function createTrack(input: {
  artistId: string;
  artistSlug: string;
  title: string;
  locked: boolean;
  rightsOk: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const title = (input.title || "").trim().slice(0, 60);
  if (title.length < 2) return { ok: false, error: "Titre trop court." };
  if (!input.rightsOk) {
    return { ok: false, error: "Il faut confirmer que tu détiens les droits." };
  }

  const admin = supabaseAdmin();

  // Le nouveau morceau passe en tête de liste.
  const { data: last } = await admin
    .from("tracks")
    .select("position")
    .eq("artist_id", input.artistId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await admin.from("tracks").insert({
    artist_id: input.artistId,
    title,
    locked: input.locked,
    rights_ok: true,
    duration: 0,
    position: (last?.position ?? 0) + 1,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath(`/a/${input.artistSlug}`);
  return { ok: true };
}

/** Enregistre une demande de retrait. Le virement se fait à la main. */
export async function requestPayout(
  artistId: string,
  amount: number,
): Promise<{ ok: boolean; error?: string }> {
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
