import type { CatalogMotorcycle } from "@/app/_features/catalog/data/motorcycles";

/** Compared to the current server price under the reservation transaction lock.
 * These are accepted terms, never authoritative client-controlled prices. */
export type ReservationPriceTerms = { dailyPrice: number; depositAmount: number; currency: "EUR" };
export type ReservationPricing = ReservationPriceTerms & { totalDays: number; estimatedTotal: number };
export class ReservationPriceChangedError extends Error {
  constructor(public readonly currentPricing: ReservationPricing) {
    super("Le tarif ou le dépôt a changé. Vérifiez et acceptez les nouveaux montants avant de renvoyer la demande.");
  }
}
export function reservationPricing(motorcycle: Pick<CatalogMotorcycle, "priceFrom" | "deposit">, totalDays: number): ReservationPricing {
  return { dailyPrice: motorcycle.priceFrom.amount, depositAmount: motorcycle.deposit.amount,
    currency: "EUR", totalDays, estimatedTotal: motorcycle.priceFrom.amount * totalDays };
}
export function priceTerms(pricing: ReservationPriceTerms): ReservationPriceTerms {
  return { dailyPrice: pricing.dailyPrice, depositAmount: pricing.depositAmount, currency: pricing.currency };
}
export function samePriceTerms(left: ReservationPriceTerms, right: ReservationPriceTerms): boolean {
  return left.dailyPrice === right.dailyPrice && left.depositAmount === right.depositAmount && left.currency === right.currency;
}
