"use client";

import { useEffect, useState } from "react";
import { suggestionsPour, trackSupporters } from "@/lib/actions";
import type { TrackSupporter } from "@/lib/queries";
import type { Artist, Track } from "@/lib/types";
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
  const [suggestions, setSuggestions] = useState<Item[]>([]);
  const [chargeSuggestions, setChargeSuggestions] = useState(false);
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

  // Chargées une fois par artiste écouté, pas à chaque ouverture : elles ne
  // changent pas entre deux morceaux du même rappeur.
  const artistId = artist?.id;

  useEffect(() => {
    if (!expanded || !artistId) return;
    let annule = false;

    setChargeSuggestions(true);
    suggestionsPour(artistId, artist?.city)
      .then((list) => {
        if (!annule) setSuggestions(list);
      })
      .finally(() => {
        if (!annule) setChargeSuggestions(false);
      });

    return () => {
      annule = true;
    };
  }, [expanded, artistId, artist?.city]);

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

  // Le lecteur s'arrête au-dessus de la barre de navigation au lieu de la
  // recouvrir : on peut passer à Découvrir ou à sa playlist sans replier
  // l'écran d'abord. Un lecteur qui emprisonne oblige à un geste de sortie
  // avant chaque geste utile.
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

      {/* Tout tient dans l'écran, sans défilement. La pochette est le seul
          élément élastique : elle prend ce qui reste une fois les commandes,
          les suggestions et le bouton Soutenir posés. Faire défiler un lecteur
          pour atteindre le bouton qui rapporte de l'argent était le pire
          arbitrage possible. */}
      <div className="relative mx-auto flex h-full w-full max-w-[480px] flex-col overflow-y-auto px-5 pb-3 pt-3">
        {/* -------------------------------------------------------- entête */}
        <header className="flex items-center justify-between">
          <button
            onClick={collapse}
            aria-label="Réduire"
            className="grid h-10 w-10 place-items-center rounded-full glass text-fg/70 active:scale-90"
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
            className="grid h-10 w-10 place-items-center rounded-full glass text-fg/70 active:scale-90"
          >
            <Share size={17} />
          </button>
        </header>

        {/* La pochette est le seul élément élastique : elle prend ce qui reste
            une fois les commandes, les suggestions et le bouton Soutenir
            posés. Un plancher de 150 px l'empêche d'être écrasée sur un petit
            écran — là, c'est la page qui défile un peu, ce qui vaut mieux
            qu'une vignette illisible. */}
        <div className="min-h-[138px] flex-1 shrink-0 py-2">
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
        <div className="shrink-0 text-center">
          <h1 className="display truncate text-[24px] font-extrabold">
            {track.title}
          </h1>
          <p className="mt-0.5 truncate text-[12.5px] text-fg/50">
            {track.collaborators.length > 0
              ? `feat. ${track.collaborators.map((c) => c.name).join(", ")}`
              : (track.label ?? artist.city)}
          </p>
        </div>

        {/* ---------------------------------------------------- progression */}
        <div className="mt-3.5 shrink-0">
          <Waveform
            trackId={track.id}
            position={position}
            total={track.duration}
            markers={supporters}
            onSeek={seek}
          />
        </div>

        {/* ------------------------------------------------------- la suite */}
        <div className="shrink-0">
        <ADecouvrir
          items={suggestions}
          chargement={chargeSuggestions}
          queue={queue}
          index={index}
          goTo={goTo}
        />
        </div>

        {/* Le bouton qui rapporte de l'argent est toujours à sa place. */}
        <div className="shrink-0 pt-2.5">
          <SupportersStrip supporters={supporters} loading={loading} />

          <button
            onClick={() => setSheetOpen(true)}
            className="mt-2.5 flex h-13 w-full items-center justify-center gap-2 rounded-full grad-brand text-[16px] font-semibold text-ink glow-brand transition active:scale-[.98]"
          >
            <Spark size={18} />
            {locked ? "Débloquer ce son" : `Soutenir ${artist.name}`}
          </button>
        </div>

        {/* --------------------------------------------------------- lecture */}
        {/* Suivant et précédent n'apparaissent que dans une file — ailleurs
            ils n'auraient rien à enchaîner. Favori et répétition, eux, ont
            un sens partout. */}
        {/* Tout en bas, au ras du pouce : c'est la commande qu'on touche le
            plus souvent, elle ne doit demander aucun effort. Le bouton
            Soutenir la surplombe, donc on le voit avant de jouer. */}
        <div className="mt-3 flex shrink-0 items-center justify-center gap-4 pt-1">
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
            className="grid h-16 w-16 shrink-0 place-items-center rounded-full grad-brand text-ink glow-brand transition active:scale-90"
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

