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
type Onglet = "connexion" | "inscription";

/**
 * Écran de connexion et de création de compte.
 *
 * Deux comportements selon AUTH_METHOD :
 *
 * — "motdepasse" : deux onglets, parce qu'avec un mot de passe la distinction
 *   existe vraiment. Les confondre produirait « mot de passe incorrect » chez
 *   quelqu'un qui n'a jamais eu de compte, l'erreur la plus décourageante qui
 *   soit.
 *
 * — "code" / "lien" : un seul écran, sans onglets. Si l'adresse est inconnue
 *   le compte se crée, sinon on entre : demander au visiteur s'il est déjà
 *   venu n'aurait aucun sens puisqu'il n'a rien à retenir.
 */
export function ConnexionView({
  supabaseUrl,
  supabaseKey,
  erreurInitiale = null,
}: {
  supabaseUrl: string;
  supabaseKey: string;
  /** Motif du renvoi depuis /auth/callback, déjà traduit. */
  erreurInitiale?: string | null;
}) {
  if (AUTH_METHOD === "motdepasse") {
    return (
      <Cadre>
        <FormulaireMotDePasse
          supabaseUrl={supabaseUrl}
          supabaseKey={supabaseKey}
          erreurInitiale={erreurInitiale}
        />
      </Cadre>
    );
  }

  return (
    <FormulaireCourriel
      supabaseUrl={supabaseUrl}
      supabaseKey={supabaseKey}
      erreurInitiale={erreurInitiale}
    />
  );
}

/* ------------------------------------------------------------- structure */

function Cadre({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 pb-8 pt-6">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          aria-label="Retour"
          className="grid h-11 w-11 place-items-center rounded-full glass text-fg/70 active:scale-90"
        >
          <ChevronLeft size={19} />
        </Link>
        <Wordmark size={20} className="text-fg" />
        <span className="h-11 w-11" aria-hidden />
      </header>

      <div className="flex flex-1 flex-col justify-center py-10">{children}</div>

      <Rappel />
    </div>
  );
}

