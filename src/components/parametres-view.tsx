"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signOut, updatePayout } from "@/lib/actions";
import {
  APP_DOMAIN,
  APP_NAME,
  COMMISSION_RATE,
  MIN_PAYOUT,
  PAYMENT_METHODS,
  type PaymentMethod,
} from "@/lib/config";
import { fcfa } from "@/lib/format";
import type { Balance } from "@/lib/queries";
import type { Artist } from "@/lib/types";
import { BackButton } from "./page-header";
import { ProfilArtisteEditeur } from "./profil-artiste";
import { SoldeArtiste } from "./solde-artiste";
import { Avatar, cx, Glass } from "./ui";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Copy,
  LogOut,
  UserIcon,
  Wallet,
} from "./icons";

export type Payout = { method: PaymentMethod; number: string };

export function ParametresView({
  email,
  artist,
  payout,
  avatarUrl,
  nom,
  balance,
}: {
  email: string;
  artist: Artist | null;
  payout: Payout | null;
  /** Photo du compte fan. L'artiste, lui, a déjà la sienne sur sa page. */
  avatarUrl?: string;
  /** Nom choisi par le fan. */
  nom?: string;
  /** Solde de l'artiste. Absent pour un fan. */
  balance?: Balance | null;
}) {
  return (
    <>
      <header className="mb-6 flex items-center gap-3">
        <BackButton fallback="/dashboard" />
        <h1 className="display flex-1 text-[26px] font-extrabold">
          Paramètres
        </h1>
      </header>

      <Bloc titre="Compte">
        <Glass className="flex items-center gap-3.5 rounded-[24px] px-4 py-3.5">
          {artist ? (
            <Avatar
              name={artist.name}
              gradient={artist.gradient}
              src={artist.avatarUrl}
              size={44}
            />
          ) : (
            <Avatar
              name={nom || email.split("@")[0] || "fan"}
              gradient={["#2a2d34", "#141619"]}
              src={avatarUrl}
              size={44}
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14.5px] font-semibold">
              {artist ? artist.name : nom || email}
            </div>
            <div className="mt-0.5 truncate text-[11.5px] text-fg/40">
              {artist ? "Compte artiste" : `Compte fan · ${email}`}
            </div>
          </div>
        </Glass>
      </Bloc>

      {/* L'identité vient d'abord : c'est ce qu'on cherche en ouvrant les
          réglages, avant le lien et avant l'argent. */}
      {artist && (
        <Bloc
          titre="Ma page"
          note="Ton nom d'artiste vient de ton compte et ne se modifie pas ici."
        >
          <ProfilArtisteEditeur artist={artist} />
        </Bloc>
      )}

      {artist && (
        <Bloc titre="Mon lien">
          <Link href={`/a/${artist.slug}`} className="block">
            <Glass className="flex items-center gap-3.5 rounded-[24px] px-4 py-3.5 transition active:scale-[.99]">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-acid-500/10 text-acid-500">
                <ArrowUpRight size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14.5px] font-semibold">
                  Voir ma page
                </div>
                <div className="mt-0.5 truncate text-[11.5px] text-fg/40">
                  {APP_DOMAIN}/a/{artist.slug}
                </div>
              </div>
            </Glass>
          </Link>

          <CopierLien slug={artist.slug} />
        </Bloc>
      )}

      {artist && balance && (
        <Bloc
          titre="Mon argent"
          note={`${Math.round((1 - COMMISSION_RATE) * 100)} % de chaque soutien te revient. Retrait dès ${fcfa(MIN_PAYOUT)}.`}
        >
          <SoldeArtiste artist={artist} balance={balance} />
        </Bloc>
      )}

      {artist && payout && (
        <Bloc
          titre="Où tu reçois l'argent"
          note="Ce numéro n'apparaît nulle part sur ta page publique."
        >
          <FormulaireRetrait artistId={artist.id} initial={payout} />
        </Bloc>
      )}

      {!artist && (
        <Bloc titre="Artiste">
          <Link href="/dashboard" className="block">
            <Glass className="flex items-center gap-3.5 rounded-[24px] px-4 py-3.5 transition active:scale-[.99]">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-acid-500/10 text-acid-500">
                <UserIcon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-semibold">
                  Ouvrir ma page d&apos;artiste
                </div>
                <div className="mt-0.5 text-[11.5px] text-fg/40">
                  Tu gardes ce compte et ta playlist
                </div>
              </div>
              <ChevronRight size={16} className="shrink-0 text-fg/30" />
            </Glass>
          </Link>
        </Bloc>
      )}

      <Deconnexion />

      <p className="mt-8 text-center text-[10.5px] text-fg/25">
        {APP_NAME} — {APP_DOMAIN}
      </p>
    </>
  );
}

/* ------------------------------------------------------------- structure */

function Bloc({
  titre,
  note,
  children,
}: {
  titre: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-7">
      <h2 className="mb-2.5 px-1 text-[11.5px] font-bold uppercase tracking-wider text-fg/35">
        {titre}
      </h2>
      <div className="space-y-2.5">{children}</div>
      {note && (
        <p className="mt-2.5 px-1 text-[11.5px] leading-relaxed text-fg/35">
          {note}
        </p>
      )}
    </section>
  );
}

