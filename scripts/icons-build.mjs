// Fabrique les icônes servies à partir du logo maître.
//
// Pourquoi ce script existe : `src/app/icon.png` et `src/app/apple-icon.png`
// ne sont pas de simples fichiers statiques. Next.js les transforme en routes
// et encode le PNG en base64 DANS le code du Worker. Y laisser le logo en
// 1024×1024 ajoutait 2,8 Mio au serveur et faisait dépasser la limite de
// 3 Mio de Cloudflare. Chaque octet de trop y compte double.
//
//   node scripts/icons-build.mjs
//
// À relancer si tu changes le logo dans design/.

import sharp from "sharp";
import { readFile, stat } from "node:fs/promises";

const SOURCE = "public/icon-1024.png";

// Le favicon est affiché à 16 ou 32 px. 64 couvre les écrans à forte densité
// sans rien coûter. L'icône iOS a une taille imposée : 180.
const CIBLES = [
  { fichier: "src/app/icon.png", taille: 64 },
  { fichier: "src/app/apple-icon.png", taille: 180 },
  // Servi tel quel depuis /public : la tuile de l'interface, affichée entre
  // 40 et 72 px, donc 192 suffit largement même en retina.
  { fichier: "public/icon-192.png", taille: 192 },
];

const source = await readFile(SOURCE);

for (const { fichier, taille } of CIBLES) {
  const avant = await stat(fichier).then((s) => s.size).catch(() => 0);

  await sharp(source)
    .resize(taille, taille, { fit: "cover" })
    // La transparence du détourage doit survivre : pas d'aplat de fond.
    .png({ compressionLevel: 9, palette: true })
    .toFile(fichier);

  const apres = (await stat(fichier)).size;
  const ko = (n) => `${Math.round(n / 1024)} Kio`;
  console.log(`${fichier.padEnd(28)} ${taille}px   ${ko(avant)} -> ${ko(apres)}`);
}
