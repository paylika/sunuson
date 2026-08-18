import { viewer } from "@/lib/auth";
import {
  getBalance,
  getSupportsByArtist,
  getSupportsByUser,
  getTracksByArtist,
  imageUrl,
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
  const { user, artist } = await viewer();

  if (!user) {
    return (
      <Shell>
        <EspaceInvite />
      </Shell>
    );
  }

  if (!artist) {
    // La photo du fan vit dans les métadonnées du compte : rien à stocker
    // ailleurs pour un seul champ.
    const meta = user.user_metadata as {
      avatar_key?: string;
      display_name?: string;
    } | null;

    const soutiens = await getSupportsByUser(user.id);

    return (
      <Shell>
        <EspaceFan
          email={user.email ?? ""}
          nom={meta?.display_name}
          avatarUrl={imageUrl(meta?.avatar_key)}
          soutiens={soutiens}
        />
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
