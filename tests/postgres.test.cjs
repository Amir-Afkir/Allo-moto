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
    const input = { expectedPricing: { dailyPrice: 50, depositAmount: 500, currency: "EUR" }, draft: { motorcycleSlug: 'pg-test-bike', pickupDate: '2090-06-01', returnDate: '2090-06-02', pickupMode: 'motorcycle-location', permit: 'A' }, clientDraft: { firstName: 'Test', lastName: 'Client', email: 'test@example.invalid', phone: '+33000000000', preferredContact: 'email', permitType: 'A', consentDataUse: true } };
    const [one, two] = await Promise.all([store.createReservationRequest(input), store.createReservationRequest(input)]);
    const outcomes = await Promise.allSettled([one, two].map((record) => store.updateReservationStatus({ reservationId: record.reservation.id, nextStatus: 'confirmed' })));
    assert.equal(outcomes.filter((result) => result.status === 'fulfilled').length, 1);
    const rows = await store.listAdminReservations(); assert.equal(rows.length, 2);
    const winner = rows.find(({ reservation }) => reservation.status === 'confirmed').reservation;
    await store.updateReservationStatus({ reservationId: winner.id, nextStatus: 'cancelled' });
    const saved = await store.getAdminReservationById(winner.id);
    assert.equal(saved.reservation.status, 'cancelled'); assert.equal(saved.linkedBlocks.length, 0);
    assert.equal((await store.listAdminReservations()).length, 2);
    // Two independent Node processes/pools retry one logical submission.
    const { randomUUID } = require('node:crypto');
    const { execFile } = require('node:child_process');
    const run = require('node:util').promisify(execFile);
    const repeated = { ...input, idempotencyKey: randomUUID() };
    const script = `
      const {createLoader}=require(${JSON.stringify(require.resolve('./load-ts.cjs'))});
      const loader=createLoader({postgres:(url,opts)=>require('postgres')(url,{...opts,onnotice:()=>{}})});
      const store=loader.load('app/_features/ops/data/ops-store.ts');
      (async()=>{try {
        const result=await store.createReservationRequest(${JSON.stringify(repeated)});
        console.log('REPLAY_ID:'+result.reservation.id);
      }finally{await global.__alloMotoOpsSql?.end({timeout:5});}})().catch(e=>{console.error(e);process.exitCode=1});
    `;
    const results = await Promise.all([0,1].map(() => run(process.execPath,['-e',script], {cwd:temp,env:{...process.env,NODE_PATH:path.join(require('./load-ts.cjs').root,'node_modules')},timeout:20000})));
    const ids = results.map(({stdout}) => stdout.trim().split('REPLAY_ID:').pop());
    assert.equal(ids[0],ids[1]);
    const replay = await store.createReservationRequest(repeated);
    assert.equal(replay.reservation.id, ids[0]);
    assert.equal((await store.listAdminReservations()).length,3);
    await assert.rejects(store.createReservationRequest({...repeated,clientDraft:{...input.clientDraft,firstName:'Different'}}), (e)=>e.status===409);
    const row = await global.__alloMotoOpsSql`select idempotency_key_hash, request_hash from ops_reservations where id = ${ids[0]}`;
    assert.equal(row[0].idempotency_key_hash.length,64);
    assert.equal(row[0].request_hash.length,64);

    // Optimistic revision checks must also work across independent PostgreSQL pools.
    const current = (await store.getAdminVehicleBySlug('pg-test-bike')).vehicle;
    const revision = loader.load('app/_features/ops/lib/vehicle-revision.ts').vehicleRevision(current);
    const editValues = {slug:'pg-test-bike',name:'Test bike',brand:'Test',category:'roadster',transmission:'manual',licenseCategory:'A',locationLabel:'Test',featured:true,priceFrom:50,depositAmount:500,includedMileageKmPerDay:100,primaryImage:'obsolete.webp',editorialNote:'Test',opsStatus:'active'};
    const edits = await Promise.all([1,2].map((number) => run(process.execPath, ['-e', `
      const {createLoader}=require(${JSON.stringify(require.resolve('./load-ts.cjs'))});
      const loader=createLoader({postgres:(url,opts)=>require('postgres')(url,{...opts,onnotice:()=>{}})});
      (async()=>{try{
        await loader.load('app/_features/ops/data/ops-store.ts').saveVehicle({currentSlug:'pg-test-bike', expectedRevision:${JSON.stringify(revision)}, values:{...${JSON.stringify(editValues)},brand:'Winner'+${number}},imageChange:{kind:'keep'}});
        console.log('EDIT:success');
      }catch(e){if(e.constructor.name !== 'VehicleConflictError')throw e;console.log('EDIT:conflict');}
      finally{await global.__alloMotoOpsSql?.end({timeout:5});}})().catch(e=>{console.error(e);process.exitCode=1});
    `], { cwd:temp, env:{...process.env,NODE_PATH:path.join(require('./load-ts.cjs').root,'node_modules')}, timeout:20000 })));
    assert.equal(edits.filter(({stdout}) => stdout.includes('EDIT:success')).length,1);
    assert.equal(edits.filter(({stdout}) => stdout.includes('EDIT:conflict')).length,1);
    assert.equal((await store.getAdminVehicleBySlug('pg-test-bike')).vehicle.primaryImage,'');

  } finally {
    await global.__alloMotoOpsSql?.end({ timeout: 5 });
    delete global.__alloMotoOpsSql; delete global.__alloMotoOpsDbReady;
    process.chdir(originalCwd); fs.rmSync(temp, { recursive: true, force: true });
    if (originalUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = originalUrl;
    if (originalMode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = originalMode;
  }
});
