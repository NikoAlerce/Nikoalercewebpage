import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeGifFrames } from '../src/lib/gifFrames.ts';

function fixture(count = 3) {
  const images = [], bitmaps = [], sizes = [];
  let closed = 0;
  const decoder = {
    tracks: { ready: Promise.resolve(), selectedTrack: { frameCount: count } },
    async decode() { const image = { displayWidth: 4096, displayHeight: 4096, duration: 80000, closed: 0, close() { this.closed++; } }; images.push(image); return { image }; },
    close() { closed++; },
  };
  return { decoder, images, bitmaps, sizes, get closed() { return closed; },
    bitmap(_image, options) { sizes.push(options); const bitmap = { closed: 0, close() { this.closed++; } }; bitmaps.push(bitmap); return bitmap; } };
}

test('GIF decoding bounds memory and transfers only bitmaps to caller', async (t) => {
  const f = fixture(100);
  t.mock.method(globalThis, 'createImageBitmap', f.bitmap, { getter: false });
  const frames = await decodeGifFrames(f.decoder, new AbortController().signal);
  assert.equal(frames.length, 100);
  assert.ok(f.sizes.reduce((sum, s) => sum + s.resizeWidth * s.resizeHeight * 4, 0) <= 16 * 1024 * 1024);
  assert.ok(f.images.every(i => i.closed === 1));
  assert.ok(f.bitmaps.every(i => i.closed === 0));
  assert.equal(f.closed, 1);
});

test('GIF decode failure releases earlier bitmaps and every decoded frame', async (t) => {
  const f = fixture();
  t.mock.method(globalThis, 'createImageBitmap', (...args) => { if (f.bitmaps.length === 1) throw Error('decode failed'); return f.bitmap(...args); });
  await assert.rejects(decodeGifFrames(f.decoder, new AbortController().signal), /decode failed/);
  assert.ok(f.images.every(i => i.closed === 1));
  assert.equal(f.bitmaps[0].closed, 1);
  assert.equal(f.closed, 1);
});

test('cancelling while a frame decodes closes it without creating a bitmap', async (t) => {
  const f = fixture(); const controller = new AbortController();
  const decode = f.decoder.decode;
  f.decoder.decode = async () => { const result = await decode(); controller.abort(); return result; };
  t.mock.method(globalThis, 'createImageBitmap', f.bitmap);
  await assert.rejects(decodeGifFrames(f.decoder, controller.signal), /Aborted/);
  assert.equal(f.images[0].closed, 1);
  assert.equal(f.bitmaps.length, 0);
  assert.equal(f.closed, 1);
});

// Node has no browser bitmap decoder; provide a replaceable test seam.
globalThis.createImageBitmap ??= () => { throw Error('unexpected decode'); };
