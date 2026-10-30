import { t } from "../i18n";
import { type Rect } from "../world/geometry";
import { type Npc } from "./characters";

// --- The chumak camp, on the east road (see systems/chumaky.ts) -------------
// The caravan came up from the steppe road; they camp between the fire and
// the Lysa Hora trail, a cart of Crimean salt and two grey oxen.
export const CART = { x: 1260, y: 744 };
export const OXEN: Array<{ x: number; y: number; face: number }> = [
  { x: 1346, y: 738, face: 1 },
  { x: 1372, y: 778, face: -1 },
];
export const GRAVE = { x: 1470, y: 770 };
// While the caravan is here, the cart and the oxen block the way.
export const CAMP_SOLID: Rect[] = [
  { x: CART.x - 34, y: CART.y - 12, w: 68, h: 24 },
  ...OXEN.map((o) => ({ x: o.x - 22, y: o.y - 8, w: 44, h: 16 })),
];

export const GNAT: Npc = {
  id: "gnat", name: t("char.gnat.name"), pron: t("char.gnat.pron"), role: t("char.gnat.role"),
  x: 1224, y: 794, tunic: "#24201c", hair: "#a29a8c", style: "chumak",
};
// Ostap lies on a sheepskin by the cart while the fever has him; up and
// about (and standing) once he is well.
export const OSTAP: Npc = {
  id: "ostap", name: t("char.ostap.name"), pron: t("char.ostap.pron"), role: t("char.ostap.role"),
  x: 1300, y: 800, tunic: "#2a2420", hair: "#6b4a2a", style: "sick",
};
export const OSTAP_WELL: Npc = { ...OSTAP, role: t("char.ostap.roleWell"), style: "chumak", y: 790 };
