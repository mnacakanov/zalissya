import { flagCount } from "./flags";
import { type StatKey, type StatLine } from "./stats";

// --- Carry capacity ---------------------------------------------------------
// What you can haul is set by Strength: cap = 6 + 2×STR total. Weights:
// a lump of bog iron 3, a forged piece 2, a fish 1, an herb 1, a nichnyk
// 0 (moon-flowers weigh nothing — the mountain insists). Soup, tonics,
// keepsakes and the purse of chervintsi (systems/trade.ts) ride in
// pockets and pouches and are not on the table.
// Iron already handed to Radek (the "horseshoe" flag) is his problem
// now, not your back's. Ending up OVER the cap (a STR bonus lapsing, or
// three hauled lumps at a low STR) never deletes anything — it only
// blocks new pickups until the load is back under the limit.
// What one of each weighs (a nichnyk and a chervinets: nothing). The
// Character sheet's satchel list reads the same table (systems/satchel.ts).
export const UNIT_WEIGHT = { fish: 1, herbStock: 1, iron: 3, forged: 2 } as const;

export function carryCap(stats: Record<StatKey, StatLine>): number {
  return 6 + 2 * stats.str.total;
}
export function carriedWeight(flags: ReadonlySet<string>): number {
  const iron = flags.has("horseshoe") ? 0 : flagCount(flags, "iron");
  return (
    flagCount(flags, "fish") * UNIT_WEIGHT.fish +
    flagCount(flags, "herbStock") * UNIT_WEIGHT.herbStock +
    iron * UNIT_WEIGHT.iron +
    flagCount(flags, "forged") * UNIT_WEIGHT.forged
  );
}
// The load WITHOUT hauled iron — what the satchel itself holds. Digging
// iron is checked against this (plus the new lump): you haul lumps in
// your arms, one trip at a time, so the forge quest can never deadlock
// on its own weight — but a satchel stuffed with fish still leaves you
// no way to haul, and once dug, iron counts toward carriedWeight()
// like everything else until Radek takes it off your hands.
export function satchelWeight(flags: ReadonlySet<string>): number {
  return (
    flagCount(flags, "fish") * UNIT_WEIGHT.fish +
    flagCount(flags, "herbStock") * UNIT_WEIGHT.herbStock +
    flagCount(flags, "forged") * UNIT_WEIGHT.forged
  );
}