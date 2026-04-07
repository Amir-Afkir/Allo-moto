import {
  type CatalogMotorcycle,
  MOTORCYCLE_LICENSE_LABELS,
} from "@/app/_features/catalog/data/motorcycles";
import type { ReservationDraft, ReservationEvaluation } from "./reservation";
import type {
  ReservationClientDraft,
  ReservationClientValidation,
} from "./reservation-intake";
import type { PlanningReservationRecord } from "./reservation-planning";
import { formatMoney } from "@/app/_shared/lib/format";
import { formatDateRange } from "./reservation";

type DetailLine = { label: string; value: string; note?: string };

export type ReservationConfirmationState =
  | "pending_validation"
  | "confirmed"
  | "partial";

export type ReservationConfirmationRecord = {
  state: ReservationConfirmationState;
  reference: string;
  createdAt: string;
  updatedAt: string;
  reservationId: string | null;
};

export type ReservationConfirmationSnapshot = {
  state: ReservationConfirmationState;
  statusLabel: string;
  statusNote: string;
  heroCopy: string;
  heroLine: string;
  referenceValue: string;
  referenceNote: string;
  shareCopy: string;
  summaryLines: ReadonlyArray<DetailLine>;
  nextStepLines: ReadonlyArray<DetailLine>;
  supportLines: ReadonlyArray<DetailLine>;
  blockingItems: ReadonlyArray<string>;
  paymentPreviewCopy: string;
  consentCopy: string;
};

const STORAGE_KEY = "allo-moto.reservation.confirmation-record";

export function createReservationConfirmationRecord({
  motorcycle,
  draft,
  clientDraft,
  clientValidation,
  evaluation,
  planningReservation,
  existingRecord,
}: {
  motorcycle: CatalogMotorcycle | null;
  draft: ReservationDraft;
  clientDraft: ReservationClientDraft;
  clientValidation: ReservationClientValidation;
  evaluation: ReservationEvaluation;
  planningReservation: PlanningReservationRecord | null;
  existingRecord: ReservationConfirmationRecord | null;
}): ReservationConfirmationRecord {
  void clientDraft;

  const readyToSubmit = Boolean(
    motorcycle && evaluation.available && clientValidation.readyForReview,
  );
  const now = new Date().toISOString();
  const reference =
    planningReservation?.reference ??
    existingRecord?.reference ??
    buildReference(motorcycle, draft);

  return {
    state:
      planningReservation?.reservationStatus === "confirmed"
        ? "confirmed"
        : planningReservation?.reservationStatus === "pending_validation"
          ? "pending_validation"
          : readyToSubmit
            ? "pending_validation"
            : "partial",
    reference,
    createdAt: existingRecord?.createdAt ?? now,
    updatedAt: now,
    reservationId:
      planningReservation?.id ?? existingRecord?.reservationId ?? null,
  };
}

