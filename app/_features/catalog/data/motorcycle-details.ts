import type { MotoVisualTone } from "./motorcycles";

export interface MotorcycleGalleryPanel {
  eyebrow: string;
  title: string;
  copy: string;
  metric: string;
  tone: MotoVisualTone;
}

export interface MotorcycleDetailContent {
  summary: string;
  whyPoints: readonly [string, string, string];
  galleryPanels: readonly [MotorcycleGalleryPanel, MotorcycleGalleryPanel, MotorcycleGalleryPanel];
  included: readonly string[];
  notIncluded: readonly string[];
  prepare: readonly string[];
  reassurance: readonly string[];
  relatedSlugs: readonly [string, string, string];
}

const CORE_INCLUDED = [
  "Casque selon disponibilité",
  "Antivol et briefing",
  "Support si besoin",
  "Moto contrôlée avant remise",
] as const;

const CORE_NOT_INCLUDED = [
  "Carburant",
  "Péages et frais de route",
  "Amendes et pénalités",
  "Dépassement du kilométrage",
] as const;

const CORE_PREPARE = [
  "Permis et pièce d’identité valides",
  "Moyen de contact joignable",
  "Dépôt prêt",
  "Créneau confirmé",
] as const;

const CORE_REASSURANCE = [
  "Moto entretenue avant chaque sortie",
  "Dépôt et conditions clairs",
  "Équipe disponible si besoin",
] as const;

function panels(
  first: MotorcycleGalleryPanel,
  second: MotorcycleGalleryPanel,
  third: MotorcycleGalleryPanel
): readonly [MotorcycleGalleryPanel, MotorcycleGalleryPanel, MotorcycleGalleryPanel] {
  return [first, second, third];
}

