"use client";

import { useMemo, useRef, useState } from "react";
import { COMMUNES, REGIONS, regionDe, type Commune } from "@/lib/senegal";
import { cx, Glass } from "./ui";
import { Check, Close, Search } from "./icons";

/**
 * Foy Tewal : une liste fermée, affichée en entier, qu'on peut filtrer en
 * tapant.
 *
 * Trois exigences qui se contredisent, et qu'il fallait tenir ensemble :
 *
 *  — fermée, parce qu'un champ libre donne « pikine », « Pikine » et « PIKINE
 *    Dakar » pour un seul endroit, et que le filtre de Découvrir n'y survit
 *    pas ;
 *  — affichée, parce qu'un rappeur veut voir les quartiers de sa région pour
 *    reconnaître le sien, pas deviner comment il s'écrit ici ;
 *  — tapable, parce que la région de Dakar compte cinquante-quatre quartiers
 *    et que les faire défiler au pouce pour en trouver un dont on connaît déjà
 *    le nom est une punition.
 *
 * D'où : la région se choisit dans un menu (quatorze entrées, rien à
 * chercher), puis TOUS ses quartiers s'affichent, et le champ de recherche les
 * réduit à mesure qu'on écrit.
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

  const communesDeLaRegion = useMemo(
    () => REGIONS.find((r) => r.nom === region)?.communes ?? [],
    [region],
  );

  const resultats = useMemo(() => {
    const aiguille = sansAccent(q);

    // Région choisie sans recherche : on montre tout. C'est le comportement
    // attendu d'une liste — on la parcourt des yeux avant de taper.
    if (!aiguille) return region ? communesDeLaRegion : [];

    // La recherche porte sur tous les quartiers quand aucune région n'est
    // choisie : quelqu'un de Thiaroye tape « thia » sans avoir à savoir que
    // Thiaroye dépend de Pikine, lui-même dans la région de Dakar.
    const bassin = region ? communesDeLaRegion : COMMUNES;
    return bassin.filter((c) => sansAccent(c.nom).includes(aiguille));
  }, [q, region, communesDeLaRegion]);

  function choisir(c: Commune) {
    surVille(c.nom);
    const r = regionDe(c.nom);
    if (r && r !== region) surRegion(r);
    setQ("");
    champ.current?.blur();
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {/* Quatorze régions et la diaspora : le menu natif est le bon outil,
            il n'y a rien à chercher là-dedans. */}
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
            texte saisi : on le retire pour en changer, on ne le corrige pas
            lettre par lettre. C'est ce qui garantit que la valeur envoyée
            vient bien de la liste. */}
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
              placeholder={region ? "Chercher" : "Quartier"}
              className="w-full bg-transparent text-[14.5px] outline-none placeholder:text-fg/30"
            />
          </div>
        )}
      </div>

      {/* --------------------------------------------------------- la liste */}
      {!ville && (q.trim() || region) && (
        <Glass className="mt-2 overflow-hidden rounded-2xl">
          {resultats.length === 0 ? (
            <p className="px-4 py-3.5 text-[12.5px] text-fg/45">
              Aucun quartier ne correspond. Dis-le-nous s&apos;il manque.
            </p>
          ) : (
            <>
              {region && !q.trim() && (
                <p className="border-b border-fg/[.06] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-fg/30">
                  {resultats.length} quartiers · écris pour filtrer
                </p>
              )}

              {/* Hauteur bornée : la liste doit rester une liste, pas pousser
                  le bouton d'enregistrement hors de l'écran. */}
              <div className="max-h-64 divide-y divide-fg/[.06] overflow-y-auto">
                {resultats.map((c) => (
                  <button
                    key={`${c.zone ?? ""}-${c.nom}`}
                    onClick={() => choisir(c)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition active:bg-fg/[.06]"
                  >
                    <span className="min-w-0 truncate text-[14px]">
                      {c.nom}
                    </span>
                    {/* Le département situe le quartier — « Thiaroye » ne dit
                        rien à qui ne connaît pas, « Pikine » situe. Hors
                        recherche globale, la région est déjà connue. */}
                    <span className="shrink-0 text-[11px] text-fg/35">
                      {region ? c.zone : (c.zone ?? regionDe(c.nom))}
                    </span>
                  </button>
                ))}
              </div>
            </>
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

