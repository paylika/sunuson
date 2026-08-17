import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

/**
 * Webhook de l'agrégateur mobile money.
 *
 * C'est le SEUL endroit autorisé à faire passer un soutien en 'paid'. La
 * table n'a aucune policy d'insertion et le navigateur ne peut donc pas
 * fabriquer de faux soutiens ; il ne reste qu'à protéger cette porte.
 *
 * À faire avant la mise en production :
 *   1. vérifier la signature de l'agrégateur (chaque fournisseur a la sienne)
 *   2. rapprocher le montant reçu de celui enregistré
 *   3. remplacer le rapprochement par provider_ref par la référence réelle
 */
export async function POST(request: Request) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 503 });
  }

  // Garde minimale en attendant la vraie vérification de signature.
  if (request.headers.get("x-webhook-secret") !== secret) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  let payload: { provider_ref?: string; status?: string; amount?: number };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps illisible" }, { status: 400 });
  }

  const { provider_ref: ref, status } = payload;
  if (!ref || !status) {
    return NextResponse.json({ error: "provider_ref et status requis" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const { data: support, error: readError } = await admin
    .from("supports")
    .select("id, status, amount")
    .eq("provider_ref", ref)
    .maybeSingle();

  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }
  if (!support) {
    return NextResponse.json({ error: "Soutien introuvable" }, { status: 404 });
  }

  // Les agrégateurs rejouent leurs webhooks. Un soutien déjà confirmé ne doit
  // pas être recompté : on répond 200 pour qu'ils arrêtent de réessayer.
  if (support.status === "paid") {
    return NextResponse.json({ ok: true, deja_traite: true });
  }

  const paid = status === "paid" || status === "success" || status === "completed";

  const { error: writeError } = await admin
    .from("supports")
    .update({
      status: paid ? "paid" : "failed",
      paid_at: paid ? new Date().toISOString() : null,
    })
    .eq("id", support.id);

  if (writeError) {
    return NextResponse.json({ error: writeError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
