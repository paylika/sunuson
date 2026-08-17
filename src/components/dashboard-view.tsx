"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { APP_DOMAIN, COMMISSION_RATE, MIN_PAYOUT, PAYMENT_METHODS } from "@/lib/config";
import { createTrack, requestPayout } from "@/lib/actions";
import { compact, duration, fcfa, timeAgo } from "@/lib/format";
import type { Balance } from "@/lib/queries";
import type { Artist, Support, Track } from "@/lib/types";
import {
  Avatar,
  Button,
  cx,
  Glass,
  NameWithBadge,
  Pill,
  SectionTitle,
  Stat,
} from "./ui";
import { Check, Copy, Lock, Music, Plus, Upload, Wallet } from "./icons";

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
  const router = useRouter();
  const [copied, setCopied] = useState(false);
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

  function withdraw() {
    startTransition(async () => {
      await requestPayout(artist.id, balance.available);
      router.refresh();
    });
  }

  return (
    <>
      {/* --------------------------------------------------------- entête */}
      <header className="flex items-center gap-3.5">
        <Avatar name={artist.name} gradient={artist.gradient} size={52} ring />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-[.14em] text-fg/35">
            Espace artiste
          </div>
          <div className="truncate text-[19px] font-semibold leading-tight">
            <NameWithBadge name={artist.name} verified={artist.verified} />
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------------- solde */}
      <section className="mt-5 rise">
        {/* Aplat de marque : tout le contenu de la carte est blanc. */}
        <div className="relative overflow-hidden rounded-[32px] grad-brand p-5 text-white">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(60% 60% at 85% 0%, rgba(255,255,255,.5), transparent 60%)",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 text-[12px] text-white/75">
              <Wallet size={15} />
              Disponible au retrait
            </div>
            <div className="mt-2 text-[38px] font-semibold leading-none tracking-tight tabular-nums">
              {fcfa(balance.available, false)}
              <span className="ml-2 text-[15px] font-normal opacity-70">
                FCFA
              </span>
            </div>
            <div className="mt-1.5 text-[11.5px] text-white/70">
              {fcfa(balance.gross)} reçus · commission{" "}
              {Math.round(COMMISSION_RATE * 100)} % déduite
            </div>

            <button
              onClick={withdraw}
              disabled={balance.available < MIN_PAYOUT || pending}
              className="mt-4 h-12 w-full rounded-full bg-white text-[15px] font-semibold text-brand-300 transition active:scale-[.98] disabled:opacity-45 disabled:active:scale-100"
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
                  className="rounded-full bg-black/25 px-2.5 py-1 text-[10px] text-white/80"
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
        <Glass className="p-4">
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
                copied ? "bg-gold-400 text-ink-950" : "grad-brand text-white",
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
        <Glass className="grid grid-cols-3 divide-x divide-fg/10 py-4">
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
      <section className="mt-7">
        <SectionTitle>Déposer un son</SectionTitle>
        <UploadForm artistId={artist.id} artistSlug={artist.slug} />
      </section>

      {/* ----------------------------------------------------------- sons */}
      <section className="mt-7">
        <SectionTitle right={<Pill tone="glass">{tracks.length}</Pill>}>
          Mes sons
        </SectionTitle>
        <Glass className="overflow-hidden">
          <div className="divide-y divide-fg/[.06]">
            {tracks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3.5">
                <span
                  className={cx(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                    t.locked
                      ? "bg-gold-400/15 text-gold-700"
                      : "bg-fg/10 text-fg/55",
                  )}
                >
                  {t.locked ? <Lock size={15} /> : <Music size={15} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium">
                    {t.title}
                  </div>
                  <div className="text-[11px] text-fg/40">
                    {t.duration > 0 ? duration(t.duration) : "durée inconnue"}
                    {t.plays > 0 && ` · ${compact(t.plays)} écoutes`}
                    {t.locked && " · inédit, débloqué au soutien"}
                    {!t.audioUrl && " · fichier manquant"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Glass>
      </section>

      {/* ------------------------------------------------------- soutiens */}
      <section className="mt-7">
        <SectionTitle>Derniers soutiens</SectionTitle>
        <Glass className="overflow-hidden">
          <div className="divide-y divide-fg/[.06]">
            {supports.slice(0, 8).map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-fg/10 text-[11px] font-semibold text-fg/70">
                  {s.supporterName.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-medium">
                    {s.supporterName}
                  </div>
                  <div className="truncate text-[11px] text-fg/40">
                    {s.message ??
                      PAYMENT_METHODS.find((m) => m.id === s.method)?.label}
                    {" · "}
                    {timeAgo(s.createdAt, new Date())}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[13.5px] font-semibold tabular-nums text-gold-700">
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

/* ---------------------------------------------------------------- upload */

function UploadForm({
  artistId,
  artistSlug,
}: {
  artistId: string;
  artistSlug: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [locked, setLocked] = useState(false);
  const [rights, setRights] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const ready = title.trim().length > 1 && rights && !pending;

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createTrack({
        artistId,
        artistSlug,
        title,
        locked,
        rightsOk: rights,
      });

      if (!res.ok) {
        setError(res.error ?? "Échec de la publication.");
        return;
      }

      setTitle("");
      setFile(null);
      setLocked(false);
      setRights(false);
      if (inputRef.current) inputRef.current.value = "";
      setDone(true);
      window.setTimeout(() => setDone(false), 2200);
      router.refresh();
    });
  }

  return (
    <Glass className="p-4">
      <button
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center gap-3.5 rounded-2xl border border-dashed border-fg/20 bg-fg/[.02] px-4 py-5 text-left transition active:scale-[.99]"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl grad-brand text-white">
          <Upload size={18} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-medium">
            {file ? file.name : "Choisir un fichier audio"}
          </span>
          <span className="block text-[11.5px] text-fg/40">
            MP3 ou WAV · encodé en 128 kbps à l&apos;envoi
          </span>
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          setFile(f);
          if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
        }}
      />

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre du son"
        maxLength={60}
        className="mt-3 w-full rounded-2xl glass px-4 py-3.5 text-[14px] outline-none placeholder:text-fg/35"
      />

      <button
        onClick={() => setLocked((v) => !v)}
        className="mt-2.5 flex w-full items-center gap-3 rounded-2xl glass px-4 py-3.5 text-left"
      >
        <Lock size={16} className={locked ? "text-gold-700" : "text-fg/40"} />
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-medium">
            Réserver aux soutiens
          </span>
          <span className="block text-[11px] text-fg/40">
            Le son ne s&apos;ouvre qu&apos;après un paiement
          </span>
        </span>
        <span
          className={cx(
            "relative h-6 w-11 shrink-0 rounded-full transition",
            locked ? "grad-brand" : "bg-fg/15",
          )}
        >
          <span
            className={cx(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all",
              locked ? "left-[22px]" : "left-0.5",
            )}
          />
        </span>
      </button>

      <button
        onClick={() => setRights((v) => !v)}
        className="mt-2.5 flex w-full items-start gap-3 px-1 py-2 text-left"
      >
        <span
          className={cx(
            "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition",
            rights ? "border-transparent grad-brand text-white" : "border-fg/25",
          )}
        >
          {rights && <Check size={12} />}
        </span>
        <span className="text-[11.5px] leading-relaxed text-fg/50">
          Je détiens les droits sur ce morceau et j&apos;autorise sa diffusion
          sur la plateforme.
        </span>
      </button>

      {error && (
        <p className="mt-2 px-1 text-[12px] text-red-600">{error}</p>
      )}

      <Button onClick={submit} disabled={!ready} className="mt-3 w-full">
        {done ? (
          <>
            <Check size={16} /> Son ajouté
          </>
        ) : pending ? (
          "Publication…"
        ) : (
          <>
            <Plus size={16} /> Publier le son
          </>
        )}
      </Button>

      <p className="mt-2.5 px-1 text-[11px] leading-relaxed text-fg/35">
        Le fichier n&apos;est pas encore envoyé : seule la fiche du morceau est
        créée. L&apos;upload vers le stockage arrive ensuite.
      </p>
    </Glass>
  );
}
