/**
 * Insère les données de démonstration. Idempotent : identifiants fixes,
 * upsert sur la clé primaire. À supprimer aux premiers vrais artistes.
 */
import { supabase } from "./db.mjs";

const A = (n) => `a0000000-0000-4000-8000-00000000000${n}`;
const B = (n) => `b0000000-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`;
const C = (n) => `c0000000-0000-4000-8000-00000000000${n}`;
const D = (n) => `d0000000-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`;

const artists = [
  { id: A(1), slug: "ndiagaflow", name: "Ndiaga Flow", city: "Pikine", bio: "Rap conscient, prod maison. Deux projets sortis, tout en indé. Le troisième arrive.", gradient_from: "#3B4048", gradient_to: "#141619", verified: true, monthly_listeners: 41200 },
  { id: A(2), slug: "maladee", name: "Mala Dee", city: "Guédiawaye", bio: "Drill sénégalaise. Wolof, français, un peu d'anglais quand ça sert.", gradient_from: "#463A44", gradient_to: "#17141A", verified: false, monthly_listeners: 18600 },
  { id: A(3), slug: "sistakine", name: "Sista Kiné", city: "Médina", bio: "Plume tranchante, flow posé. Elle écrit tout, elle ne signe rien.", gradient_from: "#474330", gradient_to: "#1A1814", verified: true, monthly_listeners: 27400 },
  { id: A(4), slug: "bayeloops", name: "Baye Loops", city: "Thiès", bio: "Beatmaker devenu rappeur. Sample sabar, kick lourd.", gradient_from: "#31444A", gradient_to: "#14181A", verified: false, monthly_listeners: 9800 },
  { id: A(5), slug: "xamsa", name: "Xamsa", city: "Parcelles Assainies", bio: "Freestyle tous les vendredis. La communauté suit depuis 2023.", gradient_from: "#4A3B36", gradient_to: "#1A1514", verified: false, monthly_listeners: 12300 },
];

const tracks = [
  { id: B(1),  artist_id: A(1), title: "Wax Sa Dëgg",                    duration: 214, plays: 128400, released_at: "2026-05-02", locked: false, featuring: null,       position: 1 },
  { id: B(2),  artist_id: A(1), title: "Pikine By Night",                duration: 187, plays: 96200,  released_at: "2026-05-02", locked: false, featuring: "Mala Dee", position: 2 },
  { id: B(3),  artist_id: A(1), title: "Sunu Yoon",                      duration: 241, plays: 74800,  released_at: "2026-03-18", locked: false, featuring: null,       position: 3 },
  { id: B(4),  artist_id: A(1), title: "Bantamba",                       duration: 176, plays: 51900,  released_at: "2026-03-18", locked: false, featuring: null,       position: 4 },
  { id: B(5),  artist_id: A(1), title: "Dara Doul Dara — inédit",        duration: 203, plays: 0,      released_at: "2026-08-14", locked: true,  featuring: null,       position: 5 },
  { id: B(6),  artist_id: A(1), title: "Freestyle #12 — version longue", duration: 288, plays: 0,      released_at: "2026-08-10", locked: true,  featuring: null,       position: 6 },
  { id: B(7),  artist_id: A(2), title: "Gëdd",                           duration: 168, plays: 62100,  released_at: "2026-06-20", locked: false, featuring: null,       position: 1 },
  { id: B(8),  artist_id: A(2), title: "Nuit Blanche à GD",              duration: 195, plays: 44300,  released_at: "2026-06-20", locked: false, featuring: null,       position: 2 },
  { id: B(9),  artist_id: A(2), title: "Chargeur",                       duration: 152, plays: 31700,  released_at: "2026-04-11", locked: false, featuring: null,       position: 3 },
  { id: B(10), artist_id: A(2), title: "Gëdd — remix inédit",            duration: 181, plays: 0,      released_at: "2026-08-12", locked: true,  featuring: null,       position: 4 },
  { id: B(11), artist_id: A(3), title: "Jigéen Ju Am Doole",             duration: 226, plays: 88700,  released_at: "2026-07-04", locked: false, featuring: null,       position: 1 },
  { id: B(12), artist_id: A(3), title: "Médina 2h du mat",               duration: 199, plays: 53200,  released_at: "2026-07-04", locked: false, featuring: null,       position: 2 },
  { id: B(13), artist_id: A(3), title: "Lettre à ma mère",               duration: 254, plays: 47600,  released_at: "2026-02-27", locked: false, featuring: null,       position: 3 },
  { id: B(14), artist_id: A(3), title: "Couplet coupé au mix",           duration: 132, plays: 0,      released_at: "2026-08-09", locked: true,  featuring: null,       position: 4 },
  { id: B(15), artist_id: A(4), title: "Sabar Trap",                     duration: 172, plays: 29400,  released_at: "2026-06-01", locked: false, featuring: null,       position: 1 },
  { id: B(16), artist_id: A(4), title: "Thiès–Dakar",                    duration: 208, plays: 21100,  released_at: "2026-06-01", locked: false, featuring: null,       position: 2 },
  { id: B(17), artist_id: A(4), title: "Pack de prods — 5 instrus",      duration: 240, plays: 0,      released_at: "2026-08-05", locked: true,  featuring: null,       position: 3 },
  { id: B(18), artist_id: A(5), title: "Vendredi 21h",                   duration: 163, plays: 38900,  released_at: "2026-07-25", locked: false, featuring: null,       position: 1 },
  { id: B(19), artist_id: A(5), title: "Parcelles U16",                  duration: 185, plays: 26500,  released_at: "2026-05-30", locked: false, featuring: null,       position: 2 },
  { id: B(20), artist_id: A(5), title: "Freestyle non diffusé",          duration: 221, plays: 0,      released_at: "2026-08-13", locked: true,  featuring: null,       position: 3 },
];

