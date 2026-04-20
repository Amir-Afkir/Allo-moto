# Plan hero mobile - Allo Moto

## Objectif

Le hero mobile doit faire comprendre en moins de 5 secondes :

- Allo Moto loue des motos à Orléans ;
- la réservation est simple ;
- l’action principale est de voir les disponibilités.

Le hero doit rester immersif, mais il ne doit pas prendre tout l’écran au détriment de la lecture et du CTA.

## Solution retenue

Conserver un hero visuel fort, mais le transformer en **hero mobile éditorial compact** :

- image en plein fond ;
- texte plus court et mieux placé ;
- CTA visible dans le premier écran ;
- bande basse plus légère ;
- moins de chips ;
- hauteur ajustée au header mobile compact.

Le hero doit donner une sensation premium roadbook : départ, route, simplicité, pas page marketing générique.

## Audit visuel actuel

Le rendu observé est cohérent, mais encore trop massif pour viser un niveau top 1%.

Problèmes principaux :

- l’image est trop lavée par l’overlay crème ;
- le H1 prend trop de hauteur et devient un mur typographique ;
- le sous-texte manque de contraste ;
- le CTA est efficace mais trop lourd visuellement ;
- la bande basse ressemble à une deuxième section ;
- l’ensemble header + hero + bande basse donne une impression de page compressée depuis desktop.

Décision stricte :

- enlever du poids visuel avant d’ajouter quoi que ce soit ;
- renforcer l’image au lieu de la voiler ;
- réduire légèrement le H1 ;
- rendre la bande basse presque éditoriale, pas promotionnelle ;
- garder le CTA dominant mais plus élégant.

## Problèmes actuels à corriger

### 1. Titre trop rigide

Le titre utilise des lignes `whitespace-nowrap`.

Risque :

- débordement ou compression sur 360 px ;
- manque de souplesse en français ;
- rendu trop fragile si le texte change.

Décision :

- retirer `whitespace-nowrap` sur mobile ;
- garder éventuellement des lignes contrôlées seulement à partir de `sm` ou `lg` ;
- utiliser `text-balance` et une largeur max adaptée.

### 2. H1 trop massif visuellement

Le H1 actuel est lisible, mais trop lourd sur mobile.

Risque :

- le premier écran paraît agressif ;
- le message occupe trop de hauteur ;
- le CTA descend et perd en élégance.

Décision :

- réduire légèrement le clamp mobile ;
- viser 2 à 3 lignes, pas 4 lignes massives ;
- réduire le tracking négatif ;
- ne pas chercher à remplir toute la largeur.

Recommandation :

```tsx
text-[clamp(2.35rem,11.5vw,3.45rem)]
leading-[0.96]
tracking-[-0.025em]
```

### 3. Hero trop haut dans la pratique

Le conteneur est en `100svh`, plus le header fixed et une bande basse.

Risque :

- le CTA peut être trop haut ou trop bas selon appareil ;
- la section suivante est peu visible ;
- sensation de page bloquée sur certains mobiles.

Décision :

- garder `min-h-[calc(100svh-var(--chrome-offset))]` ou une hauteur dédiée mobile ;
- viser une hauteur utile de 78-88 svh sous header ;
- laisser un indice visuel de la section suivante.

### 4. Image trop délavée

L’overlay mobile actuel peut trop blanchir l’image.

Risque :

- la photo perd son émotion ;
- le hero devient beige uniforme ;
- la moto et le visage paraissent secondaires.

Décision :

- protéger la zone texte, pas toute l’image ;
- réduire l’opacité crème sur le centre et la droite ;
- garder plus de contraste sur la moto ;
- utiliser un gradient localisé haut/gauche + bas léger.

### 5. Bande basse trop dense

La bande basse contient :

- un h2 ;
- une phrase ;
- trois chips.

Risque :

- elle consomme trop de hauteur mobile ;
- elle répète l’idée du hero ;
- les chips ressemblent à un bloc promotionnel.

Décision :

- sur mobile, réduire la bande basse ;
- garder une seule ligne forte + 2 ou 3 preuves compactes ;
- ou déplacer les chips dans une rangée plus fine ;
- ne pas multiplier les textes secondaires.

### 6. CTA unique mais trop massif

Le CTA `Voir les disponibilités` est bon, mais sa masse visuelle doit être mieux dosée.

