import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";
import { lireEvenement } from "@/lib/paiement";

/**
 * Webhook de l'agrégateur mobile money.
 *
 * C'est le SEUL endroit autorisé à faire passer un soutien en 'paid'. La table
 * n'a aucune policy d'insertion, donc le navigateur ne peut pas fabriquer de
 * faux soutiens ; il ne restait qu'à protéger cette porte — c'est fait ici.
 *
 * Trois défenses, dans cet ordre :
 *
 *   1. la signature, vérifiée par la couche de paiement selon l'agrégateur ;
 *   2. l'idempotence, parce que tous les agrégateurs rejouent leurs
 *      notifications et qu'un soutien recompté fausse les revenus d'un
 *      artiste ;
 *   3. le rapprochement du montant, parce qu'une notification signée peut
 *      malgré tout annoncer une somme qui ne correspond pas à ce qui a été
 *      demandé.
 */
type Soutien = { id: string; status: string; amount: number };

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  // Le corps est lu en texte, jamais en JSON : la signature porte sur les
  // octets exacts, et re-sérialiser un objet les change.
  const corps = await request.text();

  const evenement = lireEvenement(corps, request.headers);
  if (!evenement.ok) {
    return NextResponse.json({ error: evenement.error }, { status: evenement.statut });
  }

  const admin = supabaseAdmin();

  // Deux requêtes séparées plutôt qu'un `.or()` construit par concaténation.
  //
  // La référence vient de l'extérieur : glissée telle quelle dans la syntaxe
  // de filtre de PostgREST, une virgule ou une parenthèse suffirait à
  // réécrire la condition et à faire remonter une autre ligne. Sur le chemin
  // de l'argent, ça ne se discute pas.
  const parId = UUID.test(evenement.ref)
    ? await admin
        .from("supports")
        .select("id, status, amount")
        .eq("id", evenement.ref)
        .maybeSingle<Soutien>()
    : null;

  let support = parId?.data ?? null;

  if (!support) {
    const parRef = await admin
      .from("supports")
      .select("id, status, amount")
      .eq("provider_ref", evenement.ref)
      .maybeSingle<Soutien>();

    if (parRef.error) {
      return NextResponse.json({ error: parRef.error.message }, { status: 500 });
    }
    support = parRef.data;
  }
  if (!support) {
    return NextResponse.json({ error: "Soutien introuvable" }, { status: 404 });
  }

  // Déjà traité : on répond 200 pour que l'agrégateur cesse de réessayer.
  if (support.status === "paid") {
    return NextResponse.json({ ok: true, deja_traite: true });
  }

  // Montant annoncé différent du montant demandé : on refuse de confirmer et
  // on laisse une trace. Confirmer quand même reviendrait à créditer un
  // artiste d'une somme que personne n'a payée.
  if (
    evenement.paye &&
    evenement.montant !== undefined &&
    Math.round(evenement.montant) !== support.amount
  ) {
    console.error(
      `Montant discordant sur ${support.id} : annoncé ${evenement.montant}, attendu ${support.amount}`,
    );
    await admin
      .from("supports")
      .update({ status: "failed" })
      .eq("id", support.id);

    return NextResponse.json({ error: "Montant discordant" }, { status: 409 });
  }

  const { error: ecriture } = await admin
    .from("supports")
    .update({
      status: evenement.paye ? "paid" : "failed",
      paid_at: evenement.paye ? new Date().toISOString() : null,
    })
    .eq("id", support.id)
    // Course entre deux notifications simultanées : celle qui arrive en
    // second ne trouve plus de ligne 'pending' et n'écrit rien.
    .eq("status", "pending");

  if (ecriture) {
    return NextResponse.json({ error: ecriture.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
