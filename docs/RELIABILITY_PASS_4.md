# Passe 4 — tarifs, suivi et concurrence

Base : `b6b9fdff34311214364ea2bda5c3936023ef9940`. Pas de refonte graphique.

## Tarifs acceptés

Les demandes doivent inclure `expectedPricing` : tarif journalier entier, dépôt entier, devise EUR. Le serveur ne leur fait jamais confiance pour fixer le prix : il les compare aux conditions actuelles dans la transaction/verrou qui crée la réservation. Un désaccord renvoie HTTP 409 `PRICE_CHANGED`, les nouveaux montants et aucune réservation/cookie. Le client doit accepter le nouveau tarif puis envoyer à nouveau. Le tarif historique du reçu reste celui du dossier, même si le catalogue change. Une répétition idempotente de la demande déjà enregistrée renvoie le dossier initial, même après changement de prix ou de disponibilité. Les conditions acceptées entrent dans l’empreinte de la requête.

Ce n’est pas une garantie de prix avant enregistrement, ni une intégration de paiement. Aucun prix historique n’est réécrit. Les anciens onglets sans `expectedPricing` doivent être rechargés.

## Éditions admin concurrentes

Chaque formulaire existant contient une empreinte canonique des champs persistés du véhicule. Le serveur vérifie cette révision avant l’upload puis à nouveau dans la transaction. Deux éditions divergentes issues d’une même fiche ne peuvent pas écraser leurs modifications mutuelles : le perdant doit recharger et réappliquer ses changements. L’intention de photo `keep` se résout depuis le véhicule sous verrou, pas depuis une ancienne URL. Seul l’asset remplacé et non référencé ailleurs est candidat au nettoyage après commit ; un upload perdant est nettoyé sans toucher au gagnant. Une erreur de cache après commit ne simule pas un rollback. Les formulaires ouverts avant déploiement devront être rechargés.

Pas de nouvelle colonne : l’empreinte porte sur les données persistées existantes. La protection vaut entre processus/PostgreSQL, pas seulement entre onglets. Les appels directs internes à `saveVehicle` avec un `currentSlug` doivent transmettre `expectedRevision`.

## Suivi privé et récupération

Les cookies v3 sont distincts par réservation, signés, HttpOnly, Secure en production, SameSite=Lax et restreints à `/api/reservations`. L’ancien cookie v2 reste reconnu. Les identifiants publics placés dans l’URL servent uniquement à sélectionner un reçu : un identifiant seul n’autorise aucun accès. Le serveur vérifie les capacités signées avant toute lecture ciblée. Le reçu ne contient ni identité/contact, ni documents, ni notes privées.

Le tunnel consulte les cookies même si sessionStorage est vide ou inaccessible. `/reserver?stage=confirmed` propose les demandes récentes du navigateur ; un lien avec `reservationId` ouvre le reçu correspondant. Le reçu comporte les dates et montants persistés et se rafraîchit au retour dans l’onglet et toutes les 30 secondes lorsque la page est visible.

Limites explicites : huit demandes récentes dans la liste, cookies valides quatorze jours comme auparavant. Le prochain POST élimine les anciennes capacités excédentaires. Des POST simultanés peuvent temporairement dépasser huit cookies sans qu’ils s’écrasent. Le code limite à 32 cookies candidats la vérification. Ce n’est pas un compte client ni un lien transférable : suppression des cookies, expiration, rotation du secret ou autre appareil nécessitent de contacter Allo Moto. Aucun email de récupération n’est envoyé.

## Navigation, dates et support

L’étape est synchronisée avec les liens et l’historique du navigateur sans remontage forcé du dossier. Changer de sélection réinitialise la validation et les tarifs acceptés sans modifier les dossiers existants.

Les dates automatiques du catalogue et des fiches sont recalculées après hydratation puis au retour dans l’onglet/jour suivant ; une date choisie par l’utilisateur n’est jamais remplacée automatiquement. Le rendu initial ne contient plus une date calculée une seule fois lors du chargement du module.

Les coordonnées vides ou hors limites ne deviennent plus 0,0. L’absence d’adresse ne lance pas une recherche sur « France ». Le géocodage a un délai maximal de 2,5 secondes ; un échec préserve les contacts et ne reste pas mémorisé indéfiniment. Les numéros de support français sont normalisés, les numéros client manifestement invalides sont refusés. Il s’agit d’un contrôle de plausibilité, pas d’une vérification de propriété du numéro.

## Validation reproductible

- `npm test` : tests serveur, formats natifs, API, prix, cookies, nettoyage d’images et concurrence. Le cas PostgreSQL requiert `TEST_DATABASE_URL` jetable et inclut deux processus indépendants pour les conflits d’édition.
- `npm run test:production` : build Turbopack et six contrôles HTTP avec dossiers personnels fictifs ; uniquement en CI jetable.
- `E2E_DATABASE_URL=.../allo_moto_e2e npm run test:e2e` : nouveau build production et vrai `next start`, PostgreSQL local jetable avec TLS activé, proxy HTTPS avec certificat local. Aucun affaiblissement de Secure dans le code applicatif. Les scénarios couvrent Chromium bureau et WebKit mobile simulé, sans nouvelle tentative automatique.
- Le fournisseur Cloudinary est simulé **uniquement** par un preload Node du lanceur de test. L’authentification, les Server Actions, le décodage/normalisation, la signature, la persistance et l’optimiseur Next restent réellement traversés. Ce n’est pas un test du compte Cloudinary ou de Netlify en production.

La CI permanente exécute lint sans avertissement, tests, build/contrôles HTTP, typage, audit npm et navigateur. Les preuves exactes et nombres finaux sont consignés dans la PR et les logs de CI.

## Déploiement et périmètre restant

Aucun nouveau secret ni migration SQL. Déployer le code complet, conserver les secrets sécurisés des passes précédentes, recharger les onglets admin/client et vérifier le domaine HTTPS réel. Sauvegarder la base reste recommandé. Les limites de l’hébergeur, les cookies et les uploads sur téléphone physique/Cloudinary réel restent à tester.

Ne sont pas corrigés dans cette passe : limitation anti-abus distribuée, pagination/rétention, remplacement des écritures SQL par snapshot, protection administrative de main, mentions légales à compléter avec l’identité réelle et audit visuel exhaustif. Aucun historique client ni secret de production n’est modifié par ces travaux.