Décision :

- CTA pleine largeur ou presque sur mobile ;
- hauteur 44-48 px minimum ;
- position proche du texte principal ;
- rayon moins “bannière” si le bouton paraît trop rond ;
- padding vertical précis ;
- pas de CTA secondaire dans le hero.

## Structure mobile cible

```text
[Header compact fixed]

Image moto plein fond

Louez votre moto
à Orléans.

Créneau, modèle, dossier : tout est guidé.

[Voir les disponibilités]

--------------------------------
Prix clair · Dépôt annoncé · Support réactif
```

## Contenu recommandé

### H1

Option recommandée top 1% :

```text
Louez votre moto
à Orléans.
```

Pourquoi :

- plus court ;
- plus local ;
- meilleur signal SEO/local ;
- moins massif que “en quelques minutes”.

Option conservatrice :

```text
Louez votre moto
en quelques minutes.
```

Utiliser l’option conservatrice seulement si la promesse “quelques minutes” est jugée plus importante que le signal local.

### Sous-texte

Version actuelle :

```text
Définissez votre créneau, comparez les motos vraiment réservables, puis finalisez le dossier.
```

Version mobile recommandée :

```text
Créneau, modèle, dossier : tout est guidé.
```

Raison :

- plus court ;
- plus mémorisable ;
- meilleure lisibilité sur petit écran.

La version longue peut rester sur desktop.

### CTA

Texte :

```text
Voir les disponibilités
```

Lien :

```text
/motos#availability
```

Ne pas ajouter d’autre CTA.

### Bande basse

Version recommandée top 1% :

```text
Prix clair · Dépôt annoncé · Support réactif
```

Ne pas afficher de h2 dans la bande basse sur très petit écran si cela rend le hero trop lourd.

Version conservatrice :

```text
Définissez le bon créneau.
Prix clair
Dépôt annoncé
Support réactif
```

Sur mobile, les preuves doivent être petites, horizontales et calmes. Elles ne doivent pas ressembler à trois gros boutons.

## Design cible

### Image

Conserver `/baniere/baniere.png`.

À vérifier :

- le sujet principal reste visible sur 360 px ;
- le texte ne tombe pas sur une zone trop contrastée ;
- l’object-position mobile peut être différent du desktop.

Recommandation :

- mobile : `object-[58%_50%]` ou ajuster après screenshot ;
- desktop : conserver le cadrage actuel si validé.
- réduire l’overlay pour que le motard et la moto ne paraissent pas délavés.

### Overlay

L’overlay actuel est horizontal, très adapté desktop.

Sur mobile, préférer un overlay localisé :

- protection du texte en haut/gauche ;
- très faible voile sur le centre/droite ;
- légère assise en bas pour le CTA ou la preuve ;
- moins de crème global.

Décision :

- utiliser un overlay mobile spécifique ;
- garder l’overlay desktop actuel à partir de `lg`.
- éviter un hero beige uniforme.

### Typographie

H1 mobile :

- taille cible top 1% : `clamp(2.35rem, 11.5vw, 3.45rem)` ;
- line-height : `0.96` ;
- éviter les `tracking` trop négatifs sur mobile ;
- ne pas utiliser `whitespace-nowrap`.

Sous-texte :

- taille : 0.98-1rem ;
- line-height : 1.55-1.65 ;
- largeur max : 21-24rem.

### Espacement

Le texte doit commencer sous le header compact avec assez d’air :

- padding top mobile : environ `calc(var(--chrome-offset) + 1.25rem)` si le hero ne compense pas déjà le header ;
- sinon une valeur fixe autour de `pt-28` peut rester, mais doit être testée après l’offset header réduit.

La zone CTA doit être proche du sous-texte :

- `mt-5` ou `mt-6`.

### Bande basse

Style :

- fond crème translucide ;
- border-top fine ;
- blur très léger ;
- padding mobile réduit : `py-2.5` à `py-3`.

Chips :

- hauteur compacte ;
- texte 10-11 px ;
- pas de grosses pilules ;
- option top 1% : remplacer les chips par une ligne de preuves séparées par des points ;
- gap réduit.

## Layout par breakpoint

### 360 px

Objectif :

- logo + CTA du header visibles ;
- H1 lisible sans débordement ;
- CTA visible sans scroll excessif ;
- bande basse compacte.

