import Link from "next/link";
import type { ReactNode } from "react";
import { initials } from "@/lib/format";
import { Verified } from "./icons";

export function cx(...v: (string | false | null | undefined)[]) {
  return v.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ carte */

export function Glass({
  children,
  className,
  strong,
  sheen = true,
}: {
  children: ReactNode;
  className?: string;
  strong?: boolean;
  sheen?: boolean;
}) {
  return (
    <div
      className={cx(
        strong ? "glass-strong" : "glass",
        sheen && "sheen",
        "rounded-[28px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* --------------------------------------------------------------- pochette */

/**
 * Faute de photos, chaque artiste a un dégradé déterministe : c'est cohérent
 * d'un écran à l'autre et ça ne coûte aucun asset à héberger.
 */
export function Cover({
  gradient,
  src,
  alt = "",
  className,
  rounded = "rounded-[26px]",
}: {
  gradient: [string, string];
  /** Vraie image si elle existe ; sinon le dégradé sert de repli. */
  src?: string;
  alt?: string;
  className?: string;
  rounded?: string;
}) {
  return (
    <div
      className={cx("relative overflow-hidden isolate", rounded, className)}
      style={{
        backgroundImage: `linear-gradient(150deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
      }}
    >
      {src ? (
        // Pas next/image : les URL viennent d'un bucket dont le domaine
        // change avec l'hébergeur, et l'optimiseur ne tourne pas sur Workers.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(60% 50% at 20% 10%, rgba(255,255,255,.45), transparent 60%), radial-gradient(50% 60% at 90% 90%, rgba(0,0,0,.5), transparent 60%)",
          }}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- avatar */

export function Avatar({
  name,
  gradient,
  src,
  size = 44,
  ring,
}: {
  name: string;
  gradient: [string, string];
  /** Photo réelle si elle existe ; sinon les initiales sur dégradé. */
  src?: string;
  size?: number;
  ring?: boolean;
}) {
  return (
    <div
      className={cx(
        // Les initiales sont posées sur un dégradé saturé : elles restent
        // blanches quel que soit le thème de la page.
        "relative shrink-0 rounded-full overflow-hidden grid place-items-center font-semibold text-white/95",
        ring && "ring-2 ring-white/70",
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        backgroundImage: `linear-gradient(150deg, ${gradient[0]}, ${gradient[1]})`,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span className="drop-shadow-sm">{initials(name)}</span>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- texte */

export function NameWithBadge({
  name,
  verified,
  className,
}: {
  name: string;
  verified?: boolean;
  className?: string;
}) {
  return (
    <span className={cx("inline-flex items-center gap-1.5", className)}>
      {name}
      {verified && <Verified className="text-brand-500 shrink-0" size={16} />}
    </span>
  );
}

/* ---------------------------------------------------------------- pilule */

export function Pill({
  children,
  className,
  tone = "glass",
}: {
  children: ReactNode;
  className?: string;
  tone?: "glass" | "brand" | "gold";
}) {
  const tones = {
    glass: "glass text-fg/75",
    brand: "grad-brand text-ink",
    gold: "bg-gold-400/15 text-gold-700 border border-gold-400/25",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium leading-none",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* --------------------------------------------------------------- bouton */

/**
 * Avec `href`, rend un <Link> et non un <button> : imbriquer un bouton dans un
 * lien avale le clic et casse la navigation.
 */
export function Button({
  children,
  onClick,
  href,
  variant = "brand",
  className,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "brand" | "glass" | "ghost";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const variants = {
    brand:
      "grad-brand text-ink shadow-[0_10px_34px_-10px_rgba(224,78,200,.75)] active:scale-[.98]",
    glass: "glass text-fg active:scale-[.98]",
    ghost: "text-fg/70 hover:text-fg",
  };

  const classes = cx(
    "inline-flex items-center justify-center gap-2 rounded-full px-5 h-12 text-[15px] font-semibold transition disabled:opacity-40 disabled:active:scale-100",
    variants[variant],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------ statistique */

export function Stat({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={cx(
          "text-[19px] font-bold tabular-nums",
          accent ? "text-gold-700" : "text-fg",
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[10.5px] font-medium text-fg/40">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------- titre bloc */

export function SectionTitle({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between px-1 mb-3">
      <h2 className="text-[17px] font-semibold tracking-tight">{children}</h2>
      {right}
    </div>
  );
}
