/** Liste les tables existantes — à lancer avant toute migration. */
import { sql } from "./db.mjs";

const rows = await sql`
  select table_name
  from information_schema.tables
  where table_schema = 'public'
  order by table_name
`;

const version = await sql`select version()`;

console.log(version[0].version.split(",")[0]);
console.log(
  rows.length
    ? `${rows.length} table(s) : ${rows.map((r) => r.table_name).join(", ")}`
    : "Aucune table dans le schéma public — base vierge.",
);
