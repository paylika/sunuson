/**
 * Les styles, en liste fermée.
 *
 * Même raison que le Foy Tewal : en champ libre, on obtient « Trap », « trap »
 * et « TRAP SN » pour une seule chose, et plus aucun rapprochement n'est
 * possible entre deux morceaux. Une liste fermée est ce qui rend la
 * recommandation par style calculable.
 *
 * Elle est courte volontairement. Trente genres donneraient trente cases à
 * lire au moment de publier, et personne ne lit trente cases : on coche la
 * première, et l'étiquette ne veut plus rien dire.
 *
 * Elle colle à la scène sénégalaise plutôt qu'aux catégories internationales —
 * « mbalax-rap » n'existe nulle part ailleurs, et c'est précisément ce qui
 * distingue ce catalogue.
 */
export const STYLES = [
  { id: "trap", nom: "Trap" },
  { id: "drill", nom: "Drill" },
  { id: "boombap", nom: "Boom bap" },
  { id: "conscient", nom: "Conscient" },
  { id: "afro", nom: "Afro" },
  { id: "mbalaxrap", nom: "Mbalax-rap" },
  { id: "freestyle", nom: "Freestyle" },
  { id: "rnb", nom: "R&B" },
  { id: "instru", nom: "Instru" },
] as const;

export type StyleId = (typeof STYLES)[number]["id"];

/** Trois au maximum : au-delà, une étiquette ne distingue plus rien. */
export const MAX_STYLES = 3;

const CONNUS = new Set<string>(STYLES.map((s) => s.id));

/** Filtre ce qui arrive du navigateur : le serveur ne fait confiance à rien. */
export function stylesValides(valeurs: unknown): StyleId[] {
  if (!Array.isArray(valeurs)) return [];
  return [...new Set(valeurs.filter((v): v is StyleId =>
    typeof v === "string" && CONNUS.has(v),
  ))].slice(0, MAX_STYLES);
}

export function nomDuStyle(id: string): string | undefined {
  return STYLES.find((s) => s.id === id)?.nom;
}
