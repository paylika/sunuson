import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { getArtists, getBalances } from "@/lib/queries";
import { LandingView } from "@/components/landing-view";

export const metadata: Metadata = {
  title: `${APP_NAME} — Tes fans écoutent gratuitement, toi tu es payé`,
  description:
    "Dépose tes sons, partage ton lien, reçois de l'argent de tes fans par Wave ou Orange Money. Gratuit, sans exclusivité, tu gardes tes droits.",
};

export const dynamic = "force-dynamic";

export default async function ArtistesPage() {
  // La preuve vient des vrais artistes inscrits, pas de témoignages écrits.
  // Une page qui se vante sans montrer personne ne convainc aucun rappeur.
  const [artists, balances] = await Promise.all([getArtists(), getBalances()]);

  const preuve = artists
    .map((artist) => ({
      artist,
      count: balances.get(artist.id)?.supportCount ?? 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return <LandingView preuve={preuve} total={artists.length} />;
}
