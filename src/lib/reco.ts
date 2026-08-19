import type { Artist, Track } from "./types";

/**
 * L'algorithme de recommandation.
 *
 * Une note par morceau, somme de cinq termes. Aucun n'est indispensable : le
 * poids d'un signal absent tombe à zéro et les autres se répartissent la note.
 * C'est la propriété qui compte le plus ici — au démarrage, la plateforme n'a
 * ni featuring, ni co-soutien, ni historique, et un algorithme qui exigerait
 * ces signaux ne renverrait rien du tout.
 *
 * Il se comporte donc comme un tri par fraîcheur et par territoire tant que le
 * reste est vide, puis s'enrichit tout seul à mesure que les données arrivent,
 * sans qu'une ligne change.
 *
 * Tout se calcule en mémoire, sur quelques dizaines d'artistes. Une base
 * vectorielle ou un service de recommandation résoudraient un problème que
 * cette plateforme n'a pas, et n'aura pas avant longtemps.
 *
 * PERSONNALISATION : elle n'utilise que ce qu'un compte a rendu public par un
 * geste — ses soutiens. L'écoute reste anonyme, donc elle ne nourrit rien.
 * C'est un choix de produit, pas une limite technique : la personnalisation
 * devient une raison de créer un compte plutôt qu'une surveillance imposée.
 */

export type Contexte = {
  /** Artistes que ce compte a déjà soutenus. Vide pour un visiteur. */
  artistesSoutenus: string[];
  /** Styles déduits de ces soutiens. */
  stylesAimes: string[];
  /** Région du fan, déduite des artistes qu'il soutient. */
  regions: string[];
};

export const CONTEXTE_VIDE: Contexte = {
  artistesSoutenus: [],
  stylesAimes: [],
  regions: [],
};

export type Candidat = {
  track: Track;
  artist: Artist;
  /** Nombre de soutiens reçus par l'artiste, pour le terme de preuve. */
  soutiens: number;
};

export type Recommande = Candidat & {
  note: number;
  /** Pourquoi ce morceau est là. Affiché au fan : une recommandation
      inexpliquée passe pour de la publicité. */
  raison?: string;
};

/** Poids relatifs. Ils ne s'additionnent à 1 qu'après normalisation. */
const POIDS = {
  fraicheur: 1.0,
  territoire: 0.7,
  style: 0.9,
  scene: 0.8,
  preuve: 0.5,
} as const;

/** Trente jours : au-delà, un morceau n'est plus une nouveauté. */
const JOURS_FRAICHEUR = 30;

export function recommander(
  candidats: Candidat[],
  contexte: Contexte,
  options: { limite?: number; maxParArtiste?: number } = {},
): Recommande[] {
  const { limite = 20, maxParArtiste = 2 } = options;

  const maintenant = Date.now();
  const soutenus = new Set(contexte.artistesSoutenus);
  const stylesAimes = new Set(contexte.stylesAimes);
  const regions = new Set(contexte.regions);

  const notes = candidats.map((c): Recommande => {
    const termes: { poids: number; valeur: number; raison?: string }[] = [];

    // ------------------------------------------------------- fraîcheur
    // Toujours disponible, même le premier jour : c'est ce qui donne sa
    // chance à un artiste inscrit ce matin, là où un tri par popularité le
    // condamnerait à la dernière place pour toujours.
    const jours =
      (maintenant - new Date(c.track.releasedAt).getTime()) / 86_400_000;
    const fraicheur = Math.max(0, 1 - jours / JOURS_FRAICHEUR);
    termes.push({
      poids: POIDS.fraicheur,
      valeur: fraicheur,
      raison: jours <= 7 ? "Sorti cette semaine" : undefined,
    });

    // ------------------------------------------------------- territoire
    if (regions.size > 0) {
      const meme = regions.has(c.artist.city);
      termes.push({
        poids: POIDS.territoire,
        valeur: meme ? 1 : 0,
        raison: meme ? `Comme toi, ${c.artist.city}` : undefined,
      });
    }

    // ------------------------------------------------------------ style
    if (stylesAimes.size > 0) {
      const styles = c.track.styles ?? [];
      const communs = styles.filter((s) => stylesAimes.has(s));
      termes.push({
        poids: POIDS.style,
        valeur: styles.length === 0 ? 0 : communs.length / styles.length,
        raison: communs[0] ? `Tu écoutes du ${communs[0]}` : undefined,
      });
    }

    // ------------------------------------------------------------ scène
    // Le graphe des featurings : dans le rap, avec qui on pose dit la scène
    // bien mieux qu'une étiquette de genre. Un invité déjà soutenu par le fan
    // vaut donc autant qu'un style commun.
    if (soutenus.size > 0) {
      const invites = c.track.collaborators ?? [];
      const lien =
        soutenus.has(c.artist.id) ||
        invites.some((i) => i.artistId && soutenus.has(i.artistId));

      termes.push({
        poids: POIDS.scene,
        valeur: lien ? 1 : 0,
        raison: lien && !soutenus.has(c.artist.id) ? "Avec un artiste que tu soutiens" : undefined,
      });
    }

    // ----------------------------------------------------------- preuve
    // Fortement amortie : sans le logarithme, un artiste à cent soutiens
    // écraserait définitivement celui qui en a trois, et la découverte
    // s'arrêterait aux mêmes cinq noms.
    termes.push({
      poids: POIDS.preuve,
      valeur: Math.log10(1 + c.soutiens) / 2,
      raison: c.soutiens >= 10 ? "Beaucoup de soutiens" : undefined,
    });

    // Normalisation sur les seuls termes présents : un signal manquant ne
    // pénalise personne, il disparaît simplement du calcul.
    const total = termes.reduce((n, t) => n + t.poids, 0);
    const note = termes.reduce((n, t) => n + t.poids * t.valeur, 0) / total;

    // La raison montrée est celle du terme qui a le plus pesé.
    const meilleur = [...termes]
      .filter((t) => t.raison && t.valeur > 0)
      .sort((a, b) => b.poids * b.valeur - a.poids * a.valeur)[0];

    return { ...c, note, raison: meilleur?.raison };
  });

  notes.sort((a, b) => b.note - a.note);

  return diversifier(notes, limite, maxParArtiste);
}

/**
 * Deux règles de diversité, sans lesquelles le classement se referme.
 *
 * Un plafond par artiste : sinon un album de douze titres occupe tout l'écran
 * et la découverte devient une page d'artiste.
 *
 * Une place réservée à un inconnu : sans elle, un fan ne voit jamais que les
 * scènes qu'il soutient déjà, et personne de nouveau n'émerge — le défaut
 * classique de ce genre d'algorithme, qui enferme au lieu d'ouvrir.
 */
function diversifier(
  classes: Recommande[],
  limite: number,
  maxParArtiste: number,
): Recommande[] {
  const retenus: Recommande[] = [];
  const compte = new Map<string, number>();

  for (const r of classes) {
    if (retenus.length >= limite) break;
    const n = compte.get(r.artist.id) ?? 0;
    if (n >= maxParArtiste) continue;
    compte.set(r.artist.id, n + 1);
    retenus.push(r);
  }

  const presents = new Set(retenus.map((r) => r.artist.id));
  const inconnu = classes.find((r) => !presents.has(r.artist.id));

  if (inconnu && retenus.length > 3) {
    // À l'avant-dernière place : visible sans prétendre être le meilleur
    // choix, ce qu'il n'est pas.
    retenus.splice(retenus.length - 1, 0, {
      ...inconnu,
      raison: "À découvrir",
    });
    retenus.length = Math.min(retenus.length, limite);
  }

  return retenus;
}
