import { t } from "../i18n";
import type { Rect } from "../world/geometry";
import type { Npc } from "./characters";
import { HOUSE_RECTS, toWorld, ZMIY_COIL } from "./houses";

// --- The Serpent's Cave, the tunnel under the river, and who lives in them ----------
// South of the river, east of the old oak, a rocky hill stands in the forest
// (data/houses.ts HOUSE_RECTS.zmiieva). Children are told a Zmiy sleeps in it;
// the children are right. Inside:
//   Onufriy — a hermit monk who keeps a candle at the mouth of the cave
//   Omelko  — a blind old kobzar in the east nook, who sees the dark fine
//   Zmiy    — the serpent, asleep on his hoard in the west lair; his coil lies
//             across the way to the crack in the back wall until a song moves him
//   Vohnyk  — a little wandering flame over the pool, bright and forgetful
//   bats, cave salamanders (the black-and-yellow kind of the Carpathians)
// The crack behind the serpent is the way into the tunnel (лаз), dug by the first
// men of Zalissya when the Tatars came: it runs under the river and the fields to
// a hatch beneath the rug in the kaplytsia. In the middle of it a chumak called
// Sydir keeps a smuggler's camp, and the bones of a sentry lie by the wall.
//
// Story flags (all plain, systems/cave.ts reads them):
//   caveHeard   — the kobzar has heard of the cave, or been in it (it shows on the map)
//   lazKnown    — he knows a tunnel exists (the chapel hatch can be lifted)
//   zmiyLulled  — he sang the serpent to sleep; the coil is drawn back
//   lazOpen     — he has been through the crack at least once
//   lazChapel   — he has used the chapel hatch (the rug lies folded back)
//   zmiyHoard, sentryPouch — the coins are taken

export const ONUFRIY: Npc = {
  id: "onufriy", name: t("char.onufriy.name"), pron: t("char.onufriy.pron"), role: t("char.onufriy.role"),
  ...toWorld("zmiieva", { x: 98, y: 372 }), tunic: "#3a302a", hair: "#d8d2c4", style: "hermit",
};
export const OMELKO: Npc = {
  id: "omelko", name: t("char.omelko.name"), pron: t("char.omelko.pron"), role: t("char.omelko.role"),
  ...toWorld("zmiieva", { x: 655, y: 152 }), tunic: "#8a7a60", hair: "#e6e2d8", style: "oldkobzar", pose: "sit",
};
export const ZMIY: Npc = {
  id: "zmiy", name: t("char.zmiy.name"), pron: t("char.zmiy.pron"), role: t("char.zmiy.role"),
  ...toWorld("zmiieva", { x: 150, y: 190 }), tunic: "#3e5a3a", hair: "#2a3a28", style: "zmiy",
};
export const VOHNYK: Npc = {
  id: "vohnyk", name: t("char.vohnyk.name"), pron: t("char.vohnyk.pron"), role: t("char.vohnyk.role"),
  ...toWorld("zmiieva", { x: 360, y: 96 }), tunic: "#f0d890", hair: "#fff2c0", style: "vohnyk",
};
export const SYDIR: Npc = {
  id: "sydir", name: t("char.sydir.name"), pron: t("char.sydir.pron"), role: t("char.sydir.role"),
  ...toWorld("lazna", { x: 800, y: 150 }), tunic: "#5a4430", hair: "#3a2a1c", style: "chumak",
};

// Who stands where: the cave's people only while the kobzar is in the cave, the
// tunnel's only while he is in the tunnel (App.tsx adds them to the scene).
export const CAVE_CHARS: Npc[] = [ONUFRIY, OMELKO, ZMIY, VOHNYK];
export const TUNNEL_CHARS: Npc[] = [SYDIR];
export const CAVE_CHAR_IDS = new Set([...CAVE_CHARS, ...TUNNEL_CHARS].map((n) => n.id));

// --- Places to press A at (world coordinates) -----------------------------------
export const CAVE_SPOTS = {
  // the crack in the lair's back wall, behind the serpent's coil
  crack: toWorld("zmiieva", { x: 50, y: 82 }),
  // the hoard under the serpent's tail, on the passage side
  hoard: toWorld("zmiieva", { x: 250, y: 190 }),
};
export const TUNNEL_SPOTS = {
  // the crack up to the cave, at the west end
  west: toWorld("lazna", { x: 66, y: 92 }),
  // the ladder up to the chapel, at the east end
  east: toWorld("lazna", { x: 1160, y: 92 }),
  // the sentry's pouch, by his bones in the lower lane
  pouch: toWorld("lazna", { x: 520, y: 240 }),
};
// the hatch under the rug in the kaplytsia
export const CHAPEL_HATCH = toWorld("kaplytsia", { x: 70, y: 98 });

