import { defineConfig, devices } from "@playwright/test";
import { randomBytes } from "node:crypto";

const databaseUrl = process.env.E2E_DATABASE_URL;
if (!databaseUrl) throw new Error("E2E_DATABASE_URL must point to a disposable local database ending in _e2e.");
const database = new URL(databaseUrl);
if (!["localhost", "127.0.0.1"].includes(database.hostname) || !database.pathname.endsWith("_e2e")) {
  throw new Error("Refusing browser tests against a non-local/non-disposable database.");
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    reducedMotion: "reduce",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "mobile-webkit", use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    // Use the stable dev bundler for interaction tests, not Turbopack's WebKit HMR transport.
    command: "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/ops/login",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: databaseUrl,
      ADMIN_USERNAME: "quality-browser-admin",
      ADMIN_PASSWORD: "Quality-browser-only-57!",
      ADMIN_SESSION_SECRET: randomBytes(32).toString("hex"),
      CLOUDINARY_CLOUD_NAME: "", CLOUDINARY_API_KEY: "", CLOUDINARY_API_SECRET: "",
      NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: "",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
