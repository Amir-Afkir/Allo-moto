import { createHash, randomUUID } from "node:crypto";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const FLEET_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "fleet");
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
};

export async function replaceVehicleImage(input: {
  file: File;
  slugHint?: string;
  currentSrc?: string;
}) {
  assertUploadConstraints(input.file);

  if (hasCloudinaryConfig()) {
    return replaceVehicleImageInCloudinary(input);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Object storage is not configured.");
  }

  return replaceVehicleImageLocally(input);
}

export async function removeVehicleImage(input: {
  slugHint?: string;
  currentSrc?: string;
}) {
  if (hasCloudinaryConfig()) {
    await removeCloudinaryImage(input.currentSrc);
    return;
  }

  if (process.env.NODE_ENV === "production") {
    return;
  }

  await removeVehicleImageLocally(input);
}

function assertUploadConstraints(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Image upload exceeds the 10 MB limit.");
  }
}

async function replaceVehicleImageInCloudinary(input: {
  file: File;
  slugHint?: string;
  currentSrc?: string;
}) {
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

  const response = await fetch(
    buildCloudinaryUploadUrl(config.cloudName),
    {
      method: "POST",
      body: formData,
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | {
        secure_url?: string;
      }
    | null;

  if (!response.ok || !payload?.secure_url) {
    throw new Error("Cloudinary upload failed.");
  }

  await removeCloudinaryImage(input.currentSrc).catch(() => {
    // Keep the new upload even if the previous image cannot be deleted.
  });

  return payload.secure_url;
}

async function removeCloudinaryImage(currentSrc: string | undefined) {
  const publicId = getCloudinaryPublicId(currentSrc);
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

  const response = await fetch(
    buildCloudinaryDestroyUrl(config.cloudName),
    {
      method: "POST",
      body: formData,
    },
  );

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

async function replaceVehicleImageLocally(input: {
  file: File;
  slugHint?: string;
  currentSrc?: string;
}) {
  const extension = resolveImageExtension(input.file);
  const vehicleSlug = normalizeUploadSegment(input.slugHint ?? "");
  const safeSlug = vehicleSlug || "vehicule";
  const filename = `${safeSlug}${extension}`;
  const buffer = Buffer.from(await input.file.arrayBuffer());

  await mkdir(FLEET_UPLOAD_DIR, { recursive: true });
  await removeVehicleImageLocally({
    slugHint: safeSlug,
    currentSrc: input.currentSrc,
  });
  await writeFile(path.join(FLEET_UPLOAD_DIR, filename), buffer);

  return `/uploads/fleet/${filename}`;
}

async function removeVehicleImageLocally(input: {
  slugHint?: string;
  currentSrc?: string;
}) {
  await mkdir(FLEET_UPLOAD_DIR, { recursive: true });

  const candidates = new Set<string>();
  const safeSlug = normalizeUploadSegment(input.slugHint ?? "");
  if (safeSlug) {
    const files = await readdir(FLEET_UPLOAD_DIR);
    for (const file of files) {
      if (file === ".DS_Store") {
        continue;
      }

      if (
        file === safeSlug ||
        file.startsWith(`${safeSlug}.`) ||
        file.startsWith(`${safeSlug}-`)
      ) {
        candidates.add(path.join(FLEET_UPLOAD_DIR, file));
      }
    }
  }

  const currentPath = resolveCurrentImagePath(input.currentSrc);
  if (currentPath) {
    candidates.add(currentPath);
  }

  await Promise.all(
    Array.from(candidates).map(async (filePath) => {
      try {
        await rm(filePath, { force: true });
      } catch {
        // Ignore missing or already removed files.
      }
    }),
  );
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
  const explicit = path.extname(file.name).toLowerCase();
  if (explicit) {
    return explicit;
  }

  switch (file.type) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/avif":
      return ".avif";
    case "image/gif":
      return ".gif";
    default:
      return ".jpg";
  }
}

export function normalizeUploadSegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
