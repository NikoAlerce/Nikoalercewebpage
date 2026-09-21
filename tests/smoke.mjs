import test from 'node:test';
import assert from 'node:assert/strict';

// Run against a production server started without analytics credentials.
const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
const get = (path, options) => fetch(new URL(path, base), {
  signal: AbortSignal.timeout(30000), ...options,
});

test('public pages render successfully', async () => {
  for (const path of ['/', '/music', '/shop', '/tools', '/ar-labs', '/decentraland', '/metaverse', '/support', '/art-on-tezos?tab=sidequest']) {
    const res = await get(path);
    assert.equal(res.status, 200, path);
    assert.match(await res.text(), /<html/);
  }
});

test('Spanish preference is present in server HTML and metadata uses the real domain', async () => {
  const res = await get('/shop', { headers: { cookie: 'nk_lang=es' } });
  const html = await res.text();
  assert.match(html, /<html lang="es"/);
  assert.match(html, /Consultar producto/);
  assert.doesNotMatch(html, /Agregar al carrito|Add to cart|https:\/\/nikoalerce\.art/);
  assert.match(html, /https:\/\/www\.nikoalerce\.xyz\/opengraph-image/);
  assert.match(html, /mailto:alercebolson@gmail\.com\?subject=/);
});

test('invalid gallery input is rejected before contacting Objkt', async () => {
  for (const path of ['/api/objkt', '/api/objkt?alias=nikoalerce&limit=NaN', '/api/objkt?alias=nikoalerce&limit=301', '/api/objkt?alias=nikoalerce&offset=-1', '/api/tokens?ids=invalid', '/api/tokens?ids=KT1G1wt3PFhfLf6UW6bJGsuNuhgnNWKSh7sW:abc']) {
    assert.equal((await get(path)).status, 400, path);
  }
});

test('IPFS proxy rejects traversal and arbitrary URLs', async () => {
  for (const uri of ['https://example.com/file', '../admin', 'Qm' + 'a'.repeat(44) + '/../admin', 'Qm' + 'a'.repeat(44) + '/%2e%2e/admin']) {
    assert.equal((await get('/api/ipfs?uri=' + encodeURIComponent(uri))).status, 400, uri);
  }
});

test('private analytics fails closed without a configured access key', async () => {
  const res = await get('/api/stats');
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { enabled: false });
  assert.match(res.headers.get('cache-control'), /no-store/);
});

test('thumbnail optimizer rejects arbitrary hosts and traversal', async () => {
  for (const uri of ['https://example.com/file.jpg', '../secret', 'Qm' + 'a'.repeat(44) + '/%2e%2e/secret']) {
    assert.equal((await get('/api/thumbnail?uri=' + encodeURIComponent(uri))).status, 400);
  }
});

test('Transient tab is directly addressable and linked in the gallery', async () => {
  const html = await (await get('/art-on-tezos?tab=transient')).text();
  assert.match(html, /Art on Transient/);
  assert.match(html, /https:\/\/www\.transient\.xyz\/@NikoAlerce/);
});
