import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { APP_NAME } from "@/lib/config";
import { getSupportById } from "@/lib/queries";
import { Glass } from "@/components/ui";
import { Check, Spark } from "@/components/icons";
import { Shell } from "@/components/shell";

export const metadata: Metadata = { title: `Merci — ${APP_NAME}` };
export const dynamic = "force-dynamic";

/**
 * Retour de paiement.
 *
 * L'agrégateur renvoie le fan ici dès qu'il a payé — mais la confirmation, la
 * vraie, arrive par le webhook, parfois quelques secondes plus tard. Cet écran
 * doit donc savoir dire « en cours » sans inquiéter, et ne JAMAIS annoncer un
 * paiement réussi qui ne l'est pas : ce serait la pire promesse à trahir.
 */
export default async function RetourSoutienPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const soutien = await getSupportById(id);

  if (!soutien) notFound();

  const paye = soutien.status === "paid";
  const echoue = soutien.status === "failed";

  return (
    <Shell>
      <div className="flex flex-col items-center pt-10 text-center">
        <span
          className={
            paye
              ? "grid h-16 w-16 place-items-center rounded-full grad-brand text-ink glow-brand"
              : "grid h-16 w-16 place-items-center rounded-full glass text-fg/50"
          }
        >
          {paye ? <Check size={26} /> : <Spark size={24} />}
        </span>

        <h1 className="display mt-6 text-[28px] font-extrabold !leading-[1.1]">
          {paye
            ? "Merci."
            : echoue
              ? "Paiement non abouti"
              : "Paiement en cours"}
        </h1>

        <p className="mx-auto mt-3 max-w-[300px] text-[13.5px] leading-relaxed text-fg/55">
          {paye ? (
            <>
              Ton soutien est parti à {soutien.artistName}. Ton nom apparaît
              maintenant sur sa page.
            </>
          ) : echoue ? (
            <>
              Rien n&apos;a été débité. Tu peux réessayer depuis la page de
              l&apos;artiste.
            </>
          ) : (
            <>
              Ton opérateur confirme le paiement, ça prend parfois quelques
              secondes. Recharge cette page dans un instant.
            </>
          )}
        </p>

        {soutien.artistSlug && (
          <Link
            href={`/a/${soutien.artistSlug}`}
            className="mt-7 flex h-13 w-full items-center justify-center rounded-full glass text-[14.5px] font-semibold text-fg/80 transition active:scale-[.98]"
          >
            Retour chez {soutien.artistName}
          </Link>
        )}

        {!paye && !echoue && (
          <Glass className="mt-4 w-full rounded-[22px] px-4 py-3 text-left">
            <p className="text-[11.5px] leading-relaxed text-fg/40">
              Si rien ne change après une minute, vérifie tes messages : ton
              opérateur t&apos;envoie une confirmation. Rien ne sera débité deux
              fois.
            </p>
          </Glass>
        )}
      </div>
    </Shell>
  );
}
