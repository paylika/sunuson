/**
 * Régions et communes du Sénégal, pour que Foy Tewal soit choisi et non tapé.
 *
 * Un champ libre produit « pikine », « Pikine », « PIKINE Dakar » et « pikine
 * banlieue » pour un seul et même endroit : le filtre de Découvrir affiche
 * alors quatre quartiers différents et n'en trouve aucun. Une liste fermée est
 * la seule façon de garder ces données utilisables.
 *
 * Le premier niveau ne contient QUE les quatorze régions administratives. Une
 * première version y avait glissé Pikine, Guédiawaye, Keur Massar et Rufisque
 * — qui sont des départements de la région de Dakar : la liste mélangeait deux
 * échelles et on ne savait plus ce qu'on choisissait.
 *
 * Le département survit en revanche comme `zone`, affichée à côté du quartier.
 * Dans le rap dakarois, c'est elle qui situe : « Thiaroye » ne dit rien à qui
 * ne connaît pas, « Thiaroye · Pikine » situe tout de suite. Ailleurs qu'à
 * Dakar la ville se suffit, donc la zone reste vide.
 *
 * La diaspora est traitée comme une région : une bonne partie du rap
 * sénégalais s'écrit à Paris, Milan ou New York, et ces artistes-là ont autant
 * besoin d'un Foy Tewal que les autres.
 */

export type Commune = {
  nom: string;
  /** Département, quand il aide à situer. Vide ailleurs qu'à Dakar. */
  zone?: string;
};

export type Region = { nom: string; communes: Commune[] };

const dakar = (zone: string, noms: string[]): Commune[] =>
  noms.map((nom) => ({ nom, zone }));

export const REGIONS: Region[] = [
  {
    nom: "Dakar",
    communes: [
      ...dakar("Dakar", [
        "Almadies",
        "Baobabs",
        "Biscuiterie",
        "Bopp",
        "Cambérène",
        "Castors",
        "Colobane",
        "Dieuppeul",
        "Fann",
        "Fass",
        "Gorée",
        "Grand Dakar",
        "Grand Yoff",
        "Gueule Tapée",
        "Hann Bel-Air",
        "HLM",
        "Liberté 6",
        "Médina",
        "Mermoz",
        "Ngor",
        "Nord Foire",
        "Ouakam",
        "Ouest Foire",
        "Parcelles Assainies",
        "Patte d'Oie",
        "Plateau",
        "Point E",
        "Sicap Liberté",
        "Yoff",
      ]),
      ...dakar("Pikine", [
        "Dalifort",
        "Diamaguène Sicap Mbao",
        "Djiddah Thiaroye Kao",
        "Guinaw Rails",
        "Mbao",
        "Pikine",
        "Thiaroye",
        "Thiaroye-sur-Mer",
        "Tivaouane Diacksao",
      ]),
      ...dakar("Guédiawaye", [
        "Golf Sud",
        "Guédiawaye",
        "Médina Gounass",
        "Ndiarème Limamoulaye",
        "Sam Notaire",
        "Wakhinane Nimzatt",
      ]),
      ...dakar("Keur Massar", [
        "Jaxaay",
        "Keur Massar",
        "Malika",
        "Yeumbeul",
      ]),
      ...dakar("Rufisque", [
        "Bargny",
        "Diamniadio",
        "Rufisque",
        "Sangalkam",
        "Sébikotane",
        "Yène",
      ]),
    ],
  },
  {
    nom: "Thiès",
    communes: [
      "Joal-Fadiouth",
      "Khombole",
      "Mbour",
      "Mékhé",
      "Nguékhokh",
      "Popenguine",
      "Pout",
      "Saly",
      "Thiadiaye",
      "Thiès",
      "Tivaouane",
    ].map((nom) => ({ nom })),
  },
  {
    nom: "Diourbel",
    communes: ["Bambey", "Diourbel", "Mbacké", "Ndindy", "Touba"].map(
      (nom) => ({ nom }),
    ),
  },
  {
    nom: "Saint-Louis",
    communes: [
      "Dagana",
      "Mpal",
      "Podor",
      "Richard-Toll",
      "Ross Béthio",
      "Saint-Louis",
    ].map((nom) => ({ nom })),
  },
  {
    nom: "Louga",
    communes: ["Dahra", "Kébémer", "Linguère", "Louga"].map((nom) => ({ nom })),
  },
  {
    nom: "Fatick",
    communes: [
      "Diakhao",
      "Fatick",
      "Foundiougne",
      "Gossas",
      "Passy",
      "Sokone",
    ].map((nom) => ({ nom })),
  },
  {
    nom: "Kaolack",
    communes: ["Guinguinéo", "Kahone", "Kaolack", "Nioro du Rip"].map(
      (nom) => ({ nom }),
    ),
  },
  {
    nom: "Kaffrine",
    communes: ["Birkelane", "Kaffrine", "Koungheul", "Malem Hodar"].map(
      (nom) => ({ nom }),
    ),
  },
  {
    nom: "Ziguinchor",
    communes: ["Bignona", "Cap Skirring", "Oussouye", "Ziguinchor"].map(
      (nom) => ({ nom }),
    ),
  },
  {
    nom: "Kolda",
    communes: ["Kolda", "Médina Yoro Foulah", "Vélingara"].map((nom) => ({
      nom,
    })),
  },
  {
    nom: "Sédhiou",
    communes: ["Bounkiling", "Goudomp", "Sédhiou"].map((nom) => ({ nom })),
  },
  {
    nom: "Tambacounda",
    communes: ["Bakel", "Goudiry", "Koumpentoum", "Tambacounda"].map((nom) => ({
      nom,
    })),
  },
  {
    nom: "Kédougou",
    communes: ["Kédougou", "Salémata", "Saraya"].map((nom) => ({ nom })),
  },
  {
    nom: "Matam",
    communes: ["Kanel", "Matam", "Ourossogui", "Ranérou", "Thilogne"].map(
      (nom) => ({ nom }),
    ),
  },
  {
    nom: "Diaspora",
    communes: [
      "Barcelone",
      "Bruxelles",
      "Lyon",
      "Madrid",
      "Marseille",
      "Milan",
      "Montréal",
      "New York",
      "Paris",
      "Rome",
      "Turin",
    ].map((nom) => ({ nom })),
  },
];

/** Toutes les communes, à plat — sert à valider ce qui arrive du navigateur. */
export const COMMUNES: Commune[] = REGIONS.flatMap((r) => r.communes);

/**
 * La région d'une commune, déduite de la liste plutôt que stockée en base.
 *
 * Ajouter une colonne `region` aurait imposé une migration de plus pour une
 * information entièrement contenue dans le nom du quartier.
 */
export function regionDe(commune: string): string | undefined {
  return REGIONS.find((r) => r.communes.some((c) => c.nom === commune))?.nom;
}

/** Le département, quand il situe le quartier. */
export function zoneDe(commune: string): string | undefined {
  return COMMUNES.find((c) => c.nom === commune)?.zone;
}

/** La commune est-elle dans la liste ? Le serveur ne fait confiance à rien. */
export function communeValide(valeur: string): boolean {
  return COMMUNES.some((c) => c.nom === valeur);
}