const clips = [
  { id: C(1), artist_id: A(1), title: "Wax Sa Dëgg — Clip officiel", youtube_id: "dQw4w9WgXcQ", views: 412000 },
  { id: C(2), artist_id: A(1), title: "Pikine By Night",             youtube_id: "dQw4w9WgXcQ", views: 187000 },
  { id: C(3), artist_id: A(2), title: "Gëdd — Clip officiel",        youtube_id: "dQw4w9WgXcQ", views: 96000 },
  { id: C(4), artist_id: A(3), title: "Jigéen Ju Am Doole",          youtube_id: "dQw4w9WgXcQ", views: 233000 },
  { id: C(5), artist_id: A(5), title: "Vendredi 21h — live",         youtube_id: "dQw4w9WgXcQ", views: 58000 },
];

const s = (id, artist, name, amount, message, method, iso) => ({
  id: D(id), artist_id: artist, supporter_name: name, amount, message,
  method, status: "paid", created_at: iso, paid_at: iso,
});

const supports = [
  s(1,  A(1), "Modou D.",       25000, "Le projet est trop propre, respect", "wave",         "2026-08-14T19:20:00Z"),
  s(2,  A(1), "Astou Ndiaye",   10000, "Depuis le premier son je suis là",   "wave",         "2026-08-14T09:05:00Z"),
  s(3,  A(1), "Alioune Badara", 10000, null,                                 "orange_money", "2026-08-13T22:40:00Z"),
  s(4,  A(1), "Fatou N.",        5000, "Bantamba en boucle",                 "wave",         "2026-08-13T14:12:00Z"),
  s(5,  A(1), "Cheikh S.",       5000, null,                                 "wave",         "2026-08-12T18:55:00Z"),
  s(6,  A(1), "Anonyme",         2000, null,                                 "orange_money", "2026-08-12T11:30:00Z"),
  s(7,  A(1), "Pape Malick",     2000, "Sors le clip stp",                   "wave",         "2026-08-11T20:02:00Z"),
  s(8,  A(1), "Aida B.",         1000, null,                                 "wave",         "2026-08-11T08:44:00Z"),
  s(9,  A(1), "Ibou",            1000, null,                                 "orange_money", "2026-08-10T23:15:00Z"),
  s(10, A(1), "Ndeye Coumba",     500, "Force à toi",                        "wave",         "2026-08-10T16:00:00Z"),
  s(11, A(2), "Serigne F.",     10000, "La drill sénégalaise c'est toi",     "wave",         "2026-08-14T21:10:00Z"),
  s(12, A(2), "Khadija",         5000, null,                                 "wave",         "2026-08-13T17:25:00Z"),
  s(13, A(2), "Mouhamed L.",     2000, null,                                 "orange_money", "2026-08-12T13:48:00Z"),
  s(14, A(2), "Anonyme",         1000, null,                                 "wave",         "2026-08-11T10:30:00Z"),
  s(15, A(3), "Bineta S.",      20000, "Lettre à ma mère m'a fait pleurer",  "wave",         "2026-08-14T15:35:00Z"),
  s(16, A(3), "Ousmane K.",     10000, null,                                 "wave",         "2026-08-13T09:20:00Z"),
  s(17, A(3), "Mariama",         5000, "Respect total",                         "orange_money", "2026-08-12T19:05:00Z"),
  s(18, A(3), "Lamine D.",       2000, null,                                 "wave",         "2026-08-11T12:00:00Z"),
  s(19, A(4), "Samba",           5000, "Le pack de prods vaut le coup",      "wave",         "2026-08-13T20:15:00Z"),
  s(20, A(4), "Anonyme",         2000, null,                                 "wave",         "2026-08-12T08:10:00Z"),
  s(21, A(5), "Adama T.",       10000, "Vendredi 21h jamais raté",           "wave",         "2026-08-14T22:45:00Z"),
  s(22, A(5), "Rokhaya",         2000, null,                                 "orange_money", "2026-08-13T16:30:00Z"),
  s(23, A(5), "Babacar N.",      1000, null,                                 "wave",         "2026-08-12T21:00:00Z"),
];

// Ordre imposé par les clés étrangères : les artistes avant tout le reste.
for (const [table, rows] of [
  ["artists", artists],
  ["tracks", tracks],
  ["clips", clips],
  ["supports", supports],
]) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
  if (error) {
    console.error(`\nÉchec sur ${table} : ${error.message}`);
    if (error.message.includes("does not exist")) {
      console.error(
        "→ Colle d'abord supabase/schema.sql dans le SQL Editor du projet.",
      );
    }
    process.exit(1);
  }
  console.log(`${table.padEnd(10)} : ${rows.length} ligne(s)`);
}

console.log("\nSeed OK.");
