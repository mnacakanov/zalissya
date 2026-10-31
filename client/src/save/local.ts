// GitHub Pages target: one save slot in the browser's localStorage, on this
// device only. Same shape and limits as the Muse server, and the same key
// the original standalone build used, so existing browser saves carry over.

import { clamp } from "../world/geometry";
import { emptySave, isSaveArea, SAVE_LIMITS, type SaveAdapter, type SaveData } from "./types";

const KEY = "zalissya-save-v1";

function strings(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
}

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function read(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptySave();
    const v: unknown = JSON.parse(raw);
    if (typeof v !== "object" || v === null) return emptySave();
    const o = v as Record<string, unknown>;
    return {
      exists: true,
      x: num(o.x, 800),
      y: num(o.y, 700),
      area: isSaveArea(o.area) ? o.area : "village",
      talked: strings(o.talked),
      herbs: num(o.herbs, 0),
      flags: strings(o.flags),
    };
  } catch {
    return emptySave();
  }
}

export const localSave: SaveAdapter = {
  async load() {
    return read();
  },
  async save(data) {
    try {
      const out: SaveData = {
        exists: true,
        x: data.x,
        y: data.y,
        area: data.area,
        talked: data.talked.slice(0, SAVE_LIMITS.talked),
        herbs: clamp(Math.trunc(data.herbs), 0, SAVE_LIMITS.herbs),
        flags: data.flags.slice(0, SAVE_LIMITS.flags),
      };
      localStorage.setItem(KEY, JSON.stringify(out));
    } catch {
      // private mode / storage full: play on, unsaved
    }
  },
  async reset() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // nothing to clear
    }
  },
};