// Where each way through lets you out.
export const ARRIVE = {
  cave: toWorld("zmiieva", { x: 56, y: 100 }),
  tunnelWest: toWorld("lazna", { x: 72, y: 130 }),
  tunnelEast: toWorld("lazna", { x: 1150, y: 132 }),
  chapel: toWorld("kaplytsia", { x: 70, y: 106 }),
};

// The serpent's coil across the passage, in the world (while he is awake).
export const ZMIY_COIL_WORLD: Rect = {
  x: HOUSE_RECTS.zmiieva.x + ZMIY_COIL.x, y: HOUSE_RECTS.zmiieva.y + ZMIY_COIL.y, w: ZMIY_COIL.w, h: ZMIY_COIL.h,
};

// --- Light ----------------------------------------------------------------------------
// Both places are dark whatever the hour; the kobzar's kahanets (the little
// oil lamp) lights a circle round him, and these light the rest.
export type CaveLight = { x: number; y: number; r: number; col: string; k: number };
const lamp = (id: "zmiieva" | "lazna", x: number, y: number, r: number, col: string, k = 1): CaveLight => ({ ...toWorld(id, { x, y }), r, col, k });
export const CAVE_LIGHTS: CaveLight[] = [
  lamp("zmiieva", 380, 440, 120, "255,200,120", 0.7), // the mouth: daylight leaking in
  lamp("zmiieva", 168, 340, 150, "255,190,100", 0.9), // Onufriy's candle
  lamp("zmiieva", 360, 150, 150, "120,230,210", 0.55), // the pool, faintly aglow
  lamp("zmiieva", 655, 140, 100, "255,170,90", 0.55), // Omelko's rushlight
  lamp("zmiieva", 150, 150, 110, "255,214,120", 0.5), // the hoard's glint
  lamp("zmiieva", 520, 62, 70, "150,255,170", 0.4), // glowing moss on the wall
  lamp("zmiieva", 690, 232, 60, "150,255,170", 0.35),
];
export const TUNNEL_LIGHTS: CaveLight[] = [
  lamp("lazna", 100, 52, 70, "255,190,100", 0.7), // candle niches in the wall
  lamp("lazna", 380, 188, 60, "255,190,100", 0.6),
  lamp("lazna", 640, 52, 70, "255,190,100", 0.7),
  lamp("lazna", 800, 150, 170, "255,176,90", 0.9), // Sydir's lantern
  lamp("lazna", 1080, 52, 70, "255,190,100", 0.7),
  lamp("lazna", 1160, 100, 90, "255,210,140", 0.7), // the way up
];

// --- Creatures --------------------------------------------------------------------------
// Bats hang from the back wall's stalactites; they burst out when the kobzar
// comes near or something in the cave is startled (systems/cave.ts).
export const BAT_ROOSTS: Array<{ x: number; y: number }> = [
  [300, 26], [336, 22], [372, 28], [408, 24], [452, 27], [496, 22], [540, 28], [586, 24], [150, 30],
].map(([x, y]) => toWorld("zmiieva", { x: x ?? 0, y: y ?? 0 }));
// the middle of the upper cavern, where the startled flock circles
export const BAT_CIRCLE = toWorld("zmiieva", { x: 380, y: 140 });

// cave salamanders about the pool's rim, and rats in the tunnel's lower lane
const area = (id: "zmiieva" | "lazna", r: Rect): Rect => ({ x: HOUSE_RECTS[id].x + r.x, y: HOUSE_RECTS[id].y + r.y, w: r.w, h: r.h });
export const NEWT_AREA = area("zmiieva", { x: 262, y: 92, w: 196, h: 124 });
export const NEWT_HOMES: Array<{ x: number; y: number }> = [
  [284, 204], [322, 98], [436, 150], [410, 204], [270, 130],
].map(([x, y]) => toWorld("zmiieva", { x: x ?? 0, y: y ?? 0 }));
// each rat keeps to a stretch of the lower lane between two boulders
export const RAT_HOMES: Array<{ x: number; y: number; area: Rect }> = [
  { x: 120, y: 240, a: { x: 24, y: 196, w: 250, h: 76 } },
  { x: 220, y: 262, a: { x: 24, y: 196, w: 250, h: 76 } },
  { x: 430, y: 258, a: { x: 366, y: 196, w: 190, h: 76 } },
  { x: 500, y: 226, a: { x: 366, y: 196, w: 190, h: 76 } },
].map(({ x, y, a }) => ({ ...toWorld("lazna", { x, y }), area: area("lazna", a) }));
