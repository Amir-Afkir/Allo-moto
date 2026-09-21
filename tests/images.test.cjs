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
