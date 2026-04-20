# Plan header mobile - Allo Moto

## Objectif

Le header mobile doit guider sans prendre trop de hauteur.

Sur Allo Moto, le premier écran doit rester dominé par la moto, l’offre et le CTA. Le header doit donc être compact, lisible, tactile, et orienté réservation.

## Solution retenue

Adopter un header mobile en deux niveaux, mais avec une présence visuelle très légère :

1. **Top bar compacte**
   - logo ;
   - nom court ou surface courante ;
   - CTA principal.

2. **Rail d’ancres horizontal**
   - liens courts ;
   - scroll horizontal ;
   - style discret ;
   - hauteur réduite.

Ce choix garde la navigation actuelle, mais la rend plus premium et moins lourde. Le header doit agir comme un chrome, pas comme un bloc de contenu.

## Audit visuel actuel

Le header mobile est fonctionnel, mais encore trop visible.

Problèmes observés :

- logo trop grand ;
- CTA `Réserver` trop massif ;
- rail d’ancres trop proche d’une rangée de boutons ;
- trop de beige/blanc avant le hero ;
- les ancres concurrencent le CTA principal.

Décision stricte :

- réduire le poids visuel du header de 20-25% ;
- rendre le rail plus textuel que “button-like” ;
- garder le CTA visible, mais plus élégant ;
- réduire la hauteur perçue avant le hero.

## Pourquoi cette solution

Le site a une identité `premium roadbook mobile`. Une navigation hamburger masquerait trop le parcours, alors que les ancres sont utiles sur la homepage. À l’inverse, une navigation trop visible consomme trop de hauteur.

Le meilleur compromis est donc :

- conserver les ancres visibles ;
- les rendre plus petites et plus calmes ;
- garder le CTA réservation dans la top bar ;
- éviter un header mobile qui ressemble à un menu desktop compressé.

## Structure cible

```text
┌────────────────────────────────────┐
│ [Logo] Allo Moto        Réserver   │
│ Modèles  Balades  Réserver  Aide   │
└────────────────────────────────────┘
```

Sur très petit écran :

```text
┌────────────────────────────────────┐
│ [Logo]                 Réserver    │
│ Modèles  Balades  Réserver  Aide   │
└────────────────────────────────────┘
```

## Décisions de contenu

### Logo

Garder le logo comme point d’ancrage.

- Sur mobile 360 px : logo seul.
- À partir de `sm` : afficher `Allo Moto`.
- Ne pas afficher `Location de moto premium` sur mobile.
- Taille cible du logo sur très petit écran : 32-34 px.
- Éviter un logo 40 px+ qui devient un élément dominant.

### CTA principal

Conserver un CTA visible dans la top bar.

Label recommandé :

- `Réserver`

Lien :

- `/motos`

Raison :

- c’est court ;
- ça tient sur petit écran ;
- le catalogue reste le meilleur point d’entrée vers la disponibilité.

Visuel :

- le CTA doit rester prioritaire, mais ne doit pas ressembler à un énorme badge ;
- hauteur cible : 38-42 px ;
- padding horizontal réduit ;
- rayon moins spectaculaire si le bouton paraît trop “capsule publicitaire”.

### Navigation mobile

Labels recommandés :

- `Modèles`
- `Balades`
- `Réserver`
- `Aide`

Ne pas utiliser `Comment réserver` sur mobile. Le label est trop long. Utiliser `Réserver`.

Mapping :

- `Modèles` -> `/#featured-motos`
- `Balades` -> `/#destinations-moto`
- `Réserver` -> `/#journey`
- `Aide` -> `/#help`

### FAQ

Ne pas ajouter `FAQ` dans le header mobile.

Raison :

- la FAQ est secondaire ;
- elle est placée après l’aide ;
- ajouter un item de plus rend le rail trop chargé.

## Design cible

### Top bar

Style :

- hauteur 48-52 px ;
- padding vertical réduit ;
- fond translucide chaud ;
- blur léger ;
- bordure basse fine ;
- pas de shadow forte.

Le header doit se sentir comme un chrome fonctionnel, pas comme une section de contenu.

### Rail d’ancres

Style :

- liens plus proches d’un rail textuel que de boutons ;
- hauteur perçue 30-34 px ;
- texte 10.5-11.5 px ;
- uppercase possible, mais tracking réduit ;
- border très légère ou absente ;
- fond très discret, voire transparent ;
- pas d’ombre ;
- aucun effet de gros pill.

Décision top 1% :

- privilégier des liens avec fond quasi transparent ;
- garder la cible tactile via padding, pas via un gros fond ;
- masquer la scrollbar ;
- laisser le rail respirer avec moins de hauteur verticale.

État actif optionnel :

- pas nécessaire en première version ;
- si ajouté, ne pas le baser uniquement sur la couleur ;
- utiliser un fond légèrement plus dense + texte plus fort.

## Comportement sticky

Conserver le header fixed.

