# Allo Moto - PRD Planning et Gestion des Reservations

## Document

- Statut: Draft de cadrage produit et operations
- Produit: Allo Moto
- Domaine: Catalogue, reservation, paiement, planning, operations
- Version: 1.0
- Date: 2026-04-03
- Portee: Web client, back-office operateur, moteur de disponibilite, gestion des retraits et retours

## 1. Resume Executif

Le site peut maintenant mieux convertir vers la reservation, mais la conversion ne sera jamais vraiment top 1% tant que le planning n'est pas la vraie source de verite metier.

L'objectif de ce document est de definir un systeme ou:

- le client ne voit que des motos reellement reservables
- le site ne promet jamais un creneau faux
- le paiement bloque temporairement l'inventaire sans mentir sur la confirmation
- l'equipe peut absorber les reservations sans double booking ni chaos de planning
- le parcours reste rapide, coherent et premium de la home jusqu'au retour moto

Le bon produit ici n'est pas "un calendrier". Le bon produit est un moteur de disponibilite relie a un tunnel de reservation, a un tableau operateur et a des regles metier strictes.

## 2. Probleme a Resoudre

Aujourd'hui, un funnel peut convertir visuellement sans que l'operation suive. Dans la location, c'est fatal.

Les vrais risques a eliminer:

- une moto affichee comme disponible alors qu'elle ne l'est plus
- un paiement ouvert sans blocage temporaire du stock
- une reservation confirmee alors que la flotte ou l'equipe ne peuvent pas absorber le depart
- un client qui doit reexpliquer ses dates, son dossier ou son choix de moto a plusieurs etapes
- un operateur qui gere les conflits a la main, trop tard, au lieu de les voir avant

## 3. Objectif Produit

Construire un systeme de planning qui permet:

- une conversion rapide sans friction
- une disponibilite calculee, pas editoriale
- une experience client rassurante et courte
- une experience operateur simple, priorisee, actionnable
- une croissance du volume de reservations sans casser le service

## 4. Principes Produit Non Negociables

### 4.1 Verite metier

Si le site dit "disponible", la moto doit etre reservable selon les regles reelles de flotte, de buffer, de paiement et de capacite operateur.

### 4.2 Une decision, une seule fois

Le client ne doit pas choisir deux fois:

- sa moto
- ses dates
- son mode de retrait
- ses informations de dossier

### 4.3 Statuts separ es

Le produit doit separer:

- statut de reservation
- statut de paiement
- statut de flotte
- statut operationnel

### 4.4 Contexte conserve

Si un client vient d'une fiche moto, le tunnel doit garder:

- la moto
- les dates
- le mode de retrait
- le permis
- le brouillon client

### 4.5 Le support aide, il ne repare pas

Le support doit lever les objections reelles, pas compenser un flow casse.

## 5. Objectifs Business

- Augmenter le taux de passage vers l'ouverture du paiement
- Reduire les abandons causes par l'incertitude sur la disponibilite
- Maintenir un taux de double booking a 0
- Reduire le nombre de messages support avant paiement
- Garder un service premium malgre l'augmentation du volume

## 6. KPI Principaux

### 6.1 Conversion

- taux home -> catalogue
- taux home -> reservation
- taux catalogue -> fiche moto
- taux catalogue -> dossier
- taux fiche moto -> dossier
- taux dossier -> pre-checkout
- taux pre-checkout -> paiement reussi
- taux reservation -> confirmation

### 6.2 Operations

- nombre de conflits de planning detectes
- nombre de conflits vus apres confirmation
- taux de hold expires
- delai moyen entre paiement et validation operateur
- taux de retard retour
- taux d'extension acceptee
- taux d'annulation

### 6.3 Experience

- temps median pour arriver au paiement
- nombre moyen d'etapes jusqu'au paiement
- taux de ressaisie des dates
- taux de retour arriere entre etapes
- taux de contact support avant paiement

## 7. Hors Scope Initial

Pour eviter de melanger toutes les decisions, le v1 du planning ne doit pas inclure:

