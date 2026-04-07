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
export const HOME_JOURNEY_HREF = "/#journey";
export const HOME_HELP_HREF = "/#help";

export const DEFAULT_RESERVATION_HREF = "/reserver?stage=selection";
export const DEFAULT_RESERVATION_FORM_HREF =
  "/reserver?stage=selection#reservation-form";

const HEADER_ITEMS: ReadonlyArray<NavigationItem> = [
  {
    label: "Modèles",
    href: "/#featured-motos",
    description: "Revenir aux modèles mis en avant sur l’accueil",
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

const FOOTER_NAV_ITEMS: ReadonlyArray<NavigationItem> = [
  { label: "Modèles", href: "/#featured-motos" },
  { label: "Comment réserver", href: HOME_JOURNEY_HREF },
  { label: "Aide", href: HOME_HELP_HREF },
];

const FOOTER_LEGAL_ITEMS: ReadonlyArray<NavigationItem> = [
  { label: "Conditions", href: "/conditions" },
  { label: "Confidentialité", href: "/confidentialite" },
  { label: "Mentions légales", href: "/mentions-legales" },
];

export function getHeaderNavItems(): ReadonlyArray<NavigationItem> {
  return HEADER_ITEMS;
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

export function getReservationStageProgress(stage?: string | null): string {
  if (stage === "payment") {
    return "3/4";
  }

  if (stage === "confirmed") {
    return "4/4";
  }

  if (stage === "client") {
    return "2/4";
  }

  return "1/4";
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
