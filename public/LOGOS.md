# Fichiers de marque

## Servis par le site

| Fichier | Usage |
| --- | --- |
| `icon-192.png` | La tuile acide, utilisée partout dans l'interface |
| `icon-1024.png` | Même tuile en grand, pour les partages et les stores |
| `logo-wordmark.png` | Marque + nom, fond transparent |

Le favicon et l'icône iOS vivent dans `src/app/icon.png` et
`src/app/apple-icon.png`, où Next les détecte automatiquement.

## Sources

Les originaux livrés sont dans `design/`, **hors du dossier servi** : ils
pèsent 2 Mo et n'ont aucune raison d'être téléchargés par les visiteurs ni
téléversés à chaque déploiement.

Ils étaient sur fond noir opaque. Le détourage a été fait une fois : le noir
est devenu transparent avec un seuil bas, pour ne pas ronger l'acide, et les
bords antialiasés ont gardé une opacité progressive plutôt que d'être
crénelés.

## Si tu refais les fichiers

Fournis-les en **SVG à fond transparent** : net à toute taille, dix fois plus
léger, et plus aucun détourage à refaire. Remplace alors simplement les
fichiers de ce dossier en gardant les mêmes noms.
