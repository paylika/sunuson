"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { playlistTracks } from "@/lib/actions";
import { compact, duration } from "@/lib/format";
import type { Artist, Track } from "@/lib/types";
import { usePlayer, usePlaylist, useUnlock } from "./providers";
import { PlaylistButton } from "./playlist-button";
import { SupportSheet } from "./support-sheet";
import { Cover, cx, Glass } from "./ui";
import { Bookmark, ChevronRight, Lock, Pause, Play, Spark } from "./icons";

type Entry = { track: Track; artist: Artist };

export function PlaylistView() {
  const { ids, ready } = usePlaylist();
  const { track: current, playing, toggle } = usePlayer();
  const { isUnlocked } = useUnlock();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState<Entry | null>(null);

  // `ids.join()` plutôt que `ids` : le tableau change d'identité à chaque
  // rendu du provider, la chaîne ne change que si le contenu change.
  const key = ids.join(",");

  useEffect(() => {
    if (!ready) return;
    let annule = false;

    if (ids.length === 0) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    playlistTracks(ids)
      .then((list) => {
        if (!annule) setEntries(list as Entry[]);
      })
      .finally(() => {
        if (!annule) setLoading(false);
      });

    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);

  return (
    <>
      <header className="mb-5">
        <h1 className="text-[27px] font-bold">Ma playlist</h1>
        <p className="mt-1 text-[12.5px] text-fg/45">
          {ready && !loading
            ? entries.length === 0
              ? "Aucun son enregistré"
              : `${entries.length} son${entries.length > 1 ? "s" : ""} · gardés sur cet appareil`
            : "Chargement…"}
        </p>
      </header>

      {loading || !ready ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-2xl bg-fg/[.05]" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <Glass className="rounded-[26px] px-6 py-10 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/10 text-brand-300">
            <Bookmark size={24} />
          </span>
          <p className="mt-4 text-[14.5px] font-semibold">
            Ta playlist est vide
          </p>
          <p className="mx-auto mt-1.5 max-w-[280px] text-[12.5px] leading-relaxed text-fg/45">
            Touche le signet sur un son pour le garder ici. La liste reste sur
            ton téléphone, sans compte.
          </p>
          <Link
            href="/decouvrir"
            className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-full grad-brand px-6 text-[14.5px] font-semibold text-white glow-brand active:scale-[.98]"
          >
            Découvrir des artistes
            <ChevronRight size={16} />
          </Link>
        </Glass>
      ) : (
        <div className="space-y-0.5">
          {entries.map(({ track, artist }) => {
            const locked = track.locked && !isUnlocked(track.id);
            const isCurrent = current?.id === track.id;
            const isPlaying = isCurrent && playing;

            return (
              <div
                key={track.id}
                className={cx(
                  "group flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition",
                  isCurrent ? "bg-fg/[.06]" : "hover:bg-fg/[.03]",
                )}
              >
                <button
                  onClick={() =>
                    locked
                      ? setSheet({ track, artist })
                      : toggle(track, artist)
                  }
                  aria-label={
                    locked ? "Débloquer" : isPlaying ? "Pause" : "Lecture"
                  }
                  className="relative shrink-0"
                >
                  <Cover
                    gradient={artist.gradient}
                    src={track.coverUrl}
                    rounded="rounded-2xl"
                    className="h-13 w-13"
                  />
                  <span
                    className={cx(
                      "absolute inset-0 grid place-items-center rounded-2xl text-white transition",
                      locked ? "bg-black/55" : "bg-black/35",
                    )}
                  >
                    {locked ? (
                      <Lock size={17} className="text-gold-400" />
                    ) : isPlaying ? (
                      <Pause size={17} />
                    ) : (
                      <Play size={17} />
                    )}
                  </span>
                </button>

                <Link
                  href={`/a/${artist.slug}`}
                  className="min-w-0 flex-1"
                  aria-label={`Voir ${artist.name}`}
                >
                  <span
                    className={cx(
                      "block truncate text-[14.5px] font-medium",
                      isCurrent && "text-brand-300",
                    )}
                  >
                    {track.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-fg/40">
                    {artist.name}
                    {track.duration > 0 && ` · ${duration(track.duration)}`}
                    {!locked &&
                      track.plays > 0 &&
                      ` · ${compact(track.plays)} écoutes`}
                  </span>
                </Link>

                <button
                  onClick={() => setSheet({ track, artist })}
                  aria-label="Soutenir ce morceau"
                  className={cx(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-full transition active:scale-90",
                    locked ? "grad-brand text-white" : "glass text-fg/45",
                  )}
                >
                  <Spark size={15} />
                </button>

                <PlaylistButton trackId={track.id} size="sm" />
              </div>
            );
          })}
        </div>
      )}

      {sheet && (
        <SupportSheet
          artist={sheet.artist}
          track={sheet.track}
          open
          onClose={() => setSheet(null)}
        />
      )}
    </>
  );
}
