"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { createArtistProfile, updateFanAvatar } from "@/lib/actions";
import { APP_DOMAIN } from "@/lib/config";
import { usePlaylist } from "./providers";
import { Avatar, Button, cx, Glass } from "./ui";
import { MarkTile } from "./logo";
import {
  Bookmark,
  Camera,
  ChevronRight,
  Play,
  Sliders,
  Spark,
} from "./icons";

/**
 * En-tête de « Mon espace », commun au fan et à l'artiste.
 *
 * L'engrenage vit ici plutôt que dans la barre du bas : les réglages ne sont
 * pas une destination qu'on visite, c'est un tiroir qu'on ouvre trois fois par
 * an. Un cinquième onglet ramènerait chaque cible à 67 px de large sur un
 * écran de téléphone, au détriment des quatre qu'on utilise vraiment.
 */
export function EspaceHeader({ titre, sous }: { titre: string; sous?: string }) {
  return (
    <header className="mb-5 flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="display truncate text-[26px] font-extrabold">{titre}</h1>
        {sous && (
          <p className="mt-0.5 truncate text-[12.5px] text-fg/45">{sous}</p>
        )}
      </div>
      <Link
        href="/parametres"
        aria-label="Paramètres"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full glass text-fg/70 transition active:scale-90"
      >
        <Sliders size={19} />
      </Link>
    </header>
  );
}

/* ------------------------------------------------------------ non connecté */

/**
 * Ce que voit un visiteur sans compte.
 *
 * Le message insiste sur ce qui reste gratuit et sans compte — écouter et
 * soutenir. Une page de connexion qui laisse croire qu'il faut un compte pour
 * écouter ferait fuir exactement le public qu'on vise.
 */
export function EspaceInvite() {
  return (
    <div className="flex flex-col items-center pt-10 text-center">
      <MarkTile size={64} className="glow-brand" />

      <h1 className="display mt-7 text-[28px] font-extrabold !leading-[1.1]">
        Ton espace
      </h1>
      <p className="mx-auto mt-3 max-w-[300px] text-[13.5px] leading-relaxed text-fg/50">
        Connecte-toi pour garder ta playlist sur tous tes téléphones, ou pour
        ouvrir ta page d&apos;artiste.
      </p>

      <Button href="/connexion" className="mt-7 w-full">
        Se connecter
      </Button>

      <Glass className="mt-4 w-full rounded-[24px] p-4 text-left">
        <p className="text-[11.5px] font-semibold text-fg/45">
          Sans compte, tu peux déjà
        </p>
        <ul className="mt-2.5 space-y-2">
          {[
            { Icon: Play, t: "Écouter tous les sons en entier" },
            { Icon: Spark, t: "Soutenir un artiste par Wave ou Orange Money" },
          ].map(({ Icon, t }) => (
            <li key={t} className="flex items-start gap-2.5">
              <Icon size={14} className="mt-0.5 shrink-0 text-acid-500" />
              <span className="text-[12px] leading-snug text-fg/60">{t}</span>
            </li>
          ))}
        </ul>
      </Glass>
    </div>
  );
}

/* ------------------------------------------------------------- espace fan */

/**
 * Le compte connecté qui n'a pas de page d'artiste.
 *
 * Volontairement court : un fan n'a pas besoin d'un tableau de bord, il a
 * besoin de sa playlist. Le reste de l'écran sert donc à l'inviter à passer de
 * l'autre côté, puisque c'est l'artiste qui fait vivre la plateforme.
 */
