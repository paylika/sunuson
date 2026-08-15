"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { artists, tracks } from "@/lib/data";
import { compact, fcfa } from "@/lib/format";
import { useSupports } from "@/components/providers";
import { Shell } from "@/components/shell";
import {
  Avatar,
  Cover,
  cx,
  Glass,
  NameWithBadge,
  SectionTitle,
} from "@/components/ui";
import { ChevronRight, Music, Search } from "@/components/icons";

const villes = ["Toutes", "Pikine", "Guédiawaye", "Médina", "Thiès", "Parcelles Assainies"];

export default function DecouvrirPage() {
  const { totalForArtist, forArtist } = useSupports();
  const [q, setQ] = useState("");
  const [ville, setVille] = useState("Toutes");

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return artists.filter((a) => {
      if (ville !== "Toutes" && a.city !== ville) return false;
      if (!needle) return true;
      if (a.name.toLowerCase().includes(needle)) return true;
      if (a.city.toLowerCase().includes(needle)) return true;
      return tracks.some(
        (t) => t.artistId === a.id && t.title.toLowerCase().includes(needle),
      );
    });
  }, [q, ville]);

  return (
    <Shell>
      <header className="mb-5">
        <h1 className="text-[27px] font-semibold tracking-tight">Découvrir</h1>
        <p className="mt-1 text-[12.5px] text-fg/45">
          {artists.length} artistes · {tracks.length} sons
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
              Rien trouvé pour « {q} ».
            </p>
          </Glass>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {results.map((a) => (
              <Link key={a.id} href={`/a/${a.slug}`} className="group block">
                <div className="relative">
                  <Cover
                    gradient={a.gradient}
                    rounded="rounded-[26px]"
                    className="aspect-[3/4] w-full"
                  />
                  <span className="absolute inset-0 rounded-[26px] bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                  <span className="absolute left-3 top-3">
                    <Avatar name={a.name} gradient={a.gradient} size={38} ring />
                  </span>

                  {/* Posé sur le voile sombre de la pochette : texte blanc. */}
                  <span className="absolute inset-x-3 bottom-3 text-white">
                    <span className="block text-[14.5px] font-semibold leading-tight">
                      <NameWithBadge name={a.name} verified={a.verified} />
                    </span>
                    <span className="mt-0.5 block text-[11px] text-white/70">
                      {a.city} · {compact(a.monthlyListeners)} / mois
                    </span>
                    <span className="mt-2 flex items-center justify-between rounded-full glass-strong px-3 py-1.5">
                      <span className="text-[11.5px] font-semibold tabular-nums text-gold-700">
                        {fcfa(totalForArtist(a.id), false)} F
                      </span>
                      <span className="text-[10px] text-fg/45">
                        {forArtist(a.id).length} soutiens
                      </span>
                    </span>
                  </span>

                  <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full glass-strong text-fg/70 transition group-active:scale-90">
                    <ChevronRight size={15} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
