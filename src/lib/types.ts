import type { PaymentMethod } from "./config";

/**
 * Ces types sont le miroir exact des tables Supabase (voir supabase/schema.sql).
 * Tant qu'on est en démo, ils sont alimentés par src/lib/data.ts ; le jour du
 * branchement, seules les fonctions d'accès changent, pas les composants.
 */

export type Artist = {
  id: string;
  /** Identifiant du lien partageable : /a/{slug} */
  slug: string;
  name: string;
  city: string;
  bio: string;
  /** Deux couleurs qui composent la pochette dégradée, faute de photo. */
  gradient: [string, string];
  verified: boolean;
  monthlyListeners: number;
};

export type Track = {
  id: string;
  artistId: string;
  title: string;
  /** Durée en secondes. */
  duration: number;
  plays: number;
  releasedAt: string;
  /** URL du fichier audio. Vide en démo : le lecteur simule la lecture. */
  audioUrl?: string;
  /** Un morceau verrouillé ne s'ouvre qu'après un soutien. */
  locked: boolean;
  featuring?: string;
};

export type Clip = {
  id: string;
  artistId: string;
  title: string;
  /** Identifiant YouTube : les clips restent chez eux, on n'héberge rien. */
  youtubeId: string;
  views: number;
};

export type Support = {
  id: string;
  artistId: string;
  trackId?: string;
  /** Nom affiché publiquement sur le mur. */
  supporterName: string;
  amount: number;
  message?: string;
  method: PaymentMethod;
  createdAt: string;
};

export type Payout = {
  id: string;
  artistId: string;
  amount: number;
  status: "en_attente" | "envoye";
  createdAt: string;
};
