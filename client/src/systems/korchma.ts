import { flagCount, flagHas } from "./flags";
import { type Mood } from "./songs";

// --- The korchma's evenings ---------------------------------------------------
// The kobzar plays once an evening (systems/songs.ts fireCheck: the same
// "playedDay" counter), and now he chooses where: the campfire, where the
// khutir sits as a family, or the korchma on the chumak road, where the
// drinkers have moods of their own. On the same evening the two rooms often
// want different songs; reading both is the craft.
//   the khutir mourns            → the korchma drinks quietly too (sad)
//   the chumaky are feasting     → the korchma roars with them (happy)
//   every fourth night           → the drinkers turn maudlin and weep for
//                                  the Sich, their mothers and their youth (sad)
//   any other night              → merry (happy)
// Odarka pays in varenyky (a meal), the way the khutir pays in kulish.

export type KorchmaReason = "mourning" | "chumaky" | "maudlin" | "merry";

export function korchmaMood(day: number, flags: ReadonlySet<string>): { mood: Mood; reason: KorchmaReason } {
  const died = flagCount(flags, "ostapDiedDay");
  if (died > 0 && (day === died || day === died + 1)) return { mood: "sad", reason: "mourning" };
  if (flagHas(flags, "ostapHealed") && !flagHas(flags, "chumakyGone")) return { mood: "happy", reason: "chumaky" };
  if (day % 4 === 1) return { mood: "sad", reason: "maudlin" };
  return { mood: "happy", reason: "merry" };
}

// Odarka's supper: a bowl of varenyky for one fish (or a song, evenings).
export const SUPPER_PRICE = 1;
