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
import { ChevronRight, Music, Search } from "./icons";

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
        <h1 className="text-[27px] font-semibold tracking-tight">Découvrir</h1>
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
                ? "grad-brand text-white"
                : "glass text-fg/55 active:scale-95",
            )}
          >
            {v}
          </button>
        ))}
      </div>

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
          <div className="grid grid-cols-2 gap-3">
            {results.map(({ artist, total, count }) => (
              <Link
                key={artist.id}
                href={`/a/${artist.slug}`}
                className="group block"
              >
                {/* Carte média : voile noir sur la pochette, texte blanc. */}
                <div className="relative text-white">
                  <Cover
                    gradient={artist.gradient}
                    rounded="rounded-[26px]"
                    className="aspect-[3/4] w-full"
                  />
                  <span className="absolute inset-0 rounded-[26px] bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                  <span className="absolute left-3 top-3">
                    <Avatar
                      name={artist.name}
                      gradient={artist.gradient}
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
                    <span className="mt-0.5 block text-[11px] text-white/65">
                      {artist.city} · {compact(artist.monthlyListeners)} / mois
                    </span>
                    <span className="mt-2 flex items-center justify-between rounded-full bg-black/45 px-3 py-1.5 backdrop-blur-md">
                      <span className="text-[11.5px] font-semibold tabular-nums text-gold-400">
                        {fcfa(total, false)} F
                      </span>
                      <span className="text-[10px] text-white/55">
                        {count} soutien{count > 1 ? "s" : ""}
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
