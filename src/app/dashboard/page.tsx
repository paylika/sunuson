import { DEMO_ARTIST_SLUG } from "@/lib/config";
import {
  getArtistBySlug,
  getBalance,
  getSupportsByArtist,
  getTracksByArtist,
} from "@/lib/queries";
import { DashboardView } from "@/components/dashboard-view";
import { Shell } from "@/components/shell";
import { Glass } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Pas encore d'authentification : le dashboard montre toujours le même
  // artiste. À remplacer par celui de la session connectée.
  const artist = await getArtistBySlug(DEMO_ARTIST_SLUG);

  if (!artist) {
    return (
      <Shell>
        <Glass className="mt-10 px-5 py-8 text-center">
          <p className="text-[14px] font-medium">Aucun artiste en base.</p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-fg/50">
            Lance <code className="text-brand-300">npm run db:seed</code> pour
            charger les données de démonstration.
          </p>
        </Glass>
      </Shell>
    );
  }

  const [tracks, supports, balance] = await Promise.all([
    getTracksByArtist(artist.id),
    getSupportsByArtist(artist.id),
    getBalance(artist.id),
  ]);

  return (
    <Shell>
      <DashboardView
        artist={artist}
        tracks={tracks}
        supports={supports}
        balance={balance}
      />
    </Shell>
  );
}
