"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

// On-screen touch controls for the 3D gallery (mobile only). A left analog joystick feeds
// `moveRef` (x = strafe, y = forward, each -1..1); dragging the right look-pad accumulates
// into `lookRef` (consumed each frame by PlayerControls). Jump + Interact are buttons.
// All inputs are written to refs so the r3f render loop reads them without React re-renders.
type Vec = { x: number; y: number };
type Look = { dx: number; dy: number };

type Props = {
  moveRef: React.MutableRefObject<Vec>;
  lookRef: React.MutableRefObject<Look>;
  jumpRef: React.MutableRefObject<boolean>;
  targeted: boolean;
  onInteract: () => void;
};

const JOY_RADIUS = 56; // px — max thumb travel from base centre

export default function MobileControls({ moveRef, lookRef, jumpRef, targeted, onInteract }: Props) {
  const [thumb, setThumb] = useState<Vec>({ x: 0, y: 0 });
  const joyId = useRef<number | null>(null);
  const joyOrigin = useRef<Vec>({ x: 0, y: 0 });
  const lookId = useRef<number | null>(null);
  const lookLast = useRef<Vec>({ x: 0, y: 0 });

  // ── Movement joystick ──
  const onJoyDown = (e: ReactPointerEvent) => {
    if (joyId.current !== null) return;
    joyId.current = e.pointerId;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    joyOrigin.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    updateJoy(e);
  };
  const updateJoy = (e: ReactPointerEvent) => {
    let dx = e.clientX - joyOrigin.current.x;
    let dy = e.clientY - joyOrigin.current.y;
    const len = Math.hypot(dx, dy);
    if (len > JOY_RADIUS) { dx = (dx / len) * JOY_RADIUS; dy = (dy / len) * JOY_RADIUS; }
    setThumb({ x: dx, y: dy });
    // screen-up (negative dy) = forward (+y)
    moveRef.current = { x: dx / JOY_RADIUS, y: -dy / JOY_RADIUS };
  };
  const onJoyMove = (e: ReactPointerEvent) => {
    if (e.pointerId !== joyId.current) return;
    updateJoy(e);
  };
  const onJoyUp = (e: ReactPointerEvent) => {
    if (e.pointerId !== joyId.current) return;
    joyId.current = null;
    setThumb({ x: 0, y: 0 });
    moveRef.current = { x: 0, y: 0 };
  };

  // ── Look pad (drag to rotate the camera) ──
  const onLookDown = (e: ReactPointerEvent) => {
    if (lookId.current !== null) return;
    lookId.current = e.pointerId;
    lookLast.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onLookMove = (e: ReactPointerEvent) => {
    if (e.pointerId !== lookId.current) return;
    lookRef.current.dx += e.clientX - lookLast.current.x;
    lookRef.current.dy += e.clientY - lookLast.current.y;
    lookLast.current = { x: e.clientX, y: e.clientY };
  };
  const onLookUp = (e: ReactPointerEvent) => {
    if (e.pointerId !== lookId.current) return;
    lookId.current = null;
  };

  return (
    <div className="absolute inset-0 z-30 touch-none select-none pointer-events-none" style={{ touchAction: "none" }}>
      {/* Look pad — right half, below the top bar so EXIT/GFX stay tappable. */}
      <div
        className="absolute right-0 top-24 bottom-0 left-1/2 pointer-events-auto"
        onPointerDown={onLookDown}
        onPointerMove={onLookMove}
        onPointerUp={onLookUp}
        onPointerCancel={onLookUp}
      />

      {/* Movement joystick — bottom-left */}
      <div
        className="absolute bottom-8 left-6 w-32 h-32 rounded-full border border-cyan-400/40 bg-black/30 backdrop-blur-sm flex items-center justify-center pointer-events-auto"
        onPointerDown={onJoyDown}
        onPointerMove={onJoyMove}
        onPointerUp={onJoyUp}
        onPointerCancel={onJoyUp}
      >
        <div
          className="w-14 h-14 rounded-full bg-cyan-400/30 border border-cyan-400/70 shadow-[0_0_16px_rgba(0,255,240,0.4)]"
          style={{ transform: `translate(${thumb.x}px, ${thumb.y}px)` }}
        />
      </div>

      {/* Jump button — bottom-right */}
      <button
        className="absolute bottom-10 right-8 w-20 h-20 rounded-full border border-white/30 bg-black/40 backdrop-blur text-bone text-[10px] tracking-[0.3em] font-bold active:bg-white/20 pointer-events-auto"
        onPointerDown={(e) => { e.preventDefault(); jumpRef.current = true; }}
        onPointerUp={() => { jumpRef.current = false; }}
        onPointerCancel={() => { jumpRef.current = false; }}
      >
        JUMP
      </button>

      {/* Interact button — appears centred-low only when the crosshair is on an artwork */}
      {targeted && (
        <button
          className="absolute bottom-36 right-7 w-24 h-24 rounded-full border border-cyan-500/70 bg-cyan-500/20 backdrop-blur text-cyan-200 text-[11px] tracking-[0.3em] font-black active:bg-cyan-500/40 shadow-[0_0_24px_rgba(0,255,240,0.35)] animate-pulse pointer-events-auto"
          onPointerDown={(e) => { e.preventDefault(); onInteract(); }}
        >
          OPEN
        </button>
      )}
    </div>
  );
}
