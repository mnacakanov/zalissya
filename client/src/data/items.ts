import { t } from "../i18n";
// Gatherable herbs — all keep their Ukrainian names; gathering any of them
// counts toward the Herbalism skill. Each kind has its own colours so the
// patches read differently in the grass.
export type HerbKind = "kropyva" | "polyn" | "kalendula" | "zvirobiy" | "dereviy";

export type HerbDef = {
  name: string;
  pron: string;
  gloss: string;
  glow: string; // rgba prefix "r,g,b" for the patch halo
  flower: string;
  flowerCore: string;
  leaf: string;
};

export const HERBS: Record<HerbKind, HerbDef> = {
  kropyva: { name: t("item.HERBS.name.0"), pron: t("item.HERBS.pron.0"), gloss: t("item.HERBS.gloss.0"), glow: "120,220,110", flower: "#b9e39a", flowerCore: "#eaf7d0", leaf: "#3f7a2e" },
  polyn: { name: t("item.HERBS.name.1"), pron: t("item.HERBS.pron.1"), gloss: t("item.HERBS.gloss.1"), glow: "200,205,190", flower: "#d8dcc8", flowerCore: "#f2f2e2", leaf: "#7d8a72" },
  kalendula: { name: t("item.HERBS.name.2"), pron: t("item.HERBS.pron.2"), gloss: t("item.HERBS.gloss.2"), glow: "255,150,50", flower: "#f28c1e", flowerCore: "#ffd76a", leaf: "#4c7a2e" },
  zvirobiy: { name: t("item.HERBS.name.3"), pron: t("item.HERBS.pron.3"), gloss: t("item.HERBS.gloss.3"), glow: "255,205,70", flower: "#f2c416", flowerCore: "#ffe89a", leaf: "#4c7a2e" },
  dereviy: { name: t("item.HERBS.name.4"), pron: t("item.HERBS.pron.4"), gloss: t("item.HERBS.gloss.4"), glow: "245,242,230", flower: "#f5f2e6", flowerCore: "#e8c96a", leaf: "#557d3a" },
};

// --- Village life spots (non-combat interactivity) --------------------------

// The fishing shore: stand on the pond's west bank, cast toward the water.
export const FISH_SPOT = { x: 1150, y: 1080 };
export const BOBBER = { x: 1235, y: 1062 };
// A crust of bread waits by the campfire for whoever thinks of the Domovyk.
export const CRUST_SPOT = { x: 772, y: 660 };
// The cooking fire's south side — stand here to work the pot that now
// hangs over the campfire. Soup wants 1 fish + 1 herb from the satchel.
export const COOK_SPOT = { x: 840, y: 672 };
// Radek's anvil, inside the forge — workable once the forge is lit
// (the "horseshoe" flag). Hammering has a short cooldown between pieces.
export const FORGE_SPOT = { x: 330, y: 764 };
// Vesna's herb drying rack, south of the north-east hut — her alchemy
// bench. A tonic wants 2 herbs from the satchel.
export const BREW_SPOT = { x: 1224, y: 340 };
// Lumps of bog iron glinting in the pond mud — Radek's forge needs iron.
export const IRON_SPOTS: Array<{ x: number; y: number }> = [
  { x: 1150, y: 968 },
  { x: 1492, y: 1132 },
  { x: 1300, y: 1182 },
];

// What the pond gives up. Karas (карась, crucian carp) keeps its Ukrainian
// name like the herbs do; the rest of the catch is plain village fare.
export type FishId = "karas" | "perch" | "roach" | "tench" | "boot" | "pike";
export const FISH_CATCH: Array<{ id: FishId; name: string; w: number }> = [
  { id: "karas", name: t("item.karas.name.0"), w: 34 },
  { id: "perch", name: t("item.perch.name.0"), w: 24 },
  { id: "roach", name: t("item.roach.name.0"), w: 20 },
  { id: "tench", name: t("item.tench.name.0"), w: 12 },
  { id: "boot", name: t("item.boot.name.0"), w: 6 },
  { id: "pike", name: t("item.pike.name.0"), w: 4 },
];

export const WISH_LINES: string[] = [
  t("item.WISH_LINES.0"),
  t("item.WISH_LINES.1"),
  t("item.WISH_LINES.2"),
  t("item.WISH_LINES.3"),
  t("item.WISH_LINES.4"),
];

export const HERB_SPOTS: Array<{ x: number; y: number; kind: HerbKind }> = [
  { x: 520, y: 560, kind: "kropyva" }, { x: 1080, y: 520, kind: "polyn" },
  { x: 700, y: 980, kind: "kalendula" }, { x: 1050, y: 990, kind: "zvirobiy" },
  { x: 420, y: 880, kind: "dereviy" }, { x: 980, y: 760, kind: "kropyva" },
  { x: 620, y: 340, kind: "polyn" }, { x: 900, y: 900, kind: "kalendula" },
  { x: 350, y: 420, kind: "zvirobiy" }, { x: 1380, y: 620, kind: "dereviy" },
];