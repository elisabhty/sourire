# Sourire

Appli de suivi de traitement orthodontique (bagues, aligneurs, contention…).

- **Appareil photo guidé** : la photo précédente s'affiche en transparence pour garder le même cadrage
- **Photos** des dents par vue (face, côtés, arcades, profil), datées et annotées
- **Comparer** : avant / après (curseur, côte à côte, fondu) et évolution en accéléré
- **Suivi** : rendez-vous, questions pour l'orthodontiste, paiements, aligneur en cours
- **Cabinet** : mode présentation, compte rendu PDF à partager, envoi des photos
- **Plusieurs profils** sur le même appareil

## Vie privée

Aucun serveur, aucun compte. Les photos sont stockées **uniquement sur l'appareil** (IndexedDB) ;
ce dépôt ne contient que le code. Pense à exporter une sauvegarde depuis l'onglet Cabinet.

## Mise en ligne

Site statique sans étape de build : GitHub → Settings → Pages → *Deploy from a branch* → `main` / `(root)`.
Sur iPhone : ouvrir le site dans Safari → Partager → « Sur l'écran d'accueil ».

## En local

```
python3 -m http.server 8000
```

## Tiers

`vendor/jspdf.umd.min.js` — [jsPDF](https://github.com/parallax/jsPDF) (licence MIT), pour le compte rendu PDF.
