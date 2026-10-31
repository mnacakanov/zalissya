// One world: the khutir (x 0…1680), the steppe east of it, and Lysa Hora at
// the far end (see data/lysa.ts LYSA_ORIGIN). The khaty are walk-in places in
// that world (data/houses.ts), not rooms of their own; saves from when they
// were ("hut0", "hut1") still load, see SAVE_AREAS and App's load effect.
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
// Where a new game begins: on the forest road at the south edge of the
// world, walking north toward the khutir the kobzar has only heard of
// (signposts and the road itself lead him there: data/village.ts SIGNPOSTS).
export const ROAD_START = { x: 840, y: 2236 };

export type AreaId = "village" | "lysa";
export const LYSA_W = 1280;
export const LYSA_H = 920;
