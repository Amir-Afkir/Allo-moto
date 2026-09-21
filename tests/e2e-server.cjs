// A fresh production build + next start, PostgreSQL, and an HTTPS front proxy.
// All data and provider calls are disposable fixtures; never target a deployed app.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');
const { spawn, spawnSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');

const databaseUrl = process.env.E2E_DATABASE_URL;
assert.ok(databaseUrl, 'E2E_DATABASE_URL required.');
const database = new URL(databaseUrl);
assert.ok(['localhost', '127.0.0.1'].includes(database.hostname) && database.pathname.endsWith('_e2e'), 'Refusing a non-disposable database.');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'allo-moto-e2e-'));
const env = { ...process.env, NODE_ENV: 'production', DATABASE_URL: databaseUrl,
  ADMIN_USERNAME: 'quality-browser-admin', ADMIN_PASSWORD: 'Quality-browser-only-57!', ADMIN_SESSION_SECRET: randomBytes(32).toString('hex'),
  CLOUDINARY_CLOUD_NAME: 'quality-fixture', CLOUDINARY_API_KEY: 'quality-fixture-key', CLOUDINARY_API_SECRET: randomBytes(24).toString('hex'),
  CLOUDINARY_FOLDER: 'allo-moto/fleet', E2E_IMAGE_DIR: directory,
  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: '', NEXT_TELEMETRY_DISABLED: '1' };
const next = require.resolve('next/dist/bin/next');
let server, proxy, closing = false;
function stop() {
  if (closing) return; closing = true;
  proxy?.close(); server?.kill('SIGTERM');
  setTimeout(() => { server?.kill('SIGKILL'); fs.rmSync(directory, { force: true, recursive: true }); process.exit(); }, 1200);
}
process.on('SIGTERM', stop); process.on('SIGINT', stop);
async function main() {
  const certificate = spawnSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', path.join(directory, 'key.pem'), '-out', path.join(directory, 'cert.pem'), '-days', '1', '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1'], { stdio: 'pipe', timeout: 20000 });
  assert.equal(certificate.status, 0, 'Could not generate test TLS certificate.');
  // Do not reuse the smoke test's statically rendered seed-fixture build.
  const build = spawnSync(process.execPath, [next, 'build', '--turbopack'], { env, stdio: 'inherit', timeout: 180000 });
  if (build.error) throw build.error;
  assert.equal(build.status, 0, 'Production E2E build failed.');
  server = spawn(process.execPath, ['--require', path.join(__dirname, 'e2e-cloudinary-fixture.cjs'), next, 'start', '--hostname', '127.0.0.1', '--port', '3101'], { env, stdio: 'inherit' });
  server.on('error', (error) => { console.error(error); stop(); });
  server.on('exit', (code) => { if (!closing) { console.error(`Production E2E server exited: ${code}`); stop(); } });
  proxy = https.createServer({ key: fs.readFileSync(path.join(directory, 'key.pem')), cert: fs.readFileSync(path.join(directory, 'cert.pem')) }, (req, res) => {
    const upstream = http.request({ hostname: '127.0.0.1', port: 3101, path: req.url, method: req.method,
      headers: { ...req.headers, host: 'localhost:3100', 'x-forwarded-host': 'localhost:3100', 'x-forwarded-proto': 'https' } }, (response) => {
      res.writeHead(response.statusCode, response.headers); response.pipe(res);
    });
    upstream.on('error', () => { if (!res.headersSent) res.writeHead(503); res.end('E2E server starting'); });
    req.pipe(upstream);
  });
  proxy.listen(3100, 'localhost');
}
main().catch((error) => { console.error(error); process.exitCode = 1; fs.rmSync(directory, { force: true, recursive: true }); process.exit(1); });
