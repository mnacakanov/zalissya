import { toWorld } from "./houses";

// --- Where the sabbath hides by day (systems/sabbath.ts) ---------------------------
// Out of sabbath hours the witches, the warlock and their master keep out of
// sight, each in a place of their own that a kobzar can find and walk into
// (each is a walk-in building in data/houses.ts):
//   Solokha   — inside the windmill, on a flour sack, a widow like any other
//               by day (mlyn)
//   Motrya    — asleep in the hollow of the old oak in the south forest (duplo)
//   Opanas    — the warlock, in the chamber dug into the steppe kurhan under
//               its stone baba (kurhan)
//   Beelzebub — snoring on his stone bed in the cave on Lysa Hora's slope
//               (pechera)
// The Chort keeps his old day-place by the millstone.
export const HIDEOUTS: Record<"solokha" | "motrya" | "opanas" | "beelzebub", { x: number; y: number }> = {
  solokha: toWorld("mlyn", { x: 116, y: 98 }),
  motrya: toWorld("duplo", { x: 74, y: 72 }),
  opanas: toWorld("kurhan", { x: 134, y: 90 }),
  beelzebub: toWorld("pechera", { x: 88, y: 66 }),
};
export const HIDEOUT_IDS = new Set(Object.keys(HIDEOUTS));
