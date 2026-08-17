"use client";

import { compact, duration } from "@/lib/format";
import type { Artist, Track } from "@/lib/types";
import { usePlayer, useUnlock } from "./providers";
import { PlaylistButton } from "./playlist-button";
import { Cover, cx } from "./ui";
import { Lock, Pause, Play, Spark } from "./icons";

/* -------------------------------------------------------- ligne morceau */

export function TrackRow({
  track,
  artist,
  index,
  onSupport,
}: {
  track: Track;
  artist: Artist;
  index: number;
  onSupport: (track: Track) => void;
}) {
  const { track: current, playing, toggle } = usePlayer();
  const { isUnlocked } = useUnlock();

  const locked = track.locked && !isUnlocked(track.id);
  const isCurrent = current?.id === track.id;
  const isPlaying = isCurrent && playing;

  return (
    <div
      className={cx(
        "group flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition",
        isCurrent ? "bg-fg/[.07]" : "hover:bg-fg/[.04]",
      )}
    >
      <button
        onClick={() => (locked ? onSupport(track) : toggle(track, artist))}
        className="relative shrink-0"
        aria-label={locked ? "Débloquer" : isPlaying ? "Pause" : "Lecture"}
      >
        <Cover
          gradient={artist.gradient}
          src={track.coverUrl}
          rounded="rounded-2xl"
          className="h-13 w-13"
        />
        <span
          className={cx(
            // Voile sombre sur la pochette : les icônes y restent claires.
            "absolute inset-0 grid place-items-center rounded-2xl text-white transition",
            locked ? "bg-black/55" : "bg-black/35 group-hover:bg-black/45",
          )}
        >
          {locked ? (
            <Lock className="text-gold-400" size={17} />
          ) : isPlaying ? (
            <Pause size={17} />
          ) : (
            <Play size={17} />
          )}
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {isPlaying && <Equalizer />}
          <span
            className={cx(
              "truncate text-[14.5px] font-medium",
              isCurrent && "text-brand-300",
            )}
          >
            {track.title}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-[11.5px] text-fg/40">
          <span className="tabular-nums">{duration(track.duration)}</span>
          {track.collaborators.length > 0 && (
            <>
              <Dot />
              <span className="truncate">
                feat. {track.collaborators.map((c) => c.name).join(", ")}
              </span>
            </>
          )}
          {!locked && track.plays > 0 && (
            <>
              <Dot />
              <span className="tabular-nums">{compact(track.plays)} écoutes</span>
            </>
          )}
          {locked && (
            <>
              <Dot />
              <span className="text-gold-700">Inédit</span>
            </>
          )}
        </div>
      </div>

      <button
        onClick={() => onSupport(track)}
        aria-label="Soutenir ce morceau"
        className={cx(
          "grid h-10 w-10 shrink-0 place-items-center rounded-full transition active:scale-90",
          locked
            ? "grad-brand text-ink"
            : "glass text-fg/55 hover:text-brand-300",
        )}
      >
        <Spark size={15} />
      </button>

      {/* Le numéro de piste n'apprenait rien ; le bouton playlist, si. */}
      <PlaylistButton trackId={track.id} size="sm" />
    </div>
  );
}

function Dot() {
  return <span className="text-fg/25">·</span>;
}

function Equalizer() {
  return (
    <span className="flex h-3 shrink-0 items-end gap-[2px]">
      {[0, 0.18, 0.36].map((d) => (
        <span
          key={d}
          className="eq-bar w-[2.5px] rounded-full bg-brand-500"
          style={{ height: "100%", animationDelay: `${d}s` }}
        />
      ))}
    </span>
  );
}

/* --------------------------------------------------------- mini lecteur */

export function MiniPlayer({ bottom = 104 }: { bottom?: number }) {
  const { track, artist, playing, position, toggle, seek, expand } =
    usePlayer();
  if (!track || !artist) return null;

  const pct = Math.min(100, (position / track.duration) * 100);

  return (
    <div
      className="fixed inset-x-0 z-30 mx-auto w-full max-w-[480px] px-4"
      style={{ bottom }}
    >
      <div className="glass-strong sheen overflow-hidden rounded-[22px] rise">
        <div className="flex items-center gap-3 p-2.5">
          {/* Toute la partie gauche ouvre l'écran de lecture : c'est le geste
              attendu sur un lecteur, et c'est là que le fan voit qui soutient
              déjà le morceau. */}
          <button
            onClick={expand}
            aria-label="Ouvrir le lecteur"
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <Cover
              gradient={artist.gradient}
              src={track.coverUrl}
              rounded="rounded-xl"
              className="h-11 w-11 shrink-0"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-medium leading-tight">
                {track.title}
              </span>
              <span className="block truncate text-[11.5px] text-fg/45">
                {artist.name}
              </span>
            </span>
          </button>

          <span className="shrink-0 text-[11px] tabular-nums text-fg/40">
            {duration(position)}
          </span>

          <button
            onClick={() => toggle(track, artist)}
            aria-label={playing ? "Pause" : "Lecture"}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full grad-brand text-ink active:scale-90"
          >
            {playing ? <Pause size={17} /> : <Play size={17} />}
          </button>
        </div>

        <div
          className="relative h-1 cursor-pointer bg-fg/10"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seek(((e.clientX - r.left) / r.width) * track.duration);
          }}
        >
          <div
            className="absolute inset-y-0 left-0 grad-brand"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