export function EspaceFan({
  email,
  avatarUrl,
}: {
  email: string;
  avatarUrl?: string;
}) {
  const { ids, ready } = usePlaylist();

  return (
    <>
      <EspaceHeader titre="Mon espace" sous={email} />

      <Glass className="flex items-center gap-3.5 rounded-[24px] px-4 py-3.5">
        <PhotoFan email={email} avatarUrl={avatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="text-[14.5px] font-semibold">Compte fan</div>
          <div className="mt-0.5 text-[11.5px] text-fg/40">
            Tu peux soutenir qui tu veux, sans limite
          </div>
        </div>
      </Glass>

      <Link href="/playlist" className="mt-2.5 block">
        <Glass className="flex items-center gap-3.5 rounded-[24px] px-4 py-3.5 transition active:scale-[.99]">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-acid-500/10 text-acid-500">
            <Bookmark size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[14.5px] font-semibold">Ma playlist</div>
            <div className="mt-0.5 text-[11.5px] text-fg/40">
              {!ready
                ? "…"
                : ids.length === 0
                  ? "Aucun son pour l'instant"
                  : `${ids.length} son${ids.length > 1 ? "s" : ""}`}
            </div>
          </div>
          <ChevronRight size={16} className="shrink-0 text-fg/30" />
        </Glass>
      </Link>

      <DevenirArtiste />
    </>
  );
}

/* ------------------------------------------------------------ la photo */

/**
 * Photo de profil du fan.
 *
 * Sans image, on retombe sur les initiales tirées de l'adresse — jamais sur
 * une silhouette grise, qui donne à tous les comptes le même visage vide.
 */
function PhotoFan({
  email,
  avatarUrl,
}: {
  email: string;
  avatarUrl?: string;
}) {
  const router = useRouter();
  const champ = useRef<HTMLInputElement>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  // L'adresse sert de nom faute de mieux : « adbaecomx@gmail.com » donne AD,
  // ce qui reste personnel là où une icône générique ne l'est pas.
  const nom = email.split("@")[0] || "fan";

  async function envoyer(file: File) {
    setErreur(null);
    setEnvoi(true);

    const fd = new FormData();
    fd.set("file", file);
    const res = await updateFanAvatar(fd);

    setEnvoi(false);
    if (!res.ok) setErreur(res.error);
    else router.refresh();
  }

  return (
    <div className="relative shrink-0">
      <Avatar name={nom} gradient={["#2a2d34", "#141619"]} src={avatarUrl} size={52} />

      <button
        onClick={() => champ.current?.click()}
        disabled={envoi}
        aria-label="Changer ma photo"
        className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full grad-brand text-ink shadow-lg transition active:scale-90"
      >
        {envoi ? (
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-ink" />
        ) : (
          <Camera size={13} />
        )}
      </button>

      <input
        ref={champ}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          // Le champ est vidé pour que choisir deux fois la même image
          // déclenche bien un second envoi.
          e.target.value = "";
          if (f) void envoyer(f);
        }}
      />

      {erreur && (
        <p className="absolute left-0 top-full mt-2 w-52 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-[11px] leading-snug text-red-400">
          {erreur}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------- devenir artiste */

/**
 * Deux champs, pas douze.
 *
 * Tout le reste — bio, photos, moyen de retrait — s'ajoute ensuite depuis
 * l'atelier. Un formulaire long ici ferait abandonner un rappeur qui voulait
 * juste voir à quoi ça ressemble.
 */
function DevenirArtiste() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [ville, setVille] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, demarrer] = useTransition();

  const valide = nom.trim().length >= 2;

  function creer() {
    setErreur(null);
    demarrer(async () => {
      const res = await createArtistProfile({ name: nom, city: ville });
      if (!res.ok) {
        setErreur(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="mt-8">
      <div className="relative overflow-hidden rounded-[30px] grad-brand p-6 text-ink glow-brand">
        <span className="inline-flex rounded-full bg-ink/12 px-3 py-1.5 text-[11px] font-bold leading-none">
          Tu fais de la musique ?
        </span>
        <h2 className="display mt-3.5 text-[28px] font-extrabold !leading-[1.08]">
          Ouvre ta page
          <br />
          d&apos;artiste.
        </h2>
        <p className="mt-3 text-[13px] leading-relaxed text-ink/70">
          Tu gardes ce compte et ta playlist. Tu reçois en plus un lien à ton
          nom, à coller dans ta bio, et tes fans pourront t&apos;envoyer de
          l&apos;argent.
        </p>

        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ton nom d'artiste"
          maxLength={60}
          className="mt-5 h-13 w-full rounded-2xl bg-ink/10 px-4 text-[15px] text-ink outline-none placeholder:text-ink/40 focus:bg-ink/15"
        />
        <input
          value={ville}
          onChange={(e) => setVille(e.target.value)}
          placeholder="Ta ville (facultatif)"
          maxLength={60}
          className="mt-2 h-13 w-full rounded-2xl bg-ink/10 px-4 text-[15px] text-ink outline-none placeholder:text-ink/40 focus:bg-ink/15"
        />

        {nom.trim() && (
          <p className="mt-2.5 text-[11.5px] text-ink/55">
            Ton lien : {APP_DOMAIN}/a/
            <span className="font-semibold">{apercuSlug(nom)}</span>
          </p>
        )}

        {erreur && (
          <p className="mt-2.5 rounded-2xl bg-ink/10 px-4 py-3 text-[12.5px] text-ink">
            {erreur}
          </p>
        )}

        <button
          onClick={creer}
          disabled={!valide || envoi}
          className={cx(
            "mt-3 flex h-13 w-full items-center justify-center gap-2 rounded-full text-[15.5px] font-bold transition active:scale-[.98]",
            valide && !envoi
              ? "bg-ink text-fg"
              : "bg-ink/15 text-ink/40 active:scale-100",
          )}
        >
          {envoi ? "Création…" : "Créer ma page"}
          {!envoi && <ChevronRight size={16} />}
        </button>
      </div>
    </section>
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
