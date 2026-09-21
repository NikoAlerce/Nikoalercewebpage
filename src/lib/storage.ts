/** Privacy modes and embedded browsers may deny storage access. */
export function readStored(key: string, session = false): string | null {
  try { return (session ? sessionStorage : localStorage).getItem(key); }
  catch { return null; }
}

export function writeStored(key: string, value: string | null, session = false): void {
  try {
    const storage = session ? sessionStorage : localStorage;
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, value);
  } catch { /* Preferences are optional; the page must remain usable. */ }
}
