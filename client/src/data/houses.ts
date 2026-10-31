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
//   mlyn — the windmill on the rise by the old millstone (MLYN_ROOM), where
//     Solokha sits out the day on a flour sack
//   duplo, kurhan, pechera — the sabbath's day hiding places, walk-in too
//     (data/hideouts.ts): the hollow of the old oak, the chamber dug into the
//     steppe kurhan, and Beelzebub's cave on Lysa Hora
//   kaplytsia — the log chapel at the head of the maidan (KAPLYTSIA_ROOM)
//   prokip — Did Prokip's khatka, alone in the south-east forest past the
//     chumak bridge (PROKIP_ROOM; systems/vorozhbyt.ts)
//   zmiieva — the Serpent's Cave in the south forest, big enough to get lost
//     in (ZMIIEVA_ROOM); data/cave.ts has who and what lives in it
//   lazna — the hidden tunnel (лаз) from the cave to under the kaplytsia. It
//     is an underground place with no door: you only arrive by the crack, the
//     ladder or the chapel hatch (data/cave.ts), and from outside it is a bare
//     rock ridge on the steppe east of the chumak road (LAZNA_ROOM)
export type HouseId = "hut0" | "hut1" | "otaman" | "korchma" | "pustka" | "mlyn" | "duplo" | "kurhan" | "pechera" | "kaplytsia" | "prokip" | "zmiieva" | "lazna";

