// Garde-fou : refuse le build si une icône d'app est trop lourde.
//
// `src/app/icon.png` et `src/app/apple-icon.png` ne sont pas des fichiers
// statiques. Next.js les transforme en routes et encode le PNG en base64 DANS
// le code du Worker. Un logo en 1024×1024 y ajoutait 2,8 Mio et faisait
// échouer le déploiement Cloudflare sur la limite de 3 Mio du plan gratuit —
// mais l'erreur n'arrivait qu'après quatre minutes de CI, en parlant de
// « handler.mjs », sans jamais nommer les icônes.
//
// Ce script fait tomber la même erreur en deux secondes et en la nommant.
// Il tourne automatiquement avant chaque `npm run build` (script `prebuild`),
// donc aussi dans le CI Cloudflare.

import { stat } from "node:fs/promises";

// Marge large : une icône correcte pèse moins de 20 Kio. Le seuil ne sert pas
// à optimiser au dernier octet, seulement à arrêter un fichier hors norme.
const LIMITE = 64 * 1024;

const FICHIERS = ["src/app/icon.png", "src/app/apple-icon.png"];

const fautifs = [];

for (const fichier of FICHIERS) {
  const taille = await stat(fichier).then((s) => s.size).catch(() => null);
  if (taille === null) continue; // Absent : c'est le problème de Next, pas le nôtre.
  if (taille > LIMITE) fautifs.push({ fichier, taille });
}

if (fautifs.length > 0) {
  const ko = (n) => `${Math.round(n / 1024)} Kio`;

  console.error("\n  Icônes trop lourdes — le build est arrêté ici.\n");
  for (const { fichier, taille } of fautifs) {
    console.error(`    ${fichier}  ${ko(taille)}  (max ${ko(LIMITE)})`);
  }
  console.error(
    "\n  Ces fichiers sont encodés en base64 dans le code du Worker : chaque",
    "\n  octet y compte double, et Cloudflare refuse au-delà de 3 Mio.",
    "\n\n  Pour les régénérer depuis public/icon-1024.png :\n\n      npm run icons\n",
  );
  process.exit(1);
}
