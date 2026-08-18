import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/lib/config";
import { viewer } from "@/lib/auth";
import { DevenirArtisteView } from "@/components/devenir-artiste-view";
import { Shell } from "@/components/shell";

export const metadata: Metadata = {
  title: `Ouvrir ma page d'artiste — ${APP_NAME}`,
};

export const dynamic = "force-dynamic";

export default async function DevenirArtistePage() {
  const { user, artist } = await viewer();

  if (!user) redirect("/connexion");

  // Un compte, une page. Celui qui en a déjà une est renvoyé à son atelier
  // plutôt que de pouvoir en ouvrir une seconde.
  if (artist) redirect("/dashboard");

  return (
    <Shell>
      <DevenirArtisteView />
    </Shell>
  );
}
