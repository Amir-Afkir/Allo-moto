import type { Metadata } from "next";
import { ReservationTunnel } from "@/app/_features/reservation/components/ReservationTunnel";
import { getReservationPageData } from "@/app/_features/ops/data/ops-store";
import {
  createDefaultReservationWindow,
  parsePermitSelection,
  parseReservationPickupMode,
  type ReservationStage,
} from "@/app/_features/reservation/data/reservation";

type SearchParams = Record<string, string | string[] | undefined>;

type ReservationPageProps = {
  searchParams?: SearchParams;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Réserver une moto à Orléans | Allo Moto",
  description:
    "Réservation moto à Orléans. Choisissez le créneau, complétez le dossier, puis envoyez votre demande.",
};

export default async function ReservationPage({
  searchParams,
}: ReservationPageProps) {
  const resolvedSearchParams = await searchParams;
  const requestedMotorcycleSlug = firstValue(resolvedSearchParams?.motorcycle);
  const { motorcycles, planning, requestedMotorcycle } =
    await getReservationPageData(requestedMotorcycleSlug);
  const invalidRequestedMotorcycleSlug =
    requestedMotorcycleSlug && !requestedMotorcycle
      ? requestedMotorcycleSlug
      : null;

  const defaultMotorcycleSlug =
    motorcycles.find(
      (motorcycle) => motorcycle.featured && motorcycle.status === "available",
    )?.slug ??
    motorcycles.find((motorcycle) => motorcycle.status === "available")
      ?.slug ??
    motorcycles[0]?.slug ??
    "";

  const initialMotorcycleSlug = invalidRequestedMotorcycleSlug
    ? ""
    : (requestedMotorcycle?.slug ?? defaultMotorcycleSlug);
  const defaultDates = createDefaultReservationWindow();

  const initialPickupDate =
    firstValue(resolvedSearchParams?.pickupDate) ?? defaultDates.pickupDate;
  const initialReturnDate =
    firstValue(resolvedSearchParams?.returnDate) ?? defaultDates.returnDate;
  const hasExplicitScheduleSelection = Boolean(
    firstValue(resolvedSearchParams?.pickupDate) &&
      firstValue(resolvedSearchParams?.returnDate),
  );
  const initialPickupMode = parseReservationPickupMode(
    firstValue(resolvedSearchParams?.pickupMode),
  );
  const initialPermit = parsePermitSelection(
    firstValue(resolvedSearchParams?.permit),
  );
  const initialStage = parseStage(
    firstValue(resolvedSearchParams?.stage),
    Boolean(initialMotorcycleSlug),
    hasExplicitScheduleSelection,
  );

  return (
    <main className="app-shell">
      <ReservationTunnel
        motorcycles={motorcycles}
        initialPlanningReservations={planning.reservations}
        initialPlanningBlocks={planning.blocks}
        initialMotorcycleSlug={initialMotorcycleSlug}
        invalidRequestedMotorcycleSlug={invalidRequestedMotorcycleSlug}
        initialPickupDate={initialPickupDate}
        initialReturnDate={initialReturnDate}
        initialPickupMode={initialPickupMode}
        initialPermit={initialPermit}
        initialStage={initialStage}
      />
    </main>
  );
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseStage(
  value: string | undefined,
  hasSelectedMotorcycle: boolean,
  hasExplicitScheduleSelection: boolean,
): ReservationStage {
  const canOpenNextStep = hasSelectedMotorcycle && hasExplicitScheduleSelection;

  if (value === "confirmed") {
    return canOpenNextStep ? "confirmed" : "selection";
  }

  if (value === "selection") {
    return "selection";
  }

  if (value === "client") {
    return canOpenNextStep ? "client" : "selection";
  }

  if (value === "payment") {
    return canOpenNextStep ? "payment" : "selection";
  }

  if (!hasSelectedMotorcycle) {
    return "selection";
  }

  return "selection";
}
