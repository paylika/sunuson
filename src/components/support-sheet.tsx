"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createSupport } from "@/lib/actions";
import {
  COMMISSION_RATE,
  MAX_SUPPORT,
  MIN_SUPPORT,
  PAYMENT_METHODS,
  SUPPORT_PRESETS,
  type PaymentMethod,
} from "@/lib/config";
import { fcfa } from "@/lib/format";
import type { Artist, Track } from "@/lib/types";
import { useUnlock } from "./providers";
import { Avatar, Button, cx, Glass } from "./ui";
import { Check, Close, Lock, Spark } from "./icons";

type Step = "montant" | "paiement" | "fait";

export function SupportSheet({
  artist,
  track,
  open,
  onClose,
}: {
  artist: Artist;
  track?: Track;
  open: boolean;
  onClose: () => void;
}) {
  const { unlock } = useUnlock();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("montant");
  const [amount, setAmount] = useState<number>(2000);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("wave");
  const [pending, setPending] = useState(false);

  // Remise à zéro à chaque ouverture, sinon on retombe sur l'écran de succès.
  useEffect(() => {
    if (!open) return;
    setStep("montant");
    setAmount(2000);
    setCustom("");
    setMessage("");
    setPending(false);
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const artistGets = useMemo(
    () => Math.round(amount * (1 - COMMISSION_RATE)),
    [amount],
  );
  const valid = amount >= MIN_SUPPORT && amount <= MAX_SUPPORT;

  if (!open) return null;

  function pickCustom(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 7);
    setCustom(digits);
    setAmount(digits ? Number(digits) : 0);
  }

  async function confirm() {
    setPending(true);
    setError(null);

    const result = await createSupport({
      artistSlug: artist.slug,
      artistId: artist.id,
      trackId: track?.id,
      supporterName: name,
      amount,
      message: message.trim() || undefined,
      method,
    });

    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (track?.locked) unlock(track.id);
    // Le soutien est en base : on redemande la page pour que le mur et les
    // totaux reflètent la réalité plutôt qu'un état local.
    router.refresh();
    setStep("fait");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm fade"
      />

      <div className="relative w-full max-w-[480px] sheet-up">
        <div className="glass-strong rounded-t-[34px] px-5 pb-8 pt-3 max-h-[92dvh] overflow-y-auto">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-fg/25" />

          {step !== "fait" && (
            <button
              onClick={onClose}
              className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full glass text-fg/70"
            >
              <Close size={16} />
            </button>
          )}

          {step === "montant" && (
            <MontantStep
              artist={artist}
              track={track}
              amount={amount}
              custom={custom}
              onPreset={(v) => {
                setAmount(v);
                setCustom("");
              }}
              onCustom={pickCustom}
              name={name}
              setName={setName}
              message={message}
              setMessage={setMessage}
              artistGets={artistGets}
              valid={valid}
              onNext={() => setStep("paiement")}
            />
          )}

          {step === "paiement" && (
            <PaiementStep
              amount={amount}
              method={method}
              setMethod={setMethod}
              pending={pending}
              error={error}
              onBack={() => setStep("montant")}
              onConfirm={confirm}
            />
          )}

          {step === "fait" && (
            <FaitStep
              artist={artist}
              track={track}
              amount={amount}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- étape 1 */

function MontantStep({
  artist,
  track,
  amount,
  custom,
  onPreset,
  onCustom,
  name,
  setName,
  message,
  setMessage,
  artistGets,
  valid,
  onNext,
}: {
  artist: Artist;
  track?: Track;
  amount: number;
  custom: string;
  onPreset: (v: number) => void;
  onCustom: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  message: string;
  setMessage: (v: string) => void;
  artistGets: number;
  valid: boolean;
  onNext: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-3 pr-12">
        <Avatar name={artist.name} gradient={artist.gradient} size={46} ring />
        <div className="min-w-0">
          <div className="text-[17px] font-semibold leading-tight">
            Soutenir {artist.name}
          </div>
          <div className="truncate text-[12px] text-fg/50">
            {track ? `Sur « ${track.title} »` : `${artist.city} · Rap`}
          </div>
        </div>
      </div>

      <div className="mt-6 mb-2 text-[12px] font-medium text-fg/45">
        Choisis ton montant
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {SUPPORT_PRESETS.map((v) => {
          const active = !custom && amount === v;
          return (
            <button
              key={v}
              onClick={() => onPreset(v)}
              className={cx(
                "h-16 rounded-2xl text-[15px] font-semibold tabular-nums transition",
                active
                  ? "grad-brand text-white shadow-[0_10px_30px_-12px_rgba(224,78,200,.9)]"
                  : "glass text-fg/80 active:scale-[.97]",
              )}
            >
              {fcfa(v, false)}
              <span className="ml-1 text-[10px] font-normal opacity-60">F</span>
            </button>
          );
        })}

        <div
          className={cx(
            "flex h-16 items-center rounded-2xl px-3 transition",
            custom
              ? "grad-brand text-white shadow-[0_10px_30px_-12px_rgba(224,78,200,.9)]"
              : "glass",
          )}
        >
          <input
            inputMode="numeric"
            placeholder="Libre"
            value={custom}
            onChange={(e) => onCustom(e.target.value)}
            className="w-full bg-transparent text-[15px] font-semibold tabular-nums outline-none placeholder:font-normal placeholder:text-fg/40"
          />
          <span className="text-[10px] opacity-60">F</span>
        </div>
      </div>

      <div className="mt-5 space-y-2.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ton nom (affiché publiquement)"
          maxLength={28}
          className="h-13 w-full rounded-2xl glass px-4 py-3.5 text-[14px] outline-none placeholder:text-fg/35 focus:border-fg/25"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Un mot pour l'artiste (facultatif)"
          rows={2}
          maxLength={120}
          className="w-full resize-none rounded-2xl glass px-4 py-3.5 text-[14px] outline-none placeholder:text-fg/35 focus:border-fg/25"
        />
      </div>

      {track?.locked && (
        <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-gold-400/25 bg-gold-400/10 px-4 py-3">
          <Lock className="text-gold-700 shrink-0" size={16} />
          <p className="text-[12.5px] leading-snug text-gold-700/90">
            Ton soutien débloque « {track.title} » tout de suite.
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between px-1 text-[12px]">
        <span className="text-fg/45">L&apos;artiste reçoit</span>
        <span className="font-semibold tabular-nums text-fg/85">
          {fcfa(artistGets)}
        </span>
      </div>

      <Button
        onClick={onNext}
        disabled={!valid}
        className="mt-4 w-full"
      >
        <Spark size={17} />
        Continuer · {fcfa(amount)}
      </Button>

      <p className="mt-3 text-center text-[11px] leading-relaxed text-fg/35">
        Commission plateforme {Math.round(COMMISSION_RATE * 100)} %. Minimum{" "}
        {fcfa(MIN_SUPPORT)}.
      </p>
    </>
  );
}

/* --------------------------------------------------------------- étape 2 */

function PaiementStep({
  amount,
  method,
  setMethod,
  pending,
  error,
  onBack,
  onConfirm,
}: {
  amount: number;
  method: PaymentMethod;
  setMethod: (m: PaymentMethod) => void;
  pending: boolean;
  error: string | null;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <div className="pr-12">
        <div className="text-[17px] font-semibold leading-tight">Paiement</div>
        <div className="text-[12px] text-fg/50">
          Tu envoies {fcfa(amount)}
        </div>
      </div>

      <div className="mt-6 space-y-2.5">
        {PAYMENT_METHODS.map((m) => {
          const active = method === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={cx(
                "flex w-full items-center gap-3.5 rounded-2xl px-4 py-4 text-left transition",
                active
                  ? "border border-fg/25 bg-fg/10"
                  : "glass active:scale-[.99]",
              )}
            >
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[12px] font-bold text-white"
                style={{ background: m.tint }}
              >
                {m.label.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">
                  {m.label}
                </span>
                <span className="block text-[11.5px] text-fg/45">
                  {m.hint}
                </span>
              </span>
              <span
                className={cx(
                  "grid h-6 w-6 place-items-center rounded-full border transition",
                  active
                    ? "border-transparent grad-brand text-white"
                    : "border-fg/25",
                )}
              >
                {active && <Check size={13} />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl glass px-4 py-3.5 text-[12px] leading-relaxed text-fg/50">
        Tu vas recevoir une demande de paiement sur ton téléphone. Valide-la
        pour confirmer ton soutien.
      </div>

      {error && (
        <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[12.5px] leading-snug text-red-600">
          {error}
        </div>
      )}

      <div className="mt-5 flex gap-2.5">
        <Button variant="glass" onClick={onBack} className="px-6">
          Retour
        </Button>
        <Button onClick={onConfirm} disabled={pending} className="flex-1">
          {pending ? "Envoi en cours…" : `Payer ${fcfa(amount)}`}
        </Button>
      </div>
    </>
  );
}

/* --------------------------------------------------------------- étape 3 */

function FaitStep({
  artist,
  track,
  amount,
  onClose,
}: {
  artist: Artist;
  track?: Track;
  amount: number;
  onClose: () => void;
}) {
  return (
    <div className="py-4 text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full grad-brand text-white shadow-[0_16px_50px_-12px_rgba(224,78,200,.9)]">
        <Check size={34} />
      </div>

      <h3 className="mt-5 text-[22px] font-semibold tracking-tight">
        Merci, c&apos;est parti !
      </h3>
      <p className="mx-auto mt-2 max-w-[300px] text-[13.5px] leading-relaxed text-fg/55">
        Tu viens d&apos;envoyer {fcfa(amount)} à {artist.name}. Ton nom apparaît
        maintenant sur sa page.
      </p>

      {track?.locked && (
        <Glass className="mt-5 flex items-center gap-3 px-4 py-3.5 text-left">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-400/15 text-gold-700">
            <Check size={17} />
          </span>
          <span className="min-w-0">
            <span className="block text-[13.5px] font-semibold">
              « {track.title} » débloqué
            </span>
            <span className="block text-[11.5px] text-fg/45">
              Disponible dans la liste des sons
            </span>
          </span>
        </Glass>
      )}

      <Button onClick={onClose} className="mt-6 w-full">
        Retour à la page
      </Button>
    </div>
  );
}
