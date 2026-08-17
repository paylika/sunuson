"use client";

import { useMemo } from "react";
import { initials, timeAgo } from "@/lib/format";
import type { Support } from "@/lib/types";
import { cx, Glass } from "./ui";
import { Spark } from "./icons";

/**
 * Le mur est le moteur du produit : la visibilité publique du geste, qui
 * remplace le fait de donner devant tout le monde.
 *
 * Aucun montant n'est affiché. Ce qui circule ici, c'est le nom et le mot —
 * pas la somme. Le classement reste ordonné par montant, mais le chiffre
 * n'apparaît nulle part : le prestige vient du rang, pas de l'étalage.
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

  // Un soutien sans mot n'a rien à dire : il compte dans le classement mais
  // n'encombre pas le fil.
  const messages = useMemo(
    () =>
      supports
        .filter((s) => s.message && s.message.trim().length > 0)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 12),
    [supports],
  );

  if (supports.length === 0) {
    return (
      <Glass className="rounded-[26px] px-5 py-9 text-center">
        <Spark className="mx-auto text-fg/25" size={26} />
        <p className="mt-3 text-[13.5px] font-medium text-fg/55">
          Personne n&apos;a encore soutenu.
        </p>
        <p className="mt-0.5 text-[12px] text-fg/35">Sois le premier du mur.</p>
      </Glass>
    );
  }

  return (
    <div className="space-y-3">
      {/* ------------------------------------------------------ classement */}
      <Glass className="overflow-hidden rounded-[26px]">
        <div className="px-4 pt-4 pb-1 text-[12px] font-semibold text-fg/45">
          Ils le soutiennent
        </div>
        <div className="p-2">
          {ranked.slice(0, 5).map((s, i) => (
            <div
              key={s.name}
              className="flex items-center gap-3 rounded-2xl px-2 py-2.5"
            >
              <span
                className={cx(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11.5px] font-bold",
                  i === 0
                    ? "bg-gold-400 text-ink-950"
                    : i === 1
                      ? "bg-fg/85 text-ink"
                      : i === 2
                        ? "grad-brand text-ink"
                        : "bg-fg/[.07] text-fg/45",
                )}
              >
                {i + 1}
              </span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-fg/[.07] text-[11px] font-semibold text-fg/70">
                {initials(s.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px] font-semibold">
                  {s.name}
                </span>
                <span className="block text-[11px] text-fg/35">
                  {timeAgo(s.last)}
                </span>
              </span>
            </div>
          ))}
        </div>
      </Glass>

      {/* -------------------------------------------------------- messages */}
      {messages.length > 0 && (
        <Glass className="overflow-hidden rounded-[26px]">
          <div className="px-4 pt-4 pb-1 text-[12px] font-semibold text-fg/45">
            Ce qu&apos;ils disent
          </div>
          <div className="space-y-1 p-2">
            {messages.map((s) => (
              <div key={s.id} className="rounded-2xl px-2 py-2.5">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-[13.5px] font-semibold">
                    {s.supporterName}
                  </span>
                  <span className="ml-auto shrink-0 text-[10.5px] text-fg/30">
                    {timeAgo(s.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-[13px] leading-snug text-fg/65">
                  {s.message}
                </p>
              </div>
            ))}
          </div>
        </Glass>
      )}
    </div>
  );
}
