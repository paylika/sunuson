"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { requestPayout } from "@/lib/actions";
import { COMMISSION_RATE, MIN_PAYOUT, PAYMENT_METHODS } from "@/lib/config";
import { fcfa } from "@/lib/format";
import type { Balance } from "@/lib/queries";
import type { Artist } from "@/lib/types";
import { Wallet } from "./icons";

/**
 * L'argent, désormais dans les réglages.
 *
 * Il ouvrait l'atelier, en grand et en acide. C'était flatteur mais faux :
 * l'atelier sert à faire de la musique — voir ses sons, ses projets, qui l'a
 * soutenu. On ne consulte son solde ni en publiant, ni en réorganisant ses
 * morceaux ; on y va exprès, comme on va au guichet.
 *
 * Il garde son aplat vif : c'est le moment de récompense, et il le mérite
 * même dans un écran de réglages.
 */
export function SoldeArtiste({
  artist,
  balance,
}: {
  artist: Artist;
  balance: Balance;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Seul bloc qui garde un aplat vif : c'est le moment de récompense. Sur
  // l'accent acide, tout le contenu passe en encre sombre — du blanc y serait
  // illisible.
  return (
    <div className="relative overflow-hidden rounded-[30px] grad-brand p-5 text-ink glow-brand">
          <div className="relative">
            <div className="flex items-center gap-2 text-[12px] font-medium text-ink/65">
              <Wallet size={15} />
              Disponible au retrait
            </div>
            <div className="display mt-2 text-[46px] font-extrabold tabular-nums">
              {fcfa(balance.available, false)}
              <span className="ml-2 text-[15px] font-semibold opacity-55">
                FCFA
              </span>
            </div>
            <div className="mt-1.5 text-[11.5px] font-medium text-ink/60">
              {fcfa(balance.gross)} reçus · commission{" "}
              {Math.round(COMMISSION_RATE * 100)} % déduite
            </div>

            <button
              onClick={() =>
                startTransition(async () => {
                  await requestPayout(artist.id, balance.available);
                  router.refresh();
                })
              }
              disabled={balance.available < MIN_PAYOUT || pending}
              className="mt-4 h-12 w-full rounded-full bg-ink text-[15px] font-semibold text-fg transition active:scale-[.98] disabled:opacity-40 disabled:active:scale-100"
            >
              {pending
                ? "Demande en cours…"
                : balance.available < MIN_PAYOUT
                  ? `Minimum ${fcfa(MIN_PAYOUT)}`
                  : "Retirer sur Wave"}
            </button>

            <div className="mt-3 flex gap-1.5">
              {PAYMENT_METHODS.map((m) => (
                <span
                  key={m.id}
                  className="rounded-full bg-ink/12 px-2.5 py-1 text-[10px] font-semibold text-ink/70"
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>
        </div>
  );
}
