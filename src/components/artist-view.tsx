"use client";

import { useEffect, useRef, useState } from "react";
import { APP_DOMAIN } from "@/lib/config";
import { compact } from "@/lib/format";
import type { Artist, Support, Track } from "@/lib/types";
import { BackButton } from "./page-header";
import { SupportSheet } from "./support-sheet";
import { SupporterWall } from "./supporter-wall";
import { Suggestions } from "./suggestions";
import { TrackRow } from "./player-ui";
import { Avatar, Button, Cover, cx, Glass, NameWithBadge, Stat } from "./ui";
import { Check, Copy, Share, Spark } from "./icons";

type Tab = "sons" | "soutiens";

export function ArtistView({
  artist,
  tracks,
  supports,
  nomDuFan,
  suggestions = [],
}: {
  artist: Artist;
  tracks: Track[];
  /** Soutiens confirmés, chargés côté serveur. */
  supports: Support[];
  /** Nom du visiteur connecté, s'il en a choisi un. */
  nomDuFan?: string;
  /** Morceaux d'autres artistes, pour la bande de découverte. */
  suggestions?: { track: Track; artist: Artist }[];
}) {
  const [tab, setTab] = useState<Tab>("sons");
  const [sheet, setSheet] = useState<{ open: boolean; track?: Track }>({
    open: false,
  });
  const [copied, setCopied] = useState(false);

  // Le bouton Soutenir défilait avec la page : dès que le fan regardait la
  // liste des sons, le seul bouton qui rapporte de l'argent sortait de
  // l'écran. On le rappelle en barre fixe, mais seulement une fois l'original
  // hors de vue — sinon le premier écran afficherait deux fois le même geste.
  const ancre = useRef<HTMLDivElement>(null);
  const [rappel, setRappel] = useState(false);

  useEffect(() => {
    const cible = ancre.current;
    if (!cible) return;

    const obs = new IntersectionObserver(
      ([e]) => setRappel(!e.isIntersecting),
      { rootMargin: "-120px 0px 0px 0px" },
    );
    obs.observe(cible);
    return () => obs.disconnect();
  }, []);

  // Hauteur annoncée au mini-lecteur, qui monte d'autant.
  useEffect(() => {
    const racine = document.documentElement;
    racine.style.setProperty("--barre-soutien", rappel ? "72px" : "0px");
    return () => {
      racine.style.removeProperty("--barre-soutien");
    };
  }, [rappel]);

  const link = `${APP_DOMAIN}/a/${artist.slug}`;

  async function share() {
    const url = `https://${link}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: artist.name, url });
        return;
      } catch {
        /* l'utilisateur a annulé, on retombe sur la copie */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* pas de presse-papiers disponible */
    }
  }

  return (
    <>
      {/* ---------------------------------------------------------- entête */}
      <div className="relative -mx-4 -mt-5">
        <Cover
          gradient={artist.gradient}
          src={artist.coverUrl}
          rounded="rounded-b-[38px]"
          className="h-[300px] w-full"
        />

        {/* La pochette se fond dans le fond de page, d'où le dégradé vers
            --color-bg : le nom posé dessus reste donc en encre. */}
        <div className="absolute inset-x-0 bottom-0 h-44 rounded-b-[38px] bg-gradient-to-t from-bg via-bg/70 to-transparent" />

        <div className="absolute inset-x-4 top-5 flex items-center justify-between">
          <BackButton tone="onMedia" />
          <button
            onClick={share}
            data-role="share"
            aria-label="Partager le lien"
            className="grid h-11 w-11 place-items-center rounded-full glass-strong text-fg/85 active:scale-90"
          >
            {copied ? (
              <Check size={18} className="text-gold-700" />
            ) : (
              <Share size={18} />
            )}
          </button>
        </div>

        <div className="absolute inset-x-5 bottom-5 flex items-end gap-3.5">
          <Avatar
            name={artist.name}
            gradient={artist.gradient}
            src={artist.avatarUrl}
            size={76}
            ring
          />
          <div className="min-w-0 pb-1.5">
            <h1 className="display text-[34px] font-extrabold">
              <NameWithBadge name={artist.name} verified={artist.verified} />
            </h1>
            <p className="mt-0.5 text-[12.5px] text-fg/50">
              {artist.city} · {compact(artist.monthlyListeners)} auditeurs / mois
            </p>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------- résumé */}
      <p className="mt-5 px-1 text-[13.5px] leading-relaxed text-fg/60">
        {artist.bio}
      </p>

      {/* Le total encaissé n'apparaît nulle part côté public : afficher les
          revenus de quelqu'un attire les jalousies et les demandes, et un
          petit montant donne l'image d'un échec. L'artiste le voit dans son
          espace. Ce qui reste ici, c'est la preuve sociale — comme sur les
          plateformes de streaming. */}
      <Glass className="mt-4 grid grid-cols-3 divide-x divide-fg/[.07] rounded-[26px] py-4">
        <Stat
          value={compact(artist.monthlyListeners)}
          label="auditeurs / mois"
          accent
        />
        <Stat value={String(supports.length)} label="soutiens" />
        <Stat value={String(tracks.length)} label="sons" />
      </Glass>

      <div ref={ancre}>
        <Button
          onClick={() => setSheet({ open: true })}
          className="mt-3.5 h-15 w-full text-[16.5px] glow-brand"
        >
          <Spark size={18} />
          Soutenir {artist.name}
        </Button>
      </div>

      {/* ------------------------------------------------- lien partageable */}
      <button
        onClick={share}
        className="mt-2.5 flex w-full items-center gap-2.5 rounded-2xl glass px-4 py-3 text-left active:scale-[.99]"
      >
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-fg/55">
          {link}
        </span>
        {copied ? (
          <Check size={15} className="shrink-0 text-gold-700" />
        ) : (
          <Copy size={15} className="shrink-0 text-fg/40" />
        )}
      </button>

      {/* --------------------------------------------------------- onglets */}
      <div className="mt-6 flex gap-1.5 rounded-full glass p-1.5">
        {(
          [
            ["sons", `Sons ${tracks.length}`],
            ["soutiens", `Soutiens ${supports.length}`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cx(
              "h-10 flex-1 rounded-full text-[13px] font-medium transition",
              tab === id
                ? "grad-brand text-ink shadow-[0_8px_22px_-10px_rgba(224,78,200,.9)]"
                : "text-fg/50",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "sons" && (
          <div className="space-y-0.5">
            {tracks.map((t, i) => (
              <TrackRow
                key={t.id}
                track={t}
                artist={artist}
                index={i}
                onSupport={(track) => setSheet({ open: true, track })}
              />
            ))}
          </div>
        )}

        {tab === "soutiens" && <SupporterWall supports={supports} />}
      </div>

      {/* ------------------------------------------ rappel du geste payant */}
      <div
        className={cx(
          "fixed inset-x-0 z-30 mx-auto w-full max-w-[480px] px-4 transition-all duration-200",
          rappel
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0",
        )}
        style={{ bottom: 104 }}
        aria-hidden={!rappel}
      >
        <button
          onClick={() => setSheet({ open: true })}
          tabIndex={rappel ? 0 : -1}
          className="flex h-15 w-full items-center gap-3 rounded-[22px] grad-brand px-3 text-ink glow-brand transition active:scale-[.98]"
        >
          <Avatar
            name={artist.name}
            gradient={artist.gradient}
            src={artist.avatarUrl}
            size={42}
          />
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-[15.5px] font-bold leading-tight">
              Soutenir {artist.name}
            </span>
            <span className="block text-[11px] font-medium text-ink/60">
              Wave ou Orange Money
            </span>
          </span>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink/12">
            <Spark size={18} />
          </span>
        </button>
      </div>

      {/* Tout en bas : au moment où le fan a fini d'écouter, il est
          exactement disposé à écouter quelqu'un d'autre. */}
      <Suggestions items={suggestions} />

      <SupportSheet
        artist={artist}
        track={sheet.track}
        nomParDefaut={nomDuFan}
        open={sheet.open}
        onClose={() => setSheet({ open: false })}
      />
    </>
  );
}
