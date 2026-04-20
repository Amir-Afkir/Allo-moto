import type { CatalogMotorcycle } from "@/app/_features/catalog/data/motorcycles";
import type { ReservationDraft, ReservationPickupMode } from "./reservation";

export type ReservationLifecycleStatus =
  | "draft"
  | "hold_payment"
  | "pending_validation"
  | "confirmed"
  | "ready_for_pickup"
  | "active_rental"
  | "return_due"
  | "completed"
  | "cancelled"
  | "blocked_ops";

export type ReservationLedgerPaymentStatus =
  | "none"
  | "precheckout_opened"
  | "authorized"
  | "paid"
  | "failed"
  | "expired"
  | "refunded"
  | "partial_refund";

export type FleetLifecycleStatus =
  | "active"
  | "maintenance"
  | "inactive"
  | "blocked";

export type AvailabilityBlockType =
  | "reservation"
  | "hold"
  | "maintenance"
  | "manual_block"
  | "buffer";

export type PlanningStatusTone =
  | "neutral"
  | "accent"
  | "outline"
  | "success"
  | "warning"
  | "danger";

export type PlanningReservationRecord = {
  id: string;
  reference: string;
  motorcycleSlug: string;
  pickupAt: string;
  returnAt: string;
  pickupMode: ReservationPickupMode;
  pickupLocationLabel: string;
  reservationStatus: ReservationLifecycleStatus;
  paymentStatus: ReservationLedgerPaymentStatus;
  holdExpiresAt: string | null;
  paymentSessionId: string | null;
  customerLabel: string;
  source: "seed" | "local";
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type PlanningAvailabilityBlock = {
  id: string;
  motorcycleSlug: string;
  type: AvailabilityBlockType;
  startAt: string;
  endAt: string;
  reservationId: string | null;
  label: string;
  reason: string;
  tone: PlanningStatusTone;
};

export type PlanningOperationalUsage = {
  pickupUsed: number;
  pickupCapacity: number;
  returnUsed: number;
  returnCapacity: number;
  deliveryUsed: number;
  deliveryCapacity: number;
  pickupBlocked: boolean;
  returnBlocked: boolean;
  deliveryBlocked: boolean;
};

export type ReservationAvailabilityState =
  | "available"
  | "maintenance"
  | "blocked"
  | "held"
  | "conflict"
  | "capacity";

export type ReservationAvailability = {
  available: boolean;
  state: ReservationAvailabilityState;
  fleetStatus: FleetLifecycleStatus;
  statusLabel: string;
  statusTone: PlanningStatusTone;
  availabilityLabel: string;
  eligibilityLabel: string;
  pickupLabel: string;
  durationDays: number;
  blockers: string[];
  summaryPoints: string[];
  nextStepLabel: string;
  nextAvailableAt: string | null;
  nextAvailableLabel: string | null;
  activeBlocks: ReadonlyArray<PlanningAvailabilityBlock>;
  operationalUsage: PlanningOperationalUsage;
  inventorySummary: string;
};

const DEFAULT_BUFFER_BEFORE_MINUTES = 60;
const DEFAULT_BUFFER_AFTER_MINUTES = 90;
const DEFAULT_PICKUP_HOUR = 10;
const DEFAULT_RETURN_HOUR = 18;
const DELIVERY_PICKUP_HOUR = 9;
const DELIVERY_RETURN_HOUR = 19;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const OPERATIONAL_CAPACITY = {
  pickup: 4,
  return: 5,
  delivery: 2,
} as const;

export function cleanupExpiredPlanningReservations(
  reservations: ReadonlyArray<PlanningReservationRecord>,
  now: Date = new Date(),
): PlanningReservationRecord[] {
  return reservations
    .map<PlanningReservationRecord>((reservation) => {
      if (
        reservation.reservationStatus !== "hold_payment" ||
        !reservation.holdExpiresAt
      ) {
        return reservation;
      }

      const expiresAt = new Date(reservation.holdExpiresAt);
      if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() > now.getTime()) {
        return reservation;
      }

      return {
        ...reservation,
        reservationStatus: "cancelled",
        paymentStatus: "expired",
        note: "Hold expire automatiquement.",
        updatedAt: now.toISOString(),
      };
    })
    .filter((reservation) => keepPlanningReservationHistory(reservation, now));
}

export function upsertPlanningReservation(
  reservations: ReadonlyArray<PlanningReservationRecord>,
  nextReservation: PlanningReservationRecord,
): PlanningReservationRecord[] {
  const nextList = reservations.filter(
    (reservation) => reservation.id !== nextReservation.id,
  );

  nextList.push(nextReservation);

  return nextList.sort(
    (left, right) =>
      new Date(left.pickupAt).getTime() - new Date(right.pickupAt).getTime(),
  );
}

