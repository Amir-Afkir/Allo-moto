import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import postgres, { type Sql, type TransactionSql } from "postgres";
import { MOTORCYCLE_CATALOG } from "@/app/_features/catalog/data/motorcycles";
import {
  OPS_STORE_VERSION,
  type OpsReservationRecord,
  type OpsStoreSnapshot,
  type OpsVehicleBlockRecord,
  type OpsVehicleRecord,
} from "./ops-store-types";

const DATABASE_URL = process.env.DATABASE_URL?.trim() || "";
const SEED_FILE_PATH = path.join(process.cwd(), "data", "ops-store.json");
const DB_LOCK_KEY = 48151623;

type OpsSql = Sql<Record<string, never>>;
type OpsDbExecutor =
  | Sql<Record<string, never>>
  | TransactionSql<Record<string, never>>;

type VehicleRow = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  model: string;
  category: OpsVehicleRecord["category"];
  transmission: OpsVehicleRecord["transmission"];
  license_category: OpsVehicleRecord["licenseCategory"];
  location_label: string;
  featured: boolean;
  price_amount: number;
  price_currency: string;
  deposit_amount: number;
  deposit_currency: string;
  included_mileage_km_per_day: number;
  description: string;
  primary_image: string;
  primary_image_public_id: string | null;
  gallery: unknown;
  monogram: string;
  hero_tag: string;
  editorial_note: string;
  decision_tags: unknown;
  visual_tone: OpsVehicleRecord["visualTone"];
  ops_status: OpsVehicleRecord["opsStatus"];
  created_at: string;
  updated_at: string;
  sort_order: number;
};

type ReservationRow = {
  id: string;
  reference: string;
  vehicle_slug: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone: string;
  customer_country: string;
  customer_preferred_contact: OpsReservationRecord["customerPreferredContact"];
  permit_type: OpsReservationRecord["permitType"];
  permit_number: string;
  document_type: string;
  document_number: string;
  customer_notes: string;
  consent_data_use: boolean;
  pickup_mode: OpsReservationRecord["pickupMode"];
  pickup_location_label: string;
  pickup_date: string;
  return_date: string;
  pickup_at: string;
  return_at: string;
  total_days: number;
  daily_price: number;
  estimated_total: number;
  deposit_amount: number;
  payment_mode: "pickup";
  status: OpsReservationRecord["status"];
  admin_note: string;
  created_at: string;
  updated_at: string;
  sort_order: number;
};

type VehicleBlockRow = {
  id: string;
  vehicle_slug: string;
  type: OpsVehicleBlockRecord["type"];
  start_at: string;
  end_at: string;
  reservation_id: string | null;
  note: string;
  created_at: string;
  updated_at: string;
  sort_order: number;
};

const globalForOpsStore = globalThis as typeof globalThis & {
  __alloMotoOpsSql?: OpsSql;
  __alloMotoOpsDbReady?: Promise<void>;
};

export function hasOpsDatabase() {
  return Boolean(DATABASE_URL);
}

export async function loadOpsDatabaseStore(): Promise<OpsStoreSnapshot> {
  await ensureOpsDatabaseReady();
  const sql = getOpsSql();
  return readSnapshot(sql);
}

export async function saveOpsDatabaseStore(store: OpsStoreSnapshot) {
  await ensureOpsDatabaseReady();
  const sql = getOpsSql();
  await sql.begin(async (tx) => {
    await lockStore(tx);
    await replaceSnapshot(tx, store);
  });
}

export async function withOpsDatabaseStoreTransaction<T>(
  work: (
    store: OpsStoreSnapshot,
    persist: (nextStore: OpsStoreSnapshot) => Promise<void>,
  ) => Promise<T> | T,
) {
  await ensureOpsDatabaseReady();
  const sql = getOpsSql();

  return sql.begin(async (tx) => {
    await lockStore(tx);
    let currentStore = await readSnapshot(tx);

    return work(currentStore, async (nextStore) => {
      currentStore = nextStore;
      await replaceSnapshot(tx, currentStore);
    });
  });
}

