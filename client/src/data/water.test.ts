import { describe, expect, test } from "bun:test";
import { BOLOTO_POOLS, inBoloto } from "./land";
import { FISH_SPOT, HERB_SPOTS, IRON_SPOTS } from "./items";
import { ALL_CHARS } from "./characters";
import { inPondShape, pondEdge } from "./village";
import { PLACES } from "./schedules";

describe("the pond's wandering shore", () => {
  test("the fishing place, the bog iron and the herbs are on dry land", () => {
    for (const s of [FISH_SPOT, ...IRON_SPOTS, ...HERB_SPOTS]) expect(inPondShape(s.x, s.y, 6)).toBe(false);
  });
  test("the residents bathe in deep enough water", () => {
    for (const s of [PLACES.vesna.bathe, PLACES.radek.bathe]) expect(inPondShape(s.x, s.y, -14)).toBe(true);
  });
  test("a step in from the bank is deep water, a step out is dry", () => {
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const toward = { x: 1330 + Math.cos(a) * 400, y: 1050 + Math.sin(a) * 300 };
      const inside = pondEdge(toward.x, toward.y, -32);
      const outside = pondEdge(toward.x, toward.y, 22);
      expect(inPondShape(inside.x, inside.y, -14)).toBe(true);
      expect(inPondShape(outside.x, outside.y, 6)).toBe(false);
    }
  });
});

describe("the boloto", () => {
  test("the Bolotianyk sits in his deep pool, and can be hailed from its bank", () => {
    const b = ALL_CHARS.find((c) => c.id === "bolotianyk");
    expect(b).toBeDefined();
    if (!b) return;
    expect(inBoloto(b.x, b.y)).toBe(true);
    const pool = BOLOTO_POOLS[0];
    expect(pool).toBeDefined();
    if (!pool) return;
    // the dry bank just south of the pool is within his reach (92)
    const bank = { x: pool.x, y: pool.y + pool.ry + 14 };
    expect(inBoloto(bank.x, bank.y)).toBe(false);
    expect(Math.hypot(bank.x - b.x, bank.y - b.y)).toBeLessThan(92);
  });
});
