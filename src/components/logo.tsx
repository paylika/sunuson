/**
 * La marque : une forme d'onde qui se redresse en A.
 *
 * Redessinée en tracé plutôt qu'importée en image — elle reste nette à toute
 * taille, pèse quelques octets, et prend la couleur du contexte. C'est aussi
 * ce même tracé qui sert de favicon.
 *
 * Le dessin dit ce que fait le produit : l'écoute (l'onde, à gauche, basse)
 * devient de l'amplification (le pic, au centre).
 */

export function Mark({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Amplifan"
    >
      <path
        d="M13 84 L18.5 55 L24 80 L29 67 L34.5 87 L50 19 L67 83"
        fill="none"
        stroke="currentColor"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* La barre du A, détachée : elle équilibre la masse à droite. */}
      <path
        d="M63 80 L84 74"
        stroke="currentColor"
        strokeWidth="13"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Marque posée sur la tuile acide, comme sur l'icône de l'application. */
export function MarkTile({
  className,
  size = 44,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-[28%] bg-acid-500 text-ink ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <Mark size={size * 0.66} />
    </span>
  );
}

/** Marque + nom, pour les entêtes. */
export function Wordmark({
  size = 26,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <Mark size={size} className="text-acid-500" />
      <span
        className="font-extrabold tracking-[-.03em]"
        style={{ fontSize: size * 0.92 }}
      >
        mplifan
      </span>
    </span>
  );
}
