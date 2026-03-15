# Règle d’Or du dossier core/

Avant d’ajouter du code dans core/, posez-vous cette question :

> « Ce code fonctionnerait-il si je remplaçais ma base de données par des fichiers JSON, ou si je changeais de framework web ? »

- Si la réponse est OUI → il appartient à core/ (logique métier pure, indépendante des technologies externes)
- Si la réponse est NON → il va dans infrastructure/ (accès aux données, APIs externes) ou api/ (interfaces, endpoints)
