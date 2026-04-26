"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { ButtonLink } from "@/app/_shared/ui/ButtonLink";
import {
  buildReservationHref,
  getMotoDetailSlug,
} from "@/app/_shared/lib/navigation";

type FooterAction = {
  primary: {
    label: string;
    href: string;
    ariaLabel: string;
  };
};

export default function FooterPrimaryAction() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const action = getFooterAction(pathname, searchParams);

  return (
    <div className="flex w-full flex-col items-start gap-2 lg:w-auto lg:items-end">
      <ButtonLink
        href={action.primary.href}
        ariaLabel={action.primary.ariaLabel}
        variant="accent"
        size="md"
        className="min-h-11 w-full sm:w-auto"
      >
        {action.primary.label}
      </ButtonLink>
      <span className="max-w-[21rem] text-xs font-medium leading-5 text-muted-foreground lg:text-right">
        Permis, dépôt ou retrait : on répond avant paiement.
      </span>
    </div>
  );
}

function getFooterAction(pathname: string, searchParams: ReturnType<typeof useSearchParams>): FooterAction {
  const detailSlug = pathname.startsWith("/motos/") ? getMotoDetailSlug(pathname.split("/")[2]) : null;
  const reservationStage = searchParams?.get("stage");
  const reservationMotorcycle = searchParams?.get("motorcycle");
  const hasScheduleSelection =
    Boolean(searchParams?.get("pickupDate")) &&
    Boolean(searchParams?.get("returnDate"));

  if (detailSlug) {
    return {
      primary: {
        label: "Vérifier le créneau",
        href: `${buildReservationHref(detailSlug, { stage: "selection" })}#reservation-form`,
        ariaLabel: "Vérifier le créneau pour cette moto",
      },
    };
  }

  if (pathname === "/motos") {
    return {
      primary: {
        label: "Réserver",
        href: "/reserver?stage=selection#reservation-form",
        ariaLabel: "Commencer la réservation",
      },
    };
  }

  if (pathname.startsWith("/reserver")) {
    if (reservationStage === "selection") {
      return {
        primary: {
          label: "Reprendre la réservation",
          href: buildReservationStageHref(searchParams, "selection", "reservation-form"),
          ariaLabel: "Reprendre la réservation",
        },
      };
    }

    if (reservationStage === "confirmed") {
      return {
        primary: {
          label: "Voir le suivi",
          href: buildReservationStageHref(searchParams, "confirmed", "confirmation"),
          ariaLabel: "Voir le suivi de réservation",
        },
      };
    }

    if (reservationStage === "payment") {
      return {
        primary: {
          label: "Retour au dossier",
          href: buildReservationStageHref(searchParams, "client", "client-form"),
          ariaLabel: "Retourner au dossier client",
        },
      };
    }

    if (reservationStage === "client") {
      return {
        primary: {
          label: "Reprendre le dossier",
          href: buildReservationStageHref(searchParams, "client", "client-form"),
          ariaLabel: "Reprendre le dossier de réservation",
        },
      };
    }

    if (!reservationStage && reservationMotorcycle && hasScheduleSelection) {
      return {
        primary: {
          label: "Reprendre le dossier",
          href: buildReservationStageHref(searchParams, "client", "client-form"),
          ariaLabel: "Reprendre le dossier de réservation",
        },
      };
    }

    return {
      primary: {
        label: "Reprendre la réservation",
        href: buildReservationStageHref(searchParams, "selection", "reservation-form"),
        ariaLabel: "Reprendre la réservation",
      },
    };
  }

  if (pathname === "/") {
    return {
      primary: {
        label: "Réserver",
        href: "/reserver?stage=selection#reservation-form",
        ariaLabel: "Commencer la réservation",
      },
    };
  }

  return {
    primary: {
      label: "Réserver",
      href: "/reserver?stage=selection#reservation-form",
      ariaLabel: "Commencer la réservation",
    },
  };
}

function buildReservationStageHref(
  searchParams: ReturnType<typeof useSearchParams>,
  stage: "selection" | "client" | "payment" | "confirmed",
  hash?: string
): string {
  const params = new URLSearchParams(searchParams?.toString());

  params.set("stage", stage);

  const query = params.toString();
  const base = query ? `/reserver?${query}` : "/reserver";

  return hash ? `${base}#${hash}` : base;
}
