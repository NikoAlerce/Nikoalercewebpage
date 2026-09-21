import test from 'node:test';
import assert from 'node:assert/strict';
import { sortArtworks } from '../src/lib/gallerySort.ts';

test('all four gallery orders are deterministic, keep missing prices last, and preserve input', () => {
  const items = [
    { id: '10', date: '2025-01-01', price: null },
    { id: '3', date: '2026-01-01', price: 100 },
    { id: '2', date: '2024-01-01', price: 0 },
    { id: '4', date: 'invalid', price: 1.000001 },
  ];
  const fields = { id: i => i.id, date: i => i.date, price: i => i.price };
  const order = key => sortArtworks(items, key, fields).map(i => i.id);
  assert.deepEqual(order('newest'), ['3', '10', '2', '4']);
  assert.deepEqual(order('oldest'), ['2', '10', '3', '4']);
  assert.deepEqual(order('price-high'), ['3', '4', '2', '10']);
  assert.deepEqual(order('price-low'), ['2', '4', '3', '10']);
  assert.deepEqual(items.map(i => i.id), ['10', '3', '2', '4']);
});
