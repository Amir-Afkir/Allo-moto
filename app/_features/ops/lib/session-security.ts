import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
const TOKEN_VERSION = 2;

type Environment = Record<string, string | undefined>;
export type AdminConfig = { username: string; password: string; secret: string };

export function getSessionSecret(env: Environment = process.env): string | null {
  const secret = env.ADMIN_SESSION_SECRET?.trim();
  if (
    !secret || secret.length < 32 ||
    /change[-_ ]?me|replace[-_ ]?me|example|your[-_ ]?secret/i.test(secret)
  ) {
    return null;
  }
  return secret;
}

export function getAdminConfig(env: Environment = process.env): AdminConfig | null {
  const username = env.ADMIN_USERNAME?.trim();
  const password = env.ADMIN_PASSWORD;
  const secret = getSessionSecret(env);
  if (!username || !password || password.trim().length < 12 || !secret ||
    createHash("sha256").update(password).digest("hex") === "05916b4b40f02ac98d9958df77995608e5dd4d8dd3e4cc99d8c381204fdfd732"
  ) {
    return null;
  }
  return { username, password, secret };
}

export function secureEqual(left: string, right: string): boolean {
  return timingSafeEqual(
    createHash("sha256").update(left).digest(),
    createHash("sha256").update(right).digest(),
  );
}

function signature(payload: string, purpose: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`allo-moto:${TOKEN_VERSION}:${purpose}:${payload}`)
    .digest("base64url");
}

export function createAccessToken(
  subject: string,
  purpose: "admin" | "reservation",
  secret: string,
  now = Date.now(),
): string {
  const payload = Buffer.from(JSON.stringify({
    version: TOKEN_VERSION,
    subject,
    issuedAt: now,
    expiresAt: now + SESSION_MAX_AGE_SECONDS * 1000,
  })).toString("base64url");
  return `${payload}.${signature(payload, purpose, secret)}`;
}

export function readAccessToken(
  value: string | undefined,
  purpose: "admin" | "reservation",
  secret: string,
  now = Date.now(),
): string | null {
  if (!value || value.length > 2048) return null;
  const parts = value.split(".");
  if (parts.length !== 2 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) return null;
  const [payload, supplied] = parts;
  if (!secureEqual(supplied, signature(payload, purpose, secret))) return null;
  try {
    const data: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data || typeof data !== "object") return null;
    const token = data as Record<string, unknown>;
    if (
      token.version !== TOKEN_VERSION ||
      typeof token.subject !== "string" || !token.subject || token.subject.length > 256 ||
      typeof token.issuedAt !== "number" || !Number.isFinite(token.issuedAt) ||
      typeof token.expiresAt !== "number" || !Number.isFinite(token.expiresAt) ||
      token.issuedAt > now || token.expiresAt <= now ||
      token.expiresAt - token.issuedAt !== SESSION_MAX_AGE_SECONDS * 1000
    ) return null;
    return token.subject;
  } catch {
    return null;
  }
}

/** Password rotation also revokes existing admin cookies. No password is serialized. */
export function adminSessionSubject(config: AdminConfig): string {
  return createHmac("sha256", config.secret)
    .update(`admin-identity:${JSON.stringify([config.username, config.password])}`)
    .digest("base64url");
}
