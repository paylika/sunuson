import "server-only";
import { createHmac, createHash, timingSafeEqual } from "node:crypto";

/**
 * La couche de paiement, indépendante de l'agrégateur.
 *
 * Deux raisons de passer par une interface plutôt que d'appeler PayDunya
 * directement depuis l'action de soutien.
 *
 * La première est pratique : au Sénégal, les agrégateurs changent de
 * conditions, tombent en panne, ou refusent un compte. Le jour où il faut
 * passer à CinetPay ou à l'API Wave Business, seul ce fichier bouge — le
 * soutien, le webhook et les écrans n'en savent rien.
 *
 * La seconde est plus importante : elle rend le chemin de l'argent lisible
 * d'un seul endroit. Sur tout le reste de l'application, une erreur coûte un
 * affichage ; ici elle coûte l'argent d'un fan et la confiance d'un artiste.
 *
 * RÈGLE ABSOLUE : rien de ce qui vient du navigateur ne décide d'un montant ni
 * d'un statut. Le montant est relu en base avant l'appel, et seul le webhook
 * signé par l'agrégateur fait passer un soutien en payé.
 */

export type Fournisseur = "demo" | "paydunya" | "unitech";

export function fournisseur(): Fournisseur {
  const v = (process.env.PAYMENT_PROVIDER ?? "").toLowerCase();
  if (v === "paydunya") return "paydunya";
  if (v === "unitech" || v === "unitechpay") return "unitech";
  return "demo";
}

export type Paiement =
  | { ok: true; url: string; ref: string }
  | { ok: false; error: string };

export type Evenement =
  | { ok: true; ref: string; paye: boolean; montant?: number }
  | { ok: false; error: string; statut: number };

/* ---------------------------------------------------------------- départ */

/**
 * Ouvre un paiement chez l'agrégateur et renvoie l'adresse où envoyer le fan.
 *
 * Le montant passé ici a DÉJÀ été relu en base par l'appelant : cette
 * fonction ne le revalide pas, elle le transmet.
 */
export async function ouvrirPaiement(input: {
  supportId: string;
  montant: number;
  artiste: string;
  morceau?: string;
  retour: string;
  /** Exigé par UnitechPay, pour Wave comme pour Orange Money. */
  telephone?: string;
  methode: "wave" | "orange_money";
}): Promise<Paiement> {
  const f = fournisseur();

  if (f === "demo") {
    // Aucun agrégateur branché : on rend une référence locale, et c'est le
    // mode démonstration de l'action de soutien qui confirmera.
    return { ok: true, url: "", ref: `demo_${input.supportId}` };
  }
  return f === "unitech" ? ouvrirUnitech(input) : ouvrirPayDunya(input);
}

/**
 * UnitechPay — https://pay.unitech.sn/documentation/
 *
 * Écrit d'après la documentation officielle, pas d'après une supposition.
 * Deux points en découlent, et tous deux ont des conséquences visibles :
 *
 * 1. Le NUMÉRO DE TÉLÉPHONE du client est obligatoire pour Wave comme pour
 *    Orange Money. La feuille de soutien doit donc le demander — ce n'est pas
 *    une coquetterie d'intégration, l'agrégateur refuse sans lui.
 *
 * 2. L'agrégateur ne transporte AUCUN identifiant à nous : sa réponse donne
 *    sa propre `reference`, et c'est elle qui reviendra dans la notification.
 *    On l'écrit donc en base immédiatement, et le rapprochement se fait
 *    dessus.
 */
async function ouvrirUnitech(input: {
  supportId: string;
  montant: number;
  artiste: string;
  morceau?: string;
  retour: string;
  telephone?: string;
  methode: "wave" | "orange_money";
}): Promise<Paiement> {
  const cle = process.env.UNITECH_API_KEY;
  if (!cle) return { ok: false, error: "Paiement non configuré." };

  const numero = (input.telephone ?? "").replace(/\D/g, "");
  if (numero.length < 9) {
    return { ok: false, error: "Numéro de téléphone requis pour payer." };
  }

  const base = process.env.UNITECH_API_URL || "https://api.unitech.sn/api.php";

  // Wave et Orange Money ont chacun leur point d'entrée. On prend « Orange
  // Money standard » plutôt que le QR ou Max It : c'est le seul des trois qui
  // rende une adresse de paiement utilisable telle quelle depuis un
  // navigateur, sans imposer une application précise au fan.
  const action =
    input.methode === "wave" ? "create_wave_payment" : "create_orange_om";

  const libelle = input.morceau
    ? `Soutien à ${input.artiste} — ${input.morceau}`
    : `Soutien à ${input.artiste}`;

  try {
    const res = await fetch(`${base}?action=${action}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${cle}`,
      },
      body: JSON.stringify({
        amount: input.montant,
        customer_number: numero,
        description: libelle,
        callback_success: input.retour,
        callback_cancel: input.retour,
      }),
    });

    const data = (await res.json()) as {
      success?: boolean;
      message?: string;
      data?: { payment_url?: string; reference?: string };
    };

    if (!res.ok || !data.success || !data.data?.payment_url) {
      return {
        ok: false,
        error: data.message ?? "L'agrégateur a refusé la demande.",
      };
    }

    return {
      ok: true,
      url: data.data.payment_url,
      ref: data.data.reference ?? input.supportId,
    };
  } catch {
    return { ok: false, error: "Agrégateur injoignable. Réessaie." };
  }
}

