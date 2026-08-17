import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/lib/config";
import { currentUser } from "@/lib/auth";
import { ConnexionView } from "@/components/connexion-view";

export const metadata: Metadata = { title: `Connexion — ${APP_NAME}` };

export const dynamic = "force-dynamic";

export default async function ConnexionPage() {
  // Déjà connecté : rien à faire ici.
  const user = await currentUser().catch(() => null);
  if (user) redirect("/dashboard");

  // Lues à l'exécution et transmises au navigateur, plutôt que figées au
  // build par un préfixe NEXT_PUBLIC_.
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return <ConnexionView supabaseUrl={url ?? ""} supabaseKey={key ?? ""} />;
}