- multi-depots complexes avec re-equilibrage automatique de flotte
- tarification dynamique par heure
- marketplace de proprietaires externes
- gestion comptable complete
- CRM avance

## 8. Personas

### 8.1 Prospect chaud

Profil:

- sait globalement ce qu'il veut
- veut verifier vite permis, prix, depot, dates
- n'accepte pas les detours

Attentes:

- voir vite les motos reservables
- comprendre le cout reel
- ne pas perdre son temps

### 8.2 Prospect prudent

Profil:

- hesite entre plusieurs motos
- a besoin de reassurance
- veut parler a quelqu'un si necessaire

Attentes:

- comparaison lisible
- disponibilite credible
- support direct

### 8.3 Operateur reservation

Profil:

- doit confirmer, preparer, suivre les retraits et retours
- n'a pas le temps de naviguer dans un back-office complexe

Attentes:

- priorites du jour
- actions rapides
- alertes precoces

### 8.4 Responsable flotte

Profil:

- gere maintenance, indisponibilites, incident, rotation

Attentes:

- vision calendrier par moto
- conflits, buffers, charge future

## 9. Experience Client Cible

### 9.1 Promesse

"Choisissez la bonne moto, sur le bon creneau, et reservez sans surprise."

### 9.2 Parcours ideal

1. Le client arrive sur la home.
2. Il comprend en 5 secondes que la reservation est courte et que la disponibilite est reelle.
3. Il choisit soit une moto mise en avant, soit le catalogue.
4. Il renseigne les dates et voit uniquement des motos vraiment reservables.
5. Il choisit une moto.
6. Il remplit un dossier court.
7. Il ouvre le paiement.
8. Le systeme bloque temporairement la moto.
9. Le paiement reussi fait avancer la reservation vers validation ou confirmation.
10. Le client recoit une reference, une heure, un lieu et la suite claire.

### 9.3 Sensation attendue

- rapide
- credible
- sans repetition
- sans flou
- premium mais simple

## 10. Vue d'Ensemble du Moteur Planning

Le planning doit etre pense comme 2 couches reliees:

### 10.1 Couche inventaire flotte

Elle repond a la question:

"Cette moto peut-elle etre reservee sur ce creneau?"

Elle depend de:

- reservations confirmees
- holds temporaires
- maintenance
- buffers avant et apres location
- blocages manuels

### 10.2 Couche capacite operationnelle

Elle repond a la question:

"L'equipe peut-elle absorber ce depart et ce retour?"

Elle depend de:

- lieu de retrait
- nombre de departs possibles par creneau
- nombre de retours possibles par creneau
- livraisons
- ressources terrain

Une reservation n'est reservable que si la moto est libre ET si la capacite ops suit.

## 11. Domaine Metier

## 11.1 Objets Principaux

### Motorcycle

- id
- slug
- brand
- model
- status_fleet
- permit_required
- pickup_base_id
- deposit_amount
- price_rules_id
- buffer_before_minutes
- buffer_after_minutes

### Reservation

- id
- public_reference
- motorcycle_id
- customer_id ou customer_snapshot
- source_channel
- pickup_at
- return_at
- pickup_mode
- pickup_location_id
- status
- payment_status
- hold_expires_at
- validation_required
- confirmed_at
- cancelled_at
- completed_at
- ops_notes

### AvailabilityBlock

- id
- motorcycle_id
- type
- start_at
- end_at
- source_reservation_id nullable
- source_maintenance_id nullable
- source_manual_block_id nullable

Types:

- reservation
- hold
- maintenance
- manual_block
- buffer

### OperationalSlot

- id
- location_id
- date
- slot_start_at
- slot_end_at
- kind
- capacity_total
- capacity_used
- capacity_blocked

Kinds:

- pickup
- return
- delivery

### PaymentSession

- id
- reservation_id nullable au debut
- status
- provider
- amount_due
- deposit_authorization_amount
- expires_at
- provider_reference

### RentalEvent

- id
- reservation_id
- event_type
- happened_at
- actor_type
- actor_id nullable
- payload_json

## 11.2 Statuts Reservation

Les statuts reservation doivent etre stricts:

### draft

