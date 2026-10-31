// The save shape both targets share, and the adapter interface that hides
// where it lives (Muse server actions or the browser's localStorage).
// Game code never talks to storage directly — it goes through `save` from
// ../api, which the build wires to the right adapter.

// Every area the player can stand in. The Muse server keeps the same list
// in server/src/actions.ts (areaEnum) — widen both together. The column
// is plain text, so a new area needs no migration.
export const SAVE_AREAS = ["village", "lysa", "hut0", "hut1"] as const;
export type SaveArea = (typeof SAVE_AREAS)[number];

export type SaveData = {
  exists: boolean;
  x: number;
  y: number;
  area: SaveArea;
  // ids of characters the player has spoken with
  talked: string[];
  // lifetime herbs gathered (drives Herbalism)
  herbs: number;
  // story flags ("bread") and counters ("fish=3")
  flags: string[];
};

export type SaveInput = Omit<SaveData, "exists">;

// Mirrors the server's zod limits (server/src/actions.ts; save/limits.test.ts
// checks they match). Past a limit the two targets differ: the browser save
// drops the newest entries, while the Muse action rejects the whole save, so
// stay well under them. flags.length has a wide margin today (about 90 named
// and per-spot flags in the whole game).
export const SAVE_LIMITS = { talked: 80, flags: 250, herbs: 100000 } as const;

export interface SaveAdapter {
  load(): Promise<SaveData>;
  save(data: SaveInput): Promise<void>;
  reset(): Promise<void>;
}

export function emptySave(): SaveData {
  return { exists: false, x: 800, y: 700, area: "village", talked: [], herbs: 0, flags: [] };
}

export function isSaveArea(v: unknown): v is SaveArea {
  return typeof v === "string" && (SAVE_AREAS as readonly string[]).includes(v);
}
