# Repo Cartography

Ce document sert de point d'entrée rapide pour un prochain audit Codex.

## But du repo

Allo Moto est un site Next.js App Router avec 2 surfaces produit réelles et 1 back-office léger :

- public :
  - `/` accueil
  - `/motos` catalogue + fiches moto
  - `/reserver` tunnel de demande de réservation
- admin :
  - `/ops/fleet`
  - `/ops/reservations` affiché comme `Demandes`

Le produit n'est pas une plateforme complexe. Le cœur métier est :

1. un client choisit une moto et un créneau
2. il complète son dossier
3. il envoie une demande
4. l'admin confirme, refuse ou annule
5. une confirmation crée un blocage réel sur la période

## Stack

- Next.js 15 App Router
- React 19
- TypeScript strict
- Tailwind CSS 4
- stockage persistant local JSON pour l'admin

## Vue d'ensemble rapide

### Entrées principales

- [`app/page.tsx`](/Users/Amir/Desktop/allo-moto/app/page.tsx)
  - accueil
  - compose `MotoHero`, `MotoSelection`, `MotoProcess`, `MotoSupport`
- [`app/motos/page.tsx`](/Users/Amir/Desktop/allo-moto/app/motos/page.tsx)
  - catalogue public
  - lit le catalogue + le planning depuis `ops-store`
- [`app/motos/[slug]/page.tsx`](/Users/Amir/Desktop/allo-moto/app/motos/[slug]/page.tsx)
  - fiche moto
- [`app/reserver/page.tsx`](/Users/Amir/Desktop/allo-moto/app/reserver/page.tsx)
  - tunnel de réservation
  - parse les query params
  - hydrate `ReservationTunnel`
- [`app/ops/page.tsx`](/Users/Amir/Desktop/allo-moto/app/ops/page.tsx)
  - redirection vers `/ops/fleet`
- [`app/ops/fleet/page.tsx`](/Users/Amir/Desktop/allo-moto/app/ops/fleet/page.tsx)
  - home admin réelle
- [`app/ops/reservations/page.tsx`](/Users/Amir/Desktop/allo-moto/app/ops/reservations/page.tsx)
  - inbox des demandes

### Chrome global

- [`app/layout.tsx`](/Users/Amir/Desktop/allo-moto/app/layout.tsx)
  - applique les fonts, le header public et le footer public
- [`app/_shared/components/Header.tsx`](/Users/Amir/Desktop/allo-moto/app/_shared/components/Header.tsx)
- [`app/_shared/components/Footer.tsx`](/Users/Amir/Desktop/allo-moto/app/_shared/components/Footer.tsx)
- [`app/_shared/components/ChromeVisibilityGate.tsx`](/Users/Amir/Desktop/allo-moto/app/_shared/components/ChromeVisibilityGate.tsx)
  - masque le header/footer publics sur `/ops`

## Source de vérité

### Donnée persistée

- [`data/ops-store.json`](/Users/Amir/Desktop/allo-moto/data/ops-store.json)
  - unique stockage persistant du MVP
  - contient :
    - `vehicles`
    - `reservations`
    - `vehicleBlocks`

### Couche serveur centrale

- [`app/_features/ops/data/ops-store.ts`](/Users/Amir/Desktop/allo-moto/app/_features/ops/data/ops-store.ts)
  - fichier le plus important du repo
  - `server-only`
  - centralise :
    - lecture/écriture du store JSON
    - catalogue public dérivé
    - contexte planning
    - liste admin flotte
    - liste admin demandes
    - création de demande
    - confirmation / refus / annulation
    - blocages véhicule

### Conséquence importante

Le public et l'admin doivent lire la même vérité métier depuis `ops-store.ts`.

Ne pas réintroduire de logique parallèle de disponibilité via :

- seeds de démo
- faux ledger isolé
- localStorage comme source de vérité principale

## Cartographie par feature

### 1. Shared

- [`app/_shared/components`](/Users/Amir/Desktop/allo-moto/app/_shared/components)
  - shells, header, footer, section
- [`app/_shared/ui`](/Users/Amir/Desktop/allo-moto/app/_shared/ui)
  - `Badge`, `Button`, `Input`, `Label`, `EmptyState`
- [`app/_shared/lib/navigation.ts`](/Users/Amir/Desktop/allo-moto/app/_shared/lib/navigation.ts)
  - navigation publique
  - ancres accueil
  - CTA principal

