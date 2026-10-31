import { describe, expect, test } from "bun:test";
import { ASKED_PER_NPC, askedIds, askedKeys, markAsked, topicKey } from "./askedTopics";

const homeCold = { id: "home", label: "Where are you from?" };
const homeLit = { id: "home", label: "Missing Poland?" };
const iron = { id: "iron", label: "Bog iron?" };

describe("asked topics", () => {
  test("asked topics are remembered per person, in one flag", () => {
    const flags = new Set<string>(["fish=3"]);
    expect(markAsked(flags, "radek", iron)).toBe(true);
    expect(markAsked(flags, "radek", homeCold)).toBe(true);
    expect(markAsked(flags, "radek", iron)).toBe(false);
    expect([...flags].filter((f) => f.startsWith("asked:radek:"))).toHaveLength(1);
    expect(askedIds(flags, "radek", [homeCold, iron])).toEqual(["home", "iron"]);
    expect(askedIds(flags, "vesna", [homeCold, iron])).toEqual([]);
    expect(flags.has("fish=3")).toBe(true);
  });
  test("the same id with another label is another question", () => {
    expect(topicKey(homeCold)).not.toBe(topicKey(homeLit));
    const flags = new Set<string>();
    markAsked(flags, "radek", homeCold);
    expect(askedIds(flags, "radek", [homeLit])).toEqual([]);
  });
  test("the flag never parses as a counter and stays bounded", () => {
    const flags = new Set<string>();
    for (let i = 0; i < ASKED_PER_NPC + 10; i++) markAsked(flags, "chort", { id: `t${i}`, label: `q${i}` });
    const f = [...flags][0] ?? "";
    expect(f.includes("=")).toBe(false);
    expect(askedKeys(flags, "chort")).toHaveLength(ASKED_PER_NPC);
    expect(askedIds(flags, "chort", [{ id: "t0", label: "q0" }])).toEqual([]);
  });
  test("one npc id that prefixes another does not leak", () => {
    const flags = new Set<string>();
    markAsked(flags, "okhrim2", iron);
    expect(askedIds(flags, "okhrim", [iron])).toEqual([]);
  });
});
