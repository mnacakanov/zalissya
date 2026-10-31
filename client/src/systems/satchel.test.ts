import { describe, expect, test } from "bun:test";
import { carriedWeight } from "./carry";
import { satchelGroups } from "./satchel";

const set = (...f: string[]) => new Set<string>(f);

describe("satchel list", () => {
  test("an empty satchel has no rows, so nothing unmet is spoiled", () => {
    expect(satchelGroups(set())).toEqual([]);
  });
  test("rows come in four groups, in order, and only for what is in hand", () => {
    const g = satchelGroups(set("meals=2", "potions=1", "fish=3", "herbStock=2", "lysaFlower=4", "iron=1", "forged=1", "chervintsi=7"));
    expect(g.map((x) => x.id)).toEqual(["food", "gather", "iron", "purse"]);
    expect(g[0]?.rows.map((r) => r.id)).toEqual(["meals", "potions"]);
    expect(g[1]?.rows.map((r) => r.id)).toEqual(["fish", "herbStock", "lysaFlower"]);
  });
  test("food and tonics carry an action; the rest do not", () => {
    const rows = satchelGroups(set("meals=1", "potions=1", "strongPotions=1", "fish=1")).flatMap((g) => g.rows);
    expect(rows.map((r) => r.action)).toEqual(["eat", "tonic", "strong", undefined]);
  });
  test("the row weights add up to what the carry limit counts", () => {
    const flags = set("fish=2", "herbStock=3", "iron=1", "forged=2", "lysaFlower=5", "chervintsi=9", "meals=3");
    const total = satchelGroups(flags).flatMap((g) => g.rows).reduce((s, r) => s + r.weight, 0);
    expect(total).toBe(carriedWeight(flags));
  });
  test("nichnyky, chervintsi, kulish and tonics weigh nothing", () => {
    const rows = satchelGroups(set("lysaFlower=9", "chervintsi=40", "meals=2", "potions=2", "strongPotions=2")).flatMap((g) => g.rows);
    expect(rows.every((r) => r.weight === 0)).toBe(true);
  });
  test("iron already sold to Radek is not on your back", () => {
    const flags = set("iron=2", "horseshoe");
    expect(satchelGroups(flags)).toEqual([]);
    expect(carriedWeight(flags)).toBe(0);
  });
  test("a spent row leaves the list", () => {
    expect(satchelGroups(set("meals=0"))).toEqual([]);
  });
});
