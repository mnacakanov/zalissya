import { flagCount, flagHas } from "./flags";

// --- The chumaky: a caravan, a fever, and a choice -------------------------
// At the dawn of day 2 a chumak caravan (salt traders back from Crimea)
// camps on the east road. Their youngest, Ostap, is burning with fever. The
// otaman will not let them into the khutir and has forbidden Vesna to go:
// he lost his own village to the plague as a boy, and in his mind "chumak"
// and "чума" are the same word. Nobody is a villain here.
//
// What the kobzar does is the story — there is no free right answer:
//   · talk the otaman round (CHA 3 — the khutir has to trust you first):
//       Vesna goes openly, Ostap lives, the otaman learns something;
//   · go against the otaman's word: take Ostap a tonic (brew it, or Vesna
//       quietly gives you one): Ostap lives, the otaman remembers;
//   · do nothing, or not in time: at the next dawn Ostap dies. The chumaky
//       bury him by the road and sing «Ой полечко, поле»; the khutir mourns,
//       and the otaman has to live with it. So do you.
// The caravan moves on at the dawn after it is settled, one way or another.
// A grave stays by the road if Ostap died.
//
// State is all flags: chumakyArrivedDay=n, ostapHealed | ostapDied +
// ostapDiedDay=n, chumakyResolvedDay=n, chumakyGone, and how it was solved:
// otamanRelented | defiedOtaman.

export type OstapState = "sick" | "healed" | "dead";

export const PERSUADE_CHA = 3;

export function ostapState(flags: ReadonlySet<string>): OstapState {
  if (flagHas(flags, "ostapDied")) return "dead";
  if (flagHas(flags, "ostapHealed")) return "healed";
  return "sick";
}

export function chumakyPresent(flags: ReadonlySet<string>): boolean {
  return flagCount(flags, "chumakyArrivedDay") > 0 && !flagHas(flags, "chumakyGone");
}

// Flags to add when a new day dawns (called once per dawn crossed, with
// that day's number).
export function chumakDawn(flags: ReadonlySet<string>, newDay: number): string[] {
  const out: string[] = [];
  const arrived = flagCount(flags, "chumakyArrivedDay");
  if (!arrived) {
    if (newDay >= 2) out.push(`chumakyArrivedDay=${newDay}`);
    return out;
  }
  if (flagHas(flags, "chumakyGone")) return out;
  const state = ostapState(flags);
  if (state === "sick" && newDay > arrived) {
    out.push("ostapDied", `ostapDiedDay=${newDay}`, `chumakyResolvedDay=${newDay}`);
    return out;
  }
  const resolved = flagCount(flags, "chumakyResolvedDay");
  if (state !== "sick" && resolved > 0 && newDay > resolved) out.push("chumakyGone");
  return out;
}

// The ways to save Ostap, as flags to add (the day it happened).
export function healByPersuasion(day: number): string[] {
  return ["ostapHealed", "otamanRelented", `chumakyResolvedDay=${day}`];
}
export function healByDefiance(day: number): string[] {
  return ["ostapHealed", "defiedOtaman", `chumakyResolvedDay=${day}`];
}
