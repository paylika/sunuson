"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createArtistProfile } from "@/lib/actions";
import { APP_DOMAIN, COMMISSION_RATE } from "@/lib/config";
import { ChoixLieu } from "./choix-lieu";
import { BackButton } from "./page-header";
import { cx, Glass } from "./ui";
import { ChevronRight, Lock, Spark, Wallet } from "./icons";

/**
 * Ouvrir une page d'artiste — un écran à part, pas un encart dans l'espace fan.
 *
 * Le formulaire était posé directement dans « Moi » : deux champs remplis par
 * curiosité et n'importe quel fan devenait artiste. Une page d'artiste engage
 * pourtant — elle porte un nom public, une adresse partageable, et une
 * déclaration de droits sur ce qui y sera publié.
 *
 * L'étape ajoutée n'est donc pas une friction inventée pour décourager : c'est
 * la déclaration de droits, qu'il fallait de toute façon recueillir avant la
 * première publication. Elle arrive juste plus tôt, là où elle sépare
 * naturellement le curieux de celui qui fait vraiment de la musique.
 */
export function DevenirArtisteView() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [region, setRegion] = useState("");
  const [ville, setVille] = useState("");
  const [droits, setDroits] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, demarrer] = useTransition();

  // Foy Tewal est obligatoire : c'est ce qui rattache l'artiste à un endroit,
  // et c'est aussi ce qui alimente le filtre de Découvrir. Un artiste sans
  // quartier est introuvable pour quelqu'un qui cherche les siens.
  const valide = nom.trim().length >= 2 && ville !== "" && droits;

  function creer() {
    setErreur(null);
    demarrer(async () => {
      const res = await createArtistProfile({ name: nom, city: ville });
      if (!res.ok) {
        setErreur(res.error);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <>
      <header className="mb-6 flex items-center gap-3">
        <BackButton fallback="/dashboard" />
        <h1 className="display flex-1 text-[24px] font-extrabold">
          Ouvrir ma page
        </h1>
      </header>

      <h2 className="display px-1 text-[30px] font-extrabold !leading-[1.06]">
        Ton lien, ta musique,
        <br />
        ton argent.
      </h2>

      <div className="mt-5 space-y-2.5">
        {[
          {
            Icon: Spark,
            t: "Tes fans t'envoient de l'argent",
            d: "Par Wave ou Orange Money, sans carte bancaire.",
          },
          {
            Icon: Wallet,
            t: `Tu gardes ${Math.round((1 - COMMISSION_RATE) * 100)} %`,
            d: "On ne prend rien si tu ne reçois rien.",
          },
          {
            Icon: Lock,
            t: "Tu gardes tes droits",
            d: "Aucune exclusivité. Tu retires tes sons quand tu veux.",
          },
        ].map(({ Icon, t, d }) => (
          <Glass key={t} className="flex items-start gap-3 rounded-[22px] p-4">
            <Icon size={17} className="mt-0.5 shrink-0 text-acid-500" />
            <div className="min-w-0">
              <div className="text-[13.5px] font-semibold">{t}</div>
              <div className="mt-0.5 text-[11.5px] leading-snug text-fg/45">
                {d}
              </div>
            </div>
          </Glass>
        ))}
      </div>

      {/* ------------------------------------------------------ le formulaire */}
      <div className="mt-7">
        <label className="px-1 text-[11.5px] font-bold uppercase tracking-wider text-fg/35">
          Ton nom d&apos;artiste
        </label>
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Celui que tes fans connaissent"
          maxLength={60}
          className="mt-2 h-14 w-full rounded-2xl glass px-5 text-[16px] outline-none placeholder:text-fg/25 focus:border-acid-500/40"
        />

        {nom.trim() && (
          <p className="mt-2 px-1 text-[11.5px] text-fg/40">
            Ton lien : {APP_DOMAIN}/a/
            <span className="font-semibold text-acid-500">
              {apercuSlug(nom)}
            </span>
          </p>
        )}

        <label className="mt-4 block px-1 text-[11.5px] font-bold uppercase tracking-wider text-fg/35">
          Foy Tewal
        </label>
        <p className="mt-1 px-1 text-[11.5px] leading-snug text-fg/40">
          Le quartier que tu représentes. Dans le rap, on demande toujours
          d&apos;où tu sors avant d&apos;écouter.
        </p>

        <div className="mt-2">
          <ChoixLieu
            region={region}
            ville={ville}
            surRegion={setRegion}
            surVille={setVille}
          />
        </div>
      </div>

      {/* La déclaration de droits : la seule case qui empêche vraiment
          d'ouvrir une page par curiosité, et la seule qui te protège si un
          jour quelqu'un publie ce qui ne lui appartient pas. */}
      <button
        onClick={() => setDroits((d) => !d)}
        className="mt-5 flex w-full items-start gap-3 rounded-[22px] glass p-4 text-left transition active:scale-[.99]"
      >
        <span
          className={cx(
            "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition",
            droits
              ? "border-acid-500 bg-acid-500 text-ink"
              : "border-fg/20 text-transparent",
          )}
        >
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </span>
        <span className="text-[12.5px] leading-relaxed text-fg/60">
          Je fais de la musique et je détiens les droits sur les sons que je
          publierai. Je n&apos;y mettrai pas le travail de quelqu&apos;un
          d&apos;autre.
        </span>
      </button>

      {erreur && (
        <p className="mt-3 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-center text-[12.5px] text-red-400">
          {erreur}
        </p>
      )}

      <button
        onClick={creer}
        disabled={!valide || envoi}
        className={cx(
          "mt-4 flex h-15 w-full items-center justify-center gap-2 rounded-full text-[16px] font-bold transition active:scale-[.98]",
          valide && !envoi
            ? "grad-brand text-ink glow-brand"
            : "bg-fg/8 text-fg/25 active:scale-100",
        )}
      >
        {envoi ? "Création…" : "Créer ma page"}
        {!envoi && <ChevronRight size={17} />}
      </button>

      <p className="mt-3 px-2 text-center text-[11px] leading-relaxed text-fg/30">
        Tu gardes ce compte, ta playlist et tes soutiens. Devenir artiste
        n&apos;enlève rien.
      </p>
    </>
  );
}

/**
 * Aperçu du lien pendant la frappe. Le serveur reste seul juge — il ajoute un
 * numéro en cas d'homonyme — mais voir son adresse se former donne envie de
 * finir, là où un champ nu ne promet rien.
 */
function apercuSlug(nom: string) {
  return (
    nom
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 24) || "artiste"
  );
}
