"use server";

import { vehicleRevision, VehicleConflictError, type VehicleImageChange } from "../lib/vehicle-revision";

import { redirect } from "next/navigation";
import {
  addVehicleBlock,
  deleteVehicle,
  getAdminVehicleBySlug,
  removeVehicleBlock,
  saveVehicle,
  updateVehicleOpsStatus,
  updateReservationStatus,
} from "@/app/_features/ops/data/ops-store";
import {
  attemptAdminLogin,
  clearAdminSession,
  requireAdminSession,
} from "@/app/_features/ops/lib/auth";
import {
  deleteVehicleImageAsset,
  type UploadedVehicleImage,
  uploadVehicleImage,
} from "@/app/_features/ops/lib/image-upload";

import { parseVehicleForm } from "../lib/vehicle-validation";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

function readVehicleImageState(formData: FormData) {
  const value = readString(formData, "primaryImageState");
  return value === "replace" || value === "remove" ? value : "keep";
}

function buildVehicleErrorPath(
  currentSlug: string | null,
  error: "save" | "image" | "conflict",
) {
  if (currentSlug) {
    return `/ops/fleet/${currentSlug}?error=${error}`;
  }

  return `/ops/fleet/new?error=${error}`;
}

function appendErrorToReturnPath(pathname: string, error: string) {
  if (!pathname.startsWith("/ops/")) {
    return pathname;
  }

  const [base, hash = ""] = pathname.split("#");
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}error=${error}${hash ? `#${hash}` : ""}`;
}

export async function loginAdminAction(formData: FormData) {
  const username = readString(formData, "username");
  const rawPassword = formData.get("password");
  const password = typeof rawPassword === "string" ? rawPassword : "";
  const ok = await attemptAdminLogin(username, password);

  redirect(ok ? "/ops" : "/ops/login?error=invalid");
}

export async function logoutAdminAction() {
  await clearAdminSession();
  redirect("/ops/login");
}

export async function updateReservationStatusAction(formData: FormData) {
  await requireAdminSession();

  const reservationId = readString(formData, "reservationId");
  const nextStatus = readString(formData, "nextStatus");
  const adminNote = readString(formData, "adminNote");
  const successReturnTo =
    readString(formData, "successReturnTo") || readString(formData, "returnTo");
  const errorReturnTo =
    readString(formData, "errorReturnTo") || successReturnTo;

  if (
    nextStatus !== "confirmed" &&
    nextStatus !== "rejected" &&
    nextStatus !== "cancelled" &&
    nextStatus !== "completed"
  ) {
    if (errorReturnTo.startsWith("/ops/")) {
      redirect(appendErrorToReturnPath(errorReturnTo, "status"));
    }
    redirect(`/ops/reservations?open=${reservationId}&error=status`);
  }

  try {
    await updateReservationStatus({
      reservationId,
      nextStatus,
      adminNote,
    });
  } catch {
    if (errorReturnTo.startsWith("/ops/")) {
      redirect(appendErrorToReturnPath(errorReturnTo, "update"));
    }
    redirect(`/ops/reservations?open=${reservationId}&error=update`);
  }

  if (successReturnTo.startsWith("/ops/")) {
    redirect(successReturnTo);
  }

  if (nextStatus === "confirmed") {
    redirect(`/ops/reservations?open=${reservationId}`);
  }

  redirect("/ops/reservations");
}

export async function saveVehicleAction(formData: FormData) {
  await requireAdminSession();

  const currentSlug = readString(formData, "currentSlug") || null;
  const imageState = readVehicleImageState(formData);
  const imageFile = readFile(formData, "primaryImageFile");
  let redirectSlug = currentSlug;
  let uploadedImage: UploadedVehicleImage | null = null;
  let persisted = false;
  let errorType: "save" | "image" | "conflict" = "save";
  const existingVehicle = currentSlug
    ? (await getAdminVehicleBySlug(currentSlug))?.vehicle ?? null
    : null;

  try {
    const parsedValues = parseVehicleForm(formData);
    if (currentSlug && !existingVehicle) throw new Error("Vehicle no longer exists.");
    const expectedRevision = readString(formData, "expectedRevision");
    if (existingVehicle && expectedRevision !== vehicleRevision(existingVehicle)) throw new VehicleConflictError();
    let imageChange: VehicleImageChange = { kind: "keep" };

    if (imageState === "replace") {
      if (!imageFile) {
        errorType = "image";
        throw new Error("Missing image file.");
      }

      try {
        uploadedImage = await uploadVehicleImage({
          file: imageFile,
          slugHint:
            currentSlug ||
            `${readString(formData, "brand")} ${readString(formData, "name")}`,
        });
      } catch {
        errorType = "image";
        throw new Error("Vehicle image upload failed.");
      }

      imageChange = { kind: "replace", asset: uploadedImage };
    } else if (imageState === "remove") {
      imageChange = { kind: "remove" };
    }

    const values = parsedValues;
    const vehicle = await saveVehicle({
      currentSlug,
      expectedRevision,
      imageChange,
      values,
    });
    persisted = true;
    redirectSlug = vehicle.slug;
    if (vehicle.replacedImage) {
      await deleteVehicleImageAsset(vehicle.replacedImage).catch(() => {
        // An orphan is safer than rolling back a committed image reference.
        console.error("Vehicle image cleanup deferred.");
      });
    }
  } catch (error) {
    if (error instanceof VehicleConflictError) errorType = "conflict";
    if (uploadedImage && !persisted) {
      await deleteVehicleImageAsset(uploadedImage).catch(() => {
        console.error("Uncommitted vehicle image cleanup deferred.");
      });
    }

    redirect(buildVehicleErrorPath(currentSlug, errorType));
  }

  redirect(`/ops/fleet/${redirectSlug}`);
}

export async function addVehicleBlockAction(formData: FormData) {
  await requireAdminSession();

  const vehicleSlug = readString(formData, "vehicleSlug");
  const returnTo = readString(formData, "returnTo");

  try {
    const type = readString(formData, "type");
    if (type !== "maintenance" && type !== "manual_block") throw new Error("Invalid block type.");
    await addVehicleBlock({
      vehicleSlug,
      type,
      startDate: readString(formData, "startDate"),
      endDate: readString(formData, "endDate"),
      note: readString(formData, "note"),
    });
  } catch {
    redirect(
      returnTo.startsWith("/ops/")
        ? appendErrorToReturnPath(returnTo, "block")
        : `/ops/fleet/${vehicleSlug}?error=block#disponibilites`,
    );
  }

  if (returnTo.startsWith("/ops/")) {
    redirect(returnTo);
  }

  redirect(`/ops/fleet/${vehicleSlug}#disponibilites`);
}