Le client a commence un parcours, mais rien n'est bloque.

### hold_payment

Le client a ouvert le paiement. La moto est bloquee temporairement jusqu'a expiration du hold.

### pending_validation

Le paiement ou le dossier permet d'aller plus loin, mais une validation humaine ou systeme reste necessaire.

### confirmed

Le creneau est reserve. La reservation est engageante.

### ready_for_pickup

Le depart est proche, le dossier est complet, la preparation est terminee.

### active_rental

La moto a ete remise, la location est en cours.

### return_due

Le retour est attendu ou a depasse le creneau.

### completed

La location est terminee et cloturee.

### cancelled

La reservation est annulee.

### blocked_ops

Une exception operationnelle empeche d'aller plus loin.

## 11.3 Statuts Paiement

Les statuts paiement doivent rester separ es:

- none
- precheckout_opened
- authorized
- paid
- failed
- expired
- refunded
- partial_refund

## 11.4 Statuts Flotte

- active
- maintenance
- inactive
- blocked

## 12. Machine a Etats

## 12.1 Reservation - transitions autorisees

```text
draft -> hold_payment
draft -> cancelled

hold_payment -> pending_validation
hold_payment -> confirmed
hold_payment -> cancelled
hold_payment -> draft (expiration hold)

pending_validation -> confirmed
pending_validation -> blocked_ops
pending_validation -> cancelled

confirmed -> ready_for_pickup
confirmed -> cancelled
confirmed -> blocked_ops

ready_for_pickup -> active_rental
ready_for_pickup -> blocked_ops
ready_for_pickup -> cancelled

active_rental -> return_due
active_rental -> completed
active_rental -> blocked_ops

return_due -> completed
return_due -> blocked_ops

blocked_ops -> pending_validation
blocked_ops -> confirmed
blocked_ops -> cancelled
```

## 12.2 Paiement - transitions autorisees

```text
none -> precheckout_opened
precheckout_opened -> authorized
precheckout_opened -> failed
precheckout_opened -> expired

authorized -> paid
authorized -> failed

paid -> refunded
paid -> partial_refund
```

## 12.3 Regles de coherence

- Une reservation `confirmed` ne peut pas avoir `payment_status = none`.
- Une reservation `active_rental` ne peut pas etre sur une moto `maintenance`.
- Une reservation `cancelled` doit liberer tous les blocs lies.
- Un `hold_payment` expire doit liberer automatiquement la moto.

## 13. Regles Planning

## 13.1 Chevauchement

Pour une meme moto, aucun overlap n'est autorise entre:

- reservation
- hold
- maintenance
- manual_block
- buffers

## 13.2 Buffers

Chaque reservation cree:

- un buffer avant retrait
- un buffer apres retour

Objectif:

- preparation de la moto
- nettoyage
- verification
- prevention des retards en cascade

Regle v1 recommandee:

- buffer avant: 60 min
- buffer apres: 90 min

Ces valeurs doivent etre configurables par moto ou par categorie.

## 13.3 Hold de paiement

Quand le client ouvre le paiement:

- creation d'un statut `hold_payment`
- creation d'un `AvailabilityBlock` de type `hold`
- blocage de la moto
- expiration automatique a T+15 min par defaut

Si le paiement n'aboutit pas:

- le hold disparait
- la reservation revient a `draft` ou `cancelled`

## 13.4 Capacite de retrait / retour

Une moto libre ne suffit pas. Il faut aussi verifier:

- capacite du lieu de retrait
- capacite du lieu de retour
- charge livraison si pickup_mode = delivery

Exemple de regle:

- max 4 departs / heure / lieu
- max 5 retours / heure / lieu
- max 2 livraisons simultanees / demi-journee

## 13.5 Maintenance

La maintenance doit etre geree comme un bloc fort.

Effets:

- la moto disparait du stock reservable
- les extensions futures deviennent impossibles
- les conflits sont visibles dans le tableau operateur

## 13.6 Annulation

Une annulation:

- ferme la reservation
- libere les blocs de planning
- conserve l'historique
- peut declencher remboursement ou retenue selon politique

## 13.7 Extension