function Ligne({
  Icon,
  titre,
  detail,
}: {
  Icon: (p: { size?: number; className?: string }) => React.ReactElement;
  titre: string;
  detail: string;
}) {
  return (
    <Glass className="flex items-center gap-3.5 rounded-[24px] px-4 py-3.5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-fg/[.07] text-fg/50">
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14.5px] font-semibold">{titre}</div>
        <div className="mt-0.5 text-[11.5px] text-fg/40">{detail}</div>
      </div>
    </Glass>
  );
}

/* ---------------------------------------------------------------- le lien */

function CopierLien({ slug }: { slug: string }) {
  const [copie, setCopie] = useState(false);

  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(`https://${APP_DOMAIN}/a/${slug}`);
        setCopie(true);
        setTimeout(() => setCopie(false), 1600);
      }}
      className="flex h-13 w-full items-center justify-center gap-2 rounded-full glass text-[14px] font-semibold text-fg/80 transition active:scale-[.98]"
    >
      {copie ? <Check size={16} /> : <Copy size={16} />}
      {copie ? "Lien copié" : "Copier mon lien"}
    </button>
  );
}

/* ------------------------------------------------------------- le retrait */

/**
 * Le numéro qui reçoit l'argent.
 *
 * Il n'apparaît que sur cet écran, jamais sur la page publique : c'est
 * exactement le numéro que l'artiste ne veut pas afficher, et toute la raison
 * d'être du bouton Soutenir.
 */
function FormulaireRetrait({
  artistId,
  initial,
}: {
  artistId: string;
  initial: Payout;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>(initial.method);
  const [numero, setNumero] = useState(initial.number);
  const [erreur, setErreur] = useState<string | null>(null);
  const [fait, setFait] = useState(false);
  const [envoi, demarrer] = useTransition();

  const change = method !== initial.method || numero !== initial.number;

  function enregistrer() {
    setErreur(null);
    setFait(false);
    demarrer(async () => {
      const res = await updatePayout({ artistId, method, number: numero });
      if (!res.ok) {
        setErreur(res.error);
        return;
      }
      setFait(true);
      router.refresh();
    });
  }

  return (
    <Glass className="rounded-[24px] p-4">
      <div className="flex gap-2">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMethod(m.id)}
            className={cx(
              "flex-1 rounded-2xl py-3 text-[13px] font-semibold transition active:scale-[.98]",
              method === m.id
                ? "grad-brand text-ink"
                : "bg-fg/[.06] text-fg/50",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-fg/[.05] px-4">
        <Wallet size={16} className="shrink-0 text-fg/35" />
        <input
          value={numero}
          onChange={(e) => setNumero(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          placeholder="77 000 00 00"
          maxLength={15}
          className="h-13 flex-1 bg-transparent text-[15px] tabular-nums outline-none placeholder:text-fg/25"
        />
      </div>

      {erreur && (
        <p className="mt-2.5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-[12.5px] text-red-400">
          {erreur}
        </p>
      )}

      <button
        onClick={enregistrer}
        disabled={!change || envoi}
        className={cx(
          "mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full text-[14.5px] font-semibold transition active:scale-[.98]",
          change && !envoi
            ? "grad-brand text-ink"
            : "bg-fg/8 text-fg/25 active:scale-100",
        )}
      >
        {envoi ? "Enregistrement…" : fait && !change ? "Enregistré" : "Enregistrer"}
        {fait && !change && !envoi && <Check size={15} />}
      </button>
    </Glass>
  );
}

/* --------------------------------------------------------- déconnexion */

function Deconnexion() {
  const router = useRouter();
  const [confirme, setConfirme] = useState(false);
  const [envoi, demarrer] = useTransition();

  // Deux temps plutôt qu'une boîte de dialogue : sur un téléphone partagé, se
  // déconnecter par erreur oblige à retourner chercher un courriel.
  if (!confirme) {
    return (
      <button
        onClick={() => setConfirme(true)}
        className="flex h-13 w-full items-center justify-center gap-2 rounded-full glass text-[14px] font-semibold text-fg/60 transition active:scale-[.98]"
      >
        <LogOut size={16} />
        Se déconnecter
      </button>
    );
  }

  return (
    <div className="rounded-[24px] border border-red-500/25 bg-red-500/[.07] p-4 text-center">
      <p className="text-[13px] leading-relaxed text-fg/70">
        Pour revenir, il faudra un nouveau lien envoyé par courriel.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setConfirme(false)}
          className="h-12 flex-1 rounded-full bg-fg/[.07] text-[14px] font-semibold text-fg/70 transition active:scale-[.98]"
        >
          Annuler
        </button>
        <button
          onClick={() =>
            demarrer(async () => {
              await signOut();
              router.push("/");
              router.refresh();
            })
          }
          disabled={envoi}
          className="h-12 flex-1 rounded-full bg-red-500 text-[14px] font-semibold text-white transition active:scale-[.98]"
        >
          {envoi ? "…" : "Déconnexion"}
        </button>
      </div>
    </div>
  );
}