function Rappel() {
  return (
    <>
      <div className="rounded-[26px] glass p-4">
        <p className="text-[11.5px] font-semibold text-fg/45">
          Le compte ne sert qu&apos;à ça
        </p>
        <ul className="mt-2.5 space-y-2">
          {[
            { Icon: Play, t: "Écouter reste gratuit et sans compte" },
            { Icon: Spark, t: "Soutenir un artiste aussi" },
            {
              Icon: Wallet,
              t: "Le compte garde ta playlist et ton espace artiste",
            },
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
    </>
  );
}

/* --------------------------------------------------------- mot de passe */

function FormulaireMotDePasse({
  supabaseUrl,
  supabaseKey,
  erreurInitiale,
}: {
  supabaseUrl: string;
  supabaseKey: string;
  erreurInitiale: string | null;
}) {
  const router = useRouter();
  const [onglet, setOnglet] = useState<Onglet>("connexion");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [visible, setVisible] = useState(false);
  const [erreur, setErreur] = useState<string | null>(erreurInitiale);
  const [info, setInfo] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const emailValide = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  // Six caractères est le minimum imposé par Supabase. Exiger davantage ici
  // ferait échouer des gens sur une règle que le serveur ne réclame pas.
  const passeValide = motDePasse.length >= 6;
  const pret = emailValide && passeValide && !envoi;

  function changerOnglet(suivant: Onglet) {
    setOnglet(suivant);
    setErreur(null);
    setInfo(null);
  }

  async function soumettre() {
    if (!pret) return;
    setErreur(null);
    setInfo(null);
    setEnvoi(true);

    const auth = supabaseBrowser(supabaseUrl, supabaseKey).auth;
    const identifiants = {
      email: email.trim().toLowerCase(),
      password: motDePasse,
    };

    const { data, error } =
      onglet === "connexion"
        ? await auth.signInWithPassword(identifiants)
        : await auth.signUp(identifiants);

    setEnvoi(false);

    if (error) {
      setErreur(messageErreur(error.message, onglet));
      return;
    }

    // À l'inscription, une session absente signifie que Supabase attend une
    // confirmation par courriel. On le dit, sinon l'écran semble planté alors
    // que tout s'est bien passé.
    if (!data.session) {
      setInfo(
        "Compte créé. Supabase demande une confirmation : ouvre le courriel qu'on vient de t'envoyer, puis reviens te connecter.",
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <MarkTile size={64} className="mx-auto glow-brand" />

      <div className="mt-7 flex gap-1.5 rounded-full glass p-1.5">
        {(
          [
            ["connexion", "J'ai un compte"],
            ["inscription", "Créer un compte"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => changerOnglet(id)}
            className={cx(
              "flex-1 rounded-full py-3 text-[13.5px] font-semibold transition active:scale-[.98]",
              onglet === id ? "grad-brand text-ink" : "text-fg/50",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <h1 className="display mt-7 text-center text-[28px] font-extrabold !leading-[1.1]">
        {onglet === "connexion" ? "Content de te revoir" : "Bienvenue"}
      </h1>
      <p className="mx-auto mt-2.5 max-w-[300px] text-center text-[13px] leading-relaxed text-fg/50">
        {onglet === "connexion"
          ? "Ton adresse et ton mot de passe."
          : "Choisis un mot de passe d'au moins six caractères. Note-le : il n'y a pas encore de récupération."}
      </p>

      <input
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="off"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ton@adresse.com"
        className="mt-6 h-14 w-full rounded-2xl glass px-5 text-[16px] outline-none placeholder:text-fg/30 focus:border-acid-500/40"
      />

      <div className="mt-2.5 flex items-center gap-1 rounded-2xl glass pr-2 focus-within:border-acid-500/40">
        <input
          type={visible ? "text" : "password"}
          // Indique au gestionnaire de mots de passe s'il doit proposer un
          // enregistrement ou une saisie automatique.
          autoComplete={
            onglet === "connexion" ? "current-password" : "new-password"
          }
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void soumettre();
          }}
          placeholder="Mot de passe"
          className="h-14 flex-1 bg-transparent px-5 text-[16px] outline-none placeholder:text-fg/30"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="shrink-0 rounded-xl px-3 py-2 text-[12px] font-semibold text-fg/45 transition active:scale-95"
        >
          {visible ? "Masquer" : "Afficher"}
        </button>
      </div>

      {motDePasse.length > 0 && !passeValide && (
        <p className="mt-2 px-1 text-[11.5px] text-fg/40">
          Encore {6 - motDePasse.length} caractère
          {6 - motDePasse.length > 1 ? "s" : ""}.
        </p>
      )}

      {erreur && (
        <p className="mt-3 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-center text-[12.5px] leading-relaxed text-red-400">
          {erreur}
        </p>
      )}

      {info && (
        <p className="mt-3 rounded-2xl border border-acid-500/25 bg-acid-500/[.06] px-4 py-3 text-center text-[12.5px] leading-relaxed text-acid-500">
          {info}
        </p>
      )}

      <button
        onClick={soumettre}
        disabled={!pret}
        className={cx(
          "mt-3 h-14 w-full rounded-full text-[16px] font-semibold transition active:scale-[.98]",
          pret ? "grad-brand text-ink glow-brand" : "bg-fg/8 text-fg/25 active:scale-100",
        )}
      >
        {envoi
          ? "Un instant…"
          : onglet === "connexion"
            ? "Se connecter"
            : "Créer mon compte"}
      </button>

      <button
        onClick={() =>
          changerOnglet(onglet === "connexion" ? "inscription" : "connexion")
        }
        className="mt-4 text-center text-[12.5px] font-medium text-fg/45 transition"
      >
        {onglet === "connexion"
          ? "Pas encore de compte ? En créer un"
          : "J'ai déjà un compte"}
      </button>
    </>
  );
}

/* ------------------------------------------------------ code ou lien */

/**
 * Conservé intact pour le jour où un vrai SMTP sera branché. Un seul écran
 * suffit alors : avec un code reçu par courriel, se connecter et s'inscrire
 * sont le même geste.
 */
function FormulaireCourriel({
  supabaseUrl,
  supabaseKey,
  erreurInitiale,
}: {
  supabaseUrl: string;
  supabaseKey: string;
  erreurInitiale: string | null;
}) {
  const router = useRouter();
  const [etape, setEtape] = useState<Etape>("email");
  const parCode = AUTH_METHOD === "code";
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState<string | null>(erreurInitiale);
  const [envoi, setEnvoi] = useState(false);
  const [renvoiDans, setRenvoiDans] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

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

    const { error } = await supabaseBrowser(
      supabaseUrl,
      supabaseKey,
    ).auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setEnvoi(false);

    if (error) {
      setErreur(messageErreur(error.message, "connexion"));
      return;
    }
    setEtape("verification");
    setRenvoiDans(45);
  }

  async function verifierCode() {
    setErreur(null);
    setEnvoi(true);

    const { error } = await supabaseBrowser(
      supabaseUrl,
      supabaseKey,
    ).auth.verifyOtp({
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

      <Rappel />
    </div>
  );
}

/* ---------------------------------------------------------------------- */

/**
 * Les erreurs de Supabase arrivent en anglais et en jargon. Affichées telles
 * quelles, elles ne disent rien — et surtout pas ce qu'il faut faire.
 *
 * Le cas le plus décourageant est « Invalid login credentials » : Supabase
 * renvoie exactement le même message qu'on se soit trompé de mot de passe ou
 * qu'on n'ait jamais eu de compte. On nomme donc les deux possibilités.
 */
function messageErreur(brut: string, onglet: Onglet): string {
  const m = brut.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "Adresse ou mot de passe incorrect. Si tu n'as jamais créé de compte, passe par « Créer un compte ».";
  }
  if (m.includes("already registered") || m.includes("already exists")) {
    return "Cette adresse a déjà un compte. Passe par « J'ai un compte ».";
  }
  if (m.includes("password should be")) {
    return "Mot de passe trop court : six caractères au minimum.";
  }
  if (m.includes("email not confirmed")) {
    return "Cette adresse n'est pas encore confirmée. Ouvre le courriel de validation, ou décoche « Confirm email » dans Supabase.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return onglet === "inscription"
      ? "Trop de créations de compte d'affilée. Réessaie dans une heure."
      : "Trop de tentatives. Réessaie dans quelques minutes.";
  }
  if (m.includes("for security purposes")) {
    const s = brut.match(/(\d+)\s*seconds?/)?.[1];
    return s
      ? `Attends ${s} secondes avant de réessayer.`
      : "Attends quelques secondes avant de réessayer.";
  }
  if (m.includes("signups not allowed") || m.includes("signup is disabled")) {
    return "Les inscriptions sont fermées côté Supabase. Réactive-les dans Authentication → Providers → Email.";
  }
  if (m.includes("invalid format") || m.includes("validate email")) {
    return "Cette adresse ne semble pas valide.";
  }
  if (m.includes("fetch") || m.includes("network")) {
    return "Connexion impossible. Vérifie ta connexion internet.";
  }
  return brut;
}
