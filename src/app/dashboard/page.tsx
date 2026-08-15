"use client";

import { useMemo, useRef, useState } from "react";
import {
  APP_DOMAIN,
  COMMISSION_RATE,
  MIN_PAYOUT,
  PAYMENT_METHODS,
} from "@/lib/config";
import { artists, CURRENT_ARTIST_ID, getTracksByArtist } from "@/lib/data";
import { compact, duration, fcfa, timeAgo } from "@/lib/format";
import type { Track } from "@/lib/types";
import { useSupports } from "@/components/providers";
import { Shell } from "@/components/shell";
import {
  Avatar,
  Button,
  cx,
  Glass,
  NameWithBadge,
  Pill,
  SectionTitle,
  Stat,
} from "@/components/ui";
import { Check, Copy, Lock, Music, Plus, Upload, Wallet } from "@/components/icons";

export default function DashboardPage() {
  const artist = artists.find((a) => a.id === CURRENT_ARTIST_ID)!;
  const { forArtist } = useSupports();
  const supports = forArtist(artist.id);

  const [extra, setExtra] = useState<Track[]>([]);
  const [copied, setCopied] = useState(false);
  const [withdrawn, setWithdrawn] = useState(0);

  const tracks = useMemo(
    () => [...extra, ...getTracksByArtist(artist.id)],
    [extra, artist.id],
  );

  const brut = supports.reduce((s, x) => s + x.amount, 0);
  const net = Math.round(brut * (1 - COMMISSION_RATE));
  const solde = net - withdrawn;
  const link = `${APP_DOMAIN}/a/${artist.slug}`;

  const thisMonth = supports.filter((s) => s.createdAt.startsWith("2026-08"));
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
    <Shell>
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
        {/* Carte de solde : aplat de marque, donc tout son contenu est blanc. */}
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
              {fcfa(solde, false)}
              <span className="ml-2 text-[15px] font-normal opacity-70">
                FCFA
              </span>
            </div>
            <div className="mt-1.5 text-[11.5px] text-white/70">
              {fcfa(brut)} reçus · commission{" "}
              {Math.round(COMMISSION_RATE * 100)} % déduite
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                variant="glass"
                disabled={solde < MIN_PAYOUT}
                onClick={() => setWithdrawn(net)}
                className="flex-1 border-transparent bg-white text-brand-300 shadow-none"
              >
                {solde < MIN_PAYOUT
                  ? `Minimum ${fcfa(MIN_PAYOUT)}`
                  : "Retirer sur Wave"}
              </Button>
            </div>

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

      {/* ------------------------------------------------------ chiffres */}
      <section className="mt-3.5">
        <Glass className="grid grid-cols-3 divide-x divide-fg/10 py-4">
          <Stat value={String(thisMonth.length)} label="soutiens en août" />
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
        <UploadForm onAdd={(t) => setExtra((e) => [t, ...e])} />
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
                    {duration(t.duration)}
                    {t.plays > 0 && ` · ${compact(t.plays)} écoutes`}
                    {t.locked && " · inédit, débloqué au soutien"}
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
                    {s.message ?? PAYMENT_METHODS.find((m) => m.id === s.method)?.label}
                    {" · "}
                    {timeAgo(s.createdAt)}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[13.5px] font-semibold tabular-nums text-gold-700">
                    +{fcfa(Math.round(s.amount * (1 - COMMISSION_RATE)), false)}
                  </div>
                  <div className="text-[10px] text-fg/30 tabular-nums">
                    sur {fcfa(s.amount, false)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Glass>
      </section>
    </Shell>
  );
}

/* ---------------------------------------------------------------- upload */

function UploadForm({ onAdd }: { onAdd: (t: Track) => void }) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [locked, setLocked] = useState(false);
  const [rights, setRights] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ready = title.trim().length > 1 && rights;

  function submit() {
    onAdd({
      id: `t_${Math.round(performance.now() * 1000)}`,
      artistId: CURRENT_ARTIST_ID,
      title: title.trim(),
      duration: 180,
      plays: 0,
      releasedAt: new Date().toISOString().slice(0, 10),
      locked,
    });
    setTitle("");
    setFile(null);
    setLocked(false);
    setRights(false);
    if (inputRef.current) inputRef.current.value = "";
    setDone(true);
    window.setTimeout(() => setDone(false), 2200);
  }

  return (
    <Glass className="p-4">
      <button
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center gap-3.5 rounded-2xl border border-dashed border-fg/20 bg-fg/[.03] px-4 py-5 text-left transition active:scale-[.99]"
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
              "absolute top-0.5 h-5 w-5 rounded-full bg-fg transition-all",
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

      <Button onClick={submit} disabled={!ready} className="mt-3 w-full">
        {done ? (
          <>
            <Check size={16} /> Son ajouté
          </>
        ) : (
          <>
            <Plus size={16} /> Publier le son
          </>
        )}
      </Button>
    </Glass>
  );
}
