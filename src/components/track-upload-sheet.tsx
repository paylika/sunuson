"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRelease, createTrack, findArtists } from "@/lib/actions";
import { deposer } from "@/lib/depot";
import { MIN_SUPPORT, type TypeProjet } from "@/lib/config";
import { MAX_STYLES, STYLES, type StyleId } from "@/lib/styles";
import { fcfa, initials } from "@/lib/format";
import { COVER_RULES, prepareCover, readAudioDuration } from "@/lib/storage";
import type { Artist } from "@/lib/types";
import { cx } from "./ui";
import { Check, Close, Lock, Plus, Search, Spark, Upload } from "./icons";

type Piste = {
  id: string;
  file: File;
  titre: string;
  duree: number;
};

type Guest = {
  /** Absent = invité hors plateforme : il est affiché, mais ne touche rien. */
  artistId?: string;
  name: string;
  avatarUrl?: string;
  gradient?: [string, string];
  share: number;
};

/**
 * Feuille plein écran. Le dépôt d'un son demande une pochette, un fichier,
 * des invités et un prix : à l'étroit dans une carte, on bâcle. Ici on voit
 * tout, et surtout la part qui reste à l'artiste.
 */
export function TrackUploadSheet({
  artist,
  open,
  onClose,
}: {
  artist: Artist;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  // Un rappeur ne sort pas dix singles, il sort un projet. Lui faire répéter
  // dix fois le même formulaire — même pochette, même prix, même déclaration
  // de droits — est la façon la plus sûre de le perdre au troisième.
  const [format, setFormat] = useState<"single" | "projet">("single");
  const [typeProjet, setTypeProjet] = useState<TypeProjet>("ep");
  const [pistes, setPistes] = useState<Piste[]>([]);
  const [etape, setEtape] = useState<string | null>(null);
  const [progres, setProgres] = useState(0);
  const [echoue, setEchoue] = useState(false);
  // Ce qui est déjà monté survit à un échec : sur une connexion qui coupe,
  // réessayer ne doit pas tout renvoyer depuis le début.
  const deposesRef = useRef<Map<string, string>>(new Map());

  const [styles, setStyles] = useState<StyleId[]>([]);
  const [title, setTitle] = useState("");
  const [label, setLabel] = useState(artist.label ?? "");
  const [audio, setAudio] = useState<File | null>(null);
  const [audioInfo, setAudioInfo] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverInfo, setCoverInfo] = useState<string | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [locked, setLocked] = useState(false);
  const [mode, setMode] = useState<"libre" | "fixe">("libre");
  const [amount, setAmount] = useState("2000");
  const [rights, setRights] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const audioRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const pistesRef = useRef<HTMLInputElement>(null);

  const guestShare = guests.reduce((s, g) => s + g.share, 0);
  const myShare = 100 - guestShare;
  // Le fichier audio est exigé : une fiche sans son crée un morceau muet sur
  // une page que les fans voient déjà.
  const ready =
    !pending &&
    rights &&
    title.trim().length > 1 &&
    (format === "single"
      ? !!audio && myShare >= 0
      : pistes.length >= 2 && pistes.every((p) => p.titre.trim().length > 0));

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  async function pickCover(file: File) {
    setError(null);
    setCoverInfo("Préparation…");

    // On ne refuse plus une image parce qu'elle n'est pas carrée : on la
    // recadre. Un débutant photographie sa pochette au téléphone, elle sort
    // en 4:3, et lui demander de la retailler ailleurs le fait abandonner.
    const pret = await prepareCover(file);

    if (!pret.ok) {
      setError(pret.error);
      setCover(null);
      setCoverPreview(null);
      setCoverInfo(null);
      return;
    }

    setCover(pret.file);
    setCoverPreview(URL.createObjectURL(pret.file));
    setCoverInfo(
      pret.faible
        ? `${pret.note} · trop petite pour une distribution ailleurs`
        : pret.taille < COVER_RULES.idealSize
          ? `${pret.note} · parfait ici`
          : pret.note,
    );
  }

  function submit() {
    setError(null);
    setEtape(null);
    setEchoue(false);

    startTransition(async () => {
      try {
      // La pochette part d'abord : elle est commune à tout le projet, et
      // échouer dessus après avoir monté dix morceaux serait cruel.
      const total = (cover ? 1 : 0) + (format === "single" ? 1 : pistes.length);
      let faits = 0;
      const avancer = (f: number) => setProgres((faits + f) / total);

      let coverKey = deposesRef.current.get("cover");
      if (cover && !coverKey) {
        setEtape("Pochette");
        const dep = await deposer(artist.id, "cover", cover, avancer);
        if (!dep.ok) {
          echec(dep.error);
          return;
        }
        coverKey = dep.key;
        deposesRef.current.set("cover", coverKey);
      }
      if (cover) faits += 1;

      if (format === "single") {
        setEtape(title.trim() || "Ton son");
        let audioKey = deposesRef.current.get("audio");
        if (!audioKey) {
          const dep = await deposer(artist.id, "audio", audio!, avancer);
          if (!dep.ok) {
            echec(dep.error);
            return;
          }
          audioKey = dep.key;
          deposesRef.current.set("audio", audioKey);
        }
        const dep = { key: audioKey };

        const fd = new FormData();
        fd.set("artistId", artist.id);
        fd.set("artistSlug", artist.slug);
        fd.set("title", title);
        fd.set("label", label);
        fd.set("locked", locked ? "1" : "0");
        fd.set("rightsOk", rights ? "1" : "0");
        fd.set("supportMode", locked ? mode : "libre");
        fd.set("supportAmount", amount);
        fd.set("duration", String(duration));
        fd.set("styles", JSON.stringify(styles));
        fd.set("audioKey", dep.key);
        if (coverKey) fd.set("coverKey", coverKey);
        fd.set(
          "collaborators",
          JSON.stringify(
            guests.map((g) => ({
              artistId: g.artistId,
              name: g.name,
              share: g.share,
            })),
          ),
        );

        const res = await createTrack(fd);
        if (!res.ok) {
          echec(res.error);
          return;
        }
      } else {
        // Un par un, jamais tous en parallèle : sur une connexion mobile,
        // dix envois simultanés se gênent et finissent plus tard que dix
        // envois successifs — et la progression devient illisible.
        const deposes: { title: string; audioKey: string; duration: number }[] =
          [];

        for (let i = 0; i < pistes.length; i++) {
          const p = pistes[i];
          setEtape(`${i + 1}/${pistes.length} · ${p.titre}`);

          let cle = deposesRef.current.get(p.id);
          if (!cle) {
            const dep = await deposer(artist.id, "audio", p.file, avancer);
            if (!dep.ok) {
              echec(`${p.titre} — ${dep.error}`);
              return;
            }
            cle = dep.key;
            deposesRef.current.set(p.id, cle);
          }
          faits += 1;

          deposes.push({
            title: p.titre,
            audioKey: cle,
            duration: p.duree,
          });
        }

        setEtape("Finalisation");
        const res = await createRelease({
          artistId: artist.id,
          artistSlug: artist.slug,
          type: typeProjet,
          title,
          coverKey,
          label,
          locked,
          supportMode: locked ? mode : "libre",
          supportAmount: Number(amount) || 0,
          rightsOk: rights,
          styles,
          tracks: deposes,
        });

        if (!res.ok) {
          echec(res.error);
          return;
        }
      }

      setEtape(null);
      setProgres(0);
      deposesRef.current.clear();
      router.refresh();
      onClose();
      } catch (e) {
        // Sans ce filet, une exception du serveur remplace toute la page par
        // « Application error », qui n'apprend rien à l'artiste et rien à
        // nous non plus. Ici, au moins, le message reste lisible et ce qui
        // est déjà monté n'est pas perdu.
        echec(
          e instanceof Error && e.message
            ? e.message
            : "Publication impossible. Réessaie dans un instant.",
        );
      }
    });
  }

  function echec(message: string) {
    setError(message);
    setEtape(null);
    setEchoue(true);
  }

  /** Ajoute des fichiers à la liste du projet, en lisant leur durée. */
  async function ajouterPistes(files: FileList) {
    const nouvelles: Piste[] = [...files].slice(0, 30).map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
      file,
      // Le nom du fichier fait un titre acceptable neuf fois sur dix : on
      // enlève l'extension et la numérotation qui traîne devant.
      titre: file.name
        .replace(/\.[^.]+$/, "")
        .replace(/^\s*\d{1,2}\s*[-._)]\s*/, "")
        .slice(0, 60),
      duree: 0,
    }));

    setPistes((p) => [...p, ...nouvelles].slice(0, 30));

    for (const n of nouvelles) {
      const d = await readAudioDuration(n.file);
      setPistes((p) => p.map((x) => (x.id === n.id ? { ...x, duree: d } : x)));
    }
  }

  // Pendant l'envoi, l'écran plein s'efface au profit d'un simple bandeau :
  // l'artiste retrouve son atelier et voit sa publication avancer en bas.
  // Rester bloqué sur un formulaire figé pendant qu'un projet monte, c'est
  // long, et rien ne dit que ça travaille.
  if (pending || echoue) {
    return (
      <BandeauPublication
        progres={progres}
        etape={etape}
        erreur={echoue ? error : null}
        onReessayer={submit}
        onAbandonner={() => {
          setEchoue(false);
          setError(null);
          setProgres(0);
          deposesRef.current.clear();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-bg fade">
      <div className="mx-auto flex h-dvh w-full max-w-[480px] flex-col">
        {/* -------------------------------------------------------- entête */}
        <header className="flex items-center gap-3 border-b border-fg/[.07] px-4 py-3">
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-10 w-10 place-items-center rounded-full glass text-fg/70 active:scale-90"
          >
            <Close size={17} />
          </button>
          <div className="flex-1">
            <div className="text-[16px] font-bold leading-tight">
              {format === "single" ? "Nouveau son" : "Nouveau projet"}
            </div>
            <div className="text-[11.5px] text-fg/45">{artist.name}</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 pb-10 pt-5">
          {/* Le choix arrive avant tout le reste : il change ce qu'on demande
              ensuite, et le découvrir après avoir rempli serait une punition. */}
          <div className="mb-5 flex gap-1.5 rounded-full glass p-1.5">
            {(
              [
                ["single", "Un son"],
                ["projet", "Un projet"],
              ] as const
            ).map(([id, libelle]) => (
              <button
                key={id}
                onClick={() => {
                  setFormat(id);
                  setError(null);
                }}
                className={cx(
                  "flex-1 rounded-full py-2.5 text-[13.5px] font-semibold transition active:scale-[.98]",
                  format === id ? "grad-brand text-ink" : "text-fg/50",
                )}
              >
                {libelle}
              </button>
            ))}
          </div>

          {format === "projet" && (
            <div className="mb-5 flex gap-2">
              {(
                [
                  ["ep", "EP"],
                  ["mixtape", "Mixtape"],
                  ["album", "Album"],
                ] as const
              ).map(([id, libelle]) => (
                <button
                  key={id}
                  onClick={() => setTypeProjet(id)}
                  className={cx(
                    "flex-1 rounded-2xl py-3 text-[13px] font-semibold transition active:scale-[.98]",
                    typeProjet === id
                      ? "bg-acid-500/15 text-acid-500 ring-1 ring-acid-500/40"
                      : "glass text-fg/50",
                  )}
                >
                  {libelle}
                </button>
              ))}
            </div>
          )}

          {/* ---------------------------------------------------- pochette */}
          <button
            onClick={() => coverRef.current?.click()}
            className="relative mx-auto block aspect-square w-52 overflow-hidden rounded-[28px] border border-dashed border-fg/20 bg-fg/[.03] transition active:scale-[.98]"
          >
            {coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPreview}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <span className="grid h-full place-items-center text-fg/35">
                <span className="text-center">
                  <Plus size={26} className="mx-auto" />
                  <span className="mt-2 block text-[12px] font-medium">
                    Pochette
                  </span>
                </span>
              </span>
            )}
          </button>

          <p className="mx-auto mt-2.5 max-w-[300px] text-center text-[11px] leading-relaxed text-fg/40">
            N&apos;importe quelle image : on la recadre en carré pour toi. Évite
            juste les logos de réseaux sociaux et les adresses web, les
            plateformes les refusent.
          </p>
          {coverInfo && (
            <p className="mt-1.5 text-center text-[11.5px] font-semibold text-brand-300">
              {coverInfo}
            </p>
          )}

          {/* ------------------------------------------------------- audio */}
          {format === "projet" ? (
            <ListePistes
              pistes={pistes}
              setPistes={setPistes}
              onAjouter={() => pistesRef.current?.click()}
            />
          ) : (
          <button
            onClick={() => audioRef.current?.click()}
            className="mt-6 flex w-full items-center gap-3.5 rounded-2xl border border-dashed border-fg/20 bg-fg/[.03] px-4 py-4 text-left transition active:scale-[.99]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl grad-brand text-ink">
              <Upload size={17} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] font-semibold">
                {audio ? audio.name : "Choisir le fichier audio"}
              </span>
              <span className="block text-[11px] text-fg/40">
                {audioInfo ?? "MP3, M4A, WAV — obligatoire"}
              </span>
            </span>
          </button>
          )}

          {/* ------------------------------------------------------ titres */}
          <Field
            label={format === "single" ? "Titre du son" : "Titre du projet"}
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                format === "single" ? "Ex. Wax Sa Dëgg" : "Ex. Sa Waay Vol. 1"
              }
              maxLength={60}
              className="w-full rounded-2xl glass px-4 py-3.5 text-[15px] font-medium outline-none placeholder:font-normal placeholder:text-fg/35"
            />
          </Field>

          {/* Le style est le seul signal de similarité disponible dès le
              premier morceau : les featurings et les soutiens communs
              demandent des mois d'usage. Trois au maximum — au-delà, une
              étiquette ne distingue plus rien. */}
          <Field
            label="Style"
            hint={`Jusqu'à ${MAX_STYLES}. C'est ce qui te fera recommander à ceux qui écoutent le même genre.`}
          >
            <div className="flex flex-wrap gap-2">
              {STYLES.map((st) => {
                const choisi = styles.includes(st.id);
                const plein = styles.length >= MAX_STYLES && !choisi;

                return (
                  <button
                    key={st.id}
                    onClick={() =>
                      setStyles((prev) =>
                        choisi
                          ? prev.filter((x) => x !== st.id)
                          : prev.length < MAX_STYLES
                            ? [...prev, st.id]
                            : prev,
                      )
                    }
                    disabled={plein}
                    className={cx(
                      "rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition active:scale-95",
                      choisi
                        ? "grad-brand text-ink"
                        : plein
                          ? "bg-fg/[.04] text-fg/20"
                          : "glass text-fg/55",
                    )}
                  >
                    {st.nom}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field
            label="Label"
            hint="Laisse vide si tu es indépendant. Le nom d'artiste vient de ton compte."
          >
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Indépendant"
              maxLength={60}
              className="w-full rounded-2xl glass px-4 py-3.5 text-[14px] outline-none placeholder:text-fg/35"
            />
          </Field>

          {/* -------------------------------------------------- featuring */}
          {format === "single" ? (
            <FeaturingPicker
              artist={artist}
              guests={guests}
              setGuests={setGuests}
              myShare={myShare}
            />
          ) : (
            <p className="mt-4 rounded-2xl glass px-4 py-3 text-[11.5px] leading-relaxed text-fg/45">
              Les featurings se déclarent morceau par morceau, donc pas ici. Tu
              pourras publier les titres concernés en single et garder le reste
              dans le projet.
            </p>
          )}

          {/* ------------------------------------------------ exclusivité */}
          <Field label="Accès">
            <button
              onClick={() => setLocked((v) => !v)}
              className="flex w-full items-center gap-3 rounded-2xl glass px-4 py-3.5 text-left"
            >
              <Lock
                size={16}
                className={locked ? "text-gold-700" : "text-fg/40"}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold">
                  Réservé aux soutiens
                </span>
                <span className="block text-[11px] text-fg/40">
                  Écoutable seulement après paiement
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

            {locked && (
              <div className="mt-2.5 rounded-2xl glass p-3.5 fade">
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["libre", "Soutien libre", "Il choisit"],
                      ["fixe", "Prix fixe", "Tu imposes"],
                    ] as const
                  ).map(([id, titre, sous]) => (
                    <button
                      key={id}
                      onClick={() => setMode(id)}
                      className={cx(
                        "rounded-2xl px-3 py-3 text-left transition",
                        mode === id
                          ? "grad-brand text-ink"
                          : "bg-fg/[.05] text-fg/70 active:scale-[.97]",
                      )}
                    >
                      <span className="block text-[13px] font-semibold">
                        {titre}
                      </span>
                      <span
                        className={cx(
                          "mt-0.5 block text-[10.5px]",
                          mode === id ? "text-white/75" : "text-fg/40",
                        )}
                      >
                        {sous}
                      </span>
                    </button>
                  ))}
                </div>

                {mode === "fixe" && (
                  <div className="mt-2.5 flex items-center gap-2.5 rounded-2xl bg-fg/[.05] px-4 py-3 fade">
                    <input
                      inputMode="numeric"
                      value={amount}
                      onChange={(e) =>
                        setAmount(e.target.value.replace(/\D/g, "").slice(0, 7))
                      }
                      className="w-full bg-transparent text-[17px] font-bold tabular-nums outline-none"
                    />
                    <span className="shrink-0 text-[12px] font-medium text-fg/45">
                      FCFA
                    </span>
                  </div>
                )}

                <p className="mt-2.5 text-[10.5px] leading-relaxed text-fg/40">
                  {mode === "fixe"
                    ? `Le fan paiera exactement ce montant. Minimum ${fcfa(MIN_SUPPORT)}.`
                    : "Le fan choisit combien il envoie — souvent plus qu'un prix imposé quand il tient à l'artiste."}
                </p>
              </div>
            )}
          </Field>

          {/* ------------------------------------------------------ droits */}
          <button
            onClick={() => setRights((v) => !v)}
            className="mt-5 flex w-full items-start gap-3 text-left"
          >
            <span
              className={cx(
                "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition",
                rights
                  ? "border-transparent grad-brand text-ink"
                  : "border-fg/25",
              )}
            >
              {rights && <Check size={12} />}
            </span>
            <span className="text-[11.5px] leading-relaxed text-fg/50">
              Je détiens les droits sur ce morceau et sa pochette, le partage
              déclaré est exact, et j&apos;autorise leur diffusion.
            </span>
          </button>

          <p className="mt-5 text-center text-[11px] leading-relaxed text-fg/35">
            Encode en 128 kbps si tu peux : c&apos;est inaudible sur un
            téléphone et ça divise par deux la data de tes fans.
          </p>
        </div>

        {/* Barre d'action collée en bas : le bouton reste à sa place dans
            l'ordre de lecture, sans jamais obliger à remonter le formulaire. */}
        <footer className="shrink-0 border-t border-fg/[.07] bg-bg/95 px-4 pb-5 pt-3 backdrop-blur-md">
          {error && (
            <p className="mb-2.5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-[12.5px] leading-snug text-red-600">
              {error}
            </p>
          )}

          <button
            onClick={submit}
            disabled={!ready}
            className="h-13 w-full rounded-full grad-brand text-[15.5px] font-semibold text-ink glow-brand transition active:scale-[.98] disabled:opacity-40 disabled:shadow-none disabled:active:scale-100"
          >
            {/* La progression remplace le libellé : sur dix morceaux et une
                connexion mobile, l'envoi dure, et un bouton muet laisse croire
                que rien ne se passe. */}
            {pending
              ? (etape ?? "Publication…")
              : format === "single"
                ? "Publier le son"
                : `Publier ${LIBELLE_PROJET[typeProjet]}`}
          </button>

          {!ready && !pending && (
            <p className="mt-2 text-center text-[11px] text-fg/40">
              {manque({
                format,
                title,
                audio,
                pistes,
                rights,
                myShare,
              })}
            </p>
          )}
        </footer>
      </div>

      <input
        ref={pistesRef}
        type="file"
        accept="audio/*"
        multiple
        hidden
        onChange={(e) => {
          const fs = e.target.files;
          // Le champ est vidé pour qu'on puisse rechoisir les mêmes fichiers
          // après en avoir retiré un de la liste.
          if (fs && fs.length > 0) void ajouterPistes(fs);
          e.target.value = "";
        }}
      />

      <input
        ref={audioRef}
        type="file"
        accept="audio/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          setAudio(f);
          setDuration(0);
          setAudioInfo(null);
          if (!f) return;

          if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));

          void readAudioDuration(f).then((d) => {
            setDuration(d);
            const mo = (f.size / 1024 / 1024).toFixed(1);
            setAudioInfo(
              d > 0
                ? `${Math.floor(d / 60)} min ${String(d % 60).padStart(2, "0")} · ${mo} Mo`
                : `${mo} Mo`,
            );
          });
        }}
      />
      <input
        ref={coverRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void pickCover(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ============================================================== featuring */

/**
 * Les morceaux d'un projet.
 *
 * Le titre est prérempli avec le nom du fichier, débarrassé de son extension
 * et de la numérotation qui traîne devant — « 03 - Sama Xol.mp3 » donne
 * « Sama Xol ». C'est juste neuf fois sur dix, et corriger un mot est bien
 * plus rapide que saisir dix titres.
 */
/**
 * Bandeau de publication, posé au-dessus de la barre de navigation.
 *
 * Le pourcentage vient des octets réellement partis, pas d'un compteur de
 * fichiers : sur un projet, un morceau sur dix passerait de 0 à 10 % d'un
 * coup, ce qui ressemble à une barre bloquée.
 */
function BandeauPublication({
  progres,
  etape,
  erreur,
  onReessayer,
  onAbandonner,
}: {
  progres: number;
  etape: string | null;
  erreur: string | null;
  onReessayer: () => void;
  onAbandonner: () => void;
}) {
  const pourcent = Math.min(99, Math.round(progres * 100));

  return (
    <div className="fixed inset-x-0 bottom-28 z-50 mx-auto w-full max-w-[480px] px-4">
      <div className="glass-strong overflow-hidden rounded-[24px] p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,.9)]">
        {erreur ? (
          <>
            <div className="text-[13.5px] font-bold text-red-400">
              Publication interrompue
            </div>
            <p className="mt-1 text-[12px] leading-snug text-fg/55">{erreur}</p>
            {/* Ce qui est déjà monté est conservé : réessayer reprend là où
                ça s'est arrêté plutôt que de tout renvoyer. */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={onAbandonner}
                className="h-11 flex-1 rounded-full bg-fg/[.07] text-[13px] font-semibold text-fg/60 transition active:scale-[.98]"
              >
                Abandonner
              </button>
              <button
                onClick={onReessayer}
                className="h-11 flex-1 rounded-full grad-brand text-[13px] font-bold text-ink transition active:scale-[.98]"
              >
                Réessayer
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-[13.5px] font-semibold">
                Publication · {etape ?? "en cours"}
              </span>
              <span className="shrink-0 text-[13px] font-bold tabular-nums text-acid-500">
                {pourcent} %
              </span>
            </div>

            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-fg/[.08]">
              <div
                className="h-full rounded-full grad-brand transition-[width] duration-300"
                style={{ width: `${Math.max(3, pourcent)}%` }}
              />
            </div>

            {/* On ne promet pas de survivre à un changement de page : quitter
                l'atelier démonte le composant et coupe l'envoi. */}
            <p className="mt-2 text-[11px] text-fg/35">
              Reste sur cette page jusqu&apos;à la fin.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const LIBELLE_PROJET: Record<TypeProjet, string> = {
  ep: "mon EP",
  mixtape: "ma mixtape",
  album: "mon album",
};

/** Ce qui bloque encore, dit dans l'ordre où l'artiste remplit l'écran. */
function manque({
  format,
  title,
  audio,
  pistes,
  rights,
  myShare,
}: {
  format: "single" | "projet";
  title: string;
  audio: File | null;
  pistes: Piste[];
  rights: boolean;
  myShare: number;
}): string {
  if (format === "projet") {
    if (pistes.length < 2) return "Un projet demande au moins deux sons.";
    if (pistes.some((p) => !p.titre.trim()))
      return "Un des morceaux n'a pas de titre.";
    if (title.trim().length < 2) return "Il manque le titre du projet.";
  } else {
    if (!audio) return "Il manque le fichier audio.";
    if (title.trim().length < 2) return "Il manque le titre du son.";
    if (myShare < 0) return "Les parts dépassent 100 %.";
  }
  if (!rights) return "Coche la case des droits pour publier.";
  return "";
}

function ListePistes({
  pistes,
  setPistes,
  onAjouter,
}: {
  pistes: Piste[];
  setPistes: React.Dispatch<React.SetStateAction<Piste[]>>;
  onAjouter: () => void;
}) {
  function deplacer(index: number, sens: -1 | 1) {
    const cible = index + sens;
    if (cible < 0 || cible >= pistes.length) return;
    setPistes((p) => {
      const copie = [...p];
      [copie[index], copie[cible]] = [copie[cible], copie[index]];
      return copie;
    });
  }

  return (
    <div className="mt-6">
      <button
        onClick={onAjouter}
        className="flex w-full items-center gap-3.5 rounded-2xl border border-dashed border-fg/20 bg-fg/[.03] px-4 py-4 text-left transition active:scale-[.99]"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl grad-brand text-ink">
          <Plus size={18} />
        </span>
        <span className="min-w-0">
          <span className="block text-[13.5px] font-semibold">
            {pistes.length === 0
              ? "Choisir les sons du projet"
              : "Ajouter d'autres sons"}
          </span>
          <span className="block text-[11px] text-fg/40">
            {pistes.length === 0
              ? "Sélectionne-les tous d'un coup"
              : `${pistes.length} son${pistes.length > 1 ? "s" : ""} · deux au minimum`}
          </span>
        </span>
      </button>

      {pistes.length > 0 && (
        <div className="mt-3 space-y-2">
          {pistes.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center gap-2.5 rounded-2xl glass px-3 py-2.5"
            >
              <span className="w-5 shrink-0 text-center text-[12px] font-bold tabular-nums text-fg/30">
                {i + 1}
              </span>

              <div className="min-w-0 flex-1">
                <input
                  value={p.titre}
                  onChange={(e) =>
                    setPistes((liste) =>
                      liste.map((x) =>
                        x.id === p.id
                          ? { ...x, titre: e.target.value.slice(0, 60) }
                          : x,
                      ),
                    )
                  }
                  placeholder="Titre du morceau"
                  className="w-full bg-transparent text-[13.5px] font-medium outline-none placeholder:text-fg/30"
                />
                <div className="mt-0.5 truncate text-[10.5px] text-fg/35">
                  {p.duree > 0
                    ? `${Math.floor(p.duree / 60)} min ${String(p.duree % 60).padStart(2, "0")} · `
                    : ""}
                  {(p.file.size / 1024 / 1024).toFixed(1)} Mo
                </div>
              </div>

              {/* L'ordre compte sur un projet : c'est la tracklist. */}
              <div className="flex shrink-0 flex-col">
                <button
                  onClick={() => deplacer(i, -1)}
                  disabled={i === 0}
                  aria-label="Monter"
                  className="px-1.5 text-[11px] text-fg/35 disabled:opacity-20"
                >
                  ▲
                </button>
                <button
                  onClick={() => deplacer(i, 1)}
                  disabled={i === pistes.length - 1}
                  aria-label="Descendre"
                  className="px-1.5 text-[11px] text-fg/35 disabled:opacity-20"
                >
                  ▼
                </button>
              </div>

              <button
                onClick={() =>
                  setPistes((liste) => liste.filter((x) => x.id !== p.id))
                }
                aria-label="Retirer"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-fg/25 active:scale-90"
              >
                <Close size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeaturingPicker({
  artist,
  guests,
  setGuests,
  myShare,
}: {
  artist: Artist;
  guests: Guest[];
  setGuests: (g: Guest[]) => void;
  myShare: number;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { id: string; name: string; avatarUrl?: string; gradient: [string, string] }[]
  >([]);
  const [searching, setSearching] = useState(false);

  const taken = useMemo(
    () => new Set(guests.map((g) => g.artistId).filter(Boolean)),
    [guests],
  );

  // Recherche différée : sans ce délai on tire une requête par frappe.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      return;
    }

    setSearching(true);
    const id = window.setTimeout(async () => {
      try {
        setResults(await findArtists(q, artist.id));
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => window.clearTimeout(id);
  }, [query, artist.id]);

  function add(guest: Guest) {
    setGuests([...guests, guest]);
    setQuery("");
    setResults([]);
  }

  function setShare(index: number, value: number) {
    setGuests(
      guests.map((g, i) => (i === index ? { ...g, share: value } : g)),
    );
  }

  return (
    <Field
      label="Featuring"
      hint="Cherche un artiste de la plateforme pour qu'il touche sa part directement. Sinon, ajoute simplement son nom."
    >
      <div className="flex items-center gap-2.5 rounded-2xl glass px-4 py-3.5">
        <span className="text-[15px] font-bold text-brand-300">@</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nom de l'artiste"
          maxLength={60}
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-fg/35"
        />
        {searching ? (
          <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-fg/15 border-t-brand-500" />
        ) : (
          <Search size={15} className="shrink-0 text-fg/35" />
        )}
      </div>

      {query.trim().length > 0 && (
        <div className="mt-2 overflow-hidden rounded-2xl glass fade">
          {results
            .filter((r) => !taken.has(r.id))
            .map((r) => (
              <button
                key={r.id}
                onClick={() =>
                  add({
                    artistId: r.id,
                    name: r.name,
                    avatarUrl: r.avatarUrl,
                    gradient: r.gradient,
                    share: 0,
                  })
                }
                className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-fg/[.04]"
              >
                <GuestAvatar
                  name={r.name}
                  avatarUrl={r.avatarUrl}
                  gradient={r.gradient}
                />
                <span className="min-w-0 flex-1 truncate text-[14px] font-medium">
                  {r.name}
                </span>
                <span className="shrink-0 rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold text-brand-300">
                  sur la plateforme
                </span>
              </button>
            ))}

          {/* Invité extérieur : il est crédité à l'affichage, mais sa part
              reste à l'artiste principal faute de compte où la verser. */}
          <button
            onClick={() => add({ name: query.trim(), share: 0 })}
            className="flex w-full items-center gap-3 border-t border-fg/[.07] px-3.5 py-2.5 text-left transition hover:bg-fg/[.04]"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-fg/[.07] text-fg/45">
              <Plus size={15} />
            </span>
            <span className="min-w-0 flex-1 text-[13.5px]">
              Ajouter «&nbsp;<span className="font-semibold">{query.trim()}</span>
              &nbsp;» — hors plateforme
            </span>
          </button>
        </div>
      )}

      {guests.length > 0 && (
        <div className="mt-3 space-y-2">
          {guests.map((g, i) => (
            <div
              key={`${g.artistId ?? g.name}-${i}`}
              className="flex items-center gap-2.5 rounded-2xl glass px-3 py-2.5"
            >
              <GuestAvatar
                name={g.name}
                avatarUrl={g.avatarUrl}
                gradient={g.gradient}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semibold">
                  {g.name}
                </div>
                <div className="text-[10.5px] text-fg/40">
                  {g.artistId ? "Reçoit sa part" : "Crédité seulement"}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1 rounded-xl bg-fg/[.06] px-2.5 py-1.5">
                <input
                  inputMode="numeric"
                  value={g.share || ""}
                  placeholder="0"
                  onChange={(e) => {
                    const v = Math.min(
                      100,
                      Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0,
                    );
                    setShare(i, v);
                  }}
                  className="w-8 bg-transparent text-right text-[14px] font-bold tabular-nums outline-none placeholder:text-fg/30"
                />
                <span className="text-[11px] font-medium text-fg/45">%</span>
              </div>

              <button
                onClick={() => setGuests(guests.filter((_, j) => j !== i))}
                aria-label={`Retirer ${g.name}`}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-fg/35 transition active:scale-90"
              >
                <Close size={14} />
              </button>
            </div>
          ))}

          {/* La part restante est la seule chose que l'artiste regarde
              vraiment ici : elle est affichée en permanence. */}
          <div
            className={cx(
              "flex items-center justify-between rounded-2xl px-4 py-3",
              myShare < 0
                ? "border border-red-500/30 bg-red-500/10"
                : "bg-fg/[.05]",
            )}
          >
            <span className="text-[12.5px] font-medium text-fg/60">
              Ta part
            </span>
            <span
              className={cx(
                "text-[17px] font-bold tabular-nums",
                myShare < 0 ? "text-red-600" : "text-gold-700",
              )}
            >
              {myShare} %
            </span>
          </div>

          {myShare < 0 && (
            <p className="px-1 text-[11.5px] text-red-600">
              Les parts dépassent 100 %. Réduis celles des invités.
            </p>
          )}
        </div>
      )}
    </Field>
  );
}

function GuestAvatar({
  name,
  avatarUrl,
  gradient,
}: {
  name: string;
  avatarUrl?: string;
  gradient?: [string, string];
}) {
  return (
    <span
      className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full text-[11px] font-semibold text-white/95"
      style={{
        backgroundImage: `linear-gradient(150deg, ${gradient?.[0] ?? "#e04ec8"}, ${gradient?.[1] ?? "#7c3aed"})`,
      }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}

/* ----------------------------------------------------------------- champ */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <div className="mb-2 px-1 text-[12px] font-semibold text-fg/50">
        {label}
      </div>
      {children}
      {hint && (
        <p className="mt-1.5 px-1 text-[10.5px] leading-relaxed text-fg/35">
          {hint}
        </p>
      )}
    </div>
  );
}
