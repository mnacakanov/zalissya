export const WORLD_W = 1680;
export const WORLD_H = 1260;
export const PLAYER_SPEED = 175;
export const PLAYER_R = 13;
export const SPAWN = { x: 840, y: 760 };

export type AreaId = "village" | "lysa" | "hut0" | "hut1";
export const LYSA_W = 1280;
export const LYSA_H = 920;
export const LYSA_SPAWN = { x: 92, y: 470 }; // west trailhead, arriving from Zalissya
export const VILLAGE_RETURN = { x: 1618, y: 452 }; // east edge of the clearing
// Hut interiors: one shared room size, entered from the village doors.
// hut0 is the Domovyk's north-west hut (door front at village 384,314);
// hut1 is Vesna's south-east hut (door front at village 1285,796) —
// the hut she stands beside outdoors, by her garden. (Her drying
// rack stays up by the north-east hut; the hut itself is hers.)
export const HUT_W = 820;
export const HUT_H = 600;
export const HUT_SPAWN = { x: 410, y: 462 }; // just inside the interior door
export const HUT_DOOR_IN = { x: 410, y: 478 }; // the interior door mat (exit prompt)
export const VILLAGE_FROM_HUT0 = { x: 384, y: 352 }; // back out, at the NW hut's door
export const VILLAGE_FROM_HUT1 = { x: 1285, y: 824 }; // back out, at the SE hut's door
export function isHutArea(area: AreaId): boolean {
  return area === "hut0" || area === "hut1";
}
// The village trail out: the east edge, between the two trail-marker pines.
export const TRAIL_Y_MIN = 380;
export const TRAIL_Y_MAX = 530;
export function worldSize(area: AreaId): { w: number; h: number } {
  if (area === "lysa") return { w: LYSA_W, h: LYSA_H };
  if (isHutArea(area)) return { w: HUT_W, h: HUT_H };
  return { w: WORLD_W, h: WORLD_H };
}