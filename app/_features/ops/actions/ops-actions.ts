"use server";

import { redirect } from "next/navigation";
import {
  addVehicleBlock,
  deleteVehicle,
  type OpsVehicleSaveValues,
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

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(formData: FormData, key: string) {
  const value = Number(readString(formData, key));
  return Number.isFinite(value) ? value : 0;
}

function readCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
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
  const password = readString(formData, "password");
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
    nextStatus !== "cancelled"
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
  let redirectSlug = currentSlug;

  try {
    const values: OpsVehicleSaveValues = {
      name: readString(formData, "name"),
      brand: readString(formData, "brand"),
      category: readString(formData, "category") as never,
      transmission: readString(formData, "transmission") as never,
      licenseCategory: readString(formData, "licenseCategory") as never,
      locationLabel: readString(formData, "locationLabel"),
      featured: readCheckbox(formData, "featured"),
      priceFrom: readNumber(formData, "priceFrom"),
      depositAmount: readNumber(formData, "depositAmount"),
      includedMileageKmPerDay: readNumber(
        formData,
        "includedMileageKmPerDay",
      ),
      primaryImage: readString(formData, "primaryImage"),
      editorialNote: readString(formData, "editorialNote"),
      opsStatus: readString(formData, "opsStatus") as never,
    };
    const vehicle = await saveVehicle({
      currentSlug,
      values,
    });
    redirectSlug = vehicle.slug;
  } catch {
    redirect(currentSlug ? `/ops/fleet/${currentSlug}?error=save` : "/ops/fleet/new?error=save");
  }

  redirect(`/ops/fleet/${redirectSlug}`);
}

export async function addVehicleBlockAction(formData: FormData) {
  await requireAdminSession();

  const vehicleSlug = readString(formData, "vehicleSlug");
  const returnTo = readString(formData, "returnTo");

  try {
    await addVehicleBlock({
      vehicleSlug,
      type: readString(formData, "type") as never,
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
    await deleteVehicle({ vehicleSlug });
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
