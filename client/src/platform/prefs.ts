// Small per-device preferences (language, control scheme). Not game state:
// they never go into the save. Browser storage here; a native port swaps
// this file for its own settings store.

export function readPref(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writePref(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // not persisted; the default applies next time
  }
}
