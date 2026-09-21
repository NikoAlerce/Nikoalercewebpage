// Build faithful, lightweight looping previews from Transient's animated images.
// Run with the local site running: node scripts/optimize-transient-previews.mjs
// Requires ffmpeg on PATH. Downloads and decoded frames are never committed.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import sharp from 'sharp';

const outputDir = path.resolve('public/transient-previews');
const scratchDir = path.resolve('scratch/transient-previews');
const manifestPath = path.resolve('src/lib/transientPreviewManifest.json');
await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(scratchDir, { recursive: true });
const response = await fetch('http://127.0.0.1:3000/api/transient');
if (!response.ok) throw Error('Start the local site before generating previews.');
const { artworks } = await response.json();
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8').catch(() => '{}'));
const gcd = (a, b) => b ? gcd(b, a % b) : a;

for (const artwork of artworks) {
  if (!artwork.image || manifest[artwork.image]) continue;
  const id = createHash('sha256').update(artwork.image).digest('hex').slice(0, 24);
  const params = new URLSearchParams({ url: artwork.image, w: '384', output: 'webp', n: '-1', we: '' });
  params.sort();
  const inputPath = path.join(scratchDir, `${id}.webp`);
  let input = await fs.readFile(inputPath).catch(() => null);
  if (!input) {
    const result = await fetch(`https://img.transient.xyz/?${params}`, { signal: AbortSignal.timeout(90000) });
    if (!result.ok) throw Error(`${artwork.name}: image ${result.status}`);
    input = Buffer.from(await result.arrayBuffer());
    await fs.writeFile(inputPath, input);
  }
  const metadata = await sharp(input, { animated: true, limitInputPixels: 80_000_000 }).metadata();
  const pages = metadata.pages ?? 1;
  const posterPath = path.join(outputDir, `${id}.webp`);
  await sharp(input).resize({ width: 384, withoutEnlargement: true }).webp({ quality: 82 }).toFile(posterPath);
  const { data, info } = await sharp(input, { animated: true, limitInputPixels: 80_000_000 })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const width = info.width, height = info.height / pages;
  if (!Number.isInteger(height)) throw Error('Invalid animation dimensions');
  const delays = Array.from({ length: pages }, (_, i) => Math.max(10, metadata.delay?.[i] ?? 80));
  const tick = delays.reduce(gcd);
  const stride = width * height * 4;
  const videoPath = path.join(outputDir, `${id}.mp4`);
  const ffmpeg = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pixel_format', 'rgba',
    '-video_size', `${width}x${height}`, '-framerate', `1000/${tick}`, '-i', 'pipe:0', '-an',
    '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-crf', '22', '-preset', 'slow', '-movflags', '+faststart', videoPath],
  { windowsHide: true, stdio: ['pipe', 'ignore', 'pipe'] });
  let errors = '';
  ffmpeg.stderr.on('data', (chunk) => { errors += chunk; });
  const finished = new Promise((resolve, reject) => {
    ffmpeg.on('error', reject);
    ffmpeg.on('exit', (code) => code === 0 ? resolve() : reject(Error(errors)));
  });
  function* frames() {
    for (let i = 0; i < pages; i++) {
      // Preserve every source frame and its duration, including variable delays.
      for (let repeat = 0; repeat < delays[i] / tick; repeat++) yield data.subarray(i * stride, (i + 1) * stride);
    }
  }
  await Promise.all([pipeline(Readable.from(frames()), ffmpeg.stdin), finished]);
  const bytes = (await fs.stat(videoPath)).size;
  manifest[artwork.image] = { video: `/transient-previews/${id}.mp4`, poster: `/transient-previews/${id}.webp`,
    width, height, frames: pages, durationMs: delays.reduce((sum, value) => sum + value, 0), bytes };
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`${artwork.name}: ${width}×${height}, ${pages} frames, ${bytes} bytes`);
}