async function ensureOpsDatabaseReady() {
  if (!hasOpsDatabase()) {
    throw new Error("DATABASE_URL is required to use the database-backed ops store.");
  }

  if (!globalForOpsStore.__alloMotoOpsDbReady) {
    globalForOpsStore.__alloMotoOpsDbReady = bootstrapOpsDatabase().catch(
      (error) => {
        globalForOpsStore.__alloMotoOpsDbReady = undefined;
        throw error;
      },
    );
  }

  await globalForOpsStore.__alloMotoOpsDbReady;
}

function getOpsSql(): OpsSql {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is missing.");
  }

  if (globalForOpsStore.__alloMotoOpsSql) {
    return globalForOpsStore.__alloMotoOpsSql;
  }

  const sql = postgres(DATABASE_URL, {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: process.env.NODE_ENV === "production" ? "require" : undefined,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForOpsStore.__alloMotoOpsSql = sql;
  }

  return sql;
}

async function bootstrapOpsDatabase() {
  const sql = getOpsSql();

  await sql.begin(async (tx) => {
    await lockStore(tx);
    await createSchema(tx);
    await seedDatabaseIfEmpty(tx);
  });
}

async function createSchema(sql: OpsDbExecutor) {
  await sql`
    create table if not exists ops_vehicles (
      id text primary key,
      slug text not null unique,
      name text not null,
      brand text not null,
      model text not null,
      category text not null,
      transmission text not null,
      license_category text not null,
      location_label text not null,
      featured boolean not null,
      price_amount integer not null,
      price_currency text not null,
      deposit_amount integer not null,
      deposit_currency text not null,
      included_mileage_km_per_day integer not null,
      description text not null,
      primary_image text not null,
      primary_image_public_id text,
      gallery jsonb not null default '[]'::jsonb,
      monogram text not null,
      hero_tag text not null,
      editorial_note text not null,
      decision_tags jsonb not null default '[]'::jsonb,
      visual_tone text not null,
      ops_status text not null,
      created_at text not null,
      updated_at text not null,
      sort_order integer not null
    )
  `;
  await sql`
    alter table ops_vehicles
    add column if not exists primary_image_public_id text
  `;

  await sql`
    create table if not exists ops_reservations (
      id text primary key,
      reference text not null,
      vehicle_slug text not null,
      customer_first_name text not null,
      customer_last_name text not null,
      customer_email text not null,
      customer_phone text not null,
      customer_country text not null,
      customer_preferred_contact text not null,
      permit_type text not null,
      permit_number text not null,
      document_type text not null,
      document_number text not null,
      customer_notes text not null,
      consent_data_use boolean not null,
      pickup_mode text not null,
      pickup_location_label text not null,
      pickup_date text not null,
      return_date text not null,
      pickup_at text not null,
      return_at text not null,
      total_days integer not null,
      daily_price integer not null,
      estimated_total integer not null,
      deposit_amount integer not null,
      payment_mode text not null,
      status text not null,
      admin_note text not null,
      created_at text not null,
      updated_at text not null,
      sort_order integer not null
    )
  `;

  await sql`
    create table if not exists ops_vehicle_blocks (
      id text primary key,
      vehicle_slug text not null,
      type text not null,
      start_at text not null,
      end_at text not null,
      reservation_id text,
      note text not null,
      created_at text not null,
      updated_at text not null,
      sort_order integer not null
    )
  `;

  await sql`
    create index if not exists ops_vehicles_sort_order_idx
      on ops_vehicles (sort_order)
  `;
  await sql`
    create index if not exists ops_reservations_sort_order_idx
      on ops_reservations (sort_order)
  `;
  await sql`
    create index if not exists ops_reservations_status_idx
      on ops_reservations (status)
  `;
  await sql`
    create index if not exists ops_vehicle_blocks_sort_order_idx
      on ops_vehicle_blocks (sort_order)
  `;
}

async function seedDatabaseIfEmpty(sql: OpsDbExecutor) {
  const rows = await sql<{ count: string }[]>`
    select count(*)::text as count from ops_vehicles
  `;
  const existingCount = Number(rows[0]?.count ?? 0);

  if (existingCount > 0) {
    return;
  }

  const seedStore = await readSeedStore();
  await replaceSnapshot(sql, seedStore);
}

