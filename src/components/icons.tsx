type P = { className?: string; size?: number };

const base = (size = 20) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const Play = ({ className, size }: P) => (
  <svg {...base(size)} className={className} fill="currentColor" stroke="none">
    <path d="M7.5 5.6c0-.9 1-1.4 1.7-.9l8.2 5.5c.7.4.7 1.4 0 1.9l-8.2 5.5c-.8.5-1.7 0-1.7-.9V5.6Z" />
  </svg>
);

export const Pause = ({ className, size }: P) => (
  <svg {...base(size)} className={className} fill="currentColor" stroke="none">
    <rect x="6.5" y="5" width="4" height="14" rx="1.4" />
    <rect x="13.5" y="5" width="4" height="14" rx="1.4" />
  </svg>
);

export const Spark = ({ className, size }: P) => (
  <svg {...base(size)} className={className} fill="currentColor" stroke="none">
    <path d="M12 2.6c.3 0 .6.2.7.5l1.6 4.4a3 3 0 0 0 1.8 1.8l4.4 1.6c.6.2.6 1.1 0 1.3l-4.4 1.6a3 3 0 0 0-1.8 1.8l-1.6 4.4c-.2.6-1.1.6-1.3 0l-1.6-4.4a3 3 0 0 0-1.8-1.8l-4.4-1.6c-.6-.2-.6-1.1 0-1.3l4.4-1.6a3 3 0 0 0 1.8-1.8l1.6-4.4c.1-.3.4-.5.6-.5Z" />
  </svg>
);

export const Home = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3.5 10.6 12 4l8.5 6.6V19a1.5 1.5 0 0 1-1.5 1.5h-4v-5.5h-6V20.5H5A1.5 1.5 0 0 1 3.5 19v-8.4Z" />
  </svg>
);

export const Search = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </svg>
);

export const Compass = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m15.2 8.8-1.7 4.7-4.7 1.7 1.7-4.7 4.7-1.7Z" />
  </svg>
);

export const UserIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6" />
  </svg>
);

export const Bell = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M6.5 9.8a5.5 5.5 0 0 1 11 0c0 4 1.5 5.2 1.5 5.2h-14s1.5-1.2 1.5-5.2Z" />
    <path d="M10.2 18.4a2 2 0 0 0 3.6 0" />
  </svg>
);

export const ChevronLeft = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="m14 6-6 6 6 6" />
  </svg>
);

export const ChevronRight = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="m10 6 6 6-6 6" />
  </svg>
);

export const Check = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const Copy = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M15 6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15" />
  </svg>
);

export const Upload = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 16V4.5" />
    <path d="m7.5 9 4.5-4.5L16.5 9" />
    <path d="M4.5 15v3A2.5 2.5 0 0 0 7 20.5h10a2.5 2.5 0 0 0 2.5-2.5v-3" />
  </svg>
);

export const Lock = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2.6" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </svg>
);

export const Wallet = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3.5 8.5A2.5 2.5 0 0 1 6 6h11.5A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20H6a2.5 2.5 0 0 1-2.5-2.5v-9Z" />
    <path d="M15.5 13.2h2.2" />
  </svg>
);

export const Share = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 15V4.5" />
    <path d="m8 8 4-3.5L16 8" />
    <path d="M5 14v4a2.5 2.5 0 0 0 2.5 2.5h9A2.5 2.5 0 0 0 19 18v-4" />
  </svg>
);

export const Plus = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 5.5v13M5.5 12h13" />
  </svg>
);

export const Close = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
  </svg>
);

export const Verified = ({ className, size = 16 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path
      fill="currentColor"
      d="m12 2 2.4 1.9 3-.3 1 2.9 2.6 1.6-1 2.9 1 2.9-2.6 1.6-1 2.9-3-.3L12 22l-2.4-1.9-3 .3-1-2.9L3 15.9l1-2.9-1-2.9 2.6-1.6 1-2.9 3 .3L12 2Z"
    />
    <path
      d="m8.4 12.2 2.5 2.5 4.7-5"
      stroke="#fff"
      strokeWidth="2.1"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Music = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M9 18V6.2l10-2v11.6" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="16.5" cy="15.8" r="2.5" />
  </svg>
);

export const Bookmark = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M6.5 5.5A1.5 1.5 0 0 1 8 4h8a1.5 1.5 0 0 1 1.5 1.5V20l-5.5-3.4L6.5 20V5.5Z" />
  </svg>
);

export const BookmarkFilled = ({ className, size }: P) => (
  <svg {...base(size)} className={className} fill="currentColor" stroke="none">
    <path d="M6.5 5.5A1.5 1.5 0 0 1 8 4h8a1.5 1.5 0 0 1 1.5 1.5V20l-5.5-3.4L6.5 20V5.5Z" />
  </svg>
);

export const ArrowUpRight = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M7.5 16.5 16.5 7.5" />
    <path d="M9 7.5h7.5V15" />
  </svg>
);
