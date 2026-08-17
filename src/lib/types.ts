import type { PaymentMethod } from "./config";

/**
 * Ces types sont le miroir des tables Supabase (voir supabase/schema.sql).
 * Les composants ne connaissent qu'eux : ils ignorent d'où viennent les
 * données, ce qui rend un changement de base indolore.
 */

export type Artist = {
  id: string;
  /** Identifiant du lien partageable : /a/{slug} */
  slug: string;
  name: string;
  city: string;
  bio: string;
  /** Label ou structure. Vide si l'artiste est indépendant. */
  label?: string;
  /** Deux couleurs composant le dégradé de repli, faute d'image. */
  gradient: [string, string];
  /** URL publique de la photo de profil. Absente -> initiales sur dégradé. */
  avatarUrl?: string;
  /** URL publique de la bannière. Absente -> dégradé. */
  coverUrl?: string;
  verified: boolean;
  monthlyListeners: number;
};

/**
 * Comment le fan paie un morceau donné.
 *   'libre' : il choisit son montant
 *   'fixe'  : l'artiste impose un prix — c'est ce qui transforme un inédit
 *             en vente plutôt qu'en don
 */
export type SupportMode = "libre" | "fixe";

/**
 * Un invité sur un morceau. `artistId` n'existe que si l'invité est inscrit
 * sur la plateforme — dans ce cas sa part lui est réellement versée. Sinon on
 * garde son nom pour l'afficher, et la part reste à l'artiste principal.
 */
export type Collaborator = {
  id: string;
  artistId?: string;
  slug?: string;
  name: string;
  avatarUrl?: string;
  gradient?: [string, string];
  /** Pourcentage des soutiens reçus sur ce morceau. */
  share: number;
};

export type Track = {
  id: string;
  artistId: string;
  title: string;
  /** Durée en secondes. 0 tant qu'aucun fichier n'est déposé. */
  duration: number;
  plays: number;
  releasedAt: string;
  /** URL du fichier audio. Absente : le lecteur simule la lecture. */
  audioUrl?: string;
  /** URL publique de la pochette. */
  coverUrl?: string;
  label?: string;
  /** Un morceau verrouillé ne s'ouvre qu'après un soutien. */
  locked: boolean;
  supportMode: SupportMode;
  /** Prix imposé, uniquement quand supportMode vaut 'fixe'. */
  supportAmount?: number;
  /** Invités, avec leur part. Vide sur un morceau solo. */
  collaborators: Collaborator[];
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
