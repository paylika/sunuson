"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { updateArtistImage, updateArtistProfile } from "@/lib/actions";
import { regionDe } from "@/lib/senegal";
import type { Artist } from "@/lib/types";
import { ChoixLieu } from "./choix-lieu";
import { PHOTO_RULES } from "@/lib/storage";
import { Avatar, Button, Cover, cx, NameWithBadge } from "./ui";
import { Check } from "./icons";

/**
 * L'identité de l'artiste : ses images, sa présentation, son Foy Tewal.
 *
 * Elle vivait dans l'atelier, en tête, au-dessus de l'argent et des morceaux.
 * C'était mal placé : on remplit ces champs une fois et on n'y revient qu'à
 * de rares occasions, alors que l'atelier s'ouvre pour publier, regarder ce
 * qui rentre et demander un retrait. Elle est passée dans les réglages, avec
 * le reste de ce qui se règle une bonne fois.
 *
 * L'atelier n'en garde que l'aperçu, en lecture seule : l'artiste doit
 * continuer à voir ce que voient ses fans.
 */

export function ProfilArtisteEditeur({ artist }: { artist: Artist }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"avatar" | "cover" | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  async function send(kind: "avatar" | "cover", file: File) {
    setError(null);
    setBusy(kind);

    const fd = new FormData();
    fd.set("artistId", artist.id);
    fd.set("artistSlug", artist.slug);
    fd.set("kind", kind);
    fd.set("file", file);

    const res = await updateArtistImage(fd);
    setBusy(null);

    if (!res.ok) setError(res.error);
    else router.refresh();
  }

  return (
    <section className="rise">
      {/* Cadrage IDENTIQUE à la page publique : même hauteur, même fondu vers
          le fond, même position de la photo. L'artiste voit exactement ce que
          verra le fan — sinon il cadre son image sur une bande et découvre
          ensuite qu'elle est rognée. */}
      <div className="relative -mx-4">
        <Cover
          gradient={artist.gradient}
          src={artist.coverUrl}
          alt=""
          rounded="rounded-b-[38px]"
          className="h-[300px] w-full"
        />
        <div className="absolute inset-x-0 bottom-0 h-44 rounded-b-[38px] bg-gradient-to-t from-bg via-bg/70 to-transparent" />

        <PencilButton
          label="Changer la bannière"
          busy={busy === "cover"}
          onClick={() => coverRef.current?.click()}
          className="absolute right-4 top-4"
        />

        <div className="absolute inset-x-5 bottom-5 flex items-end gap-3.5">
          <div className="relative shrink-0">
            <Avatar
              name={artist.name}
              gradient={artist.gradient}
              src={artist.avatarUrl}
              size={76}
              ring
            />
            <PencilButton
              label="Changer la photo"
              busy={busy === "avatar"}
              onClick={() => avatarRef.current?.click()}
              className="absolute -bottom-1 -right-1"
              small
            />
          </div>
          <div className="min-w-0 pb-1.5">
            <div className="text-[10.5px] uppercase tracking-[.14em] text-fg/40">
              Espace artiste
            </div>
            <div className="display text-[30px] font-extrabold">
              <NameWithBadge name={artist.name} verified={artist.verified} />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-[12.5px] text-red-600">
          {error}
        </p>
      )}

      <ProfileFields artist={artist} />

      <input
        ref={avatarRef}
        type="file"
        accept={PHOTO_RULES.types.join(",")}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void send("avatar", f);
          e.target.value = "";
        }}
      />
      <input
        ref={coverRef}
        type="file"
        accept={PHOTO_RULES.types.join(",")}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void send("cover", f);
          e.target.value = "";
        }}
      />
    </section>
  );
}

/**
 * Bio, Foy Tewal et label. Le bouton d'enregistrement n'apparaît qu'une fois
 * quelque chose modifié : sans ça, l'artiste ne sait pas s'il a un
 * changement en attente.
 */
function ProfileFields({ artist }: { artist: Artist }) {
  const router = useRouter();
  const [bio, setBio] = useState(artist.bio);
  const [city, setCity] = useState(artist.city);
  // La région se déduit du quartier déjà enregistré : l'artiste ne la
  // ressaisit pas pour corriger sa bio.
  const [region, setRegion] = useState(regionDe(artist.city) ?? "");
  const [label, setLabel] = useState(artist.label ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const dirty =
    bio !== artist.bio ||
    city !== artist.city ||
    label !== (artist.label ?? "");

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateArtistProfile({
        artistId: artist.id,
        artistSlug: artist.slug,
        bio,
        city,
        label,
      });
      if (!res.ok) {
        setError(res.error ?? "Enregistrement impossible.");
        return;
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
      router.refresh();
    });
  }

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <span className="text-[12px] font-semibold text-fg/50">
          Ma présentation
        </span>
        <span className="text-[10.5px] tabular-nums text-fg/35">
          {bio.length}/300
        </span>
      </div>

      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value.slice(0, 300))}
        placeholder="Deux ou trois phrases : ton style, d'où tu viens, ce qui arrive."
        rows={4}
        className="w-full resize-none rounded-2xl glass px-4 py-3.5 text-[13.5px] leading-relaxed outline-none placeholder:text-fg/35"
      />

      {/* Foy Tewal se choisit, ici aussi. Un champ libre dans l'atelier
          suffirait à casser ce que la liste fermée protège à l'inscription. */}
      <div className="mt-2.5">
        <ChoixLieu
          region={region}
          ville={city}
          surRegion={setRegion}
          surVille={setCity}
        />
      </div>

      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Label"
        maxLength={60}
        className="mt-2.5 w-full rounded-2xl glass px-4 py-3.5 text-[14px] outline-none placeholder:text-fg/35"
      />

      <p className="mt-1.5 px-1 text-[10.5px] leading-relaxed text-fg/35">
        Label vide = affiché « Indépendant ». Ton nom d&apos;artiste vient de
        ton compte, il ne se modifie pas ici.
      </p>

      {error && (
        <p className="mt-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-[12.5px] text-red-600">
          {error}
        </p>
      )}

      {(dirty || saved) && (
        <Button
          onClick={save}
          disabled={pending || !dirty}
          className="mt-3 w-full fade"
        >
          {saved ? (
            <>
              <Check size={16} /> Enregistré
            </>
          ) : pending ? (
            "Enregistrement…"
          ) : (
            "Enregistrer les modifications"
          )}
        </Button>
      )}
    </div>
  );
}

function PencilButton({
  label,
  onClick,
  busy,
  className,
  small,
}: {
  label: string;
  onClick: () => void;
  busy?: boolean;
  className?: string;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      disabled={busy}
      className={cx(
        "grid place-items-center rounded-full bg-fg text-ink shadow-[0_4px_14px_-4px_rgba(0,0,0,.8)] transition active:scale-90 disabled:opacity-60",
        small ? "h-8 w-8" : "h-9 w-9",
        className,
      )}
    >
      {busy ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-fg/20 border-t-brand-500" />
      ) : (
        <PencilIcon size={small ? 13 : 15} />
      )}
    </button>
  );
}

function PencilIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="m14.5 6.5 3 3" />
    </svg>
  );
}
