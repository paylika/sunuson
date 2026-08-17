import { currentUser } from "@/lib/auth";
import {
  getArtistByUser,
  getBalance,
  getSupportsByArtist,
  getTracksByArtist,
} from "@/lib/queries";
import { DashboardView } from "@/components/dashboard-view";
import { EspaceFan, EspaceHeader, EspaceInvite } from "@/components/espace-view";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

/**
 * « Mon espace » — un seul onglet, trois écrans selon qui regarde.
 *
 * Avant, cette page montrait toujours l'artiste de démonstration à qui la
 * demandait : n'importe quel visiteur voyait les revenus de Ndiaga Flow et
 * pouvait publier en son nom. C'est la session qui décide maintenant.
 */
export default async function EspacePage() {
  const user = await currentUser();

  if (!user) {
    return (
      <Shell>
        <EspaceInvite />
      </Shell>
    );
  }

  const artist = await getArtistByUser(user.id);

  if (!artist) {
    return (
      <Shell>
        <EspaceFan email={user.email ?? ""} />
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
      <EspaceHeader titre="Mon espace" sous={artist.name} />
      <DashboardView
        artist={artist}
        tracks={tracks}
        supports={supports}
        balance={balance}
      />
    </Shell>
  );
}