Une extension n'est autorisee que si:

- aucun bloc ne suit
- la capacite ops du retour change suit
- la moto n'est pas attendue pour maintenance

## 13.8 Retard retour

Un retard retour doit:

- basculer le statut vers `return_due`
- alerter l'operateur
- calculer les reservations impactees
- proposer un plan d'action

## 13.9 Changement de moto

Un operateur doit pouvoir reassocier une reservation a une autre moto si:

- meme permis ou meilleur
- meme niveau de service ou validation commerciale
- nouveau creneau compatible

## 14. Regles UX Client

## 14.1 Home

Doit pousser vers:

- reservation directe si le prospect est chaud
- catalogue si le prospect veut comparer

Doit montrer:

- prix clair
- depot
- support direct
- parcours court

## 14.2 Catalogue

Doit repondre a la question:

"Quelles motos puis-je vraiment reserver maintenant?"

Doit afficher:

- prix / jour
- depot
- permis
- disponibilite reelle
- CTA `Reserver`

Ne doit pas demander d'aller sur la fiche si le client est deja convaincu.

## 14.3 Fiche moto

Doit convertir les prospects chauds.

Doit afficher:

- prix
- depot
- permis
- date / creneau
- lieu de retrait
- CTA `Reserver maintenant`

## 14.4 Dossier client

Doit etre court.

Champs requis v1:

- prenom
- nom
- email
- telephone
- preference de contact
- type de permis
- consentement

Le reste est secondaire.

## 14.5 Paiement

Doit etre honnete.

Le client doit comprendre:

- montant principal
- depot
- ce qui est bloque temporairement
- quand la reservation devient confirmee

## 14.6 Suivi

La page de suivi doit etre utile.

Elle doit montrer:

- reference
- statut reel
- lieu
- date
- contact support
- prochaine action

## 15. Regles UX Operateur

Le back-office doit etre pense pour l'urgence et la lisibilite.

Il doit permettre:

- voir ce qui brule aujourd'hui
- traiter en 1 clic les cas simples
- identifier tres vite les conflits et les reservations a risque

## 16. Tableau Operateur

## 16.1 Vue 1 - Aujourd'hui

Sections:

- departs du jour
- retours du jour
- reservations a confirmer
- holds qui expirent bientot
- reservations bloquees

Actions rapides:

- confirmer
- appeler
- ouvrir le dossier
- marquer retrait fait
- marquer retour fait
- poser un blocage

## 16.2 Vue 2 - Planning flotte

Affichage:

- calendrier par moto
- lecture jour / semaine
- code couleur simple

Blocs visibles:

- hold
- confirmed
- maintenance
- manual_block
- buffer

## 16.3 Vue 3 - Planning capacite

Affichage:

- lieu
- tranche horaire
- departs
- retours
- livraisons
- surcharge

## 16.4 Vue 4 - Exceptions

Liste priorisee:

- paiement expire
- document manquant
- retard retour
- conflit planning
- maintenance urgente
- client a rappeler

## 16.5 Vue 5 - Reservation detail

Une fiche reservation doit contenir:

- resume client
- moto
- timeline
- paiement
- notes ops
- actions
- historique des evenements

## 17. Notifications et Automations

## 17.1 Client

Emails ou messages:

- ouverture pre-checkout
- expiration hold
- reservation confirmee
- rappel avant retrait
- rappel avant retour
- retard / incident
- cloture reservation

## 17.2 Operateur

Alertes internes:

- hold expire dans moins de 5 minutes
- nouvelle reservation a valider
- surcharge capacite
- retour en retard
- moto bloquee
- extension demandee

## 17.3 Automations metier

- expiration automatique des holds
- generation automatique des buffers
- creation des taches de pickup / return
- calcul des conflits impactes par un retard
- rappel automatique client avant depart et retour

## 18. Evenements Metier

Le systeme doit emettre des evenements pour chaque action importante:

- reservation.created
- reservation.updated
- reservation.hold_opened
- reservation.hold_expired
- reservation.confirmed
- reservation.cancelled
- reservation.blocked
- payment.precheckout_opened
- payment.authorized
- payment.paid
- payment.failed
- rental.pickup_done
- rental.return_due
- rental.return_done
- fleet.maintenance_started
- fleet.maintenance_ended

