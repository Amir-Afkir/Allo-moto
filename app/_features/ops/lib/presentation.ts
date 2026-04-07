import type { CatalogMotorcycle } from "@/app/_features/catalog/data/motorcycles";
import type { BadgeVariant } from "@/app/_shared/ui/badge-shared";
import type {
  OpsVehicleBlockRecord,
  OpsVehicleStatus,
} from "@/app/_features/ops/data/ops-store";

export function getPublicStatusTone(
  status: CatalogMotorcycle["status"],
): BadgeVariant {
  switch (status) {
    case "available":
      return "success";
    case "maintenance":
      return "danger";
    default:
      return "neutral";
  }
}

export function getPublicStatusLabel(status: CatalogMotorcycle["status"]) {
  switch (status) {
    case "available":
      return "Disponible";
    case "maintenance":
      return "Maintenance";
    case "reserved":
      return "Reserve";
    default:
      return "Masque";
  }
}

export function getOpsStatusTone(status: OpsVehicleStatus): BadgeVariant {
  switch (status) {
    case "active":
      return "success";
    case "maintenance":
      return "danger";
    default:
      return "outline";
  }
}

export function getOpsStatusLabel(status: OpsVehicleStatus) {
  switch (status) {
    case "active":
      return "Actif";
    case "maintenance":
      return "Maintenance";
    default:
      return "Masque";
  }
}

export function getBlockTone(
  type: OpsVehicleBlockRecord["type"],
): BadgeVariant {
  switch (type) {
    case "maintenance":
      return "danger";
    case "reservation":
      return "neutral";
    default:
      return "warning";
  }
}

export function getBlockLabel(type: OpsVehicleBlockRecord["type"]) {
  switch (type) {
    case "maintenance":
      return "Maintenance";
    case "reservation":
      return "Reservation";
    default:
      return "Blocage manuel";
  }
}
