/**
 * Applique db/schema.sql sur la base Neon.
 * Le fichier est idempotent : relançable autant de fois que nécessaire.
 */
import { readFileSync } from "node:fs";
import { sql } from "./db.mjs";

const file = new URL("../db/schema.sql", import.meta.url);
const source = readFileSync(file, "utf8");

// Le driver HTTP de Neon n'accepte qu'une instruction par requête : on découpe
// sur les points-virgules en fin de ligne, en ignorant commentaires et vide.
const statements = source
  .split(/;\s*$/m)
  .map((s) =>
    s
      .split("\n")
      .filter((l) => !l.trim().startsWith("--"))
      .join("\n")
      .trim(),
  )
  .filter(Boolean);

let applied = 0;
for (const statement of statements) {
  try {
    await sql.query(statement);
    applied++;
  } catch (err) {
    console.error(`\nÉchec sur :\n${statement.slice(0, 160)}…\n`);
    throw err;
  }
}

console.log(`Schéma appliqué — ${applied} instruction(s).`);
