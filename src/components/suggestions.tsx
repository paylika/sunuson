"use client";

import Link from "next/link";
import type { Artist, Track } from "@/lib/types";
import { usePlayer } from "./providers";
import { PlaylistButton } from "./playlist-button";
import { Cover, cx } from "./ui";
import { Pause, Play } from "./icons";

type Item = { track: Track; artist: Artist };

/**
 * Bande de découverte, en bas de la page d'un artiste.
 *
 * Un fan arrive par un lien collé dans WhatsApp, écoute, et repart. C'est le
 * schéma normal ici — mais c'est une occasion perdue : au moment où il a fini
 * d'écouter, il est exactement disposé à en écouter un autre.
 *
 * Défilement horizontal plutôt qu'une grille : une grille dit « voici le
 * catalogue » et demande un choix, une bande dit « il y a autre chose » et se
 * parcourt d'un pouce. On ne cherche pas à faire choisir, on cherche à faire
 * continuer.
 */
export function Suggestions({ items }: { items: Item[] }) {
  const { track: courant, playing, playQueue } = usePlayer();

  if (items.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 className="display text-[20px] font-extrabold">
          À découvrir aussi
        </h2>
        <Link href="/" className="text-[11.5px] font-semibold text-acid-500">
          Tout voir
        </Link>
      </div>

      {/* Les marges négatives font filer la bande d'un bord à l'autre : une
          bande qui s'arrête avant le bord semble finie, et on ne la pousse
          pas. */}
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {items.map(({ track, artist }, i) => {
          const enCours = courant?.id === track.id;
          const enLecture = enCours && playing;

          return (
            <div key={track.id} className="w-[132px] shrink-0">
              <div className="relative">
                <button
                  onClick={() => playQueue(items.map((x) => ({ track: x.track, artist: x.artist })), i)}
                  aria-label={enLecture ? "Pause" : `Écouter ${track.title}`}
                  className="block w-full"
                >
                  <Cover
                    gradient={artist.gradient}
                    src={track.coverUrl}
                    alt={track.title}
                    rounded="rounded-[20px]"
                    className="aspect-square w-full"
                  />
                  <span
                    className={cx(
                      "absolute inset-0 grid place-items-center rounded-[20px] text-white transition",
                      enCours ? "bg-black/45" : "bg-black/20",
                    )}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-black/45 backdrop-blur-md">
                      {enLecture ? <Pause size={16} /> : <Play size={16} />}
                    </span>
                  </span>
                </button>

                {/* Ajouter sans quitter la page ni interrompre l'écoute :
                    c'est le geste qui ramène le fan demain. */}
                <span className="absolute -bottom-1.5 -right-1.5">
                  <PlaylistButton trackId={track.id} size="sm" />
                </span>
              </div>

              <div
                className={cx(
                  "mt-2.5 truncate text-[13px] font-semibold",
                  enCours && "text-acid-500",
                )}
              >
                {track.title}
              </div>
              <Link
                href={`/a/${artist.slug}`}
                className="mt-0.5 block truncate text-[11px] text-fg/40"
              >
                {artist.name}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
