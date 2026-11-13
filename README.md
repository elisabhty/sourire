# Sourire

Appli de suivi de traitement orthodontique (bagues, aligneurs, contention…).

- **Photos** des dents par vue (face, côtés, arcades, profil), datées et annotées
- **Comparer** : avant / après avec curseur ou côte à côte
- **Suivi** : rendez-vous, questions pour l'orthodontiste, paiements, aligneur en cours
- **Cabinet** : mode plein écran à montrer au praticien, compte rendu PDF, envoi des photos
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
