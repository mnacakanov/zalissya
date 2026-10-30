import { hash2, type Rect } from "../world/geometry";

// --- World layout -----------------------------------------------------------

export const HOUSES: Array<Rect & { kind: "hut" | "forge" }> = [
  { x: 300, y: 210, w: 168, h: 104, kind: "hut" },
  { x: 1140, y: 190, w: 168, h: 104, kind: "hut" },
  { x: 1210, y: 700, w: 150, h: 96, kind: "hut" },
  { x: 250, y: 690, w: 156, h: 92, kind: "forge" },
];

export const WELL: Rect = { x: 806, y: 470, w: 68, h: 52 };
export const FIRE: Rect = { x: 806, y: 596, w: 68, h: 44 };
export const POND = { x: 1330, y: 1010, rx: 165, ry: 92 };
export const GARDEN: Rect = { x: 1150, y: 850, w: 150, h: 96 };

export type TreeKind = "pine" | "birch" | "oak";
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
    TREES.push({ x, y, kind: kinds[i % 3] ?? "pine", s: 0.9 + hash2(x, y) * 0.45 });
  });
}

export const FENCES: Rect[] = [
  { x: GARDEN.x - 8, y: GARDEN.y - 10, w: GARDEN.w + 16, h: 10 },
  { x: GARDEN.x - 8, y: GARDEN.y + GARDEN.h, w: GARDEN.w + 16, h: 10 },
  { x: GARDEN.x - 8, y: GARDEN.y - 10, w: 10, h: GARDEN.h + 20 },
  { x: 560, y: 250, w: 120, h: 10 },
  { x: 960, y: 250, w: 120, h: 10 },
];

export const SOLID: Rect[] = [
  ...HOUSES.map((h) => ({ x: h.x, y: h.y + 26, w: h.w, h: h.h - 26 })),
  WELL,
  FIRE,
  // Viy's bulk — the boss sleeps in the north-east hollow; you cannot walk
  // through him (and you would not want to).
  { x: 1352, y: 196, w: 136, h: 84 },
  ...TREES.map((t) => ({ x: t.x - 10, y: t.y - 8, w: 20, h: 14 })),
  ...FENCES,
];