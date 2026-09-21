import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchStats, isStatsRange } from '../src/lib/goatcounter.ts';

test('stats reject invalid ranges, coalesce simultaneous loads and recover after failure', async (t) => {
  let calls = 0;
  const transport = t.mock.method(globalThis, 'fetch', async (_url, init) => {
    calls++; assert.ok(init.signal instanceof AbortSignal);
    return Response.json({ total: 42, hits: [], stats: [] });
  });
  assert.equal(isStatsRange('year'), false);
  await assert.rejects(fetchStats('year'), /invalid/);
  assert.equal(calls, 0);
  const results = await Promise.all(Array.from({ length: 8 }, () => fetchStats('7d')));
  assert.equal(calls, 6);
  assert.ok(results.every(r => r.total === 42));
  await fetchStats('7d'); assert.equal(calls, 6);
  transport.mock.mockImplementation(async () => { throw Error('offline'); });
  await assert.rejects(fetchStats('30d'), /offline/);
  transport.mock.mockImplementation(async () => Response.json({ total: 43 }));
  assert.equal((await fetchStats('30d')).total, 43);
});
