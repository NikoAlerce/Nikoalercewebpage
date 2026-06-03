// Procedural Synthesizer using Web Audio API
// Avoids loading external asset files, zero latency, retro aesthetic.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playClickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(440, now); // A4
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.08);
}

export function playCollectSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(523.25, now); // C5
  osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
  osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
  osc.frequency.setValueAtTime(1046.5, now + 0.24); // C6

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.24);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.45);
}

export function playUnlockSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Create an epic synth sweep with two oscillators
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc1.type = "sawtooth";
  osc2.type = "square";
  
  // Slight detune for fatness
  osc1.frequency.setValueAtTime(261.63, now); // C4
  osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.8);
  
  osc2.frequency.setValueAtTime(262.63, now); // C4 detuned
  osc2.frequency.exponentialRampToValueAtTime(1048.5, now + 0.8);

  filter.type = "lowpass";
  filter.Q.setValueAtTime(8, now);
  filter.frequency.setValueAtTime(200, now);
  filter.frequency.exponentialRampToValueAtTime(4000, now + 0.6);

  gain.gain.setValueAtTime(0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.15, now + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  
  osc1.stop(now + 1.2);
  osc2.stop(now + 1.2);
}