export function buildReservationConfirmationSnapshot({
  motorcycle,
  draft,
  clientDraft,
  clientValidation,
  evaluation,
  planningReservation,
  confirmationRecord,
}: {
  motorcycle: CatalogMotorcycle | null;
  draft: ReservationDraft;
  clientDraft: ReservationClientDraft;
  clientValidation: ReservationClientValidation;
  evaluation: ReservationEvaluation;
  planningReservation: PlanningReservationRecord | null;
  confirmationRecord: ReservationConfirmationRecord | null;
}): ReservationConfirmationSnapshot {
  const record = createReservationConfirmationRecord({
    motorcycle,
    draft,
    clientDraft,
    clientValidation,
    evaluation,
    planningReservation,
    existingRecord: confirmationRecord,
  });
  const state = record.state;
  const fullName =
    [clientDraft.firstName, clientDraft.lastName].filter(Boolean).join(" ") ||
    "Client a confirmer";
  const motorcycleName = motorcycle
    ? `${motorcycle.brand} ${motorcycle.model}`
    : "Moto a confirmer";

  const locationAmount = motorcycle
    ? formatMoney(
        motorcycle.priceFrom.amount * Math.max(evaluation.durationDays, 1),
        motorcycle.priceFrom.currency,
      )
    : "A confirmer";
  const depositAmount = motorcycle
    ? formatMoney(motorcycle.deposit.amount, motorcycle.deposit.currency)
    : "A confirmer";

  const summaryLines: ReadonlyArray<DetailLine> = [
    { label: "Client", value: fullName },
    { label: "Moto", value: motorcycleName },
    { label: "Periode", value: formatDateRange(draft.pickupDate, draft.returnDate) },
    { label: "Retrait", value: evaluation.pickupLabel },
    {
      label: "Paiement",
      value: "Au retrait",
      note:
        state === "confirmed"
          ? "A regler lors du retrait"
          : "Aucun paiement en ligne pour le moment",
    },
    { label: "Location", value: locationAmount },
    { label: "Depot", value: depositAmount },
    {
      label: "Permis",
      value: motorcycle
        ? MOTORCYCLE_LICENSE_LABELS[motorcycle.licenseCategory]
        : "A confirmer",
    },
  ];

  return {
    state,
    statusLabel:
      state === "confirmed"
        ? "Confirmee"
        : state === "pending_validation"
          ? "En attente de validation"
          : "A completer",
    statusNote:
      state === "confirmed"
        ? "La reservation est confirmee. Le paiement se fera au retrait."
        : state === "pending_validation"
          ? "La demande est enregistree. Confirmation manuelle en cours."
          : "La reservation reste incomplete pour l'instant.",
    heroCopy:
      state === "confirmed"
        ? "Conservez cette reference pour le retrait et le paiement sur place."
        : state === "pending_validation"
          ? "Votre demande est bien enregistree. Nous reviendrons vers vous pour confirmer la reservation."
          : "Terminez les etapes restantes avant l'envoi.",
    heroLine: motorcycleName,
    referenceValue: record.reference,
    referenceNote:
      state === "confirmed"
        ? "Reference definitive a conserver."
        : "Reference de suivi de votre demande.",
    shareCopy: `Reservation ${record.reference} - ${motorcycleName} - ${formatDateRange(draft.pickupDate, draft.returnDate)}`,
    summaryLines,
    nextStepLines:
      state === "confirmed"
        ? [
            { label: "Suite", value: "Paiement au retrait." },
            { label: "Action", value: "Conserver la reference." },
          ]
        : state === "pending_validation"
          ? [
              { label: "Suite", value: "Confirmation manuelle en cours." },
              { label: "Action", value: "Attendre le retour d'Allo Moto." },
            ]
          : [
              { label: "Suite", value: "Completer le dossier." },
              { label: "Action", value: "Reprendre la demande." },
            ],
    supportLines: [
      { label: "Reference", value: record.reference },
      { label: "Moto", value: motorcycleName },
      {
        label: "Contact",
        value: clientDraft.email || clientDraft.phone || "A completer",
      },
      {
        label: "Support",
        value:
          state === "confirmed"
            ? "Disponible si besoin."
            : "Disponible pendant la validation.",
      },
    ],
    blockingItems: clientValidation.readyForReview
      ? evaluation.blockers
      : [...evaluation.blockers, ...clientValidation.missingRequiredLabels],
    paymentPreviewCopy:
      state === "confirmed"
        ? "Paiement prevu au retrait."
        : state === "pending_validation"
          ? "Paiement au retrait une fois la reservation confirmee."
          : "Le paiement se fera au retrait, apres validation de la demande.",
    consentCopy:
      state === "confirmed"
        ? "Je conserve cette confirmation."
        : "Je comprends que le paiement se fera au retrait.",
  };
}

export function loadReservationConfirmationRecord(): ReservationConfirmationRecord | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<ReservationConfirmationRecord> & {
      state?: string;
    };

    if (!parsed || typeof parsed.reference !== "string") {
      return null;
    }

    const state = normalizeConfirmationState(parsed.state);
    if (!state) {
      return null;
    }

    return {
      state,
      reference: parsed.reference,
      createdAt:
        typeof parsed.createdAt === "string"
          ? parsed.createdAt
          : new Date().toISOString(),
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
      reservationId:
        typeof parsed.reservationId === "string" ? parsed.reservationId : null,
    };
  } catch {
    return null;
  }
}

export function saveReservationConfirmationRecord(
  record: ReservationConfirmationRecord | null,
): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!record) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

export function clearReservationConfirmationRecord(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

function buildReference(
  motorcycle: CatalogMotorcycle | null,
  draft: ReservationDraft,
): string {
  const base = motorcycle?.slug ?? "reservation";
  const dateToken = `${draft.pickupDate || "date"}-${draft.returnDate || "retour"}`.replaceAll(
    "-",
    "",
  );
  return `${base}-${dateToken}`.toUpperCase();
}

function normalizeConfirmationState(
  state: string | undefined,
): ReservationConfirmationState | null {
  if (state === "pending_sync" || state === "draft" || state === "ready_for_payment") {
    return "pending_validation";
  }

  if (state === "payment_pending") {
    return "pending_validation";
  }

  if (state === "confirmed" || state === "pending_validation" || state === "partial") {
    return state;
  }

  return null;
}
