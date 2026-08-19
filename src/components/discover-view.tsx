"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { compact, fcfa } from "@/lib/format";
import type { Artist } from "@/lib/types";
import {
  Avatar,
  Cover,
  cx,
  Glass,
  NameWithBadge,
  SectionTitle,
} from "./ui";
import { ChevronRight, Flame, Music, Search } from "./icons";

export type DiscoverRow = {
  artist: Artist;
  total: number;
  count: number;
  titles: string[];
};

export function DiscoverView({
  rows,
  trackCount,
}: {
  rows: DiscoverRow[];
  trackCount: number;
}) {
  const [q, setQ] = useState("");
  const [ville, setVille] = useState("Toutes");

  // Les villes viennent des données, pas d'une liste figée : un artiste de
  // Ziguinchor apparaîtra sans qu'on ait à toucher au code.
  const villes = useMemo(
    () => ["Toutes", ...new Set(rows.map((r) => r.artist.city).filter(Boolean))],
    [rows],
  );

  // Le classement compte les SOUTIENS, jamais les montants : un palmarès des
  // revenus expose ce que gagne chaque artiste et humilie ceux du bas. Le
  // nombre donne la même preuve sociale sans afficher d'argent.
  const podium = useMemo(
    () =>
      [...rows]
        .sort((x, y) => y.count - x.count || y.total - x.total)
        .slice(0, 3)
        .filter((r) => r.count > 0),
    [rows],
  );

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(({ artist, titles }) => {
      if (ville !== "Toutes" && artist.city !== ville) return false;
      if (!needle) return true;
      return (
        artist.name.toLowerCase().includes(needle) ||
        artist.city.toLowerCase().includes(needle) ||
        titles.some((t) => t.toLowerCase().includes(needle))
      );
    });
  }, [rows, q, ville]);

  return (
    <>
      <header className="mb-5">
        <h1 className="display text-[32px] font-extrabold">Découvrir</h1>
        <p className="mt-1 text-[12.5px] text-fg/45">
          {rows.length} artistes · {trackCount} sons
        </p>
      </header>

      <div className="flex items-center gap-2.5 rounded-full glass px-4 py-3.5">
        <Search size={17} className="shrink-0 text-fg/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Un artiste, un son, un quartier…"
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-fg/35"
        />
      </div>

      <div className="-mx-4 mt-3.5 flex gap-2 overflow-x-auto px-4 pb-1">
        {villes.map((v) => (
          <button
            key={v}
            onClick={() => setVille(v)}
            className={cx(
              "shrink-0 rounded-full px-4 py-2 text-[12.5px] font-medium transition",
              ville === v
                ? "grad-brand text-ink"
                : "glass text-fg/55 active:scale-95",
            )}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Masqué dès qu'on cherche ou qu'on filtre : au milieu de résultats
          précis, un palmarès général n'est plus une réponse, c'est du bruit. */}
      {podium.length > 0 && !q.trim() && ville === "Toutes" && (
        <section className="mt-6">
          <SectionTitle>Ils montent en ce moment</SectionTitle>

          <div className="space-y-2.5">
            {podium.map(({ artist, count }, i) => (
              <Link key={artist.id} href={`/a/${artist.slug}`} className="block">
                <Glass className="flex items-center gap-3.5 rounded-[24px] px-3.5 py-3 transition active:scale-[.99]">
                  <span
                    className={cx(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11.5px] font-bold",
                      i === 0
                        ? "bg-gold-400 text-ink-950"
                        : i === 1
                          ? "bg-fg/85 text-ink"
                          : "grad-brand text-ink",
                    )}
                  >
                    {i + 1}
                  </span>
                  <Avatar
                    name={artist.name}
                    gradient={artist.gradient}
                    src={artist.avatarUrl}
                    size={44}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14.5px] font-semibold">
                      <NameWithBadge
                        name={artist.name}
                        verified={artist.verified}
                      />
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-[11.5px] text-fg/40">
                      {i === 0 && (
                        <Flame size={13} className="shrink-0 text-acid-500" />
                      )}
                      <span className="truncate">
                        {artist.city} · {count} soutien{count > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </Glass>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-6">
        <SectionTitle>
          {results.length} résultat{results.length > 1 ? "s" : ""}
        </SectionTitle>

        {results.length === 0 ? (
          <Glass className="px-5 py-10 text-center">
            <Music className="mx-auto text-fg/25" size={26} />
            <p className="mt-3 text-[13.5px] text-fg/50">
              Rien trouvé{q && ` pour « ${q} »`}.
            </p>
          </Glass>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {results.map(({ artist, count, titles: titres }) => (
              <Link
                key={artist.id}
                href={`/a/${artist.slug}`}
                className="group block survol-monte"
              >
                {/* Carte média : voile noir sur la pochette, texte blanc. */}
                <div className="relative text-white">
                  <Cover
                    gradient={artist.gradient}
                    src={artist.coverUrl}
                    rounded="rounded-[26px]"
                    className="aspect-[3/4] w-full"
                  />
                  <span className="absolute inset-0 rounded-[26px] bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                  <span className="absolute left-3 top-3">
                    <Avatar
                      name={artist.name}
                      gradient={artist.gradient}
                      src={artist.avatarUrl}
                      size={38}
                      ring
                    />
                  </span>

                  <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/35 backdrop-blur-md transition group-active:scale-90">
                    <ChevronRight size={15} />
                  </span>

                  <span className="absolute inset-x-3 bottom-3">
                    <span className="block text-[14.5px] font-semibold leading-tight">
                      <NameWithBadge
                        name={artist.name}
                        verified={artist.verified}
                      />
                    </span>
                    {/* Le Foy Tewal et le nombre de sons : les auditeurs
                        mensuels apparaissaient ici ET dans la pastille juste
                        en dessous, ce qui donnait deux fois le même chiffre à
                        deux endroits d'une carte de la taille d'un pouce. */}
                    <span className="mt-0.5 block truncate text-[11px] text-white/65">
                      {artist.city}
                      {titres.length > 0 &&
                        ` · ${titres.length} son${titres.length > 1 ? "s" : ""}`}
                    </span>
                    <span className="mt-2 flex items-center justify-between rounded-full bg-black/45 px-3 py-1.5 backdrop-blur-md">
                      <span className="text-[11.5px] font-semibold tabular-nums text-gold-400">
                        {count} soutien{count > 1 ? "s" : ""}
                      </span>
                      <span className="text-[10px] text-white/55">
                        {compact(artist.monthlyListeners)} / mois
                      </span>
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
