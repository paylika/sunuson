import type { ReactNode } from "react";
import { viewer } from "@/lib/auth";
import { BottomNav } from "./bottom-nav";
import { MiniPlayer } from "./player-ui";
import { PlayerSheet } from "./player-sheet";

/**
 * Cadre commun : colonne mobile centrée, nav flottante, lecteur persistant.
 * Le padding bas dégage la hauteur de la nav ET du mini-lecteur, sinon le
 * dernier élément de chaque page reste inatteignable.
 *
 * La coquille lit la session pour que la barre sache à qui elle s'adresse.
 * Un artiste n'a pas les mêmes gestes qu'un fan, et une seule barre pour les
 * deux les servait mal tous les deux. La lecture est mise en cache pour la
 * requête, donc la page qui a déjà besoin de l'artiste ne la refait pas.
 */
export async function Shell({ children }: { children: ReactNode }) {
  const { artist } = await viewer();

  return (
    <div className="relative mx-auto w-full max-w-[480px] px-4 pb-52 pt-5">
      {children}
      <MiniPlayer />
      <BottomNav estArtiste={!!artist} />
      <PlayerSheet />
    </div>
  );
}
