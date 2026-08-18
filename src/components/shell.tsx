import { Suspense, type ReactNode } from "react";
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
    // 480 px est la bonne largeur pour un pouce, pas pour un écran de
    // portable : au-delà, la colonne s'élargit un peu et les grilles passent
    // à trois colonnes. On ne bascule pas sur une mise en page de bureau —
    // l'application reste la même, elle cesse juste d'être une bande étroite
    // perdue au milieu du vide.
    <div className="relative mx-auto w-full max-w-[480px] px-4 pb-52 pt-5 md:max-w-[680px] md:px-6">
      {children}
      <MiniPlayer />
      {/* La barre lit les paramètres d'adresse pour savoir si « Publier » est
          l'écran en cours. Next exige alors une frontière de suspense, sans
          quoi toute page qui l'inclut devient impossible à prérendre. */}
      <Suspense fallback={<div className="h-24" />}>
        <BottomNav estArtiste={!!artist} />
      </Suspense>
      <PlayerSheet />
    </div>
  );
}
