# Plan mobile front - Allo Moto

## Direction retenue

Le style mobile le plus cohérent pour Allo Moto est un **premium roadbook mobile** :

- grands visuels utiles, jamais répétés inutilement ;
- fonds chauds, surfaces crème, séparateurs fins ;
- peu de cards, davantage de listes tactiles et de sections pleine largeur ;
- CTA accessibles au pouce ;
- micro-interactions sobres ;
- contenu local, direct, rassurant.

L’objectif n’est pas de transformer le site en application native, mais de donner une sensation mobile 2026 : claire, tactile, rapide à scanner, avec une hiérarchie très nette.

## Standard top 1%

Le rendu mobile doit retirer du poids avant d’ajouter des effets.

À viser :

- moins de chrome visible ;
- moins de beige uniforme ;
- images moins voilées ;
- CTA dominants mais élégants ;
- navigation secondaire discrète ;
- typographie forte, mais jamais massive au point d’écraser l’écran.

À refuser :

- une homepage qui ressemble à un desktop compressé ;
- des rails de navigation qui ressemblent à des boutons concurrents ;
- des overlays crème qui lavent les photos ;
- des bandes basses qui deviennent des mini-sections ;
- des badges trop grands pour leur texte.

## Principes globaux

### 1. Une décision par écran

Chaque section mobile doit pousser une décision unique :

- choisir une moto ;
- se projeter dans une balade ;
- comprendre comment réserver ;
- vérifier permis et équipement ;
- contacter ou lire la FAQ.

Si une section demande deux actions concurrentes, le CTA principal doit être visuellement dominant et le second rester discret.

### 2. Images comme scènes, pas comme vignettes

Les images doivent servir à créer une immersion forte :

- une grande image par contexte ;
- pas de répétition du même visuel dans les cartes et le détail ;
- overlay uniquement si nécessaire pour la lisibilité ;
- éviter les miniatures décoratives qui alourdissent le mobile.

### 3. Moins de cards, plus de lignes

Sur mobile, les empilements de cards deviennent vite lourds. Priorité aux patterns suivants :

- listes avec séparateurs ;
- lignes sélectionnables ;
- accordéons ;
- bandes pleine largeur ;
- panneaux visuels uniques.

Les cards restent utiles pour les motos et les items réellement répétés, mais elles ne doivent pas devenir le pattern par défaut.

### 4. CTA au pouce

Les actions importantes doivent avoir une zone tactile confortable :

- viser 44-48 px de hauteur minimum ;
- boutons pleine largeur sur mobile quand l’action est critique ;
- éviter les petites pilules disproportionnées ou difficiles à toucher ;
- prévoir un CTA sticky seulement sur les pages où la décision d’achat/réservation est active.

### 5. Glass léger et fonctionnel

Les effets type glass/blur peuvent être utilisés uniquement pour :

- header ;
- dock CTA ;
- badges sur photo ;
- contrôles flottants.

Ne pas les utiliser comme décoration de contenu. Le fond crème, les photos et les séparateurs fins doivent rester la base.

## Ordre homepage recommandé

1. Hero
2. Motos mises en avant
3. Balades autour d’Orléans
4. Comment réserver
5. Équipement & permis
6. Aide
7. FAQ

Cet ordre correspond au parcours mental mobile :

- je comprends l’offre ;
- je vois les motos ;
- je me projette dans une sortie ;
- je comprends le processus ;
- je vérifie les prérequis ;
- je contacte si besoin ;
- je consulte les réponses courtes.

## Section par section

### Hero

#### Solution retenue

Garder un hero immersif, mais le rendre plus éditorial, moins lavé, moins massif et plus direct sur mobile.

#### Mobile optimal

- Image plein écran conservée.
- Titre court, très lisible, moins massif.
- CTA principal visible sans scroll si possible.
- Réduire fortement la hauteur occupée par la preuve basse.
- Garder une seule action principale : `Voir les disponibilités`.
- Préférer un signal local fort : `Louez votre moto à Orléans.`
- Réduire l’overlay crème pour laisser l’image respirer.

#### À éviter

- Ajouter plusieurs CTA dans le hero.
- Ajouter un long texte d’explication.
- Laisser les éléments bas du hero trop hauts sur les petits écrans.

#### Critères d’acceptation

- Sur 360 px de large, le titre ne déborde pas.
- Le CTA principal est visible et tactile.
- Le bas du hero laisse comprendre qu’il y a du contenu après.
- L’image ne paraît pas délavée.
- La bande basse ne ressemble pas à une deuxième section.

### Header mobile

#### Solution retenue

Transformer le header mobile en chrome compact, orienté action, avec un rail secondaire presque textuel.

#### Mobile optimal