### 2. Catalog

- [`app/_features/catalog/data/motorcycles.ts`](/Users/Amir/Desktop/allo-moto/app/_features/catalog/data/motorcycles.ts)
  - modèle public de base des motos
  - labels permis/transmission/catégories
- [`app/_features/catalog/data/motorcycle-details.ts`](/Users/Amir/Desktop/allo-moto/app/_features/catalog/data/motorcycle-details.ts)
  - storytelling détaillé des fiches moto
  - important : une partie du contenu éditorial détaillé vit ici, pas dans l'admin
- [`app/_features/catalog/components/MotoCatalogClient.tsx`](/Users/Amir/Desktop/allo-moto/app/_features/catalog/components/MotoCatalogClient.tsx)
  - gros composant catalogue
  - utilise `usePlanningLedger`
- [`app/_features/catalog/components/MotoFilterBar.tsx`](/Users/Amir/Desktop/allo-moto/app/_features/catalog/components/MotoFilterBar.tsx)
  - filtres et modal créneau
- [`app/_features/catalog/components/MotoRetenueSidebar.tsx`](/Users/Amir/Desktop/allo-moto/app/_features/catalog/components/MotoRetenueSidebar.tsx)
  - référence visuelle importante

### 3. Reservation

- [`app/_features/reservation/components/ReservationTunnel.tsx`](/Users/Amir/Desktop/allo-moto/app/_features/reservation/components/ReservationTunnel.tsx)
  - plus gros composant du repo côté produit
  - coordinateur du tunnel
  - gère :
    - étapes
    - query params
    - dossier client
    - soumission API
    - confirmation locale
    - dock mobile
  - toute refacto ici doit être prudente

- [`app/_features/reservation/components/ReservationClientDossier.tsx`](/Users/Amir/Desktop/allo-moto/app/_features/reservation/components/ReservationClientDossier.tsx)
  - étape dossier
  - blocage permis incompatible au bon moment

- [`app/_features/reservation/components/ReservationPayment.tsx`](/Users/Amir/Desktop/allo-moto/app/_features/reservation/components/ReservationPayment.tsx)
  - étape `Envoi`
  - ce n'est plus un vrai paiement
  - correspond à la validation avant envoi de demande

- [`app/_features/reservation/components/ReservationConfirmation.tsx`](/Users/Amir/Desktop/allo-moto/app/_features/reservation/components/ReservationConfirmation.tsx)
  - étape `Suivi`

- [`app/_features/reservation/data/reservation.ts`](/Users/Amir/Desktop/allo-moto/app/_features/reservation/data/reservation.ts)
  - règles de calcul réservation
  - formatage du créneau
  - évaluation du créneau

- [`app/_features/reservation/data/reservation-planning.ts`](/Users/Amir/Desktop/allo-moto/app/_features/reservation/data/reservation-planning.ts)
  - modèle planning
  - utilitaires de réservation / blocages
  - alimente encore `usePlanningLedger`

- [`app/_features/reservation/data/reservation-intake.ts`](/Users/Amir/Desktop/allo-moto/app/_features/reservation/data/reservation-intake.ts)
  - validation du dossier client
  - inclut désormais la compatibilité de permis avec la moto retenue

- [`app/api/reservations/route.ts`](/Users/Amir/Desktop/allo-moto/app/api/reservations/route.ts)
  - création persistante d'une demande

### 4. Ops

- [`app/_features/ops/lib/auth.ts`](/Users/Amir/Desktop/allo-moto/app/_features/ops/lib/auth.ts)
  - auth mono-admin par cookie signé
  - variables d'environnement :
    - `ADMIN_USERNAME`
    - `ADMIN_PASSWORD`
    - `ADMIN_SESSION_SECRET`

- [`app/_features/ops/actions/ops-actions.ts`](/Users/Amir/Desktop/allo-moto/app/_features/ops/actions/ops-actions.ts)
  - server actions admin
  - login/logout
  - sauvegarde véhicule
  - blocages
  - statuts des demandes

- [`app/_features/ops/components/OpsShell.tsx`](/Users/Amir/Desktop/allo-moto/app/_features/ops/components/OpsShell.tsx)
  - shell admin

