-- =============================================================================
--  Données de démonstration. Artistes fictifs.
--  Idempotent : identifiants fixes, `insert or replace`.
--  À supprimer le jour où de vrais artistes s'inscrivent.
-- =============================================================================

insert or replace into artists (id, slug, name, city, bio, gradient_from, gradient_to, verified, monthly_listeners) values
  ('art_ndiagaflow', 'ndiagaflow', 'Ndiaga Flow', 'Pikine',              'Rap conscient, prod maison. Deux projets sortis, tout en indé. Le troisième arrive.', '#e04ec8', '#5b21b6', 1, 41200),
  ('art_maladee',    'maladee',    'Mala Dee',    'Guédiawaye',          'Drill sénégalaise. Wolof, français, un peu d''anglais quand ça sert.',                '#f472e0', '#7c3aed', 0, 18600),
  ('art_sistakine',  'sistakine',  'Sista Kiné',  'Médina',              'Plume tranchante, flow posé. Elle écrit tout, elle ne signe rien.',                   '#fbd24e', '#a855f7', 1, 27400),
  ('art_bayeloops',  'bayeloops',  'Baye Loops',  'Thiès',               'Beatmaker devenu rappeur. Sample sabar, kick lourd.',                                 '#22d3ee', '#7c3aed', 0,  9800),
  ('art_xamsa',      'xamsa',      'Xamsa',       'Parcelles Assainies', 'Freestyle tous les vendredis. La communauté suit depuis 2023.',                       '#fb7185', '#6d28d9', 0, 12300);

insert or replace into tracks (id, artist_id, title, duration, plays, released_at, locked, featuring, position) values
  ('trk_01', 'art_ndiagaflow', 'Wax Sa Dëgg',                    214, 128400, '2026-05-02', 0, null,       1),
  ('trk_02', 'art_ndiagaflow', 'Pikine By Night',                187,  96200, '2026-05-02', 0, 'Mala Dee', 2),
  ('trk_03', 'art_ndiagaflow', 'Sunu Yoon',                      241,  74800, '2026-03-18', 0, null,       3),
  ('trk_04', 'art_ndiagaflow', 'Bantamba',                       176,  51900, '2026-03-18', 0, null,       4),
  ('trk_05', 'art_ndiagaflow', 'Dara Doul Dara — inédit',        203,      0, '2026-08-14', 1, null,       5),
  ('trk_06', 'art_ndiagaflow', 'Freestyle #12 — version longue', 288,      0, '2026-08-10', 1, null,       6),
  ('trk_07', 'art_maladee',    'Gëdd',                           168,  62100, '2026-06-20', 0, null,       1),
  ('trk_08', 'art_maladee',    'Nuit Blanche à GD',              195,  44300, '2026-06-20', 0, null,       2),
  ('trk_09', 'art_maladee',    'Chargeur',                       152,  31700, '2026-04-11', 0, null,       3),
  ('trk_10', 'art_maladee',    'Gëdd — remix inédit',            181,      0, '2026-08-12', 1, null,       4),
  ('trk_11', 'art_sistakine',  'Jigéen Ju Am Doole',             226,  88700, '2026-07-04', 0, null,       1),
  ('trk_12', 'art_sistakine',  'Médina 2h du mat',               199,  53200, '2026-07-04', 0, null,       2),
  ('trk_13', 'art_sistakine',  'Lettre à ma mère',               254,  47600, '2026-02-27', 0, null,       3),
  ('trk_14', 'art_sistakine',  'Couplet coupé au mix',           132,      0, '2026-08-09', 1, null,       4),
  ('trk_15', 'art_bayeloops',  'Sabar Trap',                     172,  29400, '2026-06-01', 0, null,       1),
  ('trk_16', 'art_bayeloops',  'Thiès–Dakar',                    208,  21100, '2026-06-01', 0, null,       2),
  ('trk_17', 'art_bayeloops',  'Pack de prods — 5 instrus',      240,      0, '2026-08-05', 1, null,       3),
  ('trk_18', 'art_xamsa',      'Vendredi 21h',                   163,  38900, '2026-07-25', 0, null,       1),
  ('trk_19', 'art_xamsa',      'Parcelles U16',                  185,  26500, '2026-05-30', 0, null,       2),
  ('trk_20', 'art_xamsa',      'Freestyle non diffusé',          221,      0, '2026-08-13', 1, null,       3);

insert or replace into clips (id, artist_id, title, youtube_id, views) values
  ('clp_01', 'art_ndiagaflow', 'Wax Sa Dëgg — Clip officiel', 'dQw4w9WgXcQ', 412000),
  ('clp_02', 'art_ndiagaflow', 'Pikine By Night',             'dQw4w9WgXcQ', 187000),
  ('clp_03', 'art_maladee',    'Gëdd — Clip officiel',        'dQw4w9WgXcQ',  96000),
  ('clp_04', 'art_sistakine',  'Jigéen Ju Am Doole',          'dQw4w9WgXcQ', 233000),
  ('clp_05', 'art_xamsa',      'Vendredi 21h — live',         'dQw4w9WgXcQ',  58000);

