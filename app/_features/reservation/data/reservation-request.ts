import { parseDateKey } from "./rental-time";
import type { ReservationDraft } from "./reservation";
import type { ReservationClientDraft } from "./reservation-intake";

export class ReservationInputError extends Error {}
export class RequestBodyError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ReservationInputError("Corps de requête invalide.");
  }
  return value as Record<string, unknown>;
}

function text(data: Record<string, unknown>, key: string, max: number, optional = false): string {
  const value = data[key];
  if (optional && value === undefined) return "";
  if (typeof value !== "string" || value.length > max) {
    throw new ReservationInputError(`Champ invalide : ${key}.`);
  }
  return value.trim();
}

function choice<T extends string>(value: unknown, options: readonly T[]): T {
  if (typeof value !== "string" || !options.includes(value as T)) {
    throw new ReservationInputError("Choix invalide dans le formulaire.");
  }
  return value as T;
}

function date(value: string): string {
  if (!parseDateKey(value)) throw new ReservationInputError("Date invalide.");
  return value;
}

export function parseIdempotencyKey(value: unknown): string {
  if (typeof value !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value)) {
    throw new RequestBodyError("Tentative invalide. Actualisez la page avant de réessayer.", 400);
  }
  return value.toLowerCase();
}

export function parseReservationRequest(value: unknown): { draft: ReservationDraft; clientDraft: ReservationClientDraft } {
  const input = object(value);
  const draft = object(input.draft);
  const client = object(input.clientDraft);
  if (client.consentDataUse !== true) throw new ReservationInputError("Consentement requis.");
  const pickupDate = date(text(draft, "pickupDate", 10));
  const returnDate = date(text(draft, "returnDate", 10));
  if (returnDate < pickupDate) throw new ReservationInputError("Le retour doit suivre le départ.");
  return {
    draft: {
      motorcycleSlug: text(draft, "motorcycleSlug", 150),
      pickupDate,
      returnDate,
      pickupMode: choice(draft.pickupMode, ["motorcycle-location", "delivery"] as const),
      permit: choice(draft.permit ?? "none", ["none", "B", "A1", "A2", "A"] as const),
    },
    clientDraft: {
      firstName: text(client, "firstName", 100),
      lastName: text(client, "lastName", 100),
      email: text(client, "email", 254),
      phone: text(client, "phone", 40),
      country: text(client, "country", 100, true),
      preferredContact: choice(client.preferredContact, ["whatsapp", "phone", "email"] as const),
      permitType: choice(client.permitType, ["B", "A1", "A2", "A"] as const),
      permitNumber: text(client, "permitNumber", 100, true),
      documentType: choice(client.documentType ?? "none", ["none", "identity-card", "passport", "driving-license"] as const),
      documentNumber: text(client, "documentNumber", 100, true),
      notes: text(client, "notes", 2000, true),
      consentDataUse: true,
    },
  };
}

/** Enforce the limit while streaming, not after an unbounded request.json(). */
export async function readReservationRequest(request: Request): Promise<unknown> {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    throw new RequestBodyError("Format de requête non pris en charge.", 415);
  }
  const maxBytes = 32 * 1024;
  const reader = request.body?.getReader();
  if (!reader) throw new RequestBodyError("Corps de requête vide.", 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new RequestBodyError("Requête trop volumineuse.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
  } catch {
    throw new RequestBodyError("JSON invalide.", 400);
  }
}
