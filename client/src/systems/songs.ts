import { flagCount, flagHas } from "./flags";

// --- The kobza: songs, moods and performing --------------------------------
// The player is a wandering kobzar. The kobza is always on his back; what
// grows is the repertoire, the craft — and the judgement of what to play.
//
// Songs are real Ukrainian folk songs, referred to by title only (no lyrics
// in the game). Each has a MOOD:
//   happy   — the hopak, «Ой на горі та й женці жнуть», «Розпрягайте, хлопці, коней»,
//             «Ти ж мене підманула», «Ой не ходи, Грицю, та й на вечорниці»
//   neutral — the duma of Holota, the lullaby, «Ой ви, воли мої половії»,
//             «Їхав козак за Дунай»
//   sad     — «Ой полечко, поле», the duma of the Black Sea storm, the duma of
//             Marusia Bohuslavka
// They are learned from people and spirits (story flags "song:<id>"); see
// dialogue/songTopics.ts and dialogue/chumaky.ts for who teaches what.
//
// Every evening the khutir has a mood too — a feast, an ordinary night, or
// mourning — and a kobzar reads the room:
//   song matches the evening        → the room is his: Music +2, a bowl of kulish
//   either side is neutral          → a good evening: Music +1, kulish
//   happy at a wake / sad at a feast → people turn away: Music +1, no kulish
// Music's level IS the player's Charisma.

export type Mood = "happy" | "neutral" | "sad";
export type SongId =
  | "holota" | "kolyskova" | "hopak" | "burya"
  | "zhentsi" | "rozpriahaite" | "voly" | "polechko"
  | "pidmanula" | "dunai" | "marusia" | "hrytsiu";

export const SONGS: Record<SongId, { mood: Mood }> = {
  holota: { mood: "neutral" },
  kolyskova: { mood: "neutral" },
  voly: { mood: "neutral" },
  dunai: { mood: "neutral" },
  hopak: { mood: "happy" },
  zhentsi: { mood: "happy" },
  rozpriahaite: { mood: "happy" },
  pidmanula: { mood: "happy" },
  hrytsiu: { mood: "happy" },
  polechko: { mood: "sad" },
  burya: { mood: "sad" },
  marusia: { mood: "sad" },
};
export const SONG_IDS = Object.keys(SONGS) as SongId[];

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

// Why the khutir feels the way it does tonight — each reason has its own
// line when the kobzar sits down (ui.mood.<reason>).
export type MoodReason = "mourning" | "chumakFeast" | "wedding" | "memorial" | "ordinary";

export function eveningMood(day: number, flags: ReadonlySet<string>): { mood: Mood; reason: MoodReason } {
  const died = flagCount(flags, "ostapDiedDay");
  if (died > 0 && (day === died || day === died + 1)) return { mood: "sad", reason: "mourning" };
  if (flagHas(flags, "ostapHealed") && !flagHas(flags, "chumakyGone")) return { mood: "happy", reason: "chumakFeast" };
  if (day % 3 === 0) return { mood: "happy", reason: "wedding" };
  if (day % 5 === 4) return { mood: "sad", reason: "memorial" };
  return { mood: "neutral", reason: "ordinary" };
}

export type Reception = "match" | "fine" | "clash";

export function reception(evening: Mood, song: Mood): Reception {
  if (evening === song) return "match";
  if (evening === "neutral" || song === "neutral") return "fine";
  return "clash";
}

export function rewardFor(r: Reception): { music: number; kulish: boolean } {
  return r === "match" ? { music: 2, kulish: true } : r === "fine" ? { music: 1, kulish: true } : { music: 1, kulish: false };
}

export type FireResult =
  | { ok: false; reason: "daytime" | "alreadyPlayed" }
  | { ok: true; firstEver: boolean };

// May the kobzar play for the khutir right now? "playedDay=n" remembers the
// last evening he played, so it is once an evening.
export function fireCheck(flags: ReadonlySet<string>, day: number, minute: number): FireResult {
  if (!isEvening(minute)) return { ok: false, reason: "daytime" };
  if (flagCount(flags, "playedDay") === day) return { ok: false, reason: "alreadyPlayed" };
  return { ok: true, firstEver: flagCount(flags, "played") === 0 };
}
