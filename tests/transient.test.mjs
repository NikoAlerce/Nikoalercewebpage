import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchTransientArtworks, normalizeTransientArtwork } from '../src/lib/transient.ts';

const raw = { id: 1, name: 'Memory Lane', is_valid: true,
  uri: '/nfts/base/0x26ce35bef2562d9bdde62523d27248d9e3de0e17/1',
  image_uri: 'https://ipfs.transientusercontent.xyz/ipfs/test/thumbnail',
  nft_contract: { user: { id: 13262 }, address: { chain: '8453' } } };

test('Transient includes only the artist and safe public links', () => {
  assert.equal(normalizeTransientArtwork(raw).chain, 'Base');
  assert.equal(normalizeTransientArtwork({ ...raw, uri: '//evil.test/' }), null);
  assert.equal(normalizeTransientArtwork({ ...raw, nft_contract: { user: { id: 2 } } }), null);
  assert.equal(normalizeTransientArtwork({ ...raw, image_uri: 'javascript:alert(1)' }).image, null);
});

test('Transient pagination combines all pages and propagates failures', async (t) => {
  const transport = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.ok(options.signal instanceof AbortSignal);
    assert.equal(new URL(url).searchParams.get('user_id'), '13262');
    const offset = Number(new URL(url).searchParams.get('offset'));
    return Response.json({ count: 101, results: offset === 0 ? Array.from({ length: 100 }, (_, id) => ({ ...raw, id })) : [{ ...raw, id: 100 }] });
  });
  assert.equal((await fetchTransientArtworks()).length, 101);
  assert.equal(transport.mock.calls.length, 2);
  transport.mock.mockImplementation(async () => new Response('', { status: 503 }));
  await assert.rejects(fetchTransientArtworks(), /unavailable/);
});
