import { hash2, type Rect } from "../world/geometry";
import { FOREST_TREES } from "./land";
import { KABYTSIA } from "./items";
import { CAVE_HILL, CAVE_HILL_SOLID, HOUSE_IDS, HOUSE_RECTS, houseSolids } from "./houses";

// --- World layout -----------------------------------------------------------

export const HOUSES: Array<Rect & { kind: "hut" | "forge" }> = [
  // (the little north-east hut is now Taras Dovhyi's pustka, walk-in:
  // data/houses.ts)
  // the forge on the west side of the ring, open to the road
  { x: 250, y: 470, w: 156, h: 92, kind: "forge" },
  // (the otaman's khata, facing the maidan, is walk-in: data/houses.ts)
];

export const WELL: Rect = { x: 916, y: 470, w: 68, h: 52 };
// The kaplytsia: a small wooden chapel at the head of the maidan, where the
// fire is, with the otaman's khata behind it. Walk-in now (data/houses.ts
// HOUSE_RECTS.kaplytsia; render/khutir.ts drawKaplytsia).
export const KAPLYTSIA: Rect = HOUSE_RECTS.kaplytsia;
export const FIRE: Rect = { x: 806, y: 596, w: 68, h: 44 };
// The kobzar's log on the south side of the fire, facing the khutir: he
// sits here when he plays of an evening (drawFire draws the log).
export const FIRE_SEAT = { x: FIRE.x + FIRE.w / 2, y: FIRE.y + FIRE.h + 20 };
export const POND = { x: 1330, y: 1050, rx: 165, ry: 92 };
// The pond is no ellipse: its shore wanders — a bay to the north-east,
// a bulge where the geese come out, a straighter bank on the west where
// people fish. pondR(a) is the shore's distance at angle a, as a share of
// the ellipse POND (a is measured in the ellipse's own squashed space).
export function pondR(a: number): number {
  return 1 + 0.12 * Math.sin(2 * a + 0.7) + 0.08 * Math.sin(3 * a + 2.1) + 0.05 * Math.sin(5 * a + 0.3) + 0.03 * Math.sin(7 * a + 1.9);
}
// Is a point in the water, `pad` pixels beyond the shore (negative: that
// far in from it)?
export function inPondShape(x: number, y: number, pad = 0): boolean {
  const dx = (x - POND.x) / POND.rx;
  const dy = (y - POND.y) / POND.ry;
  const a = Math.atan2(dy, dx);
  const d = Math.hypot(dx, dy);
  // a pixel pad, as a share of the radius in this direction
  const unit = Math.hypot(Math.cos(a) * POND.rx, Math.sin(a) * POND.ry);
  return d < pondR(a) + pad / unit;
}
// The point on the shore toward (x, y), `off` pixels outward (negative:
// into the water).
export function pondEdge(x: number, y: number, off: number): { x: number; y: number } {
  const a = Math.atan2((y - POND.y) / POND.ry, (x - POND.x) / POND.rx);
  const unit = Math.hypot(Math.cos(a) * POND.rx, Math.sin(a) * POND.ry);
  const k = pondR(a) + off / unit;
  return { x: POND.x + Math.cos(a) * POND.rx * k, y: POND.y + Math.sin(a) * POND.ry * k };
}
// the shore as a loop of points, for drawing (and the map)
export function pondShore(off = 0, n = 72): Array<{ x: number; y: number }> {
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push(pondEdge(POND.x + Math.cos(a) * POND.rx, POND.y + Math.sin(a) * POND.ry, off));
  }
  return pts;
}
export const GARDEN: Rect = { x: 960, y: 860, w: 150, h: 96 };

