import type { OpsVehicleSaveValues } from "../data/ops-store";

const CATEGORIES = ["scooter", "roadster", "adventure", "touring", "sport", "custom", "electric"] as const;
const TRANSMISSIONS = ["automatic", "manual"] as const;
const PERMITS = ["B", "A1", "A2", "A"] as const;
const STATUSES = ["active", "hidden", "maintenance"] as const;

export class VehicleValidationError extends Error {}

function text(value: unknown, label: string, max: number, required = true): string {
  if (typeof value !== "string" || value.length > max || (required && !value.trim())) {
    throw new VehicleValidationError(`${label} invalide.`);
  }
  return value.trim();
}
function choice<T extends string>(value: unknown, choices: readonly T[], label: string): T {
  const result = choices.find((item) => item === value);
  if (!result) throw new VehicleValidationError(`${label} invalide.`);
  return result;
}
function amount(value: unknown, label: string): number {
  // SQL stores integer euros/km. Never silently turn blank/NaN/decimals into zero.
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > 1_000_000) {
    throw new VehicleValidationError(`${label} doit être un entier positif ou nul.`);
  }
  return value;
}

export function validateVehicleValues(values: OpsVehicleSaveValues): OpsVehicleSaveValues {
  if (!values || typeof values !== "object" || typeof values.featured !== "boolean") {
    throw new VehicleValidationError("Véhicule invalide.");
  }
  return {
    ...values,
    name: text(values.name, "Nom", 120),
    brand: text(values.brand, "Marque", 120),
    locationLabel: text(values.locationLabel, "Lieu de retrait", 200),
    editorialNote: text(values.editorialNote, "Note", 500, false),
    category: choice(values.category, CATEGORIES, "Catégorie"),
    transmission: choice(values.transmission, TRANSMISSIONS, "Transmission"),
    licenseCategory: choice(values.licenseCategory, PERMITS, "Permis"),
    opsStatus: choice(values.opsStatus, STATUSES, "Statut"),
    priceFrom: amount(values.priceFrom, "Prix"),
    depositAmount: amount(values.depositAmount, "Dépôt"),
    includedMileageKmPerDay: amount(values.includedMileageKmPerDay, "Kilométrage"),
  };
}

/** Parse untrusted FormData without TS casts that bypass runtime validation. */
export function parseVehicleForm(formData: FormData): OpsVehicleSaveValues {
  function numberField(key: string) {
    const value = formData.get(key);
    if (typeof value !== "string" || !/^\d{1,7}$/.test(value.trim())) {
      throw new VehicleValidationError(`Champ ${key} invalide.`);
    }
    return amount(Number(value), key);
  }
  return validateVehicleValues({
    name: text(formData.get("name"), "Nom", 120),
    brand: text(formData.get("brand"), "Marque", 120),
    locationLabel: text(formData.get("locationLabel"), "Lieu de retrait", 200),
    editorialNote: text(formData.get("editorialNote") ?? "", "Note", 500, false),
    category: choice(formData.get("category"), CATEGORIES, "Catégorie"),
    transmission: choice(formData.get("transmission"), TRANSMISSIONS, "Transmission"),
    licenseCategory: choice(formData.get("licenseCategory"), PERMITS, "Permis"),
    opsStatus: choice(formData.get("opsStatus"), STATUSES, "Statut"),
    featured: formData.get("featured") === "on",
    priceFrom: numberField("priceFrom"), depositAmount: numberField("depositAmount"),
    includedMileageKmPerDay: numberField("includedMileageKmPerDay"),
    primaryImage: "", primaryImagePublicId: null,
  });
}
