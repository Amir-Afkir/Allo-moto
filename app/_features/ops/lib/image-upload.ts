import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const FLEET_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "fleet");

export async function replaceVehicleImage(input: {
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
  await removeVehicleImage({
    slugHint: safeSlug,
    currentSrc: input.currentSrc,
  });
  await writeFile(path.join(FLEET_UPLOAD_DIR, filename), buffer);

  return `/uploads/fleet/${filename}`;
}

export async function removeVehicleImage(input: {
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

      if (file === safeSlug || file.startsWith(`${safeSlug}.`) || file.startsWith(`${safeSlug}-`)) {
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
