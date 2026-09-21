import type { PlanningAvailabilityBlock, PlanningReservationRecord } from "./reservation-planning";

/** Only occupancy data may cross the public Server Component boundary. */
export type PublicPlanningReservation = Pick<PlanningReservationRecord,
  "id" | "motorcycleSlug" | "pickupAt" | "returnAt" | "pickupMode" | "reservationStatus"
>;
export type PublicPlanningBlock = Pick<PlanningAvailabilityBlock,
  "id" | "motorcycleSlug" | "type" | "startAt" | "endAt"
>;

export function hydratePublicReservation(record: PublicPlanningReservation): PlanningReservationRecord {
  return {
    ...record,
    reference: "",
    pickupLocationLabel: "",
    paymentStatus: "none",
    holdExpiresAt: null,
    paymentSessionId: null,
    customerLabel: "",
    source: "local",
    note: "",
    createdAt: "",
    updatedAt: "",
  };
}

export function hydratePublicBlock(block: PublicPlanningBlock): PlanningAvailabilityBlock {
  return {
    ...block,
    reservationId: null,
    label: block.type === "maintenance" ? "Maintenance" : "Indisponible",
    reason: "Créneau indisponible.",
    tone: block.type === "maintenance" ? "danger" : "warning",
  };
}
