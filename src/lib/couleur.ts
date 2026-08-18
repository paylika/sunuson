"use client";

/**
 * Couleur d'ambiance tirée de la pochette.
 *
 * Le lecteur plein écran baignait dans le dégradé stocké de l'artiste — un
 * violet hérité de l'ancienne palette. Sur une pochette en noir et blanc, le
 * résultat était faux : l'écran teintait une image qui n'a aucune couleur.
 *
 * On lit donc la pochette elle-même. Une image en noir et blanc donne un gris,
 * une pochette rouge donne un rouge sombre : l'ambiance suit toujours ce qu'on
 * regarde.
 *
 * Le stockage renvoie `Access-Control-Allow-Origin: *`, ce qui autorise la
 * lecture des pixels. Si un jour ce n'était plus le cas, l'extraction échoue
 * proprement et on retombe sur le dégradé de l'artiste.
 */

export type Ambiance = [string, string];

const TAILLE = 24;

/** Cache par URL : la même pochette revient à chaque ouverture du lecteur. */
const cache = new Map<string, Ambiance | null>();

export async function ambianceDe(url: string): Promise<Ambiance | null> {
  const vu = cache.get(url);
  if (vu !== undefined) return vu;

  const resultat = await extraire(url).catch(() => null);
  cache.set(url, resultat);
  return resultat;
}

async function extraire(url: string): Promise<Ambiance | null> {
  const img = new Image();
  img.crossOrigin = "anonymous";

  // Paramètre inutile mais indispensable.
  //
  // La pochette est déjà affichée par une balise <img> ordinaire, donc
  // chargée SANS en-tête CORS. Sans ce paramètre, notre seconde requête tombe
  // sur cette entrée de cache et le navigateur refuse d'en lire les pixels :
  // l'extraction échoue en silence et le fond reste sur sa couleur de repli.
  // Une adresse légèrement différente force une entrée de cache distincte,
  // demandée en CORS dès le départ.
  img.src = `${url}${url.includes("?") ? "&" : "?"}ambiance=1`;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("image illisible"));
  });

  const canvas = document.createElement("canvas");
  canvas.width = TAILLE;
  canvas.height = TAILLE;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, TAILLE, TAILLE);
  const { data } = ctx.getImageData(0, 0, TAILLE, TAILLE);

  let r = 0;
  let v = 0;
  let b = 0;
  let poids = 0;

  for (let i = 0; i < data.length; i += 4) {
    const [pr, pv, pb] = [data[i], data[i + 1], data[i + 2]];
    const max = Math.max(pr, pv, pb);
    const min = Math.min(pr, pv, pb);

    // Les pixels colorés pèsent plus que les gris : sur une pochette
    // majoritairement sombre, c'est le peu de couleur qui donne son
    // caractère. Le poids plancher garantit qu'une image entièrement grise
    // reste prise en compte plutôt que de ne rien produire.
    const saturation = max === 0 ? 0 : (max - min) / max;
    const p = 0.25 + saturation * 2;

    r += pr * p;
    v += pv * p;
    b += pb * p;
    poids += p;
  }

  if (poids === 0) return null;

  const [h, s] = versTSL(r / poids, v / poids, b / poids);

  // Luminosité imposée, teinte conservée. Sans ce plafond, une pochette
  // claire produirait un fond laiteux sur lequel le texte blanc disparaît.
  // Saturation bridée pour la même raison : un fond fluo mangerait l'acide,
  // qui est la seule couleur vive à laquelle on tient.
  const sat = Math.min(s, 0.55);

  return [depuisTSL(h, sat, 0.26), depuisTSL(h, sat * 0.8, 0.09)];
}

function versTSL(r: number, v: number, b: number): [number, number] {
  const [rn, vn, bn] = [r / 255, v / 255, b / 255];
  const max = Math.max(rn, vn, bn);
  const min = Math.min(rn, vn, bn);
  const delta = max - min;

  if (delta === 0) return [0, 0];

  const l = (max + min) / 2;
  const s = delta / (1 - Math.abs(2 * l - 1));

  let h: number;
  if (max === rn) h = ((vn - bn) / delta) % 6;
  else if (max === vn) h = (bn - rn) / delta + 2;
  else h = (rn - vn) / delta + 4;

  return [(h * 60 + 360) % 360, Math.min(1, s)];
}

function depuisTSL(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  const [r, v, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];

  const hex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${hex(r)}${hex(v)}${hex(b)}`;
}
