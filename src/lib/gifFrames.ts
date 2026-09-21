type Decoder = {
  tracks: { ready: Promise<unknown>; selectedTrack?: { frameCount: number } };
  decode: (options: { frameIndex: number }) => Promise<{ image: VideoFrame }>;
  close: () => void;
};

export type GifFrame = { bitmap: ImageBitmap; duration: number };

/** Own every decoded resource until ownership is explicitly returned to the caller. */
export async function decodeGifFrames(decoder: Decoder, signal: AbortSignal): Promise<GifFrame[]> {
  const frames: GifFrame[] = [];
  const budget = 16 * 1024 * 1024;
  try {
    await decoder.tracks.ready;
    const count = decoder.tracks.selectedTrack?.frameCount ?? 0;
    if (count <= 1 || count > 300 || signal.aborted) return [];
    for (let i = 0; i < count; i++) {
      if (signal.aborted) throw new Error("Aborted");
      const { image } = await decoder.decode({ frameIndex: i });
      try {
        if (signal.aborted) throw new Error("Aborted");
        const w = image.displayWidth;
        const h = image.displayHeight;
        const scale = Math.min(1, 512 / Math.max(w, h), Math.sqrt(budget / (count * w * h * 4)));
        const bitmap = await createImageBitmap(image, {
          resizeWidth: Math.max(1, Math.floor(w * scale)),
          resizeHeight: Math.max(1, Math.floor(h * scale)),
        });
        frames.push({ bitmap, duration: Math.max(10, (image.duration ?? 80000) / 1000) });
      } finally { image.close(); }
    }
    if (signal.aborted) throw new Error("Aborted");
    return frames;
  } catch (error) {
    frames.forEach((frame) => frame.bitmap.close());
    throw error;
  } finally { decoder.close(); }
}