async function readSnapshot(sql: OpsDbExecutor): Promise<OpsStoreSnapshot> {
  const [vehicles, reservations, vehicleBlocks] = await Promise.all([
    sql<VehicleRow[]>`
      select *
      from ops_vehicles
      order by sort_order asc
    `,
    sql<ReservationRow[]>`
      select *
      from ops_reservations
      order by sort_order asc
    `,
    sql<VehicleBlockRow[]>`
      select *
      from ops_vehicle_blocks
      order by sort_order asc
    `,
  ]);

  return {
    version: OPS_STORE_VERSION,
    vehicles: vehicles.map(mapVehicleRow),
    reservations: reservations.map(mapReservationRow),
    vehicleBlocks: vehicleBlocks.map(mapVehicleBlockRow),
  };
}

async function replaceSnapshot(sql: OpsDbExecutor, store: OpsStoreSnapshot) {
  await sql`delete from ops_vehicle_blocks`;
  await sql`delete from ops_reservations`;
  await sql`delete from ops_vehicles`;

  for (const [index, vehicle] of store.vehicles.entries()) {
    await sql`
      insert into ops_vehicles (
        id,
        slug,
        name,
        brand,
        model,
        category,
        transmission,
        license_category,
        location_label,
        featured,
        price_amount,
        price_currency,
        deposit_amount,
        deposit_currency,
        included_mileage_km_per_day,
        description,
        primary_image,
        primary_image_public_id,
        gallery,
        monogram,
        hero_tag,
        editorial_note,
        decision_tags,
        visual_tone,
        ops_status,
        created_at,
        updated_at,
        sort_order
      )
      values (
        ${vehicle.id},
        ${vehicle.slug},
        ${vehicle.name},
        ${vehicle.brand},
        ${vehicle.model},
        ${vehicle.category},
        ${vehicle.transmission},
        ${vehicle.licenseCategory},
        ${vehicle.locationLabel},
        ${vehicle.featured},
        ${vehicle.priceFrom.amount},
        ${vehicle.priceFrom.currency},
        ${vehicle.deposit.amount},
        ${vehicle.deposit.currency},
        ${vehicle.includedMileageKmPerDay},
        ${vehicle.description},
        ${vehicle.primaryImage},
        ${vehicle.primaryImagePublicId},
        ${JSON.stringify(vehicle.gallery)}::jsonb,
        ${vehicle.monogram},
        ${vehicle.heroTag},
        ${vehicle.editorialNote},
        ${JSON.stringify(vehicle.decisionTags)}::jsonb,
        ${vehicle.visualTone},
        ${vehicle.opsStatus},
        ${vehicle.createdAt},
        ${vehicle.updatedAt},
        ${index}
      )
    `;
  }

  for (const [index, reservation] of store.reservations.entries()) {
    await sql`
      insert into ops_reservations (
        id,
        reference,
        vehicle_slug,
        customer_first_name,
        customer_last_name,
        customer_email,
        customer_phone,
        customer_country,
        customer_preferred_contact,
        permit_type,
        permit_number,
        document_type,
        document_number,
        customer_notes,
        consent_data_use,
        pickup_mode,
        pickup_location_label,
        pickup_date,
        return_date,
        pickup_at,
        return_at,
        total_days,
        daily_price,
        estimated_total,
        deposit_amount,
        payment_mode,
        status,
        admin_note,
        created_at,
        updated_at,
        sort_order
      )
      values (
        ${reservation.id},
        ${reservation.reference},
        ${reservation.vehicleSlug},
        ${reservation.customerFirstName},
        ${reservation.customerLastName},
        ${reservation.customerEmail},
        ${reservation.customerPhone},
        ${reservation.customerCountry},
        ${reservation.customerPreferredContact},
        ${reservation.permitType},
        ${reservation.permitNumber},
        ${reservation.documentType},
        ${reservation.documentNumber},
        ${reservation.customerNotes},
        ${reservation.consentDataUse},
        ${reservation.pickupMode},
        ${reservation.pickupLocationLabel},
        ${reservation.pickupDate},
        ${reservation.returnDate},
        ${reservation.pickupAt},
        ${reservation.returnAt},
        ${reservation.totalDays},
        ${reservation.dailyPrice},
        ${reservation.estimatedTotal},
        ${reservation.depositAmount},
        ${reservation.paymentMode},
        ${reservation.status},
        ${reservation.adminNote},
        ${reservation.createdAt},
        ${reservation.updatedAt},
        ${index}
      )
    `;
  }

  for (const [index, block] of store.vehicleBlocks.entries()) {
    await sql`
      insert into ops_vehicle_blocks (
        id,
        vehicle_slug,
        type,
        start_at,
        end_at,
        reservation_id,
        note,
        created_at,
        updated_at,
        sort_order
      )
      values (
        ${block.id},
        ${block.vehicleSlug},
        ${block.type},
        ${block.startAt},
        ${block.endAt},
        ${block.reservationId},
        ${block.note},
        ${block.createdAt},
        ${block.updatedAt},
        ${index}
      )
    `;
  }
}

