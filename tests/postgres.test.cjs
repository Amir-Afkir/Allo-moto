const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createLoader } = require('./load-ts.cjs');

test('PostgreSQL: concurrent confirmations serialize and cancellation keeps persisted history', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const originalCwd = process.cwd();
  const originalUrl = process.env.DATABASE_URL;
  const originalMode = process.env.NODE_ENV;
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'allo-moto-pg-'));
  try {
    // Use only a disposable database supplied explicitly by the test job.
    process.env.NODE_ENV = 'test'; process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.chdir(temp);
    fs.mkdirSync('data'); fs.writeFileSync('data/ops-store.json', JSON.stringify({ version: 1, vehicles: [], reservations: [], vehicleBlocks: [] }));
    const loader = createLoader({ postgres: require('postgres') });
    const store = loader.load('app/_features/ops/data/ops-store.ts');
    await store.saveVehicle({ values: { slug: 'pg-test-bike', name: 'Test bike', brand: 'Test', category: 'roadster', transmission: 'manual', licenseCategory: 'A', locationLabel: 'Test', featured: true, priceFrom: 50, depositAmount: 500, includedMileageKmPerDay: 100, primaryImage: '', editorialNote: 'Test', opsStatus: 'active' } });
    const input = { draft: { motorcycleSlug: 'pg-test-bike', pickupDate: '2090-06-01', returnDate: '2090-06-02', pickupMode: 'motorcycle-location', permit: 'A' }, clientDraft: { firstName: 'Test', lastName: 'Client', email: 'test@example.invalid', phone: '+33000000000', preferredContact: 'email', permitType: 'A', consentDataUse: true } };
    const [one, two] = await Promise.all([store.createReservationRequest(input), store.createReservationRequest(input)]);
    const outcomes = await Promise.allSettled([one, two].map((record) => store.updateReservationStatus({ reservationId: record.reservation.id, nextStatus: 'confirmed' })));
    assert.equal(outcomes.filter((result) => result.status === 'fulfilled').length, 1);
    const rows = await store.listAdminReservations(); assert.equal(rows.length, 2);
    const winner = rows.find(({ reservation }) => reservation.status === 'confirmed').reservation;
    await store.updateReservationStatus({ reservationId: winner.id, nextStatus: 'cancelled' });
    const saved = await store.getAdminReservationById(winner.id);
    assert.equal(saved.reservation.status, 'cancelled'); assert.equal(saved.linkedBlocks.length, 0);
    assert.equal((await store.listAdminReservations()).length, 2);
  } finally {
    await global.__alloMotoOpsSql?.end({ timeout: 5 });
    delete global.__alloMotoOpsSql; delete global.__alloMotoOpsDbReady;
    process.chdir(originalCwd); fs.rmSync(temp, { recursive: true, force: true });
    if (originalUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = originalUrl;
    if (originalMode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = originalMode;
  }
});
