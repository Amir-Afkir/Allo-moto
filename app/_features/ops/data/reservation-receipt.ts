import "server-only";
import { getAdminReservationById } from "./ops-store";
import { toPublicPlanningReservation } from "./public-planning";
import type { OpsReservationRecord } from "./ops-store-types";
import { hydratePublicReservation } from "@/app/_features/reservation/data/public-planning";
import { getSessionSecret, readAccessToken } from "../lib/session-security";

export const RECEIPT_COOKIE = "allo-moto.reservation.receipt.v2";

/** Only called for the reservation just created, or after verifying its capability cookie. */
export function toPrivateReservationReceipt(record: OpsReservationRecord) {
  return {
    ...hydratePublicReservation(toPublicPlanningReservation(record)),
    reference: record.reference,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function getPrivateReservationReceipt(cookie: string | undefined) {
  const secret = getSessionSecret();
  if (!secret) return null;
  const id = readAccessToken(cookie, "reservation", secret);
  if (!id) return null;
  const entry = await getAdminReservationById(id);
  return entry ? toPrivateReservationReceipt(entry.reservation) : null;
}
