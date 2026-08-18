"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cx } from "./ui";
import { Bookmark, Compass, Plus, Sliders, UserIcon } from "./icons";

/**
 * La barre s'adapte à qui la regarde.
 *
 * Un fan a trois besoins : trouver, retrouver ses sons, son compte. Un artiste
 * en a deux de plus — publier, et régler sa page — parce que c'est lui qui
 * travaille ici. Personne ne voit la barre de l'autre, donc personne n'est
 * surpris par ce qui change.
 *
 * Le fan garde ses réglages derrière l'engrenage de « Moi » : il n'y va qu'une
 * fois, pour choisir son nom et sa photo. L'artiste, lui, y retourne à chaque
 * retrait d'argent.
 *
 * L'accueil a disparu : il montrait des listes d'artistes que Découvrir
 * montrait déjà, et supposait qu'on ouvre l'application pour la parcourir.
 * Les fans arrivent par le lien d'un artiste, jamais par une page d'accueil.
 */
type Item = {
  href: string;
  label: string;
  Icon: (p: { size?: number; className?: string }) => React.ReactElement;
  /** Chemin exact plutôt que préfixe : /dashboard sert à deux onglets. */
  exact?: boolean;
  /** Actif seulement quand ce paramètre vaut 1. */
  parametre?: string;
};

const DECOUVRIR: Item = { href: "/", label: "Découvrir", Icon: Compass, exact: true };
const PLAYLIST: Item = { href: "/playlist", label: "Playlist", Icon: Bookmark };
const MOI: Item = { href: "/dashboard", label: "Moi", Icon: UserIcon, exact: true };

const FAN: Item[] = [DECOUVRIR, PLAYLIST, MOI];

// Publier au centre, pas en bout de barre : c'est le geste qui fait vivre la
// plateforme, et le centre est ce que le pouce atteint sans se déplacer.
const ARTISTE: Item[] = [
  DECOUVRIR,
  PLAYLIST,
  {
    href: "/dashboard?publier=1",
    label: "Publier",
    Icon: Plus,
    parametre: "publier",
  },
  { href: "/parametres", label: "Réglages", Icon: Sliders },
  MOI,
];

export function BottomNav({ estArtiste = false }: { estArtiste?: boolean }) {
  const pathname = usePathname();
  const recherche = useSearchParams();
  const items = estArtiste ? ARTISTE : FAN;

  // Publier mène à /dashboard : sans ce test, « Moi » s'allumerait aussi.
  const enPublication = recherche.get("publier") === "1";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] px-4 pb-4 md:max-w-[560px]">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-bg via-bg/85 to-transparent" />

      <div className="glass-strong flex items-center gap-0.5 rounded-[26px] p-1.5">
        {items.map((item) => {
          const chemin = item.href.split("?")[0];

          const active = item.parametre
            ? enPublication
            : (item.exact ? pathname === chemin : pathname.startsWith(chemin)) &&
              !(chemin === "/dashboard" && enPublication);

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5"
            >
              <span
                className={cx(
                  "grid h-9 w-full place-items-center rounded-2xl transition",
                  // L'onglet actif reçoit une tuile pleine, l'inactif garde son
                  // glyphe nu : sur un écran de téléphone en plein jour, un
                  // simple changement de teinte ne se voit pas. Publier suit
                  // désormais la même règle que les autres — rester allumé en
                  // permanence lui donnait l'air d'être toujours l'écran en
                  // cours.
                  active ? "grad-brand text-ink" : "text-fg/40",
                )}
              >
                <item.Icon size={19} />
              </span>
              <span
                className={cx(
                  "w-full truncate text-center text-[9px] font-bold leading-none tracking-tight transition",
                  active ? "text-fg" : "text-fg/40",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
