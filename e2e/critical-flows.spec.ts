import { test, expect, type Page } from "@playwright/test";
import { randomBytes, randomUUID } from "node:crypto";
import sharp from "sharp";
import postgres from "postgres";

// The configuration refuses external hosts and requires a dedicated *_e2e database.
function database() { return postgres(process.env.E2E_DATABASE_URL!, { max: 1 }); }
async function login(page: Page) {
  await page.goto("/ops/login");
  await page.getByLabel("Identifiant", { exact: true }).fill("quality-browser-admin");
  await page.getByLabel("Mot de passe", { exact: true }).fill("Quality-browser-only-57!");
  await page.getByRole("button", { name: "Se connecter a l'espace admin" }).click();
  await expect(page).toHaveURL(/\/ops\/fleet$/);
}

test("public pages and invalid schedule render without crashes or horizontal overflow", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const url of ["/", "/motos", "/motos/bmw-g310r", "/reserver?motorcycle=bmw-g310r&pickupDate=bad&returnDate=2090-02-30"]) {
    const response = await page.goto(url);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
  await page.getByRole("button", { name: "Vérifier la disponibilité", exact: true }).click();
  await expect(page.locator("#client-form")).toHaveCount(0);
  expect((await page.goto("/motos/nonexistent-quality-bike"))?.status()).toBe(404);
  expect(errors).toEqual([]);
});

test("admin upload preserves selected file, rejects oversize, and saves a real >1 MiB image", async ({ page }) => {
  await login(page);
  await page.goto("/ops/fleet/new");
  const name = `Upload ${randomUUID().slice(0, 8)}`;
  await page.getByLabel("Marque", { exact: true }).fill("Quality");
  await page.getByLabel("Nom commercial").fill(name);
  await page.getByLabel("Retrait / localisation").fill("Orléans");
  await page.getByLabel("Prix / jour").fill("55");
  await page.getByLabel("Depot", { exact: true }).fill("500");
  await page.getByLabel("Km inclus / jour").fill("100");
  const file = page.locator('input[type="file"]');
  await file.setInputFiles({ name: "oversize.png", mimeType: "image/png", buffer: Buffer.alloc(4 * 1024 * 1024 + 1) });
  await expect(page.getByRole("alert")).toContainText("4 Mo");
  await expect(page.locator('input[name="primaryImageState"]')).toHaveValue("keep");
  const buffer = await sharp(randomBytes(800 * 600 * 3), { raw: { width: 800, height: 600, channels: 3 } }).png().toBuffer();
  expect(buffer.length).toBeGreaterThan(1024 * 1024);
  await file.setInputFiles({ name: "photo.png", mimeType: "image/png", buffer });
  await expect(page.locator('input[name="primaryImageState"]')).toHaveValue("replace");
  expect(await file.evaluate((element: HTMLInputElement) => element.files?.length)).toBe(1);
  await page.getByRole("button", { name: "Enregistrer le vehicule" }).click();
  await expect(page).toHaveURL(/\/ops\/fleet\/quality-upload-[a-z0-9]+$/);
  const sql = database();
  try {
    const [vehicle] = await sql`select slug, primary_image from ops_vehicles where name = ${name}`;
    expect(vehicle.primary_image).toMatch(/^\/uploads\/fleet\/.+\.webp$/);
    const image = await page.request.get(vehicle.primary_image);
    expect(image.status()).toBe(200);
    const metadata = await sharp(await image.body()).metadata();
    expect(metadata.format).toBe("webp");
    expect((await page.goto(`/motos/${vehicle.slug}`))?.status()).toBe(200);
    await expect(page.locator("h1")).toContainText(name);
  } finally { await sql.end(); }
});

test("reservation UI persists once, private follow-up reflects admin confirmation and cancellation", async ({ page, browser }, testInfo) => {
  const year = testInfo.project.name === "mobile-webkit" ? "2092" : "2091";
  const query = `motorcycle=bmw-g310r&pickupDate=${year}-06-10&returnDate=${year}-06-12`;
  await page.goto(`/reserver?${query}`);
  await page.getByRole("button", { name: "Vérifier la disponibilité", exact: true }).click();
  await expect(page.locator("#client-form")).toBeVisible();
  await page.locator("#client-first-name").fill("PrivateQuality");
  await page.locator("#client-last-name").fill("Customer");
  await page.locator("#client-email").fill("quality@example.invalid");
  await page.locator("#client-phone").fill("0600000000");
  await page.locator("#client-permit-type").selectOption("A");
  await page.locator("#client-consent").check();
  await page.locator("#client-form").getByRole("button", { name: "Continuer", exact: true }).click();
  const post = page.waitForResponse((res) => res.url().endsWith("/api/reservations") && res.request().method() === "POST");
  await page.getByRole("button", { name: "Envoyer la demande de réservation" }).click();
  const response = await post;
  expect(response.status()).toBe(200);
  const payload = await response.json();
  await expect(page.locator("#confirmation")).toContainText("Votre demande a bien été envoyée.");
  await page.reload();
  await expect(page.locator("#confirmation")).toContainText("Votre demande a bien été envoyée.");

  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  // New contexts do not inherit baseURL; use the same local app explicitly.
  await admin.goto("http://127.0.0.1:3100/ops/login");
  await admin.getByLabel("Identifiant", { exact: true }).fill("quality-browser-admin");
  await admin.getByLabel("Mot de passe", { exact: true }).fill("Quality-browser-only-57!");
  await admin.getByRole("button", { name: "Se connecter a l'espace admin" }).click();
  await expect(admin).toHaveURL(/\/ops\/fleet$/);
  const sql = database();
  try {
    const records = await sql`select id from ops_reservations where reference = ${payload.reservation.reference}`;
    expect(records).toHaveLength(1);
    await admin.goto(`http://127.0.0.1:3100/ops/reservations?open=${records[0].id}`);
    await admin.getByRole("dialog").getByRole("button", { name: "Confirmer", exact: true }).click();
    await expect(admin.getByRole("dialog").getByRole("button", { name: "Annuler", exact: true })).toBeVisible();
    await page.reload();
    await expect(page.locator("#confirmation")).toContainText("Votre réservation est confirmée.");
    const publicResponse = await adminContext.request.get("http://127.0.0.1:3100/motos");
    expect(await publicResponse.text()).not.toContain("PrivateQuality");
    expect(await publicResponse.text()).not.toContain(payload.reservation.reference);
    await admin.getByRole("dialog").getByRole("button", { name: "Annuler", exact: true }).click();
    await expect.poll(async () => (await sql`select status from ops_reservations where id = ${records[0].id}`)[0].status).toBe("cancelled");
    await page.reload();
    await expect(page.locator("#confirmation")).toContainText("Annulée");
    expect((await page.request.get("/api/reservations")).headers()["cache-control"]).toContain("no-store");
  } finally { await sql.end(); await adminContext.close(); }
});

test("anonymous clients cannot read admin pages or enumerate private reservation receipts", async ({ page, request }) => {
  await page.goto("/ops/reservations");
  await expect(page).toHaveURL(/\/ops\/login$/);
  const response = await request.get("/api/reservations?id=someone-else");
  expect(response.status()).toBe(404);
  expect((await response.json()).reservation).toBeUndefined();
});
