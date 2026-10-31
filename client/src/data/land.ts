import { hash2, type Rect } from "../world/geometry";

// --- The land around the khutir ---------------------------------------------
// South of the khutir the world opens up: kitchen gardens (городи) by the
// last fences, then strip fields of buckwheat, barley and oats and the hemp
// field, then a river with two wooden bridges, and beyond it the forests
// and the old tobacco field by the chumak road. East of Lysa Hora's foot
// another forest runs down to the river.
//
// Crops are drawn at ground level and are walkable (you walk the boundary
// strips, as people do); the river is not, except on the bridges.

export type CropKind =
  | "buckwheat" | "barley" | "oats" | "hemp" | "tobacco"
  | "cabbage" | "beet" | "cucumber" | "carrot" | "radish" | "onion" | "garlic";

export type Field = Rect & { crop: CropKind };
// A kitchen garden: one plot, a row for each crop.
export type Garden = Rect & { rows: CropKind[] };

export const FIELDS: Field[] = [
  { x: 110, y: 1388, w: 370, h: 150, crop: "buckwheat" },
  { x: 500, y: 1388, w: 250, h: 150, crop: "barley" },
  { x: 930, y: 1388, w: 360, h: 150, crop: "oats" },
  { x: 1310, y: 1388, w: 300, h: 150, crop: "hemp" },
  { x: 1760, y: 1300, w: 380, h: 170, crop: "buckwheat" },
  { x: 1950, y: 1830, w: 260, h: 200, crop: "tobacco" },
];

export const GARDENS: Garden[] = [
  { x: 150, y: 1286, w: 180, h: 72, rows: ["cabbage", "beet", "cabbage"] },
  { x: 350, y: 1286, w: 180, h: 72, rows: ["cucumber", "carrot", "carrot"] },
  { x: 550, y: 1286, w: 180, h: 72, rows: ["radish", "onion", "garlic"] },
  { x: 950, y: 1286, w: 170, h: 72, rows: ["cabbage", "onion", "garlic"] },
  { x: 1140, y: 1286, w: 170, h: 72, rows: ["beet", "carrot", "cucumber"] },
];

// --- the river --------------------------------------------------------------
export const RIVER_HALF = 46;
export function riverY(x: number): number {
  return 1640 + Math.sin(x / 310) * 58 + Math.sin(x / 97 + 1.3) * 12;
}
// Two plank bridges: on the khutir's road south, and on the chumak road.
export const BRIDGES: Array<{ x: number; w: number }> = [
  { x: 840, w: 84 },
  { x: 2250, w: 84 },
];
export function onBridge(x: number): boolean {
  return BRIDGES.some((b) => Math.abs(x - b.x) < b.w / 2 - 8);
}
export function inRiver(x: number, y: number): boolean {
  return Math.abs(y - riverY(x)) < RIVER_HALF && !onBridge(x);
}

// --- the boloto ------------------------------------------------------------
// Far from the khutir, past the river and deep in the south-west forest,
// the ground goes soft and black: a bog of dark pools, tussocks, duckweed
// and dead birches. The Bolotianyk lives here, not in the khutir's pond.
// A footpath leaves the south road past the bridge and peters out at its
// edge. The pools are deep water: you do not walk in them.
export const BOLOTO = { x: 380, y: 2040, rx: 250, ry: 150 };
export const BOLOTO_POOLS: Array<{ x: number; y: number; rx: number; ry: number }> = [
  { x: 380, y: 2030, rx: 92, ry: 50 }, // the deep one, where he sits
  { x: 250, y: 2090, rx: 54, ry: 28 },
  { x: 506, y: 2080, rx: 48, ry: 24 },
  { x: 300, y: 1960, rx: 40, ry: 20 },
  { x: 470, y: 1980, rx: 34, ry: 16 },
];
export function inBoloto(x: number, y: number): boolean {
  return BOLOTO_POOLS.some((p) => ((x - p.x) / p.rx) ** 2 + ((y - p.y) / p.ry) ** 2 < 1);
}
// the footpath from the south road, past the bridge, to the bog
export const BOLOTO_PATH: number[][] = [[840, 1740], [700, 1800], [600, 1900], [540, 1960]];
function nearBolotoPath(x: number, y: number): boolean {
  for (let i = 0; i <= 20; i++) {
    const u = i / 20;
    const v = 1 - u;
    const P = BOLOTO_PATH;
    const bx = v * v * v * (P[0]?.[0] ?? 0) + 3 * v * v * u * (P[1]?.[0] ?? 0) + 3 * v * u * u * (P[2]?.[0] ?? 0) + u * u * u * (P[3]?.[0] ?? 0);
    const by = v * v * v * (P[0]?.[1] ?? 0) + 3 * v * v * u * (P[1]?.[1] ?? 0) + 3 * v * u * u * (P[2]?.[1] ?? 0) + u * u * u * (P[3]?.[1] ?? 0);
    if (Math.hypot(x - bx, y - by) < 40) return true;
  }
  return false;
}

