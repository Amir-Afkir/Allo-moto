const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { createLoader } = require('./load-ts.cjs');

class TestResponse extends Response {
  static json(body, init) { return new TestResponse(JSON.stringify(body), { ...init, headers: { 'content-type': 'application/json', ...init?.headers } }); }
  constructor(...args) {
    super(...args); this.cookieWrites = [];
    this.cookies = { set: (...values) => this.cookieWrites.push(values) };
  }
}
const body = () => ({
  expectedPricing: { dailyPrice: 50, depositAmount: 500, currency: "EUR" },
  draft: { motorcycleSlug: 'bike', pickupDate: '2090-01-01', returnDate: '2090-01-02', pickupMode: 'motorcycle-location', permit: 'A' },
  clientDraft: { firstName: 'Test', lastName: 'Client', email: 'test@example.invalid', phone: '+33000000000', preferredContact: 'email', permitType: 'A', consentDataUse: true },
});
const postRequest = (value = body(), headers = {}) => new Request('https://test.invalid/api/reservations', { method: 'POST', headers: { 'content-type': 'application/json', 'idempotency-key': 'b9bf9826-ddce-40a4-8b39-3fb7cc0c3b11', ...headers }, body: JSON.stringify(value) });
async function environment(work) {
  const keys = ['ADMIN_USERNAME','ADMIN_PASSWORD','ADMIN_SESSION_SECRET','NODE_ENV'];
  const previous = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  try {
    process.env.ADMIN_USERNAME = 'test-admin'; process.env.ADMIN_PASSWORD = randomBytes(16).toString('hex');
    process.env.ADMIN_SESSION_SECRET = randomBytes(32).toString('hex'); process.env.NODE_ENV = 'production';
    await work();
  } finally {
    for (const key of keys) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
  }
}
function apiLoader(createReservationRequest) {
  return createLoader({
    'next/server': { NextResponse: TestResponse },
    '@/app/_features/ops/data/ops-store': { createReservationRequest },
  });
}

test('API sets a purpose-bound HttpOnly private receipt only after successful persistence', () => environment(async () => {
  let created = 0;
  const loader = apiLoader(async (input) => {
    created += 1;
    assert.equal(input.idempotencyKey, 'b9bf9826-ddce-40a4-8b39-3fb7cc0c3b11');
    return { reservation: { id: 'secret-server-id', reference: 'MY-REFERENCE', vehicleSlug: input.draft.motorcycleSlug, pickupAt: '2090-01-01T10:00:00Z', returnAt: '2090-01-02T18:00:00Z', pickupMode: 'motorcycle-location', status: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), adminNote: 'PRIVATE-NOTE', documentNumber: 'PRIVATE-PASSPORT' } };
  });
  const route = loader.load('app/api/reservations/route.ts');
  const response = await route.POST(postRequest());
  assert.equal(response.status, 200); assert.equal(created, 1);
  const result = await response.json();
  assert.equal(result.reservation.reference, 'MY-REFERENCE');
  assert.ok(!JSON.stringify(result).includes('PRIVATE'));
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
  const [name, cookie, flags] = response.cookieWrites[0];
  assert.match(name, /^allo-moto\.reservation\.receipt\.v3\.[a-f0-9]{24}$/);
  assert.equal(flags.httpOnly, true); assert.equal(flags.secure, true); assert.equal(flags.sameSite, 'lax');
  assert.equal(flags.path, '/api/reservations');
  const security = loader.load('app/_features/ops/lib/session-security.ts');
  assert.equal(security.readAccessToken(cookie, 'reservation', process.env.ADMIN_SESSION_SECRET), 'secret-server-id');
  assert.equal(security.readAccessToken(cookie, 'admin', process.env.ADMIN_SESSION_SECRET), null);
}));

test('missing receipt secret prevents persistence instead of returning an untrackable success', () => environment(async () => {
  delete process.env.ADMIN_SESSION_SECRET;
  let created = 0;
  const route = apiLoader(async () => { created += 1; }).load('app/api/reservations/route.ts');
  const response = await route.POST(postRequest());
  assert.equal(response.status, 503); assert.equal(created, 0); assert.equal(response.cookieWrites.length, 0);
}));

test('malformed or cross-site API submissions never reach the store', () => environment(async () => {
  let created = 0;
  const route = apiLoader(async () => { created += 1; }).load('app/api/reservations/route.ts');
  const invalid = body(); invalid.clientDraft.consentDataUse = 'true';
  assert.equal((await route.POST(postRequest(invalid))).status, 422);
  assert.equal((await route.POST(postRequest(body(), { 'sec-fetch-site': 'cross-site' }))).status, 403);
  assert.equal((await route.POST(postRequest(body(), { 'content-type': 'text/plain' }))).status, 415);
  assert.equal(created, 0);
}));

test('API never sends raw infrastructure errors or cookies on failure', () => environment(async () => {
  const route = apiLoader(async () => { throw new Error('PRIVATE-DATABASE-URL postgres://password@database/customer_email'); }).load('app/api/reservations/route.ts');
  const response = await route.POST(postRequest());
  assert.equal(response.status, 500); assert.equal(response.cookieWrites.length, 0);
  assert.ok(!JSON.stringify(await response.json()).includes('PRIVATE'));
}));

test('a GET without a receipt cannot enumerate by adding an id query parameter', () => environment(async () => {
  const route = apiLoader(async () => { throw new Error('unexpected'); }).load('app/api/reservations/route.ts');
  const response = await route.GET({ cookies: { getAll: () => [] }, url: 'https://test.invalid/api/reservations?id=someone-else' });
  assert.equal(response.status, 404); assert.equal((await response.json()).reservation, undefined);
  assert.ok(response.headers.get('cache-control').includes('no-store'));
}));

test('admin auth protects server entry points, issues secure v2 cookie and invalidates old sessions', () => environment(async () => {
  const values = new Map(); const writes = [];
  const cookies = { get: (k) => values.has(k) ? { value: values.get(k) } : undefined, set: (name, value, options) => { values.set(name,value); writes.push(options); }, delete: (name) => values.delete(name) };
  const loader = createLoader({ 'next/headers': { cookies: async () => cookies }, 'next/navigation': { redirect: () => { throw new Error('redirected'); } } });
  const auth = loader.load('app/_features/ops/lib/auth.ts');
  values.set('allo-moto.ops.session', 'legacy-cookie');
  assert.equal(await auth.isAdminAuthenticated(), false);
  await assert.rejects(auth.requireAdminSession(), /redirected/);
  assert.equal(await auth.attemptAdminLogin(process.env.ADMIN_USERNAME, 'incorrect'), false);
  assert.equal(await auth.attemptAdminLogin(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD), true);
  assert.equal(values.has('allo-moto.ops.session'), false);
  assert.equal(await auth.isAdminAuthenticated(), true);
  assert.equal(writes[0].httpOnly, true); assert.equal(writes[0].secure, true);
  process.env.ADMIN_PASSWORD = randomBytes(16).toString('hex');
  assert.equal(await auth.isAdminAuthenticated(), false);
  await auth.clearAdminSession(); assert.equal(values.size, 0);
}));


test('missing or malformed idempotency keys are refused before persistence', () => environment(async () => {
  let created = 0;
  const route = apiLoader(async () => { created++; }).load('app/api/reservations/route.ts');
  for (const key of ['', 'guessable', 'x'.repeat(500)]) {
    const response = await route.POST(postRequest(body(), { 'idempotency-key': key }));
    assert.equal(response.status, 400);
    assert.equal(response.cookieWrites.length, 0);
  }
  assert.equal(created, 0);
}));