export function findPlanningReservation(
  reservations: ReadonlyArray<PlanningReservationRecord>,
  reservationId: string | null | undefined,
): PlanningReservationRecord | null {
  if (!reservationId) {
    return null;
  }

  return reservations.find((reservation) => reservation.id === reservationId) ?? null;
}

export function getPlanningInventory(
  localReservations: ReadonlyArray<PlanningReservationRecord>,
  now: Date = new Date(),
): PlanningReservationRecord[] {
  return cleanupExpiredPlanningReservations(localReservations, now);
}

export function evaluatePlanningAvailability({
  motorcycle,
  draft,
  reservations,
  blocks = [],
  ignoreReservationId,
  now = new Date(),
}: {
  motorcycle: CatalogMotorcycle | null;
  draft: ReservationDraft;
  reservations: ReadonlyArray<PlanningReservationRecord>;
  blocks?: ReadonlyArray<PlanningAvailabilityBlock>;
  ignoreReservationId?: string | null;
  now?: Date;
}): ReservationAvailability {
  const durationDays = calculateDurationDays(draft.pickupDate, draft.returnDate);
  const blockers: string[] = [];
  const pickupLabel =
    draft.pickupMode === "delivery" ? "Livraison organisee" : "Retrait sur place";

  if (!motorcycle) {
    blockers.push("Choisissez une moto.");

    return buildAvailabilityResult({
      available: false,
      state: "conflict",
      fleetStatus: "active",
      blockers,
      pickupLabel,
      durationDays,
      activeBlocks: [],
      operationalUsage: buildEmptyOperationalUsage(),
      nextAvailableAt: null,
    });
  }

  const fleetStatus = getFleetStatus(motorcycle);
  if (fleetStatus === "maintenance") {
    blockers.push("La moto est en maintenance.");
  } else if (fleetStatus === "inactive") {
    blockers.push("La moto n'est pas ouverte a la reservation.");
  } else if (fleetStatus === "blocked") {
    blockers.push("La moto est deja reservee et ne peut pas etre reprise.");
  }

  if (durationDays <= 0) {
    blockers.push("La periode doit etre valide.");
  }

  const activeBlocks = buildActivePlanningBlocks({
    motorcycle,
    reservations,
    blocks,
    draft,
    ignoreReservationId,
    now,
  });

  if (activeBlocks.length > 0) {
    blockers.push(
      activeBlocks[0]?.type === "hold"
        ? "Un hold temporaire bloque deja ce creneau."
        : activeBlocks[0]?.type === "maintenance"
          ? "Une indisponibilite flotte bloque ce creneau."
          : "Ce creneau chevauche une reservation deja prise.",
    );
  }

  const operationalUsage = buildOperationalUsage({
    reservations,
    draft,
    ignoreReservationId,
    now,
  });

  if (operationalUsage.pickupBlocked) {
    blockers.push("Le point de retrait est complet sur ce depart.");
  }
  if (operationalUsage.returnBlocked) {
    blockers.push("Le point de retour est sature sur ce retour.");
  }
  if (operationalUsage.deliveryBlocked) {
    blockers.push("La capacite livraison est atteinte sur ce creneau.");
  }

  const nextAvailableAt = activeBlocks.length
    ? activeBlocks.reduce((latest, block) => {
        const endAt = new Date(block.endAt).getTime();
        return endAt > latest ? endAt : latest;
      }, 0)
    : null;

  const available = blockers.length === 0;
  const state: ReservationAvailabilityState = available
    ? "available"
    : fleetStatus === "maintenance"
      ? "maintenance"
      : fleetStatus === "inactive" || fleetStatus === "blocked"
        ? "blocked"
        : operationalUsage.pickupBlocked ||
            operationalUsage.returnBlocked ||
            operationalUsage.deliveryBlocked
          ? "capacity"
          : activeBlocks.some((block) => block.type === "hold")
            ? "held"
            : "conflict";

  return buildAvailabilityResult({
    available,
    state,
    fleetStatus,
    blockers,
    pickupLabel,
    durationDays,
    activeBlocks,
    operationalUsage,
    nextAvailableAt:
      nextAvailableAt && Number.isFinite(nextAvailableAt)
        ? new Date(nextAvailableAt).toISOString()
        : null,
  });
}

