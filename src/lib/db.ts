// `server-only` fait échouer la compilation si ce module est importé depuis un
// composant client. C'est le garde-fou qui empêche DATABASE_URL de fuiter dans
// le bundle du navigateur : avec Neon il n'y a plus de RLS, donc la chaîne de
// connexion est la seule chose qui protège la base.
import "server-only";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL manquant. Renseigne-le dans .env.local (voir .env.example).",
  );
}

export const sql = neon(process.env.DATABASE_URL);
