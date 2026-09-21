const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./load-ts.cjs');

const good = { name:'Road', brand:'Quality', category:'roadster', transmission:'manual', licenseCategory:'A', locationLabel:'Orléans', featured:false, priceFrom:50, depositAmount:500, includedMileageKmPerDay:100, editorialNote:'', primaryImage:'', opsStatus:'active' };
function form(values = good) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) if (typeof value !== 'boolean') data.set(key, String(value));
  data.set('primaryImageState','keep');
  return data;
}

test('vehicle validation rejects unknown enums, blanks, oversized strings and unsafe integer prices', () => {
  const { validateVehicleValues, parseVehicleForm } = createLoader().load('app/_features/ops/lib/vehicle-validation.ts');
  assert.deepEqual(validateVehicleValues(good), good);
  for (const invalid of [
    {name:''}, {brand:'   '}, {locationLabel:''}, {category:'unknown'}, {transmission:'unknown'},
    {licenseCategory:'C'}, {opsStatus:'published'}, {priceFrom:NaN}, {priceFrom:Infinity},
    {priceFrom:-1}, {priceFrom:2.5}, {depositAmount:1e9}, {featured:'true'}, {editorialNote:'x'.repeat(501)},
  ]) assert.throws(() => validateVehicleValues({...good, ...invalid}));
  for (const bad of ['', ' ', '2.5', '-1', 'NaN', '1e3', '99999999']) {
    const data = form(); data.set('priceFrom',bad); assert.throws(() => parseVehicleForm(data));
  }
  assert.equal(parseVehicleForm(form()).priceFrom, 50);
});

test('upload policy is shared, bounded, and rejects executable or empty formats', () => {
  const { vehicleImageError, MAX_VEHICLE_IMAGE_BYTES } = createLoader().load('app/_features/ops/lib/image-policy.ts');
  for (const type of ['image/jpeg','image/png','image/webp','image/avif']) {
    assert.equal(vehicleImageError({type,size:MAX_VEHICLE_IMAGE_BYTES}), null);
  }
  for (const input of [{type:'image/svg+xml',size:10}, {type:'text/html',size:10}, {type:'image/png',size:0}, {type:'image/png',size:MAX_VEHICLE_IMAGE_BYTES + 1}]) {
    assert.equal(typeof vehicleImageError(input), 'string');
  }
});

function actions({authenticated = true, existing = null, failSave = false} = {}) {
  const calls = {uploads:[],saved:[],deleted:[]};
  const redirect = (location) => { throw Object.assign(new Error('redirect'), {location}); };
  const loader = createLoader({
    'next/navigation': {redirect},
    '@/app/_features/ops/lib/auth': {requireAdminSession: async () => { if (!authenticated) redirect('/ops/login'); }},
    '@/app/_features/ops/data/ops-store': {
      getAdminVehicleBySlug: async () => existing && {vehicle:existing},
      saveVehicle: async (input) => {calls.saved.push(input); if (failSave) throw new Error('write failed'); return {slug:'quality-road',replacedImage:existing ? {src:existing.primaryImage,publicId:existing.primaryImagePublicId}:null};},
    },
    '@/app/_features/ops/lib/image-upload': {
      uploadVehicleImage: async (input) => {calls.uploads.push(input); return {src:'new.webp',publicId:'new'};},
      deleteVehicleImageAsset: async (input) => {calls.deleted.push(input);},
    },
  });
  return { action:loader.load('app/_features/ops/actions/ops-actions.ts').saveVehicleAction, calls };
}

test('admin authorization and form validation occur before external upload or mutation', async () => {
  const unauthorized = actions({authenticated:false});
  await assert.rejects(unauthorized.action(form()), (e) => e.location === '/ops/login');
  assert.equal(unauthorized.calls.saved.length,0); assert.equal(unauthorized.calls.uploads.length,0);
  const invalid = actions(); const data = form(); data.set('brand',''); data.set('primaryImageState','replace');
  data.set('primaryImageFile',new File(['mock'],'file.png',{type:'image/png'}));
  await assert.rejects(invalid.action(data), (e) => e.location.includes('error=save'));
  assert.equal(invalid.calls.uploads.length,0); assert.equal(invalid.calls.saved.length,0);
});

test('image replacement keeps old asset until save succeeds, cleans only new asset on failure', async () => {
  for (const failSave of [false,true]) {
    const {action,calls} = actions({existing:{primaryImage:'old.webp',primaryImagePublicId:'old'}, failSave});
    const data = form(); data.set('expectedRevision', createLoader().load('app/_features/ops/lib/vehicle-revision.ts').vehicleRevision({primaryImage:'old.webp',primaryImagePublicId:'old'})); data.set('currentSlug','quality-road'); data.set('primaryImageState','replace');
    data.set('primaryImageFile',new File(['mock'],'file.png',{type:'image/png'}));
    await assert.rejects(action(data), (e) => Boolean(e.location));
    assert.equal(calls.saved[0].imageChange.asset.src,'new.webp');
    assert.deepEqual(calls.deleted, [{src:failSave ? 'new.webp':'old.webp',publicId:failSave ? 'new':'old'}]);
  }
});

test('saving a deleted vehicle cannot accidentally create a new one or upload its image', async () => {
  const {action,calls} = actions(); const data = form(); data.set('currentSlug','deleted');
  await assert.rejects(action(data), (e) => e.location.includes('error=save'));
  assert.equal(calls.saved.length,0); assert.equal(calls.uploads.length,0);
});
