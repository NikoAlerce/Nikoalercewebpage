"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Sitewide ambient track (public/audio.mp3). Loops quietly while you browse.
// Browsers block autoplay-with-sound until a user gesture, so if the initial play()
// is rejected we retry on the first interaction anywhere on the page.
const STORAGE_KEY = "nikoalerce:music";

export default function BackgroundMusic() {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // User intent — should the track play at all (persisted across visits). Default on.
  const [enabled, setEnabled] = useState(true);
  // Hydration guard: render nothing on the server pass so the button can't mismatch.
  const [ready, setReady] = useState(false);

  // The 3D gallery (/metaverse) has its own sound design + video audio — silence the
  // ambient track there so they don't clash, and hide the toggle (its HUD owns the corners).
  const inGallery = pathname === "/metaverse";

  // Load saved preference once.
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved === "off") setEnabled(false);
    setReady(true);
  }, []);

  // Create the <audio> element once and keep it for the lifetime of the app shell.
  useEffect(() => {
    const a = new Audio("/audio.mp3");
    a.loop = true;
    a.volume = 0.4;
    a.preload = "auto";
    audioRef.current = a;
    return () => {
      a.pause();
      audioRef.current = null;
    };
  }, []);

  // Drive playback from (enabled && !inGallery).
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!(enabled && !inGallery)) {
      a.pause();
      return;
    }

    let cancelled = false;
    const onGesture = () => {
      a.play().catch(() => {});
    };
    const cleanup = () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      window.removeEventListener("touchstart", onGesture);
    };

    a.play()
      .then(() => cleanup())
      .catch(() => {
        if (cancelled) return;
        // Autoplay blocked — arm a one-shot retry on the next user interaction.
        window.addEventListener("pointerdown", onGesture, { once: true });
        window.addEventListener("keydown", onGesture, { once: true });
        window.addEventListener("touchstart", onGesture, { once: true });
      });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [enabled, inGallery]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    // This click is itself a user gesture, so play() will be allowed.
    const a = audioRef.current;
    if (!a) return;
    if (next && !inGallery) a.play().catch(() => {});
    else a.pause();
  };

  if (!ready || inGallery) return null;

  return (
    <button
      onClick={toggle}
      aria-label={enabled ? "Mute music" : "Play music"}
      title={enabled ? "Mute music" : "Play music"}
      className="fixed bottom-4 right-4 z-[55] w-11 h-11 grid place-items-center rounded-full border border-white/15 bg-void/70 backdrop-blur-md text-bone/80 hover:text-accent hover:border-accent transition-colors"
    >
      {enabled ? (
        // Speaker with sound waves
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" stroke="none" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
      ) : (
        // Muted speaker
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" stroke="none" />
          <path d="m16 9 5 6" />
          <path d="m21 9-5 6" />
        </svg>
      )}
    </button>
  );
}
