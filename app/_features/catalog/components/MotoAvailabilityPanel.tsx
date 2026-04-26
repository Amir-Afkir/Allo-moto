"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { CatalogMotorcycle } from "@/app/_features/catalog/data/motorcycles";
import {
  buildReservationSearchParams,
  createDefaultReservationWindow,
  evaluateReservation,
  formatDateInputValue,
  type ReservationPickupMode,
} from "@/app/_features/reservation/data/reservation";
import { usePlanningLedger } from "@/app/_features/reservation/hooks/usePlanningLedger";
import type {
  PlanningAvailabilityBlock,
  PlanningReservationRecord,
} from "@/app/_features/reservation/data/reservation-planning";
import { Badge } from "@/app/_shared/ui/Badge";
import { Button } from "@/app/_shared/ui/Button";
import { Input } from "@/app/_shared/ui/Input";
import { Label } from "@/app/_shared/ui/Label";

const defaultWindow = createDefaultReservationWindow();

type MotoAvailabilityPanelProps = {
  motorcycle: CatalogMotorcycle;
  initialPlanningReservations: ReadonlyArray<PlanningReservationRecord>;
  initialPlanningBlocks: ReadonlyArray<PlanningAvailabilityBlock>;
};

export function MotoAvailabilityPanel({
  motorcycle,
  initialPlanningReservations,
  initialPlanningBlocks,
}: MotoAvailabilityPanelProps) {
  const [pickupDate, setPickupDate] = useState(defaultWindow.pickupDate);
  const [returnDate, setReturnDate] = useState(defaultWindow.returnDate);
  const [pickupMode, setPickupMode] =
    useState<ReservationPickupMode>("motorcycle-location");
  const { reservations, blocks } = usePlanningLedger({
    reservations: initialPlanningReservations,
    blocks: initialPlanningBlocks,
  });

  const draft = useMemo(
    () => ({
      motorcycleSlug: motorcycle.slug,
      pickupDate,
      returnDate,
      pickupMode,
      permit: "none" as const,
    }),
    [motorcycle.slug, pickupDate, pickupMode, returnDate],
  );

  const evaluation = useMemo(
    () =>
      evaluateReservation({
        motorcycle,
        draft,
        planningReservations: reservations,
        planningBlocks: blocks,
      }),
    [blocks, draft, motorcycle, reservations],
  );

  const reservationHref = `/reserver?${buildReservationSearchParams({
    motorcycleSlug: motorcycle.slug,
    pickupDate,
    returnDate,
    pickupMode,
    permit: "none" as const,
    stage: "client",
  })}#client-form`;

  return (
    <div className="section-band panel-space space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <p className="label">Créneau</p>
          <h3 className="heading-3 text-foreground">
            Vérifiez vos dates pour cette moto.
          </h3>
          <p className="text-sm text-muted-foreground">
            Dates et retrait restent modifiables avant le dossier.
          </p>
        </div>
        <Badge variant={evaluation.statusTone}>{evaluation.statusLabel}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Départ" htmlFor={`planning-pickup-${motorcycle.slug}`}>
          <Input
            id={`planning-pickup-${motorcycle.slug}`}
            type="date"
            value={pickupDate}
            min={formatDateInputValue(new Date())}
            onChange={(event) => setPickupDate(event.target.value)}
          />
        </Field>
        <Field label="Retour" htmlFor={`planning-return-${motorcycle.slug}`}>
          <Input
            id={`planning-return-${motorcycle.slug}`}
            type="date"
            value={returnDate}
            min={pickupDate || formatDateInputValue(new Date())}
            onChange={(event) => setReturnDate(event.target.value)}
          />
        </Field>
        <Field label="Retrait" htmlFor={`planning-mode-${motorcycle.slug}`}>
          <select
            id={`planning-mode-${motorcycle.slug}`}
            value={pickupMode}
            onChange={(event) =>
              setPickupMode(event.target.value as ReservationPickupMode)
            }
            className="input-shell appearance-none pr-10"
          >
            <option value="motorcycle-location">Retrait sur place</option>
            <option value="delivery">Livraison</option>
          </select>
        </Field>
      </div>

      <div className="space-y-3 rounded-card border border-border/60 bg-surface/72 p-4">
        <p className="body-copy font-semibold text-foreground">
          {evaluation.inventorySummary}
        </p>
        <ul className="space-y-2 text-sm text-foreground/78">
          {evaluation.summaryPoints.map((point) => (
            <li key={point} className="flex gap-2">
              <span className="mt-[0.45rem] h-1.5 w-1.5 flex-none rounded-full bg-brand" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
        {evaluation.nextAvailableLabel ? (
          <p className="text-sm text-muted-foreground">
            {evaluation.nextAvailableLabel}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          as="link"
          href={reservationHref}
          ariaLabel={`Continuer avec ce créneau pour ${motorcycle.brand} ${motorcycle.name}`}
          variant={evaluation.available ? "accent" : "outline"}
          size="lg"
        >
          {evaluation.available
            ? "Continuer"
            : "Essayer un autre créneau"}
        </Button>
        <Button
          as="link"
          href="/motos"
          ariaLabel="Voir les motos"
          variant="outline"
          size="lg"
        >
          Voir les motos
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