function buildAvailabilityResult({
  available,
  state,
  fleetStatus,
  blockers,
  pickupLabel,
  durationDays,
  activeBlocks,
  operationalUsage,
  nextAvailableAt,
}: {
  available: boolean;
  state: ReservationAvailabilityState;
  fleetStatus: FleetLifecycleStatus;
  blockers: string[];
  pickupLabel: string;
  durationDays: number;
  activeBlocks: ReadonlyArray<PlanningAvailabilityBlock>;
  operationalUsage: PlanningOperationalUsage;
  nextAvailableAt: string | null;
}): ReservationAvailability {
  return {
    available,
    state,
    fleetStatus,
    statusLabel: available
      ? "Disponible"
      : state === "held"
        ? "Hold actif"
        : state === "maintenance"
          ? "Maintenance"
          : state === "capacity"
            ? "Capacite atteinte"
            : "Indisponible",
    statusTone: available
      ? "success"
      : state === "held" || state === "capacity"
        ? "warning"
        : state === "maintenance" || state === "blocked"
          ? "danger"
          : "neutral",
    availabilityLabel: available ? "Creneau reservable" : "Creneau bloque",
    eligibilityLabel: available ? "Dossier ensuite" : "Verification requise",
    pickupLabel,
    durationDays,
    blockers,
    summaryPoints: available
      ? [
          "Moto reservable sur ce creneau.",
          "Buffers et capacite operateur valides.",
          "Vous pouvez continuer vers le dossier.",
        ]
      : blockers,
    nextStepLabel: available ? "Continuer vers le dossier" : "Corriger le creneau",
    nextAvailableAt,
    nextAvailableLabel: nextAvailableAt
      ? `Prochain creneau utile apres ${formatDateTimeLabel(nextAvailableAt)}`
      : null,
    activeBlocks,
    operationalUsage,
    inventorySummary: available
      ? "Stock et capacite alignes."
      : blockers[0] ?? "Creneau a corriger.",
  };
}

function buildActivePlanningBlocks({
  motorcycle,
  reservations,
  blocks,
  draft,
  ignoreReservationId,
  now,
}: {
  motorcycle: CatalogMotorcycle;
  reservations: ReadonlyArray<PlanningReservationRecord>;
  blocks: ReadonlyArray<PlanningAvailabilityBlock>;
  draft: ReservationDraft;
  ignoreReservationId?: string | null;
  now: Date;
}) {
  const window = getBufferedReservationWindow(draft, motorcycle);

  return buildPlanningBlocks({
    motorcycle,
    reservations,
    blocks,
    windowStartAt: window.bufferedStartAt,
    windowEndAt: window.bufferedEndAt,
    ignoreReservationId,
    now,
  });
}

function buildPlanningBlocks({
  motorcycle,
  reservations,
  blocks: externalBlocks,
  windowStartAt,
  windowEndAt,
  ignoreReservationId,
  now,
}: {
  motorcycle: CatalogMotorcycle;
  reservations: ReadonlyArray<PlanningReservationRecord>;
  blocks: ReadonlyArray<PlanningAvailabilityBlock>;
  windowStartAt: string;
  windowEndAt: string;
  ignoreReservationId?: string | null;
  now: Date;
}) {
  const blocks: PlanningAvailabilityBlock[] = [];
  const inventory = getPlanningInventory(reservations, now);

  if (motorcycle.status === "maintenance") {
    blocks.push({
      id: `${motorcycle.slug}-maintenance`,
      motorcycleSlug: motorcycle.slug,
      type: "maintenance",
      reservationId: null,
      startAt: new Date(now.getTime() - 30 * DAY_IN_MS).toISOString(),
      endAt: new Date(now.getTime() + 30 * DAY_IN_MS).toISOString(),
      label: "Maintenance flotte",
      reason: "Moto en maintenance.",
      tone: "danger",
    });
  }

  if (motorcycle.status === "reserved") {
    blocks.push({
      id: `${motorcycle.slug}-reserved`,
      motorcycleSlug: motorcycle.slug,
      type: "manual_block",
      reservationId: null,
      startAt: new Date(now.getTime() - 30 * DAY_IN_MS).toISOString(),
      endAt: new Date(now.getTime() + 30 * DAY_IN_MS).toISOString(),
      label: "Reservee hors ligne",
      reason: "Moto reservee et non ouvrable sur ce creneau.",
      tone: "warning",
    });
  }

  if (motorcycle.status === "inactive" || motorcycle.status === "draft") {
    blocks.push({
      id: `${motorcycle.slug}-inactive`,
      motorcycleSlug: motorcycle.slug,
      type: "manual_block",
      reservationId: null,
      startAt: new Date(now.getTime() - 30 * DAY_IN_MS).toISOString(),
      endAt: new Date(now.getTime() + 30 * DAY_IN_MS).toISOString(),
      label: "Hors publication",
      reason: "Moto non ouverte a la reservation.",
      tone: "outline",
    });
  }

  inventory
    .filter((reservation) => reservation.motorcycleSlug === motorcycle.slug)
    .filter((reservation) => reservation.id !== ignoreReservationId)
    .filter((reservation) => isReservationBlockingInventory(reservation, now))
    .forEach((reservation) => {
      const baseType =
        reservation.reservationStatus === "hold_payment" ? "hold" : "reservation";
      const window =
        baseType === "hold"
          ? {
              startAt: reservation.pickupAt,
              endAt: reservation.returnAt,
            }
          : getBufferedRecordWindow(reservation, motorcycle);

      blocks.push({
        id: `${reservation.id}-${baseType}`,
        motorcycleSlug: motorcycle.slug,
        type: baseType,
        reservationId: reservation.id,
        startAt: window.startAt,
        endAt: window.endAt,
        label:
          baseType === "hold"
            ? "Hold paiement"
            : reservation.reservationStatus === "active_rental"
              ? "Location en cours"
              : "Reservation planifiee",
        reason: reservation.note,
        tone: baseType === "hold" ? "warning" : "neutral",
      });
    });

  externalBlocks
    .filter((block) => block.motorcycleSlug === motorcycle.slug)
    .filter((block) => block.reservationId !== ignoreReservationId)
    .forEach((block) => {
      blocks.push(block);
    });

  return blocks.filter((block) =>
    rangesOverlap(block.startAt, block.endAt, windowStartAt, windowEndAt),
  );
}

