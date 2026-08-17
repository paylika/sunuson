"use client";

import { usePlaylist } from "./providers";
import { cx } from "./ui";
import { Bookmark, BookmarkFilled } from "./icons";

/**
 * Un seul bouton pour les deux sens : il ajoute, et il retire si le morceau
 * y est déjà. Deux boutons distincts obligeraient le fan à se demander lequel
 * s'applique.
 */
export function PlaylistButton({
  trackId,
  size = "md",
  tone = "neutral",
}: {
  trackId: string;
  size?: "sm" | "md";
  tone?: "neutral" | "onMedia";
}) {
  const { has, toggle, ready } = usePlaylist();
  const saved = ready && has(trackId);

  const box = size === "sm" ? "h-9 w-9" : "h-12 w-12";
  const icon = size === "sm" ? 15 : 19;

  return (
    <button
      onClick={(e) => {
        // Sur la page artiste le bouton est dans une ligne cliquable :
        // sans ça, l'ajout déclencherait aussi la lecture.
        e.preventDefault();
        e.stopPropagation();
        toggle(trackId);
      }}
      aria-pressed={saved}
      aria-label={saved ? "Retirer de ma playlist" : "Ajouter à ma playlist"}
      className={cx(
        "grid shrink-0 place-items-center rounded-full transition active:scale-90",
        box,
        saved
          ? "grad-brand text-white"
          : tone === "onMedia"
            ? "bg-black/30 text-white backdrop-blur-md"
            : "glass text-fg/45",
      )}
    >
      {saved ? <BookmarkFilled size={icon} /> : <Bookmark size={icon} />}
    </button>
  );
}
