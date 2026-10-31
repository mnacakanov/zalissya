import { describe, expect, test } from "bun:test";
import { makeCritters, stepCritter } from "./critters";

function rng(seed = 1) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}
const run = (secs: number, player: { x: number; y: number }, night = false) => {
  const cs = makeCritters();
  const rnd = rng();
  for (let i = 0; i < secs * 30; i++) for (const c of cs) stepCritter(c, 1 / 30, { player, night, rnd });
  return cs;
};

describe("the khutir's animals", () => {
  test("geese, the cow and the horse keep to their home ground", () => {
    const cs = run(120, { x: -999, y: -999 });
    for (const c of cs.filter((k) => k.kind !== "dog")) {
      expect(Math.hypot(c.x - c.home.x, c.y - c.home.y)).toBeLessThanOrEqual(c.home.r * 1.2 + 0.01);
    }
  });
  test("the dog comes to the kobzar when he is near its yard", () => {
    const player = { x: 1000, y: 420 };
    const dog = run(6, player).find((c) => c.kind === "dog");
    expect(dog).toBeDefined();
    expect(Math.hypot((dog?.x ?? 0) - player.x, (dog?.y ?? 0) - player.y)).toBeLessThan(45);
  });
  test("the dog stays home when the kobzar is far, and sleeps at night", () => {
    const far = run(20, { x: 200, y: 1500 }).find((c) => c.kind === "dog");
    expect(Math.hypot((far?.x ?? 0) - 1060, (far?.y ?? 0) - 360)).toBeLessThan(120);
    const night = run(6, { x: 1000, y: 420 }, true).find((c) => c.kind === "dog");
    expect(night?.x).toBe(1060);
    expect(night?.sitting).toBe(true);
  });
  test("geese scatter from someone striding into the flock", () => {
    const cs = makeCritters();
    const goose = cs.find((c) => c.kind === "goose");
    if (!goose) throw new Error("no goose");
    const player = { x: goose.x - 20, y: goose.y };
    const before = goose.x;
    stepCritter(goose, 0.1, { player, night: false, rnd: rng() });
    expect(goose.x).toBeGreaterThan(before);
  });
});
