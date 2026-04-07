"use client";

import Link from "next/link";
import BrandMark from "@/app/_shared/components/BrandMark";
import {
  CATALOG_AVAILABILITY_HREF,
  buildReservationHref,
} from "@/app/_shared/lib/navigation";
import { ButtonLink } from "@/app/_shared/ui/ButtonLink";

type MobileStickyCTAProps = {
  motorcycleSlug?: string | null;
  motorcycleLabel?: string | null;
};

export default function MobileStickyCTA({
  motorcycleSlug,
  motorcycleLabel,
}: MobileStickyCTAProps) {
  const reservationHref = motorcycleSlug
    ? `${buildReservationHref(motorcycleSlug, { stage: "selection" })}#reservation-form`
    : CATALOG_AVAILABILITY_HREF;

  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-0 right-0 z-40 px-4 md:hidden">
      <div className="overlay-sheet mx-auto max-w-md p-3 shadow-[var(--shadow-elevated)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark size="sm" />
            <div className="min-w-0">
              <p className="meta-label">Allo Moto</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {motorcycleLabel
                  ? `${motorcycleLabel} prête à vérifier`
                  : "Définissez votre créneau"}
              </p>
            </div>
          </div>
          <Link
            href={CATALOG_AVAILABILITY_HREF}
            className="text-xs font-semibold text-brand transition-colors hover:text-brand-strong"
          >
            Disponibilités
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <ButtonLink
            href={CATALOG_AVAILABILITY_HREF}
            ariaLabel="Voir les disponibilités et comparer les motos"
            variant="outline"
            size="md"
            className="w-full"
          >
            Disponibilités
          </ButtonLink>
          <ButtonLink
            href={reservationHref}
            ariaLabel={
              motorcycleLabel
                ? `Vérifier les dates pour ${motorcycleLabel}`
                : "Définir le créneau de réservation"
            }
            variant="accent"
            size="md"
            className="w-full"
          >
            {motorcycleLabel ? "Vérifier mes dates" : "Commencer"}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
