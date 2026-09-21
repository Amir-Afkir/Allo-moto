# Passe 2 — moteur de réservation

Base : `main` à `c986938b2cf52998b7096dfd0c2a9bcf8becca40` (passe sécurité/données).

## Disponibilités

Le badge d'occupation actuel est distinct du champ `bookingStatus`, dérivé de l'état
opérateur. Une location ou une maintenance temporaire aujourd'hui ne ferme plus les
créneaux futurs libres. Les blocages datés et les locations confirmées restent opposables,
avec les marges de préparation existantes (avant et après, aux deux extrémités comparées).
Les intervalles sont semi-ouverts : toucher exactement la fin du buffer ne chevauche pas.
Un `ignoreReservationId: null` ne doit jamais supprimer les blocages manuels/publics.

Une moto masquée, en maintenance globale ou non rendue après son retour prévu reste fermée.
Aucune demande en attente ne réserve le stock. À la confirmation, disponibilité et capacités
(retrait 4, retour 5, livraison 2) sont revérifiées dans la transaction PostgreSQL verrouillée.
Une maintenance manuelle ne peut plus contredire une location confirmée/non rendue.
Une nouvelle moto publiée par l'admin dispose d'une fiche de base même sans contenu éditorial
codé en dur. Un slug inexistant reste une 404.

## Calendrier et horaires

Fuseau du service : **Europe/Paris**, cohérent avec les pages de location à Orléans.
Ce choix ne dépend pas de la localisation de l'administrateur ou du navigateur.
Retrait sur place 10 h / retour 18 h ; livraison 9 h / retour 19 h, heures locales du service.
Conversion explicite vers UTC avec les règles IANA fournies par Intl, sans offset fixe.
Les calculs journaliers restent inclusifs et basés sur les dates civiles (pas sur des journées
supposées toujours longues de 24 heures lors d'un changement d'heure).

Dates absentes, impossibles, inversées, passées et départs du jour dont l'heure est dépassée :
refus explicite, sans exception de rendu du tunnel. Les contrôles serveur sont autoritaires.
Les dates de formulaire, récapitulatifs et compteurs quotidiens utilisent la même règle.

**Aucune réécriture massive des anciens horodatages** : ils sont conservés. La confirmation
contrôle les instants déjà enregistrés pour les anciens dossiers, plutôt que de les convertir
à nouveau. Vérifier auprès de l'équipe les anciens dossiers créés avec un fuseau mal configuré.

## Protection contre les doublons

`POST /api/reservations` exige `Idempotency-Key`, UUID v4 aléatoire. Le navigateur conserve
la clé de sa dernière tentative pendant 24 h en sessionStorage (mémoire seule si stockage
refusé), avec uniquement une empreinte SHA-256 du formulaire. Aucun nom ni numéro de document
n'est ajouté à ce stockage. Rechargement dans le même onglet et perte de réponse conservent
la clé pour la même saisie. Un verrou synchrone empêche deux envois du même composant.

Le serveur normalise le formulaire puis vérifie clé et empreinte dans **la même transaction**
que la création. Même clé/même contenu : même dossier, y compris après confirmation ou
annulation. Même clé/contenu différent : 409, aucune écriture et aucun reçu nouveau.
Une validation échouée ne consomme pas la clé. Les reprises après commit sont reconnues avant
les contrôles d'heure/disponibilité, sans recalculer le tarif enregistré.

La base ne conserve que `idempotency_key_hash` et `request_hash`, deux colonnes textuelles
nullables ajoutées de façon compatible au bootstrap, avec un index unique partiel sur la clé.
Aucun de ces champs n'est exposé au planning public ni au reçu privé. Les anciennes lignes
sans clé restent lisibles. Les appels internes sans clé restent possibles ; l'API publique,
elle, n'accepte plus de création sans clé. Les dossiers de reprise ne sont pas supprimés.

En développement JSON, les mutations d'un processus sont sérialisées et les écritures se font
par remplacement atomique. Cela n'est pas un verrou multi-processus : PostgreSQL reste
obligatoire en production. La structure de persistance par snapshot n'est pas refondue ici.

## Vérifications

La suite exécute les sources réelles : sécurité de la passe 1, API, historique, moteur,
changements d'heure, hôtes UTC/Paris/Los Angeles/Tokyo, nouvelles fiches, stockage navigateur,
répétitions locales concurrentes et deux processus PostgreSQL indépendants avec la même clé.
Les tests PostgreSQL utilisent exclusivement `TEST_DATABASE_URL` et une base jetable.
Lint sans avertissement, build Next et typecheck sont conservés dans la CI.

## Déploiement et limites

- Sauvegarder la base et déployer le code complet ; le rôle SQL doit pouvoir ajouter les deux
  colonnes et l'index. L'initialisation conserve le verrou transactionnel existant.
- Purger les anciens caches de déploiement. Les onglets déjà ouverts avant le changement
  d'API doivent être rechargés pour envoyer la nouvelle clé ; sans clé, la requête est refusée.
- Les secrets sécurisés de la passe 1 restent nécessaires ; aucun nouveau secret n'est introduit.
- Une nouvelle clé dans un autre navigateur ou après expiration est une nouvelle demande.
  L'idempotence ne remplace ni un contrôle anti-abus ni une limitation de débit distribuée.
- Le planning affiché reste un instantané. Toute confirmation est revérifiée au serveur ;
  rafraîchissement temps réel, pagination/archivage, rétention, optimisation des écritures SQL,
  limites d'upload et tests sur téléphone réel restent hors de cette passe.
- Pas d'accès ni de mutation des dossiers, variables d'hébergement ou sauvegardes de production.

Références techniques :
- https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
