import type { Support } from "./types";

/**
 * Regroupement des soutiens reçus. Volontairement HORS de queries.ts, qui est
 * marqué `server-only` : l'atelier de l'artiste est un composant client et ne
 * peut rien importer de là-bas. Cette fonction ne touche pas à la base, elle
 * ne fait que compter.
 */

export type Soutien = {
  /** Clé de regroupement : le compte s'il existe, sinon le nom donné. */
  cle: string;
  nom: string;
  total: number;
  nombre: number;
  dernier: string;
  /** Le soutien vient d'un compte, pas d'un passage anonyme. */
  identifie: boolean;
};

/**
 * Qui a soutenu un artiste, une ligne par personne.
 *
 * Le regroupement se fait sur le compte quand il y en a un, sinon sur le nom
 * donné au moment du paiement. Deux passages anonymes sous le même nom sont
 * donc comptés ensemble — c'est faux dans l'absolu, mais bien plus proche de
 * la vérité que de les lister deux fois.
 *
 * Calculé ici plutôt qu'en SQL : les volumes sont ceux d'un seul artiste, et
 * une vue de plus serait une migration de plus à faire jouer.
 */
export function grouperSoutiens(supports: Support[]): Soutien[] {
  const par = new Map<string, Soutien>();

  for (const s of supports) {
    const cle = s.userId ?? `nom:${s.supporterName.toLowerCase()}`;
    const vu = par.get(cle);

    if (vu) {
      vu.total += s.amount;
      vu.nombre += 1;
      if (s.createdAt > vu.dernier) vu.dernier = s.createdAt;
    } else {
      par.set(cle, {
        cle,
        nom: s.supporterName,
        total: s.amount,
        nombre: 1,
        dernier: s.createdAt,
        identifie: !!s.userId,
      });
    }
  }

  return [...par.values()].sort((a, b) => b.total - a.total);
}
