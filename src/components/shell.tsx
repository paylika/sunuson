import type { ReactNode } from "react";
import { BottomNav } from "./bottom-nav";
import { MiniPlayer } from "./player-ui";

/** Cadre commun : colonne mobile centrée, nav flottante, lecteur persistant. */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-[480px] px-4 pb-44 pt-5">
      {children}
      <MiniPlayer />
      <BottomNav />
    </div>
  );
}
