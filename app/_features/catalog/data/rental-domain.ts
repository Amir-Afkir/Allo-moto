export type MotorcycleCategory =
  | "scooter"
  | "roadster"
  | "adventure"
  | "touring"
  | "sport"
  | "custom"
  | "electric";

export type MotorcycleStatus = "available" | "reserved" | "maintenance" | "inactive" | "draft";
export type Transmission = "automatic" | "manual";
export type MotorcycleLicenseCategory = "B" | "A1" | "A2" | "A";

export type Money = {
  amount: number;
  currency: string;
};

export interface Motorcycle {
  slug: string;
  name: string;
  brand: string;
  model: string;
  category: MotorcycleCategory;
  status: MotorcycleStatus;
  transmission: Transmission;
  licenseCategory: MotorcycleLicenseCategory;
  locationLabel: string;
  featured: boolean;
  priceFrom: Money;
  deposit: Money;
  includedMileageKmPerDay: number;
  description: string;
  primaryImage: string;
  gallery: readonly string[];
}