## 19. Data Model SQL Propose

```sql
create table motorcycles (
  id uuid primary key,
  slug text unique not null,
  brand text not null,
  model text not null,
  status_fleet text not null check (status_fleet in ('active','maintenance','inactive','blocked')),
  permit_required text not null,
  pickup_base_id uuid not null,
  deposit_amount_cents integer not null,
  currency text not null default 'EUR',
  buffer_before_minutes integer not null default 60,
  buffer_after_minutes integer not null default 90,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table reservations (
  id uuid primary key,
  public_reference text unique not null,
  motorcycle_id uuid references motorcycles(id) not null,
  source_channel text not null,
  customer_first_name text,
  customer_last_name text,
  customer_email text,
  customer_phone text,
  pickup_at timestamptz not null,
  return_at timestamptz not null,
  pickup_mode text not null check (pickup_mode in ('motorcycle_location','delivery')),
  pickup_location_id uuid not null,
  status text not null check (status in ('draft','hold_payment','pending_validation','confirmed','ready_for_pickup','active_rental','return_due','completed','cancelled','blocked_ops')),
  payment_status text not null check (payment_status in ('none','precheckout_opened','authorized','paid','failed','expired','refunded','partial_refund')),
  hold_expires_at timestamptz,
  validation_required boolean not null default true,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  ops_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table availability_blocks (
  id uuid primary key,
  motorcycle_id uuid references motorcycles(id) not null,
  reservation_id uuid references reservations(id),
  block_type text not null check (block_type in ('reservation','hold','maintenance','manual_block','buffer')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now()
);

create table operational_slots (
  id uuid primary key,
  location_id uuid not null,
  kind text not null check (kind in ('pickup','return','delivery')),
  slot_start_at timestamptz not null,
  slot_end_at timestamptz not null,
  capacity_total integer not null,
  capacity_used integer not null default 0,
  capacity_blocked integer not null default 0,
  created_at timestamptz not null default now()
);

create table payment_sessions (
  id uuid primary key,
  reservation_id uuid references reservations(id),
  provider text not null,
  status text not null,
  amount_due_cents integer not null,
  deposit_authorization_cents integer not null,
  expires_at timestamptz,
  provider_reference text,
  created_at timestamptz not null default now()
);

create table rental_events (
  id uuid primary key,
  reservation_id uuid references reservations(id) not null,
  event_type text not null,
  actor_type text not null,
  actor_id uuid,
  payload_json jsonb not null default '{}'::jsonb,
  happened_at timestamptz not null default now()
);
```

## 20. Regles Techniques Critiques

## 20.1 Timezone

La verite produit doit etre calculee dans la timezone de service du lieu de retrait.

Pour Allo Moto a Orleans:

- timezone de reference: Europe/Paris

Ne jamais laisser des dates seulement en local browser sans timezone de service.

## 20.2 Idempotence

Operations a rendre idempotentes:

- ouverture du hold
- confirmation reservation
- creation session paiement
- expiration hold
- annulation

## 20.3 Concurrence

Le moteur de disponibilite doit se proteger contre:

- double clic client
- deux clients sur la meme moto
- un operateur qui confirme pendant qu'un hold expire

Solutions recommandees:

- verrouillage transactionnel
- contrainte d'overlap en base ou logique transactionnelle stricte
- token idempotent cote paiement

## 20.4 Audit trail

Chaque changement important doit etre historise avec:

- qui
- quand
- quoi
- ancien etat
- nouvel etat

## 21. API Contract Cible

## 21.1 Search availability

`GET /api/availability/search`

Inputs:

- pickup_at
- return_at
- permit
- pickup_mode
- optional category
- optional price band

Output:

- list motos reservables
- next available alternatives
- operational constraints

## 21.2 Create hold

`POST /api/reservations/hold`

Inputs:

- motorcycle_id
- pickup_at
- return_at
- pickup_mode
- client snapshot minimal

Output:

