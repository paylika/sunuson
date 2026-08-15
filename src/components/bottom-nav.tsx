"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./ui";
import { Compass, Home, UserIcon } from "./icons";

const items = [
  { href: "/", label: "Accueil", Icon: Home },
  { href: "/decouvrir", label: "Découvrir", Icon: Compass },
  { href: "/dashboard", label: "Espace artiste", Icon: UserIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] px-4 pb-4 pt-2">
      <div className="glass-strong sheen flex items-center justify-around rounded-full px-2 py-2">
        {items.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cx(
                "grid h-12 w-12 place-items-center rounded-full transition",
                active
                  ? "grad-brand text-white shadow-[0_8px_26px_-10px_rgba(224,78,200,.9)]"
                  : "text-fg/45 hover:text-fg/80",
              )}
            >
              <Icon size={21} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
