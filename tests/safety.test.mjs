import test from 'node:test';
import assert from 'node:assert/strict';
import { ipfsPath, ipfsToUrl, ipfsWithGateway, safeNat, listingPriceMutez, listingBigmapKey, lowestPriceXtz, formatXtz } from '../src/lib/objkt.ts';
import { readStored, writeStored } from '../src/lib/storage.ts';

const cid = 'Qm' + 'a'.repeat(44);
test('IPFS paths preserve directories and reject encoded traversal and unsafe protocols', () => {
  for (const prefix of ['ipfs://', 'ipfs://ipfs/', 'https://ipfs.io/ipfs/', '']) {
    assert.equal(ipfsPath(prefix + cid + '/folder/art%20one.png'), cid + '/folder/art%20one.png');
  }
  for (const path of ['../x', '%2e%2e/x', '%252e%252e/x', 'a%2fb', 'a%5cb', 'a//b']) {
    assert.equal(ipfsPath('https://ipfs.io/ipfs/' + cid + '/' + path), null, path);
  }
  for (const url of ['javascript:alert(1)', 'data:text/html,test', 'https://user:pass@example.com']) assert.equal(ipfsToUrl(url), null);
  assert.equal(ipfsWithGateway('https://example.com/art.mp4', 1), 'https://example.com/art.mp4');
  assert.ok(ipfsWithGateway('https://ipfs.io/ipfs/' + cid, 1)?.endsWith(cid));
});

test('purchase amounts require exact safe integers in native XTZ currency', () => {
  for (const value of ['', '1.5', 1.5, -1, Infinity, true, null, '9007199254740992']) assert.equal(safeNat(value), null);
  assert.equal(safeNat('0'), 0);
  assert.equal(listingPriceMutez({ currency_id: 1, price: '1000001' }), 1000001);
  assert.equal(listingPriceMutez({ currency_id: 1, price_xtz: 1000000 }), null);
  assert.equal(listingPriceMutez({ currency_id: 2, price: 5000000, price_xtz: 1000000 }), null);
  assert.equal(listingBigmapKey({ bigmap_key: '1.2' }), null);
  assert.equal(lowestPriceXtz({ listings_active: [{ currency_id: 2, price: 5000000, price_xtz: 1000001 }] }), 1.000001);
  assert.equal(formatXtz(0.000001), '0.000001');
});

test('unavailable browser storage does not crash preferences', () => {
  assert.equal(readStored('test'), null);
  assert.equal(readStored('test', true), null);
  assert.doesNotThrow(() => writeStored('test', 'value'));
  assert.doesNotThrow(() => writeStored('test', null, true));
});
