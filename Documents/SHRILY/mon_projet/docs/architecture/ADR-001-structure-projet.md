# ADR-001 : Structure du projet Python

## Décision
Adopter une structure modulaire basée sur `src/core`, `src/api`, `src/infrastructure` pour séparer la logique métier, les interfaces et les détails techniques.

## Contexte
- Faciliter la maintenabilité, la testabilité et la clarté du code.
- Permettre l’évolution indépendante des couches métier et technique.
- Favoriser les imports absolus et la découverte rapide des responsabilités.

## Alternatives considérées
- Structure plate (tous les fichiers à la racine) : difficile à maintenir, source de bugs.
- Dossier `utils/` fourre-tout : perte de cohérence, dette technique rapide.

## Conséquences
- Chaque couche a une responsabilité claire.
- Les tests sont organisés en miroir de `src/`.
- Les nouveaux arrivants comprennent rapidement l’architecture.
- Les migrations techniques (DB, framework) sont facilitées.
