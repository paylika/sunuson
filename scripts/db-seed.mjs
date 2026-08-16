/** Insère les données de démonstration. Idempotent. */
import { readFileSync } from "node:fs";
import { sql } from "./db.mjs";

const source = readFileSync(new URL("../db/seed.sql", import.meta.url), "utf8");

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

for (const statement of statements) await sql.query(statement);

const [{ artists, tracks, clips, supports, gross }] = await sql`
  select
    (select count(*) from artists)  as artists,
    (select count(*) from tracks)   as tracks,
    (select count(*) from clips)    as clips,
    (select count(*) from supports) as supports,
    (select coalesce(sum(amount), 0) from supports where status = 'paid') as gross
`;

console.log(
  `Seed OK — ${artists} artistes, ${tracks} sons, ${clips} clips, ` +
    `${supports} soutiens (${gross} FCFA encaissés).`,
);
