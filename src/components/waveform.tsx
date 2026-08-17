"use client";

import { useMemo } from "react";
import { duration as formatDuration, initials } from "@/lib/format";
import { waveformFor } from "@/lib/waveform";
import { cx } from "./ui";

export type Marker = { name: string; positionSec?: number };

/**
 * Forme d'onde du morceau, avec les fans épinglés à la seconde où ils ont
 * soutenu.
 *
 * C'est l'élément signature du produit. Pour le fan, voir des noms posés sur
 * un passage précis est une raison de plus d'y laisser le sien. Pour
 * l'artiste, c'est une information qu'aucune plateforme ne lui donne : quel
 * moment de son morceau déclenche les gens.
 */
export function Waveform({
  trackId,
  position,
  total,
  markers,
  onSeek,
}: {
  trackId: string;
  position: number;
  total: number;
  markers: Marker[];
  onSeek: (seconds: number) => void;
}) {
  const bars = useMemo(() => waveformFor(trackId), [trackId]);
  const progress = total > 0 ? Math.min(1, position / total) : 0;

  // Sans position enregistrée, un fan n'a pas sa place sur l'onde : il reste
  // dans la liste en dessous plutôt que d'être posé n'importe où.
  const posed = useMemo(
    () =>
      markers
        .filter(
          (m) =>
            typeof m.positionSec === "number" &&
            m.positionSec >= 0 &&
            total > 0 &&
            m.positionSec <= total,
        )
        .sort((a, b) => (a.positionSec ?? 0) - (b.positionSec ?? 0))
        .slice(0, 8),
    [markers, total],
  );

  return (
    <div>
      <div
        className="relative cursor-pointer select-none pt-1"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          onSeek(((e.clientX - r.left) / r.width) * total);
        }}
      >
        <div className="flex h-14 items-center gap-[2px]">
          {bars.map((h, i) => (
            <span
              key={i}
              className={cx(
                "flex-1 rounded-full transition-colors",
                i / bars.length <= progress ? "bg-acid-500" : "bg-fg/18",
              )}
              style={{ height: `${Math.round(h * 100)}%` }}
            />
          ))}
        </div>

        {/* Repères des fans, posés sous l'onde à leur seconde. */}
        <div className="relative mt-1.5 h-6">
          {posed.map((m, i) => (
            <span
              key={`${m.name}-${i}`}
              title={`${m.name} · ${formatDuration(m.positionSec ?? 0)}`}
              className="absolute top-0 grid h-6 w-6 -translate-x-1/2 place-items-center rounded-full bg-acid-500 text-[8.5px] font-extrabold text-ink ring-2 ring-bg"
              style={{
                left: `${Math.min(97, Math.max(3, ((m.positionSec ?? 0) / total) * 100))}%`,
              }}
            >
              {initials(m.name)}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-1 flex justify-between text-[11px] font-medium tabular-nums text-fg/40">
        <span>{formatDuration(position)}</span>
        <span>{formatDuration(total)}</span>
      </div>
    </div>
  );
}
