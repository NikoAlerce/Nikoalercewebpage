// Device / input detection.
//
// The decisive question across the site is "does this device use TOUCH?" — that's what
// determines whether to show on-screen joystick controls (gallery) or the desktop
// pointer-lock/hover flow, and the mobile layout in general.
//
// Width alone is the wrong signal: tablets are ≥768px, and on iPadOS 13+ Safari reports a
// desktop "Macintosh" user-agent — so a width/UA check treats every tablet as desktop and
// the touch controls never kick in. We go by the actual pointer capability instead.
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  const coarsePointer =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  return (
    coarsePointer ||
    (navigator.maxTouchPoints ?? 0) > 0 ||
    "ontouchstart" in window ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
}

// "Treat as mobile" = a touch device OR a narrow viewport. Used for layout/quality decisions
// (a small touch phone and a large touch tablet both get the touch-first experience).
export function isMobileLike(): boolean {
  if (typeof window === "undefined") return false;
  return isTouchDevice() || window.innerWidth < 768;
}
