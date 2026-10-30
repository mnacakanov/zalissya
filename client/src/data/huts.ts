import { type AreaId } from "../world/areas";
import { type Rect } from "../world/geometry";

// --- Hut interior layout ----------------------------------------------------
// One room shape for both enterable huts: log walls 30 thick around a
// plank floor, the door a gap in the south wall centred on x=410 (the
// gap is wide enough for the player's collision circle to pass, and
// walking out of it — y past the room's south edge — exits to the
// village, Lysa-trail style). Furniture differs per hut: the Domovyk's
// hut0 is built around the pich (the great clay stove, NW) with a
// woodpile, a table, and a bed; Vesna's hut1 has her bed, a work table,
// a cauldron hearth in the NE corner, and her herb shelf on the north
// wall. Only hut0 and hut1 exist — the forge and the north-east hut
// have no doors that open.
export const HUT_WALLS: Rect[] = [
  { x: 70, y: 64, w: 680, h: 30 }, // north
  { x: 70, y: 64, w: 30, h: 472 }, // west
  { x: 720, y: 64, w: 30, h: 472 }, // east
  { x: 70, y: 506, w: 302, h: 30 }, // south, west of the door gap
  { x: 448, y: 506, w: 302, h: 30 }, // south, east of the door gap
];
export const HUT0_SOLID: Rect[] = [
  ...HUT_WALLS,
  { x: 110, y: 94, w: 150, h: 96 }, // the pich
  { x: 110, y: 210, w: 64, h: 36 }, // the woodpile
  { x: 345, y: 280, w: 130, h: 60 }, // the table
  { x: 560, y: 94, w: 150, h: 70 }, // the bed
];
export const HUT1_SOLID: Rect[] = [
  ...HUT_WALLS,
  { x: 110, y: 94, w: 150, h: 70 }, // Vesna's bed
  { x: 600, y: 94, w: 80, h: 80 }, // the cauldron hearth
  { x: 330, y: 270, w: 130, h: 60 }, // her work table
  { x: 300, y: 94, w: 240, h: 18 }, // the herb shelf
];
export function hutSolids(area: AreaId): Rect[] {
  return area === "hut1" ? HUT1_SOLID : HUT0_SOLID;
}