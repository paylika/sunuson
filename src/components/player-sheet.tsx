"use client";

import { useEffect, useState } from "react";
import { trackSupporters } from "@/lib/actions";
import type { TrackSupporter } from "@/lib/queries";
import { duration, initials } from "@/lib/format";
import { ambianceDe, type Ambiance } from "@/lib/couleur";
import { usePlayer, useUnlock, type QueueItem } from "./providers";
import { PlaylistButton } from "./playlist-button";
import { PochetteGlissante } from "./pochette-glissante";
import { SupportSheet } from "./support-sheet";
import { Waveform } from "./waveform";
import { Cover, cx } from "./ui";
import {
  ChevronLeft,
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
    queue,
    index,
    goTo,
  } = usePlayer();
  const { isUnlocked } = useUnlock();

  const [supporters, setSupporters] = useState<TrackSupporter[]>([]);

  // Repli neutre plutôt que le dégradé de l'artiste : tant que la pochette
  // n'est pas lue, mieux vaut un fond sombre discret qu'une couleur qui sera
  // peut-être démentie une seconde plus tard.
  const [ambiance, setAmbiance] = useState<Ambiance>(["#26282e", "#101115"]);
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const trackId = track?.id;

  // La pochette du morceau d'abord, celle de l'artiste ensuite : c'est le
  // visuel affiché à l'écran qui doit décider de la couleur, pas un autre.
  const pochette = track?.coverUrl ?? artist?.coverUrl ?? artist?.avatarUrl;

  useEffect(() => {
    if (!expanded || !pochette) return;
    let annule = false;

    void ambianceDe(pochette).then((a) => {
      if (!annule && a) setAmbiance(a);
    });

    return () => {
      annule = true;
    };
  }, [expanded, pochette]);

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
      {/* Nappe tirée des pixels de la pochette, plus du dégradé stocké de
          l'artiste : sur une pochette en noir et blanc, celui-ci teintait de
          violet une image qui n'a aucune couleur. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-45 transition-[background-image] duration-700"
        style={{
          backgroundImage: `radial-gradient(75% 45% at 50% 0%, ${ambiance[0]}, transparent 70%), radial-gradient(70% 40% at 50% 100%, ${ambiance[1]}, transparent 70%)`,
        }}
      />

      {/* Trois zones : l'entête et le bouton Soutenir restent en place, seul
          le milieu défile. Sans ça, la file d'attente ajoutée sous les
          commandes poussait le contenu à 1062 px dans un écran de 812 : sur un
          téléphone ordinaire, la fin de l'écran était simplement coupée. */}
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

        <div className="min-h-0 flex-1 overflow-y-auto">
        {/* ------------------------------------------------------ pochette */}
        <div className="mt-6">
          <PochetteGlissante
            courant={{ track, artist }}
            suivant={queue[index + 1]}
            precedent={queue[index - 1]}
            verrouille={locked}
            onSuivant={() => goTo(index + 1)}
            onPrecedent={() => goTo(index - 1)}
          />
        </div>

        {/* --------------------------------------------------------- titre */}
        <div className="mt-6 text-center">
          <h1 className="display text-[27px] font-extrabold">{track.title}</h1>
          <p className="mt-1 text-[13px] text-fg/50">
            {track.collaborators.length > 0
              ? `feat. ${track.collaborators.map((c) => c.name).join(", ")}`
              : (track.label ?? artist.city)}
          </p>
        </div>

        {/* ---------------------------------------------------- progression */}
        <div className="mt-5">
          <Waveform
            trackId={track.id}
            position={position}
            total={track.duration}
            markers={supporters}
            onSeek={seek}
          />
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
            className="grid h-18 w-18 shrink-0 place-items-center rounded-full grad-brand text-ink glow-brand transition active:scale-90"
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
              repeat ? "grad-brand text-ink" : "glass text-fg/45",
            )}
          >
            {repeat ? <RepeatOne size={19} /> : <Repeat size={19} />}
          </button>
        </div>

        {/* ------------------------------------------------------- la suite */}
        <FileDAttente queue={queue} index={index} goTo={goTo} />
        </div>

        {/* Le bouton qui rapporte de l'argent ne défile jamais. */}
        <div className="shrink-0 pt-5">
          <SupportersStrip supporters={supporters} loading={loading} />

          <button
            onClick={() => setSheetOpen(true)}
            className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-full grad-brand text-[16px] font-semibold text-ink glow-brand transition active:scale-[.98]"
          >
            <Spark size={18} />
            {locked ? "Débloquer ce son" : `Soutenir ${artist.name}`}
          </button>
        </div>
      </div>

      <SupportSheet
        artist={artist}
        track={track}
        positionSec={Math.round(position)}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}