function buildOperationalUsage({
  reservations,
  draft,
  ignoreReservationId,
  now,
}: {
  reservations: ReadonlyArray<PlanningReservationRecord>;
  draft: ReservationDraft;
  ignoreReservationId?: string | null;
  now: Date;
}): PlanningOperationalUsage {
  const inventory = getPlanningInventory(reservations, now).filter(
    (reservation) => reservation.id !== ignoreReservationId,
  );
  const pickupDate = draft.pickupDate;
  const returnDate = draft.returnDate;

  const pickupUsed = inventory.filter(
    (reservation) =>
      isReservationBlockingOperations(reservation, now) &&
      toDateKey(reservation.pickupAt) === pickupDate &&
      reservation.pickupMode === "motorcycle-location",
  ).length;
  const returnUsed = inventory.filter(
    (reservation) =>
      isReservationBlockingOperations(reservation, now) &&
      toDateKey(reservation.returnAt) === returnDate,
  ).length;
  const deliveryUsed = inventory.filter(
    (reservation) =>
      isReservationBlockingOperations(reservation, now) &&
      reservation.pickupMode === "delivery" &&
      toDateKey(reservation.pickupAt) === pickupDate,
  ).length;

  return {
    pickupUsed,
    pickupCapacity: OPERATIONAL_CAPACITY.pickup,
    returnUsed,
    returnCapacity: OPERATIONAL_CAPACITY.return,
    deliveryUsed,
    deliveryCapacity: OPERATIONAL_CAPACITY.delivery,
    pickupBlocked:
      draft.pickupMode === "motorcycle-location" &&
      pickupUsed >= OPERATIONAL_CAPACITY.pickup,
    returnBlocked: returnUsed >= OPERATIONAL_CAPACITY.return,
    deliveryBlocked:
      draft.pickupMode === "delivery" &&
      deliveryUsed >= OPERATIONAL_CAPACITY.delivery,
  };
}

function buildEmptyOperationalUsage(): PlanningOperationalUsage {
  return {
    pickupUsed: 0,
    pickupCapacity: OPERATIONAL_CAPACITY.pickup,
    returnUsed: 0,
    returnCapacity: OPERATIONAL_CAPACITY.return,
    deliveryUsed: 0,
    deliveryCapacity: OPERATIONAL_CAPACITY.delivery,
    pickupBlocked: false,
    returnBlocked: false,
    deliveryBlocked: false,
  };
}

function keepPlanningReservationHistory(
  reservation: PlanningReservationRecord,
  now: Date,
) {
  if (
    reservation.reservationStatus !== "cancelled" &&
    reservation.reservationStatus !== "completed"
  ) {
    return true;
  }

  const updatedAt = new Date(reservation.updatedAt);
  if (Number.isNaN(updatedAt.getTime())) {
    return true;
  }

  return now.getTime() - updatedAt.getTime() < 14 * DAY_IN_MS;
}

