import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchTokensByCreator, fetchTokensByIds, resolveAliasToWallet } from '../src/lib/objkt.ts';

test('Objkt failures remain failures and a later retry can recover', async (t) => {
  const wallet = 'tz1WNzaqX3KWbBbGtDJRR4Z7ZcVQRpKqcizb';
  t.mock.method(console, 'error', () => {});
  const transport = t.mock.method(globalThis, 'fetch', async (_input, init) => {
    assert.ok(init.signal instanceof AbortSignal, 'upstream requests need a timeout');
    throw new Error('upstream unavailable');
  });

  await assert.rejects(fetchTokensByCreator(wallet), /temporarily unavailable/);
  await assert.rejects(fetchTokensByIds([{ contract: 'KT1G1wt3PFhfLf6UW6bJGsuNuhgnNWKSh7sW', id: '353' }]), /temporarily unavailable/);
  await assert.rejects(resolveAliasToWallet('retry-test-artist'), /temporarily unavailable/);

  transport.mock.mockImplementation(async () => Response.json({ data: { holder: [{ address: wallet }], token: [] } }));
  assert.equal(await resolveAliasToWallet('retry-test-artist'), wallet, 'a failed lookup must not poison future retries');
  assert.deepEqual(await fetchTokensByCreator(wallet), [], 'an actual empty collection is valid');
});
