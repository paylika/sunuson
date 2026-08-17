"use client";

import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { compact, fcfa } from "@/lib/format";
import type { Artist, Track } from "@/lib/types";
import { usePlayer } from "./providers";
import { Avatar, Cover, cx, Glass, NameWithBadge, SectionTitle } from "./ui";
import { Bell, ChevronRight, Music, Pause, Play, Spark, Wallet } from "./icons";

export type RankRow = { artist: Artist; total: number; count: number };

export function HomeView({
  featured,
  featuredTracks,
  featuredTotal,
  ranking,
}: {
  featured: Artist | null;
  featuredTracks: Track[];
  featuredTotal: number;
  ranking: RankRow[];
}) {
  const { track: current, playing, toggle } = usePlayer();

  const playable = featuredTracks.find((t) => !t.locked) ?? null;
  const featuredPlaying = !!playable && current?.id === playable.id && playing;

  return (
    <>
      {/* --------------------------------------------------------- entête */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-2xl grad-brand text-white glow-brand">
            <Music size={18} />
          </span>
          <div>
            <div className="text-[20px] font-bold leading-none">{APP_NAME}</div>
            <p className="mt-1 text-[11.5px] text-fg/45">{APP_TAGLINE}</p>
          </div>
        </div>
        <button
          aria-label="Notifications"
          className="relative grid h-11 w-11 place-items-center rounded-full glass text-fg/60"
        >
          <Bell size={18} />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white" />
        </button>
      </header>

      {/* ------------------------------------------------------- à la une */}
      {featured && (
        <section className="mt-6 rise">
          {/* Carte média : voile sombre sur la pochette, donc texte blanc. */}
          <div className="relative overflow-hidden rounded-[34px] text-white shadow-[0_30px_70px_-30px_rgba(88,28,135,.65)]">
            <Cover
              gradient={featured.gradient}
              rounded="rounded-[34px]"
              className="h-[356px] w-full"
            />
            <div className="media-veil absolute inset-0" />

            <div className="absolute left-5 right-5 top-5 flex items-start justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-semibold leading-none backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
                À la une
              </span>
              <span className="rounded-full bg-black/30 px-3 py-1.5 text-[11px] font-medium leading-none backdrop-blur-md">
                {compact(featured.monthlyListeners)} auditeurs
              </span>
            </div>

            <div className="absolute inset-x-5 bottom-5">
              <h2 className="text-[36px] font-bold leading-[1.02]">
                <NameWithBadge name={featured.name} verified={featured.verified} />
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-white/70">
                <span>{featured.city}</span>
                <span className="opacity-40">•</span>
                <span>{featuredTracks.length} sons</span>
                <span className="opacity-40">•</span>
                <span className="font-semibold text-gold-400">
                  {fcfa(featuredTotal)} reçus
                </span>
              </div>

              <div className="mt-5 flex gap-2.5">
                {playable && (
                  <button
                    onClick={() => toggle(playable, featured)}
                    className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-brand-300 shadow-[0_10px_28px_-8px_rgba(0,0,0,.6)] transition active:scale-90"
                    aria-label={featuredPlaying ? "Pause" : "Écouter"}
                  >
                    {featuredPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                )}
                <Link
                  href={`/a/${featured.slug}`}
                  className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-white/15 text-[15px] font-semibold ring-1 ring-white/25 backdrop-blur-md transition active:scale-[.98]"
                >
                  Voir la page
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* -------------------------------------------------- comment ça marche */}
      <section className="mt-5">
        <Glass className="grid grid-cols-3 divide-x divide-fg/[.07] rounded-[26px]">
          {[
            { Icon: Play, t: "Écoute", s: "Gratuit, toujours" },
            { Icon: Spark, t: "Soutiens", s: "Wave / OM" },
            { Icon: Wallet, t: "Il reçoit", s: "85 % direct" },
          ].map(({ Icon, t, s }) => (
            <div key={t} className="px-2 py-4 text-center">
              <span className="mx-auto grid h-9 w-9 place-items-center rounded-xl bg-brand-500/10 text-brand-300">
                <Icon size={16} />
              </span>
              <div className="mt-2 text-[13px] font-semibold">{t}</div>
              <div className="mt-0.5 text-[10.5px] text-fg/40">{s}</div>
            </div>
          ))}
        </Glass>
      </section>

      {/* ------------------------------------------------------ classement */}
      <section className="mt-8">
        <SectionTitle
          right={
            <Link
              href="/decouvrir"
              className="flex items-center gap-0.5 text-[12px] font-medium text-brand-300"
            >
              Tout voir
              <ChevronRight size={13} />
            </Link>
          }
        >
          Ils montent en ce moment
        </SectionTitle>

        <div className="space-y-2.5">
          {ranking.map(({ artist, total, count }, i) => (
            <Link key={artist.id} href={`/a/${artist.slug}`} className="block">
              <Glass className="flex items-center gap-3.5 rounded-[24px] px-3.5 py-3 transition active:scale-[.99]">
                <span
                  className={cx(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11.5px] font-bold",
                    i === 0
                      ? "bg-gold-400 text-ink-950"
                      : i === 1
                        ? "bg-fg/85 text-white"
                        : i === 2
                          ? "grad-brand text-white"
                          : "bg-fg/[.07] text-fg/45",
                  )}
                >
                  {i + 1}
                </span>
                <Avatar name={artist.name} gradient={artist.gradient} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold">
                    <NameWithBadge name={artist.name} verified={artist.verified} />
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-fg/40">
                    {artist.city} · {count} soutien{count > 1 ? "s" : ""}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[15px] font-bold tabular-nums text-gold-700">
                    {fcfa(total, false)}
                  </div>
                  <div className="text-[9.5px] font-medium uppercase tracking-wider text-fg/35">
                    FCFA
                  </div>
                </div>
              </Glass>
            </Link>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- artiste */}
      <section className="mt-8">
        <div className="relative overflow-hidden rounded-[30px] grad-brand p-6 text-white glow-brand">
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "radial-gradient(70% 60% at 100% 0%, rgba(255,255,255,.5), transparent 60%)",
            }}
          />
          <div className="relative">
            <span className="inline-flex rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-semibold leading-none backdrop-blur-md">
              Tu es artiste ?
            </span>
            <h3 className="mt-3.5 text-[24px] font-bold leading-[1.15]">
              Ton lien, ta musique,
              <br />
              ton argent.
            </h3>
            <p className="mt-2.5 text-[13px] leading-relaxed text-white/80">
              Tu déposes tes sons, tu récupères ton lien, tu le mets dans ta
              bio. Tes fans écoutent gratuitement et t&apos;envoient de
              l&apos;argent en deux clics.
            </p>
            <Link
              href="/dashboard"
              className="mt-5 flex h-13 items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold text-brand-300 transition active:scale-[.98]"
            >
              Ouvrir mon espace
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
