// Pose une pochette fictive sur chaque morceau de démonstration qui n'en a pas.
//
// Sans image, ces morceaux tombent sur un dégradé de repli : on ne peut donc
// pas juger l'ambiance du lecteur, qui tire sa couleur des pixels de la
// pochette. Les teintes sont choisies très différentes les unes des autres,
// avec un noir et blanc dans le lot, pour éprouver l'extraction sur tous les
// cas — y compris celui d'une pochette sans aucune couleur.
//
//   node scripts/covers-demo.mjs
//
// Ne touche jamais un morceau qui a déjà une pochette : les vraies sorties
// des artistes ne doivent pas être écrasées.

import { readFile } from "node:fs/promises";
import sharp from "sharp";

const env = Object.fromEntries(
  (await readFile(".env.local", "utf8"))
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);

const URL_BASE = env.SUPABASE_URL;
const CLE = env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_BASE || !CLE) {
  console.error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  process.exit(1);
}

const entetes = { apikey: CLE, Authorization: `Bearer ${CLE}` };

/**
 * Palettes délibérément contrastées entre elles. La dernière est grise :
 * c'est le cas qui a révélé le défaut d'origine, où le lecteur teintait de
 * violet une pochette en noir et blanc.
 */
const PALETTES = [
  { haut: "#ff3b30", bas: "#7a0e28", encre: "#ffffff" },
  { haut: "#0a84ff", bas: "#062a5e", encre: "#ffffff" },
  { haut: "#ffd60a", bas: "#7a5b00", encre: "#1a1400" },
  { haut: "#30d158", bas: "#0b3d1d", encre: "#052012" },
  { haut: "#ff9f0a", bas: "#6b3a00", encre: "#2a1600" },
  { haut: "#bf5af2", bas: "#3d1258", encre: "#ffffff" },
  { haut: "#64d2ff", bas: "#0b3a4d", encre: "#03202b" },
  { haut: "#ff375f", bas: "#5c0a1e", encre: "#ffffff" },
  { haut: "#a1a1a6", bas: "#1c1c1e", encre: "#ffffff" },
];

/** Initiales du titre : deux lettres suffisent à distinguer les pochettes. */
function initiales(titre) {
  const mots = titre.replace(/[^\p{L}\p{N} ]/gu, " ").split(/\s+/).filter(Boolean);
  if (mots.length === 0) return "SN";
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
  return (mots[0][0] + mots[1][0]).toUpperCase();
}

function svg({ haut, bas, encre }, texte, graine) {
  // Formes déduites du titre : deux pochettes voisines ne doivent pas se
  // ressembler, sinon on ne sait plus laquelle on écoute.
  const r = 380 + (graine % 5) * 60;
  const cx = 300 + (graine % 7) * 60;
  const cy = 340 + (graine % 3) * 120;

  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
  <defs>
    <linearGradient id="f" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="${haut}"/>
      <stop offset="1" stop-color="${bas}"/>
    </linearGradient>
  </defs>
  <rect width="1000" height="1000" fill="url(#f)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${encre}" opacity="0.10"/>
  <circle cx="${1000 - cx}" cy="${1000 - cy}" r="${r * 0.6}" fill="${encre}" opacity="0.07"/>
  <text x="500" y="560" text-anchor="middle"
        font-family="Helvetica, Arial, sans-serif" font-size="300" font-weight="700"
        fill="${encre}" opacity="0.92">${texte}</text>
</svg>`);
}

async function json(chemin, options = {}) {
  const res = await fetch(`${URL_BASE}${chemin}`, {
    ...options,
    headers: { ...entetes, ...(options.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

const tracks = await json(
  "/rest/v1/tracks?select=id,title,cover_key,artist_id&cover_key=is.null&order=title",
);

// Pas de sortie anticipée : les artistes se traitent plus bas, et ils peuvent
// manquer de portrait alors que tous les morceaux ont déjà leur pochette.
console.log(
  tracks.length === 0
    ? "Tous les morceaux ont déjà une pochette."
    : `${tracks.length} morceaux sans pochette.
`,
);

let i = 0;
for (const t of tracks) {
  const palette = PALETTES[i % PALETTES.length];
  const image = await sharp(svg(palette, initiales(t.title), i))
    .jpeg({ quality: 88 })
    .toBuffer();

  const cle = `demo/${t.id}.jpg`;

  const up = await fetch(
    `${URL_BASE}/storage/v1/object/covers/${cle}`,
    {
      method: "POST",
      headers: { ...entetes, "content-type": "image/jpeg", "x-upsert": "true" },
      body: image,
    },
  );
  if (!up.ok) {
    console.error(`  ✗ ${t.title} — dépôt : ${up.status} ${await up.text()}`);
    i++;
    continue;
  }

  await json(`/rest/v1/tracks?id=eq.${t.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ cover_key: cle }),
  });

  console.log(`  ✓ ${t.title.padEnd(30)} ${palette.haut}`);
  i++;
}

