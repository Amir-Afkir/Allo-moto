import { test, expect, type Page } from "@playwright/test";
import postgres from "postgres";
import { randomUUID } from "node:crypto";

const origin = "https://localhost:3100";
async function login(page: Page) {
  await page.goto(`${origin}/ops/login`);
  await page.getByLabel("Identifiant", { exact: true }).fill("quality-browser-admin");
  await page.getByLabel("Mot de passe", { exact: true }).fill("Quality-browser-only-57!");
  await page.getByRole("button", { name: "Se connecter a l'espace admin" }).click();
  await expect(page).toHaveURL(/\/ops\/fleet$/);
}
async function dossier(page: Page, year: string) {
  await page.goto(`/reserver?motorcycle=bmw-g310r&pickupDate=${year}-08-10&returnDate=${year}-08-12`);
  await page.getByRole("button", { name: "Vérifier la disponibilité", exact: true }).click();
  await page.locator("#client-first-name").fill("Reliability");
  await page.locator("#client-last-name").fill("Customer");
  await page.locator("#client-email").fill("reliability@example.invalid");
  await page.locator("#client-phone").fill("+33612345678");
  await page.locator("#client-permit-type").selectOption("A");
  await page.locator("#client-consent").check();
  await page.locator("#client-form").getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(page.locator("#send-form")).toBeVisible();
}

test("step links and browser back preserve the in-memory dossier and synchronize the URL", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await dossier(page, "2096");
  await expect(page).toHaveURL(/stage=payment/);
  await page.locator("#send-form").getByRole("link", { name: "Retourner au dossier client", exact: true }).click();
  await expect(page.locator("#client-form")).toBeVisible();
  await expect(page.locator("#client-first-name")).toHaveValue("Reliability");
  await expect(page.locator("#client-consent")).toBeChecked();
  await page.goBack(); await expect(page.locator("#send-form")).toBeVisible();
  await page.goBack(); await expect(page.locator("#client-form")).toBeVisible();
  await expect(page.locator("#client-email")).toHaveValue("reliability@example.invalid");
  expect(errors).toEqual([]);
});

test("price conflict requires explicit acceptance; two receipts survive a fresh tab with blocked storage", async ({ page }, info) => {
  const sql = postgres(process.env.E2E_DATABASE_URL!, { max: 1 });
  const [before] = await sql`select price_amount, deposit_amount from ops_vehicles where slug = 'bmw-g310r'`;
  const year = info.project.name === "mobile-webkit" ? "2089" : "2088";
  try {
    await dossier(page, year);
    await sql`update ops_vehicles set price_amount = ${before.price_amount + 17}, deposit_amount = ${before.deposit_amount + 100} where slug = 'bmw-g310r'`;
    const conflict = page.waitForResponse((res) => res.url().endsWith("/api/reservations") && res.request().method() === "POST");
    await page.getByRole("button", { name: "Envoyer la demande de réservation" }).click();
    expect((await conflict).status()).toBe(409);
    await expect(page.getByRole("button", { name: "Envoyer la demande de réservation" })).toBeDisabled();
    const [{ count }] = await sql`select count(*)::int as count from ops_reservations where pickup_date = ${year + '-08-10'}`;
    expect(count).toBe(0);
    await page.getByRole("button", { name: "Accepter le nouveau tarif" }).click();
    const success = page.waitForResponse((res) => res.url().endsWith("/api/reservations") && res.request().method() === "POST");
    await page.getByRole("button", { name: "Envoyer la demande de réservation" }).click();
    const firstResponse = await success; expect(firstResponse.status()).toBe(200);
    const first = (await firstResponse.json()).reservation;
    expect(first.pricing.estimatedTotal).toBe((before.price_amount + 17) * 3);
    await expect(page.locator("#confirmation")).toContainText(first.reference);
    const firstUrl = page.url();
    // Catalog prices may change again; the stored receipt must not.
    await sql`update ops_vehicles set price_amount = ${before.price_amount + 30} where slug = 'bmw-g310r'`;
    const secondResponse = await page.request.post("/api/reservations", {
      headers: { "Idempotency-Key": randomUUID() }, data: {
        expectedPricing: { dailyPrice: before.price_amount + 30, depositAmount: before.deposit_amount + 100, currency: "EUR" },
        draft: { motorcycleSlug: "bmw-g310r", pickupDate: `${year}-09-10`, returnDate: `${year}-09-12`, pickupMode: "motorcycle-location", permit: "A" },
        clientDraft: { firstName: "Second", lastName: "Request", email: "second@example.invalid", phone: "+33612345678", preferredContact: "email", permitType: "A", consentDataUse: true },
      },
    });
    expect(secondResponse.status()).toBe(200);
    const second = (await secondResponse.json()).reservation;
    expect(second.id).not.toBe(first.id);
    const firstReceipt = await page.request.get(`/api/reservations?id=${first.id}`);
    expect((await firstReceipt.json()).reservation.pricing.estimatedTotal).toBe(first.pricing.estimatedTotal);
    expect((await page.request.get("/api/reservations?id=someone-else")).status()).toBe(404);
    const fresh = await page.context().newPage();
    const errors: string[] = []; fresh.on("pageerror", (error) => errors.push(error.message));
    await fresh.addInitScript(() => {
      for (const name of ["sessionStorage", "localStorage"]) Object.defineProperty(window, name, { get() { throw new Error("Storage blocked for regression test"); } });
    });
    await fresh.goto(firstUrl);
    await expect(fresh.locator("#confirmation")).toContainText(first.reference);
    await expect(fresh.locator("#confirmation")).toContainText("Votre demande a bien été envoyée.");
    await expect(fresh.getByLabel("Montants enregistrés")).toContainText(String(first.pricing.estimatedTotal));
    await fresh.goto("/reserver?stage=confirmed");
    await expect(fresh.getByRole("navigation", { name: "Vos demandes dans ce navigateur" }).getByRole("link")).toHaveCount(2);
    await fresh.getByRole("link", { name: first.reference, exact: true }).click();
    await expect(fresh.locator("#confirmation")).toContainText(first.reference);
    expect(errors).toEqual([]); await fresh.close();
  } finally {
    await sql`update ops_vehicles set price_amount = ${before.price_amount}, deposit_amount = ${before.deposit_amount} where slug = 'bmw-g310r'`;
    await sql.end();
  }
});

