import { defineConfig, devices } from "@playwright/test";

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
    baseURL: "https://localhost:3100",
    ignoreHTTPSErrors: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    reducedMotion: "reduce",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "mobile-webkit", use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    command: "node tests/e2e-server.cjs",
    url: "https://localhost:3100/ops/login",
    ignoreHTTPSErrors: true,
    reuseExistingServer: false,
    timeout: 240_000,
    env: { E2E_DATABASE_URL: databaseUrl, NEXT_TELEMETRY_DISABLED: "1" },
  },
});
