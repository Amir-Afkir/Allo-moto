import "server-only";
import { createHash } from "node:crypto";
import type { OpsVehicleRecord } from "../data/ops-store-types";
import type { UploadedVehicleImage } from "./image-upload";

export class VehicleConflictError extends Error {
  constructor() { super("Ce véhicule a été modifié dans un autre onglet. Rechargez sa fiche avant de réappliquer vos changements."); }
}
export type VehicleImageChange = { kind: "keep" } | { kind: "remove" } | { kind: "replace"; asset: UploadedVehicleImage };
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}
/** Covers the actual persisted fields, independent of JSON/SQL property order. */
export function vehicleRevision(vehicle: OpsVehicleRecord): string {
  return createHash("sha256").update(JSON.stringify(canonical(vehicle))).digest("hex");
}
