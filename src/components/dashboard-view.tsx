"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  APP_DOMAIN,
  COMMISSION_RATE,
  MIN_PAYOUT,
  MIN_SUPPORT,
  PAYMENT_METHODS,
} from "@/lib/config";
import {
  requestPayout,
  updateArtistImage,
  updateArtistProfile,
} from "@/lib/actions";
import { compact, duration, fcfa, timeAgo } from "@/lib/format";
import { PHOTO_RULES } from "@/lib/storage";
import type { Balance } from "@/lib/queries";
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
import { Check, Copy, Lock, Plus, Wallet } from "./icons";

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
        <AtelierView
          artist={artist}
          tracks={tracks}
          supports={supports}
          balance={balance}
        />
      )}
    </>
  );
}

/* ================================================================ atelier */

function AtelierView({
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
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const link = `${APP_DOMAIN}/a/${artist.slug}`;
  const month = new Date().toISOString().slice(0, 7);
  const thisMonth = supports.filter((s) => s.createdAt.startsWith(month));
  const topSupport = [...supports].sort((a, b) => b.amount - a.amount)[0];

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
      <ProfileEditor artist={artist} />

      {/* ---------------------------------------------------------- solde */}
      <section className="mt-4 rise">
        {/* Seul écran qui garde un aplat vif : c'est le moment de
            récompense. Sur l'accent acide, tout le contenu passe en encre
            sombre — du blanc y serait illisible. */}
        <div className="relative overflow-hidden rounded-[30px] grad-brand p-5 text-ink glow-brand">
          <div className="relative">
            <div className="flex items-center gap-2 text-[12px] font-medium text-ink/65">
              <Wallet size={15} />
              Disponible au retrait
            </div>
            <div className="display mt-2 text-[46px] font-extrabold tabular-nums">
              {fcfa(balance.available, false)}
              <span className="ml-2 text-[15px] font-semibold opacity-55">
                FCFA
              </span>
            </div>
            <div className="mt-1.5 text-[11.5px] font-medium text-ink/60">
              {fcfa(balance.gross)} reçus · commission{" "}
              {Math.round(COMMISSION_RATE * 100)} % déduite
            </div>

            <button
              onClick={() =>
                startTransition(async () => {
                  await requestPayout(artist.id, balance.available);
                  router.refresh();
                })
              }
              disabled={balance.available < MIN_PAYOUT || pending}
              className="mt-4 h-12 w-full rounded-full bg-ink text-[15px] font-semibold text-fg transition active:scale-[.98] disabled:opacity-40 disabled:active:scale-100"
            >
              {pending
                ? "Demande en cours…"
                : balance.available < MIN_PAYOUT
                  ? `Minimum ${fcfa(MIN_PAYOUT)}`
                  : "Retirer sur Wave"}
            </button>

            <div className="mt-3 flex gap-1.5">
              {PAYMENT_METHODS.map((m) => (
                <span
                  key={m.id}
                  className="rounded-full bg-ink/12 px-2.5 py-1 text-[10px] font-semibold text-ink/70"
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

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
        <Glass className="overflow-hidden rounded-[26px]">
          <div className="divide-y divide-fg/[.06]">
            {tracks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-3.5 py-3">
                <Cover
                  gradient={artist.gradient}
                  src={t.coverUrl}
                  alt={t.title}
                  rounded="rounded-xl"
                  className="h-11 w-11 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold">
                    {t.title}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-fg/40">
                    <span>
                      {t.duration > 0 ? duration(t.duration) : "durée inconnue"}
                    </span>
                    {t.label && (
                      <>
                        <span>·</span>
                        <span>{t.label}</span>
                      </>
                    )}
                    {!t.audioUrl && (
                      <>
                        <span>·</span>
                        <span className="text-gold-700">fichier manquant</span>
                      </>
                    )}
                  </div>
                </div>
                {t.locked && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-gold-400/15 px-2.5 py-1 text-[10px] font-semibold text-gold-700">
                    <Lock size={11} />
                    {t.supportMode === "fixe" && t.supportAmount
                      ? fcfa(t.supportAmount, false)
                      : "Inédit"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Glass>
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
    </>
  );
}

/* ========================================================= profil artiste */

function ProfileEditor({ artist }: { artist: Artist }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"avatar" | "cover" | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  async function send(kind: "avatar" | "cover", file: File) {
    setError(null);
    setBusy(kind);

    const fd = new FormData();
    fd.set("artistId", artist.id);
    fd.set("artistSlug", artist.slug);
    fd.set("kind", kind);
    fd.set("file", file);

    const res = await updateArtistImage(fd);
    setBusy(null);

    if (!res.ok) setError(res.error);
    else router.refresh();
  }

  return (
    <section className="rise">
      {/* Cadrage IDENTIQUE à la page publique : même hauteur, même fondu vers
          le fond, même position de la photo. L'artiste voit exactement ce que
          verra le fan — sinon il cadre son image sur une bande et découvre
          ensuite qu'elle est rognée. */}
      <div className="relative -mx-4">
        <Cover
          gradient={artist.gradient}
          src={artist.coverUrl}
          alt=""
          rounded="rounded-b-[38px]"
          className="h-[300px] w-full"
        />
        <div className="absolute inset-x-0 bottom-0 h-44 rounded-b-[38px] bg-gradient-to-t from-bg via-bg/70 to-transparent" />

        <PencilButton
          label="Changer la bannière"
          busy={busy === "cover"}
          onClick={() => coverRef.current?.click()}
          className="absolute right-4 top-4"
        />

        <div className="absolute inset-x-5 bottom-5 flex items-end gap-3.5">
          <div className="relative shrink-0">
            <Avatar
              name={artist.name}
              gradient={artist.gradient}
              src={artist.avatarUrl}
              size={76}
              ring
            />
            <PencilButton
              label="Changer la photo"
              busy={busy === "avatar"}
              onClick={() => avatarRef.current?.click()}
              className="absolute -bottom-1 -right-1"
              small
            />
          </div>
          <div className="min-w-0 pb-1.5">
            <div className="text-[10.5px] uppercase tracking-[.14em] text-fg/40">
              Espace artiste
            </div>
            <div className="display text-[30px] font-extrabold">
              <NameWithBadge name={artist.name} verified={artist.verified} />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-[12.5px] text-red-600">
          {error}
        </p>
      )}

      <ProfileFields artist={artist} />

      <input
        ref={avatarRef}
        type="file"
        accept={PHOTO_RULES.types.join(",")}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void send("avatar", f);
          e.target.value = "";
        }}
      />
      <input
        ref={coverRef}
        type="file"
        accept={PHOTO_RULES.types.join(",")}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void send("cover", f);
          e.target.value = "";
        }}
      />
    </section>
  );
}