export async function updateVehicleOpsStatusAction(formData: FormData) {
  await requireAdminSession();

  const vehicleSlug = readString(formData, "vehicleSlug");
  const nextStatus = readString(formData, "nextStatus");
  const returnTo = readString(formData, "returnTo");

  if (
    nextStatus !== "active" &&
    nextStatus !== "hidden" &&
    nextStatus !== "maintenance"
  ) {
    redirect("/ops/fleet");
  }

  await updateVehicleOpsStatus({
    vehicleSlug,
    nextStatus,
  });

  if (returnTo.startsWith("/ops/")) {
    redirect(returnTo);
  }

  redirect("/ops/fleet");
}

export async function deleteVehicleAction(formData: FormData) {
  await requireAdminSession();

  const vehicleSlug = readString(formData, "vehicleSlug");

  try {
    const vehicle = await deleteVehicle({ vehicleSlug });
    await deleteVehicleImageAsset({
      src: vehicle.primaryImage,
      publicId: vehicle.primaryImagePublicId,
    }).catch(() => {
      // Keep the deletion successful even if remote cleanup fails.
    });
  } catch {
    redirect(`/ops/fleet/${vehicleSlug}?error=delete`);
  }

  redirect("/ops/fleet");
}

export async function deleteVehicleBlockAction(formData: FormData) {
  await requireAdminSession();

  const vehicleSlug = readString(formData, "vehicleSlug");
  const returnTo = readString(formData, "returnTo");
  await removeVehicleBlock({
    blockId: readString(formData, "blockId"),
  });
  if (returnTo.startsWith("/ops/")) {
    redirect(returnTo);
  }
  redirect(`/ops/fleet/${vehicleSlug}#disponibilites`);
}
