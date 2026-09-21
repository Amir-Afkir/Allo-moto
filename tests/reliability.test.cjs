const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomBytes, randomUUID } = require('node:crypto');
const { createLoader } = require('./load-ts.cjs');

const values = { slug: 'reliability-bike', name: 'Reliable', brand: 'Test', category: 'roadster', transmission: 'manual', licenseCategory: 'A', locationLabel: 'Orléans', featured: true, priceFrom: 50, depositAmount: 500, includedMileageKmPerDay: 100, primaryImage: 'old.webp', primaryImagePublicId: 'old', editorialNote: 'Test', opsStatus: 'active' };
function request() { return { expectedPricing: { dailyPrice: 50, depositAmount: 500, currency: 'EUR' }, draft: { motorcycleSlug: values.slug, pickupDate: '2090-06-10', returnDate: '2090-06-12', pickupMode: 'motorcycle-location', permit: 'A' }, clientDraft: { firstName: 'PRIVATE-FIRST', lastName: 'PRIVATE-LAST', email: 'test@example.invalid', phone: '+33600000000', preferredContact: 'email', permitType: 'A', consentDataUse: true } }; }
async function fixture(work, overrides = {}) {
  const cwd = process.cwd(); const env = { ...process.env }; const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'allo-pass4-'));
  try {
    process.chdir(directory); process.env.NODE_ENV = 'test'; delete process.env.DATABASE_URL; process.env.ADMIN_SESSION_SECRET = randomBytes(32).toString('hex');
    fs.mkdirSync('data'); fs.writeFileSync('data/ops-store.json', JSON.stringify({ version: 1, vehicles: [], reservations: [], vehicleBlocks: [] }));
    const loader = createLoader(overrides); const store = loader.load('app/_features/ops/data/ops-store.ts');
    const revision = loader.load('app/_features/ops/lib/vehicle-revision.ts').vehicleRevision;
    await store.saveVehicle({ values });
    const vehicle = async () => (await store.getAdminVehicleBySlug(values.slug)).vehicle;
    const save = async (patch, imageChange, expectedRevision) => store.saveVehicle({ currentSlug: values.slug, values: { ...values, ...patch }, imageChange, expectedRevision: expectedRevision ?? revision(await vehicle()) });
    await work({ store, loader, revision, vehicle, save });
  } finally { process.chdir(cwd); process.env = env; fs.rmSync(directory, { recursive: true, force: true }); }
}

test('changed price/deposit requires acceptance, consumes no key and retry retains historical terms', () => fixture(async ({ store, loader, save }) => {
  const input = { ...request(), idempotencyKey: randomUUID() };
  await save({ priceFrom: 100, depositAmount: 800 });
  await assert.rejects(store.createReservationRequest(input), (e) => e.currentPricing.estimatedTotal === 300 && e.currentPricing.depositAmount === 800);
  assert.equal((await store.listAdminReservations()).length, 0);
  input.expectedPricing = { dailyPrice: 100, depositAmount: 800, currency: 'EUR' };
  const first = await store.createReservationRequest(input);
  await save({ priceFrom: 130, depositAmount: 950 });
  const retry = await store.createReservationRequest(input);
  assert.equal(retry.reservation.id, first.reservation.id);
  const receipt = loader.load('app/_features/ops/data/reservation-receipt.ts').toPrivateReservationReceipt(retry.reservation);
  assert.deepEqual(receipt.pricing, { dailyPrice: 100, depositAmount: 800, currency: 'EUR', totalDays: 3, estimatedTotal: 300 });
  assert.equal((await store.listAdminReservations()).length, 1);
  const newRequest = { ...request(), idempotencyKey: randomUUID(), expectedPricing: { dailyPrice: 130, depositAmount: 800, currency: 'EUR' } };
  await assert.rejects(store.createReservationRequest(newRequest), (e) => e.currentPricing.depositAmount === 950);
}));

test('pricing parser rejects missing/malformed accepted terms instead of trusting client totals', () => {
  const { parseReservationRequest } = createLoader().load('app/_features/reservation/data/reservation-request.ts');
  for (const expectedPricing of [undefined, null, {}, { dailyPrice: -1, depositAmount: 500, currency: 'EUR' }, { dailyPrice: 50, depositAmount: '500', currency: 'EUR' }, { dailyPrice: 50, depositAmount: 500, currency: 'USD' }]) {
    assert.throws(() => parseReservationRequest({ ...request(), expectedPricing }));
  }
  const input = request(); input.expectedPricing.estimatedTotal = 1;
  assert.equal(parseReservationRequest(input).expectedPricing.estimatedTotal, undefined);
});

