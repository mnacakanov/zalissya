import { describe, expect, test } from "bun:test";
import { ARRIVE, CAVE_SPOTS, CHAPEL_HATCH, ONUFRIY, OMELKO, SYDIR, TUNNEL_SPOTS, VOHNYK, ZMIY } from "../data/cave";
import { doorOf, HOUSE_RECTS, houseAt, houseSolids, type HouseId } from "../data/houses";
import { circleRectCollide, type Rect } from "../world/geometry";
import { PLAYER_R } from "../world/areas";
import { caveSolids, crackShown, firstPass, HOARD_COINS, lazAvailable, lullResult, makeCaveLife, passFlags, POUCH_COINS, startleBats, stepCaveLife, takeHoard, takePouch } from "./cave";
import { purse } from "./trade";
import { caveTopicSet } from "../dialogue/cave";

describe("the serpent", () => {
  test("only a sad song moves him; a neutral one is listened to; a happy one wakes him", () => {
    expect(lullResult("marusia")).toBe("lulled");
    expect(lullResult("polechko")).toBe("lulled");
    expect(lullResult("holota")).toBe("listens");
    expect(lullResult("dunai")).toBe("listens");
    expect(lullResult("hopak")).toBe("wakes");
    expect(lullResult("hrytsiu")).toBe("wakes");
  });
  test("his coil lies across the passage until he sleeps", () => {
    expect(caveSolids(new Set())).toHaveLength(1);
    expect(caveSolids(new Set(["zmiyLulled"]))).toHaveLength(0);
  });
});

describe("the coins", () => {
  test("the hoard is his, and only once he sleeps; then it is the kobzar's, once", () => {
    const f = new Set<string>();
    expect(takeHoard(f)).toBe(0);
    f.add("zmiyLulled");
    expect(takeHoard(f)).toBe(HOARD_COINS);
    expect(purse(f)).toBe(HOARD_COINS);
    expect(takeHoard(f)).toBe(0);
    expect(purse(f)).toBe(HOARD_COINS);
  });
  test("the sentry's pouch is three chervintsi, once, on top of what is already in the purse", () => {
    const f = new Set<string>(["chervintsi=5"]);
    expect(takePouch(f)).toBe(POUCH_COINS);
    expect(purse(f)).toBe(5 + POUCH_COINS);
    expect(takePouch(f)).toBe(0);
  });
});

describe("the tunnel's ways", () => {
  test("the crack in the cave wall is hidden until the serpent sleeps or the kobzar has been through", () => {
    expect(crackShown(new Set())).toBe(false);
    expect(lazAvailable("crack", new Set())).toBe(false);
    expect(lazAvailable("crack", new Set(["zmiyLulled"]))).toBe(true);
    expect(lazAvailable("crack", new Set(["lazOpen"]))).toBe(true);
  });
  test("the chapel hatch can only be lifted by someone who knows it is there", () => {
    expect(lazAvailable("chapelHatch", new Set())).toBe(false);
    expect(lazAvailable("chapelHatch", new Set(["lazKnown"]))).toBe(true);
  });
  test("either end of the tunnel is always a way out", () => {
    expect(lazAvailable("tunnelWest", new Set())).toBe(true);
    expect(lazAvailable("tunnelEast", new Set())).toBe(true);
  });
  test("going through teaches the way, and the first time is only once per end", () => {
    const f = new Set<string>();
    expect(firstPass("crack", f)).toBe(true);
    for (const x of passFlags("crack")) f.add(x);
    expect(firstPass("crack", f)).toBe(false);
    expect(firstPass("tunnelWest", f)).toBe(false);
    expect(firstPass("chapelHatch", f)).toBe(true);
    expect(passFlags("tunnelEast")).toContain("lazChapel");
    expect(passFlags("tunnelEast")).toContain("lazKnown");
  });
});

