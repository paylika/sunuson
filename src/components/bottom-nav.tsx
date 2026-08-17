"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./ui";
import { Bookmark, Compass, Home, UserIcon } from "./icons";

const items = [
  { href: "/", label: "Accueil", Icon: Home },
  { href: "/decouvrir", label: "Découvrir", Icon: Compass },
  { href: "/playlist", label: "Playlist", Icon: Bookmark },
  { href: "/dashboard", label: "Mon espace", Icon: UserIcon },
];

/**
 * L'onglet actif reçoit une tuile pleine, l'inactif garde son glyphe nu.
 * C'est le contraste entre les deux qui indique où l'on est — un simple
 * changement de teinte se voit mal sur un écran de téléphone en plein jour.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] px-4 pb-4">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-bg via-bg/85 to-transparent" />

      <div className="glass-strong flex items-center gap-1 rounded-[26px] p-1.5">
        {items.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-1.5 py-1.5"
            >
              <span
                className={cx(
                  "grid h-10 w-full place-items-center rounded-2xl transition",
                  active ? "grad-brand text-ink" : "text-fg/40",
                )}
              >
                <Icon size={20} />
              </span>
              <span
                className={cx(
                  "text-[9.5px] font-bold leading-none tracking-tight transition",
                  active ? "text-fg" : "text-fg/40",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
