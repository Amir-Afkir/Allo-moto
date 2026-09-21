import type { PlanningReservationRecord } from "./reservation-planning";
import type { ReservationPricing } from "./reservation-pricing";

/** No names, contact details, documents or admin notes are needed for follow-up. */
export type PrivateReservationReceipt = PlanningReservationRecord & {
  pickupDate: string;
  returnDate: string;
  pricing: ReservationPricing;
};
