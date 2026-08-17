// `server-only` fait échouer la compilation si ce module est importé depuis un
// composant client. C'est le garde-fou qui empêche la clé service_role — qui
// contourne toute la RLS — de finir dans le bundle du navigateur.
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Aucune variable n'est préfixée NEXT_PUBLIC_, et c'est délibéré : Next fige
 * les NEXT_PUBLIC_ au moment du build. Elles devraient donc être présentes
 * dans le CI, et les redéfinir à l'exécution n'aurait aucun effet. Sans
 * préfixe, elles sont lues à chaque requête depuis l'environnement du Worker.
 *
 * Les anciens noms restent acceptés pour ne pas casser un .env.local existant.
 */
function env(name: string): string | undefined {
  return process.env[name] || process.env[`NEXT_PUBLIC_${name}`];
}

let readClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

/**
 * Client de LECTURE, avec la clé publique — donc soumis à la RLS, même ici
 * côté serveur. C'est volontaire : si une policy est mal écrite, la fuite
 * reste bornée à ce que le public a déjà le droit de voir.
 *
 * L'initialisation est paresseuse. Une création au chargement du module ferait
 * échouer `next build` : Next importe les routes pour collecter les données de
 * page, bien avant qu'une requête n'existe.
 */
export function supabase(): SupabaseClient {
  if (readClient) return readClient;

  const url = env("SUPABASE_URL");
  const anonKey = env("SUPABASE_ANON_KEY");

  if (!url || !anonKey) {
    throw new Error(
      "SUPABASE_URL et SUPABASE_ANON_KEY sont requis. Voir .env.example.",
    );
  }

  readClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return readClient;
}

/**
 * Client d'ÉCRITURE. Il contourne toute la RLS.
 *
 * Réservé à un seul usage : le webhook de l'agrégateur de paiement, qui fait
 * passer un soutien en 'paid'. Ne jamais l'appeler depuis une Server Action
 * déclenchable par le navigateur — ce serait rouvrir la porte aux faux
 * soutiens.
 */
export function supabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;

  const url = env("SUPABASE_URL");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis. Voir .env.example.",
    );
  }

  adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}