- [`app/_features/ops/components/OpsHeaderChrome.tsx`](/Users/Amir/Desktop/allo-moto/app/_features/ops/components/OpsHeaderChrome.tsx)
  - nav admin
  - affiche le compteur sur `Demandes`

- [`app/_features/ops/components/OpsReservationDrawer.tsx`](/Users/Amir/Desktop/allo-moto/app/_features/ops/components/OpsReservationDrawer.tsx)
  - drawer latéral admin
  - voie normale de lecture/traitement des demandes

- [`app/_features/ops/components/OpsReservationDetailContent.tsx`](/Users/Amir/Desktop/allo-moto/app/_features/ops/components/OpsReservationDetailContent.tsx)
  - contenu métier du drawer
  - contient aussi la barre d'action fixe

- [`app/_features/ops/components/OpsVehicleForm.tsx`](/Users/Amir/Desktop/allo-moto/app/_features/ops/components/OpsVehicleForm.tsx)
  - formulaire flotte simplifié
  - ne montre plus les champs éditoriaux inutiles au pilotage

- [`app/_features/ops/components/OpsVehicleImageField.tsx`](/Users/Amir/Desktop/allo-moto/app/_features/ops/components/OpsVehicleImageField.tsx)
  - upload unique d'image
  - une seule image par moto

- [`app/_features/ops/lib/presentation.ts`](/Users/Amir/Desktop/allo-moto/app/_features/ops/lib/presentation.ts)
  - labels/tones partagés pour statuts flotte et blocages

## Routes actives

### Public

- `/`
- `/motos`
- `/motos/[slug]`
- `/reserver`
- `/conditions`
- `/confidentialite`
- `/mentions-legales`

### Admin

- `/ops/login`
- `/ops` -> redirige vers `/ops/fleet`
- `/ops/fleet`
- `/ops/fleet/new`
- `/ops/fleet/[slug]`
- `/ops/reservations`

### Routes supprimées / n'existent plus

Ces chemins ne doivent pas être réintroduits sans raison :

- `/ops/reservations/[id]`
- `/ops/fleet/[slug]/availability`
- `/api/payments/session`

## Flux métier essentiels

### Flux public -> demande

1. le public choisit une moto
2. le tunnel vérifie le créneau
3. le client complète son dossier
4. le permis est validé à l'étape dossier, pas au catalogue
5. `POST /api/reservations`
6. `createReservationRequest()` écrit une demande `pending` dans `ops-store`

### Flux admin -> confirmation

1. l'admin ouvre `/ops/fleet` ou `/ops/reservations`
2. il ouvre une demande dans le drawer `?open=...`
3. il confirme / refuse / annule
4. `updateReservationStatus()` :
   - `confirmed` :
     - garde la demande
     - crée un `vehicleBlock` de type `reservation`
   - `rejected` / `cancelled` :
     - supprime la demande
     - supprime les blocs liés

### Disponibilité publique

Une moto est publiquement disponible si :

- `opsStatus !== hidden`
- pas de blocage actif sur la période
- pas de réservation confirmée bloquante

## Invariants à ne pas casser

1. `ops-store.ts` est la source de vérité
- ne pas recréer une seconde vérité métier ailleurs

2. le catalogue ne bloque plus tôt sur le permis
- la compatibilité de permis est gérée dans le dossier client

3. l'étape `Envoi` n'est pas un vrai paiement
- le paiement est au retrait
- ne pas réintroduire Stripe ou une API de pre-checkout fantôme sans vrai besoin

4. l'admin n'a plus de page détail demande dédiée
- la lecture normale se fait via drawer

5. la flotte est la vraie home admin
- ne pas remettre une page dashboard de synthèse inutile

6. l'upload image flotte est univoque
- une moto = zéro ou une image principale

## Fichiers sensibles

### À lire avant toute refacto importante

- [`app/_features/ops/data/ops-store.ts`](/Users/Amir/Desktop/allo-moto/app/_features/ops/data/ops-store.ts)
- [`app/_features/reservation/components/ReservationTunnel.tsx`](/Users/Amir/Desktop/allo-moto/app/_features/reservation/components/ReservationTunnel.tsx)
- [`app/_features/reservation/data/reservation.ts`](/Users/Amir/Desktop/allo-moto/app/_features/reservation/data/reservation.ts)
- [`app/_features/reservation/data/reservation-intake.ts`](/Users/Amir/Desktop/allo-moto/app/_features/reservation/data/reservation-intake.ts)
- [`app/ops/fleet/page.tsx`](/Users/Amir/Desktop/allo-moto/app/ops/fleet/page.tsx)
- [`app/ops/reservations/page.tsx`](/Users/Amir/Desktop/allo-moto/app/ops/reservations/page.tsx)