export type TreeKind = "pine" | "birch" | "oak" | "apple" | "cherry" | "willow";
export const TREES: Array<{ x: number; y: number; kind: TreeKind; s: number }> = [];
{
  // Forest ring around the clearing plus a few shade trees inside.
  const ring: Array<[number, number]> = [
    [90, 120], [220, 80], [380, 70], [560, 60], [760, 66], [960, 60], [1150, 70],
    [1330, 80], [1500, 110], [1590, 260], [1600, 460], [1590, 660], [1560, 860],
    [1470, 1080], [1240, 1160], [1010, 1180], [790, 1170], [570, 1180], [350, 1160],
    [150, 1090], [70, 900], [60, 690], [66, 480], [80, 300],
    [620, 150], [1010, 140], [700, 1080], [480, 980], [180, 560], [1480, 420],
    [980, 330], [560, 420], [90, 760], [1520, 620],
  ];
  const kinds: TreeKind[] = ["pine", "birch", "oak"];
  ring.forEach(([x, y], i) => {
    // the old millstone rise is kept clear for the windmill, and the
    // otaman's yard for his khata
    if ((x === 480 && y === 980) || (x === 560 && y === 420)) return;
    // ...and the east edge is open now: the trail and the chumak road
    // run out into the steppe
    if ((x === 1600 && y === 460) || (x === 1590 && y === 660)) return;
    // willows lean over the pond
    const nearPond = Math.hypot(x - POND.x, (y - POND.y) * 1.4) < 300;
    TREES.push({ x, y, kind: nearPond ? "willow" : kinds[i % 3] ?? "pine", s: 0.9 + hash2(x, y) * 0.45 });
  });
  // cherry trees by the khaty — «садок вишневий коло хати»
  for (const [x, y] of [[214, 400], [610, 400], [1080, 600], [1480, 560], [1060, 300]] as const) {
    TREES.push({ x, y, kind: "cherry", s: 0.95 + hash2(x, y) * 0.2 });
  }
  // apple trees in the khaty's orchards — the oaks are oaks now
  for (const [x, y] of [[205, 520], [70, 380], [1100, 770], [1530, 300], [600, 470]] as const) {
    TREES.push({ x, y, kind: "apple", s: 0.95 + hash2(x, y) * 0.2 });
  }
  TREES.push({ x: 1532, y: 968, kind: "willow", s: 1.05 });
  // the forests beyond the fields and the river (data/land.ts)
  TREES.push(...FOREST_TREES);
  // nothing grows through a roof or on the maidan's chapel
  // (and a clearing round the old hollow oak in the south forest, where
  // Motrya sleeps by day: data/hideouts.ts)
  // (a tree's crown hangs over what lies behind it: keep the hill and the lane in
  // front of the Serpent's Cave's mouth clear. The cave and the tunnel themselves
  // lie in the underground band, so they clear nothing else.)
  const CAVE_CLEARINGS = [
    CAVE_HILL,
    { x: CAVE_HILL.x + CAVE_HILL.w / 2 - 110, y: CAVE_HILL.y + CAVE_HILL.h, w: 220, h: 150 },
  ];
  // and a little yard before Did Prokip's door, so no crown hides it
  const pk = HOUSE_RECTS.prokip;
  const PROKIP_YARD = { x: pk.x - 70, y: pk.y + pk.h, w: pk.w + 100, h: 150 };
  const builtOn = (x: number, y: number) =>
    [...Object.values(HOUSE_RECTS), ...HOUSES, { x: 880, y: 1760, w: 200, h: 150 }, ...CAVE_CLEARINGS, PROKIP_YARD].some((r) => x > r.x - 34 && x < r.x + r.w + 34 && y > r.y - 50 && y < r.y + r.h + 24);
  for (let i = TREES.length - 1; i >= 0; i--) {
    const tr = TREES[i];
    // (and no tree stands in the pond: willows lean over it from the bank)
    if (tr && (builtOn(tr.x, tr.y) || inPondShape(tr.x, tr.y, 16))) TREES.splice(i, 1);
  }
  // lone oaks out on the steppe, where the chumaky rest at noon
  for (const [x, y] of [[1980, 230], [2330, 1040], [2480, 300], [1880, 900]] as const) {
    TREES.push({ x, y, kind: "oak", s: 1.1 + hash2(x, y) * 0.3 });
  }
}

// Landmarks: the windmill by the Chort's old millstone, and a burial mound
// with its stone idol where the khutir gives way to the steppe.
// (the windmill is walk-in now: data/houses.ts HOUSE_RECTS.mlyn; this is its
// place for the map)
export const WINDMILL = { x: 405, y: 980 };
export const KURHAN = { x: 1600, y: 800 };
// (the steppe kurhan is walk-in now, a little off the trail: data/houses.ts
// HOUSE_RECTS.kurhan; this is its place for the map)
export const KURHAN_STEPPE = { x: 2165, y: 360 };

// Yard plants (no collision): sunflowers, mallows, and feather grass on the
// steppe side.
export type DecorKind = "sunflower" | "mallow" | "kovyla";
export const DECOR: Array<{ x: number; y: number; kind: DecorKind; seed: number }> = [];
{
  // nothing grows on a khata's floor (they show once the roof lifts)
  const indoors = (x: number, y: number) =>
    Object.values(HOUSE_RECTS).some((r) => x > r.x - 6 && x < r.x + r.w + 6 && y > r.y && y < r.y + r.h + 4);
  const add = (kind: DecorKind, pts: Array<[number, number]>) =>
    pts.forEach(([x, y]) => { if (!indoors(x, y)) DECOR.push({ x, y, kind, seed: hash2(x, y) }); });
  add("sunflower", [[488, 500], [190, 380], [208, 392], [432, 712], [446, 726], [1515, 760]]);
  add("mallow", [[512, 486], [640, 488], [300, 378], [450, 378], [1170, 880], [1515, 880]]);
  // feather grass all over the open steppe
  for (let i = 0; i < 90; i++) {
    const x = 1720 + hash2(i, 31) * 900;
    const y = 60 + hash2(i, 37) * 1140;
    if (!indoors(x, y)) DECOR.push({ x, y, kind: "kovyla", seed: hash2(i, 41) });
  }
  add("kovyla", [[1556, 520], [1596, 560], [1540, 700], [1590, 724], [1500, 530], [1446, 742], [1552, 800], [1430, 800], [1600, 610]]);
}

