/**
 * Comment le fan se connecte.
 *
 *   "motdepasse" — adresse et mot de passe, la méthode que tout le monde
 *                  connaît. Aucun courriel n'est nécessaire À CONDITION de
 *                  décocher « Confirm email » dans Supabase (Authentication →
 *                  Providers → Email). Sans ça, l'inscription envoie quand
 *                  même un courriel de validation et on retombe sur la limite
 *                  d'envois du serveur intégré.
 *   "code"       — six chiffres reçus par courriel. Le plus fiable sur mobile,
 *                  mais exige `{{ .Token }}` dans le modèle « Magic Link ».
 *   "lien"       — lien cliquable. Le moins fiable : l'adresse de retour doit
 *                  être en liste blanche, et un lien ouvert depuis Gmail crée
 *                  la session dans le navigateur interne de l'application.
 *
 * Le mot de passe a un défaut à connaître : « mot de passe oublié » passe
 * forcément par un courriel. Tant qu'il n'y a pas de SMTP externe, un compte
 * dont le mot de passe est perdu est un compte perdu. C'est tenable le temps
 * des essais, pas une fois les premiers artistes inscrits.
 */
export const AUTH_METHOD: "motdepasse" | "code" | "lien" = "motdepasse";

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
