import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SAVE_AREAS, SAVE_LIMITS } from "./types";

// The Muse server validates saves with its own zod literals, and the browser
// adapter slices to SAVE_LIMITS. If one side is widened alone, saves that one
// target accepts are rejected by the other. The server file imports the Muse
// SDK, so it is read as text here instead of imported.
const server = readFileSync(join(import.meta.dir, "../../../server/src/actions.ts"), "utf8");

describe("save limits match the server", () => {
  test("array and number limits", () => {
    const max = (field: string) => Number(new RegExp(`${field}:[^\\n]*\\.max\\((\\d+)\\)`).exec(server)?.[1]);
    expect(max("talked")).toBe(SAVE_LIMITS.talked);
    expect(max("flags")).toBe(SAVE_LIMITS.flags);
    expect(max("herbs")).toBe(SAVE_LIMITS.herbs);
  });
  test("area list", () => {
    const list = /areaEnum = z\.enum\(\[([^\]]*)\]\)/.exec(server)?.[1] ?? "";
    const areas = [...list.matchAll(/"([a-z0-9]+)"/g)].map((m) => m[1]);
    expect(areas).toEqual([...SAVE_AREAS]);
  });
});
