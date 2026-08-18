"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  APP_DOMAIN,
  APP_NAME,
  COMMISSION_RATE,
  MIN_PAYOUT,
  MIN_SUPPORT,
  PAYMENT_METHODS,
} from "@/lib/config";
import {
  deleteTrack,
  deplacerMorceau,
  requestPayout,
  updateArtistImage,
  updateArtistProfile,
} from "@/lib/actions";
import { compact, duration, fcfa, timeAgo } from "@/lib/format";
import { PHOTO_RULES } from "@/lib/storage";
import type { Balance } from "@/lib/queries";
import { grouperSoutiens } from "@/lib/soutiens";
import { regionDe } from "@/lib/senegal";
import { ChoixLieu } from "./choix-lieu";
import type { Artist, Support, Track } from "@/lib/types";
import { ArtistView } from "./artist-view";
import { TrackUploadSheet } from "./track-upload-sheet";
import {
  Avatar,
  Button,
  Cover,
  cx,
  Glass,
  NameWithBadge,
  Pill,
  SectionTitle,
  Stat,
} from "./ui";
import { Check, Close, Copy, Lock, Plus, Share, Spark } from "./icons";

type Vue = "artiste" | "fan";

export function DashboardView({
  artist,
  tracks,
  supports,
  balance,
}: {
  artist: Artist;
  tracks: Track[];
  supports: Support[];
  balance: Balance;
}) {
  const [vue, setVue] = useState<Vue>("artiste");

  return (
    <>
      {/* Bascule entre l'atelier et ce que le public voit vraiment. Sans elle,
          l'artiste publie à l'aveugle et découvre le rendu par un fan. */}
      <div className="mb-5 flex gap-1.5 rounded-full glass p-1.5">
        {(
          [
            ["artiste", "Mon atelier"],
            ["fan", "Vue des fans"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setVue(id)}
            className={cx(
              "h-10 flex-1 rounded-full text-[13px] font-semibold transition",
              vue === id ? "grad-brand text-ink glow-brand" : "text-fg/50",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {vue === "fan" ? (
        <div className="rise">
          <div className="mb-4 rounded-2xl border border-brand-500/25 bg-brand-500/[.07] px-4 py-3 text-[12.5px] leading-relaxed text-brand-300">
            Exactement ce que voit quelqu&apos;un qui ouvre ton lien. Les
            boutons fonctionnent : ne te soutiens pas toi-même.
          </div>
          <ArtistView
            artist={artist}
            tracks={tracks}
            supports={supports}
          />
        </div>
      ) : (
        <AtelierView artist={artist} tracks={tracks} supports={supports} />
      )}
    </>
  );
}

/* ================================================================ atelier */

function AtelierView({
  artist,
  tracks,
  supports,
}: {
  artist: Artist;
  tracks: Track[];
  supports: Support[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  // L'onglet « Publier » de la barre du bas mène ici avec ?publier=1. On
  // ouvre la feuille, puis on nettoie l'adresse : sans ça, un simple retour
  // arrière la rouvrirait sans que l'artiste l'ait demandé.
  useEffect(() => {
    if (params.get("publier") !== "1") return;
    setUploadOpen(true);
    router.replace("/dashboard");
  }, [params, router]);
  const [pending, startTransition] = useTransition();

  const link = `${APP_DOMAIN}/a/${artist.slug}`;
  const month = new Date().toISOString().slice(0, 7);
  const thisMonth = supports.filter((s) => s.createdAt.startsWith(month));
  const topSupport = [...supports].sort((a, b) => b.amount - a.amount)[0];

  /**
   * Copier est un mauvais geste sur téléphone : il faut ensuite ouvrir
   * WhatsApp, trouver la conversation, coller. La feuille système y dépose le
   * lien directement. On garde la copie en secours pour les ordinateurs, où
   * le partage natif n'existe pas.
   */
  async function share() {
    const url = `https://${link}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: artist.name,
          text: `Écoute mes sons et soutiens-moi sur ${APP_NAME}`,
          url,
        });
        return;
      } catch {
        /* partage annulé */
      }
    }
    await copy();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(`https://${link}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* presse-papiers indisponible */
    }
  }

  return (
    <>
      <ApercuPage artist={artist} />

      {/* ----------------------------------------------------------- lien */}
      <section className="mt-3.5">
        <Glass className="rounded-[26px] p-4">
          <div className="text-[12px] font-medium text-fg/45">
            Ton lien à mettre en bio
          </div>
          <div className="mt-2.5 flex items-center gap-2.5">
            <div className="min-w-0 flex-1 truncate rounded-xl bg-fg/[.05] px-3.5 py-3 text-[13px] text-fg/80">
              {link}
            </div>
            <button
              onClick={copy}
              aria-label="Copier le lien"
              className={cx(
                "grid h-11 w-11 shrink-0 place-items-center rounded-xl transition active:scale-90",
                copied ? "bg-gold-400 text-ink-950" : "grad-brand text-ink",
              )}
            >
              {copied ? <Check size={17} /> : <Copy size={16} />}
            </button>
          </div>
          <button
            onClick={share}
            className="mt-2.5 flex h-13 w-full items-center justify-center gap-2 rounded-full grad-brand text-[15px] font-bold text-ink transition active:scale-[.98]"
          >
            <Share size={17} />
            Partager mon lien
          </button>

          <p className="mt-2.5 text-[11.5px] leading-relaxed text-fg/40">
            Instagram, TikTok, statut WhatsApp. C&apos;est ce lien qui travaille
            pour toi, pas la plateforme.
          </p>
        </Glass>
      </section>

      {/* ------------------------------------------------------- chiffres */}
      <section className="mt-3.5">
        <Glass className="grid grid-cols-3 divide-x divide-fg/[.07] rounded-[26px] py-4">
          <Stat value={String(thisMonth.length)} label="soutiens ce mois" />
          <Stat
            value={fcfa(topSupport?.amount ?? 0, false)}
            label="plus gros don"
            accent
          />
          <Stat
            value={compact(artist.monthlyListeners)}
            label="auditeurs / mois"
          />
        </Glass>
      </section>

      {/* --------------------------------------------------------- upload */}
      <section className="mt-8">
        <button
          onClick={() => setUploadOpen(true)}
          className="flex w-full items-center gap-3.5 rounded-[26px] grad-brand px-5 py-4 text-left text-ink glow-brand transition active:scale-[.99]"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ink/12">
            <Plus size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15.5px] font-bold">
              Déposer un son
            </span>
            <span className="block text-[11.5px] text-white/75">
              Pochette, featuring, prix — tout au même endroit
            </span>
          </span>
        </button>
      </section>

      <TrackUploadSheet
        artist={artist}
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />

      {/* ----------------------------------------------------------- sons */}
      <section className="mt-8">
        <SectionTitle right={<Pill tone="glass">{tracks.length}</Pill>}>
          Mes sons
        </SectionTitle>

        {tracks.length === 0 ? (
          <Glass className="rounded-[26px] px-5 py-8 text-center">
            <p className="text-[13px] text-fg/50">Aucun son publié.</p>
            <p className="mt-1.5 text-[11.5px] text-fg/35">
              Ta page attend son premier morceau.
            </p>
          </Glass>
        ) : (
          <div className="space-y-3">
            {grouperParProjet(tracks).map((groupe) => (
              <Glass
                key={groupe.cle}
                className="overflow-hidden rounded-[26px]"
              >
                {/* Un projet porte son nom au-dessus de ses morceaux : sans
                    ça, un album de dix titres se lit comme dix singles. */}
                {groupe.projet && (
                  <div className="flex items-center justify-between border-b border-fg/[.06] px-4 py-2.5">
                    <span className="truncate text-[12.5px] font-bold">
                      {groupe.projet}
                    </span>
                    <span className="shrink-0 rounded-full bg-fg/[.07] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fg/45">
                      {groupe.type}
                    </span>
                  </div>
                )}

                <div className="divide-y divide-fg/[.06]">
                  {groupe.morceaux.map((t) => (
                    <LigneMorceau
                      key={t.id}
                      track={t}
                      artist={artist}
                      premier={t.id === tracks[0].id}
                      dernier={t.id === tracks[tracks.length - 1].id}
                    />
                  ))}
                </div>
              </Glass>
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------- soutiens */}
      <section className="mt-8">
        <SectionTitle>Derniers soutiens</SectionTitle>
        <Glass className="overflow-hidden rounded-[26px]">
          <div className="divide-y divide-fg/[.06]">
            {supports.slice(0, 8).map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-fg/[.07] text-[11px] font-semibold text-fg/70">
                  {s.supporterName.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold">
                    {s.supporterName}
                  </div>
                  <div className="truncate text-[11px] text-fg/40">
                    {s.message ??
                      PAYMENT_METHODS.find((m) => m.id === s.method)?.label}
                    {" · "}
                    {timeAgo(s.createdAt)}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[13.5px] font-bold tabular-nums text-gold-700">
                    +{fcfa(Math.round(s.amount * (1 - COMMISSION_RATE)), false)}
                  </div>
                  <div className="text-[10px] tabular-nums text-fg/30">
                    sur {fcfa(s.amount, false)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Glass>
      </section>

      <MesSoutiens supports={supports} />
    </>
  );
}

/* ------------------------------------------------------------ mes sons */

const LIBELLE: Record<string, string> = {
  ep: "EP",
  mixtape: "Mixtape",
  album: "Album",
};

/**
 * Regroupe les morceaux consécutifs d'un même projet.
 *
 * Consécutifs, et pas « tous ceux qui partagent l'identifiant » : la liste est
 * ordonnée par l'artiste, et il doit pouvoir intercaler un single au milieu
 * de son album s'il le veut. On suit son ordre, on ne le corrige pas.
 */
function grouperParProjet(tracks: Track[]) {
  const groupes: {
    cle: string;
    projet?: string;
    type?: string;
    morceaux: Track[];
  }[] = [];

  for (const t of tracks) {
    const dernier = groupes[groupes.length - 1];
    const meme =
      dernier &&
      t.releaseId !== undefined &&
      dernier.cle === t.releaseId;

    if (meme) {
      dernier.morceaux.push(t);
      continue;
    }

    groupes.push({
      cle: t.releaseId ?? `single-${t.id}`,
      projet: t.releaseId ? t.releaseTitle : undefined,
      type: t.releaseType ? LIBELLE[t.releaseType] : undefined,
      morceaux: [t],
    });
  }

  return groupes;
}

/** Une ligne de la liste : le morceau, son rang, et de quoi le retirer. */
function LigneMorceau({
  track,
  artist,
  premier,
  dernier,
}: {
  track: Track;
  artist: Artist;
  premier: boolean;
  dernier: boolean;
}) {
  const router = useRouter();
  const [envoi, demarrer] = useTransition();

  function bouger(sens: -1 | 1) {
    demarrer(async () => {
      await deplacerMorceau({ trackId: track.id, sens });
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3 px-3.5 py-3">
      <Cover
        gradient={artist.gradient}
        src={track.coverUrl}
        alt={track.title}
        rounded="rounded-xl"
        className="h-11 w-11 shrink-0"
      />

      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold">{track.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-fg/40">
          <span>
            {track.duration > 0 ? duration(track.duration) : "durée inconnue"}
          </span>
          {!track.audioUrl && (
            <>
              <span>·</span>
              <span className="text-gold-700">fichier manquant</span>
            </>
          )}
          {track.locked && (
            <>
              <span>·</span>
              <span className="text-gold-700">
                {track.supportMode === "fixe" && track.supportAmount
                  ? fcfa(track.supportAmount, false)
                  : "Inédit"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Deux flèches plutôt qu'un glisser-déposer : attraper une ligne au
          pouce entre dix autres demande une précision que personne n'a, et le
          geste se bat avec le défilement de la page. */}
      <div className="flex shrink-0 flex-col">
        <button
          onClick={() => bouger(-1)}
          disabled={premier || envoi}
          aria-label="Monter"
          className="px-1.5 text-[11px] text-fg/30 disabled:opacity-20"
        >
          ▲
        </button>
        <button
          onClick={() => bouger(1)}
          disabled={dernier || envoi}
          aria-label="Descendre"
          className="px-1.5 text-[11px] text-fg/30 disabled:opacity-20"
        >
          ▼
        </button>
      </div>

      <SupprimerMorceau trackId={track.id} artistSlug={artist.slug} />
    </div>
  );
}

/* --------------------------------------------------------- aperçu page */

/**
 * Ce que voient les fans, en lecture seule.
 *
 * Les champs sont partis dans les réglages : on les remplit une fois, alors
 * que l'atelier s'ouvre pour publier et regarder ce qui rentre. L'aperçu
 * reste, parce qu'un artiste doit voir sa page telle qu'elle est — sans quoi
 * il cadre ses images à l'aveugle.
 */
function ApercuPage({ artist }: { artist: Artist }) {
  return (
    <section className="rise">
      <div className="relative -mx-4">
        <Cover
          gradient={artist.gradient}
          src={artist.coverUrl}
          alt=""
          rounded="rounded-b-[38px]"
          className="h-[220px] w-full"
        />
        <div className="absolute inset-x-0 bottom-0 h-36 rounded-b-[38px] bg-gradient-to-t from-bg via-bg/70 to-transparent" />

        <div className="absolute inset-x-5 bottom-4 flex items-end gap-3.5">
          <Avatar
            name={artist.name}
            gradient={artist.gradient}
            src={artist.avatarUrl}
            size={64}
            ring
          />
          <div className="min-w-0 flex-1 pb-1">
            <div className="text-[10px] uppercase tracking-[.14em] text-fg/40">
              Espace artiste
            </div>
            <div className="display truncate text-[24px] font-extrabold">
              <NameWithBadge name={artist.name} verified={artist.verified} />
            </div>
          </div>
          <Link
            href="/parametres"
            className="shrink-0 rounded-full glass px-3.5 py-2 text-[11.5px] font-semibold text-fg/75 transition active:scale-95"
          >
            Modifier
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------ retirer un son */

/**
 * Retire un morceau, en deux temps.
 *
 * La suppression est définitive et la page de l'artiste est publique : une
 * boîte de dialogue serait ignorée, alors qu'un bouton qui change de tête
 * oblige à regarder ce qu'on fait.
 */
function SupprimerMorceau({
  trackId,
  artistSlug,
}: {
  trackId: string;
  artistSlug: string;
}) {
  const router = useRouter();
  const [confirme, setConfirme] = useState(false);
  const [envoi, demarrer] = useTransition();

  if (!confirme) {
    return (
      <button
        onClick={() => setConfirme(true)}
        aria-label="Retirer ce son"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-fg/25 transition active:scale-90 hover:text-fg/50"
      >
        <Close size={14} />
      </button>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        onClick={() => setConfirme(false)}
        className="rounded-full bg-fg/[.07] px-3 py-1.5 text-[11px] font-semibold text-fg/60"
      >
        Non
      </button>
      <button
        onClick={() =>
          demarrer(async () => {
            const res = await deleteTrack({ trackId, artistSlug });
            if (res.ok) router.refresh();
            else setConfirme(false);
          })
        }
        disabled={envoi}
        className="rounded-full bg-red-500 px-3 py-1.5 text-[11px] font-bold text-white"
      >
        {envoi ? "…" : "Retirer"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------- qui a soutenu */

/**
 * Les gens qui ont déjà payé, une ligne par personne.
 *
 * C'est la liste la plus précieuse pour un rappeur : dans un marché où
 * l'argent est rare, vingt personnes qui ont donné valent mieux que deux mille
 * abonnés. Ce sont elles qu'il recontactera le jour où le courriel marchera.
 *
 * Les « Derniers soutiens » au-dessus racontent l'activité récente ; celle-ci
 * raconte la fidélité — un fan qui revient six fois y remonte en tête, alors
 * qu'il se perdait dans le flux.
 */
function MesSoutiens({ supports }: { supports: Support[] }) {
  const gens = grouperSoutiens(supports);

  // Une section qui s'efface quand elle est vide se lit comme une panne : on
  // ne sait pas si personne n'a soutenu ou si l'écran est cassé. C'est
  // d'autant plus vrai ici que c'est la liste la plus attendue de l'atelier.
  if (gens.length === 0) {
    return (
      <section className="mt-8">
        <SectionTitle>Qui te soutient</SectionTitle>
        <Glass className="rounded-[26px] px-5 py-8 text-center">
          <Spark size={22} className="mx-auto text-fg/20" />
          <p className="mt-3 text-[13px] leading-relaxed text-fg/50">
            Personne ne t&apos;a encore soutenu.
          </p>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-fg/35">
            Partage ton lien : c&apos;est lui qui travaille pour toi.
          </p>
        </Glass>
      </section>
    );
  }

  const fideles = gens.filter((g) => g.nombre > 1).length;

  return (
    <section className="mt-8">
      <SectionTitle
        right={
          fideles > 0 ? (
            <span className="text-[11.5px] text-fg/40">
              {fideles} {fideles > 1 ? "reviennent" : "revient"}
            </span>
          ) : undefined
        }
      >
        Qui te soutient
      </SectionTitle>

      <Glass className="overflow-hidden rounded-[26px]">
        <div className="divide-y divide-fg/[.06]">
          {gens.slice(0, 20).map((g) => (
            <div key={g.cle} className="flex items-center gap-3 px-4 py-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-fg/[.07] text-[12px] font-semibold text-fg/70">
                {g.nom.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[13.5px] font-semibold">
                    {g.nom}
                  </span>
                  {g.nombre > 1 && (
                    <span className="shrink-0 rounded-full bg-acid-500/15 px-2 py-0.5 text-[10px] font-bold text-acid-500">
                      ×{g.nombre}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-fg/40">
                  {/* Un soutien anonyme reste anonyme : le dire évite à
                      l'artiste de croire qu'il pourra le recontacter. */}
                  {g.identifie ? "A un compte" : "Sans compte"}
                  {" · "}
                  {timeAgo(g.dernier)}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[13.5px] font-bold tabular-nums text-gold-700">
                  {fcfa(Math.round(g.total * (1 - COMMISSION_RATE)), false)}
                </div>
                <div className="text-[10px] tabular-nums text-fg/30">
                  sur {fcfa(g.total, false)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Glass>
    </section>
  );
}
