import { bumpCount, flagCount, flagHas } from "./flags";

// --- A roof for Omelko (data/pustka.ts) ----------------------------------------------
// The pustka, Taras Dovhyi's empty khata, can be made fit to live in, and the
// blind kobzar of the cave moves in once it is. It opens only after the
// perelesnyk has been driven off Odarka's door for good (flag perelesnykGone):
// until Stepan's shape stops coming, the khutir has no mind for anything else.
//   ask         — Omelko has not yet said what he wants
//   permission  — he has; the empty khata is Myroslav's to give
//   work        — leave given: chop wood (Carpentry → STR), cut reeds at the pond,
//                 patch the roof, stack the wood and light the pich
//   ready       — all done; tell Omelko
//   done        — he lives there, and the khutir says it was well done
// Everything is a flag or a counter, and the stage is derived, never stored.
export type PustkaStage = "locked" | "ask" | "permission" | "work" | "ready" | "done";

export const WOOD_NEEDED = 6;
export const REEDS_NEEDED = 4;
export const CHOP_MINUTES = 10;
export const REED_MINUTES = 5;
export const THATCH_MINUTES = 30;
export const STACK_MINUTES = 15;

export function pustkaStage(f: ReadonlySet<string>): PustkaStage {
  if (!flagHas(f, "perelesnykGone")) return "locked";
  if (flagHas(f, "omelkoMoved")) return "done";
  if (flagHas(f, "pustkaRoof") && flagHas(f, "pustkaFire")) return "ready";
  if (flagHas(f, "pustkaLeave")) return "work";
  if (flagHas(f, "omelkoHome")) return "permission";
  return "ask";
}

export const logsChopped = (f: ReadonlySet<string>): number => Math.min(WOOD_NEEDED, flagCount(f, "logs"));
export const reedsCut = (f: ReadonlySet<string>): number => [0, 1, 2, 3].filter((i) => flagHas(f, `reed${i}`)).length;
export const reedTaken = (f: ReadonlySet<string>, i: number): boolean => flagHas(f, `reed${i}`);

// where the work may be done
export const chopAvailable = (f: ReadonlySet<string>): boolean => flagHas(f, "pustkaLeave");
export const reedAvailable = (f: ReadonlySet<string>, i: number): boolean => pustkaStage(f) === "work" && !flagHas(f, "pustkaRoof") && !reedTaken(f, i);
export const thatchAvailable = (f: ReadonlySet<string>): boolean => pustkaStage(f) === "work" && !flagHas(f, "pustkaRoof") && reedsCut(f) >= REEDS_NEEDED;
export const stackAvailable = (f: ReadonlySet<string>): boolean => pustkaStage(f) === "work" && !flagHas(f, "pustkaFire") && logsChopped(f) >= WOOD_NEEDED;

// Where the work is to be done right now, for the glint that marks it
// (render/pustka.ts drawWorkGlint). Empty outside the repair. The chopping
// block is marked only until the six logs are in, though it stays usable.
export type WorkTarget = { kind: "chop" } | { kind: "reed"; idx: number } | { kind: "thatch" } | { kind: "stack" };
export function workTargets(f: ReadonlySet<string>): WorkTarget[] {
  if (pustkaStage(f) !== "work") return [];
  const out: WorkTarget[] = [];
  if (logsChopped(f) < WOOD_NEEDED) out.push({ kind: "chop" });
  for (let i = 0; i < REEDS_NEEDED; i++) if (reedAvailable(f, i)) out.push({ kind: "reed", idx: i });
  if (thatchAvailable(f)) out.push({ kind: "thatch" });
  if (stackAvailable(f)) out.push({ kind: "stack" });
  return out;
}

// Omelko lives in the pustka once he has been told it is ready and has moved
export const omelkoAtHome = (f: ReadonlySet<string>): boolean => flagHas(f, "omelkoMoved");

// Carpentry is a skill like the others (systems/skills.ts): it grows by doing
export type Work = { before: number; after: number; minutes: number };

// One swing of the axe at the block in the pustka's yard. The first six logs
// are for the stove; after that the block is a free place to work, and each
// log costs a little of the day.
export function chopLog(flags: Set<string>): (Work & { quest: boolean; logs: number }) | null {
  if (!chopAvailable(flags) || logsChopped(flags) >= WOOD_NEEDED) return null; // the pile holds six, no more
  const before = flagCount(flags, "carpentry");
  const quest = pustkaStage(flags) === "work";
  bumpCount(flags, "logs", 1);
  const after = bumpCount(flags, "carpentry", 1);
  return { before, after, minutes: CHOP_MINUTES, quest, logs: logsChopped(flags) };
}

// Once the pich is lit it eats the pile: one log at each hour mark from
// 21:00 to 02:00, six logs a night, and whatever is left is gone by dawn.
// So the block can be worked again every day, but only up to a pile of six,
// and the skill cannot be farmed without end. `fromAbs` and `toAbs` are
// absolute game minutes (day-1)*1440+minute; returns how many logs burned.
export const BURN_HOURS = [21, 22, 23, 0, 1, 2];
export function burnLogs(flags: Set<string>, fromAbs: number, toAbs: number): number {
  if (!flagHas(flags, "pustkaFire")) return 0;
  const before = flagCount(flags, "logs");
  let left = before;
  for (let h = Math.floor(fromAbs / 60) + 1; h <= Math.floor(toAbs / 60); h++) {
    const hour = h % 24;
    if (BURN_HOURS.includes(hour) && left > 0) left--;
    if (hour === 6) left = 0;
  }
  if (left !== before) bumpCount(flags, "logs", left - before);
  return before - left;
}

export function cutReed(flags: Set<string>, i: number): (Work & { reeds: number }) | null {
  if (!reedAvailable(flags, i)) return null;
  const before = flagCount(flags, "carpentry");
  flags.add(`reed${i}`);
  const after = bumpCount(flags, "carpentry", 1);
  return { before, after, minutes: REED_MINUTES, reeds: reedsCut(flags) };
}

export function thatchRoof(flags: Set<string>): Work | null {
  if (!thatchAvailable(flags)) return null;
  const before = flagCount(flags, "carpentry");
  flags.add("pustkaRoof");
  return { before, after: bumpCount(flags, "carpentry", 2), minutes: THATCH_MINUTES };
}

export function stackWood(flags: Set<string>): Work | null {
  if (!stackAvailable(flags)) return null;
  const before = flagCount(flags, "carpentry");
  flags.add("pustkaFire");
  return { before, after: bumpCount(flags, "carpentry", 1), minutes: STACK_MINUTES };
}

// What the khata says when you step into it (ui.enterHut.*): before anything
// is done the walls themselves hint that it could be lived in.
export function pustkaEnterKey(stage: PustkaStage): "ui.enterHut.pustka" | "ui.enterHut.pustkaHint" | "ui.enterHut.pustkaWork" | "ui.enterHut.pustkaHome" {
  switch (stage) {
    case "locked": return "ui.enterHut.pustka";
    case "ask": case "permission": return "ui.enterHut.pustkaHint";
    case "work": case "ready": return "ui.enterHut.pustkaWork";
    case "done": return "ui.enterHut.pustkaHome";
  }
}
