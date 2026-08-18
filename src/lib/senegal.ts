/**
 * Régions et communes du Sénégal, pour que Foy Tewal soit choisi et non tapé.
 *
 * Un champ libre produit « pikine », « Pikine », « PIKINE Dakar » et « pikine
 * banlieue » pour un seul et même endroit : le filtre de Découvrir affiche
 * alors quatre quartiers différents et n'en trouve aucun. Une liste fermée est
 * la seule façon de garder ces données utilisables.
 *
 * Le découpage privilégie le rap plutôt que l'administration : dans la région
 * de Dakar, ce sont les quartiers qui comptent — personne ne dit « je viens du
 * département de Pikine », on dit Guinaw Rails ou Thiaroye. Ailleurs, la ville
 * suffit, parce que c'est ainsi qu'on s'y présente.
 *
 * La diaspora est une région à part entière : une bonne partie du rap
 * sénégalais s'écrit à Paris, Milan ou New York, et ces artistes-là ont autant
 * besoin d'un Foy Tewal que les autres.
 */

export const REGIONS: { nom: string; communes: string[] }[] = [
  {
    nom: "Dakar",
    communes: [
      "Almadies",
      "Biscuiterie",
      "Cambérène",
      "Colobane",
      "Dieuppeul",
      "Fass",
      "Grand Dakar",
      "Grand Yoff",
      "Gueule Tapée",
      "Hann Bel-Air",
      "HLM",
      "Médina",
      "Mermoz",
      "Ngor",
      "Ouakam",
      "Parcelles Assainies",
      "Patte d'Oie",
      "Point E",
      "Sicap Liberté",
      "Yoff",
    ],
  },
  {
    nom: "Pikine",
    communes: [
      "Dalifort",
      "Diamaguène",
      "Djiddah Thiaroye Kao",
      "Guinaw Rails",
      "Mbao",
      "Pikine",
      "Thiaroye",
    ],
  },
  {
    nom: "Guédiawaye",
    communes: [
      "Golf Sud",
      "Guédiawaye",
      "Médina Gounass",
      "Ndiarème Limamoulaye",
      "Sam Notaire",
      "Wakhinane Nimzatt",
    ],
  },
  {
    nom: "Keur Massar",
    communes: ["Jaxaay", "Keur Massar", "Malika", "Yeumbeul"],
  },
  {
    nom: "Rufisque",
    communes: [
      "Bargny",
      "Diamniadio",
      "Rufisque",
      "Sangalkam",
      "Sébikotane",
    ],
  },
  {
    nom: "Thiès",
    communes: [
      "Joal-Fadiouth",
      "Khombole",
      "Mbour",
      "Mékhé",
      "Popenguine",
      "Pout",
      "Saly",
      "Thiès",
      "Tivaouane",
    ],
  },
  {
    nom: "Diourbel",
    communes: ["Bambey", "Diourbel", "Mbacké", "Touba"],
  },
  {
    nom: "Saint-Louis",
    communes: ["Dagana", "Podor", "Richard-Toll", "Ross Béthio", "Saint-Louis"],
  },
  {
    nom: "Louga",
    communes: ["Dahra", "Kébémer", "Linguère", "Louga"],
  },
  {
    nom: "Fatick",
    communes: ["Fatick", "Foundiougne", "Gossas", "Passy", "Sokone"],
  },
  {
    nom: "Kaolack",
    communes: ["Guinguinéo", "Kahone", "Kaolack", "Nioro du Rip"],
  },
  {
    nom: "Kaffrine",
    communes: ["Birkelane", "Kaffrine", "Koungheul", "Malem Hodar"],
  },
  {
    nom: "Ziguinchor",
    communes: ["Bignona", "Cap Skirring", "Oussouye", "Ziguinchor"],
  },
  {
    nom: "Kolda",
    communes: ["Kolda", "Médina Yoro Foulah", "Vélingara"],
  },
  {
    nom: "Sédhiou",
    communes: ["Bounkiling", "Goudomp", "Sédhiou"],
  },
  {
    nom: "Tambacounda",
    communes: ["Bakel", "Goudiry", "Koumpentoum", "Tambacounda"],
  },
  {
    nom: "Kédougou",
    communes: ["Kédougou", "Salémata", "Saraya"],
  },
  {
    nom: "Matam",
    communes: ["Kanel", "Matam", "Ourossogui", "Ranérou", "Thilogne"],
  },
  {
    nom: "Diaspora",
    communes: [
      "Barcelone",
      "Bruxelles",
      "Lyon",
      "Marseille",
      "Milan",
      "New York",
      "Paris",
      "Rome",
      "Turin",
    ],
  },
];

/** Toutes les communes, à plat — sert à valider ce qui arrive du navigateur. */
export const COMMUNES: string[] = REGIONS.flatMap((r) => r.communes);

/**
 * La région d'une commune, déduite de la liste plutôt que stockée en base.
 *
 * Ajouter une colonne `region` aurait imposé une migration de plus pour une
 * information entièrement contenue dans le nom du quartier.
 */
export function regionDe(commune: string): string | undefined {
  return REGIONS.find((r) => r.communes.includes(commune))?.nom;
}

/** La commune est-elle dans la liste ? Le serveur ne fait confiance à rien. */
export function communeValide(valeur: string): boolean {
  return COMMUNES.includes(valeur);
}
