const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const sharp = require('sharp');

// Exercise the native library that Next resolves, not a mocked implementation.
test('Next image optimizer resolves the patched Sharp instance', () => {
  const nextRequire = createRequire(require.resolve('next/package.json'));
  assert.equal(nextRequire.resolve('sharp'), require.resolve('sharp'));
  assert.equal(sharp.versions.sharp, '0.35.4');
});

for (const format of ['avif', 'webp']) {
  test(`patched Sharp encodes, decodes and resizes ${format}`, async () => {
    const image = await sharp({ create: { width: 32, height: 24, channels: 3, background: '#456789' } })
      .toFormat(format).toBuffer();
    const result = await sharp(image).resize(16, 12).png().toBuffer({ resolveWithObject: true });
    assert.equal(result.info.width, 16);
    assert.equal(result.info.height, 12);
    assert.equal(result.info.format, 'png');
    assert.ok(result.data.length > 0);
  });
}

const { createLoader } = require('./load-ts.cjs');
const imageModule = () => createLoader().load('app/_features/ops/lib/image-upload.ts');

test('upload decodes real bytes, ignores dangerous filenames, strips EXIF and always outputs bounded WebP', async () => {
  const input = await sharp({create:{width:2500,height:32,channels:3,background:'#678'}})
    .withMetadata({orientation:6}).jpeg().toBuffer();
  const result = await imageModule().normalizeVehicleImage(new File([input],'payload.html',{type:'image/jpeg'}));
  assert.equal(result.name,'vehicle.webp'); assert.equal(result.type,'image/webp');
  const metadata = await sharp(Buffer.from(await result.arrayBuffer())).metadata();
  assert.equal(metadata.format,'webp'); assert.ok(metadata.width <= 2400 && metadata.height <= 2400);
  assert.equal(metadata.exif,undefined); assert.equal(metadata.orientation,undefined);
});

test('upload rejects forged MIME/SVG, unreadable bytes and oversized pixel dimensions', async () => {
  const { normalizeVehicleImage } = imageModule();
  for (const data of [Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>'), Buffer.from('not an image')]) {
    await assert.rejects(normalizeVehicleImage(new File([data],'photo.png',{type:'image/png'})));
  }
  const huge = await sharp({create:{width:7000,height:6000,channels:3,background:'#678'}}).png().toBuffer();
  await assert.rejects(normalizeVehicleImage(new File([huge],'large.png',{type:'image/png'})));
});

// Two actual WebP frames, not a MIME-only animation stub.
test('upload rejects an animated WebP before persistence', async () => {
  const { createLoader } = require('./load-ts.cjs');
  const { normalizeVehicleImage } = createLoader().load('app/_features/ops/lib/image-upload.ts');
  const bytes = Buffer.from('UklGRpQAAABXRUJQVlA4WAoAAAACAAAABwAABwAAQU5JTQYAAAAAAAAAAABBTk1GMAAAAAAAAAAAAAcAAAcAAMgAAAJWUDggGAAAADABAJ0BKggACAABQCYlpAADcAD+/TZoAEFOTUYwAAAAAAAAAAAABwAABwAAyAAAAFZQOCAYAAAANAEAnQEqCAAIAAAAJiWkAANwAP789AAA', 'base64');
  assert.equal((await sharp(bytes).metadata()).pages, 2);
  await assert.rejects(normalizeVehicleImage(new File([bytes], 'animated.webp', { type: 'image/webp' })));
});
