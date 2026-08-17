"use client";

import { useEffect, useState } from "react";
import { trackSupporters } from "@/lib/actions";
import { duration, initials } from "@/lib/format";
import { usePlayer, useUnlock } from "./providers";
import { PlaylistButton } from "./playlist-button";
import { SupportSheet } from "./support-sheet";
import { Cover, cx } from "./ui";
import {
  ChevronLeft,
  Lock,
  Pause,
  Play,
  Repeat,
  RepeatOne,
  Share,
  SkipBack,
  SkipForward,
  Spark,
} from "./icons";

/**
 * Écran de lecture plein écran. C'est le moment où le fan est le plus
 * attentif : la pochette occupe l'écran, et juste en dessous il voit qui a
 * déjà soutenu ce morceau. Des noms, jamais de montants — l'effet recherché
 * est celui des « j'aime » : on ajoute le sien parce que d'autres l'ont fait.
 */
export function PlayerSheet() {
  const {
    track,
    artist,
    playing,
    position,
    toggle,
    seek,
    expanded,
    collapse,
    hasQueue,
    next,
    previous,
    repeat,
    toggleRepeat,
  } = usePlayer();
  const { isUnlocked } = useUnlock();

  const [supporters, setSupporters] = useState<{ name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const trackId = track?.id;

  useEffect(() => {
    if (!expanded || !trackId) return;
    let annule = false;

    setLoading(true);
    trackSupporters(trackId)
      .then((list) => {
        if (!annule) setSupporters(list);
      })
      .finally(() => {
        if (!annule) setLoading(false);
      });

    return () => {
      annule = true;
    };
  }, [expanded, trackId]);

  useEffect(() => {
    if (!expanded) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && collapse();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [expanded, collapse]);

  if (!expanded || !track || !artist) return null;

  const pct = Math.min(100, (position / track.duration) * 100);
  const locked = track.locked && !isUnlocked(track.id);

  async function share() {
    const url = `https://${window.location.host}/a/${artist!.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${track!.title} — ${artist!.name}`, url });
        return;
      } catch {
        /* annulé */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* pas de presse-papiers */
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-bg fade">
      {/* Nappe colorée tirée de la pochette : l'écran prend la couleur du son. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          backgroundImage: `radial-gradient(75% 45% at 50% 0%, ${artist.gradient[0]}, transparent 70%), radial-gradient(70% 40% at 50% 100%, ${artist.gradient[1]}, transparent 70%)`,
        }}
      />

      <div className="relative mx-auto flex h-dvh w-full max-w-[480px] flex-col px-5 pb-6 pt-4">
        {/* -------------------------------------------------------- entête */}
        <header className="flex items-center justify-between">
          <button
            onClick={collapse}
            aria-label="Réduire"
            className="grid h-11 w-11 place-items-center rounded-full glass text-fg/70 active:scale-90"
          >
            <ChevronLeft size={19} className="-rotate-90" />
          </button>
          <div className="text-center">
            <div className="text-[10.5px] uppercase tracking-[.16em] text-fg/40">
              En écoute
            </div>
            <div className="text-[12.5px] font-semibold">{artist.name}</div>
          </div>
          <button
            onClick={share}
            aria-label="Partager"
            className="grid h-11 w-11 place-items-center rounded-full glass text-fg/70 active:scale-90"
          >
            <Share size={17} />
          </button>
        </header>

        {/* ------------------------------------------------------ pochette */}
        <div className="mt-6 flex justify-center">
          <div className="relative w-full max-w-[300px]">
            <Cover
              gradient={artist.gradient}
              src={track.coverUrl}
              alt={track.title}
              rounded="rounded-[32px]"
              className="aspect-square w-full shadow-[0_40px_80px_-30px_rgba(88,28,135,.65)]"
            />
            {locked && (
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
        </div>

        {/* --------------------------------------------------------- titre */}
        <div className="mt-6 text-center">
          <h1 className="text-[24px] font-bold leading-tight">{track.title}</h1>
          <p className="mt-1 text-[13px] text-fg/50">
            {track.collaborators.length > 0
              ? `feat. ${track.collaborators.map((c) => c.name).join(", ")}`
              : (track.label ?? artist.city)}
          </p>
        </div>

        {/* ---------------------------------------------------- progression */}
        <div className="mt-6">
          <div
            className="relative h-1.5 cursor-pointer rounded-full bg-fg/10"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              seek(((e.clientX - r.left) / r.width) * track.duration);
            }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full grad-brand"
              style={{ width: `${pct}%` }}
            />
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white shadow-[0_2px_8px_rgba(24,15,36,.4)] ring-1 ring-fg/10"
              style={{ left: `calc(${pct}% - 7px)` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] tabular-nums text-fg/40">
            <span>{duration(position)}</span>
            <span>{duration(track.duration)}</span>
          </div>
        </div>

        {/* --------------------------------------------------------- lecture */}
        {/* Suivant et précédent n'apparaissent que dans une file — ailleurs
            ils n'auraient rien à enchaîner. Favori et répétition, eux, ont
            un sens partout. */}
        <div className="mt-5 flex items-center justify-center gap-4">
          <PlaylistButton trackId={track.id} />

          {hasQueue && (
            <button
              onClick={previous}
              aria-label="Morceau précédent"
              className="grid h-12 w-12 place-items-center rounded-full text-fg/55 transition active:scale-90"
            >
              <SkipBack size={22} />
            </button>
          )}

          <button
            onClick={() => toggle(track, artist)}
            aria-label={playing ? "Pause" : "Lecture"}
            className="grid h-18 w-18 shrink-0 place-items-center rounded-full grad-brand text-white glow-brand transition active:scale-90"
          >
            {playing ? <Pause size={26} /> : <Play size={26} />}
          </button>

          {hasQueue && (
            <button
              onClick={next}
              aria-label="Morceau suivant"
              className="grid h-12 w-12 place-items-center rounded-full text-fg/55 transition active:scale-90"
            >
              <SkipForward size={22} />
            </button>
          )}

          <button
            onClick={toggleRepeat}
            aria-pressed={repeat}
            aria-label={repeat ? "Désactiver la répétition" : "Répéter"}
            className={cx(
              "grid h-12 w-12 shrink-0 place-items-center rounded-full transition active:scale-90",
              repeat ? "grad-brand text-white" : "glass text-fg/45",
            )}
          >
            {repeat ? <RepeatOne size={19} /> : <Repeat size={19} />}
          </button>
        </div>

        {/* -------------------------------------------------------- soutiens */}
        <div className="mt-auto pt-6">
          <SupportersStrip supporters={supporters} loading={loading} />

          <button
            onClick={() => setSheetOpen(true)}
            className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-full grad-brand text-[16px] font-semibold text-white glow-brand transition active:scale-[.98]"
          >
            <Spark size={18} />
            {locked ? "Débloquer ce son" : `Soutenir ${artist.name}`}
          </button>
        </div>
      </div>

      <SupportSheet
        artist={artist}
        track={track}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}

/* --------------------------------------------------------------- soutiens */

function SupportersStrip({
  supporters,
  loading,
}: {
  supporters: { name: string }[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="h-12 animate-pulse rounded-2xl bg-fg/[.05]" />
    );
  }

  if (supporters.length === 0) {
    return (
      <p className="text-center text-[12.5px] text-fg/45">
        Personne n&apos;a encore soutenu ce son.{" "}
        <span className="font-semibold text-brand-300">Sois le premier.</span>
      </p>
    );
  }

  const shown = supporters.slice(0, 5);
  const rest = supporters.length - shown.length;

  return (
    <div className="flex items-center justify-center gap-3">
      {/* Pastilles superposées : la même grammaire visuelle que les « j'aime ». */}
      <div className="flex -space-x-2.5">
        {shown.map((s, i) => (
          <span
            key={s.name}
            className={cx(
              "grid h-9 w-9 place-items-center rounded-full text-[10.5px] font-bold text-white ring-2 ring-bg",
              i % 2 === 0 ? "grad-brand" : "bg-fg/75",
            )}
          >
            {initials(s.name)}
          </span>
        ))}
      </div>

      <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-fg/55">
        <span className="font-semibold text-fg/80">{shown[0].name}</span>
        {rest > 0 ? (
          <> et {rest + shown.length - 1} autres soutiennent ce son</>
        ) : supporters.length > 1 ? (
          <> et {supporters.length - 1} autres soutiennent ce son</>
        ) : (
          <> soutient ce son</>
        )}
      </p>
    </div>
  );
}
