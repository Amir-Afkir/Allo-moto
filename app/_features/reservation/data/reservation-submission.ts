/** A retry retains the same random key, including after an uncertain network failure/reload.
 * Only a digest is stored, never the customer's form, documents or notes.
 */
const STORAGE_KEY = "allo-moto.reservation.submission.v1";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
type Attempt = { fingerprint: string; key: string; expiresAt: number };
let memory: Attempt | null = null;

export async function reservationSubmissionKey(payload: unknown, now = Date.now()): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(payload)));
  const fingerprint = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  if (memory?.fingerprint === fingerprint && memory.expiresAt > now) return memory.key;
  try {
    const value = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "null") as Attempt | null;
    if (value?.fingerprint === fingerprint && typeof value.key === "string" &&
      /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value.key) &&
      Number.isFinite(value.expiresAt) && value.expiresAt > now && value.expiresAt <= now + MAX_AGE_MS) {
      memory = value;
      return value.key;
    }
  } catch { /* Denied/corrupt sessionStorage cannot prevent a request or an in-tab retry. */ }
  memory = { fingerprint, key: globalThis.crypto.randomUUID(), expiresAt: now + MAX_AGE_MS };
  try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(memory)); } catch { /* Use memory. */ }
  return memory.key;
}
