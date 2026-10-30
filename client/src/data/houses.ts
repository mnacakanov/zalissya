import { HUT0_SOLID, HUT1_SOLID, HUT_WALLS } from "./huts";
import { PICH_IN_SPOT } from "./items";
import { type Rect } from "../world/geometry";

// --- Khaty you walk into ----------------------------------------------------
// The two khaty with insides stand in the open world: walk in through the
// door and the roof lifts away to show the room (render: App's frame loop,
// drawHutInterior scaled into the footprint). The rooms keep the layout
// they were designed with (data/huts.ts, in their own 820×600 room
// coordinates: walls at 70…750 × 64…536); here they are mapped onto each
// khata's footprint in the world.
//   hut0 — the Domovyk's khata (NW): the pich, the woodpile, the bed you sleep in
//   hut1 — Vesna's khata (SE, by the pond): her bed, work table, cauldron
export type HouseId = "hut0" | "hut1";

export const HOUSE_RECTS: Record<HouseId, Rect> = {
  hut0: { x: 200, y: 150, w: 320, h: 210 },
  hut1: { x: 1180, y: 700, w: 320, h: 210 },
};
export const HOUSE_IDS = Object.keys(HOUSE_RECTS) as HouseId[];

const ROOM = { x: 70, y: 64, w: 680, h: 472 };
const WALL = 14;
const DOOR_GAP = 46;

export function roomScale(id: HouseId): { sx: number; sy: number } {
  const r = HOUSE_RECTS[id];
  return { sx: r.w / ROOM.w, sy: r.h / ROOM.h };
}

export function toWorld(id: HouseId, p: { x: number; y: number }): { x: number; y: number } {
  const r = HOUSE_RECTS[id];
  const { sx, sy } = roomScale(id);
  return { x: r.x + (p.x - ROOM.x) * sx, y: r.y + (p.y - ROOM.y) * sy };
}

function rectToWorld(id: HouseId, q: Rect): Rect {
  const a = toWorld(id, q);
  const { sx, sy } = roomScale(id);
  return { x: a.x, y: a.y, w: q.w * sx, h: q.h * sy };
}

// Walls with a door in the middle of the south side, plus the furniture.
export function houseSolids(id: HouseId): Rect[] {
  const r = HOUSE_RECTS[id];
  const half = (r.w - DOOR_GAP) / 2;
  const furniture = (id === "hut0" ? HUT0_SOLID : HUT1_SOLID).slice(HUT_WALLS.length);
  return [
    { x: r.x, y: r.y, w: r.w, h: WALL },
    { x: r.x, y: r.y, w: WALL, h: r.h },
    { x: r.x + r.w - WALL, y: r.y, w: WALL, h: r.h },
    { x: r.x, y: r.y + r.h - WALL, w: half, h: WALL },
    { x: r.x + r.w - half, y: r.y + r.h - WALL, w: half, h: WALL },
    ...furniture.map((f) => rectToWorld(id, f)),
  ];
}

// Which khata's room is the point in (null when outdoors)?
export function houseAt(x: number, y: number): HouseId | null {
  for (const id of HOUSE_IDS) {
    const r = HOUSE_RECTS[id];
    if (x > r.x + 4 && x < r.x + r.w - 4 && y > r.y + 4 && y < r.y + r.h - 10) return id;
  }
  return null;
}

export function doorOf(id: HouseId): { x: number; y: number } {
  const r = HOUSE_RECTS[id];
  return { x: r.x + r.w / 2, y: r.y + r.h };
}

// Places inside the Domovyk's khata, in world coordinates.
export const PICH_SPOT = toWorld("hut0", PICH_IN_SPOT);
export const BED_SPOT_WORLD = toWorld("hut0", { x: 635, y: 196 });
export const DOMOVYK_HOME = toWorld("hut0", { x: 330, y: 165 });
export const HOUSE_CENTER = (id: HouseId) => toWorld(id, { x: 410, y: 430 });
