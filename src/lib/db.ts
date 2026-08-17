// `server-only` fait échouer la compilation si ce module est importé depuis un
// composant client. Sans ce garde-fou, la clé service_role — qui contourne
// toute la RLS — pourrait finir dans le bundle du navigateur.
import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont requis. " +
      "Voir .env.example.",
  );
}

/**
 * Client de LECTURE. Il utilise la clé publique, donc la RLS s'applique —
 * même ici, côté serveur. C'est volontaire : si une policy est mal écrite, la
 * fuite reste bornée à ce que le public a déjà le droit de voir.
 */
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Client d'ÉCRITURE. Il contourne toute la RLS.
 *
 * Réservé à un seul usage : la route serveur qui reçoit le webhook de
 * l'agrégateur de paiement et fait passer un soutien en 'paid'. Ne jamais
 * l'appeler depuis une Server Action déclenchable par le navigateur — ce
 * serait rouvrir la porte aux faux soutiens.
 */
export function supabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY manquant. Voir .env.example.");
  }
  return createClient(url!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
