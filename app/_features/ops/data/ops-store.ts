import "server-only";
import { reservationPricing, samePriceTerms, ReservationPriceChangedError, type ReservationPriceTerms } from "@/app/_features/reservation/data/reservation-pricing";
import { vehicleRevision, VehicleConflictError, type VehicleImageChange } from "../lib/vehicle-revision";
import { validateVehicleValues } from "../lib/vehicle-validation";

import { mkdir, readFile, writeFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { buildRentalWindow, rentalDateKey, rentalDurationDays, rentalHourToIso } from "@/app/_features/reservation/data/rental-time";
import { revalidateTag, unstable_cache } from "next/cache";
import { toPublicPlanningReservation, toPublicPlanningBlock } from "./public-planning";
import { parseReservationRequest, ReservationInputError, RequestBodyError, parseIdempotencyKey } from "@/app/_features/reservation/data/reservation-request";
import {
  MOTORCYCLE_CATALOG,
  MOTORCYCLE_CATEGORY_LABELS,
  MOTORCYCLE_TRANSMISSION_LABELS,
  type CatalogMotorcycle,
} from "@/app/_features/catalog/data/motorcycles";
import type {
  MotoVisualTone,
  MotorcycleLicenseCategory,
} from "@/app/_features/catalog/data/motorcycles";
import type {
  MotorcycleCategory,
  MotorcycleStatus,
  Transmission,
} from "@/app/_features/catalog/data/rental-domain";
import {
  evaluateReservation,
  calculateReservationDuration,
  type ReservationDraft,
} from "@/app/_features/reservation/data/reservation";
import {
  getBufferedRecordWindow,
  type PlanningAvailabilityBlock,
  type PlanningReservationRecord,
} from "@/app/_features/reservation/data/reservation-planning";
import {
  validateReservationClientDraft,
  type ReservationClientDraft,
} from "@/app/_features/reservation/data/reservation-intake";
import {
  hasOpsDatabase,
  loadOpsDatabaseStore,
  withOpsDatabaseStoreTransaction,
} from "./ops-store-db";
import {
  OPS_STORE_VERSION,
  type OpsReservationRecord,
  type OpsReservationStatus,
  type OpsStoreSnapshot,
  type OpsVehicleBlockRecord,
  type OpsVehicleBlockType,
  type OpsVehicleRecord,
  type OpsVehicleStatus,
} from "./ops-store-types";

export type {
  OpsReservationRecord,
  OpsReservationStatus,
  OpsVehicleBlockRecord,
  OpsVehicleBlockType,
  OpsVehicleRecord,
  OpsVehicleStatus,
} from "./ops-store-types";

const LOCAL_STORE_PATH = path.join(process.cwd(), "data", "ops-store.json");
const DEFAULT_PICKUP_HOUR = 10;
const DEFAULT_RETURN_HOUR = 18;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
let localMutationQueue: Promise<unknown> = Promise.resolve();
const PUBLIC_HOME_REVALIDATE_SECONDS = 300;
const PUBLIC_CATALOG_REVALIDATE_SECONDS = 60;

export type OpsVehicleSaveValues = {
  name: string;
  brand: string;
  category: MotorcycleCategory;
  transmission: Transmission;
  licenseCategory: MotorcycleLicenseCategory;
  locationLabel: string;
  featured: boolean;
  priceFrom: number;
  depositAmount: number;
  includedMileageKmPerDay: number;
  primaryImage: string;
  primaryImagePublicId?: string | null;
  editorialNote: string;
  opsStatus: OpsVehicleStatus;
  slug?: string;
  model?: string;
  description?: string;
  gallery?: string[];
  monogram?: string;
  heroTag?: string;
  decisionTags?: string[];
  visualTone?: MotoVisualTone;
};

export type AdminVehicleRow = {
  vehicle: OpsVehicleRecord;
  publicMotorcycle: CatalogMotorcycle;
  currentBlockLabel: string | null;
  pendingReservations: ReadonlyArray<OpsReservationRecord>;
  confirmedReservations: ReadonlyArray<OpsReservationRecord>;
  todayPickupCount: number;
  todayReturnCount: number;
  nextConfirmedReservation: OpsReservationRecord | null;
  nextActionLabel: string;
  primaryDemandId: string | null;
};

export type OpsActionSummary = {
  openReservations: number;
  pendingReservations: number;
  pickupsToday: number;
  returnsToday: number;
  maintenanceVehicles: number;
};

export type OpsReservationFocus = "pickup-today" | "return-today";

const getCachedPublicCatalog = unstable_cache(
  async () => getPublicCatalogUncached(new Date()),
  ["public-catalog-reservation-v3"],
  {
    revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS,
    tags: ["public-catalog"],
  },
);

const getCachedPublicMotorcycleBySlug = unstable_cache(
  async (slug: string) => getPublicMotorcycleBySlugUncached(slug, new Date()),
  ["public-motorcycle-by-slug-reservation-v3"],
  {
    revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS,
    tags: ["public-catalog"],
  },
);

const getCachedFeaturedPublicMotorcycles = unstable_cache(
  async (limit: number) => getFeaturedPublicMotorcyclesUncached(limit, new Date()),
  ["featured-public-motorcycles-reservation-v3"],
  {
    revalidate: PUBLIC_HOME_REVALIDATE_SECONDS,
    tags: ["public-catalog"],
  },
);

const getCachedPlanningContext = unstable_cache(
  async () => getPlanningContextUncached(new Date()),
  ["public-planning-context-reservation-v3"],
  {
    revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS,
    tags: ["public-planning"],
  },
);

const getCachedPublicHomeData = unstable_cache(
  async () => getPublicHomeDataUncached(new Date()),
  ["public-home-data-reservation-v3"],
  {
    revalidate: PUBLIC_HOME_REVALIDATE_SECONDS,
    tags: ["public-catalog", "public-home"],
  },
);

const getCachedPublicCatalogPageData = unstable_cache(
  async () => getPublicCatalogPageDataUncached(new Date()),
  ["public-catalog-page-data-reservation-v3"],
  {
    revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS,
    tags: ["public-catalog", "public-planning"],
  },
);

const getCachedPublicMotorcycleDetailPageData = unstable_cache(
  async (slug: string) =>
    getPublicMotorcycleDetailPageDataUncached(slug, new Date()),
  ["public-motorcycle-detail-page-data-reservation-v3"],
  {
    revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS,
    tags: ["public-catalog", "public-planning"],
  },
);

export async function getPublicCatalog(now?: Date) {
  if (!now) {
    return getCachedPublicCatalog();
  }

  return getPublicCatalogUncached(now);
}

export async function getPublicMotorcycleBySlug(slug: string, now?: Date) {
  if (!now) {
    return getCachedPublicMotorcycleBySlug(slug);
  }

  return getPublicMotorcycleBySlugUncached(slug, now);
}

export async function getFeaturedPublicMotorcycles(limit = 3, now?: Date) {
  if (!now) {
    return getCachedFeaturedPublicMotorcycles(limit);
  }

  return getFeaturedPublicMotorcyclesUncached(limit, now);
}

export async function getPlanningContext(now?: Date) {
  if (!now) {
    return getCachedPlanningContext();
  }

  return getPlanningContextUncached(now);
}

export async function getPublicHomeData(now?: Date) {
  if (!now) {
    return getCachedPublicHomeData();
  }

  return getPublicHomeDataUncached(now);
}

export async function getPublicCatalogPageData(now?: Date) {
  if (!now) {
    return getCachedPublicCatalogPageData();
  }

  return getPublicCatalogPageDataUncached(now);
}

export async function getPublicMotorcycleDetailPageData(
  slug: string,
  now?: Date,
) {
  if (!now) {
    return getCachedPublicMotorcycleDetailPageData(slug);
  }

  return getPublicMotorcycleDetailPageDataUncached(slug, now);
}

export async function getReservationPageData(
  requestedMotorcycleSlug?: string | null,
  now: Date = new Date(),
) {
  const store = await readStore();
  const motorcycles = buildPublicCatalogFromStore(store, now);
  const requestedMotorcycle = requestedMotorcycleSlug
    ? motorcycles.find((motorcycle) => motorcycle.slug === requestedMotorcycleSlug) ?? null
    : null;

  return {
    motorcycles,
    planning: buildPlanningContextFromStore(store, now),
    requestedMotorcycle,
  };
}

async function getPublicCatalogUncached(now: Date) {
  const store = await readStore();
  return buildPublicCatalogFromStore(store, now);
}

async function getPublicMotorcycleBySlugUncached(slug: string, now: Date) {
  const store = await readStore();
  return findPublicMotorcycleFromStore(store, slug, now);
}

async function getFeaturedPublicMotorcyclesUncached(limit: number, now: Date) {
  const store = await readStore();
  return getFeaturedFromCatalog(buildPublicCatalogFromStore(store, now), limit);
}

async function getPlanningContextUncached(now: Date) {
  const store = await readStore();
  return buildPlanningContextFromStore(store, now);
}

async function getPublicHomeDataUncached(now: Date) {
  const store = await readStore();
  const catalog = buildPublicCatalogFromStore(store, now);

  return {
    motorcycles: getFeaturedFromCatalog(catalog, 3),
  };
}

async function getPublicCatalogPageDataUncached(now: Date) {
  const store = await readStore();

  return {
    motorcycles: buildPublicCatalogFromStore(store, now),
    planning: buildPlanningContextFromStore(store, now),
  };
}

async function getPublicMotorcycleDetailPageDataUncached(slug: string, now: Date) {
  const store = await readStore();
  const catalog = buildPublicCatalogFromStore(store, now);

  return {
    motorcycle: findPublicMotorcycleFromStore(store, slug, now),
    catalog,
    planning: buildPlanningContextFromStore(store, now),
  };
}

function buildPublicCatalogFromStore(store: OpsStoreSnapshot, now: Date) {
  return store.vehicles
    .filter((vehicle) => vehicle.opsStatus !== "hidden")
    .map((vehicle) => buildCatalogMotorcycle(vehicle, store, now));
}

function findPublicMotorcycleFromStore(
  store: OpsStoreSnapshot,
  slug: string,
  now: Date,
) {
  const vehicle =
    store.vehicles.find(
      (candidate) => candidate.slug === slug && candidate.opsStatus !== "hidden",
    ) ?? null;

  return vehicle ? buildCatalogMotorcycle(vehicle, store, now) : null;
}

function buildPlanningContextFromStore(store: OpsStoreSnapshot, now: Date) {
  const visibleSlugs = new Set(store.vehicles
    .filter((vehicle) => vehicle.opsStatus !== "hidden")
    .map((vehicle) => vehicle.slug));
  return {
    reservations: store.reservations
      .filter((reservation) => reservation.status === "confirmed" && visibleSlugs.has(reservation.vehicleSlug))
      .map(toPublicPlanningReservation),
    blocks: store.vehicleBlocks
      .filter((block) => block.type !== "reservation" && visibleSlugs.has(block.vehicleSlug))
      .map(toPublicPlanningBlock),
    motorcycles: buildPublicCatalogFromStore(store, now),
  };
}

function getFeaturedFromCatalog(
  catalog: ReadonlyArray<CatalogMotorcycle>,
  limit: number,
) {
  const featured = catalog.filter((motorcycle) => motorcycle.featured);
  return (featured.length > 0 ? featured : catalog).slice(0, limit);
}

export async function listAdminVehicles(now: Date = new Date()): Promise<AdminVehicleRow[]> {
  const store = await readStore();
  const todayKey = getLocalDateKey(now);

  return store.vehicles.map((vehicle) => {
    const publicMotorcycle = buildCatalogMotorcycle(vehicle, store, now);
    const currentBlocks = getCurrentVehicleBlocks(store, vehicle.slug, now);
    const nextScheduledBlock =
      store.vehicleBlocks
        .filter((block) => block.vehicleSlug === vehicle.slug)
        .filter((block) => new Date(block.endAt).getTime() >= now.getTime())
        .sort((left, right) => left.startAt.localeCompare(right.startAt))[0] ?? null;
    const vehicleReservations = store.reservations
      .filter((reservation) => reservation.vehicleSlug === vehicle.slug)
      .sort((left, right) => left.pickupAt.localeCompare(right.pickupAt));
    const pendingReservations = vehicleReservations.filter(
      (reservation) => reservation.status === "pending",
    );
    const confirmedReservations = vehicleReservations.filter(
      (reservation) => reservation.status === "confirmed",
    );
    const todayPickupCount = confirmedReservations.filter(
      (reservation) => reservation.pickupDate === todayKey,
    ).length;
    const todayReturnCount = confirmedReservations.filter(
      (reservation) => reservation.returnDate === todayKey,
    ).length;
    const nextConfirmedReservation =
      confirmedReservations.find(
        (reservation) => new Date(reservation.returnAt).getTime() >= now.getTime(),
      ) ?? null;

    return {
      vehicle,
      publicMotorcycle,
      currentBlockLabel: currentBlocks[0]?.note ?? null,
      pendingReservations,
      confirmedReservations,
      todayPickupCount,
      todayReturnCount,
      nextConfirmedReservation,
      nextActionLabel: buildVehicleActionLabel({
        currentBlockLabel: currentBlocks[0]?.note ?? null,
        pendingReservations,
        todayPickupCount,
        todayReturnCount,
        nextConfirmedReservation,
        nextScheduledBlockLabel:
          nextScheduledBlock && !nextScheduledBlock.reservationId
            ? nextScheduledBlock.note
            : null,
      }),
      primaryDemandId: pendingReservations[0]?.id ?? null,
    };
  });
}

export async function getAdminVehicleBySlug(slug: string, now: Date = new Date()) {
  const store = await readStore();
  const vehicle = store.vehicles.find((candidate) => candidate.slug === slug) ?? null;

  if (!vehicle) {
    return null;
  }

  return {
    vehicle,
    publicMotorcycle: buildCatalogMotorcycle(vehicle, store, now),
    blocks: store.vehicleBlocks
      .filter((block) => block.vehicleSlug === slug)
      .sort((left, right) => left.startAt.localeCompare(right.startAt)),
    reservations: store.reservations
      .filter((reservation) => reservation.vehicleSlug === slug)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
  };
}

export async function listAdminReservations(filters?: {
  status?: OpsReservationStatus | "all";
  query?: string;
  focus?: OpsReservationFocus | null;
  vehicleSlug?: string | null;
  now?: Date;
}) {
  const store = await readStore();
  const query = filters?.query?.trim().toLowerCase() ?? "";
  const todayKey = getLocalDateKey(filters?.now ?? new Date());

  return store.reservations
    .filter((reservation) =>
      filters?.status && filters.status !== "all"
        ? reservation.status === filters.status
        : true,
    )
    .filter((reservation) =>
      filters?.vehicleSlug ? reservation.vehicleSlug === filters.vehicleSlug : true,
    )
    .filter((reservation) => {
      if (filters?.focus === "pickup-today") {
        return reservation.status === "confirmed" && reservation.pickupDate === todayKey;
      }

      if (filters?.focus === "return-today") {
        return reservation.status === "confirmed" && reservation.returnDate === todayKey;
      }

      return true;
    })
    .filter((reservation) => {
      if (!query) {
        return true;
      }

      const vehicle =
        store.vehicles.find((candidate) => candidate.slug === reservation.vehicleSlug) ??
        null;

      return [
        reservation.reference,
        reservation.vehicleSlug,
        vehicle?.brand ?? "",
        vehicle?.name ?? "",
        reservation.pickupDate,
        reservation.returnDate,
        reservation.customerFirstName,
        reservation.customerLastName,
        reservation.customerEmail,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((reservation) => ({
      reservation,
      vehicle:
        store.vehicles.find((vehicle) => vehicle.slug === reservation.vehicleSlug) ??
        null,
    }));
}

export async function getOpsActionSummary(now: Date = new Date()): Promise<OpsActionSummary> {
  const store = await readStore();
  const todayKey = getLocalDateKey(now);

  return {
    openReservations: store.reservations.filter((reservation) =>
      reservation.status === "pending" || reservation.status === "confirmed",
    ).length,
    pendingReservations: store.reservations.filter(
      (reservation) => reservation.status === "pending",
    ).length,
    pickupsToday: store.reservations.filter(
      (reservation) =>
        reservation.status === "confirmed" && reservation.pickupDate === todayKey,
    ).length,
    returnsToday: store.reservations.filter(
      (reservation) =>
        reservation.status === "confirmed" && reservation.returnDate === todayKey,
    ).length,
    maintenanceVehicles: getMaintenanceVehicleCount(store, now),
  };
}

/** Caller must verify each private capability before requesting these records. */
export async function getReservationRecordsByIds(ids: readonly string[]) {
  const allowed = new Set(ids.slice(0, 8));
  if (!allowed.size) return [];
  const store = await readStore();
  return store.reservations.filter((record) => allowed.has(record.id));
}

export async function getAdminReservationById(id: string) {
  const store = await readStore();
  const reservation = store.reservations.find((candidate) => candidate.id === id) ?? null;

  if (!reservation) {
    return null;
  }

  return {
    reservation,
    vehicle:
      store.vehicles.find((vehicle) => vehicle.slug === reservation.vehicleSlug) ??
      null,
    linkedBlocks: store.vehicleBlocks.filter((block) => block.reservationId === id),
  };
}

export async function createReservationRequest(input: {
  draft: ReservationDraft;
  clientDraft: ReservationClientDraft;
  idempotencyKey?: string;
  expectedPricing: ReservationPriceTerms;
}) {
  const key = input.idempotencyKey === undefined ? undefined : parseIdempotencyKey(input.idempotencyKey);
  input = parseReservationRequest(input);
  const keyHash = key ? createHash("sha256").update(key).digest("hex") : null;
  const requestHash = key ? createHash("sha256").update(JSON.stringify(input)).digest("hex") : null;
  return updateStore(async (store) => {
    // Check inside the same transaction/lock as the insert, before time/availability checks.
    // A retry of a committed request must succeed even if the slot is no longer available.
    if (keyHash) {
      const existing = store.reservations.find((record) => record.idempotencyKeyHash === keyHash);
      if (existing) {
        if (existing.requestHash !== requestHash) {
          throw new RequestBodyError("Cette tentative correspond à un autre formulaire. Actualisez la page.", 409);
        }
        return { reservation: existing, planningReservation: toPlanningReservationRecord(existing) };
      }
    }
    const vehicle = store.vehicles.find(
      (candidate) => candidate.slug === input.draft.motorcycleSlug,
    );
    if (!vehicle) {
      throw new ReservationInputError("Moto introuvable.");
    }

    const currentPricing = reservationPricing(vehicle, calculateReservationDuration(input.draft.pickupDate, input.draft.returnDate));
    if (!samePriceTerms(input.expectedPricing, currentPricing)) throw new ReservationPriceChangedError(currentPricing);

    const clientValidation = validateReservationClientDraft(
      input.clientDraft,
      vehicle.licenseCategory,
    );
    if (!clientValidation.readyForReview) {
      throw new ReservationInputError(
        clientValidation.permitCompatibilityMessage ??
          "Le dossier client est incomplet.",
      );
    }

    const publicMotorcycle = buildCatalogMotorcycle(vehicle, store, new Date());
    const planningReservations = store.reservations.map(toPlanningReservationRecord);
    const planningBlocks = store.vehicleBlocks
      .filter((block) => block.type !== "reservation")
      .map(toPlanningAvailabilityBlock);
    const evaluation = evaluateReservation({
      motorcycle: publicMotorcycle,
      draft: input.draft,
      planningReservations,
      planningBlocks,
    });

    if (!evaluation.available) {
      throw new ReservationInputError(evaluation.blockers[0] ?? "Creneau indisponible.");
    }

    const nowIso = new Date().toISOString();
    const reservationId = `reservation-${randomUUID()}`;
    const window = buildRentalWindow(input.draft);
    const totalDays = Math.max(calculateReservationDuration(input.draft.pickupDate, input.draft.returnDate), 1);
    const reservation: OpsReservationRecord = {
      id: reservationId,
      reference: buildReservationReference(vehicle.slug, store.reservations),
      idempotencyKeyHash: keyHash,
      requestHash,
      vehicleSlug: vehicle.slug,
      customerFirstName: input.clientDraft.firstName.trim(),
      customerLastName: input.clientDraft.lastName.trim(),
      customerEmail: input.clientDraft.email.trim(),
      customerPhone: input.clientDraft.phone.trim(),
      customerCountry: input.clientDraft.country.trim(),
      customerPreferredContact: input.clientDraft.preferredContact,
      permitType: input.clientDraft.permitType === "none" ? vehicle.licenseCategory : input.clientDraft.permitType,
      permitNumber: input.clientDraft.permitNumber.trim(),
      documentType: input.clientDraft.documentType,
      documentNumber: input.clientDraft.documentNumber.trim(),
      customerNotes: input.clientDraft.notes.trim(),
      consentDataUse: input.clientDraft.consentDataUse,
      pickupMode: input.draft.pickupMode,
      pickupLocationLabel:
        input.draft.pickupMode === "delivery"
          ? "Livraison a confirmer"
          : vehicle.locationLabel,
      pickupDate: input.draft.pickupDate,
      returnDate: input.draft.returnDate,
      pickupAt: window.pickupAt,
      returnAt: window.returnAt,
      totalDays,
      dailyPrice: vehicle.priceFrom.amount,
      estimatedTotal: vehicle.priceFrom.amount * totalDays,
      depositAmount: vehicle.deposit.amount,
      paymentMode: "pickup",
      status: "pending",
      adminNote: "Demande recue. Paiement au retrait.",
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    store.reservations.unshift(reservation);

    return {
      reservation,
      planningReservation: toPlanningReservationRecord(reservation),
    };
  });
}

export async function updateReservationStatus(input: {
  reservationId: string;
  nextStatus: "confirmed" | "rejected" | "cancelled" | "completed";
  adminNote?: string;
}) {
  return updateStore(async (store) => {
    const reservation = store.reservations.find(
      (candidate) => candidate.id === input.reservationId,
    );
    if (!reservation) {
      throw new Error("Reservation introuvable.");
    }

    // Terminal records remain readable but cannot be reopened by a stale admin form.
    if (reservation.status === input.nextStatus) {
      return { reservationId: reservation.id, removed: false };
    }
    const allowed = reservation.status === "pending"
      ? ["confirmed", "rejected", "cancelled"]
      : reservation.status === "confirmed" ? ["cancelled", "completed"] : [];
    if (!allowed.includes(input.nextStatus)) {
      throw new Error("Transition de reservation invalide.");
    }
    if (input.nextStatus === "completed" && new Date(reservation.pickupAt).getTime() > Date.now()) {
      throw new Error("Le depart de cette location n'a pas encore eu lieu.");
    }

    if (input.nextStatus === "confirmed") {
      const publicMotorcycle = buildCatalogMotorcycle(
        store.vehicles.find((candidate) => candidate.slug === reservation.vehicleSlug)!,
        store,
        new Date(),
      );
      const planningReservations = store.reservations
        .filter((candidate) => candidate.id !== reservation.id)
        .map(toPlanningReservationRecord);
      const planningBlocks = store.vehicleBlocks
        .filter(
          (block) =>
            block.type !== "reservation" ||
            block.reservationId !== reservation.id,
        )
        .filter((block) => block.type !== "reservation")
        .map(toPlanningAvailabilityBlock);
      const evaluation = evaluateReservation({
        motorcycle: publicMotorcycle,
        draft: {
          motorcycleSlug: reservation.vehicleSlug,
          pickupDate: reservation.pickupDate,
          returnDate: reservation.returnDate,
          pickupMode: reservation.pickupMode,
          permit: reservation.permitType,
        },
        planningReservations,
        planningBlocks,
        // Existing instants are contractual data: do not reinterpret legacy requests.
        storedWindow: { pickupAt: reservation.pickupAt, returnAt: reservation.returnAt },
      });

      if (!evaluation.available) {
        throw new Error(
          evaluation.blockers[0] ?? "Ce creneau ne peut plus etre confirme.",
        );
      }
    }

    if (input.nextStatus === "confirmed") {
      reservation.status = "confirmed";
      reservation.adminNote =
        input.adminNote?.trim() || getReservationStatusNote("confirmed");
      reservation.updatedAt = new Date().toISOString();

      store.vehicleBlocks = store.vehicleBlocks.filter((block) => {
        if (block.reservationId !== reservation.id) {
          return true;
        }

        return block.type !== "reservation";
      });

      store.vehicleBlocks.push({
        id: `block-${reservation.id}`,
        vehicleSlug: reservation.vehicleSlug,
        type: "reservation",
        startAt: reservation.pickupAt,
        endAt: reservation.returnAt,
        reservationId: reservation.id,
        note: `Reservation confirmee ${reservation.reference}`,
        createdAt: reservation.updatedAt,
        updatedAt: reservation.updatedAt,
      });

      return {
        reservationId: reservation.id,
        removed: false,
      };
    }

    reservation.status = input.nextStatus;
    reservation.adminNote = input.adminNote?.trim() || getReservationStatusNote(input.nextStatus);
    reservation.updatedAt = new Date().toISOString();
    store.vehicleBlocks = store.vehicleBlocks.filter(
      (block) => block.reservationId !== reservation.id,
    );

    return { reservationId: reservation.id, removed: false };
  });
}

export async function saveVehicle(input: {
  currentSlug?: string | null;
  expectedRevision?: string;
  imageChange?: VehicleImageChange;
  values: OpsVehicleSaveValues;
}) {
  input = { ...input, values: validateVehicleValues(input.values) };
  return updateStore(async (store) => {
    const existingVehicle = input.currentSlug
      ? store.vehicles.find((vehicle) => vehicle.slug === input.currentSlug) ?? null
      : null;
    if (input.currentSlug && !existingVehicle) throw new Error("Moto introuvable.");
    if (existingVehicle && input.expectedRevision !== vehicleRevision(existingVehicle)) throw new VehicleConflictError();
    // Resolve keep from the locked record, never from a form's stale URL.
    const imageChange = input.imageChange ?? { kind: "keep" as const };
    const image = imageChange.kind === "replace" ? imageChange.asset
      : imageChange.kind === "remove" ? { src: "", publicId: null }
      : { src: existingVehicle?.primaryImage ?? input.values.primaryImage, publicId: existingVehicle?.primaryImagePublicId ?? input.values.primaryImagePublicId ?? null };
    const nextSlug = normalizeVehicleSlug(
      input.values.slug ?? "",
      existingVehicle?.slug ?? null,
      input.values.brand,
      input.values.name,
    );

    if (
      store.vehicles.some(
        (vehicle) =>
          vehicle.slug === nextSlug &&
          vehicle.slug !== existingVehicle?.slug,
      )
    ) {
      throw new Error("Ce slug est deja utilise.");
    }

    const nowIso = new Date().toISOString();
    const nextName = readOrFallback(input.values.name, existingVehicle?.name, "Vehicule");
    const nextBrand = readOrFallback(input.values.brand, existingVehicle?.brand, "Marque");
    const nextNote = readOrFallback(
      input.values.editorialNote,
      existingVehicle?.editorialNote,
      `${nextBrand} ${nextName}`,
    );
    const nextVehicle: OpsVehicleRecord = {
      id: existingVehicle?.id ?? `vehicle-${nextSlug}`,
      slug: nextSlug,
      name: nextName,
      brand: nextBrand,
      model: readOrFallback(input.values.model, existingVehicle?.model, nextName),
      category: input.values.category,
      transmission: input.values.transmission,
      licenseCategory: input.values.licenseCategory,
      locationLabel: input.values.locationLabel,
      featured: input.values.featured,
      priceFrom: { amount: input.values.priceFrom, currency: "EUR" },
      deposit: { amount: input.values.depositAmount, currency: "EUR" },
      includedMileageKmPerDay: input.values.includedMileageKmPerDay,
      description: readOrFallback(
        input.values.description,
        existingVehicle?.description,
        nextNote,
      ),
      primaryImage: image.src,
      primaryImagePublicId: image.publicId,
      gallery:
        (input.values.gallery?.length ?? 0) > 0
          ? (input.values.gallery ?? [])
          : (existingVehicle?.gallery ?? []),
      monogram: readOrFallback(
        input.values.monogram,
        existingVehicle?.monogram,
        buildVehicleMonogram(nextName),
      ),
      heroTag: readOrFallback(
        input.values.heroTag,
        existingVehicle?.heroTag,
        nextNote,
      ),
      editorialNote: nextNote,
      decisionTags:
        (input.values.decisionTags?.length ?? 0) > 0
          ? (input.values.decisionTags ?? [])
          : (existingVehicle?.decisionTags.length
              ? existingVehicle.decisionTags
              : buildDecisionTags(
                  input.values.category,
                  input.values.licenseCategory,
                  input.values.transmission,
                )),
      visualTone:
        input.values.visualTone ||
        existingVehicle?.visualTone ||
        "sand",
      opsStatus: input.values.opsStatus,
      createdAt: existingVehicle?.createdAt ?? nowIso,
      updatedAt: nowIso,
    };

    if (existingVehicle) {
      const previousSlug = existingVehicle.slug;
      store.vehicles = store.vehicles.map((vehicle) =>
        vehicle.id === existingVehicle.id ? nextVehicle : vehicle,
      );

      if (previousSlug !== nextVehicle.slug) {
        store.reservations = store.reservations.map((reservation) =>
          reservation.vehicleSlug === previousSlug
            ? { ...reservation, vehicleSlug: nextVehicle.slug }
            : reservation,
        );
        store.vehicleBlocks = store.vehicleBlocks.map((block) =>
          block.vehicleSlug === previousSlug
            ? { ...block, vehicleSlug: nextVehicle.slug }
            : block,
        );
      }
    } else {
      store.vehicles.unshift(nextVehicle);
    }

    const previousSrc = existingVehicle?.primaryImage;
    // The asset is eligible for cleanup only if no persisted primary/gallery still uses it.
    const stillReferenced = previousSrc && store.vehicles.some((vehicle) =>
      vehicle.primaryImage === previousSrc || vehicle.gallery.includes(previousSrc) ||
      (existingVehicle?.primaryImagePublicId && vehicle.primaryImagePublicId === existingVehicle.primaryImagePublicId));
    const replacedImage = previousSrc && previousSrc !== image.src && !stillReferenced
      ? { src: previousSrc, publicId: existingVehicle?.primaryImagePublicId ?? null } : null;
    return { ...nextVehicle, replacedImage };
  });
}

function readOrFallback(
  value: string | undefined,
  fallback: string | undefined,
  finalValue: string,
) {
  const trimmed = value?.trim();
  if (trimmed) {
    return trimmed;
  }

  const nextFallback = fallback?.trim();
  if (nextFallback) {
    return nextFallback;
  }

  return finalValue;
}

function normalizeVehicleSlug(
  value: string | undefined,
  existingSlug: string | null,
  brand: string,
  name: string,
) {
  const explicit = slugifyVehicleSegment(value);
  if (explicit) {
    return explicit;
  }

  if (existingSlug) {
    return existingSlug;
  }

  return slugifyVehicleSegment(`${brand} ${name}`) || `vehicule-${Date.now().toString(36)}`;
}

function slugifyVehicleSegment(value: string | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildVehicleMonogram(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "VM";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function buildDecisionTags(
  category: MotorcycleCategory,
  licenseCategory: MotorcycleLicenseCategory,
  transmission: Transmission,
) {
  return [
    MOTORCYCLE_CATEGORY_LABELS[category],
    licenseCategory,
    MOTORCYCLE_TRANSMISSION_LABELS[transmission],
  ];
}

export async function updateVehicleOpsStatus(input: {
  vehicleSlug: string;
  nextStatus: OpsVehicleStatus;
}) {
  return updateStore(async (store) => {
    const vehicle = store.vehicles.find(
      (candidate) => candidate.slug === input.vehicleSlug,
    );

    if (!vehicle) {
      throw new Error("Moto introuvable.");
    }

    vehicle.opsStatus = input.nextStatus;
    vehicle.updatedAt = new Date().toISOString();

    return vehicle;
  });
}

export async function deleteVehicle(input: { vehicleSlug: string }) {
  return updateStore(async (store) => {
    const vehicle = store.vehicles.find(
      (candidate) => candidate.slug === input.vehicleSlug,
    );

    if (!vehicle) {
      throw new Error("Moto introuvable.");
    }

    const hasReservationHistory = store.reservations.some(
      (reservation) => reservation.vehicleSlug === input.vehicleSlug,
    );

    if (hasReservationHistory) {
      throw new Error("Ce vehicule possede un historique. Masquez-le plutot que le supprimer.");
    }

    store.vehicles = store.vehicles.filter(
      (candidate) => candidate.slug !== input.vehicleSlug,
    );
    store.vehicleBlocks = store.vehicleBlocks.filter(
      (block) => block.vehicleSlug !== input.vehicleSlug,
    );

    return vehicle;
  });
}

export async function addVehicleBlock(input: {
  vehicleSlug: string;
  type: Extract<OpsVehicleBlockType, "maintenance" | "manual_block">;
  startDate: string;
  endDate: string;
  note: string;
}) {
  return updateStore(async (store) => {
    const vehicle = store.vehicles.find((candidate) => candidate.slug === input.vehicleSlug);
    if (!vehicle) {
      throw new Error("Moto introuvable.");
    }

    if (!["maintenance", "manual_block"].includes(input.type) || rentalDurationDays(input.startDate, input.endDate) <= 0) {
      throw new Error("Blocage invalide : vérifiez le type et la période.");
    }
    const startAt = rentalHourToIso(input.startDate, DEFAULT_PICKUP_HOUR);
    const endAt = rentalHourToIso(input.endDate, DEFAULT_RETURN_HOUR);
    const motorcycle = buildCatalogMotorcycle(vehicle, store, new Date());
    const conflicts = store.reservations.some((record) => {
      if (record.vehicleSlug !== vehicle.slug || record.status !== "confirmed") return false;
      const occupied = getBufferedRecordWindow(toPlanningReservationRecord(record), motorcycle);
      return rangesOverlap(startAt, endAt, occupied.startAt, occupied.endAt) || Date.parse(record.returnAt) < Date.now();
    });
    if (conflicts) throw new Error("Une location confirmée ou non rendue empêche ce blocage.");

    store.vehicleBlocks.unshift({
      id: `block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      vehicleSlug: input.vehicleSlug,
      type: input.type,
      startAt,
      endAt,
      reservationId: null,
      note: input.note.trim() || (input.type === "maintenance" ? "Maintenance planifiee" : "Blocage manuel"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });
}

export async function removeVehicleBlock(input: { blockId: string }) {
  return updateStore(async (store) => {
    store.vehicleBlocks = store.vehicleBlocks.filter(
      (block) => block.id !== input.blockId || block.reservationId !== null,
    );
  });
}

function buildCatalogMotorcycle(
  vehicle: OpsVehicleRecord,
  store: OpsStoreSnapshot,
  now: Date,
): CatalogMotorcycle {
  const currentBlocks = getCurrentVehicleBlocks(store, vehicle.slug, now);
  const status = resolvePublicStatus(vehicle, currentBlocks);

  return {
    slug: vehicle.slug,
    name: vehicle.name,
    brand: vehicle.brand,
    model: vehicle.model,
    category: vehicle.category,
    status,
    bookingStatus: vehicle.opsStatus === "hidden" ? "inactive"
      : vehicle.opsStatus === "maintenance" ? "maintenance"
      : store.reservations.some((record) => record.vehicleSlug === vehicle.slug && record.status === "confirmed" && Date.parse(record.returnAt) < now.getTime())
        ? "blocked" : "active",
    transmission: vehicle.transmission,
    licenseCategory: vehicle.licenseCategory,
    locationLabel: vehicle.locationLabel,
    featured: vehicle.featured,
    priceFrom: vehicle.priceFrom,
    deposit: vehicle.deposit,
    includedMileageKmPerDay: vehicle.includedMileageKmPerDay,
    description: vehicle.description,
    primaryImage: vehicle.primaryImage,
    gallery: vehicle.gallery,
    monogram: vehicle.monogram,
    heroTag: vehicle.heroTag,
    editorialNote: vehicle.editorialNote,
    decisionTags: vehicle.decisionTags,
    availabilityCopy: getAvailabilityCopy(status),
    visualTone: vehicle.visualTone,
  };
}

function resolvePublicStatus(
  vehicle: OpsVehicleRecord,
  currentBlocks: OpsVehicleBlockRecord[],
): MotorcycleStatus {
  if (vehicle.opsStatus === "hidden") {
    return "inactive";
  }

  if (
    vehicle.opsStatus === "maintenance" ||
    currentBlocks.some((block) => block.type === "maintenance")
  ) {
    return "maintenance";
  }

  if (currentBlocks.some((block) => block.type === "reservation" || block.type === "manual_block")) {
    return "reserved";
  }

  return "available";
}

function getAvailabilityCopy(status: MotorcycleStatus) {
  switch (status) {
    case "reserved":
      return "Indisponible";
    case "maintenance":
      return "En maintenance";
    case "inactive":
    case "draft":
      return "Hors catalogue";
    case "available":
    default:
      return "Disponible";
  }
}

function getCurrentVehicleBlocks(
  store: OpsStoreSnapshot,
  vehicleSlug: string,
  now: Date,
) {
  const from = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
  const to = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

  const confirmedReservationIds = new Set(
    store.reservations
      .filter((reservation) => reservation.status === "confirmed")
      .map((reservation) => reservation.id),
  );

  return store.vehicleBlocks.filter((block) => {
    if (block.vehicleSlug !== vehicleSlug) {
      return false;
    }

    if (block.type === "reservation" && block.reservationId) {
      return (
        confirmedReservationIds.has(block.reservationId) &&
        (rangesOverlap(block.startAt, block.endAt, from, to) ||
          new Date(block.endAt).getTime() < now.getTime())
      );
    }

    return rangesOverlap(block.startAt, block.endAt, from, to);
  });
}

export function toPlanningReservationRecord(
  reservation: OpsReservationRecord,
): PlanningReservationRecord {
  return {
    id: reservation.id,
    reference: reservation.reference,
    motorcycleSlug: reservation.vehicleSlug,
    pickupAt: reservation.pickupAt,
    returnAt: reservation.returnAt,
    pickupMode: reservation.pickupMode,
    pickupLocationLabel: reservation.pickupLocationLabel,
    reservationStatus:
      reservation.status === "pending" ? "pending_validation" : reservation.status,
    paymentStatus: "none",
    holdExpiresAt: null,
    paymentSessionId: null,
    customerLabel: [reservation.customerFirstName, reservation.customerLastName]
      .filter(Boolean)
      .join(" "),
    source: "local",
    note: reservation.adminNote,
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt,
  };
}

function toPlanningAvailabilityBlock(
  block: OpsVehicleBlockRecord,
): PlanningAvailabilityBlock {
  return {
    id: block.id,
    motorcycleSlug: block.vehicleSlug,
    type: block.type,
    startAt: block.startAt,
    endAt: block.endAt,
    reservationId: block.reservationId,
    label:
      block.type === "maintenance"
        ? "Maintenance"
        : block.type === "reservation"
          ? "Reservation"
          : "Blocage manuel",
    reason: block.note,
    tone:
      block.type === "maintenance"
        ? "danger"
        : block.type === "reservation"
          ? "neutral"
          : "warning",
  };
}

async function updateStore<T>(
  mutate: (store: OpsStoreSnapshot) => Promise<T> | T,
) {
  if (hasOpsDatabase()) {
    const result = await withOpsDatabaseStoreTransaction(async (store, persist) => {
      const normalized = normalizeStore(store);
      const workingStore = normalized.store;

      if (normalized.changed) {
        await persist(workingStore);
      }

      const result = await mutate(workingStore);
      await persist(workingStore);

      return result;
    });
    // Publish invalidation only after the transaction has committed.
    invalidatePublicData();
    return result;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "DATABASE_URL is required in production for mutable ops-store operations.",
    );
  }

  const operation = localMutationQueue.then(async () => {
    const store = await readLocalStore();
    const result = await mutate(store);
    await writeLocalStore(store);
    invalidatePublicData();
    return result;
  });
  localMutationQueue = operation.catch(() => undefined);
  return operation;
}

function invalidatePublicData() {
  for (const tag of ["public-catalog", "public-planning", "public-home"]) {
    try { revalidateTag(tag); }
    catch { console.error("Public cache invalidation failed after commit."); }
  }
}

async function readStore(): Promise<OpsStoreSnapshot> {
  if (hasOpsDatabase()) {
    const store = await loadOpsDatabaseStore();
    const normalized = normalizeStore(store);

    if (!normalized.changed) {
      return normalized.store;
    }

    return withOpsDatabaseStoreTransaction(async (currentStore, persist) => {
      const nextNormalized = normalizeStore(currentStore);

      if (nextNormalized.changed) {
        await persist(nextNormalized.store);
      }

      return nextNormalized.store;
    });
  }

  return readLocalStore({
    persistNormalization: false,
  });
}

async function readLocalStore(options?: {
  persistNormalization?: boolean;
}): Promise<OpsStoreSnapshot> {
  await ensureLocalStoreFile(options);

  const raw = await readFile(LOCAL_STORE_PATH, "utf8");
  const parsed: OpsStoreSnapshot = JSON.parse(raw);
  if (!parsed || parsed.version !== OPS_STORE_VERSION || !Array.isArray(parsed.vehicles) ||
      !Array.isArray(parsed.reservations) || !Array.isArray(parsed.vehicleBlocks)) {
    throw new Error("Local store is invalid. Restore a backup; the existing file has been preserved.");
  }
  const normalized = normalizeStore(parsed);
  if (normalized.changed && options?.persistNormalization !== false) {
    await writeLocalStore(normalized.store);
  }
  return normalized.store;
}

async function ensureLocalStoreFile(options?: { persistNormalization?: boolean }) {
  try {
    await readFile(LOCAL_STORE_PATH, "utf8");
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error;
    // A missing bundled store is only expected for a new local development directory.
    if (options?.persistNormalization === false) throw error;
    await writeLocalStore(createSeedStore());
  }
}

async function writeLocalStore(store: OpsStoreSnapshot) {
  const directory = path.dirname(LOCAL_STORE_PATH);
  await mkdir(directory, { recursive: true });
  const temporary = `${LOCAL_STORE_PATH}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(store, null, 2), "utf8");
    await rename(temporary, LOCAL_STORE_PATH);
  } finally {
    await rm(temporary, { force: true });
  }
}

function createSeedStore(now: Date = new Date()): OpsStoreSnapshot {
  const nowIso = now.toISOString();

  return {
    version: OPS_STORE_VERSION,
    vehicles: MOTORCYCLE_CATALOG.map((motorcycle) => ({
      id: `vehicle-${motorcycle.slug}`,
      slug: motorcycle.slug,
      name: motorcycle.name,
      brand: motorcycle.brand,
      model: motorcycle.model,
      category: motorcycle.category,
      transmission: motorcycle.transmission,
      licenseCategory: motorcycle.licenseCategory,
      locationLabel: motorcycle.locationLabel,
      featured: motorcycle.featured,
      priceFrom: motorcycle.priceFrom,
      deposit: motorcycle.deposit,
      includedMileageKmPerDay: motorcycle.includedMileageKmPerDay,
      description: motorcycle.description,
      primaryImage: motorcycle.primaryImage,
      primaryImagePublicId: null,
      gallery: motorcycle.gallery,
      monogram: motorcycle.monogram,
      heroTag: motorcycle.heroTag,
      editorialNote: motorcycle.editorialNote,
      decisionTags: motorcycle.decisionTags,
      visualTone: motorcycle.visualTone,
      opsStatus:
        motorcycle.status === "maintenance"
          ? "maintenance"
          : motorcycle.status === "inactive" || motorcycle.status === "draft"
            ? "hidden"
            : "active",
      createdAt: nowIso,
      updatedAt: nowIso,
    })),
    reservations: [],
    vehicleBlocks: MOTORCYCLE_CATALOG.filter(
      (motorcycle) => motorcycle.status === "reserved",
    ).map((motorcycle) => ({
      id: `seed-block-${motorcycle.slug}`,
      vehicleSlug: motorcycle.slug,
      type: "manual_block" as const,
      startAt: new Date(now.getTime() - 30 * DAY_IN_MS).toISOString(),
      endAt: new Date(now.getTime() + 30 * DAY_IN_MS).toISOString(),
      reservationId: null,
      note: "Bloquee hors ligne.",
      createdAt: nowIso,
      updatedAt: nowIso,
    })),
  };
}

function normalizeStore(store: OpsStoreSnapshot) {
  let vehicleChanged = false;
  const nextVehicles = store.vehicles.map((vehicle) => {
    const nextPrimaryImagePublicId =
      typeof vehicle.primaryImagePublicId === "string"
        ? vehicle.primaryImagePublicId
        : null;

    if (nextPrimaryImagePublicId === vehicle.primaryImagePublicId) {
      return vehicle;
    }

    vehicleChanged = true;
    return {
      ...vehicle,
      primaryImagePublicId: nextPrimaryImagePublicId,
    };
  });

  // Reading data must never delete customer history or imply a physical return.
  const nextReservations = store.reservations;

  const confirmedReservationIds = new Set(
    nextReservations
      .filter((reservation) => reservation.status === "confirmed")
      .map((reservation) => reservation.id),
  );

  const nextBlocks = store.vehicleBlocks.filter((block) => {
    if (!block.reservationId) {
      return true;
    }

    if (block.type === "reservation") {
      return confirmedReservationIds.has(block.reservationId);
    }

    return nextReservations.some(
      (reservation) => reservation.id === block.reservationId,
    );
  });

  const changed =
    vehicleChanged ||
    nextReservations.length !== store.reservations.length ||
    nextBlocks.length !== store.vehicleBlocks.length;

  return {
    changed,
    store: changed
      ? {
          ...store,
          vehicles: nextVehicles,
          reservations: nextReservations,
          vehicleBlocks: nextBlocks,
        }
      : store,
  };
}

function buildVehicleActionLabel({
  currentBlockLabel,
  pendingReservations,
  todayPickupCount,
  todayReturnCount,
  nextConfirmedReservation,
  nextScheduledBlockLabel,
}: {
  currentBlockLabel: string | null;
  pendingReservations: ReadonlyArray<OpsReservationRecord>;
  todayPickupCount: number;
  todayReturnCount: number;
  nextConfirmedReservation: OpsReservationRecord | null;
  nextScheduledBlockLabel: string | null;
}) {
  if (pendingReservations.length > 0) {
    return `${pendingReservations.length} demande${pendingReservations.length > 1 ? "s" : ""} en attente.`;
  }

  if (todayPickupCount > 0) {
    return `${todayPickupCount} depart${todayPickupCount > 1 ? "s" : ""} aujourd'hui.`;
  }

  if (todayReturnCount > 0) {
    return `${todayReturnCount} retour${todayReturnCount > 1 ? "s" : ""} aujourd'hui.`;
  }

  if (currentBlockLabel) {
    return currentBlockLabel;
  }

  if (nextScheduledBlockLabel) {
    return nextScheduledBlockLabel;
  }

  if (nextConfirmedReservation) {
    return `Reservee du ${nextConfirmedReservation.pickupDate} au ${nextConfirmedReservation.returnDate}.`;
  }

  return "Libre aujourd'hui.";
}

function getMaintenanceVehicleCount(store: OpsStoreSnapshot, now: Date) {
  const vehicleSlugs = new Set(
    store.vehicles
      .filter((vehicle) => vehicle.opsStatus === "maintenance")
      .map((vehicle) => vehicle.slug),
  );

  store.vehicleBlocks
    .filter((block) => block.type === "maintenance")
    .filter((block) =>
      rangesOverlap(
        block.startAt,
        block.endAt,
        new Date(now.getTime() - DAY_IN_MS).toISOString(),
        new Date(now.getTime() + DAY_IN_MS).toISOString(),
      ),
    )
    .forEach((block) => {
      vehicleSlugs.add(block.vehicleSlug);
    });

  return vehicleSlugs.size;
}

function getLocalDateKey(date: Date) { return rentalDateKey(date); }

function buildReservationReference(vehicleSlug: string, existing: readonly OpsReservationRecord[]) {
  const slug = vehicleSlug.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase();
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const stamp = randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
    const reference = `AM-${slug}-${stamp}`;
    if (!existing.some((record) => record.reference === reference)) return reference;
  }
  throw new Error("Impossible de générer une référence unique.");
}

function getReservationStatusNote(status: OpsReservationStatus) {
  switch (status) {
    case "confirmed":
      return "Reservation confirmee. Paiement au retrait.";
    case "rejected":
      return "Demande refusee.";
    case "cancelled":
      return "Reservation annulee.";
    case "completed":
      return "Retour enregistre. Location terminee.";
    case "pending":
    default:
      return "Demande recue.";
  }
}

function rangesOverlap(
  startAt: string,
  endAt: string,
  windowStartAt: string,
  windowEndAt: string,
) {
  return (
    new Date(startAt).getTime() < new Date(windowEndAt).getTime() &&
    new Date(windowStartAt).getTime() < new Date(endAt).getTime()
  );
}