Mais réduire la hauteur totale afin que `--chrome-offset` puisse baisser.

Objectif :

- mobile actuel : header encore perçu comme haut ;
- cible stricte : header autour de 76-86 px total, rail inclus.
- au-delà de 90 px, le hero commence à paraître compressé.

## Variables CSS à revoir

Actuellement, le layout dépend de :

- `--header-offset`
- `--header-clearance`
- `--chrome-offset`

Plan :

1. Réduire la hauteur réelle du header mobile.
2. Ajuster `--header-offset` pour correspondre.
3. Vérifier les ancres `/#featured-motos`, `/#destinations-moto`, `/#journey`, `/#help`.

Attention :

- ne pas modifier le desktop sans test visuel ;
- vérifier que le hero ne remonte pas sous le header ;
- vérifier que les ancres ne sont pas masquées.

## Accessibilité

Exigences :

- chaque lien doit garder une cible tactile confortable ;
- hauteur touch target autour de 40-44 px minimum ;
- contraste suffisant sur fond translucide ;
- `aria-label` clair pour le logo ;
- `aria-label="Navigation mobile"` conservé ;
- pas de texte tronqué dans les chips.

## Comportement par route

### Homepage

Afficher :

- top bar ;
- rail d’ancres.

### Catalogue `/motos`

Afficher :

- top bar ;
- rail d’ancres possible, mais moins prioritaire.

Amélioration possible :

- remplacer le rail par liens contextuels `Disponibilités`, `Filtres`, `Aide` dans une phase future.

### Fiche moto `/motos/[slug]`

Afficher :

- top bar ;
- CTA `Réserver` ou `Choisir`.

Ne pas surcharger avec toutes les ancres homepage.

### Réservation `/reserver`

Afficher :

- header minimal ;
- pas de rail d’ancres homepage ;
- surface/progress déjà géré par l’interface réservation.

Cette amélioration peut être faite après le premier passage mobile homepage.

## Implémentation recommandée

### Phase 1 - Homepage mobile

Modifier `HeaderChrome.tsx` :

- réduire `py-4` mobile ;
- top bar plus compacte ;
- rendre le label `Allo Moto` plus discret ;
- réduire les chips du rail jusqu’à les rendre presque textuelles ;
- utiliser `Réserver` comme label mobile pour `/#journey`.
- réduire le logo mobile à environ 32-34 px.
- réduire le CTA mobile à une hauteur visuelle d’environ 40 px.

Modifier `navigation.ts` :

- garder les labels desktop actuels ;
- ajouter une source mobile dédiée si nécessaire.

Recommandation :

- créer `getMobileHeaderNavItems()`.
- garder `getDesktopHeaderNavItems()` inchangé.

### Phase 2 - Routes contextuelles

Adapter le rail selon `pathname` :

- homepage : ancres homepage ;
- catalogue : liens catalogue ;
- fiche moto : CTA principal seulement ;
- réservation : chrome minimal.

Ne pas faire cette phase avant d’avoir validé la homepage mobile.

## Classes visuelles suggérées

### Top bar

```tsx
<div className="flex h-10 items-center justify-between gap-3 lg:hidden">
```

### Wrapper header mobile

```tsx
<div className="app-shell py-2.5 lg:py-2.5">
```

### Rail

```tsx
<nav className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 pt-1 lg:hidden">
```

### Chip

```tsx
className="whitespace-nowrap rounded-control border border-transparent bg-transparent px-2.5 py-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-foreground/62 transition-colors hover:text-foreground"
```

Ces classes sont indicatives. Ajuster après screenshot mobile.

### Variante si les liens deviennent trop discrets

```tsx
className="whitespace-nowrap rounded-control border border-border/35 bg-surface/34 px-2.5 py-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-foreground/64"
```

## Tests à faire

### Viewports

- 360 x 800
- 390 x 844
- 430 x 932

### Checks

- Le header ne cache pas le hero.
- Le CTA `Réserver` reste tapable.
- Le rail ne déborde pas verticalement.
- Les ancres scrollent sous le header.
- Le label `Comment réserver` n’apparaît pas en mobile.
- Le desktop reste inchangé.
- Le rail ne ressemble pas à quatre boutons concurrents.
- La zone blanche/beige avant le hero est minimale.

## Critères de réussite

Le header mobile est réussi si :

- il donne accès à l’action principale immédiatement ;
- il garde les ancres utiles sans prendre le premier écran ;
- il ressemble à un chrome premium, pas à une barre de tags ;
- il reste lisible en 360 px ;
- il ne force pas de refonte globale du layout.
- il ne concurrence pas le hero.
- il ne concurrence pas le CTA principal du hero.

## Décision finale

La meilleure solution pour Allo Moto est un **header mobile compact avec CTA visible et rail d’ancres discret**.

Ne pas passer au hamburger maintenant. Ne pas ajouter de bottom nav globale maintenant. Le site est encore une expérience web courte : il a besoin d’un header précis, pas d’une navigation d’application complète.