### 390-430 px

Objectif :

- H1 peut respirer ;
- sous-texte complet visible ;
- CTA dans la première moitié basse de l’écran ;
- début de la bande basse visible.

### `sm`

Objectif :

- réintroduire une ligne de titre plus contrôlée si nécessaire ;
- CTA peut rester largeur naturelle ;
- bande basse peut afficher un peu plus de texte.

### `lg+`

Objectif :

- conserver le rendu desktop actuel autant que possible ;
- ne pas casser le hero existant.

## Implémentation recommandée

### Phase 1 - Ajustements mobile uniquement

Modifier `MotoHero.tsx` :

1. Ajouter des classes responsive pour le H1 :
   - mobile sans `whitespace-nowrap` ;
   - desktop peut conserver les lignes existantes.

2. Raccourcir le sous-texte mobile :
   - afficher version courte sur mobile ;
   - afficher version longue à partir de `sm` ou `md`.

3. Rendre le CTA pleine largeur sur mobile :
   - `w-full sm:w-auto` ;
   - zone tactile stable.

4. Réduire la bande basse mobile :
   - padding plus compact ;
   - h2 plus court sur mobile ;
   - chips plus fines.

5. Ajouter overlay mobile spécifique :
   - vertical ou diagonal ;
   - desktop inchangé.

### Phase 2 - Vérification visuelle

Tester :

- 360 x 800 ;
- 390 x 844 ;
- 430 x 932 ;
- desktop 1440 px.

Si le cadrage image est faible sur mobile, ajuster `object-position` mobile.

## Classes indicatives

### H1 option recommandée

```tsx
className="font-body text-[clamp(2.35rem,11.5vw,3.45rem)] font-extrabold leading-[0.96] tracking-[-0.025em] text-[#221915] text-balance sm:text-[clamp(2.75rem,5.8vw,4.9rem)] sm:leading-[0.92] sm:tracking-[-0.06em]"
```

### Lignes du titre

```tsx
<span className="block">Louez votre moto</span>
<span className="block">à Orléans.</span>
```

Éviter `whitespace-nowrap` sur mobile.

### CTA

```tsx
className="w-full sm:w-auto"
```

### Bande basse

```tsx
className="absolute inset-x-0 bottom-0 z-20 border-t border-white/25 bg-[...] py-3 backdrop-blur-[2px] sm:py-6 lg:py-7"
```

### Ligne de preuves mobile recommandée

```tsx
<p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#8f684d]">
  Prix clair · Dépôt annoncé · Support réactif
</p>
```

### Chips

```tsx
className="inline-flex items-center rounded-control border border-[#e4d6c8] bg-[#f4ede2] px-3 py-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-[#8f684d] sm:rounded-full sm:px-4 sm:py-2 sm:text-[0.72rem]"
```

## À éviter

- Ajouter un carrousel dans le hero.
- Ajouter des statistiques chiffrées non vérifiées.
- Ajouter plusieurs CTA.
- Utiliser une image différente sans direction claire.
- Mettre le texte dans une card.
- Trop réduire le contraste du texte.
- Conserver `whitespace-nowrap` sur 360 px.

## Critères de réussite

Le hero mobile est réussi si :

- le H1 ne déborde jamais ;
- le CTA est visible et tapable rapidement ;
- la bande basse ne mange pas l’écran ;
- l’image ne paraît pas délavée ;
- le premier écran ne paraît pas être un desktop compressé ;
- le visuel reste premium ;
- l’utilisateur comprend l’offre en moins de 5 secondes ;
- le desktop reste visuellement inchangé.

## Vérification technique

Après implémentation :

- `npm run lint`
- `npm run typecheck`
- vérifier la homepage locale ;
- vérifier `/#featured-motos` après changement éventuel de hauteur ;
- si possible, screenshot 360 / 390 / 430 / desktop.

## Décision finale

La meilleure solution n’est pas de réinventer le hero, mais de **le rendre plus souple sur mobile**.

Conserver l’image, le H1 et le CTA. Corriger surtout :

- wrapping du titre ;
- densité de la bande basse ;
- longueur du sous-texte ;
- dominance du CTA ;
- overlay mobile ;
- masse typographique ;
- voile beige trop fort.
