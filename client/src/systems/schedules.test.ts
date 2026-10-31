import { describe, expect, test } from "bun:test";
import { houseAt } from "../data/houses";
import { RESIDENTS } from "../data/schedules";
import { okhrimLysaNight, planFor, vesnaLysaNight, walkToward, type Walker } from "./schedules";

describe("the khutir's day", () => {
  test("everyone sleeps at night, each in a bed of their own", () => {
    const beds = RESIDENTS.map((id) => planFor(id, 4 * 60, 2));
    for (const p of beds) { expect(p.pose).toBe("sleep"); expect(p.act).toBe("sleep"); }
    const where = beds.map((p) => `${p.at.x},${p.at.y}`);
    expect(new Set(where).size).toBe(beds.length);
  });
  test("those with houses sleep inside them", () => {
    expect(houseAt(planFor("myroslav", 2 * 60, 2).at.x, planFor("myroslav", 2 * 60, 2).at.y)).toBe("otaman");
    expect(houseAt(planFor("vesna", 2 * 60, 4).at.x, planFor("vesna", 2 * 60, 4).at.y)).toBe("hut1");
    expect(houseAt(planFor("odarka", 3 * 60, 2).at.x, planFor("odarka", 3 * 60, 2).at.y)).toBe("korchma");
  });
  test("the khutir gathers by the fire in the evening, after a bathe", () => {
    expect(planFor("myroslav", 20 * 60, 2).act).toBe("gather");
    expect(planFor("vesna", 18 * 60 + 30, 2).act).toBe("bathe");
    expect(planFor("vesna", 20 * 60, 2).act).toBe("gather");
    expect(planFor("radek", 19 * 60 + 20, 2).pose).toBe("bathe");
  });
  test("by day they work, and rest on a bench at noon", () => {
    expect(planFor("radek", 10 * 60, 2).act).toBe("work");
    expect(planFor("myroslav", 14 * 60, 2).pose).toBe("sit");
  });
  test("some nights, some go up Lysa Hora — and the night belongs to the evening before", () => {
    const d = [1, 2, 3, 4, 5, 6, 7].find((x) => okhrimLysaNight(x)) ?? 1;
    expect(planFor("okhrim", 23 * 60 + 30, d).act).toBe("lysa");
    expect(planFor("okhrim", 2 * 60, d + 1).act).toBe("lysa"); // the same night, past midnight
    expect(planFor("okhrim", 23 * 60 + 30, d + 1).act).not.toBe("lysa");
    const v = [1, 2, 3, 4, 5, 6, 7].find((x) => vesnaLysaNight(x)) ?? 2;
    expect(planFor("vesna", 23 * 60 + 45, v).act).toBe("lysa");
    expect(planFor("vesna", 23 * 60 + 45, v + 1).act).toBe("sleep");
  });
});

describe("walking home", () => {
  const walk = (from: { x: number; y: number }, to: { x: number; y: number }, secs = 60) => {
    const w: Walker = { ...from, moving: false, face: 1, phase: 0 };
    const trail: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < secs * 30; i++) { if (walkToward(w, to, 1 / 30)) break; trail.push({ x: w.x, y: w.y }); }
    return { w, trail };
  };
  test("the otaman walks from the fire to his bed through the door and the siny, not the wall", () => {
    const from = planFor("myroslav", 20 * 60, 2).at;
    const to = planFor("myroslav", 23 * 60, 2).at;
    const { w, trail } = walk(from, to);
    expect(Math.hypot(w.x - to.x, w.y - to.y)).toBeLessThan(2);
    // whenever he is inside the khata's walls, he came in through the door gap
    const firstInside = trail.find((p) => houseAt(p.x, p.y) === "otaman");
    expect(firstInside).toBeDefined();
    expect(Math.abs((firstInside?.x ?? 0) - (650 + 190))).toBeLessThan(24);
  });
  test("Vesna walks out of her khata in the morning", () => {
    const { w } = walk(planFor("vesna", 4 * 60, 4).at, planFor("vesna", 10 * 60, 4).at);
    expect(houseAt(w.x, w.y)).toBeNull();
  });
});

describe("a whole day on foot", () => {
  test("every resident reaches every place of their day without getting stuck", () => {
    for (const id of RESIDENTS) {
      for (const day of [1, 2, 3, 4]) {
        let at = planFor(id, 0, day).at;
        const w: Walker = { ...at, moving: false, face: 1, phase: 0 };
        for (let m = 30; m < 1440; m += 30) {
          const to = planFor(id, m, day).at;
          let ok = false;
          for (let i = 0; i < 180 * 30; i++) { if (walkToward(w, to, 1 / 30)) { ok = true; break; } }
          if (!ok) throw new Error(`${id} stuck on day ${day} at ${m}: at ${Math.round(w.x)},${Math.round(w.y)} heading ${to.x},${to.y}`);
          at = to;
        }
      }
    }
  });
});
