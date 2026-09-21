# Passe 1 — sécurité et données

## Périmètre

- Administration sans identifiants ni secret de secours. Les valeurs absentes, trop courtes,
  les secrets « change me » et l'ancien mot de passe publié sont refusés.
- Nouvelle session admin v2, signée et liée au mot de passe actuel. Les anciens cookies sont
  invalides. Rotation du mot de passe = révocation des sessions admin ; rotation du secret =
  révocation de toutes les sessions et des reçus privés.
- DTO public à liste blanche : identifiants anonymisés, véhicule, dates, mode et état d'occupation.
  Aucun nom, email, téléphone, numéro de document, référence commerciale ou note libre.
  Les demandes en attente et les dossiers clos ne sont pas diffusés au catalogue.
- Après création, reçu privé dans un cookie HttpOnly, SameSite=Lax, Secure en production,
  limité à `/api/reservations` et valable 14 jours. `GET /api/reservations` vérifie la signature,
  son usage et sa durée avant de consulter exclusivement ce dossier. Aucune recherche publique
  par identifiant ou référence. Réponse `private, no-store`. Un cookie admin ne vaut pas reçu.
- Le navigateur ne déclare plus une demande enregistrée sur la seule base d'un formulaire prêt
  ou d'une valeur de son stockage. Le suivi est actualisé depuis le reçu privé.
- Réservation refusée/annulée/terminée = dossier conservé et blocage libéré, pas suppression.
  Un retour n'est jamais présumé à l'heure prévue. L'admin enregistre explicitement le retour.
  Les formulaires obsolètes ne peuvent pas rouvrir un dossier clos. Les véhicules liés à un
  historique doivent être masqués, pas supprimés.
- API : schéma à l'exécution, enums et consentement stricts, tailles des champs bornées,
  JSON limité à 32 Kio pendant la lecture, erreurs techniques non exposées.
- Brouillon personnel conservé dans sessionStorage au plus deux heures, jamais dans localStorage.
  Numéros de document/permis, notes et consentement ne sont pas persistés dans le navigateur.
  Purge de l'ancien localStorage lors de l'ouverture du tunnel et suppression du brouillon après envoi.
- Nouvelles clés de cache public pour ne pas réutiliser l'ancienne projection privée, invalidation
  catalogue/planning après mutation, pool PostgreSQL réutilisé aussi en production.
- Next.js et eslint-config-next 15.5.24, avec lockfile régénéré par npm, sans passage à Next 16.
  Référence : https://nextjs.org/blog (release de sécurité d'août 2026).

## Avant le déploiement

1. Sauvegarder la base et vérifier une restauration sur une base de test.
2. Renseigner `ADMIN_USERNAME`, un nouveau `ADMIN_PASSWORD` d'au moins 12 caractères, et un
   nouveau `ADMIN_SESSION_SECRET` aléatoire d'au moins 32 caractères côté hébergeur.
   Exemple de génération locale du secret : `openssl rand -hex 32`.
   Ne jamais copier de véritables identifiants dans le dépôt, les tests ou une Pull Request.
3. Vérifier `DATABASE_URL` et la configuration Cloudinary existantes. Aucun secret de
   l'hébergeur n'est modifié par cette passe GitHub.
4. Déployer puis purger les anciens caches/CDN de l'hébergement. Les nouveaux tags empêchent
   de relire l'ancien cache de données ; une éventuelle réponse déjà présente dans un CDN
   externe doit aussi être supprimée côté hébergeur.
5. Vérifier la connexion admin, une demande de test, sa confirmation, son suivi privé,
   son annulation puis sa présence dans l'historique. Vérifier un navigateur non connecté :
   le catalogue reste accessible, le suivi privé renvoie 404.

Sans secret valide, l'admin est fermé et les nouvelles demandes répondent 503 **avant** toute
écriture. Le catalogue public reste lisible. C'est intentionnel : aucun accès de secours.
Les utilisateurs ayant envoyé une demande avant cette passe n'ont pas le nouveau reçu ; ils
peuvent contacter l'équipe avec leur ancienne référence. Les dossiers déjà supprimés par
l'ancien code ne peuvent pas être reconstruits sans sauvegarde.

Le suivi concerne la dernière demande déposée dans ce navigateur. Une autre demande remplace
le reçu ; les anciens dossiers restent disponibles pour l'admin. Le marqueur de suivi est
limité à l'onglet et ne constitue jamais une autorisation. La disparition du cookie ou sa
rotation nécessite un contact avec l'équipe ; aucun mode anonyme de récupération n'est ajouté.

## Vérifications

`npm test` exécute les vrais modules TypeScript, avec des frontières Next.js isolées dans le
chargeur de tests. Il ne copie pas les implémentations dans les tests. Le build et le typecheck
Next vérifient en complément l'intégration et le contrat des pages/composants.

Le test PostgreSQL s'exécute uniquement lorsque `TEST_DATABASE_URL` est explicitement fourni.
Utiliser une base jetable : le store crée ses tables et persiste des fixtures. La CI fournit
un service PostgreSQL dédié, sans accès aux secrets de production.

## Hors périmètre / suite

- L'idempotence, la limitation d'abus distribuée (API et connexion), les règles de disponibilité
  future, les capacités, les dates passées et l'unification complète des fuseaux restent à traiter.
- Les écritures PostgreSQL réécrivent encore le snapshot sous verrou : leur refonte n'est pas
  faite ici. La conservation nécessite de prévoir pagination, archivage et politique de rétention.
- L'état réservé actuel reste bloquant pour les demandes futures ; cela sera séparé de
  l'occupation du créneau dans la passe moteur de réservation.
- La conservation de l'historique n'autorise pas une rétention illimitée des données personnelles.
  Définir la durée et un mécanisme de suppression/anonymisation explicite et traçable.
- Aucun audit de configuration réelle Netlify/Cloudinary, aucune rotation réelle des secrets,
  aucun test sur téléphone réel ni restauration de sauvegarde de production n'est réalisé ici.

## Dépendances de sécurité complémentaires

Next.js reste sur 15.5.24. Le graphe transitif de cette version conserve des bibliothèques
signalées par npm : override PostCSS 8.5.23 et Sharp 0.35.4 (également dépendance runtime
explicite). Ces overrides ne doivent pas être retirés tant que le parent ne fournit pas
une version corrigée. Les autres correctifs compatibles sont résolus par npm sans --force.
Un test encode puis décode AVIF et WebP avec le véritable Sharp ; le build Next complet
valide l'intégration PostCSS/Tailwind. L'audit doit être relancé après toute mise à jour.

Sources des mainteneurs :
- https://github.com/postcss/postcss/security/advisories/GHSA-fxqj-rqcc-2cmp
- https://github.com/lovell/sharp/security/advisories/GHSA-rgj7-g3m4-5g8c
- https://sharp.pixelplumbing.com/changelog/v0.35.4/
