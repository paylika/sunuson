/**
 * Réglages produit. Le nom n'est pas arrêté : il ne vit qu'ici, un seul
 * endroit à changer le jour où on tranche.
 */
export const APP_NAME = "SUNU";
export const APP_TAGLINE = "Écoute libre. Soutien direct.";
export const APP_DOMAIN = "sunu.sn";

/** Part que la plateforme retient sur chaque soutien. */
export const COMMISSION_RATE = 0.15;

/** Montants proposés dans la feuille de soutien, en FCFA. */
export const SUPPORT_PRESETS = [500, 1000, 2000, 5000, 10000] as const;

export const MIN_SUPPORT = 100;
export const MAX_SUPPORT = 1_000_000;

/** Seuil de retrait minimum pour l'artiste, en FCFA. */
export const MIN_PAYOUT = 5000;

export type PaymentMethod = "wave" | "orange_money";

export const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  hint: string;
  tint: string;
}[] = [
  { id: "wave", label: "Wave", hint: "Sans frais pour toi", tint: "#1DC8FF" },
  {
    id: "orange_money",
    label: "Orange Money",
    hint: "Frais opérateur",
    tint: "#FF7900",
  },
];