console.log("\nTerminé.");

/* ------------------------------------------------------------ artistes */

/**
 * Portrait et bannière.
 *
 * Sans eux, les cartes de Découvrir sont des rectangles vides : la page a
 * l'air d'un catalogue en rupture, et rien ne distingue un artiste d'un autre.
 * Le dégradé stocké est refait au passage pour s'accorder aux images — il
 * datait de l'ancienne palette et tirait au violet sur tout le monde.
 */
function svgPortrait({ haut, bas, encre }, texte) {
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="p" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0" stop-color="${haut}"/>
      <stop offset="1" stop-color="${bas}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#p)"/>
  <circle cx="300" cy="250" r="120" fill="${encre}" opacity="0.14"/>
  <path d="M120 600c0-100 80-180 180-180s180 80 180 180Z" fill="${encre}" opacity="0.14"/>
  <text x="300" y="330" text-anchor="middle"
        font-family="Helvetica, Arial, sans-serif" font-size="150" font-weight="700"
        fill="${encre}" opacity="0.9">${texte}</text>
</svg>`);
}

function svgBanniere({ haut, bas, encre }, graine) {
  const x = 200 + (graine % 5) * 160;
  const barres = Array.from({ length: 26 }, (_, i) => {
    const h = 40 + ((i * 37 + graine * 13) % 200);
    return `<rect x="${60 + i * 42}" y="${560 - h / 2}" width="16" height="${h}" rx="8"/>`;
  }).join("");

  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="b" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${haut}"/>
      <stop offset="1" stop-color="${bas}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#b)"/>
  <circle cx="${x}" cy="240" r="320" fill="${encre}" opacity="0.10"/>
  <circle cx="${1200 - x}" cy="620" r="240" fill="${encre}" opacity="0.08"/>
  <g fill="${encre}" opacity="0.16">${barres}</g>
</svg>`);
}

const artistes = await json(
  "/rest/v1/artists?select=id,name,avatar_key,cover_key&avatar_key=is.null",
);

if (artistes.length === 0) {
  console.log("Tous les artistes ont déjà un portrait.");
} else {
  console.log(`\n${artistes.length} artistes sans portrait.\n`);
}

let a = 0;
for (const art of artistes) {
  const palette = PALETTES[(a + 3) % PALETTES.length];

  const images = [
    ["portrait", "avatar_key", svgPortrait(palette, initiales(art.name)), 88],
    ["banniere", "cover_key", svgBanniere(palette, a), 86],
  ];

  for (const [genre, colonne, svgSource, qualite] of images) {
    const image = await sharp(svgSource).jpeg({ quality: qualite }).toBuffer();
    const cle = `demo/artistes/${art.id}-${genre}.jpg`;

    const up = await fetch(`${URL_BASE}/storage/v1/object/covers/${cle}`, {
      method: "POST",
      headers: { ...entetes, "content-type": "image/jpeg", "x-upsert": "true" },
      body: image,
    });
    if (!up.ok) {
      console.error(`  ✗ ${art.name} ${genre} : ${up.status} ${await up.text()}`);
      continue;
    }

    await json(`/rest/v1/artists?id=eq.${art.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ [colonne]: cle }),
    });
  }

  // Le dégradé de repli s'accorde aux images : sans ça, une image absente
  // ferait réapparaître le violet de l'ancienne palette.
  await json(`/rest/v1/artists?id=eq.${art.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      gradient_from: palette.haut,
      gradient_to: palette.bas,
    }),
  });

  console.log(`  ✓ ${art.name.padEnd(20)} ${palette.haut}`);
  a++;
}

console.log("\nTerminé.");
