import { type Rect } from "../world/geometry";

// --- Khaty you walk into ----------------------------------------------------
// The two khaty with insides stand in the open world: walk in through the
// door and the roof lifts away to show the room (render/khataInterior.ts).
// Both are laid out the way a Ukrainian khata was, in the khata's own
// footprint coordinates (0…320 × 0…210, walls 14 thick, the door in the
// middle of the south wall):
//   the pich in the corner by the door (SW), its mouth facing the room;
//   the pokut — the holy corner, icon and rushnyk — diagonal from it (NE),
//     with the table under it and lavy (benches) along the walls;
//   the pil (a plank sleeping platform) between the pich and the back wall;
//   a skrynia (painted chest) by the pil, and the mysnyk (dish shelf) by
//     the door on the east wall.
// The back wall shows its whitewashed inner face, so it is deeper (34).
//   hut0 — the Domovyk's khata (NW): where the kobzar sleeps
//   hut1 — Vesna's khata (SE, by the pond): herbs under the ceiling, tinctures
export type HouseId = "hut0" | "hut1";

export const HOUSE_RECTS: Record<HouseId, Rect> = {
  hut0: { x: 200, y: 150, w: 320, h: 210 },
  hut1: { x: 1180, y: 700, w: 320, h: 210 },
};
export const HOUSE_IDS = Object.keys(HOUSE_RECTS) as HouseId[];

export const WALL = 14;
export const BACK_WALL = 34; // the north wall plus its inner face
export const DOOR_GAP = 46;

// Furniture, in footprint coordinates (shared by both khaty; each is
// dressed differently by the renderer).
export const ROOM = {
  pil: { x: 14, y: BACK_WALL, w: 78, h: 58 },
  skrynia: { x: 122, y: 36, w: 40, h: 22 },
  lavaN: { x: 168, y: BACK_WALL, w: 46, h: 12 },
  table: { x: 220, y: 56, w: 62, h: 40 },
  lavaE: { x: 292, y: 42, w: 14, h: 98 },
  mysnyk: { x: 290, y: 146, w: 16, h: 44 },
  pich: { x: 14, y: 108, w: 84, h: 88 },
} as const satisfies Record<string, Rect>;

export function toWorld(id: HouseId, p: { x: number; y: number }): { x: number; y: number } {
  const r = HOUSE_RECTS[id];
  return { x: r.x + p.x, y: r.y + p.y };
}

// Walls with a door in the middle of the south side, plus the furniture.
export function houseSolids(id: HouseId): Rect[] {
  const r = HOUSE_RECTS[id];
  const half = (r.w - DOOR_GAP) / 2;
  return [
    { x: r.x, y: r.y, w: r.w, h: BACK_WALL },
    { x: r.x, y: r.y, w: WALL, h: r.h },
    { x: r.x + r.w - WALL, y: r.y, w: WALL, h: r.h },
    { x: r.x, y: r.y + r.h - WALL, w: half, h: WALL },
    { x: r.x + r.w - half, y: r.y + r.h - WALL, w: half, h: WALL },
    ...Object.values(ROOM).map((f) => ({ x: r.x + f.x, y: r.y + f.y, w: f.w, h: f.h })),
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

// Places inside the Domovyk's khata, in world coordinates: the floor in
// front of the pich's mouth (offerings), the edge of the pil (sleep), and
// the warm nook between the pil and the pich where the Domovyk lives.
export const PICH_SPOT = toWorld("hut0", { x: 114, y: 162 });
export const BED_SPOT_WORLD = toWorld("hut0", { x: 106, y: 60 });
export const DOMOVYK_HOME = toWorld("hut0", { x: 62, y: 106 });
export const HOUSE_CENTER = (id: HouseId) => toWorld(id, { x: 160, y: 150 });