type Item = { track: Track; artist: Artist };

/* ------------------------------------------------------ à découvrir */

/**
 * Ce qu'on peut écouter ensuite, chez d'autres artistes.
 *
 * La carte « à suivre » qui occupait cette place a été retirée : l'auditeur
 * avait déjà deux façons d'avancer dans la file — les boutons sous la barre
 * de lecture et le glissement de la pochette. Une troisième ne servait plus
 * qu'à occuper l'espace le plus précieux de l'écran.
 *
 * Cet espace sert donc à sortir de l'artiste en cours, ce qu'aucun autre
 * geste ne permettait depuis le lecteur. La file complète reste accessible
 * par le bouton de droite : glisser pour avancer, déplier pour choisir.
 */
function ADecouvrir({
  items,
  chargement,
  queue,
  index,
  goTo,
}: {
  items: Item[];
  chargement: boolean;
  queue: QueueItem[];
  index: number;
  goTo: (i: number) => void;
}) {
  const [file, setFile] = useState(false);
  const { playQueue } = usePlayer();

  if (chargement && items.length === 0) {
    return <div className="mt-3.5 h-[92px] animate-pulse rounded-2xl bg-fg/[.04]" />;
  }
  if (items.length === 0 && queue.length <= 1) return null;

  return (
    <div className="mt-3.5">
      <div className="flex items-baseline justify-between px-1">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-fg/35">
          {file ? "Ta file" : "À découvrir"}
        </span>
        {queue.length > 1 && (
          <button
            onClick={() => setFile((f) => !f)}
            className="text-[11.5px] font-semibold text-acid-500"
          >
            {file ? "Voir les suggestions" : `Toute la file · ${queue.length}`}
          </button>
        )}
      </div>

      {file ? (
        <div className="mt-2 max-h-[104px] space-y-1.5 overflow-y-auto pr-0.5">
          {queue.map((item, i) => {
            const enCours = i === index;
            return (
              <button
                key={`${item.track.id}-${i}`}
                onClick={() => goTo(i)}
                className={cx(
                  "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition active:scale-[.99]",
                  enCours ? "bg-acid-500/10" : "hover:bg-fg/[.04]",
                  i < index && "opacity-40",
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
      ) : (
        // Marges négatives : une bande qui s'arrête avant le bord semble
        // finie, et on ne la pousse pas.
        <div className="-mx-5 mt-2 flex gap-2.5 overflow-x-auto px-5 pb-1">
          {items.map(({ track, artist }, i) => (
            <button
              key={track.id}
              onClick={() =>
                playQueue(
                  items.map((x) => ({ track: x.track, artist: x.artist })),
                  i,
                )
              }
              className="w-[70px] shrink-0 text-left"
            >
              <Cover
                gradient={artist.gradient}
                src={track.coverUrl}
                alt={track.title}
                rounded="rounded-xl"
                className="aspect-square w-full"
              />
              {/* Le nom de l'artiste seul, pas le titre : à cette taille on ne
                  choisit pas un morceau, on choisit une voix. */}
              <span className="mt-1 block truncate text-[10.5px] text-fg/45">
                {artist.name}
              </span>
            </button>
          ))}
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
      <div className="h-8 animate-pulse rounded-2xl bg-fg/[.05]" />
    );
  }

  if (supporters.length === 0) {
    return (
      <p className="text-center text-[11.5px] text-fg/45">
        Personne n&apos;a encore soutenu ce son.{" "}
        <span className="font-semibold text-acid-500">Sois le premier.</span>
      </p>
    );
  }

  const shown = supporters.slice(0, 5);
  const rest = supporters.length - shown.length;

  return (
    <div className="flex items-center justify-center gap-3">
      {/* Pastilles superposées : la même grammaire visuelle que les « j'aime ». */}
      <div className="flex -space-x-2">
        {shown.map((s, i) => (
          <span
            key={s.name}
            className={cx(
              "grid h-7 w-7 place-items-center rounded-full text-[9.5px] font-bold text-white ring-2 ring-bg",
              i % 2 === 0 ? "grad-brand" : "bg-fg/75",
            )}
          >
            {initials(s.name)}
          </span>
        ))}
      </div>

      <p className="min-w-0 flex-1 text-[11.5px] leading-snug text-fg/55">
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
