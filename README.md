# Allo Moto

Application Next.js pour `Allo Moto`, centrée sur 4 surfaces actives :

- accueil
- catalogue motos
- fiches moto
- tunnel de reservation

## Stack

- Next.js 15
- React 19
- TypeScript strict
- Tailwind CSS 4
- Postgres via `DATABASE_URL` pour le parc et les reservations
- Cloudinary pour les images ops
- Mapbox GL pour la carte de support

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run optimize:images
```

## Persistance

Le projet supporte deux modes :

- `local/dev` : fallback JSON local pour travailler sans base distante
- `production` : Postgres obligatoire pour le store ops et Cloudinary recommande pour les uploads

En production, les lectures/écritures du parc et des reservations passent par Postgres. Au premier démarrage avec `DATABASE_URL`, la base est initialisée automatiquement puis seedée depuis `data/ops-store.json` si les tables sont vides.

Les uploads ops utilisent Cloudinary quand les variables `CLOUDINARY_*` sont présentes. Sans cette configuration, les uploads sont refusés en production.

Le schéma SQL de référence est fourni dans `db/schema.sql`.

## Variables d'environnement

Copie `.env.example` et renseigne au minimum :

```bash
DATABASE_URL=...
ADMIN_USERNAME=...
ADMIN_PASSWORD=...
ADMIN_SESSION_SECRET=...

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_UPLOAD_FOLDER=allo-moto/fleet
```

## Déploiement Netlify

1. Ajoute `DATABASE_URL` dans les variables d'environnement Netlify.
2. Ajoute les variables `CLOUDINARY_*` pour les uploads d'images ops.
3. Redéploie le site.
4. Au premier hit, les tables Postgres sont créées et seedées automatiquement si elles sont vides.

## Vérification locale

Avant merge :

```bash
npm run lint
npm run typecheck
npm run build
```