// the path nobody keeps: off the chumak road past its bridge, east through
// the forest to Did Prokip's door (data/houses.ts HOUSE_RECTS.prokip). Two
// bezier legs; no tree stands within reach of it, or you could not get by
// (tree trunks are solid: data/village.ts SOLID).
// It runs between the river and the tunnel's ridge (HOUSE_RECTS.lazna), then
// round the ridge's east end and up to the door from the south.
export const PROKIP_PATH: number[][][] = [
  [[2262, 1910], [2600, 1860], [3000, 1900], [3350, 1880]],
  [[3350, 1880], [3660, 1860], [3600, 2090], [3790, 2034]],
];
function nearProkipPath(x: number, y: number): boolean {
  for (const P of PROKIP_PATH) {
    for (let i = 0; i <= 40; i++) {
      const u = i / 40;
      const v = 1 - u;
      const bx = v * v * v * (P[0]?.[0] ?? 0) + 3 * v * v * u * (P[1]?.[0] ?? 0) + 3 * v * u * u * (P[2]?.[0] ?? 0) + u * u * u * (P[3]?.[0] ?? 0);
      const by = v * v * v * (P[0]?.[1] ?? 0) + 3 * v * v * u * (P[1]?.[1] ?? 0) + 3 * v * u * u * (P[2]?.[1] ?? 0) + u * u * u * (P[3]?.[1] ?? 0);
      // a little more room below the path: a crown hangs over what is behind it
      if (Math.abs(x - bx) < 46 && y - by > -40 && y - by < 64) return true;
    }
  }
  return false;
}

// --- forests ----------------------------------------------------------------
// Dense, but with gaps to walk through; the Lisovyk would approve.
export type ForestTree = { x: number; y: number; kind: "pine" | "birch" | "oak"; s: number };
export const FOREST_TREES: ForestTree[] = [];
{
  const regions: Array<Rect & { pines: number }> = [
    { x: 30, y: 1760, w: 1640, h: 520, pines: 0.55 },
    { x: 2760, y: 1180, w: 1200, h: 360, pines: 0.4 },
    { x: 2560, y: 1760, w: 1400, h: 520, pines: 0.35 },
  ];
  const step = 74;
  for (const r of regions) {
    for (let gx = r.x; gx < r.x + r.w; gx += step) {
      for (let gy = r.y; gy < r.y + r.h; gy += step) {
        const h = hash2(gx * 0.37, gy * 0.53);
        if (h < 0.34) continue; // glades
        const x = gx + (hash2(gx, gy) - 0.5) * 40;
        const y = gy + (hash2(gy, gx) - 0.5) * 40;
        // keep the bridges' roads open
        if (BRIDGES.some((b) => Math.abs(x - b.x) < 90) && y < 2000) continue;
        // nor in the bog, nor on the path to it (a few dead birches stand
        // in it, drawn with the bog)
        if (((x - BOLOTO.x) / (BOLOTO.rx + 30)) ** 2 + ((y - BOLOTO.y) / (BOLOTO.ry + 30)) ** 2 < 1 || nearBolotoPath(x, y) || nearProkipPath(x, y)) continue;
        const k = hash2(gx * 3, gy * 7);
        const kind = k < r.pines ? "pine" : k < r.pines + 0.3 ? "oak" : "birch";
        FOREST_TREES.push({ x, y, kind, s: 0.9 + hash2(x, y) * 0.45 });
      }
    }
  }
}

// --- the tobacco quest's places (systems/tobacco.ts) ------------------------
export const TOBACCO_SPOTS: Array<{ x: number; y: number }> = [
  { x: 2000, y: 1890 }, { x: 2090, y: 1975 }, { x: 2165, y: 1880 },
];
export const HEMP_SPOT = { x: 1460, y: 1460 };
