/** Shared application limits, including multipart headroom in next.config.ts. */
export const MAX_VEHICLE_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_VEHICLE_IMAGE_PIXELS = 40_000_000;
export const VEHICLE_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const IMAGE_TYPES = new Set(VEHICLE_IMAGE_ACCEPT.split(","));

export function vehicleImageError(file: Pick<File, "size" | "type">): string | null {
  if (!IMAGE_TYPES.has(file.type)) return "Utilisez une image JPEG, PNG, WebP ou AVIF.";
  if (file.size <= 0) return "Le fichier est vide.";
  if (file.size > MAX_VEHICLE_IMAGE_BYTES) return "L’image dépasse la limite de 4 Mo.";
  return null;
}
