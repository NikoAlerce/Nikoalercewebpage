// Tiny external store tracking how many title characters are currently on-screen.
//
// The shared <CharacterStage> WebGL canvas renders continuously ("always"). When you're
// reading a text section — or watching the showreel video — no character is visible, yet the
// canvas kept clearing/rendering every frame and holding the GPU, competing with the video
// decode (jank on modest GPUs). CharacterStage subscribes here and switches its render loop
// to "never" whenever the count is 0, freeing the GPU; each TitleCharacter reports its own
// on-screen state via an IntersectionObserver.

let count = 0;
const subscribers = new Set<() => void>();

function emit() {
  for (const fn of subscribers) fn();
}

/** A character entered/left the viewport. Idempotent-safe via the caller's own latch. */
export function setCharacterVisible(visible: boolean) {
  count = Math.max(0, count + (visible ? 1 : -1));
  emit();
}

export function subscribeCharacterVisibility(fn: () => void) {
  subscribers.add(fn);
  return () => { subscribers.delete(fn); };
}

/** Snapshot for useSyncExternalStore — true while at least one character is on-screen. */
export function anyCharacterVisible() {
  return count > 0;
}
