/**
 * Forme d'onde d'un morceau.
 *
 * Tant qu'aucun fichier audio n'est déposé, on ne peut pas mesurer de vraies
 * crêtes. On en fabrique donc à partir de l'identifiant du morceau : le même
 * morceau donne toujours le même dessin, ce qui compte plus que l'exactitude —
 * une onde qui changerait à chaque rendu détruirait la confiance dans les
 * repères de soutien posés dessus.
 *
 * Le jour où les fichiers arrivent, ces valeurs seront calculées à l'envoi et
 * stockées en base ; seule cette fonction change.
 */

/** Hachage stable d'une chaîne, sans dépendance. */
function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Générateur déterministe : même graine, même suite. */
function random(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Hauteurs de barres entre 0 et 1.
 *
 * Le lissage sur la valeur précédente évite le hérisson : un morceau réel
 * monte et descend par vagues, il ne saute pas d'une barre à l'autre.
 */
export function waveformFor(trackId: string, bars = 54): number[] {
  const next = random(seedFrom(trackId));
  const out: number[] = [];
  let previous = 0.5;

  for (let i = 0; i < bars; i++) {
    const cible = 0.18 + next() * 0.82;
    previous = previous * 0.55 + cible * 0.45;

    // Léger creux au début et à la fin : une intro et une chute, comme un
    // vrai morceau.
    const bord = Math.min(i, bars - 1 - i) / (bars * 0.18);
    const attenuation = Math.min(1, 0.35 + bord * 0.65);

    out.push(Math.max(0.12, Math.min(1, previous * attenuation)));
  }
  return out;
}
