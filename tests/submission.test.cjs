const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./load-ts.cjs');
const load = () => createLoader().load('app/_features/reservation/data/reservation-submission.ts');
test('a network retry and reload reuse the key, with no personal form saved', async () => {
  const before = global.window; const storage = new Map();
  global.window = { sessionStorage: { getItem: (k) => storage.get(k) ?? null, setItem: (k,v) => storage.set(k,v) } };
  try {
    const payload = { privateName: 'PRIVATE-NAME', notes: 'PRIVATE-NOTE' };
    const first = load(); const now = 1_000_000;
    const key = await first.reservationSubmissionKey(payload, now);
    assert.equal(await first.reservationSubmissionKey(payload, now + 1), key);
    assert.equal(await load().reservationSubmissionKey(payload, now + 2), key);
    assert.ok(!JSON.stringify([...storage]).includes('PRIVATE'));
    assert.notEqual(await load().reservationSubmissionKey(payload, now + 86_400_001), key);
    assert.notEqual(await first.reservationSubmissionKey({ ...payload, notes: 'other' }, now), key);
  } finally { global.window = before; }
});
test('disabled storage still allows safe in-tab retries and different payloads get different keys', async () => {
  const before = global.window;
  global.window = { get sessionStorage() { throw new Error('denied'); } };
  try {
    const api = load();
    const [first,second] = await Promise.all([api.reservationSubmissionKey({a:1}),api.reservationSubmissionKey({a:1})]);
    assert.equal(first, second);
    assert.notEqual(await api.reservationSubmissionKey({a:2}),first);
  } finally { global.window = before; }
});
