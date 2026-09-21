const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./load-ts.cjs');
const loader = createLoader();
const time = loader.load('app/_features/reservation/data/rental-time.ts');
const reservation = loader.load('app/_features/reservation/data/reservation.ts');
const planning = loader.load('app/_features/reservation/data/reservation-planning.ts');
const bike = { slug: 'bike', category: 'roadster', status: 'available', bookingStatus: 'active' };
const draft = { motorcycleSlug: 'bike', pickupDate: '2090-06-10', returnDate: '2090-06-11', pickupMode: 'motorcycle-location', permit: 'A' };
const now = new Date('2090-06-01T00:00:00Z');
const evaluate = (overrides = {}) => reservation.evaluateReservation({ motorcycle: bike, draft, now, ...overrides });
const record = (overrides = {}) => ({ id: 'other', motorcycleSlug: 'bike', ...time.buildRentalWindow(draft), pickupMode: 'motorcycle-location', reservationStatus: 'confirmed', note: '', updatedAt: now.toISOString(), ...overrides });

test('rental hours follow Europe/Paris across both DST transitions', () => {
  assert.equal(time.rentalHourToIso('2026-03-28', 10), '2026-03-28T09:00:00.000Z');
  assert.equal(time.rentalHourToIso('2026-03-29', 10), '2026-03-29T08:00:00.000Z');
  assert.equal(time.rentalHourToIso('2026-10-24', 18), '2026-10-24T16:00:00.000Z');
  assert.equal(time.rentalHourToIso('2026-10-25', 18), '2026-10-25T17:00:00.000Z');
  assert.equal(time.rentalDurationDays('2026-03-28', '2026-03-30'), 3);
  assert.equal(time.rentalDurationDays('2026-10-24', '2026-10-26'), 3);
  assert.equal(time.rentalDurationDays('2028-02-28', '2028-03-01'), 3);
});

