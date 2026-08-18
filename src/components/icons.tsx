type P = { className?: string; size?: number };

/**
 * Deux familles, et le contraste entre elles est ce qui les fait exister.
 *
 * 1. PLEINES — les icônes qui portent du sens. Silhouettes épaisses, trous
 *    réellement évidés (fill-rule evenodd) : le fond passe au travers, donc
 *    elles restent justes aussi bien sur le noir que posées dans un bouton
 *    acide. Chacune fusionne un objet de la musique avec un second signe qui
 *    appartient au produit — c'est ce qui les empêche d'être génériques.
 *
 * 2. TRAIT — les utilitaires : flèches, croix, coche, copier. Si tout devenait
 *    volumétrique, plus rien ne ressortirait et l'application ressemblerait à
 *    un écran de réglages.
 *
 * Toutes utilisent currentColor : la couleur est décidée par le contexte.
 */

/* ============================================================== pleines */

const solid = (size = 20) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "currentColor",
});

/** Accueil — le disque dont le trou central devient un bouton lecture. */
export const Home = ({ className, size }: P) => (
  <svg {...solid(size)} className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2.8a9.2 9.2 0 1 0 0 18.4 9.2 9.2 0 0 0 0-18.4Zm0 5.9a3.3 3.3 0 1 1 0 6.6 3.3 3.3 0 0 1 0-6.6Z"
    />
    <path d="M11.1 10.7c0-.36.4-.58.71-.39l1.8 1.13c.29.18.29.6 0 .78l-1.8 1.13c-.31.19-.71-.03-.71-.39v-2.26Z" />
  </svg>
);

/** Découvrir — la loupe dont la lentille est un disque. */
export const Compass = ({ className, size }: P) => (
  <svg {...solid(size)} className={className}>
    <path
      d="M15.6 15.6 20.2 20.2"
      stroke="currentColor"
      strokeWidth="3.1"
      strokeLinecap="round"
      fill="none"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.4 3.3a7.1 7.1 0 1 0 0 14.2 7.1 7.1 0 0 0 0-14.2Zm0 4.9a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Z"
    />
  </svg>
);

/** Playlist — le signet qui contient une onde. */
export const Bookmark = ({ className, size }: P) => (
  <svg {...solid(size)} className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.8 2.6A2.2 2.2 0 0 0 5.6 4.8v15.5c0 .74.83 1.18 1.44.76L12 17.7l4.96 3.36c.61.42 1.44-.02 1.44-.76V4.8a2.2 2.2 0 0 0-2.2-2.2H7.8Zm.8 6.2c0-.5.4-.9.9-.9s.9.4.9.9v3.8a.9.9 0 1 1-1.8 0V8.8Zm2.5-2a.9.9 0 0 1 1.8 0v7.6a.9.9 0 0 1-1.8 0V6.8Zm3.4 2.7a.9.9 0 0 1 1.8 0V12a.9.9 0 0 1-1.8 0V9.5Z"
    />
  </svg>
);

/** Même dessin, l'état enregistré se lit à la couleur, pas à la forme. */
export const BookmarkFilled = Bookmark;

