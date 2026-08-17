/**
 * Utilitaire partagé par les scripts. Charge .env.local et expose un client
 * Supabase admin — le seed écrit dans des tables sans policy d'insertion,
 * il lui faut donc la clé service_role.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

try {
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i);
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  console.error("Pas de .env.local. Copie .env.example et renseigne-le.");
  process.exit(1);
}

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key || key.includes("A_REMPLIR")) {
  console.error(
    "SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être renseignés\n" +
      "dans .env.local (Dashboard > Project Settings > API).",
  );
  process.exit(1);
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
