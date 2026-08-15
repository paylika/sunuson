import type { Artist, Clip, Support, Track } from "./types";

/**
 * Données de démonstration. Artistes fictifs.
 * Structure identique aux tables Supabase : au branchement, on remplace le
 * contenu de ce fichier par des requêtes, les composants ne bougent pas.
 */

export const artists: Artist[] = [
  {
    id: "a1",
    slug: "ndiagaflow",
    name: "Ndiaga Flow",
    city: "Pikine",
    bio: "Rap conscient, prod maison. Deux projets sortis, tout en indé. Le troisième arrive.",
    gradient: ["#e04ec8", "#5b21b6"],
    verified: true,
    monthlyListeners: 41200,
  },
  {
    id: "a2",
    slug: "maladee",
    name: "Mala Dee",
    city: "Guédiawaye",
    bio: "Drill sénégalaise. Wolof, français, un peu d'anglais quand ça sert.",
    gradient: ["#f472e0", "#7c3aed"],
    verified: false,
    monthlyListeners: 18600,
  },
  {
    id: "a3",
    slug: "sistakine",
    name: "Sista Kiné",
    city: "Médina",
    bio: "Plume tranchante, flow posé. Elle écrit tout, elle ne signe rien.",
    gradient: ["#fbd24e", "#a855f7"],
    verified: true,
    monthlyListeners: 27400,
  },
  {
    id: "a4",
    slug: "bayeloops",
    name: "Baye Loops",
    city: "Thiès",
    bio: "Beatmaker devenu rappeur. Sample sabar, kick lourd.",
    gradient: ["#22d3ee", "#7c3aed"],
    verified: false,
    monthlyListeners: 9800,
  },
  {
    id: "a5",
    slug: "xamsa",
    name: "Xamsa",
    city: "Parcelles Assainies",
    bio: "Freestyle tous les vendredis. La communauté suit depuis 2023.",
    gradient: ["#fb7185", "#6d28d9"],
    verified: false,
    monthlyListeners: 12300,
  },
];

export const tracks: Track[] = [
  // Ndiaga Flow
  { id: "t1", artistId: "a1", title: "Wax Sa Dëgg", duration: 214, plays: 128400, releasedAt: "2026-05-02", locked: false },
  { id: "t2", artistId: "a1", title: "Pikine By Night", duration: 187, plays: 96200, releasedAt: "2026-05-02", locked: false, featuring: "Mala Dee" },
  { id: "t3", artistId: "a1", title: "Sunu Yoon", duration: 241, plays: 74800, releasedAt: "2026-03-18", locked: false },
  { id: "t4", artistId: "a1", title: "Bantamba", duration: 176, plays: 51900, releasedAt: "2026-03-18", locked: false },
  { id: "t5", artistId: "a1", title: "Dara Doul Dara — inédit", duration: 203, plays: 0, releasedAt: "2026-08-14", locked: true },
  { id: "t6", artistId: "a1", title: "Freestyle #12 — version longue", duration: 288, plays: 0, releasedAt: "2026-08-10", locked: true },

  // Mala Dee
  { id: "t7", artistId: "a2", title: "Gëdd", duration: 168, plays: 62100, releasedAt: "2026-06-20", locked: false },
  { id: "t8", artistId: "a2", title: "Nuit Blanche à GD", duration: 195, plays: 44300, releasedAt: "2026-06-20", locked: false },
  { id: "t9", artistId: "a2", title: "Chargeur", duration: 152, plays: 31700, releasedAt: "2026-04-11", locked: false },
  { id: "t10", artistId: "a2", title: "Gëdd — remix inédit", duration: 181, plays: 0, releasedAt: "2026-08-12", locked: true },

  // Sista Kiné
  { id: "t11", artistId: "a3", title: "Jigéen Ju Am Doole", duration: 226, plays: 88700, releasedAt: "2026-07-04", locked: false },
  { id: "t12", artistId: "a3", title: "Médina 2h du mat", duration: 199, plays: 53200, releasedAt: "2026-07-04", locked: false },
  { id: "t13", artistId: "a3", title: "Lettre à ma mère", duration: 254, plays: 47600, releasedAt: "2026-02-27", locked: false },
  { id: "t14", artistId: "a3", title: "Couplet coupé au mix", duration: 132, plays: 0, releasedAt: "2026-08-09", locked: true },

  // Baye Loops
  { id: "t15", artistId: "a4", title: "Sabar Trap", duration: 172, plays: 29400, releasedAt: "2026-06-01", locked: false },
  { id: "t16", artistId: "a4", title: "Thiès–Dakar", duration: 208, plays: 21100, releasedAt: "2026-06-01", locked: false },
  { id: "t17", artistId: "a4", title: "Pack de prods — 5 instrus", duration: 240, plays: 0, releasedAt: "2026-08-05", locked: true },

  // Xamsa
  { id: "t18", artistId: "a5", title: "Vendredi 21h", duration: 163, plays: 38900, releasedAt: "2026-07-25", locked: false },
  { id: "t19", artistId: "a5", title: "Parcelles U16", duration: 185, plays: 26500, releasedAt: "2026-05-30", locked: false },
  { id: "t20", artistId: "a5", title: "Freestyle non diffusé", duration: 221, plays: 0, releasedAt: "2026-08-13", locked: true },
];