/**
 * PayDunya : l'agrégateur le plus répandu au Sénégal, et le seul à couvrir
 * Wave et Orange Money derrière une seule intégration.
 *
 * ⚠️ Les noms de champs suivent la documentation publique mais n'ont PAS été
 * éprouvés contre l'API réelle — il faut de vraies clés pour cela. Avant
 * d'encaisser un franc, faire un paiement de test de 100 FCFA et vérifier
 * dans les journaux que la facture se crée et que le webhook revient.
 */
async function ouvrirPayDunya(input: {
  supportId: string;
  montant: number;
  artiste: string;
  morceau?: string;
  retour: string;
}): Promise<Paiement> {
  const cles = {
    master: process.env.PAYDUNYA_MASTER_KEY,
    prive: process.env.PAYDUNYA_PRIVATE_KEY,
    token: process.env.PAYDUNYA_TOKEN,
  };

  if (!cles.master || !cles.prive || !cles.token) {
    return { ok: false, error: "Paiement non configuré." };
  }

  // Le bac à sable tant que PAYDUNYA_MODE ne vaut pas 'live' : se tromper de
  // sens ici ferait encaisser de vrais francs pendant les essais.
  const base =
    process.env.PAYDUNYA_MODE === "live"
      ? "https://app.paydunya.com/api/v1"
      : "https://app.paydunya.com/sandbox-api/v1";

  const libelle = input.morceau
    ? `Soutien à ${input.artiste} — ${input.morceau}`
    : `Soutien à ${input.artiste}`;

  try {
    const res = await fetch(`${base}/checkout-invoice/create`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "PAYDUNYA-MASTER-KEY": cles.master,
        "PAYDUNYA-PRIVATE-KEY": cles.prive,
        "PAYDUNYA-TOKEN": cles.token,
      },
      body: JSON.stringify({
        invoice: {
          total_amount: input.montant,
          description: libelle,
        },
        store: { name: process.env.PAYMENT_STORE_NAME ?? "Amplifan" },
        actions: {
          return_url: input.retour,
          cancel_url: input.retour,
        },
        // Renvoyé tel quel dans le webhook : c'est ce qui rattache le
        // paiement au soutien, sans jamais faire confiance au montant reçu.
        custom_data: { support_id: input.supportId },
      }),
    });

    const data = (await res.json()) as {
      response_code?: string;
      response_text?: string;
      token?: string;
      description?: string;
    };

    if (!res.ok || data.response_code !== "00" || !data.token) {
      return {
        ok: false,
        error: data.description ?? "L'agrégateur a refusé la demande.",
      };
    }

    return {
      ok: true,
      url: data.response_text ?? "",
      ref: data.token,
    };
  } catch {
    // Coupure réseau : on ne laisse pas un soutien à demi ouvert sans le dire.
    return { ok: false, error: "Agrégateur injoignable. Réessaie." };
  }
}

/* --------------------------------------------------------------- retour */

/**
 * Vérifie qu'un webhook vient bien de l'agrégateur, et en extrait le résultat.
 *
 * Sans cette vérification, n'importe qui connaissant l'adresse du webhook
 * pourrait déclarer n'importe quel soutien comme payé. C'est le seul endroit
 * de l'application où une faille se traduit directement en argent.
 */
export function lireEvenement(
  corpsBrut: string,
  entetes: Headers,
): Evenement {
  const f = fournisseur();
  if (f === "paydunya") return lirePayDunya(corpsBrut);
  if (f === "unitech") return lireUnitech(corpsBrut, entetes);
  return lireDemo(corpsBrut, entetes);
}

/**
 * Mode démonstration : un secret partagé dans un en-tête.
 *
 * Suffisant tant qu'aucun argent réel ne circule, et comparé en temps
 * constant malgré tout — une comparaison de chaînes ordinaire laisse deviner
 * un secret caractère par caractère.
 */
function lireDemo(corpsBrut: string, entetes: Headers): Evenement {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) {
    return { ok: false, error: "Webhook non configuré.", statut: 503 };
  }

  if (!egales(entetes.get("x-webhook-secret") ?? "", secret)) {
    return { ok: false, error: "Signature invalide.", statut: 401 };
  }

  try {
    const p = JSON.parse(corpsBrut) as {
      provider_ref?: string;
      status?: string;
      amount?: number;
    };

    if (!p.provider_ref || !p.status) {
      return { ok: false, error: "provider_ref et status requis.", statut: 400 };
    }

    return {
      ok: true,
      ref: p.provider_ref,
      paye: ["paid", "success", "completed"].includes(p.status),
      montant: typeof p.amount === "number" ? p.amount : undefined,
    };
  } catch {
    return { ok: false, error: "Corps illisible.", statut: 400 };
  }
}

