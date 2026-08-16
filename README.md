# SUNU — MVP

Plateforme d'écoute gratuite pour le rap sénégalais, avec soutien direct par
mobile money.

> **Le nom n'est pas arrêté.** Il ne vit qu'à un seul endroit :
> `src/lib/config.ts` (`APP_NAME`, `APP_DOMAIN`). Une ligne à changer.

## Le principe

L'écoute ne se monétise pas — personne ici ne paie un abonnement pour écouter.
Ce qui se monétise, c'est **le geste public de soutenir un artiste**.

Trois conséquences qui gouvernent tout le produit :

1. **La musique est gratuite**, sans compte, sans limite.
2. **Le nom du soutien est affiché** publiquement, avec un classement. C'est le
   moteur : sans visibilité du geste, il ne reste qu'un bouton de don, et
   personne n'appuie sur un bouton de don.
3. **Le produit n'est pas une destination, c'est un lien.** Chaque artiste a sa
   page et son lien à mettre en bio. Le trafic vient d'Instagram, de TikTok et
   de WhatsApp — jamais d'une recherche sur la plateforme.

## Démarrer

```bash
npm install
```

```bash
npm run dev
```

Puis ouvrir <http://localhost:3000>.

## Les écrans

| Route | Rôle |
| --- | --- |
| `/` | Accueil : artiste à la une, classement des soutiens |
| `/decouvrir` | Recherche par artiste, son ou quartier |
| `/a/[slug]` | **Le cœur du produit.** La page artiste partageable |
| `/dashboard` | Espace artiste : solde, retrait, lien, dépôt de sons |

Parcours à tester : `/a/ndiagaflow` → onglet **Sons** → un morceau marqué
*Inédit* → **Soutenir** → montant → Wave → le morceau se débloque et le nom
apparaît dans l'onglet **Soutiens**.

## Base de données — Neon

La base est un Postgres Neon. Copier `.env.example` en `.env.local` et y mettre
la chaîne de connexion (Neon Dashboard → Connection string, version *pooled*) :

```bash
cp .env.example .env.local
```

Puis créer le schéma et les données de démonstration :

```bash
npm run db:push
```

```bash
npm run db:seed
```

`npm run db:inspect` liste les tables. Les deux scripts sont **idempotents** :
relançables sans rien casser.

| Fichier | Rôle |
| --- | --- |
| `db/schema.sql` | Les tables, index et la vue `artist_balances` |
| `db/seed.sql` | Artistes fictifs, à supprimer aux premiers vrais comptes |
| `src/lib/db.ts` | La connexion, marquée `server-only` |
| `src/lib/queries.ts` | Toutes les lectures, côté serveur uniquement |

### Le modèle de sécurité a changé

Avec Supabase, c'était la RLS qui protégeait les données : le navigateur
parlait à la base, et la base décidait de ce qu'il avait le droit de voir.

**Avec Neon, le navigateur ne parle jamais à la base.** Tout passe par le
serveur Next.js, seul détenteur de `DATABASE_URL`. La frontière de sécurité
s'est déplacée de la base vers le serveur.

Deux conséquences à ne pas rater :

1. `src/lib/db.ts` importe `server-only`. Si un composant client tente de
   l'importer, **la compilation échoue** — c'est ce qui empêche la chaîne de
   connexion de fuiter dans le bundle du navigateur.
2. Une insertion dans `supports` ne doit exister que dans une route serveur
   appelée par le webhook de l'agrégateur de paiement — **jamais** dans une
   Server Action déclenchable depuis le navigateur. Sinon n'importe qui
   fabrique de faux soutiens.

### L'hébergement audio

La base ne stocke que `audio_key`, la clé de l'objet — pas l'URL complète, car
le domaine du CDN peut changer.

Les fichiers vont sur **Cloudflare R2**, dont l'egress est gratuit : c'est le
seul poste qui explose sur un produit d'écoute. Encoder en 128 kbps — la
différence est inaudible sur un téléphone et divise par deux la consommation
data du fan.

Les clips ne sont **jamais** hébergés : seul l'identifiant YouTube est stocké.

## État actuel

- `/a/[slug]` **lit la base** (artiste, sons, clips) en rendu dynamique.
- Les autres écrans lisent encore `src/lib/data.ts`. Migration à finir.
- Les soutiens vivent dans un store client (`providers.tsx`) : ce qui est
  ajouté pendant la session disparaît au rechargement.
- Le paiement est simulé, aucun appel à un agrégateur.
- Le lecteur simule la lecture tant qu'un morceau n'a pas de fichier. Dès qu'un
  `audioUrl` est présent, il pilote un vrai élément `<audio>`.

## Paiement mobile money

Le flux visé, une fois branché sur un agrégateur (PayDunya, CinetPay,
Paystack — vérifier les conditions en vigueur) :

1. Le client crée une intention de paiement côté serveur.
2. `supports` reçoit une ligne en `status = 'pending'`.
3. L'agrégateur confirme par webhook → passage en `'paid'`.
4. Le soutien devient visible sur le mur (`getSupportsByArtist` ne lit que les
   `'paid'`).

**Le navigateur n'insère jamais un soutien directement.** C'est ce qui empêche
de fabriquer de faux soutiens. La colonne `provider_ref` est `unique` : si
l'agrégateur rejoue son webhook — ça arrive régulièrement — le soutien n'est
pas compté deux fois.

Au démarrage, les reversements aux artistes se font **à la main** : encaisser,
puis envoyer par Wave. À dix artistes c'est parfaitement gérable, et ça évite
des mois de développement sur la partie la plus délicate.

## Points à trancher avant la mise en ligne

- Le nom et le domaine.
- Le cadre applicable au fait d'encaisser pour le compte de tiers.
- La commission (aujourd'hui 15 %, dans `COMMISSION_RATE`).
- La modération : un bouton de retrait rapide d'un contenu litigieux.
