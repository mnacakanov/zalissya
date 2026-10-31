import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import en from "../content/locales/en.json";

// t() takes a TextKey, but static key lists (dialogue/helpers.ts `L`, topic
// bases) and template keys are cast to it with `as TextKey`, which switches
// the compiler's check off. A mistyped key then shows up in the game as raw
// text such as "korchma.odarka.hello". This test is the check the cast
// removed: every key written in code must exist, and every key in the locale
// must be reachable from code.

const SRC = join(import.meta.dir, "..");
const KEYS = new Set(Object.keys(en));

function sourceFiles(dir: string): string[] {
  return (readdirSync(dir, { recursive: true }) as string[])
    .filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.ts$/.test(f))
    .map((f) => join(dir, f));
}

// Code only: whole-line and trailing // comments and block-comment lines go.
function code(file: string): string {
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((l) => !/^\s*(\*|\/\*|\/\/)/.test(l))
    .map((l) => l.replace(/(^|\s)\/\/.*$/, ""))
    .join("\n");
}

const text = sourceFiles(SRC).map(code).join("\n");
const ROOTS = new Set([...KEYS].map((k) => k.split(".")[0]));

// A key segment may hold a hyphen (quest.lysa-sabbath.0): leaving "-" out of
// this class once flagged thirty live keys as unused.
const LITERAL = /["`']([a-z][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_-]+)+)["`']/g;
const TEMPLATE_PREFIX = /`([a-z][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_-]+)*\.)\$\{/g;

const literals = new Set([...text.matchAll(LITERAL)].map((m) => m[1] as string).filter((k) => ROOTS.has(k.split(".")[0] as string)));
const prefixes = new Set([...text.matchAll(TEMPLATE_PREFIX)].map((m) => m[1] as string));

// A key that is only the front of longer ones is a base ("korchma.odarka.t.news"
// → .label, .question), not a missing key.
const isBase = (k: string) => [...KEYS].some((e) => e.startsWith(`${k}.`));

describe("locale keys used in code", () => {
  test("every key written in code exists", () => {
    const missing = [...literals].filter((k) => !KEYS.has(k) && !isBase(k));
    expect(missing).toEqual([]);
  });
  test("every template key family still has keys", () => {
    const empty = [...prefixes].filter((p) => ![...KEYS].some((k) => k.startsWith(p)));
    expect(empty).toEqual([]);
  });
  test("no key is dead", () => {
    const covered = (k: string) => {
      if (literals.has(k)) return true;
      if ([...prefixes].some((p) => k.startsWith(p))) return true;
      const parts = k.split(".");
      return parts.some((_, i) => i > 0 && literals.has(parts.slice(0, i).join(".")));
    };
    expect([...KEYS].filter((k) => !covered(k))).toEqual([]);
  });
});
