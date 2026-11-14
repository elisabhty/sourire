# Sourire

Appli de suivi de traitement orthodontique (bagues, aligneurs, contention…).

- **Appareil photo guidé** : la photo précédente s'affiche en transparence pour garder le même cadrage
- **Photos** par vue (face, côtés, arcades, profil), **comparaison** avant / après (curseur, côte à côte, fondu) et évolution en accéléré
- **Temps hors bouche des aligneurs** : bouton « Je les retire / Je les remets », calcul à partir d'horodatages, correction à tout moment, objectif réglable
- **Aujourd'hui** : routine d'hygiène, élastiques (avec stock), journal de douleur 0–10, nuits de contention
- **Rappels dans le Calendrier iOS** (.ics) : changements d'aligneur, rendez-vous, élastiques, contention, photos de suivi
- **J'ai un problème** : gestes provisoires (bracket, fil, aligneur perdu, contention…) et contact du cabinet, hors connexion
- **Guide** : douleur, alimentation, hygiène, élastiques, contention, remboursement en France
- **Suivi** : rendez-vous, questions pour l'ortho, paiements et estimation du reste à charge (Sécu + mutuelle)
- **Cabinet** : coordonnées, message au cabinet, mode présentation, compte rendu PDF, sauvegarde chiffrée
- **Famille** : plusieurs profils sur le même appareil

Sourire est un carnet personnel : il n'interprète pas les photos et ne donne aucun avis médical.

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
