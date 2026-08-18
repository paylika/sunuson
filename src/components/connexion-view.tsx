"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { APP_NAME, AUTH_METHOD } from "@/lib/config";
import { supabaseBrowser } from "@/lib/auth-client";
import { cx } from "./ui";
import { MarkTile, Wordmark } from "./logo";
import { ChevronLeft, Play, Spark, Wallet } from "./icons";

type Etape = "email" | "verification";

/**
 * Un seul écran pour se connecter ET créer un compte.
 *
 * Avec un code envoyé par courriel, la distinction n'existe pas : si
 * l'adresse est inconnue, le compte se crée ; si elle est connue, on entre.
 * Deux onglets « Connexion » et « Inscription » obligeraient le visiteur à
 * se souvenir s'il est déjà venu — ce qu'il ne sait jamais.
 *
 * Et pas de mot de passe : sur un téléphone partagé, un mot de passe oublié
 * est un compte perdu.
 */
export function ConnexionView({
  supabaseUrl,
  supabaseKey,
}: {
  supabaseUrl: string;
  supabaseKey: string;
}) {
  const router = useRouter();
  const [etape, setEtape] = useState<Etape>("email");
  const parCode = AUTH_METHOD === "code";
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [renvoiDans, setRenvoiDans] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  // Compte à rebours avant de pouvoir redemander un code : sans lui, on
  // enchaîne les envois et on ne sait plus lequel est valable.
  useEffect(() => {
    if (renvoiDans <= 0) return;
    const id = window.setTimeout(() => setRenvoiDans((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [renvoiDans]);

  useEffect(() => {
    if (etape === "verification" && parCode) codeRef.current?.focus();
  }, [etape, parCode]);

  const emailValide = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

  async function envoyerCode() {
    setErreur(null);
    setEnvoi(true);

    const { error } = await supabaseBrowser(supabaseUrl, supabaseKey).auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        // Où le lien ramène. Ignoré quand le courriel contient un code.
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setEnvoi(false);

    if (error) {
      setErreur(messageErreur(error.message));
      return;
    }
    setEtape("verification");
    setRenvoiDans(45);
  }

  async function verifierCode() {
    setErreur(null);
    setEnvoi(true);

    const { error } = await supabaseBrowser(supabaseUrl, supabaseKey).auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: "email",
    });

    setEnvoi(false);

    if (error) {
      setErreur("Code incorrect ou expiré.");
      setCode("");
      codeRef.current?.focus();
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 pb-8 pt-6">
      {/* ------------------------------------------------------------ entête */}
      <header className="flex items-center justify-between">
        {etape === "verification" ? (
          <button
            onClick={() => {
              setEtape("email");
              setCode("");
              setErreur(null);
            }}
            aria-label="Modifier l'adresse"
            className="grid h-11 w-11 place-items-center rounded-full glass text-fg/70 active:scale-90"
          >
            <ChevronLeft size={19} />
          </button>
        ) : (
          <Link
            href="/"
            aria-label="Retour"
            className="grid h-11 w-11 place-items-center rounded-full glass text-fg/70 active:scale-90"
          >
            <ChevronLeft size={19} />
          </Link>
        )}
        <Wordmark size={20} className="text-fg" />
        <span className="h-11 w-11" aria-hidden />
      </header>

      <div className="flex flex-1 flex-col justify-center py-10">
        <MarkTile size={64} className="mx-auto glow-brand" />

        {etape === "email" ? (
          <>
            <h1 className="display mt-7 text-center text-[30px] font-extrabold">
              Entre ton adresse
            </h1>
            <p className="mx-auto mt-2.5 max-w-[300px] text-center text-[13px] leading-relaxed text-fg/50">
              {parCode
                ? "On t'envoie un code à six chiffres."
                : "On t'envoie un lien de connexion."}{" "}
              Pas de mot de passe à retenir, et ton compte se crée tout seul si
              tu es nouveau.
            </p>

            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && emailValide) void envoyerCode();
              }}
              placeholder="ton@adresse.com"
              className="mt-7 h-14 w-full rounded-2xl glass px-5 text-center text-[16px] outline-none placeholder:text-fg/30 focus:border-acid-500/40"
            />

            {erreur && (
              <p className="mt-3 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-center text-[12.5px] text-red-400">
                {erreur}
              </p>
            )}

            <button
              onClick={envoyerCode}
              disabled={!emailValide || envoi}
              className={cx(
                "mt-3 h-14 w-full rounded-full text-[16px] font-semibold transition active:scale-[.98]",
                emailValide && !envoi
                  ? "grad-brand text-ink glow-brand"
                  : "bg-fg/8 text-fg/25 active:scale-100",
              )}
            >
              {envoi
                ? "Envoi en cours…"
                : parCode
                  ? "Recevoir mon code"
                  : "Recevoir mon lien"}
            </button>
          </>
        ) : (
          <>
            <h1 className="display mt-7 text-center text-[30px] font-extrabold">
              {parCode ? "Ton code" : "Regarde tes courriels"}
            </h1>
            <p className="mx-auto mt-2.5 max-w-[300px] text-center text-[13px] leading-relaxed text-fg/50">
              {parCode ? "Envoyé à " : "On vient d'écrire à "}
              <span className="font-semibold text-fg">{email}</span>.{" "}
              {parCode
                ? "Regarde aussi dans les indésirables."
                : "Ouvre le message et clique sur le lien. Regarde aussi dans les indésirables."}
            </p>

            {parCode && (
              <>
                <input
                  ref={codeRef}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCode(v);
                    // Six chiffres saisis : on valide sans demander un clic
                    // de plus, le code n'a pas d'autre usage.
                    if (v.length === 6) {
                      setTimeout(() => void verifierCode(), 120);
                    }
                  }}
                  placeholder="000000"
                  className="mt-7 h-16 w-full rounded-2xl glass text-center text-[30px] font-extrabold tracking-[.4em] tabular-nums outline-none placeholder:text-fg/20 focus:border-acid-500/40"
                />

                <button
                  onClick={verifierCode}
                  disabled={code.length !== 6 || envoi}
                  className={cx(
                    "mt-3 h-14 w-full rounded-full text-[16px] font-semibold transition active:scale-[.98]",
                    code.length === 6 && !envoi
                      ? "grad-brand text-ink glow-brand"
                      : "bg-fg/8 text-fg/25 active:scale-100",
                  )}
                >
                  {envoi ? "Vérification…" : "Entrer"}
                </button>
              </>
            )}

            {!parCode && (
              <div className="mt-7 rounded-2xl border border-acid-500/25 bg-acid-500/[.06] px-4 py-4 text-center">
                <p className="text-[12.5px] leading-relaxed text-acid-500">
                  Ouvre le lien depuis <strong>ce téléphone</strong>. S&apos;il
                  s&apos;ouvre ailleurs, la connexion se fera sur l&apos;autre
                  appareil.
                </p>
              </div>
            )}

            {erreur && (
              <p className="mt-3 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-center text-[12.5px] text-red-400">
                {erreur}
              </p>
            )}

            <button
              onClick={envoyerCode}
              disabled={renvoiDans > 0 || envoi}
              className={cx(
                "mt-4 text-center text-[12.5px] font-medium transition",
                renvoiDans > 0 ? "text-fg/30" : "text-acid-500",
              )}
            >
              {renvoiDans > 0
                ? `Renvoyer dans ${renvoiDans} s`
                : parCode
                  ? "Renvoyer un code"
                  : "Renvoyer un lien"}
            </button>
          </>
        )}
      </div>

      {/* ------------------------------------------------------------ rappel */}
      <div className="rounded-[26px] glass p-4">
        <p className="text-[11.5px] font-semibold text-fg/45">
          Le compte ne sert qu&apos;à ça
        </p>
        <ul className="mt-2.5 space-y-2">
          {[
            { Icon: Play, t: "Écouter reste gratuit et sans compte" },
            { Icon: Spark, t: "Soutenir un artiste aussi" },
            { Icon: Wallet, t: "Le compte garde ta playlist et ton espace artiste" },
          ].map(({ Icon, t }) => (
            <li key={t} className="flex items-start gap-2.5">
              <Icon size={14} className="mt-0.5 shrink-0 text-acid-500" />
              <span className="text-[12px] leading-snug text-fg/60">{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-center text-[10.5px] leading-relaxed text-fg/30">
        En continuant, tu acceptes les conditions d&apos;{APP_NAME}.
      </p>
    </div>
  );
}

/**
 * Les erreurs de Supabase arrivent en anglais et en jargon. Affichées telles
 * quelles, elles ne disent rien à un fan — et surtout pas ce qu'il doit faire.
 *
 * La première est de loin la plus fréquente : le serveur de courriel intégré à
 * Supabase est bridé à quelques envois par heure et n'est pas prévu pour la
 * production. Tant qu'un vrai SMTP n'est pas branché, deux essais suffisent à
 * se retrouver bloqué.
 */
function messageErreur(brut: string): string {
  const m = brut.toLowerCase();

  if (m.includes("rate limit") || m.includes("too many")) {
    return "Trop de demandes. Le serveur de courriel est bridé — réessaie dans une heure, ou branche un vrai SMTP.";
  }
  if (m.includes("for security purposes")) {
    const s = brut.match(/(\d+)\s*seconds?/)?.[1];
    return s
      ? `Attends ${s} secondes avant de redemander un envoi.`
      : "Attends quelques secondes avant de redemander un envoi.";
  }
  if (m.includes("signups not allowed") || m.includes("signup is disabled")) {
    return "Les inscriptions sont fermées côté Supabase. Réactive-les dans Authentication → Providers → Email.";
  }
  if (m.includes("invalid format") || m.includes("validate email")) {
    return "Cette adresse ne semble pas valide.";
  }
  if (m.includes("error sending") || m.includes("smtp")) {
    return "Le courriel n'est pas parti. Le SMTP de Supabase refuse l'envoi.";
  }
  if (m.includes("fetch") || m.includes("network")) {
    return "Connexion impossible. Vérifie ta connexion internet.";
  }
  return brut;
}