- Ligne marque + CTA `Réserver` ou `Motos`.
- Navigation secondaire horizontale beaucoup plus discrète.
- Réduire la hauteur totale du header.
- Conserver le scroll horizontal si toutes les ancres restent visibles.
- Éviter d’ajouter trop d’items dans le header mobile.
- Réduire le poids visuel du logo et du CTA.
- Éviter que les ancres ressemblent à quatre boutons.

#### À considérer

Un dock bas peut remplacer une partie de la pression du header :

- header = identité + navigation légère ;
- dock = action de réservation.

#### Critères d’acceptation

- Le header ne mange pas plus que nécessaire au-dessus du hero.
- Les items sont tapables.
- La navigation reste lisible sans casser sur 360 px.
- Le rail ne concurrence pas le CTA `Réserver`.
- La zone blanche avant le hero est minimale.

### Motos mises en avant

#### Solution retenue

Garder une moto principale visuelle, puis présenter les autres modèles de façon plus compacte sur mobile.

#### Mobile optimal

- Moto principale en grand visuel.
- Modèles secondaires en liste ou cards moins hautes.
- Boutons bien séparés : `Voir la fiche` et `Choisir`.
- Infos essentielles visibles : prix, dépôt, permis.

#### À éviter

- Plusieurs grandes cards image les unes après les autres.
- Trop de badges sur une même ligne.
- Boutons côte à côte trop serrés.

#### Critères d’acceptation

- L’utilisateur identifie le prix, le permis et l’action en moins de 5 secondes.
- Les boutons passent pleine largeur si l’espace manque.

### Balades autour d’Orléans

#### Solution retenue

Conserver le pattern actuel : une grande image active + une liste compacte de parcours.

#### Mobile optimal

- Une seule grande image active.
- Choix d’itinéraires en lignes, pas en cards avec images répétées.
- Filtres `Court`, `Demi-journée`, `Journée` en segmented control.
- Détail actif immédiatement lisible.
- Étapes affichées en liste courte.

#### À éviter

- Répéter l’image dans les choix et dans le détail.
- Ajouter une vraie carte Mapbox.
- Ajouter une mini-carte décorative si elle n’aide pas la décision.

#### Critères d’acceptation

- Changer d’itinéraire change clairement l’image et le détail.
- Le choix actif est visible sans badge disproportionné.
- Le layout reste clair en 360 px.

### Comment réserver

#### Solution retenue

Timeline verticale simple, une étape par décision.

#### Mobile optimal

- Trois étapes maximum visibles avec titres courts.
- Image de fond conservée si lisible, sinon renforcer l’overlay.
- Chaque étape doit tenir en une lecture rapide.
- Pas de CTA concurrent ici si le CTA est déjà présent avant/après.

#### À éviter

- Trop de texte dans chaque étape.
- Panneau flottant trop haut ou trop lourd.
- Cards imbriquées.

#### Critères d’acceptation

- Les trois étapes sont compréhensibles en scrollant rapidement.
- L’image ne gêne jamais la lecture.

### Équipement & permis

#### Solution retenue

Checklist statique et scannable après `Comment réserver`.

#### Mobile optimal

- Bloc `Matériel` puis bloc `Permis`.
- Lignes séparées, pas de cards.
- Texte prudent : `selon disponibilité`, `à confirmer`, `vérifié avant départ`.
- CTA à la fin : `Voir les motos compatibles`.
- WhatsApp secondaire si configuré.

#### À éviter

- FAQ intégrée dans cette section.
- Promettre que le matériel est toujours inclus si ce n’est pas garanti.
- Ajouter des images.

#### Critères d’acceptation

- L’utilisateur comprend quoi apporter.
- L’utilisateur comprend A1 / A2 / A sans ouvrir une autre page.
- Les CTA ne perturbent pas la lecture.

### Aide

#### Solution retenue

Garder la section comme point de contact principal.

#### Mobile optimal

- WhatsApp très visible.
- Carte ou point d’accueil utile, mais pas prioritaire sur le contact.
- Topics `Permis`, `Dépôt`, `Retrait` en boutons tapables.
- Liens secondaires clairs : carte, appeler, conditions.

#### À éviter

- Mettre la FAQ avant le support si l’objectif est d’associer FAQ et aide.
- Cacher WhatsApp sous trop de contenu.
- Carte trop haute si elle repousse les actions.

#### Critères d’acceptation

- Le visiteur comprend comment poser une question.
- Les actions contact sont accessibles au pouce.

### FAQ

#### Solution retenue

Section dédiée après `Aide`, en accordéon compact.

#### Mobile optimal

- Questions fermées par défaut.
- Une seule question ouverte à la fois.
- Bouton `+` clair et zone tactile large.
- Texte de réponse court.
- Pas de CTA supplémentaire si la section `Aide` est juste avant.

#### À éviter

- Réponses toutes visibles par défaut.
- Accordéon dans une card lourde.
- Longues réponses légales.

#### Critères d’acceptation