function getFleetStatus(motorcycle: CatalogMotorcycle): FleetLifecycleStatus {
  if (motorcycle.status === "maintenance") {
    return "maintenance";
  }

  if (motorcycle.status === "inactive" || motorcycle.status === "draft") {
    return "inactive";
  }

  if (motorcycle.status === "reserved") {
    return "blocked";
  }

  return "active";
}

function getBufferedRecordWindow(
  reservation: PlanningReservationRecord,
  motorcycle: CatalogMotorcycle,
) {
  const buffers = getBufferPolicy(motorcycle);
  const pickupAt = new Date(reservation.pickupAt).getTime();
  const returnAt = new Date(reservation.returnAt).getTime();

  return {
    startAt: new Date(pickupAt - buffers.beforeMinutes * 60 * 1000).toISOString(),
    endAt: new Date(returnAt + buffers.afterMinutes * 60 * 1000).toISOString(),
  };
}

function getBufferedReservationWindow(
  draft: ReservationDraft,
  motorcycle: CatalogMotorcycle,
) {
  const buffers = getBufferPolicy(motorcycle);
  const window = getReservationWindow(draft);
  const pickupAt = new Date(window.pickupAt).getTime();
  const returnAt = new Date(window.returnAt).getTime();

  return {
    ...window,
    bufferedStartAt: new Date(
      pickupAt - buffers.beforeMinutes * 60 * 1000,
    ).toISOString(),
    bufferedEndAt: new Date(
      returnAt + buffers.afterMinutes * 60 * 1000,
    ).toISOString(),
  };
}

function getReservationWindow(draft: ReservationDraft) {
  const pickupHour =
    draft.pickupMode === "delivery" ? DELIVERY_PICKUP_HOUR : DEFAULT_PICKUP_HOUR;
  const returnHour =
    draft.pickupMode === "delivery" ? DELIVERY_RETURN_HOUR : DEFAULT_RETURN_HOUR;

  return {
    pickupAt: createIsoFromDate(draft.pickupDate, pickupHour),
    returnAt: createIsoFromDate(draft.returnDate, returnHour),
  };
}

function getBufferPolicy(motorcycle: CatalogMotorcycle) {
  if (motorcycle.category === "touring") {
    return { beforeMinutes: 90, afterMinutes: 120 };
  }

  if (motorcycle.category === "sport" || motorcycle.category === "custom") {
    return { beforeMinutes: 75, afterMinutes: 120 };
  }

  return {
    beforeMinutes: DEFAULT_BUFFER_BEFORE_MINUTES,
    afterMinutes: DEFAULT_BUFFER_AFTER_MINUTES,
  };
}

function isReservationBlockingInventory(
  reservation: PlanningReservationRecord,
  now: Date,
) {
  if (
    reservation.reservationStatus === "pending_validation" ||
    reservation.reservationStatus === "cancelled" ||
    reservation.reservationStatus === "completed" ||
    reservation.reservationStatus === "draft"
  ) {
    return false;
  }

  if (
    reservation.reservationStatus === "hold_payment" &&
    reservation.holdExpiresAt &&
    new Date(reservation.holdExpiresAt).getTime() <= now.getTime()
  ) {
    return false;
  }

  return true;
}

function isReservationBlockingOperations(
  reservation: PlanningReservationRecord,
  now: Date,
) {
  return isReservationBlockingInventory(reservation, now);
}

function calculateDurationDays(pickupDate: string, returnDate: string) {
  if (!pickupDate || !returnDate) {
    return 0;
  }

  const pickupAt = createIsoFromDate(pickupDate, 0);
  const returnAt = createIsoFromDate(returnDate, 0);
  const diff =
    (new Date(returnAt).getTime() - new Date(pickupAt).getTime()) / DAY_IN_MS;

  return diff >= 0 ? Math.round(diff) + 1 : 0;
}

function createIsoFromDate(value: string, hour: number) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return new Date().toISOString();
  }

  return new Date(Date.UTC(year, month - 1, day, hour, 0, 0)).toISOString();
}

function rangesOverlap(
  startAt: string,
  endAt: string,
  windowStartAt: string,
  windowEndAt: string,
) {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  const windowStart = new Date(windowStartAt).getTime();
  const windowEnd = new Date(windowEndAt).getTime();

  if (
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    Number.isNaN(windowStart) ||
    Number.isNaN(windowEnd)
  ) {
    return false;
  }

  return start < windowEnd && end > windowStart;
}

function toDateKey(value: string) {
  return value.slice(0, 10);
}

function formatDateTimeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "date a confirmer";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