async function lockStore(sql: OpsDbExecutor) {
  await sql`select pg_advisory_xact_lock(${DB_LOCK_KEY})`;
}

function mapVehicleRow(row: VehicleRow): OpsVehicleRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    model: row.model,
    category: row.category,
    transmission: row.transmission,
    licenseCategory: row.license_category,
    locationLabel: row.location_label,
    featured: row.featured,
    priceFrom: {
      amount: row.price_amount,
      currency: row.price_currency,
    },
    deposit: {
      amount: row.deposit_amount,
      currency: row.deposit_currency,
    },
    includedMileageKmPerDay: row.included_mileage_km_per_day,
    description: row.description,
    primaryImage: row.primary_image,
    primaryImagePublicId: row.primary_image_public_id,
    gallery: parseStringArray(row.gallery),
    monogram: row.monogram,
    heroTag: row.hero_tag,
    editorialNote: row.editorial_note,
    decisionTags: parseStringArray(row.decision_tags),
    visualTone: row.visual_tone,
    opsStatus: row.ops_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReservationRow(row: ReservationRow): OpsReservationRecord {
  return {
    id: row.id,
    reference: row.reference,
    vehicleSlug: row.vehicle_slug,
    customerFirstName: row.customer_first_name,
    customerLastName: row.customer_last_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    customerCountry: row.customer_country,
    customerPreferredContact: row.customer_preferred_contact,
    permitType: row.permit_type,
    permitNumber: row.permit_number,
    documentType: row.document_type,
    documentNumber: row.document_number,
    customerNotes: row.customer_notes,
    consentDataUse: row.consent_data_use,
    pickupMode: row.pickup_mode,
    pickupLocationLabel: row.pickup_location_label,
    pickupDate: row.pickup_date,
    returnDate: row.return_date,
    pickupAt: row.pickup_at,
    returnAt: row.return_at,
    totalDays: row.total_days,
    dailyPrice: row.daily_price,
    estimatedTotal: row.estimated_total,
    depositAmount: row.deposit_amount,
    paymentMode: row.payment_mode,
    status: row.status,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVehicleBlockRow(row: VehicleBlockRow): OpsVehicleBlockRecord {
  return {
    id: row.id,
    vehicleSlug: row.vehicle_slug,
    type: row.type,
    startAt: row.start_at,
    endAt: row.end_at,
    reservationId: row.reservation_id,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed.map((entry) => String(entry)) : [];
    } catch {
      return [];
    }
  }

  return [];
}

async function readSeedStore(): Promise<OpsStoreSnapshot> {
  try {
    const raw = await readFile(SEED_FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<OpsStoreSnapshot>;

    if (
      parsed.version === OPS_STORE_VERSION &&
      Array.isArray(parsed.vehicles) &&
      Array.isArray(parsed.reservations) &&
      Array.isArray(parsed.vehicleBlocks)
    ) {
      return {
        version: OPS_STORE_VERSION,
        vehicles: (parsed.vehicles as OpsVehicleRecord[]).map((vehicle) => ({
          ...vehicle,
          primaryImagePublicId: vehicle.primaryImagePublicId ?? null,
        })),
        reservations: parsed.reservations as OpsReservationRecord[],
        vehicleBlocks: parsed.vehicleBlocks as OpsVehicleBlockRecord[],
      };
    }
  } catch {
    // Fall back to the bundled catalog when the JSON seed is unavailable.
  }

  return createCatalogSeedStore();
}

function createCatalogSeedStore(now: Date = new Date()): OpsStoreSnapshot {
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
      startAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      reservationId: null,
      note: "Bloquee hors ligne.",
      createdAt: nowIso,
      updatedAt: nowIso,
    })),
  };
}
