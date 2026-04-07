import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "allo-moto.ops.session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function getAdminConfig() {
  return {
    username: process.env.ADMIN_USERNAME ?? "adama",
    password: process.env.ADMIN_PASSWORD ?? "Garage-Citron-Dakar-45!",
    secret:
      process.env.ADMIN_SESSION_SECRET ??
      "allo-moto-admin-session-secret-change-me",
  };
}

function sign(value: string) {
  return createHmac("sha256", getAdminConfig().secret)
    .update(value)
    .digest("base64url");
}

function serializeSession(username: string) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = Buffer.from(
    JSON.stringify({ username, expiresAt }),
    "utf8",
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

function parseSession(value: string | undefined) {
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expected = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as {
      username?: string;
      expiresAt?: number;
    };

    if (
      typeof parsed.username !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= Date.now()
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const session = parseSession(cookieStore.get(COOKIE_NAME)?.value);
  return Boolean(session && session.username === getAdminConfig().username);
}

export async function requireAdminSession() {
  if (!(await isAdminAuthenticated())) {
    redirect("/ops/login");
  }
}

export async function attemptAdminLogin(username: string, password: string) {
  const config = getAdminConfig();
  if (username !== config.username || password !== config.password) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, serializeSession(config.username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });

  return true;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