### Gros composants à traiter avec prudence

- [`app/_features/reservation/components/ReservationTunnel.tsx`](/Users/Amir/Desktop/allo-moto/app/_features/reservation/components/ReservationTunnel.tsx)
- [`app/_features/catalog/components/MotoCatalogClient.tsx`](/Users/Amir/Desktop/allo-moto/app/_features/catalog/components/MotoCatalogClient.tsx)

## Endroits utiles selon l'intention

### Si tu veux modifier le public

- navigation : [`app/_shared/lib/navigation.ts`](/Users/Amir/Desktop/allo-moto/app/_shared/lib/navigation.ts)
- home : [`app/page.tsx`](/Users/Amir/Desktop/allo-moto/app/page.tsx)
- catalogue : [`app/motos/page.tsx`](/Users/Amir/Desktop/allo-moto/app/motos/page.tsx)
- fiche moto : [`app/motos/[slug]/page.tsx`](/Users/Amir/Desktop/allo-moto/app/motos/[slug]/page.tsx)

### Si tu veux modifier le tunnel

- route : [`app/reserver/page.tsx`](/Users/Amir/Desktop/allo-moto/app/reserver/page.tsx)
- orchestrateur : [`app/_features/reservation/components/ReservationTunnel.tsx`](/Users/Amir/Desktop/allo-moto/app/_features/reservation/components/ReservationTunnel.tsx)
- validation dossier : [`app/_features/reservation/data/reservation-intake.ts`](/Users/Amir/Desktop/allo-moto/app/_features/reservation/data/reservation-intake.ts)

### Si tu veux modifier l'admin

- auth : [`app/_features/ops/lib/auth.ts`](/Users/Amir/Desktop/allo-moto/app/_features/ops/lib/auth.ts)
- home admin : [`app/ops/fleet/page.tsx`](/Users/Amir/Desktop/allo-moto/app/ops/fleet/page.tsx)
- demandes : [`app/ops/reservations/page.tsx`](/Users/Amir/Desktop/allo-moto/app/ops/reservations/page.tsx)
- persistance : [`app/_features/ops/data/ops-store.ts`](/Users/Amir/Desktop/allo-moto/app/_features/ops/data/ops-store.ts)

## Nettoyages déjà effectués

Pour éviter de réintroduire des reliquats déjà supprimés :

- notion `Limite` supprimée
- seeds de réservations démo supprimées du moteur planning
- faux paiement / faux pre-checkout retiré du parcours actif
- page détail admin des demandes supprimée
- vue d'ensemble admin supprimée
- route admin `availability` supprimée

## Docs existantes

- [`README.md`](/Users/Amir/Desktop/allo-moto/README.md)
  - utile pour la stack et les scripts
  - mais historiquement moins à jour que ce fichier sur certains flux métiers

## Vérifications minimales avant merge

```bash
npm run lint
npm run typecheck
```

Si une refacto touche :

- le tunnel
- `ops-store.ts`
- les routes `app/ops/*`

alors faire aussi :

```bash
npm run build
```

## Conseil d'audit pour le prochain Codex

Ordre de lecture recommandé :

1. ce fichier
2. [`app/_features/ops/data/ops-store.ts`](/Users/Amir/Desktop/allo-moto/app/_features/ops/data/ops-store.ts)
3. [`app/reserver/page.tsx`](/Users/Amir/Desktop/allo-moto/app/reserver/page.tsx)
4. [`app/_features/reservation/components/ReservationTunnel.tsx`](/Users/Amir/Desktop/allo-moto/app/_features/reservation/components/ReservationTunnel.tsx)
5. [`app/ops/fleet/page.tsx`](/Users/Amir/Desktop/allo-moto/app/ops/fleet/page.tsx)
6. [`app/ops/reservations/page.tsx`](/Users/Amir/Desktop/allo-moto/app/ops/reservations/page.tsx)

Si l'audit porte sur un bug métier, partir d'abord du flux et des invariants, pas du composant visuel.
