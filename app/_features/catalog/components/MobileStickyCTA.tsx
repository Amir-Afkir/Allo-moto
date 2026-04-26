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
                  ? `${motorcycleLabel} à vérifier`
                  : "Choisissez le créneau"}
              </p>
            </div>
          </div>
          <Link
            href="/motos"
            className="text-xs font-semibold text-brand transition-colors hover:text-brand-strong"
          >
            Voir les motos
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
            Voir les disponibilités
          </ButtonLink>
          <ButtonLink
            href={reservationHref}
            ariaLabel={
              motorcycleLabel
                ? `Vérifier le créneau pour ${motorcycleLabel}`
                : "Choisir le créneau de réservation"
            }
            variant="accent"
            size="md"
            className="w-full"
          >
            {motorcycleLabel ? "Vérifier le créneau" : "Réserver"}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