/**
 * Notification d'UnitechPay.
 *
 * La documentation propose deux vérifications équivalentes. On accepte les
 * deux, mais l'ordre compte : la seconde est essayée d'abord parce qu'elle
 * est celle que la documentation recommande DERRIÈRE UN CDN — et nous sommes
 * derrière Cloudflare, qui peut réécrire le corps ou les en-têtes.
 *
 *   1. empreinte du corps brut, dans l'en-tête X-UNITECHPAY-SIGNATURE ;
 *   2. empreinte d'une chaîne canonique de champs stables, dans le corps :
 *      event|reference|amount|status|signed_at.
 *
 * Le secret est la clé d'API elle-même — c'est ce que dit la documentation,
 * et c'est pour ça qu'il n'y a pas de variable de webhook séparée.
 */
function lireUnitech(corpsBrut: string, entetes: Headers): Evenement {
  const cle = process.env.UNITECH_API_KEY;
  if (!cle) {
    return { ok: false, error: "Webhook non configuré.", statut: 503 };
  }

  let p: {
    event?: string;
    reference?: string;
    amount?: number | string;
    status?: string;
    signed_at?: number | string;
    signature?: string;
  };

  try {
    p = JSON.parse(corpsBrut);
  } catch {
    return { ok: false, error: "Corps illisible.", statut: 400 };
  }

  const canonique = [
    p.event ?? "",
    p.reference ?? "",
    p.amount ?? "",
    p.status ?? "",
    p.signed_at ?? "",
  ].join("|");

  const parCorps =
    !!p.signature && egales(p.signature, signer(canonique, cle));

  const parEntete = egales(
    entetes.get("x-unitechpay-signature") ?? "",
    signer(corpsBrut, cle),
  );

  if (!parCorps && !parEntete) {
    return { ok: false, error: "Signature invalide.", statut: 401 };
  }

  if (!p.reference) {
    return { ok: false, error: "Référence absente.", statut: 400 };
  }

  const montant = Number(p.amount);

  return {
    ok: true,
    ref: p.reference,
    // On se fie à l'événement plutôt qu'au statut : c'est lui qui distingue
    // un paiement réussi d'un retrait traité, et les deux portent « completed ».
    paye: p.event === "payment_completed" && p.status === "completed",
    montant: Number.isFinite(montant) ? montant : undefined,
  };
}

/**
 * PayDunya signe en envoyant l'empreinte SHA-512 de la clé privée dans le
 * corps de la notification. C'est faible — la même empreinte à chaque appel,
 * donc rejouable — mais c'est ce que le fournisseur propose. L'idempotence
 * côté base est ce qui rattrape cette faiblesse : un rejeu ne recompte rien.
 */
function lirePayDunya(corpsBrut: string): Evenement {
  const prive = process.env.PAYDUNYA_PRIVATE_KEY;
  if (!prive) {
    return { ok: false, error: "Webhook non configuré.", statut: 503 };
  }

  let data: {
    hash?: string;
    status?: string;
    invoice?: { token?: string; total_amount?: number | string };
    custom_data?: { support_id?: string };
  };

  try {
    // PayDunya poste en formulaire, avec un objet `data` imbriqué.
    const params = new URLSearchParams(corpsBrut);
    const brut = params.get("data");
    data = brut ? JSON.parse(brut) : (JSON.parse(corpsBrut) as never);
  } catch {
    return { ok: false, error: "Corps illisible.", statut: 400 };
  }

  const attendu = createHash("sha512").update(prive).digest("hex");
  if (!data.hash || !egales(data.hash, attendu)) {
    return { ok: false, error: "Signature invalide.", statut: 401 };
  }

  const ref = data.custom_data?.support_id ?? data.invoice?.token;
  if (!ref) {
    return { ok: false, error: "Référence absente.", statut: 400 };
  }

  const montant = Number(data.invoice?.total_amount);

  return {
    ok: true,
    ref,
    paye: data.status === "completed",
    montant: Number.isFinite(montant) ? montant : undefined,
  };
}

/** Comparaison en temps constant, quelle que soit la longueur reçue. */
function egales(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    // On compare quand même, pour que la durée ne trahisse pas la longueur.
    timingSafeEqual(bb, bb);
    return false;
  }
  return timingSafeEqual(ba, bb);
}

/** Signature HMAC, pour un futur agrégateur qui en utiliserait une. */
export function signer(charge: string, secret: string): string {
  return createHmac("sha256", secret).update(charge).digest("hex");
}
