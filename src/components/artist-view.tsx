"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { APP_DOMAIN } from "@/lib/config";
import { compact, fcfa } from "@/lib/format";
import type { Artist, Clip, Track } from "@/lib/types";
import { useSupports } from "./providers";
import { SupportSheet } from "./support-sheet";
import { SupporterWall } from "./supporter-wall";
import { TrackRow } from "./player-ui";
import { Avatar, Button, Cover, cx, Glass, NameWithBadge, Stat } from "./ui";
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  Copy,
  Play,
  Share,
  Spark,
} from "./icons";

type Tab = "sons" | "clips" | "soutiens";

export function ArtistView({
  artist,
  tracks,
  clips,
}: {
  artist: Artist;
  tracks: Track[];
  clips: Clip[];
}) {
  const { forArtist } = useSupports();
  const [tab, setTab] = useState<Tab>("sons");
  const [sheet, setSheet] = useState<{ open: boolean; track?: Track }>({
    open: false,
  });
  const [copied, setCopied] = useState(false);

  const supports = forArtist(artist.id);
  const total = useMemo(
    () => supports.reduce((s, x) => s + x.amount, 0),
    [supports],
  );

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
          rounded="rounded-b-[38px]"
          className="h-[300px] w-full"
        />

        {/* La pochette se fond dans le fond de page, d'où le dégradé vers
            --color-bg : le nom posé dessus reste donc en encre. */}
        <div className="absolute inset-x-0 bottom-0 h-44 rounded-b-[38px] bg-gradient-to-t from-bg via-bg/70 to-transparent" />

        <div className="absolute inset-x-4 top-5 flex items-center justify-between">
          <Link
            href="/decouvrir"
            aria-label="Retour"
            className="grid h-11 w-11 place-items-center rounded-full glass-strong text-fg/85"
          >
            <ChevronLeft size={19} />
          </Link>
          <button
            onClick={share}
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
            size={68}
            ring
          />
          <div className="min-w-0 pb-1">
            <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
              <NameWithBadge name={artist.name} verified={artist.verified} />
            </h1>
            <p className="text-[12.5px] text-fg/55">
              {artist.city} · {compact(artist.monthlyListeners)} auditeurs / mois
            </p>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------- résumé */}
      <p className="mt-5 px-1 text-[13.5px] leading-relaxed text-fg/60">
        {artist.bio}
      </p>

      <Glass className="mt-4 grid grid-cols-3 divide-x divide-fg/10 py-4">
        <Stat value={fcfa(total, false)} label="FCFA reçus" accent />
        <Stat value={String(supports.length)} label="soutiens" />
        <Stat value={String(tracks.length)} label="sons" />
      </Glass>

      <Button
        onClick={() => setSheet({ open: true })}
        className="mt-3.5 h-14 w-full text-[16px]"
      >
        <Spark size={18} />
        Soutenir {artist.name}
      </Button>

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
            ["clips", `Clips ${clips.length}`],
            ["soutiens", `Soutiens ${supports.length}`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cx(
              "h-10 flex-1 rounded-full text-[13px] font-medium transition",
              tab === id
                ? "grad-brand text-white shadow-[0_8px_22px_-10px_rgba(224,78,200,.9)]"
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

        {tab === "clips" && <ClipsGrid clips={clips} artist={artist} />}

        {tab === "soutiens" && <SupporterWall supports={supports} />}
      </div>

      <SupportSheet
        artist={artist}
        track={sheet.track}
        open={sheet.open}
        onClose={() => setSheet({ open: false })}
      />
    </>
  );
}

/* ----------------------------------------------------------------- clips */

/**
 * Les clips ne sont jamais hébergés : ils restent sur YouTube, on ne stocke
 * que l'identifiant. C'est ce qui garde la facture de bande passante à zéro.
 */
function ClipsGrid({ clips, artist }: { clips: Clip[]; artist: Artist }) {
  if (clips.length === 0) {
    return (
      <Glass className="px-5 py-8 text-center text-[13.5px] text-fg/50">
        Aucun clip pour l&apos;instant.
      </Glass>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {clips.map((c) => (
        <a
          key={c.id}
          href={`https://www.youtube.com/watch?v=${c.youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group"
        >
          <div className="relative">
            <Cover
              gradient={artist.gradient}
              rounded="rounded-3xl"
              className="aspect-[4/5] w-full"
            />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-12 w-12 place-items-center rounded-full glass-strong text-fg transition group-active:scale-90">
                <Play size={18} />
              </span>
            </span>
            <span className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full glass-strong text-fg/70">
              <ArrowUpRight size={13} />
            </span>
            <span className="absolute inset-x-0 bottom-0 rounded-b-3xl bg-gradient-to-t from-black/85 to-transparent p-3 text-white">
              <span className="block text-[12.5px] font-medium leading-tight">
                {c.title}
              </span>
              <span className="mt-0.5 block text-[10.5px] text-white/60">
                {compact(c.views)} vues · YouTube
              </span>
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}
