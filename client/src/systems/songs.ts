import { flagCount, flagHas } from "./flags";

// --- The kobza: songs and performing --------------------------------------
// The player is a wandering kobzar. The kobza is always on his back; what
// grows is the repertoire and the craft.
//   · Songs are learned from people and spirits (story flags "song:<id>"):
//       holota    — "Duma about Cossack Holota", known from the start
//       kolyskova — a lullaby, from Vesna; sung in the Domovyk's hut it
//                   makes for a rested morning (CON +1 until next dawn)
//       hopak     — the dance tune, from the Chort (or Motrya on the
//                   mountain); Lysa Hora's sabbath dances only to it
//       burya     — "Duma about the storm on the Black Sea", from the
//                   otaman with the chalk; it is what you sing all night
//                   in Viy's vigil (the WARD button), the way Gogol's
//                   Khoma Brut read his prayers
//   · Music is a skill like the others: it grows by performing for the
//     khutir at the campfire in the evening — once an evening, because an
//     audience is a thing you earn — and its level IS your Charisma.
//     The listeners pay the old way: a bowl of kulish.

export type SongId = "holota" | "kolyskova" | "hopak" | "burya";
export const SONG_IDS: readonly SongId[] = ["holota", "kolyskova", "hopak", "burya"];

export const EVENING_FROM = 18 * 60;
export const EVENING_UNTIL = 23 * 60 + 30;

export function songFlag(id: SongId): string {
  return `song:${id}`;
}

export function knowsSong(flags: ReadonlySet<string>, id: SongId): boolean {
  return id === "holota" || flagHas(flags, songFlag(id));
}

export function knownSongs(flags: ReadonlySet<string>): SongId[] {
  return SONG_IDS.filter((id) => knowsSong(flags, id));
}

export function isEvening(minute: number): boolean {
  return minute >= EVENING_FROM && minute < EVENING_UNTIL;
}

export type FireResult =
  | { ok: false; reason: "daytime" | "alreadyPlayed" }
  | { ok: true; firstEver: boolean };

// May the kobzar play for the khutir right now? The day number guards
// "once an evening": the counter "playedDay=n" remembers the last one.
export function fireCheck(flags: ReadonlySet<string>, day: number, minute: number): FireResult {
  if (!isEvening(minute)) return { ok: false, reason: "daytime" };
  if (flagCount(flags, "playedDay") === day) return { ok: false, reason: "alreadyPlayed" };
  return { ok: true, firstEver: flagCount(flags, "played") === 0 };
}
