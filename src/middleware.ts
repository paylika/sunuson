import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Rafraîchit la session à chaque navigation.
 *
 * Sans ça, le jeton expire et l'utilisateur est déconnecté au bout d'une
 * heure sans comprendre pourquoi. C'est le seul endroit où les cookies de
 * session peuvent être réécrits — un composant serveur ne le peut pas.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sans configuration, on laisse simplement passer : l'application publique
  // doit rester consultable même si l'authentification n'est pas branchée.
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    // Tout sauf les fichiers statiques et les images.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.svg|.*\\.(?:png|jpg|jpeg|svg|webp)$).*)",
  ],
};