export const clips: Clip[] = [
  { id: "c1", artistId: "a1", title: "Wax Sa Dëgg — Clip officiel", youtubeId: "dQw4w9WgXcQ", views: 412000 },
  { id: "c2", artistId: "a1", title: "Pikine By Night", youtubeId: "dQw4w9WgXcQ", views: 187000 },
  { id: "c3", artistId: "a2", title: "Gëdd — Clip officiel", youtubeId: "dQw4w9WgXcQ", views: 96000 },
  { id: "c4", artistId: "a3", title: "Jigéen Ju Am Doole", youtubeId: "dQw4w9WgXcQ", views: 233000 },
  { id: "c5", artistId: "a5", title: "Vendredi 21h — live", youtubeId: "dQw4w9WgXcQ", views: 58000 },
];

export const seedSupports: Support[] = [
  { id: "s1", artistId: "a1", supporterName: "Modou D.", amount: 25000, message: "Le projet est trop propre frère 🔥", method: "wave", createdAt: "2026-08-14T19:20:00Z" },
  { id: "s2", artistId: "a1", supporterName: "Astou Ndiaye", amount: 10000, message: "Depuis le premier son je suis là", method: "wave", createdAt: "2026-08-14T09:05:00Z" },
  { id: "s3", artistId: "a1", supporterName: "Alioune Badara", amount: 10000, method: "orange_money", createdAt: "2026-08-13T22:40:00Z" },
  { id: "s4", artistId: "a1", supporterName: "Fatou N.", amount: 5000, message: "Bantamba en boucle", method: "wave", createdAt: "2026-08-13T14:12:00Z" },
  { id: "s5", artistId: "a1", supporterName: "Cheikh S.", amount: 5000, method: "wave", createdAt: "2026-08-12T18:55:00Z" },
  { id: "s6", artistId: "a1", supporterName: "Anonyme", amount: 2000, method: "orange_money", createdAt: "2026-08-12T11:30:00Z" },
  { id: "s7", artistId: "a1", supporterName: "Pape Malick", amount: 2000, message: "Sors le clip stp", method: "wave", createdAt: "2026-08-11T20:02:00Z" },
  { id: "s8", artistId: "a1", supporterName: "Aida B.", amount: 1000, method: "wave", createdAt: "2026-08-11T08:44:00Z" },
  { id: "s9", artistId: "a1", supporterName: "Ibou", amount: 1000, method: "orange_money", createdAt: "2026-08-10T23:15:00Z" },
  { id: "s10", artistId: "a1", supporterName: "Ndeye Coumba", amount: 500, message: "Force à toi", method: "wave", createdAt: "2026-08-10T16:00:00Z" },

  { id: "s11", artistId: "a2", supporterName: "Serigne F.", amount: 10000, message: "La drill sénégalaise c'est toi", method: "wave", createdAt: "2026-08-14T21:10:00Z" },
  { id: "s12", artistId: "a2", supporterName: "Khadija", amount: 5000, method: "wave", createdAt: "2026-08-13T17:25:00Z" },
  { id: "s13", artistId: "a2", supporterName: "Mouhamed L.", amount: 2000, method: "orange_money", createdAt: "2026-08-12T13:48:00Z" },
  { id: "s14", artistId: "a2", supporterName: "Anonyme", amount: 1000, method: "wave", createdAt: "2026-08-11T10:30:00Z" },

  { id: "s15", artistId: "a3", supporterName: "Bineta S.", amount: 20000, message: "Lettre à ma mère m'a fait pleurer", method: "wave", createdAt: "2026-08-14T15:35:00Z" },
  { id: "s16", artistId: "a3", supporterName: "Ousmane K.", amount: 10000, method: "wave", createdAt: "2026-08-13T09:20:00Z" },
  { id: "s17", artistId: "a3", supporterName: "Mariama", amount: 5000, message: "Respect 🙏", method: "orange_money", createdAt: "2026-08-12T19:05:00Z" },
  { id: "s18", artistId: "a3", supporterName: "Lamine D.", amount: 2000, method: "wave", createdAt: "2026-08-11T12:00:00Z" },

  { id: "s19", artistId: "a4", supporterName: "Samba", amount: 5000, message: "Le pack de prods vaut le coup", method: "wave", createdAt: "2026-08-13T20:15:00Z" },
  { id: "s20", artistId: "a4", supporterName: "Anonyme", amount: 2000, method: "wave", createdAt: "2026-08-12T08:10:00Z" },

  { id: "s21", artistId: "a5", supporterName: "Adama T.", amount: 10000, message: "Vendredi 21h jamais raté", method: "wave", createdAt: "2026-08-14T22:45:00Z" },
  { id: "s22", artistId: "a5", supporterName: "Rokhaya", amount: 2000, method: "orange_money", createdAt: "2026-08-13T16:30:00Z" },
  { id: "s23", artistId: "a5", supporterName: "Babacar N.", amount: 1000, method: "wave", createdAt: "2026-08-12T21:00:00Z" },
];

/* ------------------------------------------------------------ sélecteurs */

export function getArtistBySlug(slug: string): Artist | undefined {
  return artists.find((a) => a.slug === slug);
}

export function getTracksByArtist(artistId: string): Track[] {
  return tracks.filter((t) => t.artistId === artistId);
}

export function getClipsByArtist(artistId: string): Clip[] {
  return clips.filter((c) => c.artistId === artistId);
}

/** L'artiste connecté dans la démo du dashboard. */
export const CURRENT_ARTIST_ID = "a1";
