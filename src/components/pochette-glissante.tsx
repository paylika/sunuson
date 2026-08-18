"use client";

import { useRef, useState } from "react";
import type { Artist, Track } from "@/lib/types";
import { Cover, cx } from "./ui";
import { Lock } from "./icons";

type Item = { track: Track; artist: Artist };

/**
 * La pochette est la commande.
 *
 * On la fait glisser pour changer de morceau, et la suivante se devine
 * derrière, légèrement plus petite et en retrait. C'est ce décalage qui
 * apprend le geste : personne ne devine qu'une image est glissable, tout le
 * monde comprend qu'une pile se pousse.
 *
 * Le geste ne remplace pas la file dépliable — il la complète. Glisser, c'est
 * « suivant » sans réfléchir ; ouvrir la file, c'est choisir. Un auditeur qui
 * découvre veut le premier, un auditeur qui cherche un titre précis veut le
 * second.
 */
export function PochetteGlissante({
  courant,
  suivant,
  precedent,
  verrouille,
  onSuivant,
  onPrecedent,
}: {
  courant: Item;
  suivant?: Item;
  precedent?: Item;
  verrouille: boolean;
  onSuivant: () => void;
  onPrecedent: () => void;
}) {
  const [dx, setDx] = useState(0);
  const [glisse, setGlisse] = useState(false);
  const depart = useRef<{ x: number; y: number } | null>(null);
  // Un geste vertical est un défilement de page, pas un changement de son :
  // une fois qu'on a tranché, on ne revient pas dessus pendant le même geste.
  const axe = useRef<"indecis" | "horizontal" | "vertical">("indecis");
  const boite = useRef<HTMLDivElement>(null);

  const largeur = boite.current?.offsetWidth ?? 300;
  // Un quart de la pochette : assez pour ne pas déclencher par accident,
  // assez peu pour ne pas forcer un grand balayage au pouce.
  const seuil = largeur * 0.25;

  function commencer(e: React.PointerEvent) {
    if (!suivant && !precedent) return;
    depart.current = { x: e.clientX, y: e.clientY };
    axe.current = "indecis";
    setGlisse(true);
  }

  function bouger(e: React.PointerEvent) {
    if (!depart.current) return;

    const ex = e.clientX - depart.current.x;
    const ey = e.clientY - depart.current.y;

    if (axe.current === "indecis") {
      if (Math.abs(ex) < 8 && Math.abs(ey) < 8) return;
      axe.current = Math.abs(ex) > Math.abs(ey) ? "horizontal" : "vertical";
    }
    if (axe.current === "vertical") return;

    // On retient le geste quand il n'y a rien de ce côté-là : la pochette
    // résiste au lieu de partir dans le vide.
    const mur = (ex < 0 && !suivant) || (ex > 0 && !precedent);
    setDx(mur ? ex * 0.18 : ex);
  }

  function finir() {
    if (!depart.current) return;
    depart.current = null;
    setGlisse(false);

    if (axe.current === "horizontal") {
      if (dx <= -seuil && suivant) onSuivant();
      else if (dx >= seuil && precedent) onPrecedent();
    }
    setDx(0);
  }

  const avancement = Math.min(1, Math.abs(dx) / (seuil * 2));
  const versSuivant = dx < 0;
  const derriere = versSuivant ? suivant : precedent;

  return (
    <div className="flex justify-center">
      <div
        ref={boite}
        className="relative w-full max-w-[300px] touch-pan-y select-none"
        onPointerDown={commencer}
        onPointerMove={bouger}
        onPointerUp={finir}
        onPointerCancel={finir}
      >
        {/* Carte du dessous : elle grandit à mesure qu'on pousse celle du
            dessus, ce qui donne la sensation de la découvrir plutôt que de la
            voir apparaître. */}
        {derriere && (
          <div
            className="absolute inset-0"
            style={{
              transform: `scale(${0.9 + avancement * 0.1}) translateY(${(1 - avancement) * 14}px)`,
              opacity: 0.35 + avancement * 0.65,
            }}
          >
            <Cover
              gradient={derriere.artist.gradient}
              src={derriere.track.coverUrl}
              alt=""
              rounded="rounded-[32px]"
              className="aspect-square w-full"
            />
          </div>
        )}

        <div
          className={cx(
            "relative",
            // Aucune transition pendant le geste : la pochette doit coller au
            // doigt. Elle n'en reprend une qu'au relâchement, pour revenir.
            !glisse && "transition-transform duration-300",
          )}
          style={{
            transform: `translateX(${dx}px) rotate(${dx * 0.02}deg)`,
            opacity: 1 - avancement * 0.35,
          }}
        >
          <Cover
            gradient={courant.artist.gradient}
            src={courant.track.coverUrl}
            alt={courant.track.title}
            rounded="rounded-[32px]"
            className="aspect-square w-full shadow-[0_40px_80px_-30px_rgba(0,0,0,.8)]"
          />

          {verrouille && (
            <div className="absolute inset-0 grid place-items-center rounded-[32px] bg-black/55 backdrop-blur-sm">
              <div className="text-center text-white">
                <Lock size={26} className="mx-auto" />
                <p className="mt-2 text-[12.5px] font-semibold">
                  Réservé aux soutiens
                </p>
              </div>
            </div>
          )}
        </div>

        {/* L'indice n'apparaît qu'une fois : dès qu'on a glissé une fois, on
            a compris, et un mode d'emploi permanent devient du bruit. */}
        {(suivant || precedent) && dx === 0 && (
          <p className="pointer-events-none absolute inset-x-0 -bottom-6 text-center text-[10.5px] text-fg/25">
            Glisse la pochette pour changer de son
          </p>
        )}
      </div>
    </div>
  );
}
