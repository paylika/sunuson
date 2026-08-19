import type { ReactNode } from "react";
import { BackButton } from "./page-header";

/**
 * Mise en page commune aux documents.
 *
 * Écrits en français simple, au tutoiement, comme le reste de l'application.
 * Un texte que personne ne lit ne protège personne : la version juridique
 * incompréhensible est un rituel, pas une information.
 */
export function DocumentLegal({
  titre,
  maj,
  children,
}: {
  titre: string;
  maj: string;
  children: ReactNode;
}) {
  return (
    <>
      <header className="mb-6 flex items-center gap-3">
        <BackButton fallback="/parametres" />
        <div className="min-w-0 flex-1">
          <h1 className="display truncate text-[24px] font-extrabold">
            {titre}
          </h1>
          <p className="mt-0.5 text-[11.5px] text-fg/40">
            Mise à jour du {maj}
          </p>
        </div>
      </header>

      <div className="space-y-6 pb-4">{children}</div>
    </>
  );
}

export function Section({
  titre,
  children,
}: {
  titre: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 text-[15px] font-bold">{titre}</h2>
      <div className="space-y-2.5 text-[13.5px] leading-relaxed text-fg/60">
        {children}
      </div>
    </section>
  );
}