- `aria-expanded` et `aria-controls` présents.
- La question ouverte ne provoque pas de saut visuel excessif.
- La FAQ reste compacte sur mobile.

### Footer

#### Solution retenue

Footer utile, mais compressé sur mobile.

#### Mobile optimal

- Contact et action principale avant les liens légaux.
- Liens en colonnes simples.
- Pas de répétition excessive des ancres déjà présentes dans le header.

#### À éviter

- Footer trop long avec trop de sections.
- Liens secondaires qui concurrencent le CTA de réservation.

#### Critères d’acceptation

- Le footer reste lisible et ne donne pas une impression de bloc administratif.

## Catalogue mobile

### Solution retenue

Prioriser le choix rapide : filtre, disponibilité, fiche, réservation.

### Mobile optimal

- Filtres accessibles en haut, en barre sticky compacte.
- Motos en cards ou liste hybride selon densité.
- Afficher clairement : permis, prix, dépôt, disponibilité.
- CTA primaire par modèle : `Choisir`.
- CTA secondaire : `Voir la fiche`.

### À éviter

- Trop de filtres visibles à la fois.
- Cards trop hautes qui cachent la comparaison.
- Boutons trop proches.

### Critères d’acceptation

- L’utilisateur peut comparer au moins deux modèles dans un scroll court.
- Les filtres ne masquent pas le contenu.

## Fiche moto mobile

### Solution retenue

Fiche orientée décision : visuel, prix, permis, dépôt, réservation.

### Mobile optimal

- Image forte en haut.
- Résumé prix/permis/dépôt immédiatement visible.
- CTA sticky bas `Vérifier mes dates`.
- Contenu détaillé en sections compactes.
- Alternatives en bas, pas avant la décision principale.

### À éviter

- Trop de storytelling avant le prix et le permis.
- CTA perdu au milieu du scroll.

### Critères d’acceptation

- En haut de page, l’utilisateur sait si la moto est dans son budget et son permis.
- Le CTA reste accessible après scroll.

## Tunnel réservation mobile

### Solution retenue

Le tunnel doit rester le plus fonctionnel et sobre du site.

### Mobile optimal

- Étapes visibles mais compactes.
- Champs pleine largeur.
- Résumé sticky ou dock bas selon étape.
- Erreurs proches du champ concerné.
- Boutons principaux pleine largeur.

### À éviter

- Effets visuels décoratifs.
- Plusieurs actions principales dans le même écran.
- Résumé trop long qui pousse le formulaire.

### Critères d’acceptation

- Chaque étape a une action principale claire.
- Le formulaire reste utilisable à une main.

## Priorités d’exécution

### Priorité 1 - Mobile homepage

1. Compacter le header mobile.
2. Alléger le rail du header pour qu’il ne ressemble plus à des boutons.
3. Vérifier le hero en 360 px.
4. Réduire l’overlay crème du hero.
5. Simplifier la bande basse du hero.
6. Stabiliser la section balades.
7. Confirmer l’ordre : process, équipement, aide, FAQ.

### Priorité 2 - Conversion mobile

1. Ajouter ou harmoniser les CTA sticky sur catalogue et fiche moto.
2. Revoir les cards motos secondaires.
3. Optimiser les filtres du catalogue.

### Priorité 3 - Finition premium

1. Ajuster les micro-interactions.
2. Réduire les badges trop grands.
3. Harmoniser les séparateurs et espacements.
4. Tester sur 360, 390, 430 et tablette.

## Tests recommandés

### Viewports

- 360 x 800
- 390 x 844
- 430 x 932
- 768 x 1024

### Parcours à tester

1. Accueil vers disponibilité.
2. Accueil vers balade puis catalogue.
3. Catalogue vers fiche moto.
4. Fiche moto vers réservation.
5. Réservation étape par étape.
6. Aide vers WhatsApp.

### Vérifications

- aucun texte ne déborde ;
- tous les boutons sont tapables ;
- les headers sticky ne cachent pas les ancres ;
- les images ne provoquent pas de layout shift visible ;
- le CTA principal est toujours identifiable ;
- `npm run lint`, `npm run typecheck`, `npm run build`.

## Décision finale

Le site doit évoluer vers une expérience mobile **sobre, tactile, locale et premium**.

La meilleure solution n’est pas d’ajouter plus d’effets, mais de mieux choisir où placer l’attention :

- image forte pour l’émotion ;
- liste compacte pour le choix ;
- CTA sticky pour l’action ;
- accordéon pour les réponses secondaires ;
- support visible pour lever les doutes.

Pour viser le top 1%, le premier écran doit être jugé sans indulgence :

- si le header attire autant que le hero, il est trop lourd ;
- si l’image paraît beige et plate, l’overlay est trop fort ;
- si le H1 occupe tout l’écran, la typographie est trop massive ;
- si les preuves ressemblent à des boutons, elles sont trop dessinées.
