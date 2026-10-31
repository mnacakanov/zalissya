import { LYSA_ORIGIN } from "./lysa";
import { KURHAN_STEPPE, WINDMILL } from "./village";

// --- Where the sabbath hides by day (systems/sabbath.ts) ---------------------------
// Out of sabbath hours the witches, the warlock and their master keep out of
// sight, each in a place of their own that a kobzar can stumble on:
//   Solokha   — on the windmill's step, a widow like any other by day
//   Motrya    — asleep in the hollow of the old oak in the south forest
//   Opanas    — the warlock, in a pit dug under the stone baba of the steppe
//               kurhan
//   Beelzebub — snoring in a cave on Lysa Hora's north-east slope (he is
//               heard, not seen)
// The Chort keeps his old day-place by the millstone.
export const HOLLOW_OAK = { x: 980, y: 1850 };
export const LYSA_CAVE = { x: LYSA_ORIGIN.x + 1040, y: LYSA_ORIGIN.y + 196 };
export const KURHAN_PIT = { x: KURHAN_STEPPE.x + 8, y: KURHAN_STEPPE.y + 26 };

export const HIDEOUTS: Record<"solokha" | "motrya" | "opanas", { x: number; y: number }> = {
  solokha: { x: WINDMILL.x + 4, y: WINDMILL.y + 34 },
  motrya: { x: HOLLOW_OAK.x + 2, y: HOLLOW_OAK.y + 16 },
  opanas: { x: KURHAN_PIT.x, y: KURHAN_PIT.y + 14 },
};
export const HIDEOUT_IDS = new Set(Object.keys(HIDEOUTS));
