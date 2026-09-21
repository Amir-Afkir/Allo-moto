import "server-only";
import sharp from "sharp";
import { MAX_VEHICLE_IMAGE_BYTES, MAX_VEHICLE_IMAGE_PIXELS, vehicleImageError } from "./image-policy";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const FLEET_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "fleet");


type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
};

export type UploadedVehicleImage = {
  src: string;
  publicId: string | null;
};

export async function uploadVehicleImage(input: {
  file: File;
  slugHint?: string;
}): Promise<UploadedVehicleImage> {
  const error = vehicleImageError(input.file);
  if (error) throw new Error(error);
  if (process.env.NODE_ENV === "production" && !hasCloudinaryConfig()) {
    throw new Error("Object storage is not configured.");
  }
  const normalized = { ...input, file: await normalizeVehicleImage(input.file) };

  if (hasCloudinaryConfig()) {
    return uploadVehicleImageToCloudinary(normalized);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Object storage is not configured.");
  }

  return uploadVehicleImageLocally(normalized);
}

export async function deleteVehicleImageAsset(input: {
  src?: string;
  publicId?: string | null;
}) {
  if (!input.src && !input.publicId) {
    return;
  }

  if (hasCloudinaryConfig()) {
    await removeCloudinaryImage(input);
    return;
  }

  if (process.env.NODE_ENV === "production") {
    return;
  }

  await removeVehicleImageLocally(input);
}

/** Decode actual bytes, strip metadata, rotate EXIF orientation and persist only safe WebP. */
export async function normalizeVehicleImage(file: File): Promise<File> {
  const error = vehicleImageError(file);
  if (error) throw new Error(error);
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), {
      failOn: "warning", limitInputPixels: MAX_VEHICLE_IMAGE_PIXELS,
    });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height ||
        metadata.width * metadata.height > MAX_VEHICLE_IMAGE_PIXELS ||
        (metadata.pages ?? 1) > 1 ||
        !["jpeg", "png", "webp", "heif", "avif"].includes(metadata.format ?? "")) {
      throw new Error("Unsupported image.");
    }
    const bytes = await image.rotate()
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 }).toBuffer();
    if (bytes.length > MAX_VEHICLE_IMAGE_BYTES) throw new Error("Image too large.");
    return new File([new Uint8Array(bytes)], "vehicle.webp", { type: "image/webp" });
  } catch {
    throw new Error("Image illisible, animée ou trop grande. Utilisez une photo de 40 mégapixels maximum.");
  }
}

async function uploadVehicleImageToCloudinary(input: {
  file: File;
  slugHint?: string;
}): Promise<UploadedVehicleImage> {
  const config = getCloudinaryConfig();
  const safeSlug = normalizeUploadSegment(input.slugHint ?? "") || "vehicule";
  const publicId = `${config.folder}/${safeSlug}-${randomUUID()}`;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = signCloudinaryParams(
    {
      public_id: publicId,
      timestamp,
    },
    config.apiSecret,
  );

  const formData = new FormData();
  formData.append("file", input.file, input.file.name || `${safeSlug}.jpg`);
  formData.append("api_key", config.apiKey);
  formData.append("timestamp", timestamp);
  formData.append("public_id", publicId);
  formData.append("signature", signature);

  const response = await fetch(buildCloudinaryUploadUrl(config.cloudName), {
    method: "POST",
    body: formData,
    signal: AbortSignal.timeout(15_000),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        public_id?: string;
        secure_url?: string;
      }
    | null;

  if (!response.ok || !payload?.secure_url || payload.public_id !== publicId) {
    throw new Error("Cloudinary upload failed.");
  }

  const uploadedUrl = new URL(payload.secure_url);
  if (uploadedUrl.protocol !== "https:" || uploadedUrl.hostname !== "res.cloudinary.com" ||
      !uploadedUrl.pathname.startsWith(`/${config.cloudName}/image/upload/`)) {
    throw new Error("Unexpected image storage response.");
  }
  return {
    src: payload.secure_url,
    publicId: payload.public_id ?? publicId,
  };
}

async function removeCloudinaryImage(input: {
  src?: string;
  publicId?: string | null;
}) {
  const publicId = input.publicId || getCloudinaryPublicId(input.src);
  if (!publicId) {
    return;
  }

  const config = getCloudinaryConfig();
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = signCloudinaryParams(
    {
      public_id: publicId,
      timestamp,
    },
    config.apiSecret,
  );

  const formData = new FormData();
  formData.append("public_id", publicId);
  formData.append("api_key", config.apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);

  const response = await fetch(buildCloudinaryDestroyUrl(config.cloudName), {
    method: "POST",
    body: formData,
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error("Cloudinary destroy failed.");
  }
}

function buildCloudinaryUploadUrl(cloudName: string) {
  return `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
}

function buildCloudinaryDestroyUrl(cloudName: string) {
  return `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;
}

function signCloudinaryParams(
  params: Record<string, string>,
  apiSecret: string,
) {
  const serializedParams = Object.entries(params)
    .filter(([, value]) => value)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1")
    .update(`${serializedParams}${apiSecret}`)
    .digest("hex");
}

function hasCloudinaryConfig() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim(),
  );
}

function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || "";
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim() || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || "";
  const folder =
    process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || "allo-moto/fleet";

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary credentials are missing.");
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
    folder: folder.replace(/^\/+|\/+$/g, ""),
  };
}

function getCloudinaryPublicId(src: string | undefined) {
  if (!src) {
    return null;
  }

  const { cloudName } = getCloudinaryConfig();

  try {
    const url = new URL(src);
    if (url.hostname !== "res.cloudinary.com") {
      return null;
    }

    const uploadMarker = `/${cloudName}/image/upload/`;
    const markerIndex = url.pathname.indexOf(uploadMarker);
    if (markerIndex === -1) {
      return null;
    }

    const publicPath = decodeURIComponent(
      url.pathname
        .slice(markerIndex + uploadMarker.length)
        .replace(/^v\d+\//, "")
        .replace(/\.[^./]+$/, ""),
    );

    return publicPath || null;
  } catch {
    return null;
  }
}

async function uploadVehicleImageLocally(input: {
  file: File;
  slugHint?: string;
}): Promise<UploadedVehicleImage> {
  const extension = resolveImageExtension(input.file);
  const safeSlug = normalizeUploadSegment(input.slugHint ?? "") || "vehicule";
  const filename = `${safeSlug}-${randomUUID()}${extension}`;
  const buffer = Buffer.from(await input.file.arrayBuffer());

  await mkdir(FLEET_UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(FLEET_UPLOAD_DIR, filename), buffer);

  return {
    src: `/uploads/fleet/${filename}`,
    publicId: null,
  };
}

async function removeVehicleImageLocally(input: {
  src?: string;
  publicId?: string | null;
}) {
  const currentPath = resolveCurrentImagePath(input.src);
  if (!currentPath) {
    return;
  }

  try {
    await rm(currentPath, { force: true });
  } catch {
    // Ignore missing or already removed files.
  }
}

function resolveCurrentImagePath(src: string | undefined) {
  if (!src || !src.startsWith("/uploads/fleet/")) {
    return null;
  }

  const filename = src.replace("/uploads/fleet/", "");
  if (!filename || filename.includes("/") || filename.includes("\\")) {
    return null;
  }

  return path.join(FLEET_UPLOAD_DIR, filename);
}

export function resolveImageExtension(file: File) {
  const extensions: Record<string, string> = {
    "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif",
  };
  const extension = extensions[file.type];
  if (!extension) throw new Error("Unsupported image type.");
  return extension;
}

export function normalizeUploadSegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