test('concurrent fleet edits have one winner and keep never restores an obsolete image URL', () => fixture(async ({ save, vehicle, revision }) => {
  const old = revision(await vehicle());
  const results = await Promise.allSettled([
    save({ brand: 'Winner' }, { kind: 'replace', asset: { src: 'new.webp', publicId: 'new' } }, old),
    save({ name: 'Stale' }, { kind: 'keep' }, old),
  ]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(results.filter((r) => r.status === 'rejected' && r.reason.constructor.name === 'VehicleConflictError').length, 1);
  assert.equal((await vehicle()).primaryImage, 'new.webp');
  await save({ primaryImage: 'old.webp', primaryImagePublicId: 'old' }, { kind: 'keep' });
  assert.equal((await vehicle()).primaryImage, 'new.webp');
}));

test('revision is canonical across property order; shared gallery asset is not deleted', () => fixture(async ({ save, vehicle, revision }) => {
  const before = await vehicle();
  assert.equal(revision(before), revision(Object.fromEntries(Object.entries(before).reverse())));
  const result = await save({ gallery: ['old.webp'] }, { kind: 'replace', asset: { src: 'new.webp', publicId: 'new' } });
  assert.equal(result.replacedImage, null);
  assert.equal((await vehicle()).primaryImage, 'new.webp');
}));

test('upload race rejects stale action and cleans only its uncommitted image', async () => {
  let entered, release;
  const enteredPromise = new Promise((resolve) => { entered = resolve; });
  const released = new Promise((resolve) => { release = resolve; });
  const deleted = [];
  const overrides = {
    'next/navigation': { redirect: (location) => { throw Object.assign(new Error('redirect'), { location }); } },
    '@/app/_features/ops/lib/auth': { requireAdminSession: async () => {} },
    '@/app/_features/ops/lib/image-upload': {
      uploadVehicleImage: async () => { entered(); await released; return { src: 'loser.webp', publicId: 'loser' }; },
      deleteVehicleImageAsset: async (image) => { deleted.push(image); },
    },
  };
  await fixture(async ({ loader, save, vehicle, revision }) => {
    const data = new FormData();
    for (const [key, value] of Object.entries(values)) data.set(key, String(value));
    data.set('currentSlug', values.slug); data.set('expectedRevision', revision(await vehicle()));
    data.set('primaryImageState', 'replace'); data.set('primaryImageFile', new File(['image'], 'photo.png', { type: 'image/png' }));
    const action = loader.load('app/_features/ops/actions/ops-actions.ts').saveVehicleAction(data);
    const assertion = assert.rejects(action, (e) => e.location.endsWith('?error=conflict'));
    await enteredPromise;
    await save({ brand: 'Concurrent winner' }, { kind: 'replace', asset: { src: 'winner.webp', publicId: 'winner' } });
    release(); await assertion;
    assert.equal((await vehicle()).brand, 'Concurrent winner');
    assert.equal((await vehicle()).primaryImage, 'winner.webp');
    assert.deepEqual(deleted, [{ src: 'loser.webp', publicId: 'loser' }]);
  }, overrides);
});

test('cache invalidation failures after commit never pretend the save rolled back', () => fixture(async ({ store }) => {
  const input = { ...request(), idempotencyKey: randomUUID() };
  const result = await store.createReservationRequest(input);
  assert.equal((await store.getAdminReservationById(result.reservation.id)).reservation.id, result.reservation.id);
}, { 'next/cache': { unstable_cache: (fn) => fn, revalidateTag: () => { throw new Error('cache unavailable'); } } }));

test('independent receipt cookies recover multiple requests, including legacy, without granting ID-based access', () => fixture(async ({ store, loader }) => {
  const receipts = loader.load('app/_features/ops/data/reservation-receipt.ts');
  const security = loader.load('app/_features/ops/lib/session-security.ts');
  const secret = process.env.ADMIN_SESSION_SECRET;
  const first = (await store.createReservationRequest(request())).reservation;
  const second = (await store.createReservationRequest(request())).reservation;
  const cookie = (record, name = receipts.receiptCookieName(record.id)) => ({ name, value: security.createAccessToken(record.id, 'reservation', secret) });
  const jar = [cookie(first), cookie(second)];
  const accessible = await receipts.getBrowserReservationReceipts(jar);
  assert.equal(accessible.length, 2);
  const selected = await receipts.getBrowserReservationReceipts(jar, receipts.toPrivateReservationReceipt(first).id);
  assert.equal(selected[0].reference, first.reference);
  assert.equal((await receipts.getBrowserReservationReceipts([cookie(first)], receipts.toPrivateReservationReceipt(second).id)).length, 0);
  assert.equal((await receipts.getBrowserReservationReceipts([cookie(first, receipts.RECEIPT_COOKIE)])).length, 1);
  assert.equal((await receipts.getBrowserReservationReceipts([cookie(first, receipts.receiptCookieName(second.id))])).length, 0);
  assert.equal((await receipts.getBrowserReservationReceipts([{ ...jar[0], value: jar[0].value.slice(1) }])).length, 0);
  const expired = { name: jar[0].name, value: security.createAccessToken(first.id, 'reservation', secret, Date.now() - security.SESSION_MAX_AGE_SECONDS * 1000 - 1) };
  assert.equal((await receipts.getBrowserReservationReceipts([expired])).length, 0);
  assert.ok(!JSON.stringify(accessible).includes('PRIVATE'));
  assert.equal(accessible[0].pricing.estimatedTotal, 150);
}));

test('support survives network and HTTP failures, retries in the same process, validates blank/out-of-range coordinates', async () => {
  const oldEnv = { ...process.env }, oldFetch = global.fetch;
  try {
    for (const key of Object.keys(process.env)) if (key.startsWith('NEXT_PUBLIC_SUPPORT_') || key === 'NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN') delete process.env[key];
    process.env.NEXT_PUBLIC_SUPPORT_PHONE = '06 12 34 56 78';
    process.env.NEXT_PUBLIC_SUPPORT_LATITUDE = ' '; process.env.NEXT_PUBLIC_SUPPORT_LONGITUDE = '';
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = 'mock';
    let calls = 0;
    global.fetch = async () => { calls++; throw new Error('offline'); };
    const support = createLoader().load('app/_features/support/data/support.ts');
    const empty = await support.getSupportConfig();
    assert.equal(empty.map, null); assert.equal(empty.mapsHref, null); assert.equal(calls, 0);
    assert.equal(empty.phoneHref, 'tel:+33612345678'); assert.match(empty.whatsappHref, /wa.me\/33612345678/);
    process.env.NEXT_PUBLIC_SUPPORT_ADDRESS_LINE_1 = '1 rue de la République'; process.env.NEXT_PUBLIC_SUPPORT_CITY = 'Orléans';
    assert.equal((await support.getSupportConfig()).map, null);
    global.fetch = async (_url, options) => { assert.ok(options.signal); return Response.json({ features: [{ center: [1.9, 47.9] }] }); };
    assert.equal((await support.getSupportConfig()).map.latitude, 47.9);
    global.fetch = async () => Response.json({}, { status: 503 });
    assert.equal((await support.getSupportConfig()).map, null);
    global.fetch = async () => Response.json({ features: [{ center: [1.9, 147.9] }] });
    assert.equal((await support.getSupportConfig()).map, null);
    delete process.env.NEXT_PUBLIC_SUPPORT_ADDRESS_LINE_1; delete process.env.NEXT_PUBLIC_SUPPORT_CITY;
    process.env.NEXT_PUBLIC_SUPPORT_LATITUDE = '91'; process.env.NEXT_PUBLIC_SUPPORT_LONGITUDE = '181';
    assert.equal((await support.getSupportConfig()).map, null);
  } finally { process.env = oldEnv; global.fetch = oldFetch; }
});

test('phone checks reject letters but accept French and international contact formats', () => {
  const phone = createLoader().load('app/_shared/lib/phone.ts');
  for (const value of ['abc', '+33test12345', '123', '0000000000']) assert.equal(phone.isPlausiblePhone(value), false);
  for (const value of ['06 12 34 56 78', '+212 612-345678', '+1 (202) 555-0182']) assert.equal(phone.isPlausiblePhone(value), true);
  assert.equal(phone.supportPhoneDigits('0033612345678'), '33612345678');
  assert.equal(phone.supportPhoneDigits('+212612345678'), '212612345678');
});
