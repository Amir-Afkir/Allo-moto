const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { createLoader } = require('./load-ts.cjs');

async function fixture(work, overrides = {}) {
  const cwd = process.cwd();
  const previousEnv = { NODE_ENV: process.env.NODE_ENV, DATABASE_URL: process.env.DATABASE_URL, ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET };
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'allo-moto-test-'));
  try {
    process.env.NODE_ENV = 'test'; delete process.env.DATABASE_URL;
    process.env.ADMIN_SESSION_SECRET = randomBytes(32).toString('hex');
    process.chdir(temp);
    const loader = createLoader(overrides);
    const store = loader.load('app/_features/ops/data/ops-store.ts');
    await store.saveVehicle({ values: {
      name: 'Audit bike', brand: 'Audit', category: 'roadster', transmission: 'manual', licenseCategory: 'A', locationLabel: 'Test location',
      featured: true, priceFrom: 50, depositAmount: 500, includedMileageKmPerDay: 100,
      primaryImage: '', editorialNote: 'Test bike', opsStatus: 'active', slug: 'audit-bike',
    } });
    const input = {
      draft: { motorcycleSlug: 'audit-bike', pickupDate: '2090-06-10', returnDate: '2090-06-12', pickupMode: 'motorcycle-location', permit: 'A' },
      clientDraft: { firstName: 'PRIVATE-FIRST', lastName: 'PRIVATE-LAST', email: 'test@example.invalid', phone: '+33000000000', country: '', preferredContact: 'email', permitType: 'A', permitNumber: 'PRIVATE-PERMIT', documentType: 'passport', documentNumber: 'PRIVATE-PASSPORT', notes: 'PRIVATE-NOTE', consentDataUse: true },
    };
    await work({ store, loader, input, file: path.join(temp, 'data/ops-store.json') });
  } finally {
    process.chdir(cwd);
    for (const [key, value] of Object.entries(previousEnv)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

test('all public entry points omit personal data, admin notes, human references and pending requests', async () => fixture(async ({ store, input, file }) => {
  const pending = await store.createReservationRequest(input);
  await store.updateReservationStatus({ reservationId: pending.reservation.id, nextStatus: 'confirmed', adminNote: 'PRIVATE-ADMIN-NOTE' });
  await store.addVehicleBlock({ vehicleSlug: 'audit-bike', type: 'maintenance', startDate: '2091-01-01', endDate: '2091-01-02', note: 'PRIVATE-BLOCK-NOTE' });
  for (const data of [await store.getPlanningContext(new Date()), await store.getPublicCatalogPageData(new Date()), await store.getPublicMotorcycleDetailPageData('audit-bike', new Date()), await store.getReservationPageData('audit-bike')]) {
    const serialized = JSON.stringify(data);
    assert.ok(!serialized.includes('PRIVATE'), serialized);
    assert.ok(!serialized.includes(pending.reservation.reference));
    assert.ok(!serialized.includes(pending.reservation.id));
    assert.ok(!serialized.includes('test@example.invalid'));
  }
  const second = await store.createReservationRequest({ ...input, draft: { ...input.draft, pickupDate: '2092-01-01', returnDate: '2092-01-02' } });
  assert.equal((await store.getPlanningContext(new Date())).reservations.length, 1);
  assert.ok(fs.readFileSync(file, 'utf8').includes(second.reservation.id));
}));

test('refusal and cancellation retain full history but release reservation blocks', async () => fixture(async ({ store, input }) => {
  const first = await store.createReservationRequest(input);
  await store.updateReservationStatus({ reservationId: first.reservation.id, nextStatus: 'rejected' });
  assert.equal((await store.getAdminReservationById(first.reservation.id)).reservation.status, 'rejected');
  const second = await store.createReservationRequest(input);
  await store.updateReservationStatus({ reservationId: second.reservation.id, nextStatus: 'confirmed' });
  await store.updateReservationStatus({ reservationId: second.reservation.id, nextStatus: 'cancelled' });
  const history = await store.getAdminReservationById(second.reservation.id);
  assert.equal(history.reservation.status, 'cancelled');
  assert.equal(history.reservation.documentNumber, 'PRIVATE-PASSPORT');
  assert.equal(history.linkedBlocks.length, 0);
  assert.equal((await store.getPlanningContext(new Date())).reservations.length, 0);
  assert.equal((await store.getOpsActionSummary()).openReservations, 0);
}));

test('reading an overdue rental never deletes it; only explicit return releases the bike', async () => fixture(async ({ store, input, file }) => {
  const pending = await store.createReservationRequest(input);
  await store.updateReservationStatus({ reservationId: pending.reservation.id, nextStatus: 'confirmed' });
  const snapshot = JSON.parse(fs.readFileSync(file, 'utf8'));
  const reservation = snapshot.reservations.find((r) => r.id === pending.reservation.id);
  reservation.pickupDate = '2000-01-01'; reservation.returnDate = '2000-01-02';
  reservation.pickupAt = '2000-01-01T10:00:00.000Z'; reservation.returnAt = '2000-01-02T18:00:00.000Z';
  for (const block of snapshot.vehicleBlocks.filter((b) => b.reservationId === reservation.id)) { block.startAt = reservation.pickupAt; block.endAt = reservation.returnAt; }
  fs.writeFileSync(file, JSON.stringify(snapshot));
  assert.equal((await store.getAdminReservationById(reservation.id)).reservation.status, 'confirmed');
  assert.equal((await store.getPublicMotorcycleBySlug('audit-bike', new Date())).status, 'reserved');
  assert.ok(JSON.parse(fs.readFileSync(file, 'utf8')).reservations.some((r) => r.id === reservation.id));
  await store.updateReservationStatus({ reservationId: reservation.id, nextStatus: 'completed' });
  assert.equal((await store.getAdminReservationById(reservation.id)).reservation.status, 'completed');
  assert.equal((await store.getPublicMotorcycleBySlug('audit-bike', new Date())).status, 'available');
}));

test('closed records cannot be reopened, completed before pickup, or orphaned by deleting their bike', async () => fixture(async ({ store, input }) => {
  const first = await store.createReservationRequest(input);
  await store.updateReservationStatus({ reservationId: first.reservation.id, nextStatus: 'confirmed' });
  await assert.rejects(store.updateReservationStatus({ reservationId: first.reservation.id, nextStatus: 'completed' }));
  await store.updateReservationStatus({ reservationId: first.reservation.id, nextStatus: 'cancelled' });
  await assert.rejects(store.updateReservationStatus({ reservationId: first.reservation.id, nextStatus: 'confirmed' }));
  await assert.rejects(store.deleteVehicle({ vehicleSlug: 'audit-bike' }));
  await store.updateReservationStatus({ reservationId: first.reservation.id, nextStatus: 'cancelled' });
  assert.equal((await store.listAdminReservations({ status: 'cancelled' })).length, 1);
}));

test('private receipt requires a valid purpose-bound cookie and never returns customer documents', async () => fixture(async ({ store, loader, input }) => {
  const first = await store.createReservationRequest(input);
  const security = loader.load('app/_features/ops/lib/session-security.ts');
  const receipts = loader.load('app/_features/ops/data/reservation-receipt.ts');
  assert.equal(await receipts.getPrivateReservationReceipt(undefined), null);
  assert.equal(await receipts.getPrivateReservationReceipt(first.reservation.id), null);
  const token = security.createAccessToken(first.reservation.id, 'reservation', process.env.ADMIN_SESSION_SECRET);
  const receipt = await receipts.getPrivateReservationReceipt(token);
  assert.equal(receipt.reference, first.reservation.reference);
  assert.ok(!JSON.stringify(receipt).includes('PRIVATE'));
  assert.equal(await receipts.getPrivateReservationReceipt(security.createAccessToken(first.reservation.id, 'admin', process.env.ADMIN_SESSION_SECRET)), null);
  await store.updateReservationStatus({ reservationId: first.reservation.id, nextStatus: 'rejected' });
  assert.equal((await receipts.getPrivateReservationReceipt(token)).reservationStatus, 'rejected');
}));

test('every successful mutation invalidates public caches', async () => fixture(async ({ store, loader, input }) => {
  loader.invalidations.length = 0;
  await store.createReservationRequest(input);
  assert.deepEqual(loader.invalidations, ['public-catalog', 'public-planning', 'public-home']);
}));

test('production reuses one database pool rather than allocating one per read', async () => {
  const saved = { NODE_ENV: process.env.NODE_ENV, DATABASE_URL: process.env.DATABASE_URL };
  let pools = 0;
  const fakeSql = Object.assign(async (strings) => strings.join('').includes('count(*)') ? [{ count: '1' }] : [], { begin: (work) => work(fakeSql) });
  try {
    process.env.NODE_ENV = 'production'; process.env.DATABASE_URL = 'postgres://unused/test';
    delete global.__alloMotoOpsSql; delete global.__alloMotoOpsDbReady;
    const loader = createLoader({ postgres: () => { pools += 1; return fakeSql; } });
    const db = loader.load('app/_features/ops/data/ops-store-db.ts');
    await db.loadOpsDatabaseStore(); await db.loadOpsDatabaseStore();
    assert.equal(pools, 1);
  } finally {
    delete global.__alloMotoOpsSql; delete global.__alloMotoOpsDbReady;
    for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});

test('idempotent local requests serialize: retries create one record and changing payload conflicts', async () => fixture(async ({ store, input, file }) => {
  const { randomUUID } = require('node:crypto'); const key = randomUUID();
  const results = await Promise.all(Array.from({length: 8}, () => store.createReservationRequest({...input, idempotencyKey: key})));
  assert.equal(new Set(results.map((r) => r.reservation.id)).size, 1);
  const id = results[0].reservation.id;
  assert.equal((await store.listAdminReservations()).length, 1);
  await assert.rejects(store.createReservationRequest({...input, clientDraft: {...input.clientDraft, firstName:'Other'}, idempotencyKey: key}), (error) => error.status === 409);
  await store.updateReservationStatus({ reservationId: id, nextStatus: 'confirmed' });
  assert.equal((await store.createReservationRequest({...input, idempotencyKey: key.toUpperCase()})).reservation.status, 'confirmed');
  await store.updateReservationStatus({ reservationId: id, nextStatus: 'cancelled' });
  assert.equal((await store.createReservationRequest({...input, idempotencyKey:key})).reservation.id, id);
  assert.equal((await store.listAdminReservations()).length, 1);
  assert.ok(!fs.readFileSync(file,'utf8').includes(key));
  assert.ok(!JSON.stringify(await store.getReservationPageData()).includes('idempotencyKeyHash'));
  assert.notEqual((await store.createReservationRequest({...input, idempotencyKey:randomUUID()})).reservation.id, id);
}));

test('failed validation leaves the retry key unused and past departures cannot be persisted', async () => fixture(async ({ store, input }) => {
  const { randomUUID } = require('node:crypto'); const key = randomUUID();
  await assert.rejects(store.createReservationRequest({...input, draft:{...input.draft, pickupDate:'2000-01-01'}, idempotencyKey: key}), /passé/);
  assert.equal((await store.listAdminReservations()).length, 0);
  assert.ok((await store.createReservationRequest({...input, idempotencyKey:key})).reservation.id);
}));

test('a currently rented vehicle accepts a nonoverlapping future request, but an overdue return does not', async () => fixture(async ({ store, input, file }) => {
  const first = await store.createReservationRequest(input);
  await store.updateReservationStatus({reservationId:first.reservation.id,nextStatus:'confirmed'});
  const snapshot = JSON.parse(fs.readFileSync(file,'utf8'));
  const record = snapshot.reservations.find((r) => r.id === first.reservation.id);
  record.pickupAt = new Date(Date.now()-3_600_000).toISOString();
  record.returnAt = new Date(Date.now()+3_600_000).toISOString();
  for (const block of snapshot.vehicleBlocks.filter((b) => b.reservationId===record.id)) {block.startAt=record.pickupAt;block.endAt=record.returnAt;}
  fs.writeFileSync(file,JSON.stringify(snapshot));
  const motorcycle = await store.getPublicMotorcycleBySlug('audit-bike',new Date());
  assert.equal(motorcycle.status,'reserved'); assert.equal(motorcycle.bookingStatus,'active');
  const second = await store.createReservationRequest(input);
  assert.notEqual(first.reservation.id, second.reservation.id);
  const next = JSON.parse(fs.readFileSync(file,'utf8'));
  next.reservations.find((r) => r.id===record.id).returnAt=new Date(Date.now()-1000).toISOString();
  fs.writeFileSync(file,JSON.stringify(next));
  await assert.rejects(store.createReservationRequest(input), /retour/);
}));

test('manual maintenance validates type/dates and cannot contradict a confirmed rental', async () => fixture(async ({ store, input }) => {
  const block = {vehicleSlug:'audit-bike',type:'maintenance',startDate:input.draft.pickupDate,endDate:input.draft.returnDate,note:'TEST'};
  for (const invalid of [{type:'reservation'},{startDate:'2090-02-30'},{endDate:'2090-06-09'}]) {
    await assert.rejects(store.addVehicleBlock({...block,...invalid}), /invalide/);
  }
  const first = await store.createReservationRequest(input);
  await store.updateReservationStatus({reservationId:first.reservation.id,nextStatus:'confirmed'});
  await assert.rejects(store.addVehicleBlock(block), /confirmée/);
  await store.addVehicleBlock({...block,startDate:'2091-01-01',endDate:'2091-01-02'});
  assert.equal((await store.getAdminReservationById(first.reservation.id)).reservation.status, 'confirmed');
}));

test('new stored timestamps and prices match the public service-window calculation', async () => fixture(async ({ store, input, loader }) => {
  const time = loader.load('app/_features/reservation/data/rental-time.ts');
  const result = await store.createReservationRequest(input);
  assert.equal(result.reservation.pickupAt, time.buildRentalWindow(input.draft).pickupAt);
  assert.equal(result.reservation.returnAt, time.buildRentalWindow(input.draft).returnAt);
  assert.equal(result.reservation.estimatedTotal, 150);
  assert.equal(result.reservation.totalDays, 3);
}));