insert or replace into supports (id, artist_id, supporter_name, amount, message, method, status, created_at, paid_at) values
  ('sup_01', 'art_ndiagaflow', 'Modou D.',       25000, 'Le projet est trop propre frère 🔥', 'wave',         'paid', '2026-08-14T19:20:00Z', '2026-08-14T19:20:00Z'),
  ('sup_02', 'art_ndiagaflow', 'Astou Ndiaye',   10000, 'Depuis le premier son je suis là',   'wave',         'paid', '2026-08-14T09:05:00Z', '2026-08-14T09:05:00Z'),
  ('sup_03', 'art_ndiagaflow', 'Alioune Badara', 10000, null,                                 'orange_money', 'paid', '2026-08-13T22:40:00Z', '2026-08-13T22:40:00Z'),
  ('sup_04', 'art_ndiagaflow', 'Fatou N.',        5000, 'Bantamba en boucle',                 'wave',         'paid', '2026-08-13T14:12:00Z', '2026-08-13T14:12:00Z'),
  ('sup_05', 'art_ndiagaflow', 'Cheikh S.',       5000, null,                                 'wave',         'paid', '2026-08-12T18:55:00Z', '2026-08-12T18:55:00Z'),
  ('sup_06', 'art_ndiagaflow', 'Anonyme',         2000, null,                                 'orange_money', 'paid', '2026-08-12T11:30:00Z', '2026-08-12T11:30:00Z'),
  ('sup_07', 'art_ndiagaflow', 'Pape Malick',     2000, 'Sors le clip stp',                   'wave',         'paid', '2026-08-11T20:02:00Z', '2026-08-11T20:02:00Z'),
  ('sup_08', 'art_ndiagaflow', 'Aida B.',         1000, null,                                 'wave',         'paid', '2026-08-11T08:44:00Z', '2026-08-11T08:44:00Z'),
  ('sup_09', 'art_ndiagaflow', 'Ibou',            1000, null,                                 'orange_money', 'paid', '2026-08-10T23:15:00Z', '2026-08-10T23:15:00Z'),
  ('sup_10', 'art_ndiagaflow', 'Ndeye Coumba',     500, 'Force à toi',                        'wave',         'paid', '2026-08-10T16:00:00Z', '2026-08-10T16:00:00Z'),
  ('sup_11', 'art_maladee',    'Serigne F.',     10000, 'La drill sénégalaise c''est toi',    'wave',         'paid', '2026-08-14T21:10:00Z', '2026-08-14T21:10:00Z'),
  ('sup_12', 'art_maladee',    'Khadija',         5000, null,                                 'wave',         'paid', '2026-08-13T17:25:00Z', '2026-08-13T17:25:00Z'),
  ('sup_13', 'art_maladee',    'Mouhamed L.',     2000, null,                                 'orange_money', 'paid', '2026-08-12T13:48:00Z', '2026-08-12T13:48:00Z'),
  ('sup_14', 'art_maladee',    'Anonyme',         1000, null,                                 'wave',         'paid', '2026-08-11T10:30:00Z', '2026-08-11T10:30:00Z'),
  ('sup_15', 'art_sistakine',  'Bineta S.',      20000, 'Lettre à ma mère m''a fait pleurer', 'wave',         'paid', '2026-08-14T15:35:00Z', '2026-08-14T15:35:00Z'),
  ('sup_16', 'art_sistakine',  'Ousmane K.',     10000, null,                                 'wave',         'paid', '2026-08-13T09:20:00Z', '2026-08-13T09:20:00Z'),
  ('sup_17', 'art_sistakine',  'Mariama',         5000, 'Respect 🙏',                         'orange_money', 'paid', '2026-08-12T19:05:00Z', '2026-08-12T19:05:00Z'),
  ('sup_18', 'art_sistakine',  'Lamine D.',       2000, null,                                 'wave',         'paid', '2026-08-11T12:00:00Z', '2026-08-11T12:00:00Z'),
  ('sup_19', 'art_bayeloops',  'Samba',           5000, 'Le pack de prods vaut le coup',      'wave',         'paid', '2026-08-13T20:15:00Z', '2026-08-13T20:15:00Z'),
  ('sup_20', 'art_bayeloops',  'Anonyme',         2000, null,                                 'wave',         'paid', '2026-08-12T08:10:00Z', '2026-08-12T08:10:00Z'),
  ('sup_21', 'art_xamsa',      'Adama T.',       10000, 'Vendredi 21h jamais raté',           'wave',         'paid', '2026-08-14T22:45:00Z', '2026-08-14T22:45:00Z'),
  ('sup_22', 'art_xamsa',      'Rokhaya',         2000, null,                                 'orange_money', 'paid', '2026-08-13T16:30:00Z', '2026-08-13T16:30:00Z'),
  ('sup_23', 'art_xamsa',      'Babacar N.',      1000, null,                                 'wave',         'paid', '2026-08-12T21:00:00Z', '2026-08-12T21:00:00Z');
