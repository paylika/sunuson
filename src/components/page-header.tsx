"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ChevronLeft } from "./icons";

/**
 * Retour arrière. On utilise l'historique du navigateur plutôt qu'un lien
 * fixe : un fan arrive presque toujours par un lien partagé, donc « la page
 * précédente » n'est pas la même selon d'où il vient. Repli sur l'accueil
 * quand il n'y a pas d'historique — cas du lien ouvert directement.
 */
export function BackButton({
  fallback = "/",
  tone = "glass",
}: {
  fallback?: string;
  tone?: "glass" | "onMedia";
}) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      aria-label="Retour"
      className={
        tone === "onMedia"
          ? "grid h-11 w-11 place-items-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-90"
          : "grid h-11 w-11 place-items-center rounded-full glass text-fg/70 transition active:scale-90"
      }
    >
      <ChevronLeft size={19} />
    </button>
  );
}

/** Entête simple des pages secondaires : retour, titre, action à droite. */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-5 flex items-center gap-3">
      <BackButton />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[24px] font-semibold">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 truncate text-[12.5px] text-fg/45">{subtitle}</p>
        )}
      </div>
      {action}
    </header>
  );
}
