# Amplifan — MVP

Plateforme d'écoute gratuite pour le rap sénégalais, avec soutien direct par
mobile money. `amplifan.app`

> Le nom vit dans `src/lib/config.ts` (`APP_NAME`, `APP_DOMAIN`).
>
> **Le Worker Cloudflare et le dépôt GitHub s'appellent encore `sunuson`.**
> C'est volontaire : renommer le Worker en crée un nouveau à une autre URL et
> abandonne celui qui est déployé. À faire au moment de brancher le domaine,
> pas avant.

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

## Le stack

| Brique | Service | Pourquoi |
| --- | --- | --- |
| Base de données | **Supabase** (Postgres) | Auth et stockage dans la même boîte |
| Hébergement | **Cloudflare Workers** (adaptateur OpenNext) | Gratuit, jamais en pause |
| Fichiers audio | **Cloudflare R2**, à terme | Egress gratuit |
| Clips vidéo | Aucun — ils restent sur YouTube | Zéro bande passante |

Le client Supabase parle en HTTP : il tourne donc nativement sur Workers,
aucune adaptation nécessaire.

## Démarrer

**1.** Installer :

```bash
npm install
```

**2.** Créer le schéma — copier tout [`supabase/schema.sql`](supabase/schema.sql)
dans le **SQL Editor** du projet Supabase, et exécuter. Le fichier est
idempotent, relançable sans rien casser.

**3.** Renseigner les clés. Copier `.env.example` en `.env.local`, puis coller
les deux clés depuis *Dashboard → Project Settings → API* :

```bash
cp .env.example .env.local
```

**4.** Charger les données de démonstration, puis lancer :

```bash
npm run db:seed && npm run dev
```

`npm run db:inspect` compte ce qu'il y a en base. Ouvrir ensuite
<http://localhost:3000>.

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

## Sécurité — les deux clés

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — publique, **bridée par la RLS**. L'app s'en
  sert pour *toutes* les lectures, y compris côté serveur. C'est volontaire :
  si une policy est mal écrite, la fuite reste bornée à ce que le public a déjà
  le droit de voir.
- `SUPABASE_SERVICE_ROLE_KEY` — **contourne toute la RLS**. Réservée au seed et
  au futur webhook de paiement. Jamais préfixée `NEXT_PUBLIC_`, jamais
  committée, jamais collée dans un chat.

`src/lib/db.ts` importe `server-only` : si un composant client tente de
l'importer, **la compilation échoue**. C'est ce qui empêche la clé secrète de
finir dans le bundle du navigateur.

La table `supports` n'a **aucune policy d'insertion**. Le navigateur ne peut
donc pas créer de soutien, même s'il essaie — seul le serveur en est capable.

## Changer de base coûte deux fichiers

Tout accès à la base est enfermé dans `src/lib/queries.ts` et `src/lib/db.ts`.
Aucun composant ne sait d'où viennent les données : ils ne connaissent que les
types de `src/lib/types.ts`. C'est ce qui a rendu les allers-retours entre
Supabase, Neon et D1 indolores — les écrans n'ont jamais bougé.

## L'hébergement audio

La base ne stocke que `audio_key`, la clé de l'objet — pas l'URL complète, car
le domaine du CDN peut changer.

Le palier gratuit Supabase Storage donne environ **5 Go de transfert par
mois**, soit **~1 200 écoutes** à 4 Mo le morceau : un seul artiste avec cent
fans actifs l'épuise en une semaine. Dès les premières écoutes réelles,
basculer sur **Cloudflare R2** (egress gratuit) — seul
`NEXT_PUBLIC_AUDIO_BASE_URL` change, `audio_key` reste identique.

Encoder en **128 kbps** : la différence est inaudible sur un téléphone et
divise par deux la consommation data du fan. Un son de 4 min y pèse ~4 Mo,
contre 60 à 150 Mo pour le même morceau en clip. D'où la règle : les clips ne
sont **jamais** hébergés, seul l'identifiant YouTube est stocké.

## Déployer sur Cloudflare

