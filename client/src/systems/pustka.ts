import { flagCount, flagHas } from "./flags";

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

// Omelko lives in the pustka once he has been told it is ready and has moved
export const omelkoAtHome = (f: ReadonlySet<string>): boolean => flagHas(f, "omelkoMoved");

function bump(flags: Set<string>, name: string, by: number): number {
  const next = flagCount(flags, name) + by;
  for (const f of [...flags]) if (f.startsWith(`${name}=`)) flags.delete(f);
  flags.add(`${name}=${next}`);
  return next;
}

// Carpentry is a skill like the others (systems/skills.ts): it grows by doing
export type Work = { before: number; after: number; minutes: number };

// One swing of the axe at the block in the pustka's yard. The first six logs
// are for the stove; after that the block is a free place to work, and each
// log costs a little of the day.
export function chopLog(flags: Set<string>): (Work & { quest: boolean; logs: number }) | null {
  if (!chopAvailable(flags)) return null;
  const before = flagCount(flags, "carpentry");
  const quest = pustkaStage(flags) === "work" && flagCount(flags, "logs") < WOOD_NEEDED;
  if (quest) bump(flags, "logs", 1);
  const after = bump(flags, "carpentry", 1);
  return { before, after, minutes: CHOP_MINUTES, quest, logs: logsChopped(flags) };
}

export function cutReed(flags: Set<string>, i: number): (Work & { reeds: number }) | null {
  if (!reedAvailable(flags, i)) return null;
  const before = flagCount(flags, "carpentry");
  flags.add(`reed${i}`);
  const after = bump(flags, "carpentry", 1);
  return { before, after, minutes: REED_MINUTES, reeds: reedsCut(flags) };
}

export function thatchRoof(flags: Set<string>): Work | null {
  if (!thatchAvailable(flags)) return null;
  const before = flagCount(flags, "carpentry");
  flags.add("pustkaRoof");
  return { before, after: bump(flags, "carpentry", 2), minutes: THATCH_MINUTES };
}

export function stackWood(flags: Set<string>): Work | null {
  if (!stackAvailable(flags)) return null;
  const before = flagCount(flags, "carpentry");
  flags.add("pustkaFire");
  return { before, after: bump(flags, "carpentry", 1), minutes: STACK_MINUTES };
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
