/**
 * Comment le fan se connecte.
 *
 *   "lien" — Supabase envoie un lien cliquable. Fonctionne sans rien
 *            configurer, avec le modèle de courriel par défaut.
 *   "code" — six chiffres à saisir. Plus fiable sur mobile : un lien ouvert
 *            depuis l'application de messagerie atterrit souvent dans un
 *            autre navigateur, et la session se crée au mauvais endroit.
 *
 * On est sur "code", et c'est le bon défaut ici. Le lien a trois façons
 * d'échouer qui n'existent pas avec un code : l'adresse de retour doit être
 * inscrite dans la liste blanche Supabase (donc chaque nouvelle URL casse la
 * connexion), le lien ouvert depuis Gmail atterrit dans le navigateur interne
 * de l'application et la session se crée là plutôt que dans le vrai
 * navigateur, et il faut ouvrir le message sur le téléphone qui a fait la
 * demande. Le code se tape dans la page déjà ouverte : rien de tout ça.
 *
 * Il exige une seule chose : que le modèle de courriel « Magic Link » de
 * Supabase contienne `{{ .Token }}`. Sans ce jeton, le message part avec un
 * lien et l'écran attend un code qui n'arrive jamais.
 */
export const AUTH_METHOD: "lien" | "code" = "code";

/** Réglages produit. */
export const APP_NAME = "Amplifan";
export const APP_TAGLINE = "Écoute libre. Soutien direct.";
export const APP_DOMAIN = "amplifan.app";

/** Part que la plateforme retient sur chaque soutien. */
export const COMMISSION_RATE = 0.15;

/** Montants proposés dans la feuille de soutien, en FCFA. */
export const SUPPORT_PRESETS = [500, 1000, 2000, 5000, 10000] as const;

export const MIN_SUPPORT = 100;
export const MAX_SUPPORT = 1_000_000;

/** Seuil de retrait minimum pour l'artiste, en FCFA. */
export const MIN_PAYOUT = 5000;

/**
 * Tant qu'il n'y a pas d'authentification, le dashboard affiche toujours le
 * même artiste. À remplacer par l'artiste de la session connectée.
 */
export const DEMO_ARTIST_SLUG = "ndiagaflow";

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
