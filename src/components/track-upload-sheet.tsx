"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTrack, findArtists } from "@/lib/actions";
import { MIN_SUPPORT } from "@/lib/config";
import { fcfa, initials } from "@/lib/format";
import { checkCoverDimensions, COVER_RULES } from "@/lib/storage";
import type { Artist } from "@/lib/types";
import { cx } from "./ui";
import { Check, Close, Lock, Plus, Search, Spark, Upload } from "./icons";

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

  const [title, setTitle] = useState("");
  const [label, setLabel] = useState(artist.label ?? "");
  const [audio, setAudio] = useState<File | null>(null);
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

  const guestShare = guests.reduce((s, g) => s + g.share, 0);
  const myShare = 100 - guestShare;
  const ready = title.trim().length > 1 && rights && myShare >= 0 && !pending;

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
    const check = await checkCoverDimensions(file);

    if (!check.ok) {
      setError(check.error);
      setCover(null);
      setCoverPreview(null);
      setCoverInfo(null);
      return;
    }

    setCover(file);
    setCoverPreview(URL.createObjectURL(file));
    setCoverInfo(
      `${check.width}×${check.height} · ${
        (check.width ?? 0) < COVER_RULES.idealSize
          ? `en dessous des ${COVER_RULES.idealSize} px idéaux`
          : "conforme"
      }`,
    );
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("artistId", artist.id);
      fd.set("artistSlug", artist.slug);
      fd.set("title", title);
      fd.set("label", label);
      fd.set("locked", locked ? "1" : "0");
      fd.set("rightsOk", rights ? "1" : "0");
      fd.set("supportMode", locked ? mode : "libre");
      fd.set("supportAmount", amount);
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
      if (cover) fd.set("cover", cover);

      const res = await createTrack(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
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
              Nouveau son
            </div>
            <div className="text-[11.5px] text-fg/45">{artist.name}</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 pb-10 pt-5">
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
            Carrée, {COVER_RULES.minSize} px minimum, {COVER_RULES.idealSize} px
            idéal. Ni logo de réseau social ni adresse web : les plateformes
            refusent.
          </p>
          {coverInfo && (
            <p className="mt-1.5 text-center text-[11.5px] font-semibold text-brand-300">
              {coverInfo}
            </p>
          )}

          {/* ------------------------------------------------------- audio */}
          <button
            onClick={() => audioRef.current?.click()}
            className="mt-6 flex w-full items-center gap-3.5 rounded-2xl border border-dashed border-fg/20 bg-fg/[.03] px-4 py-4 text-left transition active:scale-[.99]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl grad-brand text-white">
              <Upload size={17} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] font-semibold">
                {audio ? audio.name : "Choisir le fichier audio"}
              </span>
              <span className="block text-[11px] text-fg/40">
                MP3 ou WAV · encodé en 128 kbps à l&apos;envoi
              </span>
            </span>
          </button>

          {/* ------------------------------------------------------ titres */}
          <Field label="Titre du son">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. Wax Sa Dëgg"
              maxLength={60}
              className="w-full rounded-2xl glass px-4 py-3.5 text-[15px] font-medium outline-none placeholder:font-normal placeholder:text-fg/35"
            />
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
          <FeaturingPicker
            artist={artist}
            guests={guests}
            setGuests={setGuests}
            myShare={myShare}
          />

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
                          ? "grad-brand text-white"
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
                  ? "border-transparent grad-brand text-white"
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
            La pochette est envoyée, pas encore le fichier audio : le lecteur
            simulera la lecture en attendant.
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
            className="h-13 w-full rounded-full grad-brand text-[15.5px] font-semibold text-white glow-brand transition active:scale-[.98] disabled:opacity-40 disabled:shadow-none disabled:active:scale-100"
          >
            {pending ? "Publication…" : "Publier le son"}
          </button>

          {!ready && !pending && (
            <p className="mt-2 text-center text-[11px] text-fg/40">
              {title.trim().length < 2
                ? "Il manque le titre du son."
                : !rights
                  ? "Coche la case des droits pour publier."
                  : "Les parts dépassent 100 %."}
            </p>
          )}
        </footer>
      </div>

      <input
        ref={audioRef}
        type="file"
        accept="audio/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          setAudio(f);
          if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
        }}
      />
      <input
        ref={coverRef}
        type="file"
        accept={COVER_RULES.types.join(",")}
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
