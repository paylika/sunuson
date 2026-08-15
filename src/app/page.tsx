"use client";

import Link from "next/link";
import { useMemo } from "react";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { artists, getTracksByArtist } from "@/lib/data";
import { compact, fcfa } from "@/lib/format";
import { usePlayer, useSupports } from "@/components/providers";
import { Shell } from "@/components/shell";
import {
  Avatar,
  Button,
  Cover,
  Glass,
  NameWithBadge,
  Pill,
  SectionTitle,
} from "@/components/ui";
import {
  Bell,
  ChevronRight,
  Music,
  Pause,
  Play,
  Spark,
  Wallet,
} from "@/components/icons";

export default function AccueilPage() {
  const { totalForArtist, forArtist } = useSupports();
  const { track: current, playing, toggle } = usePlayer();

  const featured = artists[0];
  const featuredTracks = getTracksByArtist(featured.id);
  const featuredTrack = featuredTracks.find((t) => !t.locked)!;
  const featuredPlaying = current?.id === featuredTrack.id && playing;

  const trending = useMemo(
    () =>
      [...artists]
        .map((a) => ({ a, total: totalForArtist(a.id) }))
        .sort((x, y) => y.total - x.total),
    [totalForArtist],
  );

  return (
    <Shell>
      {/* --------------------------------------------------------- entête */}
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl grad-brand text-white">
              <Music size={17} />
            </span>
            <span className="text-[19px] font-semibold tracking-[-.02em]">
              {APP_NAME}
            </span>
          </div>
          <p className="mt-1.5 text-[12px] text-fg/45">{APP_TAGLINE}</p>
        </div>
        <button
          aria-label="Notifications"
          className="relative grid h-11 w-11 place-items-center rounded-full glass text-fg/70"
        >
          <Bell size={18} />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand-500" />
        </button>
      </header>

      {/* ------------------------------------------------------- à la une */}
      <section className="mt-6 rise">
        <div className="relative overflow-hidden rounded-[32px]">
          <Cover
            gradient={featured.gradient}
            rounded="rounded-[32px]"
            className="h-[300px] w-full"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/25 to-transparent" />

          <div className="absolute left-5 right-5 top-5 flex items-start justify-between">
            <Pill tone="glass">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
              À la une
            </Pill>
            <Pill tone="glass">{compact(featured.monthlyListeners)} / mois</Pill>
          </div>

          {/* Contenu posé sur le voile sombre de la pochette : texte blanc. */}
          <div className="absolute inset-x-5 bottom-5 text-white">
            <h2 className="text-[30px] font-semibold leading-[1.05] tracking-tight">
              <NameWithBadge
                name={featured.name}
                verified={featured.verified}
              />
            </h2>
            <p className="mt-1 text-[13px] text-white/65">
              {featured.city} · {featuredTracks.length} sons ·{" "}
              {fcfa(totalForArtist(featured.id))} reçus
            </p>

            <div className="mt-4 flex gap-2.5">
              <button
                onClick={() => toggle(featuredTrack)}
                className="grid h-13 w-13 shrink-0 place-items-center rounded-full grad-brand text-white shadow-[0_12px_34px_-10px_rgba(224,78,200,.85)] active:scale-90"
                aria-label={featuredPlaying ? "Pause" : "Écouter"}
              >
                {featuredPlaying ? <Pause size={19} /> : <Play size={19} />}
              </button>
              <Button
                href={`/a/${featured.slug}`}
                variant="glass"
                className="h-13 flex-1"
              >
                Voir la page
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- comment ça marche */}
      <section className="mt-6">
        <Glass className="grid grid-cols-3 divide-x divide-fg/10">
          {[
            { Icon: Play, t: "Écoute", s: "Gratuit, toujours" },
            { Icon: Spark, t: "Soutiens", s: "Wave / OM" },
            { Icon: Wallet, t: "Il reçoit", s: "85 % direct" },
          ].map(({ Icon, t, s }) => (
            <div key={t} className="px-2 py-4 text-center">
              <Icon size={17} className="mx-auto text-brand-300" />
              <div className="mt-2 text-[13px] font-semibold">{t}</div>
              <div className="text-[10.5px] text-fg/40">{s}</div>
            </div>
          ))}
        </Glass>
      </section>

      {/* ------------------------------------------------------ classement */}
      <section className="mt-7">
        <SectionTitle
          right={
            <Link
              href="/decouvrir"
              className="flex items-center gap-1 text-[12px] text-fg/45"
            >
              Tout voir
              <ChevronRight size={13} />
            </Link>
          }
        >
          Ils montent en ce moment
        </SectionTitle>

        <div className="space-y-2">
          {trending.map(({ a, total }, i) => (
            <Link key={a.id} href={`/a/${a.slug}`} className="block">
              <Glass className="flex items-center gap-3 px-3 py-3 transition active:scale-[.99]">
                <span className="w-4 shrink-0 text-center text-[12px] font-semibold tabular-nums text-fg/30">
                  {i + 1}
                </span>
                <Avatar name={a.name} gradient={a.gradient} size={46} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-medium">
                    <NameWithBadge name={a.name} verified={a.verified} />
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-fg/40">
                    {a.city} · {forArtist(a.id).length} soutiens
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[14px] font-semibold tabular-nums text-gold-700">
                    {fcfa(total, false)}
                  </div>
                  <div className="text-[10px] text-fg/35">FCFA</div>
                </div>
              </Glass>
            </Link>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- artiste */}
      <section className="mt-7">
        <Glass className="overflow-hidden">
          <div className="p-5">
            <Pill tone="gold">Tu es artiste ?</Pill>
            <h3 className="mt-3 text-[19px] font-semibold leading-snug tracking-tight">
              Ton lien, ta musique,
              <br />
              <span className="text-grad">ton argent.</span>
            </h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-fg/50">
              Tu déposes tes sons, tu récupères ton lien, tu le mets dans ta
              bio. Tes fans écoutent gratuitement et t&apos;envoient de
              l&apos;argent en deux clics.
            </p>
            <Button href="/dashboard" className="mt-4 w-full">
              Ouvrir mon espace
            </Button>
          </div>
        </Glass>
      </section>
    </Shell>
  );
}
