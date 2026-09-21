const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes, createHmac } = require('node:crypto');
const { createLoader } = require('./load-ts.cjs');
const loader = createLoader();
const security = loader.load('app/_features/ops/lib/session-security.ts');
const validation = loader.load('app/_features/reservation/data/reservation-request.ts');
const { toPublicPlanningReservation, toPublicPlanningBlock } = loader.load('app/_features/ops/data/public-planning.ts');
const secret = randomBytes(32).toString('hex');
const env = { ADMIN_USERNAME: 'audit-admin', ADMIN_PASSWORD: randomBytes(20).toString('hex'), ADMIN_SESSION_SECRET: secret };
const { createEmptyReservationClientDraft } = loader.load('app/_features/reservation/data/reservation-intake.ts');
const validRequest = () => ({
  draft: { motorcycleSlug: 'audit-bike', pickupDate: '2090-06-10', returnDate: '2090-06-12', pickupMode: 'motorcycle-location', permit: 'none' },
  clientDraft: { ...createEmptyReservationClientDraft(), firstName: 'Test', lastName: 'Client', email: 'test@example.invalid', phone: '+33000000000', preferredContact: 'email', permitType: 'A', consentDataUse: true },
});
afterEach(() => { delete global.window; });

test('admin fails closed for absent, blank, placeholder and weak configuration', () => {
  for (const values of [{}, { ...env, ADMIN_USERNAME: '' }, { ...env, ADMIN_PASSWORD: '' }, { ...env, ADMIN_SESSION_SECRET: '' }, { ...env, ADMIN_SESSION_SECRET: 'too-short' }, { ...env, ADMIN_SESSION_SECRET: 'allo-moto-admin-session-secret-change-me' }]) {
    assert.equal(security.getAdminConfig(values), null);
  }
  assert.equal(security.getAdminConfig(env).username, env.ADMIN_USERNAME);
});

test('tokens are purpose-bound, tamper-proof, expiring and revoked by secret rotation', () => {
  const now = Date.now();
  const token = security.createAccessToken('reservation-id', 'reservation', secret, now);
  assert.equal(security.readAccessToken(token, 'reservation', secret, now), 'reservation-id');
  for (const invalid of ['', `${token}.extra`, token.slice(1), token.replace(/^./, '!'), 'a'.repeat(4096)]) {
    assert.equal(security.readAccessToken(invalid, 'reservation', secret, now), null);
  }
  assert.equal(security.readAccessToken(token, 'admin', secret, now), null);
  assert.equal(security.readAccessToken(token, 'reservation', `${secret}-rotated`, now), null);
  assert.equal(security.readAccessToken(token, 'reservation', secret, now + security.SESSION_MAX_AGE_SECONDS * 1000), null);
  const forged = Buffer.from(JSON.stringify({ version: 2, subject: 'admin', issuedAt: now, expiresAt: now + 100000 })).toString('base64url');
  assert.equal(security.readAccessToken(`${forged}.${createHmac('sha256', 'public-key').update(forged).digest('base64url')}`, 'admin', secret, now), null);
});

test('password rotation changes admin subject without putting credentials in the token', () => {
  const config = security.getAdminConfig(env);
  const before = security.adminSessionSubject(config);
  const after = security.adminSessionSubject({ ...config, password: randomBytes(20).toString('hex') });
  assert.notEqual(before, after);
  const payload = Buffer.from(security.createAccessToken(before, 'admin', secret).split('.')[0], 'base64url').toString();
  assert.ok(!payload.includes(config.password));
  assert.ok(!payload.includes(config.username));
});

test('public planning uses exact allowlists, no customer identities, references, notes or raw IDs', () => {
  const original = {
    id: 'private-reservation-id', reference: 'PRIVATE-REFERENCE', vehicleSlug: 'audit-bike', status: 'confirmed',
    pickupAt: '2090-06-10T10:00:00Z', returnAt: '2090-06-12T18:00:00Z', pickupMode: 'motorcycle-location',
    customerFirstName: 'PRIVATE-FIRST', customerLastName: 'PRIVATE-LAST', customerEmail: 'PRIVATE-EMAIL',
    customerPhone: 'PRIVATE-PHONE', adminNote: 'PRIVATE-ADMIN-NOTE', permitNumber: 'PRIVATE-PERMIT',
    documentNumber: 'PRIVATE-PASSPORT', futureSecretField: 'PRIVATE-FUTURE',
  };
  const result = toPublicPlanningReservation(original);
  assert.deepEqual(Object.keys(result).sort(), ['id', 'motorcycleSlug', 'pickupAt', 'pickupMode', 'reservationStatus', 'returnAt'].sort());
  assert.notEqual(result.id, original.id);
  assert.ok(!JSON.stringify(result).includes('PRIVATE'));
  const block = toPublicPlanningBlock({ id: 'private-block-id', vehicleSlug: 'audit-bike', type: 'maintenance', startAt: original.pickupAt, endAt: original.returnAt, reservationId: original.id, note: 'PRIVATE-MECHANIC-NOTE' });
  assert.deepEqual(Object.keys(block).sort(), ['id', 'motorcycleSlug', 'type', 'startAt', 'endAt'].sort());
  assert.ok(!JSON.stringify(block).includes('PRIVATE'));
});

