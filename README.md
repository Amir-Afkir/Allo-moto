# Allo Moto

Application Next.js pour `Allo Moto`, centrée sur 4 surfaces actives :

- accueil
- catalogue motos
- fiches moto
- tunnel de reservation

Le repo utilise l'App Router de Next.js. Le code legacy de l'ancien site a ete retire du runtime pour ne garder que les parcours encore utiles au produit.

## Stack

- Next.js 15
- React 19
- TypeScript strict
- Tailwind CSS 4
- Mapbox GL pour la carte de support

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run optimize:images
```

## Structure

```text
app/
  page.tsx                 accueil Allo Moto
  motos/                   catalogue et fiches
  reserver/                tunnel de reservation
  components/              composants UI et layout
  data/                    donnees et logique metier
  api/
    payments/session/      ouverture de session de paiement
```

## Points d'attention

- Le tunnel de reservation contient encore une logique de session de paiement interne a brancher sur un vrai prestataire si tu veux une confirmation de paiement reelle.
- `robots.txt` ne publie pas encore de sitemap tant que le domaine canonique n'est pas fixe.

## Verification locale

Avant merge :

```bash
npm run lint
npm run typecheck
npm run build
```