/** Mon espace — le micro. */
export const UserIcon = ({ className, size }: P) => (
  <svg {...solid(size)} className={className}>
    <rect x="8.9" y="2.2" width="6.2" height="11.2" rx="3.1" />
    <path
      d="M6.2 11.5a5.8 5.8 0 0 0 11.6 0M12 17.5v4"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

/** Soutenir — la pièce traversée par la musique. Le glyphe signature. */
export const Spark = ({ className, size }: P) => (
  <svg {...solid(size)} className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2.8a9.2 9.2 0 1 0 0 18.4 9.2 9.2 0 0 0 0-18.4ZM7.5 10.9c0-.5.4-.9.9-.9s.9.4.9.9v2.2a.9.9 0 1 1-1.8 0v-2.2Zm2.7-3.3a.9.9 0 0 1 1.8 0v8.8a.9.9 0 0 1-1.8 0V7.6Zm2.7 1.9a.9.9 0 0 1 1.8 0v5a.9.9 0 0 1-1.8 0v-5Z"
    />
  </svg>
);

/** Inédit — le cadenas. */
export const Lock = ({ className, size }: P) => (
  <svg {...solid(size)} className={className}>
    <path
      d="M8.2 9.6V7.7a3.8 3.8 0 0 1 7.6 0v1.9"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      fill="none"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 9.6a3.4 3.4 0 0 0-3.4 3.4v4.6A3.4 3.4 0 0 0 8 21h8a3.4 3.4 0 0 0 3.4-3.4V13A3.4 3.4 0 0 0 16 9.6H8Zm4 2.6a1.9 1.9 0 0 0-.9 3.57v1.53a.9.9 0 0 0 1.8 0v-1.53A1.9 1.9 0 0 0 12 12.2Z"
    />
  </svg>
);

/** Ça monte — sert à marquer les artistes en progression. */
export const Flame = ({ className, size }: P) => (
  <svg {...solid(size)} className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13.2 2.3c.42-.36 1.06-.06 1.06.49 0 2.06.85 3.42 1.96 4.62 1.3 1.4 2.98 2.9 2.98 5.87A7.2 7.2 0 0 1 12 21.9a7.2 7.2 0 0 1-7.2-7.2c0-2.3 1.03-3.9 2.05-5.1.3-.36.88-.2.96.26.13.72.4 1.35.86 1.77.5-3.9 2.6-6.9 4.53-9.33Zm-.9 10.9c.3-.28.79-.1.87.3.13.6.4 1.06.78 1.44.55.55 1.2 1.2 1.2 2.44A3.15 3.15 0 0 1 12 20.5a3.15 3.15 0 0 1-3.15-3.12c0-1.6 1.15-2.6 2.16-3.4.5-.4.96-.62 1.29-.78Z"
    />
  </svg>
);

/** Lecture et pause — épaisses, coins arrondis, jamais un triangle sec. */
export const Play = ({ className, size }: P) => (
  <svg {...solid(size)} className={className}>
    <path d="M7.6 5.3c0-1.02 1.13-1.63 1.98-1.07l9.5 6.26a1.28 1.28 0 0 1 0 2.14l-9.5 6.26c-.85.56-1.98-.05-1.98-1.07V5.3Z" />
  </svg>
);

export const Pause = ({ className, size }: P) => (
  <svg {...solid(size)} className={className}>
    <rect x="6.2" y="4.4" width="4.3" height="15.2" rx="2.15" />
    <rect x="13.5" y="4.4" width="4.3" height="15.2" rx="2.15" />
  </svg>
);

export const SkipBack = ({ className, size }: P) => (
  <svg {...solid(size)} className={className}>
    <rect x="5.6" y="4.6" width="2.8" height="14.8" rx="1.4" />
    <path d="M18.6 5.5c.85-.56 1.98.05 1.98 1.07v10.86c0 1.02-1.13 1.63-1.98 1.07l-8.2-5.43a1.28 1.28 0 0 1 0-2.14l8.2-5.43Z" />
  </svg>
);

export const SkipForward = ({ className, size }: P) => (
  <svg {...solid(size)} className={className}>
    <rect x="15.6" y="4.6" width="2.8" height="14.8" rx="1.4" />
    <path d="M5.4 5.5c-.85-.56-1.98.05-1.98 1.07v10.86c0 1.02 1.13 1.63 1.98 1.07l8.2-5.43a1.28 1.28 0 0 0 0-2.14L5.4 5.5Z" />
  </svg>
);

export const Music = ({ className, size }: P) => (
  <svg {...solid(size)} className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M19.4 2.6c.5-.1.96.28.96.79v11.4a3.3 3.3 0 1 1-1.8-2.94V6.9l-8.2 1.7v8.8a3.3 3.3 0 1 1-1.8-2.94V6.4c0-.38.27-.71.64-.79l10.2-3Z"
    />
  </svg>
);

/* =============================================================== trait */

const line = (size = 20) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const Search = ({ className, size }: P) => (
  <svg {...line(size)} className={className}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </svg>
);

export const Bell = ({ className, size }: P) => (
  <svg {...line(size)} className={className}>
    <path d="M6.5 9.8a5.5 5.5 0 0 1 11 0c0 4 1.5 5.2 1.5 5.2h-14s1.5-1.2 1.5-5.2Z" />
    <path d="M10.2 18.4a2 2 0 0 0 3.6 0" />
  </svg>
);

export const ChevronLeft = ({ className, size }: P) => (
  <svg {...line(size)} className={className}>
    <path d="m14 6-6 6 6 6" />
  </svg>
);

export const ChevronRight = ({ className, size }: P) => (
  <svg {...line(size)} className={className}>
    <path d="m10 6 6 6-6 6" />
  </svg>
);

export const Check = ({ className, size }: P) => (
  <svg {...line(size)} className={className} strokeWidth={2.2}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const Copy = ({ className, size }: P) => (
  <svg {...line(size)} className={className}>
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M15 6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15" />
  </svg>
);

export const Upload = ({ className, size }: P) => (
  <svg {...line(size)} className={className}>
    <path d="M12 16V4.5" />
    <path d="m7.5 9 4.5-4.5L16.5 9" />
    <path d="M4.5 15v3A2.5 2.5 0 0 0 7 20.5h10a2.5 2.5 0 0 0 2.5-2.5v-3" />
  </svg>
);

export const Wallet = ({ className, size }: P) => (
  <svg {...line(size)} className={className}>
    <path d="M3.5 8.5A2.5 2.5 0 0 1 6 6h11.5A2.5 2.5 0 0 1 20 8.5v9a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5v-9Z" />
    <path d="M15.5 13.2h2.2" />
  </svg>
);

export const Share = ({ className, size }: P) => (
  <svg {...line(size)} className={className}>
    <path d="M12 15V4.5" />
    <path d="m8 8 4-3.5L16 8" />
    <path d="M5 14v4a2.5 2.5 0 0 0 2.5 2.5h9A2.5 2.5 0 0 0 19 18v-4" />
  </svg>
);

export const Plus = ({ className, size }: P) => (
  <svg {...line(size)} className={className} strokeWidth={2.2}>
    <path d="M12 5.5v13M5.5 12h13" />
  </svg>
);

export const Close = ({ className, size }: P) => (
  <svg {...line(size)} className={className} strokeWidth={2.1}>
    <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
  </svg>
);

export const ArrowUpRight = ({ className, size }: P) => (
  <svg {...line(size)} className={className}>
    <path d="M7.5 16.5 16.5 7.5" />
    <path d="M9 7.5h7.5V15" />
  </svg>
);

export const Repeat = ({ className, size }: P) => (
  <svg {...line(size)} className={className}>
    <path d="M4.5 11.5V10a3.5 3.5 0 0 1 3.5-3.5h11" />
    <path d="m16 3.5 3 3-3 3" />
    <path d="M19.5 12.5V14a3.5 3.5 0 0 1-3.5 3.5H5" />
    <path d="m8 20.5-3-3 3-3" />
  </svg>
);

export const RepeatOne = ({ className, size }: P) => (
  <svg {...line(size)} className={className}>
    <path d="M4.5 11.5V10a3.5 3.5 0 0 1 3.5-3.5h11" />
    <path d="m16 3.5 3 3-3 3" />
    <path d="M19.5 12.5V14a3.5 3.5 0 0 1-3.5 3.5H5" />
    <path d="m8 20.5-3-3 3-3" />
    <path d="M11.6 9.6 13 8.8v5" strokeWidth={2.1} />
  </svg>
);

/** Appareil photo — utilitaire, donc en trait comme les autres outils. */
export const Camera = ({ className, size }: P) => (
  <svg {...line(size)} className={className}>
    <path d="M3.4 8.9a2 2 0 0 1 2-2h1.9l1.3-2.1h6.8l1.3 2.1h1.9a2 2 0 0 1 2 2v8.2a2 2 0 0 1-2 2H5.4a2 2 0 0 1-2-2V8.9Z" />
    <circle cx="12" cy="13" r="3.4" />
  </svg>
);

/**
 * Réglages — la tranche d'une console de mixage, pas un engrenage.
 *
 * L'engrenage est le glyphe le plus générique qui existe et n'appartient à
 * aucun univers. Trois faders à des hauteurs différentes disent la même chose
 * — « ici on règle » — dans le vocabulaire du studio, et se lisent au premier
 * coup d'œil parce que les curseurs ne sont pas alignés.
 */
export const Sliders = ({ className, size }: P) => (
  <svg {...line(size)} className={className}>
    <path d="M6 3.4v4.2M6 12.9V20.6M12 3.4v9.1M12 17.8v2.8M18 3.4v2.6M18 11.3v9.3" />
    <circle cx="6" cy="10.2" r="2.6" />
    <circle cx="12" cy="15.2" r="2.6" />
    <circle cx="18" cy="8.6" r="2.6" />
  </svg>
);

/** Déconnexion — la porte et la flèche qui en sort. */
export const LogOut = ({ className, size }: P) => (
  <svg {...line(size)} className={className}>
    <path d="M14.5 3.5h2A3 3 0 0 1 19.5 6.5v11a3 3 0 0 1-3 3h-2" />
    <path d="M10.5 8 6.5 12l4 4" />
    <path d="M6.5 12h8" />
  </svg>
);

/** Badge de vérification : la coche est évidée pour laisser passer le fond. */
export const Verified = ({ className, size = 16 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      d="m12 2 2.4 1.9 3-.3 1 2.9 2.6 1.6-1 2.9 1 2.9-2.6 1.6-1 2.9-3-.3L12 22l-2.4-1.9-3 .3-1-2.9L3 15.9l1-2.9-1-2.9 2.6-1.6 1-2.9 3 .3L12 2Zm3.9 7.05a.9.9 0 0 0-1.3-1.25l-3.9 4.05-1.55-1.5a.9.9 0 1 0-1.25 1.3l2.2 2.12a.9.9 0 0 0 1.28-.02l4.52-4.7Z"
    />
  </svg>
);
