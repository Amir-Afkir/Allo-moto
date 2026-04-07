import type { CatalogMotorcycle } from "@/app/_features/catalog/data/motorcycles";
import {
  evaluatePlanningAvailability,
  type PlanningAvailabilityBlock,
  type PlanningReservationRecord,
  type ReservationAvailability,
} from "./reservation-planning";

export type ReservationStage = "selection" | "client" | "payment" | "confirmed";
export type ReservationPickupMode = "motorcycle-location" | "delivery";
export type PermitSelection = "none" | "B" | "A1" | "A2" | "A";

export type ReservationDraft = {
  motorcycleSlug: string;
  pickupDate: string;
  returnDate: string;
  pickupMode: ReservationPickupMode;
  permit: PermitSelection;
};

export type ReservationEvaluation = ReservationAvailability;

export const PICKUP_MODE_OPTIONS: ReadonlyArray<{ value: ReservationPickupMode; label: string }> = [
  { value: "motorcycle-location", label: "Retrait sur place" },
  { value: "delivery", label: "Livraison" },
];

export const PERMIT_OPTIONS: ReadonlyArray<{ value: PermitSelection; label: string }> = [
  { value: "none", label: "Sélectionnez" },
  { value: "B", label: "B" },
  { value: "A1", label: "A1" },
  { value: "A2", label: "A2" },
  { value: "A", label: "A" },
];

const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

export function createDefaultReservationWindow(): { pickupDate: string; returnDate: string } {
  const now = new Date();
  const pickup = addDays(now, 1);
  const returnDate = addDays(now, 3);
  return {
    pickupDate: formatDateInputValue(pickup),
    returnDate: formatDateInputValue(returnDate),
  };
}

export function parseReservationPickupMode(value: string | undefined): ReservationPickupMode {
  return value === "delivery" ? "delivery" : "motorcycle-location";
}

export function parsePermitSelection(value: string | undefined): PermitSelection {
  if (value === "B" || value === "A1" || value === "A2" || value === "A") {
    return value;
  }
  return "none";
}

export function formatDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateLabel(value: string): string {
  const date = parseDate(value);
  if (!date) {
    return "À préciser";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDateRange(start: string, end: string): string {
  if (!start || !end) {
    return "À préciser";
  }

  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (!startDate || !endDate) {
    return "À préciser";
  }

  return `${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(startDate)} → ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(endDate)}`;
}

export function calculateReservationDuration(pickupDate: string, returnDate: string): number {
  const pickup = parseDate(pickupDate);
  const returnDay = parseDate(returnDate);
  if (!pickup || !returnDay) {
    return 0;
  }

  const diff = Math.round((startOfDay(returnDay).getTime() - startOfDay(pickup).getTime()) / MILLIS_PER_DAY);
  return diff >= 0 ? diff + 1 : 0;
}

export function buildReservationSearchParams({
  motorcycleSlug,
  pickupDate,
  returnDate,
  pickupMode,
  permit,
  stage,
}: {
  motorcycleSlug: string | null;
  pickupDate: string;
  returnDate: string;
  pickupMode: ReservationPickupMode;
  permit: PermitSelection;
  stage: ReservationStage;
}): string {
  const params = new URLSearchParams();

  if (motorcycleSlug) {
    params.set("motorcycle", motorcycleSlug);
  }
  if (pickupDate) {
    params.set("pickupDate", pickupDate);
  }
  if (returnDate) {
    params.set("returnDate", returnDate);
  }
  params.set("pickupMode", pickupMode);
  params.set("permit", permit);
  params.set("stage", stage);

  return params.toString();
}

export function evaluateReservation({
  motorcycle,
  draft,
  planningReservations = [],
  planningBlocks = [],
  ignoreReservationId,
}: {
  motorcycle: CatalogMotorcycle | null;
  draft: ReservationDraft;
  planningReservations?: ReadonlyArray<PlanningReservationRecord>;
  planningBlocks?: ReadonlyArray<PlanningAvailabilityBlock>;
  ignoreReservationId?: string | null;
}): ReservationEvaluation {
  return evaluatePlanningAvailability({
    motorcycle,
    draft,
    reservations: planningReservations,
    blocks: planningBlocks,
    ignoreReservationId,
  });
}

export function getReservationAlternatives(
  motorcycles: ReadonlyArray<CatalogMotorcycle>,
  currentSlug: string,
  draft: ReservationDraft,
  planningReservations: ReadonlyArray<PlanningReservationRecord>,
  planningBlocks: ReadonlyArray<PlanningAvailabilityBlock>,
  ignoreReservationId?: string | null,
): ReadonlyArray<CatalogMotorcycle> {
  return motorcycles
    .filter((motorcycle) => motorcycle.slug !== currentSlug)
    .map((motorcycle) => ({
      motorcycle,
      evaluation: evaluatePlanningAvailability({
        motorcycle,
        draft: {
          ...draft,
          motorcycleSlug: motorcycle.slug,
        },
        reservations: planningReservations,
        blocks: planningBlocks,
        ignoreReservationId,
      }),
    }))
    .sort((left, right) => {
      const availabilityDelta =
        Number(right.evaluation.available) - Number(left.evaluation.available);
      if (availabilityDelta !== 0) {
        return availabilityDelta;
      }

      if (left.evaluation.nextAvailableAt && right.evaluation.nextAvailableAt) {
        return (
          new Date(left.evaluation.nextAvailableAt).getTime() -
          new Date(right.evaluation.nextAvailableAt).getTime()
        );
      }

      if (left.evaluation.nextAvailableAt) {
        return 1;
      }

      if (right.evaluation.nextAvailableAt) {
        return -1;
      }

      return left.motorcycle.priceFrom.amount - right.motorcycle.priceFrom.amount;
    })
    .slice(0, 3)
    .map((entry) => entry.motorcycle);
}

function parseDate(value: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
