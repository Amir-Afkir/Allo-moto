import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  adminSessionSubject,
  createAccessToken,
  getAdminConfig,
  readAccessToken,
  secureEqual,
  SESSION_MAX_AGE_SECONDS,
} from "./session-security";

const COOKIE_NAME = "allo-moto.ops.session.v2";
const LEGACY_COOKIE_NAME = "allo-moto.ops.session";

export function isAdminConfigured() {
  return getAdminConfig() !== null;
}

export async function isAdminAuthenticated() {
  const config = getAdminConfig();
  if (!config) return false;
  const cookieStore = await cookies();
  const subject = readAccessToken(cookieStore.get(COOKIE_NAME)?.value, "admin", config.secret);
  return subject !== null && secureEqual(subject, adminSessionSubject(config));
}

export async function requireAdminSession() {
  if (!(await isAdminAuthenticated())) redirect("/ops/login");
}

export async function attemptAdminLogin(username: string, password: string) {
  const config = getAdminConfig();
  if (!config || username.length > 256 || password.length > 1024) return false;
  const usernameMatches = secureEqual(username, config.username);
  const passwordMatches = secureEqual(password, config.password);
  if (!usernameMatches || !passwordMatches) return false;

  const cookieStore = await cookies();
  cookieStore.delete(LEGACY_COOKIE_NAME);
  cookieStore.set(COOKIE_NAME, createAccessToken(adminSessionSubject(config), "admin", config.secret), {
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
  cookieStore.delete(LEGACY_COOKIE_NAME);
}
