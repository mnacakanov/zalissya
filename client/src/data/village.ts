import { hash2, type Rect } from "../world/geometry";
import { FOREST_TREES } from "./land";
import { HOUSE_IDS, HOUSE_RECTS, houseSolids } from "./houses";

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
// fire is, with the otaman's khata behind it (render/khutir.ts drawKaplytsia).
export const KAPLYTSIA: Rect = { x: 800, y: 404, w: 80, h: 56 };
export const FIRE: Rect = { x: 806, y: 596, w: 68, h: 44 };
export const POND = { x: 1330, y: 1050, rx: 165, ry: 92 };
export const GARDEN: Rect = { x: 960, y: 860, w: 150, h: 96 };

export type TreeKind = "pine" | "birch" | "oak" | "cherry" | "willow";
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
  TREES.push({ x: 1532, y: 968, kind: "willow", s: 1.05 });
  // the forests beyond the fields and the river (data/land.ts)
  TREES.push(...FOREST_TREES);
  // nothing grows through a roof or on the maidan's chapel
  const builtOn = (x: number, y: number) =>
    [...Object.values(HOUSE_RECTS), ...HOUSES, KAPLYTSIA].some((r) => x > r.x - 34 && x < r.x + r.w + 34 && y > r.y - 50 && y < r.y + r.h + 24);
  for (let i = TREES.length - 1; i >= 0; i--) {
    const tr = TREES[i];
    if (tr && builtOn(tr.x, tr.y)) TREES.splice(i, 1);
  }
  // lone oaks out on the steppe, where the chumaky rest at noon
  for (const [x, y] of [[1980, 230], [2330, 1040], [2480, 300], [1880, 900]] as const) {
    TREES.push({ x, y, kind: "oak", s: 1.1 + hash2(x, y) * 0.3 });
  }
}

// Landmarks: the windmill by the Chort's old millstone, and a burial mound
// with its stone idol where the khutir gives way to the steppe.
export const WINDMILL = { x: 404, y: 1012 };
export const KURHAN = { x: 1600, y: 800 };
export const KURHAN_STEPPE = { x: 2150, y: 520 };

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
  OTAMAN_FLAGPOLE,
  WELL,
  FIRE,
  KAPLYTSIA,
  // Viy's bulk — the boss sleeps in the north-east hollow; you cannot walk
  // through him (and you would not want to).
  { x: 1352, y: 196, w: 136, h: 84 },
  ...TREES.map((t) => ({ x: t.x - 10, y: t.y - 8, w: 20, h: 14 })),
  ...FENCES,
  { x: WINDMILL.x - 26, y: WINDMILL.y - 16, w: 52, h: 22 },
  { x: KURHAN.x - 56, y: KURHAN.y - 22, w: 112, h: 26 },
  { x: KURHAN_STEPPE.x - 56, y: KURHAN_STEPPE.y - 22, w: 112, h: 26 },
];