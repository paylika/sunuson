"use client";

import Link from "next/link";
import { COMMISSION_RATE, MIN_PAYOUT } from "@/lib/config";
import { compact, fcfa } from "@/lib/format";
import type { Artist } from "@/lib/types";
import { Avatar, Glass, NameWithBadge } from "./ui";
import { MarkTile, Wordmark } from "./logo";
import {
  Bookmark,
  ChevronRight,
  Flame,
  Lock,
  Play,
  Spark,
  UserIcon,
  Wallet,
} from "./icons";

type Preuve = { artist: Artist; count: number };

/**
 * Page d'acquisition, écrite pour les ARTISTES.
 *
 * Les fans n'arrivent jamais ici : ils débarquent par le lien d'un artiste
 * partagé dans WhatsApp. Cette page ne sert donc qu'à une chose — convaincre
 * un rappeur de déposer ses sons. C'est lui le moteur de croissance : chaque
 * artiste convaincu amène sa propre audience.
 */
export function LandingView({
  preuve,
  total,
}: {
  preuve: Preuve[];
  total: number;
}) {
  return (
    <div className="mx-auto w-full max-w-[560px] px-5 pb-16 pt-6">
      {/* ----------------------------------------------------------- entête */}
      <header className="flex items-center justify-between">
        <Wordmark size={22} />
        <Link
          href="/"
          className="rounded-full glass px-4 py-2.5 text-[12.5px] font-semibold text-fg/70 transition active:scale-95"
        >
          Écouter
        </Link>
      </header>

      {/* -------------------------------------------------------------- hero */}
      <section className="pb-10 pt-14 text-center rise">
        <MarkTile size={72} className="mx-auto glow-brand" />

        {/* Interlignage un cran au-dessus du .display : sur trois lignes serrées
            les jambages se touchent et le titre devient sale. */}
        <h1 className="display mt-8 text-[38px] font-extrabold !leading-[1.06]">
          Tes fans écoutent
          <br />
          gratuitement.
          <br />
          <span className="text-acid-500">Toi, tu es payé.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-[400px] text-[15px] leading-relaxed text-fg/55">
          Dépose tes sons, récupère ton lien, mets-le dans ta bio. Tes fans
          t&apos;envoient de l&apos;argent par Wave ou Orange Money, sans carte
          bancaire et sans quitter leur téléphone.
        </p>

        <Link
          href="/connexion"
          className="mt-8 flex h-15 w-full items-center justify-center gap-2 rounded-full grad-brand text-[16.5px] font-bold text-ink glow-brand transition active:scale-[.98]"
        >
          Créer mon espace artiste
          <ChevronRight size={18} />
        </Link>
        <p className="mt-3 text-[12px] text-fg/35">
          Gratuit. Sans exclusivité. Tu gardes tes droits.
        </p>
      </section>

      {/* ---------------------------------------------------------- le vrai */}
      <section className="mt-6">
        <Glass className="rounded-[28px] p-6">
          <h2 className="display text-[24px] font-extrabold !leading-[1.1]">
            Le streaming ne te paiera pas.
          </h2>
          <p className="mt-3 text-[13.5px] leading-relaxed text-fg/55">
            Il faut des centaines de milliers d&apos;écoutes pour toucher
            quelque chose, et tes fans n&apos;ont pas de carte bancaire pour
            s&apos;abonner. Ici, un seul soutien de {fcfa(5000)} vaut plus que
            des milliers d&apos;écoutes ailleurs.
          </p>
          <p className="mt-3 text-[13.5px] leading-relaxed text-fg/55">
            Ce que tes fans font déjà dans les cérémonies — donner devant tout
            le monde, se faire citer — ils le font ici, depuis leur téléphone.
          </p>
        </Glass>
      </section>

      {/* -------------------------------------------------------- trois pas */}
      <section className="mt-10">
        <h2 className="display px-1 text-[26px] font-extrabold !leading-[1.1]">
          Trois étapes, dix minutes
        </h2>

        <div className="mt-5 space-y-3">
          {[
            {
              n: "1",
              Icon: UserIcon,
              t: "Tu déposes tes sons",
              d: "Pochette, titre, featuring. Tu choisis lesquels sont libres et lesquels sont réservés à ceux qui te soutiennent.",
            },
            {
              n: "2",
              Icon: Bookmark,
              t: "Tu partages ton lien",
              d: "Une page à ton nom, à mettre dans ta bio Instagram, TikTok ou ton statut WhatsApp. C'est ce lien qui travaille pour toi.",
            },
            {
              n: "3",
              Icon: Spark,
              t: "Tes fans t'envoient de l'argent",
              d: "Ils écoutent gratuitement, puis appuient sur Soutenir. Leur nom s'affiche sur ta page — c'est ce qui donne envie aux suivants.",
            },
          ].map(({ n, Icon, t, d }) => (
            <Glass key={n} className="rounded-[24px] p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl grad-brand text-[14px] font-extrabold text-ink">
                  {n}
                </span>
                <Icon size={19} className="shrink-0 text-acid-500" />
                <h3 className="text-[16px] font-bold">{t}</h3>
              </div>
              <p className="mt-2.5 text-[13px] leading-relaxed text-fg/55">
                {d}
              </p>
            </Glass>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ argent */}
      <section className="mt-10">
        <div className="relative overflow-hidden rounded-[30px] grad-brand p-6 text-ink glow-brand">
          <span className="inline-flex rounded-full bg-ink/12 px-3 py-1.5 text-[11px] font-bold leading-none">
            L&apos;argent
          </span>
          <h2 className="display mt-3.5 text-[30px] font-extrabold !leading-[1.08]">
            Tu gardes {Math.round((1 - COMMISSION_RATE) * 100)} %.
          </h2>
          <p className="mt-3 text-[13.5px] leading-relaxed text-ink/70">
            Aucun abonnement, aucun frais d&apos;entrée. On ne prend{" "}
            {Math.round(COMMISSION_RATE * 100)} % que sur ce que tu reçois
            vraiment. Si tu ne reçois rien, tu ne paies rien.
          </p>
          <p className="mt-3 text-[13.5px] leading-relaxed text-ink/70">
            Retrait sur ton compte Wave dès {fcfa(MIN_PAYOUT)}.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------ preuve */}
      {preuve.length > 0 && (
        <section className="mt-10">
          <h2 className="display px-1 text-[26px] font-extrabold !leading-[1.1]">
            Ils y sont déjà
          </h2>
          <p className="mt-1.5 px-1 text-[12.5px] text-fg/45">
            {total} artistes ont leur page sur Amplifan
          </p>

          <div className="mt-5 space-y-2.5">
            {preuve.map(({ artist, count }, i) => (
              <Link
                key={artist.id}
                href={`/a/${artist.slug}`}
                className="block"
              >
                <Glass className="flex items-center gap-3.5 rounded-[24px] px-3.5 py-3 transition active:scale-[.99]">
                  <Avatar
                    name={artist.name}
                    gradient={artist.gradient}
                    src={artist.avatarUrl}
                    size={48}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold">
                      <NameWithBadge
                        name={artist.name}
                        verified={artist.verified}
                      />
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-[11.5px] text-fg/40">
                      {i === 0 && count > 0 && (
                        <Flame size={13} className="shrink-0 text-acid-500" />
                      )}
                      <span className="truncate">
                        {artist.city} · {count} soutien{count > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[15px] font-bold tabular-nums text-acid-500">
                      {compact(artist.monthlyListeners)}
                    </div>
                    <div className="text-[9.5px] font-medium uppercase tracking-wider text-fg/35">
                      auditeurs
                    </div>
                  </div>
                </Glass>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* --------------------------------------------------------------- faq */}
      <section className="mt-10">
        <h2 className="display px-1 text-[26px] font-extrabold !leading-[1.1]">
          Ce qu&apos;on te demande toujours
        </h2>

        <div className="mt-5 space-y-2.5">
          {[
            {
              q: "Je dois arrêter Spotify ou YouTube ?",
              r: "Non. Aucune exclusivité. Tes sons restent où tu veux, et tes clips restent sur YouTube — on ne les héberge même pas.",
            },
            {
              q: "Mes fans doivent créer un compte ?",
              r: "Non. Ils écoutent et te soutiennent sans compte. Le compte ne sert qu'à garder une playlist, ou à toi pour ton espace artiste.",
            },
            {
              q: "Est-ce que je garde mes droits ?",
              r: "Entièrement. Tu déclares que le morceau est à toi, tu le retires quand tu veux. On ne signe rien avec toi.",
            },
            {
              q: "Comment je récupère l'argent ?",
              r: `Tu demandes un retrait depuis ton espace dès ${fcfa(MIN_PAYOUT)}, et tu es payé sur ton compte Wave.`,
            },
            {
              q: "Et si un fan ne veut pas payer ?",
              r: "Il écoute quand même. L'écoute est gratuite et le restera. Tu peux réserver certains inédits à ceux qui te soutiennent, mais c'est toi qui décides.",
            },
          ].map(({ q, r }) => (
            <Glass key={q} className="rounded-[24px] p-5">
              <h3 className="text-[14.5px] font-bold">{q}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-fg/55">{r}</p>
            </Glass>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- dernier */}
      <section className="mt-12 text-center">
        <h2 className="display text-[32px] font-extrabold !leading-[1.08]">
          Ton premier soutien
          <br />
          peut tomber ce soir.
        </h2>
        <p className="mx-auto mt-4 max-w-[360px] text-[14px] leading-relaxed text-fg/50">
          Le temps de déposer deux sons et de coller ton lien dans ta story.
        </p>

        <Link
          href="/connexion"
          className="mt-7 flex h-15 w-full items-center justify-center gap-2 rounded-full grad-brand text-[16.5px] font-bold text-ink glow-brand transition active:scale-[.98]"
        >
          Créer mon espace artiste
          <ChevronRight size={18} />
        </Link>

        {/* whitespace-nowrap : sans lui, « Écoute gratuite » se casse en deux
            lignes sur un écran de 375 px et la ligne devient illisible. */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11.5px] text-fg/35">
          {[
            { Icon: Play, t: "Écoute gratuite" },
            { Icon: Wallet, t: "Paiement Wave" },
            { Icon: Lock, t: "Sans exclusivité" },
          ].map(({ Icon, t }) => (
            <span key={t} className="flex items-center gap-1.5 whitespace-nowrap">
              <Icon size={13} className="shrink-0" />
              {t}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