test('request parser accepts a valid form, defaults optional fields and drops unknown data', () => {
  const body = validRequest(); body.clientDraft.adminNote = 'forged';
  const result = validation.parseReservationRequest(body);
  assert.equal(result.clientDraft.email, 'test@example.invalid');
  assert.equal(result.clientDraft.adminNote, undefined);
});

test('request parser rejects false-string consent, wrong types, unsupported enum and overlong fields', () => {
  for (const [key, value] of [['consentDataUse', 'false'], ['firstName', []], ['email', 123], ['permitType', 'administrator'], ['preferredContact', 'unknown'], ['notes', 'x'.repeat(2001)]]) {
    const body = validRequest(); body.clientDraft[key] = value;
    assert.throws(() => validation.parseReservationRequest(body), validation.ReservationInputError);
  }
  for (const value of [null, [], { draft: true, clientDraft: {} }]) assert.throws(() => validation.parseReservationRequest(value));
});

test('request parser rejects impossible or inverted dates, not just invalid JS timestamps', () => {
  for (const dates of [['2090-02-30', '2090-03-03'], ['2090-13-01', '2091-01-01'], ['bad', '2090-03-01'], ['2090-03-02', '2090-03-01']]) {
    const body = validRequest(); [body.draft.pickupDate, body.draft.returnDate] = dates;
    assert.throws(() => validation.parseReservationRequest(body), validation.ReservationInputError);
  }
});

test('streamed API body enforces content type, malformed JSON and 32 KB independent of content-length', async () => {
  await assert.rejects(validation.readReservationRequest(new Request('https://test.invalid', { method: 'POST', body: '{}' })), (e) => e.status === 415);
  await assert.rejects(validation.readReservationRequest(new Request('https://test.invalid', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' })), (e) => e.status === 400);
  await assert.rejects(validation.readReservationRequest(new Request('https://test.invalid', { method: 'POST', headers: { 'content-type': 'application/json', 'content-length': '1' }, body: JSON.stringify({ notes: 'x'.repeat(40000) }) })), (e) => e.status === 413);
  assert.deepEqual(await validation.readReservationRequest(new Request('https://test.invalid', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: '{}' })), {});
});

function memoryStorage() {
  const values = new Map();
  return { getItem: (k) => values.get(k) ?? null, setItem: (k,v) => values.set(k,v), removeItem: (k) => values.delete(k), values };
}

test('draft migrates away from localStorage and never persists document, permit, notes or consent', () => {
  const localStorage = memoryStorage(); const sessionStorage = memoryStorage();
  global.window = { localStorage, sessionStorage };
  const intake = loader.load('app/_features/reservation/data/reservation-intake.ts');
  const key = 'allo-moto.reservation.client-draft';
  localStorage.setItem(key, '{"documentNumber":"LEGACY-PASSPORT"}');
  const draft = { ...validRequest().clientDraft, documentType: 'passport', documentNumber: 'PRIVATE-PASSPORT', permitNumber: 'PRIVATE-PERMIT', notes: 'PRIVATE-NOTE' };
  intake.saveReservationClientDraft(draft);
  assert.equal(localStorage.getItem(key), null);
  assert.ok(!sessionStorage.getItem(key).includes('PRIVATE'));
  const restored = intake.loadReservationClientDraft();
  assert.equal(restored.firstName, 'Test');
  assert.equal(restored.documentNumber, '');
  assert.equal(restored.permitNumber, '');
  assert.equal(restored.consentDataUse, false);
  const stored = JSON.parse(sessionStorage.getItem(key)); stored.expiresAt = 0;
  sessionStorage.setItem(key, JSON.stringify(stored));
  assert.equal(intake.loadReservationClientDraft(), null);
  assert.equal(sessionStorage.getItem(key), null);
});

test('unavailable or quota-full storage cannot crash the reservation flow', () => {
  global.window = { get localStorage() { throw new Error('blocked'); }, get sessionStorage() { throw new Error('quota'); } };
  const intake = loader.load('app/_features/reservation/data/reservation-intake.ts');
  assert.equal(intake.loadReservationClientDraft(), null);
  assert.doesNotThrow(() => intake.saveReservationClientDraft(validRequest().clientDraft));
  const confirmation = loader.load('app/_features/reservation/data/reservation-confirmation.ts');
  assert.doesNotThrow(() => confirmation.clearReservationConfirmationRecord());
});

test('a complete form or a cached confirmed state never becomes an acknowledged server request', () => {
  const confirmation = loader.load('app/_features/reservation/data/reservation-confirmation.ts');
  const input = { ...validRequest(), motorcycle: {}, clientValidation: { readyForReview: true }, evaluation: { available: true }, planningReservation: null, existingRecord: null };
  assert.equal(confirmation.createReservationConfirmationRecord(input).state, 'partial');
  input.existingRecord = { state: 'confirmed', reference: 'FORGED', reservationId: 'some-id' };
  assert.equal(confirmation.createReservationConfirmationRecord(input).state, 'partial');
  for (const status of ['pending_validation', 'confirmed', 'cancelled', 'rejected', 'completed']) {
    const result = confirmation.createReservationConfirmationRecord({ ...input, planningReservation: { id: 'opaque-id', reference: 'OWN-REFERENCE', reservationStatus: status } });
    assert.equal(result.state, status);
  }
  const result = confirmation.createReservationConfirmationRecord({ ...input, planningReservation: { id: 'public-id', reference: '', reservationStatus: 'confirmed' } });
  assert.equal(result.state, 'partial');
});
module.exports = { validRequest };
