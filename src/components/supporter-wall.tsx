"use client";

import { useMemo } from "react";
import { fcfa, initials, timeAgo } from "@/lib/format";
import type { Support } from "@/lib/types";
import { cx, Glass } from "./ui";
import { Spark } from "./icons";

/**
 * Le mur est le moteur du produit : c'est la visibilité publique du geste
 * qui remplace le fait de donner devant tout le monde. Sans classement,
 * il ne reste qu'un bouton de don — et personne n'appuie sur un bouton de don.
 */
export function SupporterWall({ supports }: { supports: Support[] }) {
  const ranked = useMemo(() => {
    const byName = new Map<string, { name: string; total: number; last: string }>();
    for (const s of supports) {
      const key = s.supporterName.toLowerCase();
      const prev = byName.get(key);
      if (prev) {
        prev.total += s.amount;
        if (s.createdAt > prev.last) prev.last = s.createdAt;
      } else {
        byName.set(key, {
          name: s.supporterName,
          total: s.amount,
          last: s.createdAt,
        });
      }
    }
    return [...byName.values()].sort((a, b) => b.total - a.total);
  }, [supports]);

  const recent = useMemo(
    () =>
      [...supports]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 6),
    [supports],
  );

  if (supports.length === 0) {
    return (
      <Glass className="px-5 py-8 text-center">
        <Spark className="mx-auto text-fg/25" size={26} />
        <p className="mt-3 text-[13.5px] text-fg/50">
          Personne n&apos;a encore soutenu.
        </p>
        <p className="text-[12px] text-fg/35">Sois le premier du mur.</p>
      </Glass>
    );
  }

  return (
    <div className="space-y-3">
      <Glass className="overflow-hidden">
        <div className="px-4 pt-4 pb-1 text-[12px] font-medium text-fg/45">
          Top soutiens
        </div>
        <div className="p-2">
          {ranked.slice(0, 5).map((s, i) => (
            <div
              key={s.name}
              className="flex items-center gap-3 rounded-2xl px-2 py-2.5"
            >
              <span
                className={cx(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-bold",
                  i === 0
                    ? "bg-gold-400 text-ink-950"
                    : i === 1
                      ? "bg-fg/80 text-white"
                      : i === 2
                        ? "bg-brand-500 text-white"
                        : "glass text-fg/60",
                )}
              >
                {i + 1}
              </span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-fg/10 text-[11px] font-semibold text-fg/70">
                {initials(s.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium">
                  {s.name}
                </span>
                <span className="block text-[11px] text-fg/35">
                  {timeAgo(s.last)}
                </span>
              </span>
              <span
                className={cx(
                  "shrink-0 text-[13.5px] font-semibold tabular-nums",
                  i === 0 ? "text-gold-700" : "text-fg/80",
                )}
              >
                {fcfa(s.total, false)}
                <span className="ml-1 text-[10px] font-normal opacity-50">
                  F
                </span>
              </span>
            </div>
          ))}
        </div>
      </Glass>

      <Glass className="overflow-hidden">
        <div className="px-4 pt-4 pb-1 text-[12px] font-medium text-fg/45">
          Derniers messages
        </div>
        <div className="space-y-1 p-2">
          {recent.map((s) => (
            <div key={s.id} className="rounded-2xl px-2 py-2.5">
              <div className="flex items-baseline gap-2">
                <span className="truncate text-[13.5px] font-medium">
                  {s.supporterName}
                </span>
                <span className="shrink-0 text-[12px] font-semibold tabular-nums text-brand-300">
                  {fcfa(s.amount, false)} F
                </span>
                <span className="ml-auto shrink-0 text-[10.5px] text-fg/30">
                  {timeAgo(s.createdAt)}
                </span>
              </div>
              {s.message && (
                <p className="mt-1 text-[12.5px] leading-snug text-fg/55">
                  {s.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </Glass>
    </div>
  );
}
