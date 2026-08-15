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

## État actuel

C'est un MVP de démonstration : tout est en mémoire, rien n'est persisté.

- Les données viennent de `src/lib/data.ts` (artistes fictifs).
- Le lecteur simule la lecture quand un morceau n'a pas de fichier. Dès qu'un
  `audioUrl` est présent, il pilote un vrai élément `<audio>`.
- Le paiement est simulé : aucun appel à un agrégateur.
- Les soutiens ajoutés pendant la session disparaissent au rechargement.

## Brancher Supabase

1. Créer un projet Supabase, exécuter `supabase/schema.sql` dans le SQL Editor.
2. Renseigner `.env.local` :

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

3. Remplacer le corps des sélecteurs de `src/lib/data.ts`
   (`getArtistBySlug`, `getTracksByArtist`, `getClipsByArtist`) par des requêtes.
   Les composants ne bougent pas : ils ne connaissent que les types.

### Le piège de l'hébergement audio

Le palier gratuit de Supabase tourne autour de **5 Go de transfert sortant par
mois**. À 4 Mo par morceau, cela représente **environ 1 200 écoutes** — un seul
artiste avec cent fans actifs l'épuise en une semaine.

Dès les premières écoutes réelles, sortir les fichiers audio de Supabase et les
mettre sur **Cloudflare R2**, dont l'egress est gratuit. Supabase garde la base
de données, l'authentification et `audio_path`. Encoder en 128 kbps : la
différence est inaudible sur un téléphone et divise par deux la consommation
data du fan.

Les clips ne sont **jamais** hébergés — seul l'identifiant YouTube est stocké.

## Paiement mobile money

Le flux visé, une fois branché sur un agrégateur (PayDunya, CinetPay,
Paystack — vérifier les conditions en vigueur) :

1. Le client crée une intention de paiement côté serveur.
2. `supports` reçoit une ligne en `status = 'pending'`.
3. L'agrégateur confirme par webhook → passage en `'paid'` via `service_role`.
4. Le soutien devient visible sur le mur (la RLS ne montre que `'paid'`).

**Le navigateur n'insère jamais un soutien directement.** C'est ce qui empêche
de fabriquer de faux soutiens.

Au démarrage, les reversements aux artistes se font **à la main** : encaisser,
puis envoyer par Wave. À dix artistes c'est parfaitement gérable, et ça évite
des mois de développement sur la partie la plus délicate.

## Points à trancher avant la mise en ligne

- Le nom et le domaine.
- Le cadre applicable au fait d'encaisser pour le compte de tiers.
- La commission (aujourd'hui 15 %, dans `COMMISSION_RATE`).
- La modération : un bouton de retrait rapide d'un contenu litigieux.
