export type NavigationItem = {
  label: string;
  href: string;
  description?: string;
};

export type PrimaryCta = {
  label: string;
  href: string;
  ariaLabel: string;
  variant: "primary" | "outline" | "accent";
};

export const CATALOG_HREF = "/motos";
export const CATALOG_AVAILABILITY_HREF = "/motos#availability";
export const HOME_FEATURED_MOTOS_HREF = "/#featured-motos";
export const HOME_DESTINATIONS_HREF = "/#destinations-moto";
export const HOME_EQUIPMENT_HREF = "/#equipment-license";
export const HOME_JOURNEY_HREF = "/#journey";
export const HOME_HELP_HREF = "/#help";

const HEADER_ITEMS: ReadonlyArray<NavigationItem> = [
  {
    label: "Modèles",
    href: HOME_FEATURED_MOTOS_HREF,
    description: "Revenir aux modèles mis en avant sur l’accueil",
  },
  {
    label: "Balades",
    href: HOME_DESTINATIONS_HREF,
    description: "Découvrir des idées de balades moto autour d’Orléans",
  },
  {
    label: "Comment réserver",
    href: HOME_JOURNEY_HREF,
    description: "Comprendre les étapes avant le paiement",
  },
  {
    label: "Aide",
    href: HOME_HELP_HREF,
    description: "Poser une question avant de réserver",
  },
];

const MOBILE_HEADER_ITEMS: ReadonlyArray<NavigationItem> = [
  {
    label: "Modèles",
    href: HOME_FEATURED_MOTOS_HREF,
    description: "Revenir aux modèles mis en avant sur l’accueil",
  },
  {
    label: "Balades",
    href: HOME_DESTINATIONS_HREF,
    description: "Découvrir des idées de balades moto autour d’Orléans",
  },
  {
    label: "Permis",
    href: HOME_EQUIPMENT_HREF,
    description: "Vérifier l’équipement et le permis à prévoir",
  },
  {
    label: "Aide",
    href: HOME_HELP_HREF,
    description: "Poser une question avant de réserver",
  },
];

const FOOTER_NAV_ITEMS: ReadonlyArray<NavigationItem> = [
  { label: "Modèles", href: HOME_FEATURED_MOTOS_HREF },
  { label: "Balades", href: HOME_DESTINATIONS_HREF },
  { label: "Permis", href: HOME_EQUIPMENT_HREF },
  { label: "Réserver", href: HOME_JOURNEY_HREF },
  { label: "Aide", href: HOME_HELP_HREF },
];

const FOOTER_LEGAL_ITEMS: ReadonlyArray<NavigationItem> = [
  { label: "Conditions", href: "/conditions" },
  { label: "Confidentialité", href: "/confidentialite" },
  { label: "Mentions légales", href: "/mentions-legales" },
];

export function getMobileHeaderNavItems(): ReadonlyArray<NavigationItem> {
  return MOBILE_HEADER_ITEMS;
}

export function getDesktopHeaderNavItems(): ReadonlyArray<NavigationItem> {
  return HEADER_ITEMS;
}

export function getFooterNavItems(): ReadonlyArray<NavigationItem> {
  return FOOTER_NAV_ITEMS;
}

export function getFooterLegalNavItems(): ReadonlyArray<NavigationItem> {
  return FOOTER_LEGAL_ITEMS;
}

export function getSurfaceLabel(
  pathname: string,
  reservationStage?: string | null,
): string {
  if (pathname === "/") {
    return "Accueil";
  }
  if (pathname.startsWith("/motos/")) {
    return "Fiche moto";
  }
  if (pathname === "/motos") {
    return "Catalogue";
  }
  if (pathname.startsWith("/reserver")) {
    return getReservationStageLabel(reservationStage);
  }
  return "Allo Moto";
}

export function getReservationStageLabel(stage?: string | null): string {
  if (stage === "payment") {
    return "Paiement";
  }

  if (stage === "confirmed") {
    return "Suivi";
  }

  if (stage === "client") {
    return "Dossier";
  }

  return "Choix";
}

export function getPrimaryCta(): PrimaryCta {
  return {
    label: "Réserver",
    href: CATALOG_HREF,
    ariaLabel: "Aller à la page motos",
    variant: "accent",
  };
}

export function buildReservationHref(
  motorcycleSlug: string,
  extraParams?: Record<string, string | number | undefined>,
): string {
  const params = new URLSearchParams({ motorcycle: motorcycleSlug });

  if (extraParams) {
    Object.entries(extraParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });
  }

  return `/reserver?${params.toString()}`;
}

export function getMotoDetailSlug(
  slug: string | null | undefined,
): string | null {
  if (!slug) {
    return null;
  }

  return slug.trim() || null;
}
