// Garde-fou : un fichier « use server » ne peut exporter que des fonctions.
//
// Exporter une simple constante depuis un fichier de Server Actions fait
// échouer TOUTES les actions du fichier à l'exécution, avec le message
// « A "use server" file can only export async functions, found object ».
//
// Ni TypeScript ni `next build` ne le voient : le typage est correct et la
// compilation passe. On ne le découvre qu'en cliquant sur Publier, ce qui a
// coûté une publication cassée en production.

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

async function fichiers(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const chemin = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await fichiers(chemin)));
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(chemin);
  }
  return out;
}

const fautes = [];

for (const f of await fichiers("src")) {
  const src = await readFile(f, "utf8");

  // Seule la directive en tête de fichier compte : à l'intérieur d'une
  // fonction, elle ne marque que cette fonction-là.
  if (!/^\s*["']use server["'];/.test(src)) continue;

  for (const m of src.matchAll(/^export\s+(const|let|var|class)\s+(\w+)/gm)) {
    fautes.push({ f, quoi: m[2], genre: m[1] });
  }
  for (const m of src.matchAll(/^export\s+function\s+(\w+)/gm)) {
    fautes.push({ f, quoi: m[1], genre: "function (non async)" });
  }
}

if (fautes.length > 0) {
  console.error('\n  Exports interdits dans un fichier "use server".\n');
  for (const { f, quoi, genre } of fautes) {
    console.error(`    ${f} → ${quoi} (${genre})`);
  }
  console.error(
    "\n  Un tel fichier ne peut exporter que des fonctions asynchrones.",
    "\n  Les `export type` sont permis : ils disparaissent à la compilation.",
    "\n  Déplace les constantes dans src/lib/config.ts.\n",
  );
  process.exit(1);
}
