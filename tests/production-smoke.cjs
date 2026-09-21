// CI-only: exercise the real production build/HTTP responses with synthetic private records.
// Never connect to a database or touch a developer's mutable store.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { once } = require('node:events');

async function main() {
  assert.equal(process.env.GITHUB_ACTIONS, 'true', 'Run this seed-fixture check only in disposable GitHub Actions.');
  assert.equal(process.env.CI, 'true', 'A disposable CI checkout is required.');
  const file = path.join(process.cwd(), 'data/ops-store.json');
  const original = fs.readFileSync(file);
  const fixture = JSON.parse(original.toString('utf8'));
  const vehicle = fixture.vehicles.find((value) => value.slug === 'bmw-g310r');
  assert.ok(vehicle, 'The fixture must include the tested public bike.');
  vehicle.opsStatus = 'active';
  const marker = 'SMOKE_PRIVATE_';
  const timestamp = '2095-01-01T09:00:00.000Z';
  const record = {
    id: `${marker}ID`, reference: `${marker}REFERENCE`, vehicleSlug: vehicle.slug,
    idempotencyKeyHash: `${marker}KEY_HASH`, requestHash: `${marker}REQUEST_HASH`,
    customerFirstName: `${marker}FIRST`, customerLastName: `${marker}LAST`,
    customerEmail: `${marker}EMAIL@example.invalid`, customerPhone: `${marker}PHONE`,
    customerCountry: 'FR', customerPreferredContact: 'email', permitType: 'A',
    permitNumber: `${marker}PERMIT`, documentType: 'passport', documentNumber: `${marker}DOCUMENT`,
    customerNotes: `${marker}NOTES`, consentDataUse: true, pickupMode: 'motorcycle-location',
    pickupLocationLabel: 'Orléans', pickupDate: '2095-01-01', returnDate: '2095-01-02',
    pickupAt: timestamp, returnAt: '2095-01-02T17:00:00.000Z', totalDays: 2,
    dailyPrice: 50, estimatedTotal: 100, depositAmount: 500, paymentMode: 'pickup',
    status: 'confirmed', adminNote: `${marker}ADMIN_NOTE`, createdAt: timestamp, updatedAt: timestamp,
  };
  fixture.reservations = [record, { ...record, id: `${marker}PENDING_ID`, status: 'pending' }];
  fixture.vehicleBlocks = [{
    id: `${marker}BLOCK_ID`, vehicleSlug: vehicle.slug, type: 'maintenance',
    startAt: '2095-02-01T09:00:00.000Z', endAt: '2095-02-02T17:00:00.000Z',
    reservationId: null, note: `${marker}BLOCK_NOTE`, createdAt: timestamp, updatedAt: timestamp,
  }];
  const env = { ...process.env, NODE_ENV: 'production', DATABASE_URL: '',
    ADMIN_USERNAME: '', ADMIN_PASSWORD: '', ADMIN_SESSION_SECRET: '',
    CLOUDINARY_CLOUD_NAME: '', CLOUDINARY_API_KEY: '', CLOUDINARY_API_SECRET: '',
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: '', NEXT_TELEMETRY_DISABLED: '1' };
  const next = require.resolve('next/dist/bin/next');
  let server;
  try {
    fs.writeFileSync(file, JSON.stringify(fixture));
    const build = spawnSync(process.execPath, [next, 'build', '--turbopack'], { env, stdio: 'inherit', timeout: 180_000 });
    if (build.error) throw build.error;
    assert.equal(build.status, 0, 'Production build failed.');
    server = spawn(process.execPath, [next, 'start', '--hostname', '127.0.0.1', '--port', '3200'], { env, stdio: 'inherit' });
    server.on('error', (error) => console.error(error));
    const origin = 'http://127.0.0.1:3200';
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        ready = (await fetch(`${origin}/ops/login`, { signal: AbortSignal.timeout(2_000) })).ok;
        if (ready) break;
      } catch { /* Wait for the fresh production server, never reuse an existing development server. */ }
      assert.equal(server.exitCode, null, 'Production server exited before readiness.');
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    assert.ok(ready, 'Production server did not become ready.');
    for (const route of ['/', '/motos', '/motos/bmw-g310r', '/reserver?motorcycle=bmw-g310r']) {
      const response = await fetch(origin + route, { signal: AbortSignal.timeout(15_000) });
      assert.equal(response.status, 200, route);
      const html = await response.text();
      assert.ok(!html.includes(marker), `Private data leaked in the production HTML/RSC response for ${route}`);
      assert.ok(!html.includes('browser_dev_hmr-client'), 'Production check must not run against a dev server.');
      if (route !== '/') assert.ok(html.includes('2095-01-01'), 'Synthetic planning data must actually reach the public projection.');
      console.log(`PASS production public response: ${route}`);
    }
    const admin = await fetch(`${origin}/ops/reservations`, { redirect: 'manual', signal: AbortSignal.timeout(15_000) });
    assert.ok([303, 307, 308].includes(admin.status));
    assert.match(admin.headers.get('location') || '', /\/ops\/login$/);
    const receipt = await fetch(`${origin}/api/reservations?id=${marker}ID`, { signal: AbortSignal.timeout(15_000) });
    assert.equal(receipt.status, 404);
    assert.ok(!(await receipt.text()).includes(marker));
    console.log('Production HTTP smoke: 6 checks passed (4 private-data projections, admin redirect, receipt protection).');
  } finally {
    if (server && server.exitCode === null) {
      const exited = once(server, 'exit');
      server.kill('SIGTERM');
      const force = setTimeout(() => server.kill('SIGKILL'), 5_000);
      force.unref();
      await exited;
      clearTimeout(force);
    }
    fs.writeFileSync(file, original);
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