- reservation_id
- hold_expires_at
- payment_session_id nullable

## 21.3 Confirm reservation

`POST /api/reservations/{id}/confirm`

Output:

- status
- reference
- pickup instructions

## 21.4 Cancel reservation

`POST /api/reservations/{id}/cancel`

## 21.5 Request extension

`POST /api/reservations/{id}/extension-request`

## 21.6 Operator planning

`GET /api/ops/planning`

Modes:

- by day
- by week
- by motorcycle
- by location

## 22. Ecrans Produit a Prevoir

## 22.1 Client

- home
- catalogue disponible
- fiche moto
- dossier
- paiement
- suivi reservation
- modification / extension

## 22.2 Operateur

- dashboard du jour
- planning flotte
- planning capacite
- exceptions
- detail reservation
- detail moto
- maintenance

## 23. Scenarios Critiques

## 23.1 Deux clients choisissent la meme moto

Attendu:

- le premier a ouvrir un hold valide bloque le creneau
- le second voit une indisponibilite ou une alternative

## 23.2 Paiement commence puis abandonne

Attendu:

- hold expire
- moto reliberee
- client peut reprendre si stock toujours libre

## 23.3 Retour en retard

Attendu:

- alerte ops
- reservation suivante marquee a risque
- proposition d'action

## 23.4 Moto en maintenance la veille

Attendu:

- blocage de la moto
- reservations impactees identifiees
- reassignment ou contact client

## 23.5 Extension demandee

Attendu:

- verification overlap
- verification capacite retour
- acceptation ou refus immediat

## 23.6 Changement manuel par operateur

Attendu:

- historique complet
- recalcul des blocs
- mise a jour du suivi client

## 24. Roadmap de Livraison

## Phase 1 - Cadrage metier

- finaliser les statuts
- finaliser les politiques hold, buffer, annulation, extension
- choisir les capacites par lieu
- figer les SLA operateur

## Phase 2 - Moteur de disponibilite

- availability blocks
- calcul overlap
- buffers
- holds
- capacite operateur

## Phase 3 - Brancher le client

- catalogue base sur disponibilite reelle
- fiche moto contextualisee
- dossier connecte au moteur
- paiement avec hold

## Phase 4 - Back-office ops

- dashboard jour
- planning flotte
- planning capacite
- exceptions

## Phase 5 - Automations

- expiration hold
- rappels client
- alertes retard
- demandes d'extension

## Phase 6 - Optimisation

- analytics
- reduction des frictions
- tuning buffers et capacites

## 25. Decisions Produit a Trancher

Ces points doivent etre decides avant implementation:

- duree exacte du hold_payment
- buffer avant retrait
- buffer apres retour
- paiement confirme => confirmation auto ou validation humaine
- creneaux horaires exacts par lieu
- politique d'annulation
- politique de retard
- politique d'extension
- conditions de changement de moto
- quel niveau de surcharge operateur est acceptable

## 26. Recommandations v1 Concretes

Pour une premiere version solide:

- hold de 15 minutes
- buffer avant de 60 minutes
- buffer apres de 90 minutes
- confirmation semi-automatique:
  paiement OK + verifications systeme OK = pending_validation tres court
- 4 departs / heure / lieu
- 5 retours / heure / lieu
- extension uniquement si aucun conflit futur

## 27. Definition of Done

Le planning sera considere pret quand:

- le site ne peut plus afficher une moto reservable si elle ne l'est pas
- un hold bloque vraiment la moto
- un hold expire libere vraiment la moto
- aucune reservation confirmee ne peut overlap une autre
- l'operateur voit les priorites du jour sans chercher
- le client voit toujours son statut reel
- les retraits, retours et exceptions sont pilotables depuis le back-office

## 28. Vision Top 1%

Le top 1% n'est pas "un joli flow".

Le top 1% ici, c'est:

- un front rapide
- un planning fiable
- des statuts propres
- un support utile
- une operation qui suit sans bricolage

Quand Allo Moto atteindra ce niveau, le client percevra une chose tres simple:

"Je peux reserver vite, et ils maitrisent vraiment la suite."
