import "server-only";
import { createHash } from "node:crypto";
import type { PrivateReservationReceipt } from "@/app/_features/reservation/data/private-receipt";
import { getAdminReservationById, getReservationRecordsByIds } from "./ops-store";
import { publicPlanningId, toPublicPlanningReservation } from "./public-planning";
import type { OpsReservationRecord } from "./ops-store-types";
import { hydratePublicReservation } from "@/app/_features/reservation/data/public-planning";
import { getSessionSecret, readAccessToken } from "../lib/session-security";

export const RECEIPT_COOKIE = "allo-moto.reservation.receipt.v2";

/** Only called for the reservation just created, or after verifying its capability cookie. */
export function toPrivateReservationReceipt(record: OpsReservationRecord): PrivateReservationReceipt {
  return {
    ...hydratePublicReservation(toPublicPlanningReservation(record)),
    reference: record.reference,
    pickupDate: record.pickupDate,
    returnDate: record.returnDate,
    pricing: { dailyPrice: record.dailyPrice, totalDays: record.totalDays,
      estimatedTotal: record.estimatedTotal, depositAmount: record.depositAmount, currency: "EUR" },
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

const RECEIPT_PREFIX = "allo-moto.reservation.receipt.v3.";
export const MAX_BROWSER_RECEIPTS = 8;
type Cookie = { name: string; value: string };
export function receiptCookieName(id: string): string {
  return RECEIPT_PREFIX + createHash("sha256").update(id).digest("hex").slice(0, 24);
}

/** Each cookie authorizes exactly one record. Independent Set-Cookie names also
 * prevent simultaneous POST responses from overwriting one another. */
export function receiptCapabilities(cookies: readonly Cookie[]) {
  const secret = getSessionSecret();
  if (!secret) return [];
  const capabilities = cookies.filter(({ name }) => name === RECEIPT_COOKIE ||
    new RegExp(`^${RECEIPT_PREFIX.replaceAll(".", "\\.")}[a-f0-9]{24}$`).test(name))
    .slice(0, 32).flatMap(({ name, value }) => {
      const id = readAccessToken(value, "reservation", secret);
      if (!id || (name !== RECEIPT_COOKIE && name !== receiptCookieName(id))) return [];
      // Only decode claims after authenticating the complete token.
      const issuedAt = JSON.parse(Buffer.from(value.split(".")[0], "base64url").toString("utf8")).issuedAt as number;
      return [{ name, id, issuedAt }];
    }).sort((a, b) => b.issuedAt - a.issuedAt || a.name.localeCompare(b.name));
  return capabilities.filter((capability, index) => capabilities.findIndex((item) => item.id === capability.id) === index);
}

export async function getBrowserReservationReceipts(cookies: readonly Cookie[], requestedId?: string | null) {
  const capabilities = receiptCapabilities(cookies);
  if (requestedId) {
    // An ID/URL is a selector, never a credential. Do not query arbitrary IDs.
    const capability = capabilities.find(({ id }) => publicPlanningId(id) === requestedId);
    if (!capability) return [];
    return (await getReservationRecordsByIds([capability.id])).map(toPrivateReservationReceipt);
  }
  const recent = capabilities.slice(0, MAX_BROWSER_RECEIPTS);
  const records = await getReservationRecordsByIds(recent.map(({ id }) => id));
  return recent.flatMap(({ id }) => {
    const record = records.find((entry) => entry.id === id);
    return record ? [toPrivateReservationReceipt(record)] : [];
  });
}
