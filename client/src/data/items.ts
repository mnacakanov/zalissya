// Gatherable herbs — all keep their Ukrainian names; gathering any of them
// counts toward the Herbalism skill. Each kind has its own colours so the
// patches read differently in the grass.
export type HerbKind = "kropyva" | "polyn" | "kalendula" | "zvirobij" | "derevij";

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
  kropyva: { name: "Kropyva", pron: "kro-py-VAH", gloss: "nettle", glow: "120,220,110", flower: "#b9e39a", flowerCore: "#eaf7d0", leaf: "#3f7a2e" },
  polyn: { name: "Polyn", pron: "po-LYN", gloss: "wormwood", glow: "200,205,190", flower: "#d8dcc8", flowerCore: "#f2f2e2", leaf: "#7d8a72" },
  kalendula: { name: "Kalendula", pron: "ka-len-DOO-lah", gloss: "calendula", glow: "255,150,50", flower: "#f28c1e", flowerCore: "#ffd76a", leaf: "#4c7a2e" },
  zvirobij: { name: "Zvirobij", pron: "zvee-ro-BEEY", gloss: "St. John's wort", glow: "255,205,70", flower: "#f2c416", flowerCore: "#ffe89a", leaf: "#4c7a2e" },
  derevij: { name: "Derevij", pron: "deh-reh-VEEY", gloss: "yarrow", glow: "245,242,230", flower: "#f5f2e6", flowerCore: "#e8c96a", leaf: "#557d3a" },
};

// --- Village life spots (non-combat interactivity) --------------------------

// The fishing shore: stand on the pond's west bank, cast toward the water.
export const FISH_SPOT = { x: 1150, y: 1040 };
export const BOBBER = { x: 1235, y: 1022 };
// A crust of bread waits by the campfire for whoever thinks of the Domovyk.
export const CRUST_SPOT = { x: 772, y: 660 };
// The pich inside the Domovyk's hut — where offerings go, now that the
// hut has an inside. Stand south of the stove, inside hut0.
export const PICH_IN_SPOT = { x: 185, y: 226 };
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
  { x: 1150, y: 928 },
  { x: 1492, y: 1092 },
  { x: 1300, y: 1142 },
];

// What the pond gives up. Karas (карась, crucian carp) keeps its Ukrainian
// name like the herbs do; the rest of the catch is plain village fare.
export const FISH_CATCH: Array<{ name: string; w: number }> = [
  { name: "a karas", w: 34 },
  { name: "a plump perch", w: 24 },
  { name: "a roach", w: 20 },
  { name: "a little tench", w: 12 },
  { name: "an old boot (the pond gives back)", w: 6 },
  { name: "a grand old pike!", w: 4 },
];

export const WISH_LINES: string[] = [
  "You drop a pebble in. It falls a long, long time. Somewhere far below, something turns over in its sleep — and settles. The water gives back nothing but your own face, a little paler.",
  "The pebble sinks. For a moment the well smells of rain that has not fallen yet. They say the well keeps every wish it is ever given, stacked like coins.",
  "Plip. A ring spreads on the black water below. In the ring, just for a heartbeat, the stars are wrong — too many, and too close. Then it is only a well again.",
  "You wish quietly, the way the old ones teach: not for gold, not for glory — those wishes curdle. The rope creaks, approving.",
  "Down in the dark, something small and silver turns once — a fish where no fish should live. The znak harky say a well-fish means the wish was heard.",
];

export const HERB_SPOTS: Array<{ x: number; y: number; kind: HerbKind }> = [
  { x: 520, y: 560, kind: "kropyva" }, { x: 1080, y: 520, kind: "polyn" },
  { x: 700, y: 980, kind: "kalendula" }, { x: 1240, y: 900, kind: "zvirobij" },
  { x: 420, y: 880, kind: "derevij" }, { x: 980, y: 760, kind: "kropyva" },
  { x: 620, y: 340, kind: "polyn" }, { x: 900, y: 900, kind: "kalendula" },
  { x: 350, y: 420, kind: "zvirobij" }, { x: 1380, y: 620, kind: "derevij" },
];