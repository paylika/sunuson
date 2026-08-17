import { NextResponse } from "next/server";
import { supabaseSession } from "@/lib/auth";

/**
 * Retour du lien de connexion envoyé par courriel.
 *
 * Le lien contient un code à usage unique qu'on échange ici contre une
 * session. L'échange doit se faire côté serveur : c'est le seul endroit qui
 * peut écrire les cookies de session.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const suite = url.searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(
      new URL("/connexion?erreur=lien_invalide", url.origin),
    );
  }

  const supabase = await supabaseSession();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Lien déjà utilisé ou expiré : on renvoie vers l'écran de connexion
    // plutôt que d'afficher une erreur brute.
    return NextResponse.redirect(
      new URL("/connexion?erreur=lien_expire", url.origin),
    );
  }

  return NextResponse.redirect(new URL(suite, url.origin));
}
