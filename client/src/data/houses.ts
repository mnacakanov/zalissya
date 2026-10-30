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
//   otaman — Myroslav's khata by the maidan: a different, richer house
//     altogether (see OTAMAN_ROOM below)
//   korchma — the inn on the chumak road past the khutir (KORCHMA_ROOM)
//   pustka — the abandoned khata of Taras Dovhyi by Viy's hollow (PUSTKA_ROOM)
export type HouseId = "hut0" | "hut1" | "otaman" | "korchma" | "pustka";

export const HOUSE_RECTS: Record<HouseId, Rect> = {
  // the khutir stands in a horseshoe round the maidan, open to the south
  // (fields, river and road): the otaman at the head, the Domovyk's khata
  // north-west, Vesna's east (data/village.ts has the rest of the ring)
  hut0: { x: 260, y: 200, w: 320, h: 210 },
  hut1: { x: 1120, y: 380, w: 320, h: 210 },
  otaman: { x: 650, y: 120, w: 380, h: 200 },
  korchma: { x: 1830, y: 1000, w: 350, h: 210 },
  pustka: { x: 1084, y: 140, w: 210, h: 176 },
};
export const HOUSE_IDS = Object.keys(HOUSE_RECTS) as HouseId[];

export const WALL = 14;
export const BACK_WALL = 34; // the north wall plus its inner face
export const DOOR_GAP = 46;

// Furniture, in footprint coordinates (shared by the two plain khaty;
// each is dressed differently by the renderer).
export const ROOM = {
  pil: { x: 14, y: BACK_WALL, w: 78, h: 58 },
  skrynia: { x: 122, y: 36, w: 40, h: 22 },
  lavaN: { x: 168, y: BACK_WALL, w: 46, h: 12 },
  table: { x: 220, y: 56, w: 62, h: 40 },
  lavaE: { x: 292, y: 42, w: 14, h: 98 },
  mysnyk: { x: 290, y: 146, w: 16, h: 44 },
  pich: { x: 14, y: 108, w: 84, h: 88 },
} as const satisfies Record<string, Rect>;

// The otaman's khata is built "through the siny": the front door opens
// into an unheated passage (sinky) in the middle, with a door left into
// the khata proper — the pich, the pil, the bread trough — and a door
// right into the svitlytsia, the clean room where the otaman receives
// people: planked floor, a kylym, his table with the pernach, sabres and
// a musket on the wall. Footprint 380×200, the front door at x 167…213.
export const OTAMAN_DOORS = { y: 62, h: 60 }; // the gaps in the partitions
export const OTAMAN_WALLS = { west: 146, east: 222, w: 12 };
export const OTAMAN_ROOM = {
  pich: { x: 14, y: 112, w: 76, h: 74 },
  pil: { x: 14, y: BACK_WALL, w: 60, h: 50 },
  lava: { x: 82, y: BACK_WALL, w: 58, h: 12 },
  dizha: { x: 116, y: 150, w: 24, h: 26 },
  ladder: { x: 166, y: BACK_WALL, w: 18, h: 12 },
  barrel: { x: 196, y: 40, w: 20, h: 20 },
  skrynia: { x: 242, y: 36, w: 46, h: 22 },
  table: { x: 278, y: 76, w: 66, h: 42 },
  lavaE: { x: 352, y: 42, w: 14, h: 110 },
} as const satisfies Record<string, Rect>;

// The korchma: one big log-walled hall. The shynkvas (bar counter) runs
// across the back with the barrels behind it, where Odarka stands; two
// long tables with benches for the drinkers; the pich in the corner by
// the door. Footprint 350×210, the door at x 152…198.
export const KORCHMA_ROOM = {
  barrels: { x: 150, y: BACK_WALL, w: 150, h: 20 },
  counter: { x: 146, y: 70, w: 190, h: 16 },
  tableW: { x: 26, y: 62, w: 96, h: 26 },
  benchWn: { x: 26, y: 50, w: 96, h: 8 },
  benchWs: { x: 26, y: 92, w: 96, h: 8 },
  tableE: { x: 212, y: 128, w: 96, h: 26 },
  benchEn: { x: 212, y: 116, w: 96, h: 8 },
  benchEs: { x: 212, y: 158, w: 96, h: 8 },
  pich: { x: 14, y: 128, w: 70, h: 68 },
} as const satisfies Record<string, Rect>;

// The pustka: Taras Dovhyi planted the tobacco field, rode to the Sich and
// never came back. His khata stands empty on the north-east edge of the
// ring, closest of all to Viy's hollow: a cold, cracked pich, a sagging pil,
// a bench on its side, and his skrynia, which still holds his letter.
// Footprint 210×176, the door at x 82…128.
export const PUSTKA_ROOM = {
  pich: { x: 14, y: BACK_WALL, w: 58, h: 54 },
  skrynia: { x: 104, y: 36, w: 38, h: 20 },
  pil: { x: 150, y: BACK_WALL, w: 46, h: 44 },
  lava: { x: 20, y: 124, w: 40, h: 12 },
  table: { x: 136, y: 108, w: 44, h: 28 },
} as const satisfies Record<string, Rect>;
// Where to stand to open the skrynia (in the world).
export const PUSTKA_CHEST = { x: 1084 + 123, y: 140 + 76 };

function furniture(id: HouseId): Rect[] {
  if (id === "korchma") return Object.values(KORCHMA_ROOM);
  if (id === "pustka") return Object.values(PUSTKA_ROOM);
  if (id !== "otaman") return Object.values(ROOM);
  const parts: Rect[] = [];
  for (const px of [OTAMAN_WALLS.west, OTAMAN_WALLS.east]) {
    parts.push({ x: px, y: BACK_WALL, w: OTAMAN_WALLS.w, h: OTAMAN_DOORS.y - BACK_WALL });
    parts.push({ x: px, y: OTAMAN_DOORS.y + OTAMAN_DOORS.h, w: OTAMAN_WALLS.w, h: 186 - OTAMAN_DOORS.y - OTAMAN_DOORS.h });
  }
  return [...parts, ...Object.values(OTAMAN_ROOM)];
}

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
    ...furniture(id).map((f) => ({ x: r.x + f.x, y: r.y + f.y, w: f.w, h: f.h })),
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
export const HOUSE_CENTER = (id: HouseId) => toWorld(id, { x: HOUSE_RECTS[id].w / 2, y: 150 });