describe("the cave's creatures", () => {
  const run = (life: ReturnType<typeof makeCaveLife>, secs: number, player: { x: number; y: number }, from = 0) => {
    for (let i = 0; i < secs * 30; i++) stepCaveLife(life, 1 / 30, from + i * (1000 / 30), player);
  };
  const far = { x: -9999, y: -9999 };
  test("bats hang quietly while nobody is near", () => {
    const life = makeCaveLife();
    run(life, 10, far);
    expect(life.bats.every((b) => b.hang)).toBe(true);
  });
  test("come near and the flock goes up, then settles again", () => {
    const life = makeCaveLife();
    const roost = life.bats[0];
    if (!roost) throw new Error("no bats");
    stepCaveLife(life, 1 / 30, 1000, { x: roost.hx, y: roost.hy + 60 });
    expect(life.bats.every((b) => !b.hang)).toBe(true);
    run(life, 14, far, 1000);
    expect(life.bats.every((b) => b.hang)).toBe(true);
    expect(Math.hypot(roost.x - roost.hx, roost.y - roost.hy)).toBeLessThan(1);
  });
  test("a startled serpent sends them up too, and they do not re-startle at once", () => {
    const life = makeCaveLife();
    startleBats(life, 5000);
    expect(life.bats.every((b) => !b.hang)).toBe(true);
    expect(life.batsQuietUntil).toBeGreaterThan(5000);
  });
  test("salamanders and rats keep to their own ground", () => {
    const life = makeCaveLife();
    run(life, 90, far);
    for (const c of life.crawlers) {
      expect(c.x).toBeGreaterThanOrEqual(c.area.x - 0.01);
      expect(c.x).toBeLessThanOrEqual(c.area.x + c.area.w + 0.01);
      expect(c.y).toBeGreaterThanOrEqual(c.area.y - 0.01);
      expect(c.y).toBeLessThanOrEqual(c.area.y + c.area.h + 0.01);
    }
  });
  test("they scuttle away from the kobzar", () => {
    const life = makeCaveLife();
    const rat = life.crawlers.find((c) => c.kind === "rat");
    if (!rat) throw new Error("no rat");
    const player = { x: rat.x - 30, y: rat.y };
    const before = Math.hypot(rat.x - player.x, rat.y - player.y);
    run(life, 1, player);
    expect(Math.hypot(rat.x - player.x, rat.y - player.y)).toBeGreaterThan(before);
  });
});

// --- can you actually walk it? --------------------------------------------------------
// Flood the floor the way the kobzar moves (a circle PLAYER_R wide, centred 6 above
// his feet) and see what he can reach from a given place.
function floodFrom(solids: Rect[], from: { x: number; y: number }, bounds: Rect): (x: number, y: number, within: number) => boolean {
  const step = 6;
  const free = (x: number, y: number) => !solids.some((b) => circleRectCollide(x, y - 6, PLAYER_R, b));
  const key = (ix: number, iy: number) => ix * 100000 + iy;
  const seen = new Set<number>();
  const pts: Array<{ x: number; y: number }> = [];
  const q: Array<[number, number]> = [[Math.round((from.x - bounds.x) / step), Math.round((from.y - bounds.y) / step)]];
  while (q.length) {
    const cur = q.pop();
    if (!cur) break;
    const [ix, iy] = cur;
    if (seen.has(key(ix, iy))) continue;
    const x = bounds.x + ix * step;
    const y = bounds.y + iy * step;
    if (x < bounds.x || y < bounds.y || x > bounds.x + bounds.w || y > bounds.y + bounds.h) continue;
    if (!free(x, y)) continue;
    seen.add(key(ix, iy));
    pts.push({ x, y });
    q.push([ix + 1, iy], [ix - 1, iy], [ix, iy + 1], [ix, iy - 1]);
  }
  return (x, y, within) => pts.some((p) => Math.hypot(p.x - x, p.y - y) <= within);
}
const bounds = (id: HouseId, pad = 60): Rect => {
  const r = HOUSE_RECTS[id];
  return { x: r.x - pad, y: r.y - pad, w: r.w + pad * 2, h: r.h + pad * 2 };
};
const caveSolidsFor = (flags: ReadonlySet<string>) => [...houseSolids("zmiieva"), ...caveSolids(flags)];

