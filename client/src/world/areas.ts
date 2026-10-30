// One world: the khutir (x 0…1680), the steppe east of it, and Lysa Hora at
// the far end (see data/lysa.ts LYSA_ORIGIN). Hut interiors are separate.
export const VILLAGE_W = 1680;
export const WORLD_W = 3980;
export const WORLD_H = 2300;
// Past this x (and north of the river country) the player is "on Lysa
// Hora" (the HUD, the sabbath rules).
export const LYSA_BORDER_X = 2620;
export const LYSA_BORDER_Y = 1150;
export const PLAYER_SPEED = 175;
export const PLAYER_R = 13;
export const SPAWN = { x: 840, y: 760 };

export type AreaId = "village" | "lysa" | "hut0" | "hut1";
export const LYSA_W = 1280;
export const LYSA_H = 920;
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
export function worldSize(area: AreaId): { w: number; h: number } {
  if (isHutArea(area)) return { w: HUT_W, h: HUT_H };
  return { w: WORLD_W, h: WORLD_H };
}