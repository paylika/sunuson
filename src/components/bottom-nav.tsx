"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./ui";
import { Bookmark, Compass, Plus, UserIcon } from "./icons";

/**
 * La barre s'adapte à qui la regarde.
 *
 * Un fan a trois besoins : trouver, retrouver ses sons, son compte. Un
 * artiste en a un quatrième, et c'est celui qui fait vivre la plateforme :
 * publier. Il était jusqu'ici enterré derrière « ouvrir l'atelier, faire
 * défiler, trouver le bouton » — il est maintenant à un pouce.
 *
 * Personne ne voit la barre de l'autre, donc personne n'est surpris par ce
 * qui change.
 *
 * L'accueil a disparu : il montrait des listes d'artistes que Découvrir
 * montrait déjà, et supposait qu'on ouvre l'application pour la parcourir.
 * Les fans arrivent par le lien d'un artiste, jamais par une page d'accueil.
 */
type Item = {
  href: string;
  label: string;
  Icon: (p: { size?: number; className?: string }) => React.ReactElement;
  /** Un geste, pas un lieu : jamais marqué « actif », toujours en tuile. */
  action?: boolean;
};

const BASE: Item[] = [
  { href: "/", label: "Découvrir", Icon: Compass },
  { href: "/playlist", label: "Playlist", Icon: Bookmark },
  { href: "/dashboard", label: "Moi", Icon: UserIcon },
];

const PUBLIER: Item = {
  href: "/dashboard?publier=1",
  label: "Publier",
  Icon: Plus,
  action: true,
};

export function BottomNav({ estArtiste = false }: { estArtiste?: boolean }) {
  const pathname = usePathname();
  const items = estArtiste ? [...BASE, PUBLIER] : BASE;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] px-4 pb-4">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-bg via-bg/85 to-transparent" />

      <div className="glass-strong flex items-center gap-1 rounded-[26px] p-1.5">
        {items.map((item) => {
          const action = item.action === true;
          const active =
            !action &&
            (item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-1.5 py-1.5"
            >
              <span
                className={cx(
                  "grid h-10 w-full place-items-center rounded-2xl transition",
                  // L'onglet actif reçoit une tuile pleine, l'inactif garde son
                  // glyphe nu : sur un écran de téléphone en plein jour, un
                  // simple changement de teinte ne se voit pas. Publier porte
                  // la même tuile en permanence — c'est ce qui le désigne comme
                  // un geste plutôt qu'un lieu.
                  active || action ? "grad-brand text-ink" : "text-fg/40",
                )}
              >
                <item.Icon size={20} />
              </span>
              <span
                className={cx(
                  "text-[9.5px] font-bold leading-none tracking-tight transition",
                  active || action ? "text-fg" : "text-fg/40",
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
