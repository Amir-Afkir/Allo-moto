/** Civil dates and opening hours belong to the rental service, never to the host OS. */
export const RENTAL_TIME_ZONE = "Europe/Paris";
export const DAY_IN_MS = 86_400_000;
export type RentalWindow = { pickupAt: string; returnAt: string };
type Schedule = { pickupDate: string; returnDate: string; pickupMode: "delivery" | "motorcycle-location" };

export function parseDateKey(value: string): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? parsed : null;
}

export function rentalDateKey(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: RENTAL_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function addCalendarDays(value: string, days: number): string {
  const date = parseDateKey(value);
  if (!date || !Number.isInteger(days)) throw new RangeError("Date invalide.");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function rentalDurationDays(pickupDate: string, returnDate: string): number {
  const start = parseDateKey(pickupDate), end = parseDateKey(returnDate);
  if (!start || !end || end < start) return 0;
  return (end.getTime() - start.getTime()) / DAY_IN_MS + 1;
}

/** The supported service hours (09, 10, 18, 19) are outside DST gaps/overlaps. */
export function rentalHourToIso(value: string, hour: number): string {
  const date = parseDateKey(value);
  if (!date || ![9, 10, 18, 19].includes(hour)) throw new RangeError("Date ou horaire invalide.");
  const target = date.getTime() + hour * 3_600_000;
  let timestamp = target;
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: RENTAL_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  for (let i = 0; i < 4; i += 1) {
    const parts = formatter.formatToParts(new Date(timestamp));
    const get = (type: string) => parts.find((part) => part.type === type)!.value;
    const displayed = new Date(`${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}.000Z`).getTime();
    if (displayed === target) return new Date(timestamp).toISOString();
    timestamp += target - displayed;
  }
  throw new RangeError("Horaire local non représentable.");
}

export function buildRentalWindow(draft: Schedule): RentalWindow {
  if (rentalDurationDays(draft.pickupDate, draft.returnDate) <= 0) throw new RangeError("Période invalide.");
  return {
    pickupAt: rentalHourToIso(draft.pickupDate, draft.pickupMode === "delivery" ? 9 : 10),
    returnAt: rentalHourToIso(draft.returnDate, draft.pickupMode === "delivery" ? 19 : 18),
  };
}

export function scheduleError(draft: Schedule, now: Date, storedWindow?: RentalWindow): string | null {
  if (!parseDateKey(draft.pickupDate) || !parseDateKey(draft.returnDate)) return "Les dates doivent être valides.";
  if (draft.returnDate < draft.pickupDate) return "Le retour doit suivre le départ.";
  if (draft.pickupDate < rentalDateKey(now)) return "Le départ ne peut pas être dans le passé.";
  const window = storedWindow ?? buildRentalWindow(draft);
  if (!Number.isFinite(Date.parse(window.pickupAt)) || !Number.isFinite(Date.parse(window.returnAt)) || Date.parse(window.returnAt) <= Date.parse(window.pickupAt)) {
    return "La période doit être valide.";
  }
  if (Date.parse(window.pickupAt) <= now.getTime()) return "L’horaire de départ est déjà passé. Choisissez un autre jour.";
  return null;
}