// Yard things that make the khutir lived in (render/animals.ts): the stork's
// nest on its pole by the chapel, washing on a line by the Domovyk's khata,
// log beehives by the herb garden, haystacks at the field edge, a hay cart
// left by the forge.
export type YardProp = { kind: "storkNest" | "laundry" | "beehive" | "haystack" | "hayCart" | "shed" | "henHouse"; x: number; y: number; w?: number };
export const YARD_PROPS: YardProp[] = [
  { kind: "storkNest", x: 612, y: 548 },
  { kind: "laundry", x: 120, y: 455, w: 80 },
  { kind: "beehive", x: 1000, y: 800 }, { kind: "beehive", x: 1030, y: 812 }, { kind: "beehive", x: 1060, y: 800 },
  { kind: "haystack", x: 560, y: 1330 }, { kind: "haystack", x: 640, y: 1345 }, { kind: "haystack", x: 1240, y: 1340 },
  { kind: "hayCart", x: 170, y: 735 },
  // where the cow and the hens spend the night (systems/critters.ts, App)
  { kind: "shed", x: 196, y: 838 },
  { kind: "henHouse", x: 660, y: 770 },
];
const PROP_SOLID: Record<YardProp["kind"], { w: number; h: number }> = {
  storkNest: { w: 8, h: 8 }, laundry: { w: 4, h: 4 }, beehive: { w: 14, h: 8 }, haystack: { w: 34, h: 10 }, hayCart: { w: 52, h: 12 },
  shed: { w: 6, h: 6 }, henHouse: { w: 28, h: 8 },
};

// The way in, for a kobzar who has never been here: the south road runs
// up out of the forest, over the bridge and between the fields to the
// maidan. Signposts stand where he might doubt it — where it leaves the
// forest edge, where the bog path forks off west — and a wayside cross
// with a rushnyk stands where the khutir begins.
export type Signpost = { x: number; y: number; boards: Array<{ text: "zalissya" | "boloto" | "khutir"; dir: "n" | "w" | "e" }> };
export const SIGNPOSTS: Signpost[] = [
  { x: 884, y: 2150, boards: [{ text: "zalissya", dir: "n" }] },
  { x: 790, y: 1834, boards: [{ text: "zalissya", dir: "n" }, { text: "boloto", dir: "w" }] },
  { x: 892, y: 1236, boards: [{ text: "khutir", dir: "n" }] },
];
export const WAYSIDE_CROSS = { x: 786, y: 1232 };

// the otaman's korohva (banner) on its pole by his porch
export const OTAMAN_FLAGPOLE: Rect = { x: 628, y: 300, w: 8, h: 8 };

export const FENCES: Rect[] = [
  { x: GARDEN.x - 8, y: GARDEN.y - 10, w: GARDEN.w + 16, h: 10 },
  { x: GARDEN.x - 8, y: GARDEN.y + GARDEN.h, w: GARDEN.w + 16, h: 10 },
  { x: GARDEN.x - 8, y: GARDEN.y - 10, w: 10, h: GARDEN.h + 20 },
];

export const SOLID: Rect[] = [
  ...HOUSES.map((h) => ({ x: h.x, y: h.y + 26, w: h.w, h: h.h - 26 })),
  // the khaty you walk into: walls with a door, and their furniture
  ...HOUSE_IDS.flatMap((id) => houseSolids(id)),
  // the Serpent's Cave's hill on the surface: not to be walked onto
  CAVE_HILL_SOLID,
  OTAMAN_FLAGPOLE,
  ...SIGNPOSTS.map((sp) => ({ x: sp.x - 3, y: sp.y - 5, w: 6, h: 6 })),
  { x: WAYSIDE_CROSS.x - 4, y: WAYSIDE_CROSS.y - 5, w: 8, h: 6 },
  ...YARD_PROPS.flatMap((pr) => {
    const sz = PROP_SOLID[pr.kind];
    const one = { x: pr.x - sz.w / 2, y: pr.y - sz.h, w: sz.w, h: sz.h };
    // the washing line is two posts, not a wall
    return pr.kind === "laundry" ? [one, { ...one, x: one.x + (pr.w ?? 0) }] : [one];
  }),
  WELL,
  FIRE,
  // the kabytsia, Vesna's summer hearth (data/items.ts)
  { x: KABYTSIA.x - 16, y: KABYTSIA.y - 8, w: 32, h: 12 },
  // Viy's bulk — the boss sleeps in the north-east hollow; you cannot walk
  // through him (and you would not want to).
  { x: 1352, y: 196, w: 136, h: 84 },
  ...TREES.map((t) => ({ x: t.x - 10, y: t.y - 8, w: 20, h: 14 })),
  ...FENCES,
  { x: KURHAN.x - 56, y: KURHAN.y - 22, w: 112, h: 26 },
];