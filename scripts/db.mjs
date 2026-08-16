/**
 * Utilitaire partagé par les scripts de base de données.
 * Charge .env.local et expose une connexion Neon.
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  // dotenv/config ne lit que .env : on complète avec .env.local.
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
      if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* pas de .env.local */
  }
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL manquant. Renseigne-le dans .env.local.");
  process.exit(1);
}

export const sql = neon(process.env.DATABASE_URL);