export const MOTORCYCLE_DETAIL_CONTENT: Record<string, MotorcycleDetailContent> = {
  "honda-forza-350": {
    summary: "Un scooter compact pour rouler vite en ville sans perdre en confort.",
    whyPoints: [
      "Automatique et facile à lire dès la prise en main.",
      "Format urbain, rassurant pour des trajets courts ou répétés.",
      "Permis A1 et budget clair pour décider sans hésiter.",
    ],
    galleryPanels: panels(
      {
        eyebrow: "Ville",
        title: "Lecture immédiate",
        copy: "Format compact, prise en main rapide, maniabilité naturelle.",
        metric: "Usage quotidien",
        tone: "sand",
      },
      {
        eyebrow: "Confort",
        title: "Automatique et calme",
        copy: "Le choix le plus direct pour éviter la surcharge mentale.",
        metric: "A1",
        tone: "amber",
      },
      {
        eyebrow: "Décision",
        title: "Prix lisible",
        copy: "Le coût, le dépôt et le kilométrage restent immédiats.",
        metric: "49 €/jour",
        tone: "graphite",
      }
    ),
    included: CORE_INCLUDED,
    notIncluded: CORE_NOT_INCLUDED,
    prepare: CORE_PREPARE,
    reassurance: CORE_REASSURANCE,
    relatedSlugs: ["peugeot-django-125", "yamaha-xmax-300", "bmw-g310r"],
  },
  "peugeot-django-125": {
    summary: "Un scooter élégant, simple à lire et très lisible pour la ville.",
    whyPoints: [
      "Petit format et style affirmé.",
      "Permis A1, automatique, très rapide à comprendre.",
      "Idéal pour garder le tunnel court et rassurant.",
    ],
    galleryPanels: panels(
      {
        eyebrow: "Style",
        title: "Signature visuelle",
        copy: "Une présence douce, agréable et très urbaine.",
        metric: "Ville",
        tone: "amber",
      },
      {
        eyebrow: "Maniabilité",
        title: "Prise en main facile",
        copy: "Pas de complexité inutile pour continuer rapidement.",
        metric: "A1",
        tone: "sand",
      },
      {
        eyebrow: "Budget",
        title: "Entrée claire",
        copy: "Le prix reste accessible pour un premier choix.",
        metric: "39 €/jour",
        tone: "olive",
      }
    ),
    included: CORE_INCLUDED,
    notIncluded: CORE_NOT_INCLUDED,
    prepare: CORE_PREPARE,
    reassurance: CORE_REASSURANCE,
    relatedSlugs: ["honda-forza-350", "yamaha-xmax-300", "bmw-g310r"],
  },
  "yamaha-xmax-300": {
    summary: "Un scooter plus confortable et plus stable pour passer au niveau supérieur.",
    whyPoints: [
      "Très bon compromis entre ville et route.",
      "Automatique, lisible et rassurant.",
      "Permis A2, parfait pour un usage premium sans effort.",
    ],
    galleryPanels: panels(
      {
        eyebrow: "Confort",
        title: "Position relax",
        copy: "Le format facilite les longues journées et les allers-retours.",
        metric: "A2",
        tone: "steel",
      },
      {
        eyebrow: "Usage",
        title: "Ville + route",
        copy: "Un choix naturel si le trajet varie d’un jour à l’autre.",
        metric: "Polyvalent",
        tone: "sea",
      },
      {
        eyebrow: "Décision",
        title: "Prix lisible",
        copy: "Le prix et le dépôt restent immédiats dans la comparaison.",
        metric: "59 €/jour",
        tone: "graphite",
      }
    ),
    included: CORE_INCLUDED,
    notIncluded: CORE_NOT_INCLUDED,
    prepare: CORE_PREPARE,
    reassurance: CORE_REASSURANCE,
    relatedSlugs: ["honda-forza-350", "peugeot-django-125", "royal-enfield-himalayan-450"],
  },
  "bmw-g310r": {
    summary: "Un roadster compact pour ceux qui veulent une moto plus directe et plus précise.",
    whyPoints: [
      "Format léger, conduite plus engagée.",
      "Permis A2 et boîte manuelle pour un ressenti plus moto.",
      "Prix et dépôt lisibles dans un format sobre.",
    ],
    galleryPanels: panels(
      {
        eyebrow: "Roadster",
        title: "Prise en main nette",
        copy: "La position est simple à lire pour un usage court.",
        metric: "A2",
        tone: "graphite",
      },
      {
        eyebrow: "Réactivité",
        title: "Plus directe",
        copy: "Une moto pensée pour décider vite sans trop réfléchir.",
        metric: "Manuelle",
        tone: "steel",
      },
      {
        eyebrow: "Budget",
        title: "Milieu de gamme",
        copy: "Le tunnel reste simple, le budget reste clair.",
        metric: "69 €/jour",
        tone: "sand",
      }
    ),
    included: CORE_INCLUDED,
    notIncluded: CORE_NOT_INCLUDED,
    prepare: CORE_PREPARE,
    reassurance: CORE_REASSURANCE,
    relatedSlugs: ["yamaha-xmax-300", "royal-enfield-himalayan-450", "ducati-monster-937"],
  },
  "royal-enfield-himalayan-450": {
    summary: "Un trail accessible pour ceux qui veulent rouler plus loin avec une position haute.",
    whyPoints: [
      "Très bon compromis pour les longues sorties.",
      "Posture confortable et lecture facile du terrain.",
      "Permis A2 avec vrai confort de route.",
    ],
    galleryPanels: panels(
      {
        eyebrow: "Trail",
        title: "Position haute",
        copy: "Une allure rassurante pour les trajets plus longs.",
        metric: "A2",
        tone: "olive",
      },
      {
        eyebrow: "Confort",
        title: "Escapade simple",
        copy: "Un modèle qui aide à sortir du cadre sans complexifier la décision.",
        metric: "Route",
        tone: "sea",
      },
      {
        eyebrow: "Décision",
        title: "Budget clair",
        copy: "Le tarif monte un peu, mais la lecture reste immédiate.",
        metric: "79 €/jour",
        tone: "amber",
      }
    ),
    included: CORE_INCLUDED,
    notIncluded: CORE_NOT_INCLUDED,
    prepare: CORE_PREPARE,
    reassurance: CORE_REASSURANCE,
    relatedSlugs: ["yamaha-xmax-300", "bmw-g310r", "triumph-tiger-900-gt"],
  },
  "triumph-tiger-900-gt": {
    summary: "Un touring premium pour partir loin, confortablement et sans reposer toute la charge mentale sur le client.",
    whyPoints: [
      "Pensée pour les longs trajets et le duo.",
      "A, boîte manuelle, vraie logique tourisme.",
      "Le tunnel de réservation doit rester sobre face au niveau de gamme.",
    ],
    galleryPanels: panels(
      {
        eyebrow: "Touring",
        title: "Longue route",
        copy: "Confort, stabilité et rythme tranquille sur les grands trajets.",
        metric: "A",
        tone: "sea",
      },
      {
        eyebrow: "Duo",
        title: "Habitacle généreux",
        copy: "Le format aide à se projeter immédiatement sur un week-end ou un voyage.",
        metric: "Grand confort",
        tone: "steel",
      },
      {
        eyebrow: "Décision",
        title: "Position premium",
        copy: "Le prix est plus haut, mais la lecture du bénéfice reste nette.",
        metric: "99 €/jour",
        tone: "graphite",
      }
    ),
    included: CORE_INCLUDED,
    notIncluded: CORE_NOT_INCLUDED,
    prepare: CORE_PREPARE,
    reassurance: CORE_REASSURANCE,
    relatedSlugs: ["royal-enfield-himalayan-450", "ducati-monster-937", "harley-street-glide"],
  },
  "ducati-monster-937": {
    summary: "Un roadster sportif pour les clients qui cherchent du caractère sans perdre la lisibilité.",
    whyPoints: [
      "Lecture immédiate, style fort, conduite engageante.",
      "Permis A et boîte manuelle pour un usage plus expressif.",
      "Une vraie moto coup de cœur, mais toujours claire à réserver.",
    ],
    galleryPanels: panels(
      {
        eyebrow: "Sport",
        title: "Caractère net",
        copy: "Présence forte, lecture simple, décision assumée.",
        metric: "A",
        tone: "ember",
      },
      {
        eyebrow: "Réactivité",
        title: "Plus vive",
        copy: "La moto parle vite à l’utilisateur qui sait ce qu’il veut.",
        metric: "Roadster",
        tone: "graphite",
      },
      {
        eyebrow: "Budget",
        title: "Premium lisible",
        copy: "Le coût reste affiché sans détour.",
        metric: "109 €/jour",
        tone: "sand",
      }
    ),
    included: CORE_INCLUDED,
    notIncluded: CORE_NOT_INCLUDED,
    prepare: CORE_PREPARE,
    reassurance: CORE_REASSURANCE,
    relatedSlugs: ["bmw-g310r", "triumph-tiger-900-gt", "harley-street-bob"],
  },
  "zero-sr-f": {
    summary: "Une moto électrique pour une expérience silencieuse et immédiate.",
    whyPoints: [
      "Aucune gestion d’embrayage, réponse instantanée.",
      "Le choix le plus différent du catalogue.",
      "À lire rapidement, sans question superflue.",
    ],
    galleryPanels: panels(
      {
        eyebrow: "Électrique",
        title: "Silencieuse",
        copy: "Le confort de lecture vient d’abord de la simplicité d’usage.",
        metric: "Silence",
        tone: "copper",
      },
      {
        eyebrow: "Réponse",
        title: "Instantanée",
        copy: "La montée en puissance se comprend très vite.",
        metric: "Automatique",
        tone: "sea",
      },
      {
        eyebrow: "Décision",
        title: "Format distinct",
        copy: "Un choix premium pour ceux qui veulent autre chose.",
        metric: "89 €/jour",
        tone: "graphite",
      }
    ),
    included: CORE_INCLUDED,
    notIncluded: CORE_NOT_INCLUDED,
    prepare: CORE_PREPARE,
    reassurance: CORE_REASSURANCE,
    relatedSlugs: ["yamaha-xmax-300", "ducati-monster-937", "honda-forza-350"],
  },
  "harley-street-bob": {
    summary: "Une custom avec une posture basse et une forte identité visuelle.",
    whyPoints: [
      "Le style prime, la lecture reste directe.",
      "Parfaite pour le client qui veut une présence forte.",
      "Permis A et boîte manuelle pour garder une sensation moto.",
    ],
    galleryPanels: panels(
      {
        eyebrow: "Custom",
        title: "Présence forte",
        copy: "Le design se voit tout de suite, sans explication longue.",
        metric: "A",
        tone: "graphite",
      },
      {
        eyebrow: "Posture",
        title: "Assise basse",
        copy: "Un choix distinct pour rouler avec une vraie identité.",
        metric: "Style",
        tone: "ember",
      },
      {
        eyebrow: "Décision",
        title: "Réservée à part",
        copy: "Le budget monte, mais le choix reste lisible.",
        metric: "119 €/jour",
        tone: "amber",
      }
    ),
    included: CORE_INCLUDED,
    notIncluded: CORE_NOT_INCLUDED,
    prepare: CORE_PREPARE,
    reassurance: CORE_REASSURANCE,
    relatedSlugs: ["ducati-monster-937", "harley-street-glide", "triumph-tiger-900-gt"],
  },
  "harley-street-glide": {
    summary: "Un grand touring pour les longues routes et le duo, avec une lecture très premium.",
    whyPoints: [
      "La moto la plus routière du catalogue.",
      "Très confortable pour voyager à deux.",
      "Permis A et budget haut de gamme très lisible.",
    ],
    galleryPanels: panels(
      {
        eyebrow: "Touring",
        title: "Voyage",
        copy: "Le format met l’accent sur les longues distances et le duo.",
        metric: "A",
        tone: "amber",
      },
      {
        eyebrow: "Confort",
        title: "Très stable",
        copy: "Un modèle qui parle d’abord aux longs trajets.",
        metric: "Longue route",
        tone: "sea",
      },
      {
        eyebrow: "Décision",
        title: "Haut de gamme",
        copy: "Le prix est élevé, mais la promesse reste claire.",
        metric: "149 €/jour",
        tone: "graphite",
      }
    ),
    included: CORE_INCLUDED,
    notIncluded: CORE_NOT_INCLUDED,
    prepare: CORE_PREPARE,
    reassurance: CORE_REASSURANCE,
    relatedSlugs: ["triumph-tiger-900-gt", "harley-street-bob", "ducati-monster-937"],
  },
};

export function getMotorcycleDetailContent(slug: string): MotorcycleDetailContent | null {
  return MOTORCYCLE_DETAIL_CONTENT[slug] ?? null;
}
