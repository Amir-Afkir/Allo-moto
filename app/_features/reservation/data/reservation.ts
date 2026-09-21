import type { CatalogMotorcycle } from "@/app/_features/catalog/data/motorcycles";
import {
  evaluatePlanningAvailability,
  type PlanningAvailabilityBlock,
  type PlanningReservationRecord,
  type ReservationAvailability,
} from "./reservation-planning";

import { addCalendarDays, parseDateKey, rentalDateKey, rentalDurationDays, type RentalWindow } from "./rental-time";

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

export function createDefaultReservationWindow(now: Date = new Date()): { pickupDate: string; returnDate: string } {
  const today = rentalDateKey(now);
  return { pickupDate: addCalendarDays(today, 1), returnDate: addCalendarDays(today, 3) };
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

export function formatDateInputValue(date: Date): string { return rentalDateKey(date); }

export function formatDateRange(start: string, end: string): string {
  if (!start || !end) {
    return "À préciser";
  }

  const startDate = parseDateKey(start);
  const endDate = parseDateKey(end);
  if (!startDate || !endDate) {
    return "À préciser";
  }

  return `${new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", day: "numeric", month: "short" }).format(startDate)} → ${new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(endDate)}`;
}

export function calculateReservationDuration(pickupDate: string, returnDate: string): number {
  return rentalDurationDays(pickupDate, returnDate);
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
  now,
  storedWindow,
}: {
  motorcycle: CatalogMotorcycle | null;
  draft: ReservationDraft;
  planningReservations?: ReadonlyArray<PlanningReservationRecord>;
  planningBlocks?: ReadonlyArray<PlanningAvailabilityBlock>;
  ignoreReservationId?: string | null;
  now?: Date;
  storedWindow?: RentalWindow;
}): ReservationEvaluation {
  return evaluatePlanningAvailability({
    motorcycle,
    draft,
    reservations: planningReservations,
    blocks: planningBlocks,
    ignoreReservationId,
    now,
    storedWindow,
  });
}
