/** Compte ce qu'il y a réellement en base. */
import { supabase } from "./db.mjs";

let missing = false;

for (const table of ["artists", "tracks", "clips", "supports", "payouts"]) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) {
    console.log(`${table.padEnd(10)} : ⚠ ${error.message}`);
    missing = true;
    continue;
  }
  console.log(`${table.padEnd(10)} : ${count}`);
}

if (missing) {
  console.log(
    "\nTables absentes : colle supabase/schema.sql dans le SQL Editor du projet.",
  );
  process.exit(1);
}

const { data } = await supabase
  .from("supports")
  .select("amount")
  .eq("status", "paid");

console.log(
  `\nEncaissé (paid) : ${(data ?? []).reduce((s, r) => s + r.amount, 0)} FCFA`,
);