test('dates, display, duration and opening hours are identical in different host timezones', () => {
  const previous = process.env.TZ;
  const outputs = [];
  try {
    for (const tz of ['UTC', 'Europe/Paris', 'America/Los_Angeles', 'Asia/Tokyo']) {
      process.env.TZ = tz;
      outputs.push(JSON.stringify({
        date: time.rentalDateKey(new Date('2026-09-21T22:30:00Z')),
        defaults: reservation.createDefaultReservationWindow(new Date('2026-09-21T22:30:00Z')),
        window: time.buildRentalWindow(draft),
        label: reservation.formatDateRange('2026-03-28', '2026-03-30'),
        duration: reservation.calculateReservationDuration('2026-03-28', '2026-03-30'),
      }));
    }
    assert.equal(new Set(outputs).size, 1);
    assert.equal(JSON.parse(outputs[0]).date, '2026-09-22');
    assert.deepEqual(JSON.parse(outputs[0]).defaults, { pickupDate: '2026-09-23', returnDate: '2026-09-25' });
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});

test('blank, malformed, impossible, inverted and past schedules return blockers without crashing', () => {
  for (const [start,end] of [['',''], ['bad','2090-06-11'], ['2090-02-30','2090-03-03'], ['2090-06-10','2090-06-09'], ['2000-01-01','2000-01-02'], ['2090-13-01','2090-13-02']]) {
    const result = evaluate({ draft: { ...draft, pickupDate: start, returnDate: end } });
    assert.equal(result.available, false, `${start}..${end}`);
    assert.ok(result.blockers.length);
  }
  assert.equal(time.parseDateKey('2027-02-29'), null);
  assert.ok(time.parseDateKey('2028-02-29'));
});

test('same-day departures close at the Paris opening time, including delivery', () => {
  const today = { ...draft, pickupDate: '2026-09-21', returnDate: '2026-09-21' };
  assert.equal(evaluate({ draft: today, now: new Date('2026-09-21T07:59:59Z') }).available, true);
  assert.equal(evaluate({ draft: today, now: new Date('2026-09-21T08:00:00Z') }).available, false);
  assert.equal(evaluate({ draft: { ...today, pickupMode: 'delivery' }, now: new Date('2026-09-21T07:00:00Z') }).available, false);
});

test('today occupied or temporarily maintained does not close a free future schedule', () => {
  const oldWindow = { startAt: '2090-06-01T08:00:00Z', endAt: '2090-06-02T16:00:00Z' };
  for (const status of ['reserved', 'maintenance']) {
    const result = evaluate({ motorcycle: { ...bike, status }, planningBlocks: [{ id: 'current', motorcycleSlug: 'bike', type: 'maintenance', reservationId: null, ...oldWindow }] });
    assert.equal(result.available, true);
  }
  for (const bookingStatus of ['maintenance', 'inactive', 'blocked']) {
    assert.equal(evaluate({ motorcycle: { ...bike, bookingStatus } }).available, false);
  }
  // A standalone legacy seed with no temporal state remains closed, never guessed open.
  assert.equal(evaluate({ motorcycle: { ...bike, bookingStatus: undefined, status: 'reserved' } }).available, false);
});

test('confirmed overlaps block, terminal and pending records do not, and ignore-self works', () => {
  for (const reservationStatus of ['confirmed', 'active_rental']) {
    assert.equal(evaluate({ planningReservations: [record({ reservationStatus })] }).available, false);
  }
  for (const reservationStatus of ['pending_validation', 'completed', 'cancelled', 'rejected']) {
    assert.equal(evaluate({ planningReservations: [record({ reservationStatus })] }).available, true);
  }
  assert.equal(evaluate({ planningReservations: [record()], ignoreReservationId: 'other' }).available, true);
  assert.equal(evaluate({ planningReservations: [record({ motorcycleSlug: 'different-bike' })] }).available, true);
});

test('maintenance/manual blocks respect exact intervals, including end-exclusive buffer boundaries', () => {
  const start = Date.parse(time.buildRentalWindow(draft).pickupAt) - 60 * 60 * 1000;
  const block = { id: 'block', motorcycleSlug: 'bike', type: 'manual_block', reservationId: null, startAt: new Date(start - 1000).toISOString(), endAt: new Date(start).toISOString() };
  assert.equal(evaluate({ planningBlocks: [block] }).available, true);
  assert.equal(evaluate({ planningBlocks: [{ ...block, endAt: new Date(start + 1).toISOString() }] }).available, false);
  assert.equal(evaluate({ planningBlocks: [{ ...block, endAt: new Date(start + 1).toISOString() }], ignoreReservationId: null }).available, false, 'null does not discard public/manual blocks');
  const reservationEnd = start - 90 * 60 * 1000;
  const previous = record({ pickupAt: new Date(reservationEnd - 3_600_000).toISOString(), returnAt: new Date(reservationEnd).toISOString() });
  assert.equal(evaluate({ planningReservations: [previous] }).available, true);
  assert.equal(evaluate({ planningReservations: [{ ...previous, returnAt: new Date(reservationEnd + 1).toISOString() }] }).available, false);
});

test('operator capacities enforce pickup, return and delivery independently across bikes', () => {
  const records = Array.from({ length: 4 }, (_, i) => record({ id: String(i), motorcycleSlug: `bike-${i}` }));
  const fullPickup = evaluate({ planningReservations: records });
  assert.equal(fullPickup.operationalUsage.pickupUsed, 4);
  assert.equal(fullPickup.operationalUsage.pickupBlocked, true);
  assert.equal(fullPickup.operationalUsage.returnBlocked, false);
  assert.equal(evaluate({ planningReservations: records.slice(1) }).available, true);
  const deliveryRecords = records.slice(0, 2).map((r) => ({ ...r, pickupMode: 'delivery' }));
  const fullDelivery = evaluate({ draft: { ...draft, pickupMode: 'delivery' }, planningReservations: deliveryRecords });
  assert.equal(fullDelivery.operationalUsage.deliveryBlocked, true);
  assert.equal(fullDelivery.operationalUsage.pickupBlocked, false);
  assert.equal(evaluate({ planningReservations: [...records, record({ motorcycleSlug: 'fifth' })] }).operationalUsage.returnBlocked, true);
});

test('confirmation of an old request evaluates its stored instants without rewriting them', () => {
  const storedWindow = { pickupAt: '2090-06-10T10:00:00.000Z', returnAt: '2090-06-11T18:00:00.000Z' };
  const block = { id: 'late', motorcycleSlug: 'bike', type: 'maintenance', reservationId: null, startAt: '2090-06-11T18:15:00Z', endAt: '2090-06-11T20:00:00Z' };
  assert.equal(evaluate({ planningBlocks: [block] }).available, true);
  assert.equal(evaluate({ planningBlocks: [block], storedWindow }).available, false);
  assert.equal(storedWindow.pickupAt, '2090-06-10T10:00:00.000Z');
});

test('public projection hydration and server evaluation agree for the same occupancy', () => {
  const hydrate = loader.load('app/_features/reservation/data/public-planning.ts');
  const publicRecord = { id: 'public-id', motorcycleSlug: 'bike', ...time.buildRentalWindow(draft), pickupMode: 'motorcycle-location', reservationStatus: 'confirmed' };
  const publicEvaluation = evaluate({ planningReservations: [hydrate.hydratePublicReservation(publicRecord)] });
  const serverEvaluation = evaluate({ planningReservations: [record()] });
  assert.equal(publicEvaluation.available, serverEvaluation.available);
  assert.equal(publicEvaluation.durationDays, serverEvaluation.durationDays);
});

// Reference check: both entry points use the same service window and buffer policy.
test('planning exports the real buffer window used by admin maintenance checks', () => {
  const window = planning.getBufferedRecordWindow(record(), bike);
  assert.equal(Date.parse(record().pickupAt) - Date.parse(window.startAt), 60 * 60 * 1000);
  assert.equal(Date.parse(window.endAt) - Date.parse(record().returnAt), 90 * 60 * 1000);
});


test('new admin-created motorcycles have public detail content without a hardcoded slug', () => {
  const details = loader.load('app/_features/catalog/data/motorcycle-details.ts');
  const newBike = {...bike, slug:'new-bike',brand:'Test',name:'Custom model',description:'New description',editorialNote:'New note',locationLabel:'Test location',licenseCategory:'A',priceFrom:{amount:80,currency:'EUR'},visualTone:'sand'};
  const content = details.getMotorcycleDetailContent(newBike.slug,newBike);
  assert.equal(content.summary,newBike.description);
  assert.equal(content.galleryPanels.length,3);
  assert.equal(details.getMotorcycleDetailContent('deleted-bike'),null);
});