describe("walking the cave", () => {
  const outside = { x: doorOf("zmiieva").x, y: doorOf("zmiieva").y + 30 };
  test("the door leads in, and every arrival point is open floor", () => {
    expect(houseAt(ARRIVE.cave.x, ARRIVE.cave.y)).toBe("zmiieva");
    expect(houseAt(ARRIVE.tunnelWest.x, ARRIVE.tunnelWest.y)).toBe("lazna");
    expect(houseAt(ARRIVE.tunnelEast.x, ARRIVE.tunnelEast.y)).toBe("lazna");
    expect(houseAt(ARRIVE.chapel.x, ARRIVE.chapel.y)).toBe("kaplytsia");
    const open = (id: HouseId, p: { x: number; y: number }) => !houseSolids(id).some((b) => circleRectCollide(p.x, p.y - 6, PLAYER_R, b));
    expect(open("zmiieva", ARRIVE.cave)).toBe(true);
    expect(open("lazna", ARRIVE.tunnelWest)).toBe(true);
    expect(open("lazna", ARRIVE.tunnelEast)).toBe(true);
    expect(open("kaplytsia", ARRIVE.chapel)).toBe(true);
  });
  test("with the serpent awake: the hermit, the old kobzar, the pool and the serpent are reachable, but not the crack", () => {
    const can = floodFrom(caveSolidsFor(new Set()), outside, bounds("zmiieva"));
    expect(can(ONUFRIY.x, ONUFRIY.y, 64)).toBe(true);
    expect(can(OMELKO.x, OMELKO.y, 64)).toBe(true);
    expect(can(ZMIY.x, ZMIY.y, 150)).toBe(true);
    expect(can(VOHNYK.x, VOHNYK.y, 100)).toBe(true);
    expect(can(CAVE_SPOTS.crack.x, CAVE_SPOTS.crack.y, 44)).toBe(false);
  });
  test("once he sleeps the lair opens: the crack and the hoard can both be reached", () => {
    const can = floodFrom(caveSolidsFor(new Set(["zmiyLulled"])), outside, bounds("zmiieva"));
    expect(can(CAVE_SPOTS.crack.x, CAVE_SPOTS.crack.y, 44)).toBe(true);
    expect(can(CAVE_SPOTS.hoard.x, CAVE_SPOTS.hoard.y, 40)).toBe(true);
  });
  test("coming up from the tunnel you can reach the crack, and can get back down it", () => {
    const can = floodFrom(caveSolidsFor(new Set(["lazOpen"])), ARRIVE.cave, bounds("zmiieva"));
    expect(can(CAVE_SPOTS.crack.x, CAVE_SPOTS.crack.y, 44)).toBe(true);
    // ...but the rest of the cave is shut off by the coil until a song is sung
    expect(can(ONUFRIY.x, ONUFRIY.y, 64)).toBe(false);
  });
});

describe("walking the tunnel", () => {
  const can = floodFrom(houseSolids("lazna"), ARRIVE.tunnelWest, bounds("lazna", 20));
  test("from the west end to the ladder, past the smuggler and the sentry", () => {
    expect(can(TUNNEL_SPOTS.west.x, TUNNEL_SPOTS.west.y, 40)).toBe(true);
    expect(can(TUNNEL_SPOTS.pouch.x, TUNNEL_SPOTS.pouch.y, 36)).toBe(true);
    expect(can(SYDIR.x, SYDIR.y, 64)).toBe(true);
    expect(can(TUNNEL_SPOTS.east.x, TUNNEL_SPOTS.east.y, 40)).toBe(true);
    expect(can(ARRIVE.tunnelEast.x, ARRIVE.tunnelEast.y, 8)).toBe(true);
  });
  test("it has no door: nobody walks in from the forest", () => {
    const r = HOUSE_RECTS.lazna;
    const outer = floodFrom(houseSolids("lazna"), { x: r.x + r.w / 2, y: r.y + r.h + 30 }, bounds("lazna", 60));
    // (the flood does work from out there: it walks the ridge's whole south side)
    expect(outer(r.x + 40, r.y + r.h + 30, 8)).toBe(true);
    expect(outer(ARRIVE.tunnelWest.x, ARRIVE.tunnelWest.y, 20)).toBe(false);
    expect(outer(ARRIVE.tunnelEast.x, ARRIVE.tunnelEast.y, 20)).toBe(false);
  });
});

describe("the chapel hatch", () => {
  test("it can be reached from the chapel door", () => {
    const door = doorOf("kaplytsia");
    const can = floodFrom(houseSolids("kaplytsia"), { x: door.x, y: door.y + 30 }, bounds("kaplytsia"));
    expect(can(CHAPEL_HATCH.x, CHAPEL_HATCH.y, 34)).toBe(true);
  });
});

describe("what the kobzar has been told", () => {
  const ids = (npc: string, flags: string[]) => caveTopicSet(npc, new Set(flags), true)?.topics.map((x) => x.id) ?? [];
  test("the girl is not asked about until the dowry or Onufriy has mentioned her", () => {
    expect(ids("zmiy", [])).not.toContain("bride");
    expect(ids("zmiy", ["zmiyGirl"])).toContain("bride");
    const hoard = caveTopicSet("zmiy", new Set(), true)?.topics.find((x) => x.id === "hoard");
    expect(hoard?.grant).toBe("zmiyGirl");
  });
  test("Omelko speaks of the Zmiy only to someone who knows there is one", () => {
    expect(ids("omelko", [])).not.toContain("zmiy");
    expect(ids("omelko", ["zmiyKnown"])).toContain("zmiy");
  });
});
