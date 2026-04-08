import type {
  MotoVisualTone,
  MotorcycleLicenseCategory,
} from "@/app/_features/catalog/data/motorcycles";
import type {
  MotorcycleCategory,
  Money,
  Transmission,
} from "@/app/_features/catalog/data/rental-domain";
import type {
  PermitSelection,
  ReservationPickupMode,
} from "@/app/_features/reservation/data/reservation";
import type { ReservationPreferredContact } from "@/app/_features/reservation/data/reservation-intake";

export const OPS_STORE_VERSION = 1;

export type OpsVehicleStatus = "active" | "hidden" | "maintenance";
export type OpsReservationStatus = "pending" | "confirmed";
export type OpsVehicleBlockType =
  | "reservation"
  | "maintenance"
  | "manual_block";

export type OpsVehicleRecord = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  model: string;
  category: MotorcycleCategory;
  transmission: Transmission;
  licenseCategory: MotorcycleLicenseCategory;
  locationLabel: string;
  featured: boolean;
  priceFrom: Money;
  deposit: Money;
  includedMileageKmPerDay: number;
  description: string;
  primaryImage: string;
  primaryImagePublicId: string | null;
  gallery: readonly string[];
  monogram: string;
  heroTag: string;
  editorialNote: string;
  decisionTags: readonly string[];
  visualTone: MotoVisualTone;
  opsStatus: OpsVehicleStatus;
  createdAt: string;
  updatedAt: string;
};

export type OpsReservationRecord = {
  id: string;
  reference: string;
  vehicleSlug: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  customerCountry: string;
  customerPreferredContact: ReservationPreferredContact;
  permitType: Exclude<PermitSelection, "none">;
  permitNumber: string;
  documentType: string;
  documentNumber: string;
  customerNotes: string;
  consentDataUse: boolean;
  pickupMode: ReservationPickupMode;
  pickupLocationLabel: string;
  pickupDate: string;
  returnDate: string;
  pickupAt: string;
  returnAt: string;
  totalDays: number;
  dailyPrice: number;
  estimatedTotal: number;
  depositAmount: number;
  paymentMode: "pickup";
  status: OpsReservationStatus;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
};

export type OpsVehicleBlockRecord = {
  id: string;
  vehicleSlug: string;
  type: OpsVehicleBlockType;
  startAt: string;
  endAt: string;
  reservationId: string | null;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type OpsStoreSnapshot = {
  version: number;
  vehicles: OpsVehicleRecord[];
  reservations: OpsReservationRecord[];
  vehicleBlocks: OpsVehicleBlockRecord[];
};
