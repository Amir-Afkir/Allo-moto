# Passe 3 — qualité et contrôles de parcours

Base : main `7e08deb807e4cc2b41a0c8f8c86f773dbb6b5709`.

## Correctifs

- Le sélecteur d'image ne vide plus `input.files` lorsqu'il crée l'aperçu. Un fichier
  invalide efface seulement la sélection en attente et conserve l'image enregistrée.
- Limite commune de **4 Mio** par image (affichée 4 Mo dans l'interface), et limite
  Server Actions de 5 Mio pour le multipart. L'ancienne annonce de 10 Mo était incompatible
  avec la limite Next par défaut. Le plafond effectif du proxy/hébergeur reste à vérifier.
- JPEG, PNG, WebP et AVIF uniquement, décodage des octets réels avec Sharp, images limitées
  à 40 mégapixels, rejet des animations et fichiers illisibles. Réorientation EXIF,
  réduction à 2400 × 2400 au plus, encodage WebP et suppression des métadonnées avant stockage.
  L'extension du nom fourni ne détermine plus le format de stockage.
- Upload/suppression Cloudinary avec délai maximum de 15 secondes ; réponse d'upload
  contrôlée (compte, domaine, protocole et identifiant). Aucun identifiant Cloudinary réel
  n'est utilisé dans les tests.
- Les champs véhicule sont validés avant upload et dans la couche de sauvegarde :
  énumérations fermées, champs obligatoires, longueurs bornées, prix/km entiers de 0 à 1 000 000.
  Le modèle SQL existant reste en euros entiers ; aucun changement implicite vers les centimes.
- Un formulaire obsolète pointant vers une moto supprimée est refusé au lieu de la recréer.
  L'ancien fichier n'est supprimé qu'après sauvegarde ; un échec de sauvegarde nettoie seulement
  la nouvelle image. Les champs ont des labels associés, contraintes HTML et bouton d'envoi occupé.
- Un fichier JSON local corrompu ou illisible n'est plus remplacé silencieusement par les seeds.
  L'absence réelle du fichier permet toujours son initialisation en développement. PostgreSQL
  reste nécessaire pour les écritures de production.
- Une erreur de chargement a une page générique et un bouton Réessayer, sans erreur interne affichée.

## Validation reproductible

`npm ci`, `npm run lint -- --max-warnings=0`, `npm test`, `npm run build`,
`npm run typecheck`, `npm audit --audit-level=moderate`.

La CI ajoute Playwright, Chromium desktop et WebKit avec viewport/tactile iPhone simulés.
Les scénarios utilisent le vrai serveur Next en développement, ses actions/API et une base
PostgreSQL jetable, jamais une API de réservation simulée. Le build de production est vérifié
séparément par `npm run test:production` : vrai build puis `next start`, avec des dossiers
personnels fictifs dans un snapshot jetable. Les réponses HTML/RSC du public sont vérifiées
sans se limiter au DOM visible. Le contrôle est réservé au checkout GitHub Actions ; il
restaure le seed original dans un finally et ne se connecte à aucune base. `next dev` peut
émettre des traces internes : il ne doit jamais être exposé comme service de production.
Le traitement des images est aussi testé avec la bibliothèque native réelle.
Les erreurs navigateur, pages invalides, confidentialité et fichier envoyé de plus d'un Mio
font partie des contrôles. Les noms, documents et identifiants des fixtures sont fictifs.

Pour lancer le navigateur localement : créer une base locale dont le nom se termine par
`_e2e`, renseigner **uniquement** `E2E_DATABASE_URL`, installer les navigateurs via
`npx playwright install chromium webkit`, puis `npm run test:e2e`.
La configuration refuse toute base distante, ne réutilise aucun serveur existant et injecte
un compte d'administration fictif et un secret aléatoire uniquement au serveur de test.
Elle écrit des données de test dans cette base et des images locales sous `public/uploads`.
Les rapports/fixtures de runtime sont ignorés par Git ; la CI n'archive les traces qu'en échec.

## Déploiement et limites

Pas de migration SQL ni de nouveau secret pour cette passe. Déployer l'ensemble et conserver
les variables sécurisées des passes 1 et 2. Les images existantes ne sont pas retraitées en masse.
Tester les uploads sur le véritable hébergeur (limites de requête, exécution native Sharp,
Cloudinary). Des photos plus lourdes devront être réduites sous 4 Mio avant envoi.

Aucune base ni variable d'hébergement de production modifiée. WebKit simulé ne remplace pas
un test sur iPhone physique. La politique de rétention/anonymisation, la limitation d'abus
multi-instance, le chargement paginé SQL et l'optimisation des écritures par snapshot restent
à définir ; aucune suppression automatique de dossiers n'a été ajoutée. La validation de
la configuration de production reste distincte d'une CI verte.

Références :
- https://nextjs.org/docs/15/app/api-reference/config/next-config-js/serverActions
- https://sharp.pixelplumbing.com/api-constructor/
- https://playwright.dev/docs/test-webserver
