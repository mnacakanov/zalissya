import { describe, expect, test } from "bun:test";
import en from "../content/locales/en.json";
import uk from "../content/locales/uk.json";
import { setLangForTests, t } from "./index";

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("locales", () => {
  test("Ukrainian has exactly the English keys", () => {
    expect(Object.keys(uk).sort()).toEqual(Object.keys(en).sort());
  });
  test("every translation keeps the same {placeholders}", () => {
    const bad = Object.entries(en).filter(([k, v]) => placeholders(v).join() !== placeholders((uk as Record<string, string>)[k] ?? "").join());
    expect(bad.map(([k]) => k)).toEqual([]);
  });
  test("no empty English strings", () => {
    expect(Object.entries(en).filter(([, v]) => v.trim() === "").map(([k]) => k)).toEqual([]);
  });
  test("t() fills placeholders in the chosen language", () => {
    setLangForTests("en");
    expect(t("ui.skills.level", { level: 3 })).toBe("Lv 3");
    setLangForTests("uk");
    expect(t("ui.skills.level", { level: 3 })).toContain("3");
  });
});