test("two admin tabs cannot overwrite a newer fleet form", async ({ page }) => {
  await login(page);
  // Create an isolated vehicle via the real production server action.
  await page.goto("/ops/fleet/new");
  const name = `Concurrent ${randomUUID().slice(0, 8)}`;
  await page.getByLabel("Marque", { exact: true }).fill("Quality");
  await page.getByLabel("Nom commercial").fill(name);
  await page.getByLabel("Retrait / localisation").fill("Orléans");
  await page.getByLabel("Prix / jour").fill("55");
  await page.getByLabel("Depot", { exact: true }).fill("500");
  await page.getByLabel("Km inclus / jour").fill("100");
  await page.getByRole("button", { name: "Enregistrer le vehicule" }).click();
  await expect(page).toHaveURL(/\/ops\/fleet\/quality-concurrent-[a-z0-9]+$/);
  const url = page.url();
  const stale = await page.context().newPage(); await stale.goto(url);
  await stale.getByLabel("Retrait / localisation").fill("Obsolete location");
  await page.getByLabel("Marque", { exact: true }).fill("Concurrent winner");
  const saved = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/ops/fleet/"));
  await page.getByRole("button", { name: "Enregistrer le vehicule" }).click(); await saved;
  await expect(page.getByRole("button", { name: "Enregistrer le vehicule" })).toBeEnabled();
  await stale.getByRole("button", { name: "Enregistrer le vehicule" }).click();
  await expect(stale).toHaveURL(/error=conflict/);
  await expect(stale.getByRole("alert").filter({ hasText: "modifié dans un autre onglet" })).toBeVisible();
  await expect(stale.getByLabel("Marque", { exact: true })).toHaveValue("Concurrent winner");
  await expect(stale.getByLabel("Retrait / localisation")).toHaveValue("Orléans");
  await stale.close();
});


test("automatic Paris dates refresh on a new day without replacing user choices", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2091-01-01T10:00:00Z"));
  await page.goto("/motos/bmw-g310r");
  const pickup = page.locator("#planning-pickup-bmw-g310r");
  const returns = page.locator("#planning-return-bmw-g310r");
  await expect(pickup).toHaveValue("2091-01-02");
  await page.clock.setFixedTime(new Date("2091-01-03T10:00:00Z"));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(pickup).toHaveValue("2091-01-04");
  await pickup.fill("2091-02-10"); await returns.fill("2091-02-12");
  await page.clock.setFixedTime(new Date("2091-01-05T10:00:00Z"));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(pickup).toHaveValue("2091-02-10");
  await expect(returns).toHaveValue("2091-02-12");
});
