/** Espace fine insécable entre les milliers, comme on écrit les prix ici. */
export function fcfa(amount: number, withSuffix = true): string {
  const n = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return withSuffix ? `${n} FCFA` : n;
}

/** 214 000 -> "214 k", 1 240 000 -> "1,2 M" */
export function compact(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v >= 10 ? Math.round(v) : v.toFixed(1).replace(".", ",")} M`;
  }
  if (n >= 1_000) return `${Math.round(n / 1000)} k`;
  return String(n);
}

export function duration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** "il y a 3 j", "il y a 2 h" — court, pour le mur des soutiens. */
export function timeAgo(iso: string, now = new Date()) {
  const diff = Math.max(0, now.getTime() - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `il y a ${d} j`;
  return `il y a ${Math.floor(d / 30)} mois`;
}

/** Initiales pour les pochettes et avatars générés. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
