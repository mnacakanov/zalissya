import { flagCount, flagHas } from "./flags";

// --- «Люлька отамана»: tobacco for the otaman's pipe -------------------------
// The otaman has a pipe and no tobacco ("Люлька є, тютюну нема" — he has
// been grumbling it since the first evening). The old tobacco field across
// the river was planted by a Cossack who never came back from the Sich; it
// has gone wild, but the leaves are still there.
//   1. ask the otaman about his pipe                  → tobaccoQuest
//   2. pick three tobacco leaves across the river      → tobaccoLeaf0..2, tobaccoLeaves=n
//   3. fetch hemp fibre from the hemp field to tie them → hempFibre
//   4. hang the bundle on Vesna's drying rack          → tobaccoDryingDay=n
//   5. it dries overnight (at the next dawn)           → tobaccoDry
//   6. bring it to the otaman                          → tobaccoGiven, lyulka
// The reward is his old spare pipe: a smoke before Viy's vigil steadies the
// hand — +2 Nerve at the vigil.

export type TobaccoStage = "none" | "gather" | "hang" | "drying" | "ready" | "done";

export const LEAVES_NEEDED = 3;
export const LYULKA_NERVE = 2;

export function tobaccoStage(flags: ReadonlySet<string>): TobaccoStage {
  if (flagHas(flags, "tobaccoGiven")) return "done";
  if (flagHas(flags, "tobaccoDry")) return "ready";
  if (flagCount(flags, "tobaccoDryingDay") > 0) return "drying";
  if (!flagHas(flags, "tobaccoQuest")) return "none";
  if (flagCount(flags, "tobaccoLeaves") >= LEAVES_NEEDED && flagHas(flags, "hempFibre")) return "hang";
  return "gather";
}

// Flags to add at a dawn (called for each dawn crossed, with that day).
export function tobaccoDawn(flags: ReadonlySet<string>, newDay: number): string[] {
  const hung = flagCount(flags, "tobaccoDryingDay");
  return hung > 0 && newDay > hung && !flagHas(flags, "tobaccoDry") ? ["tobaccoDry"] : [];
}
