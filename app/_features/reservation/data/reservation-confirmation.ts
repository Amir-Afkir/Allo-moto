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
  | "rejected"
  | "cancelled"
  | "completed"
  | "partial";

export type ReservationConfirmationRecord = {
  state: ReservationConfirmationState;
  reference: string;
  createdAt: string;
  updatedAt: string;
  reservationId: string | null;
  selectionKey: string;
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

  void motorcycle;
  void clientValidation;
  void evaluation;
  const now = new Date().toISOString();
  const reference = planningReservation?.reference || existingRecord?.reference || "À attribuer après envoi";
  const status = planningReservation?.reservationStatus;
  const state: ReservationConfirmationState = planningReservation?.reference && (
    status === "confirmed" || status === "pending_validation" || status === "rejected" ||
    status === "cancelled" || status === "completed"
  ) ? status : "partial";
  return {
    state,
    reference,
    createdAt: existingRecord?.createdAt ?? now,
    updatedAt: now,
    reservationId: planningReservation?.id ?? existingRecord?.reservationId ?? null,
    selectionKey: reservationSelectionKey(draft),
  };
}

export function reservationSelectionKey(draft: Pick<ReservationDraft, "motorcycleSlug" | "pickupDate" | "returnDate" | "pickupMode">) {
  return JSON.stringify([draft.motorcycleSlug, draft.pickupDate, draft.returnDate, draft.pickupMode]);
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
  const terminalCopy = state === "rejected" ? "La demande a été refusée."
    : state === "cancelled" ? "La réservation a été annulée."
    : state === "completed" ? "Le retour a été enregistré. La location est terminée." : null;
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
      state === "rejected" ? "Refusée" : state === "cancelled" ? "Annulée" : state === "completed" ? "Terminée" :
      state === "confirmed"
        ? "Confirmee"
        : state === "pending_validation"
          ? "En attente de validation"
          : "A completer",
    statusNote: terminalCopy ?? (
      state === "confirmed"
        ? "La reservation est confirmee. Le paiement se fera au retrait."
        : state === "pending_validation"
          ? "La demande est enregistree. Confirmation manuelle en cours."
          : "Aucune demande enregistrée n'a encore été vérifiée."),
    heroCopy: terminalCopy ?? (
      state === "confirmed"
        ? "Conservez cette reference pour le retrait et le paiement sur place."
        : state === "pending_validation"
          ? "Votre demande est bien enregistree. Nous reviendrons vers vous pour confirmer la reservation."
          : "Envoyez votre demande ou vérifiez votre accès au suivi."),
    heroLine: motorcycleName,
    referenceValue: record.reference,
    referenceNote:
      state === "confirmed"
        ? "Reference definitive a conserver."
        : "Reference de suivi de votre demande.",
    shareCopy: `Reservation ${record.reference} - ${motorcycleName} - ${formatDateRange(draft.pickupDate, draft.returnDate)}`,
    summaryLines,
    nextStepLines: terminalCopy ? [{ label: "Statut", value: terminalCopy }] :
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
    blockingItems: planningReservation ? [] : clientValidation.readyForReview
      ? evaluation.blockers
      : [...evaluation.blockers, ...clientValidation.missingRequiredLabels],
    paymentPreviewCopy: terminalCopy ?? (
      state === "confirmed"
        ? "Paiement prevu au retrait."
        : state === "pending_validation"
          ? "Paiement au retrait une fois la reservation confirmee."
          : "Le paiement se fera au retrait, apres validation de la demande."),
    consentCopy:
      state === "confirmed"
        ? "Je conserve cette confirmation."
        : "Je comprends que le paiement se fera au retrait.",
  };
}

export function loadReservationConfirmationRecord(): ReservationConfirmationRecord | null {
  if (typeof window === "undefined") return null;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw) as Partial<ReservationConfirmationRecord>;
    const updatedAt = typeof record.updatedAt === "string" ? Date.parse(record.updatedAt) : NaN;
    if (
      typeof record.reference !== "string" || record.reference.length > 256 ||
      typeof record.reservationId !== "string" || record.reservationId.length > 256 ||
      typeof record.selectionKey !== "string" || record.selectionKey.length > 512 ||
      !Number.isFinite(updatedAt) || Date.now() - updatedAt > 14 * 24 * 60 * 60 * 1000
    ) return null;
    return {
      state: "partial",
      reference: record.reference,
      reservationId: record.reservationId,
      selectionKey: record.selectionKey,
      createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString(),
      updatedAt: record.updatedAt!,
    };
  } catch { return null; }
}

export function saveReservationConfirmationRecord(record: ReservationConfirmationRecord | null): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    if (!record?.reservationId) window.sessionStorage.removeItem(STORAGE_KEY);
    else window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Private HTTP-only receipt remains usable when browser storage is unavailable.
  }
}

export function clearReservationConfirmationRecord(): void {
  saveReservationConfirmationRecord(null);
}