/**
 * Bio, ville et label. Le bouton d'enregistrement n'apparaît qu'une fois
 * quelque chose modifié : sans ça, l'artiste ne sait pas s'il a un
 * changement en attente.
 */
function ProfileFields({ artist }: { artist: Artist }) {
  const router = useRouter();
  const [bio, setBio] = useState(artist.bio);
  const [city, setCity] = useState(artist.city);
  const [label, setLabel] = useState(artist.label ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const dirty =
    bio !== artist.bio ||
    city !== artist.city ||
    label !== (artist.label ?? "");

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateArtistProfile({
        artistId: artist.id,
        artistSlug: artist.slug,
        bio,
        city,
        label,
      });
      if (!res.ok) {
        setError(res.error ?? "Enregistrement impossible.");
        return;
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
      router.refresh();
    });
  }

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <span className="text-[12px] font-semibold text-fg/50">
          Ma présentation
        </span>
        <span className="text-[10.5px] tabular-nums text-fg/35">
          {bio.length}/300
        </span>
      </div>

      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value.slice(0, 300))}
        placeholder="Deux ou trois phrases : ton style, d'où tu viens, ce qui arrive."
        rows={4}
        className="w-full resize-none rounded-2xl glass px-4 py-3.5 text-[13.5px] leading-relaxed outline-none placeholder:text-fg/35"
      />

      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ville"
          maxLength={60}
          className="w-full rounded-2xl glass px-4 py-3.5 text-[14px] outline-none placeholder:text-fg/35"
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label"
          maxLength={60}
          className="w-full rounded-2xl glass px-4 py-3.5 text-[14px] outline-none placeholder:text-fg/35"
        />
      </div>

      <p className="mt-1.5 px-1 text-[10.5px] leading-relaxed text-fg/35">
        Label vide = affiché « Indépendant ». Ton nom d&apos;artiste vient de
        ton compte, il ne se modifie pas ici.
      </p>

      {error && (
        <p className="mt-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-[12.5px] text-red-600">
          {error}
        </p>
      )}

      {(dirty || saved) && (
        <Button
          onClick={save}
          disabled={pending || !dirty}
          className="mt-3 w-full fade"
        >
          {saved ? (
            <>
              <Check size={16} /> Enregistré
            </>
          ) : pending ? (
            "Enregistrement…"
          ) : (
            "Enregistrer les modifications"
          )}
        </Button>
      )}
    </div>
  );
}

function PencilButton({
  label,
  onClick,
  busy,
  className,
  small,
}: {
  label: string;
  onClick: () => void;
  busy?: boolean;
  className?: string;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      disabled={busy}
      className={cx(
        "grid place-items-center rounded-full bg-fg text-ink shadow-[0_4px_14px_-4px_rgba(0,0,0,.8)] transition active:scale-90 disabled:opacity-60",
        small ? "h-8 w-8" : "h-9 w-9",
        className,
      )}
    >
      {busy ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-fg/20 border-t-brand-500" />
      ) : (
        <PencilIcon size={small ? 13 : 15} />
      )}
    </button>
  );
}

function PencilIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="m14.5 6.5 3 3" />
    </svg>
  );
}
