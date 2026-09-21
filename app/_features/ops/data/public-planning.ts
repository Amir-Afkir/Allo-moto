import "server-only";
import { createHash } from "node:crypto";
import type { OpsReservationRecord, OpsVehicleBlockRecord } from "./ops-store-types";
import type { PublicPlanningBlock, PublicPlanningReservation } from "@/app/_features/reservation/data/public-planning";

export function publicPlanningId(id: string): string {
  return createHash("sha256").update(`public-planning:${id}`).digest("hex");
}

export function toPublicPlanningReservation(record: OpsReservationRecord): PublicPlanningReservation {
  return {
    id: publicPlanningId(record.id),
    motorcycleSlug: record.vehicleSlug,
    pickupAt: record.pickupAt,
    returnAt: record.returnAt,
    pickupMode: record.pickupMode,
    reservationStatus: record.status === "pending" ? "pending_validation" : record.status,
  };
}

export function toPublicPlanningBlock(block: OpsVehicleBlockRecord): PublicPlanningBlock {
  return {
    id: publicPlanningId(block.id),
    motorcycleSlug: block.vehicleSlug,
    type: block.type,
    startAt: block.startAt,
    endAt: block.endAt,
  };
}