> ⚠️ **Ne pas builder depuis Windows — c'est constaté, pas théorique.**
> `npx opennextjs-cloudflare build` échoue ici à l'étape de bundling :
> `ENOENT ... copyfile '.open-next\.build\open-next.config.edge.mjs'`.
> OpenNext prévient lui-même qu'il n'est pas pleinement compatible Windows, et
> le dossier du projet contient un accent (`C:\idée` devient `C:/id%C3%A9e`
> dans les URL de fichiers), ce qui n'arrange rien.
>
> Le build Next.js lui-même passe : seul le bundling Worker casse. On laisse
> donc Cloudflare builder depuis GitHub — son CI tourne sous Linux, où ni le
> problème Windows ni celui de l'accent n'existent.
>
> Si un jour tu veux builder en local, la solution est WSL **et** un chemin de
> projet sans accent.

### 1. Vérifier le nom du Worker

`wrangler.jsonc` déclare `"name": "sunuson"`. **Si un de tes Workers porte déjà
ce nom, le déploiement l'écraserait.** Vérifie dans Workers & Pages, et change
le nom ici si besoin. C'est le seul risque pour tes projets existants.

### 2. Connecter le dépôt

Cloudflare Dashboard → **Workers & Pages** → **Create** → **Import a
repository** → `paylika/sunuson`.

Renseigner — **le build command par défaut (`npm run build`) ne convient pas** :
il produit un build Next.js classique, pas un Worker.

| Champ | Valeur |
| --- | --- |
| Build command | `npx opennextjs-cloudflare build` |
| Deploy command | `npx opennextjs-cloudflare deploy` |

### 3. Les variables d'environnement

**Aucune n'est nécessaire au build.** C'est délibéré : le build ne dépend pas
de la configuration, il passe sur une machine vierge. Toutes sont lues à
l'exécution, donc les changer ne demande pas de rebuild.

| Variable | Type |
| --- | --- |
| `SUPABASE_URL` | Texte |
| `SUPABASE_ANON_KEY` | Texte — bridée par la RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** — contourne toute la RLS |
| `PAYMENT_WEBHOOK_SECRET` | **Secret** — sans lui le webhook répond 503 |

À déclarer dans **Settings → Variables and Secrets** du Worker.

> Aucun nom n'est préfixé `NEXT_PUBLIC_`, et il ne faut pas le rajouter : Next
> fige les `NEXT_PUBLIC_` au moment du build, donc les définir côté Cloudflare
> n'aurait aucun effet. C'est exactement ce qui faisait échouer le premier
> déploiement.

### 4. Déployer

Un `git push` sur `main` déclenche le build et le déploiement.

### Déployer depuis ta machine (déconseillé sous Windows)

Si tu passes un jour sous WSL ou Linux :

```bash
npx wrangler login
```

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

```bash
npm run cf:deploy
```

`npm run cf:preview` lance le Worker en local. Il lit la clé secrète depuis
`.dev.vars` — un fichier généré à partir de `.env.local`, ignoré par git au
même titre que lui.

## État actuel

**Les quatre écrans lisent la base.** Il n'y a plus aucune donnée en dur : le
fichier `src/lib/data.ts` a disparu. Les soutiens et les morceaux déposés sont
persistés et survivent au rechargement.

Ce qui reste simulé :

- **Le paiement.** Aucun agrégateur n'est branché. En développement,
  `createSupport` confirme le soutien lui-même — un bloc explicitement borné à
  `NODE_ENV !== "production"`. En production, seul le webhook peut confirmer.
- **L'upload audio.** Le dépôt crée la fiche du morceau, pas le fichier :
  `audio_key` reste vide et le lecteur simule la lecture. Dès qu'un `audioUrl`
  est présent, il pilote un vrai élément `<audio>`.
- **L'authentification.** Le dashboard affiche toujours l'artiste
  `DEMO_ARTIST_SLUG` (`src/lib/config.ts`), faute de comptes.

## Paiement mobile money

Le flux visé, une fois branché sur un agrégateur (PayDunya, CinetPay,
Paystack — vérifier les conditions en vigueur) :

1. Le client crée une intention de paiement côté serveur.
2. `supports` reçoit une ligne en `status = 'pending'`.
3. L'agrégateur confirme par webhook → passage en `'paid'` via `supabaseAdmin()`.
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