/* ------------------------------------------------------------- la file */

/**
 * Ce qui vient après.
 *
 * Un lecteur qui ne montre pas le morceau suivant donne l'impression que
 * l'écoute s'arrête là. La carte du suivant se glisse sous celle du morceau
 * en cours, décalée : on comprend qu'il y a une pile, et qu'elle avance.
 *
 * Repliée par défaut : sur un écran de téléphone, la liste complète mangerait
 * la place du bouton Soutenir, qui est la raison d'être de cet écran.
 */
function FileDAttente({
  queue,
  index,
  goTo,
}: {
  queue: QueueItem[];
  index: number;
  goTo: (i: number) => void;
}) {
  const [ouverte, setOuverte] = useState(false);

  const suivant = queue[index + 1];
  const restants = queue.length - index - 1;

  if (queue.length <= 1) return null;

  return (
    <div className="mt-5">
      <div className="flex items-baseline justify-between px-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-fg/35">
          {suivant ? "À suivre" : "Dernier de la file"}
        </span>
        <button
          onClick={() => setOuverte((o) => !o)}
          className="text-[11.5px] font-semibold text-acid-500"
        >
          {ouverte
            ? "Replier"
            : `Toute la file · ${queue.length}`}
        </button>
      </div>

      {!ouverte && suivant && (
        <button
          onClick={() => goTo(index + 1)}
          className="relative mt-2 w-full text-left"
        >
          {/* La carte fantôme derrière suggère la pile : c'est elle qui dit
              qu'il en reste d'autres, sans les lister. */}
          {restants > 1 && (
            <span className="absolute inset-x-3 -bottom-1.5 h-8 rounded-2xl bg-fg/[.05]" />
          )}

          <span className="relative flex items-center gap-3 rounded-2xl glass px-3 py-2.5 transition active:scale-[.99]">
            <Cover
              gradient={suivant.artist.gradient}
              src={suivant.track.coverUrl}
              rounded="rounded-xl"
              className="h-11 w-11 shrink-0"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-semibold">
                {suivant.track.title}
              </span>
              <span className="mt-0.5 block truncate text-[11px] text-fg/40">
                {suivant.artist.name}
                {restants > 1 && ` · ${restants - 1} autre${restants > 2 ? "s" : ""} ensuite`}
              </span>
            </span>
            <SkipForward size={16} className="shrink-0 text-fg/30" />
          </span>
        </button>
      )}

      {ouverte && (
        <div className="mt-2 max-h-52 space-y-1.5 overflow-y-auto pr-0.5">
          {queue.map((item, i) => {
            const enCours = i === index;
            const passe = i < index;

            return (
              <button
                key={`${item.track.id}-${i}`}
                onClick={() => goTo(i)}
                className={cx(
                  "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition active:scale-[.99]",
                  enCours ? "bg-acid-500/10" : "hover:bg-fg/[.04]",
                  // Ce qui est déjà passé s'efface sans disparaître : on peut
                  // toujours y revenir, mais l'œil va d'abord vers la suite.
                  passe && "opacity-40",
                )}
              >
                <span className="w-4 shrink-0 text-center text-[10.5px] font-bold tabular-nums text-fg/30">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cx(
                      "block truncate text-[13px] font-medium",
                      enCours && "text-acid-500",
                    )}
                  >
                    {item.track.title}
                  </span>
                  <span className="block truncate text-[10.5px] text-fg/40">
                    {item.artist.name}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- soutiens */

function SupportersStrip({
  supporters,
  loading,
}: {
  supporters: TrackSupporter[];
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
