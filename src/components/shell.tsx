import type { ReactNode } from "react";
import { BottomNav } from "./bottom-nav";
import { MiniPlayer } from "./player-ui";
import { PlayerSheet } from "./player-sheet";

/**
 * Cadre commun : colonne mobile centrée, nav flottante, lecteur persistant.
 * Le padding bas dégage la hauteur de la nav ET du mini-lecteur, sinon le
 * dernier élément de chaque page reste inatteignable.
 */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-[480px] px-4 pb-52 pt-5">
      {children}
      <MiniPlayer />
      <BottomNav />
      <PlayerSheet />
    </div>
  );
}
