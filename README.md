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

Créer la base locale et la remplir. Tout se passe dans `.wrangler/`, **aucun
contact avec ton compte Cloudflare** :

```bash
npm run db:local && npm run db:seed:local
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

## Infrastructure — Cloudflare uniquement

| Brique | Service | Palier gratuit |
| --- | --- | --- |
| Hébergement | Workers, via l'adaptateur OpenNext | 100 k requêtes/jour |
| Base de données | **D1** (SQLite) | 5 Go, 5 M lectures/jour |
| Fichiers audio | **R2** | Egress **gratuit** — le poste qui explose ailleurs |
| Clips vidéo | Aucun — ils restent sur YouTube | — |

L'avantage décisif sur le gratuit Supabase : **D1 ne se met jamais en pause.**
Un projet Supabase gratuit s'endort après une semaine sans activité — le jour
où un artiste partage son lien après dix jours de calme, la page tombe.

### D1, c'est du SQLite

Trois différences avec Postgres, visibles dans `db/schema.sql` :

- pas de type `uuid` → `TEXT`, l'identifiant est généré par l'app
- pas de booléen → `INTEGER`, 0 ou 1
- pas de `timestamptz` → `TEXT` au format ISO 8601 (UTC)

Il n'y a pas de RLS non plus, et ce n'est pas un oubli : **D1 n'est joignable
que depuis le Worker.** Le navigateur ne voit jamais la base. La frontière de
sécurité, c'est le serveur, pas des policies.

### En local

```bash
npm run db:local && npm run db:seed:local
```

Les deux scripts sont idempotents. Ils écrivent un SQLite dans `.wrangler/`,
que `next dev` lit via le binding OpenNext. **Aucune authentification
Cloudflare n'est requise, et aucun projet distant n'est touché.**

Inspecter la base locale :

```bash
npx wrangler d1 execute sunuson-db --local --command "select * from artist_balances"
```

### Passer en ligne — à faire par toi

⚠️ **Avant tout : vérifie qu'aucun de tes Workers existants ne s'appelle
`sunuson`.** C'est le seul cas où un déploiement écraserait un projet à toi. Le
nom se change dans `wrangler.jsonc`. Les créations de base et de bucket, elles,
ne touchent jamais à l'existant.

```bash
npx wrangler login
```

```bash
npx wrangler d1 create sunuson-db
```

Reporter le `database_id` renvoyé dans `wrangler.jsonc`, puis :

```bash
npx wrangler r2 bucket create sunuson-audio
```

```bash
npm run db:remote && npm run db:seed:remote
```

```bash
npm run cf:deploy
```

`npm run cf:preview` permet de tester le build Worker en local avant de
déployer quoi que ce soit.

### Changer de base plus tard coûte deux fichiers

Tout accès à la base est enfermé dans `src/lib/queries.ts` et `src/lib/db.ts`.
Aucun composant ne sait d'où viennent les données — ils ne connaissent que les
types de `src/lib/types.ts`. Passer un jour à Postgres ou Turso revient à
réécrire ces deux fichiers, rien d'autre.

### L'hébergement audio

La base ne stocke que `audio_key`, la clé de l'objet dans R2 — pas l'URL
complète, car le domaine du CDN peut changer.

Encoder en **128 kbps** : la différence est inaudible sur un téléphone et
divise par deux la consommation data du fan. Un son de 4 min y pèse ~4 Mo,
contre 60 à 150 Mo pour le même morceau en clip. C'est pourquoi les clips ne
sont **jamais** hébergés : seul l'identifiant YouTube est stocké.

## État actuel

- `/a/[slug]` **lit D1** (artiste, sons, clips) en rendu dynamique.
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