export const HOUSE_RECTS: Record<HouseId, Rect> = {
  // the khutir stands in a horseshoe round the maidan, open to the south
  // (fields, river and road): the otaman at the head, the Domovyk's khata
  // north-west, Vesna's east (data/village.ts has the rest of the ring)
  hut0: { x: 260, y: 200, w: 320, h: 210 },
  hut1: { x: 1120, y: 380, w: 320, h: 210 },
  otaman: { x: 650, y: 120, w: 380, h: 200 },
  korchma: { x: 1830, y: 1000, w: 350, h: 210 },
  pustka: { x: 1084, y: 140, w: 210, h: 176 },
  mlyn: { x: 330, y: 900, w: 150, h: 130 },
  duplo: { x: 925, y: 1790, w: 110, h: 100 },
  kurhan: { x: 2080, y: 300, w: 170, h: 120 },
  pechera: { x: 3660, y: 240, w: 180, h: 136 },
  // between the otaman's porch and the fire, its door facing the fire
  kaplytsia: { x: 770, y: 380, w: 140, h: 124 },
  // far out: over the chumak bridge and east through the forest, past the
  // end of the tunnel's ridge, where "decent people don't walk" (Vesna)
  prokip: { x: 3680, y: 1840, w: 220, h: 170 },
  // south of the river, east of the old oak, clear of the bridge road and the
  // tobacco field: a rocky hill with its mouth to the south
  zmiieva: { x: 1150, y: 1740, w: 760, h: 460 },
  // a bare ridge on the steppe east of the chumak road, north of the river (so
  // it never stands in Did Prokip's forest, far to the south-east); its inside
  // is the tunnel
  lazna: { x: 2400, y: 1180, w: 1200, h: 300 },
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
// The windmill (vitriak): a post mill, its body one room of boards. The
// millstones turn under their hopper in the middle of the back, the grain
// bin stands on the left, sacks of flour on the right; a ladder climbs to
// the sails' loft. Footprint 150×130, the door at x 52…98.
export const MLYN_ROOM = {
  millstones: { x: 46, y: BACK_WALL + 4, w: 54, h: 30 },
  bin: { x: 14, y: 66, w: 24, h: 40 },
  sacks: { x: 108, y: BACK_WALL + 2, w: 28, h: 30 },
} as const satisfies Record<string, Rect>;

// Where to stand to open the skrynia (in the world).
export const PUSTKA_CHEST = { x: 1084 + 123, y: 140 + 76 };

// The hollow of the old oak in the south forest: a tiny round room inside
// the trunk, Motrya's nest of moss and feathers at the back, her little
// cauldron by the wall. Footprint 110×100, the doorway (the hollow) at
// x 32…78.
export const DUPLO_ROOM = {
  nest: { x: 54, y: BACK_WALL, w: 42, h: 22 },
  cauldron: { x: 16, y: 38, w: 18, h: 16 },
} as const satisfies Record<string, Rect>;
// The chamber dug into the steppe kurhan, under its stone baba: an old
// grave-slab, roots and timber props, and Opanas's straw bed. Footprint
// 170×120, the timbered entrance at x 62…108.
export const KURHAN_ROOM = {
  slab: { x: 30, y: BACK_WALL + 2, w: 64, h: 22 },
  bed: { x: 118, y: BACK_WALL + 2, w: 38, h: 30 },
} as const satisfies Record<string, Rect>;
// Beelzebub's cave on Lysa Hora's north-east slope: his stone bed, a pool
// of something hot that smells of sulphur, a heap of tribute. Footprint
// 180×136, the mouth at x 67…113.
export const PECHERA_ROOM = {
  bed: { x: 40, y: BACK_WALL + 2, w: 96, h: 34 },
  pool: { x: 140, y: 80, w: 26, h: 22 },
  hoard: { x: 16, y: 84, w: 26, h: 18 },
} as const satisfies Record<string, Rect>;

// The kaplytsia: one small room of pine logs. The iconostas (a carved,
// painted screen of icons) closes the back with the holy doors in its
// middle; before it the analoy (a lectern) with the book open, and the
// kanun, the stand of candles people light for their dead; a bench
// along each side wall for the old. Footprint 140×124, the door at
// x 47…93.
export const KAPLYTSIA_ROOM = {
  iconostas: { x: 14, y: BACK_WALL, w: 112, h: 10 },
  analoy: { x: 62, y: 60, w: 16, h: 12 },
  kanun: { x: 22, y: 58, w: 14, h: 12 },
  lavaW: { x: 14, y: 82, w: 10, h: 26 },
  lavaE: { x: 116, y: 82, w: 10, h: 26 },
} as const satisfies Record<string, Rect>;

// Did Prokip's khatka: one low, smoky room. His pich in the corner, a
// shelf of jars and pots along the back wall, the table where he reads
// water in a bowl, a lava by the pich where the cat sleeps when the
// pich is too hot even for a cat. Footprint 220×170, the door at
// x 87…133.
export const PROKIP_ROOM = {
  pich: { x: 14, y: BACK_WALL, w: 64, h: 60 },
  shelf: { x: 120, y: BACK_WALL, w: 86, h: 12 },
  table: { x: 136, y: 80, w: 52, h: 30 },
  lava: { x: 14, y: 116, w: 40, h: 12 },
} as const satisfies Record<string, Rect>;

// The Serpent's Cave. Footprint 760×460, the mouth at x 357…403. From the
// mouth the hall runs back to two ledges with a channel between them; above
// them is the upper cavern: Zmiy's lair in the west (the crack in its back
// wall is the hidden tunnel), the pool in the middle, Omelko's nook in the
// east. Onufriy keeps his cell in the south-west corner of the hall.
//   ledgeW, ledgeE — the rock shelves; pool — water, not to be walked
//   stalag1…4      — stalagmites in the hall
//   mat, table     — Onufriy's straw mat and his table with the candle
//   seat           — Omelko's flat rock
//   curl           — the serpent's body round his hoard (always there)
// While he is awake his coil also lies across the passage into the lair
// (ZMIY_COIL); a song that moves him draws it back.
export const ZMIIEVA_ROOM = {
  ledgeW: { x: 14, y: 215, w: 200, h: 50 },
  ledgeE: { x: 546, y: 215, w: 200, h: 50 },
  pool: { x: 300, y: 112, w: 120, h: 76 },
  stalag1: { x: 262, y: 322, w: 26, h: 20 },
  stalag2: { x: 470, y: 344, w: 26, h: 20 },
  stalag3: { x: 604, y: 312, w: 30, h: 22 },
  stalag4: { x: 648, y: 392, w: 28, h: 20 },
  mat: { x: 40, y: 396, w: 96, h: 30 },
  table: { x: 150, y: 322, w: 38, h: 26 },
  seat: { x: 628, y: 128, w: 54, h: 24 },
  curl: { x: 80, y: 112, w: 150, h: 88 },
} as const satisfies Record<string, Rect>;
export const ZMIY_COIL: Rect = { x: 214, y: BACK_WALL, w: 70, h: 215 - BACK_WALL };

// The tunnel: 1200×300, no door. Boulders stand out alternately from the
// ceiling and the floor, so the way winds through them: a long, slow walk.
// In the middle the tunnel widens into a chamber where the smuggler Sydir
// keeps camp (casks, crates, a bedroll); the sentry's bones lie in the lower
// lane. The crack up to the cave is at the west end, the ladder up to the
// chapel at the east.
export const LAZNA_ROOM = {
  a: { x: 150, y: BACK_WALL, w: 60, h: 110 },
  b: { x: 290, y: 170, w: 60, h: 116 },
  c: { x: 430, y: BACK_WALL, w: 60, h: 110 },
  d: { x: 570, y: 170, w: 60, h: 116 },
  casks: { x: 700, y: BACK_WALL + 2, w: 76, h: 32 },
  crates: { x: 820, y: BACK_WALL + 2, w: 52, h: 28 },
  bedroll: { x: 720, y: 232, w: 92, h: 28 },
  e: { x: 940, y: BACK_WALL, w: 60, h: 110 },
  f: { x: 1060, y: 170, w: 60, h: 116 },
} as const satisfies Record<string, Rect>;

function furniture(id: HouseId): Rect[] {
  if (id === "prokip") return Object.values(PROKIP_ROOM);

  if (id === "zmiieva") return Object.values(ZMIIEVA_ROOM);
  if (id === "lazna") return Object.values(LAZNA_ROOM);
  if (id === "kaplytsia") return Object.values(KAPLYTSIA_ROOM);
  if (id === "duplo") return Object.values(DUPLO_ROOM);
  if (id === "kurhan") return Object.values(KURHAN_ROOM);
  if (id === "pechera") return Object.values(PECHERA_ROOM);
  if (id === "korchma") return Object.values(KORCHMA_ROOM);
  if (id === "pustka") return Object.values(PUSTKA_ROOM);
  if (id === "mlyn") return Object.values(MLYN_ROOM);
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
  // the tunnel has no door: its south wall is whole
  const south: Rect[] = id === "lazna"
    ? [{ x: r.x, y: r.y + r.h - WALL, w: r.w, h: WALL }]
    : [
        { x: r.x, y: r.y + r.h - WALL, w: half, h: WALL },
        { x: r.x + r.w - half, y: r.y + r.h - WALL, w: half, h: WALL },
      ];
  return [
    { x: r.x, y: r.y, w: r.w, h: BACK_WALL },
    { x: r.x, y: r.y, w: WALL, h: r.h },
    { x: r.x + r.w - WALL, y: r.y, w: WALL, h: r.h },
    ...south,
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
