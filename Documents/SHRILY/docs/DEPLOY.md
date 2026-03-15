# Guide de déploiement Diaspora Delivery

## Backend (Railway)
1. Créer un projet Railway, ajouter une base PostgreSQL.
2. Définir les variables d'env du backend (.env.example).
3. Déployer le dossier SHRILY (FastAPI) sur Railway.
4. Configurer le webhook Stripe (URL publique Railway).

## Frontend (Vercel)
1. Créer un projet Vercel, connecter le dossier /frontend.
2. Définir NEXT_PUBLIC_API_URL vers l'API Railway.
3. Déployer (Vercel détecte Next.js automatiquement).

## Migrations & seed
- `make migrate` : applique les migrations Alembic.
- `make seed` : insère des données de test (à créer).

## Commandes utiles
- `make dev-backend` : lance FastAPI en local (uvicorn)
- `make dev-frontend` : lance Next.js en local

## Sécurité
- Ne jamais commit les vraies clés Stripe/Twilio.
- Toujours utiliser Railway/Vercel pour les secrets en prod.
