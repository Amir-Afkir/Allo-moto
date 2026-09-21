// Loaded only by the disposable E2E server via node --require. Not an app feature,
// not bundled into production. Exercise the real upload/sign/normalize path offline.
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
if (!process.env.E2E_IMAGE_DIR || !process.env.E2E_DATABASE_URL) throw new Error('Disposable E2E environment required.');
const database = new URL(process.env.E2E_DATABASE_URL);
if (!['localhost','127.0.0.1'].includes(database.hostname) || !database.pathname.endsWith('_e2e')) throw new Error('Refusing non-test database.');
const originalFetch = global.fetch;
const assetFile = (id) => path.join(process.env.E2E_IMAGE_DIR, createHash('sha256').update(id).digest('hex') + '.webp');
global.fetch = async (input, options) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  if (url.hostname === 'api.cloudinary.com') {
    if (!url.pathname.startsWith('/v1_1/quality-fixture/image/')) throw new Error('Unexpected Cloudinary account in fixture.');
    const form = options?.body;
    if (!(form instanceof FormData)) throw new Error('Expected multipart image request.');
    const id = String(form.get('public_id'));
    const timestamp = String(form.get('timestamp'));
    const expected = createHash('sha1').update(`public_id=${id}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`).digest('hex');
    if (form.get('signature') !== expected || form.get('api_key') !== 'quality-fixture-key') throw new Error('Incorrect upload signature.');
    if (url.pathname.endsWith('/destroy')) {
      await fs.rm(assetFile(id), { force: true });
      return Response.json({ result: 'ok' });
    }
    const file = form.get('file');
    if (!(file instanceof Blob) || file.type !== 'image/webp') throw new Error('Expected normalized WebP.');
    await fs.writeFile(assetFile(id), Buffer.from(await file.arrayBuffer()));
    return Response.json({ public_id: id, secure_url: `https://res.cloudinary.com/quality-fixture/image/upload/v1/${id}.webp` });
  }
  if (url.hostname === 'res.cloudinary.com') {
    const prefix = '/quality-fixture/image/upload/v1/';
    if (!url.pathname.startsWith(prefix)) throw new Error('Unexpected image request.');
    const id = decodeURIComponent(url.pathname.slice(prefix.length).replace(/\.webp$/, ''));
    try { return new Response(await fs.readFile(assetFile(id)), { headers: { 'Content-Type': 'image/webp' } }); }
    catch { return new Response('Missing fixture image', { status: 404 }); }
  }
  return originalFetch(input, options);
};
