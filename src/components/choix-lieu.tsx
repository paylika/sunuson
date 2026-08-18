"use client";

import { useMemo, useRef, useState } from "react";
import { COMMUNES, REGIONS, regionDe } from "@/lib/senegal";
import { cx, Glass } from "./ui";
import { Check, Close, Search } from "./icons";

/**
 * Foy Tewal : une liste fermée qu'on peut taper.
 *
 * Le menu déroulant seul obligeait à faire défiler cinquante-six quartiers au
 * pouce pour en trouver un dont on connaît déjà le nom. Le champ libre, lui,
 * produisait « pikine », « Pikine » et « PIKINE Dakar » pour un seul endroit.
 *
 * On garde donc la liste — le serveur la fait respecter — mais on la cherche
 * en tapant. Trois lettres suffisent, et la recherche porte sur TOUS les
 * quartiers même quand aucune région n'est choisie : quelqu'un de Thiaroye
 * tape « thia », il n'a pas à savoir que Thiaroye est dans Pikine. La région
 * se remplit alors toute seule.
 */
export function ChoixLieu({
  region,
  ville,
  surRegion,
  surVille,
}: {
  region: string;
  ville: string;
  surRegion: (v: string) => void;
  surVille: (v: string) => void;
}) {
  const [q, setQ] = useState("");
  const champ = useRef<HTMLInputElement>(null);

  const communesDeLaRegion =
    REGIONS.find((r) => r.nom === region)?.communes ?? [];

  const resultats = useMemo(() => {
    const aiguille = sansAccent(q);

    // Sans recherche, on propose les quartiers de la région choisie. Sans
    // région non plus, on ne déverse pas cinquante-six lignes : on attend.
    if (!aiguille) return region ? communesDeLaRegion : [];

    const bassin = region ? communesDeLaRegion : COMMUNES;
    return bassin
      .filter((c) => sansAccent(c).includes(aiguille))
      .slice(0, 12);
  }, [q, region, communesDeLaRegion]);

  function choisir(commune: string) {
    surVille(commune);
    // La région suit le quartier, jamais l'inverse : c'est le quartier que
    // l'artiste connaît.
    const r = regionDe(commune);
    if (r && r !== region) surRegion(r);
    setQ("");
    champ.current?.blur();
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {/* Dix-neuf régions : le menu natif reste le bon outil, il n'y a rien
            à chercher là-dedans. */}
        <div className="relative">
          <select
            value={region}
            onChange={(e) => {
              surRegion(e.target.value);
              surVille("");
              setQ("");
            }}
            className={cx(
              "h-14 w-full appearance-none rounded-2xl glass pl-4 pr-8 text-[14.5px] outline-none focus:border-acid-500/40",
              !region && "text-fg/30",
            )}
          >
            <option value="" className="bg-surface text-fg">
              Région
            </option>
            {REGIONS.map((r) => (
              <option key={r.nom} value={r.nom} className="bg-surface text-fg">
                {r.nom}
              </option>
            ))}
          </select>
          <Fleche />
        </div>

        {/* Le quartier retenu s'affiche comme un choix fait, pas comme du
            texte saisi : on ne peut plus le modifier lettre par lettre, on le
            retire et on recommence. C'est ce qui garantit que la valeur
            envoyée vient bien de la liste. */}
        {ville ? (
          <button
            onClick={() => {
              surVille("");
              setQ("");
              setTimeout(() => champ.current?.focus(), 0);
            }}
            className="flex h-14 items-center gap-2 rounded-2xl border border-acid-500/40 bg-acid-500/[.08] px-4 text-left transition active:scale-[.98]"
          >
            <Check size={15} className="shrink-0 text-acid-500" />
            <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold">
              {ville}
            </span>
            <Close size={14} className="shrink-0 text-fg/40" />
          </button>
        ) : (
          <div className="flex h-14 items-center gap-2 rounded-2xl glass px-4 focus-within:border-acid-500/40">
            <Search size={15} className="shrink-0 text-fg/35" />
            <input
              ref={champ}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && resultats.length > 0) {
                  e.preventDefault();
                  choisir(resultats[0]);
                }
              }}
              placeholder="Quartier"
              className="w-full bg-transparent text-[14.5px] outline-none placeholder:text-fg/30"
            />
          </div>
        )}
      </div>

      {/* --------------------------------------------------------- résultats */}
      {!ville && (q.trim() || region) && (
        <Glass className="mt-2 overflow-hidden rounded-2xl">
          {resultats.length === 0 ? (
            <p className="px-4 py-3.5 text-[12.5px] text-fg/45">
              Aucun quartier ne correspond. Écris-nous s&apos;il manque.
            </p>
          ) : (
            <div className="max-h-56 overflow-y-auto divide-y divide-fg/[.06]">
              {resultats.map((c) => (
                <button
                  key={c}
                  onClick={() => choisir(c)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition active:bg-fg/[.06]"
                >
                  <span className="text-[14px]">{c}</span>
                  {/* La région n'apparaît que si elle n'est pas déjà choisie :
                      la répéter à chaque ligne serait du bruit. */}
                  {!region && (
                    <span className="shrink-0 text-[11px] text-fg/35">
                      {regionDe(c)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </Glass>
      )}
    </div>
  );
}

function Fleche() {
  return (
    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-fg/35">
      <svg
        width={13}
        height={13}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}

/**
 * Comparaison sans accent ni casse : on tape « guediawaye » sur un clavier de
 * téléphone, pas « Guédiawaye ». Exiger l'accent reviendrait à cacher la
 * moitié des quartiers à ceux qui ne savent pas où le trouver.
 */
function sansAccent(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
