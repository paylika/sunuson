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
 * Trois onglets, chacun avec son libellé. Les icônes seules obligeaient à
 * deviner où on allait — sur un produit que les gens découvrent par un lien
 * partagé, deviner c'est partir.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] px-4 pb-4">
      {/* Fondu vers le fond : la nav ne coupe plus le contenu net. */}
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
              className={cx(
                "flex flex-1 flex-col items-center gap-1 rounded-[20px] py-2.5 transition",
                active
                  ? "grad-brand text-ink glow-brand"
                  : "text-fg/45 active:scale-95",
              )}
            >
              <Icon size={19} />
              <span className="text-[9.5px] font-semibold leading-none tracking-tight">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
