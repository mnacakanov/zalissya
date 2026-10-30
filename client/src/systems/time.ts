// --- Day and night -----------------------------------------------------------
// Zalissya keeps time now. A full day passes in about ten real minutes of
// play (the clock stops while you talk or read your Character sheet), and
// time matters:
//   · the village darkens at dusk and the moon comes up;
//   · food and tonics last "while they last" = until the next dawn;
//   · Viy can only be faced at night (21:00 – 04:00);
//   · the bed in the Domovyk's hut sleeps you to morning or to nightfall.
// The clock lives in the save as two counters, "day=n" and "clock=m"
// (minutes after midnight). Old saves have neither and start on day 1 at
// eight in the morning.

export const DAY_MINUTES = 24 * 60;
// Real milliseconds per game minute while walking about: 400 ms → one
// game hour is 24 s, a whole day ~9.6 minutes.
export const MS_PER_GAME_MINUTE = 400;
export const START_MINUTE = 8 * 60;
export const DAWN = 6 * 60;
export const DUSK = 20 * 60;
export const NIGHT_FROM = 21 * 60;
export const NIGHT_UNTIL = 4 * 60;
export const WAKE_MINUTE = 7 * 60;
export const NIGHTFALL_MINUTE = 21 * 60 + 10;

// Bonuses that last until the next dawn.
export const UNTIL_DAWN_FLAGS = ["wellfed", "tonic", "strongtonic"] as const;

export type Clock = { day: number; minute: number };
export type DayPhase = "dawn" | "day" | "dusk" | "night";

function counter(flags: ReadonlySet<string>, name: string): number | null {
  for (const f of flags) {
    if (f.startsWith(`${name}=`)) {
      const n = Number(f.slice(name.length + 1));
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

export function readClock(flags: ReadonlySet<string>): Clock {
  const day = counter(flags, "day");
  const minute = counter(flags, "clock");
  return {
    day: day != null && day >= 1 ? Math.floor(day) : 1,
    minute: minute != null ? ((Math.floor(minute) % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES : START_MINUTE,
  };
}

// Write the clock back as flags (replacing any old values).
export function writeClock(flags: Set<string>, c: Clock): void {
  for (const f of [...flags]) {
    if (f.startsWith("day=") || f.startsWith("clock=")) flags.delete(f);
  }
  flags.add(`day=${c.day}`);
  flags.add(`clock=${c.minute}`);
}

// Move the clock forward. `dawns` counts how many 06:00 marks were
// crossed on the way — each one ends the until-dawn bonuses.
export function advance(c: Clock, minutes: number): { clock: Clock; dawns: number } {
  const steps = Math.max(0, Math.floor(minutes));
  const startAbs = (c.day - 1) * DAY_MINUTES + c.minute;
  const endAbs = startAbs + steps;
  const dawnsBefore = Math.floor((startAbs - DAWN + DAY_MINUTES) / DAY_MINUTES);
  const dawnsAfter = Math.floor((endAbs - DAWN + DAY_MINUTES) / DAY_MINUTES);
  return {
    clock: { day: Math.floor(endAbs / DAY_MINUTES) + 1, minute: endAbs % DAY_MINUTES },
    dawns: dawnsAfter - dawnsBefore,
  };
}

// Minutes from `c` until the next time the clock reads `target`.
export function minutesUntil(c: Clock, target: number): number {
  const d = (target - c.minute + DAY_MINUTES) % DAY_MINUTES;
  return d === 0 ? DAY_MINUTES : d;
}

export function isNight(minute: number): boolean {
  return minute >= NIGHT_FROM || minute < NIGHT_UNTIL;
}

export function phaseOf(minute: number): DayPhase {
  if (isNight(minute)) return "night";
  if (minute < DAWN + 60) return "dawn";
  if (minute >= DUSK) return "dusk";
  return "day";
}

// How dark the open village is, 0 (noon) … 0.62 (deep night), easing
// through dusk and dawn so the light never snaps.
export function darkness(minute: number): number {
  const DEEP = 0.62;
  const ramp = (from: number, to: number, m: number) => Math.min(1, Math.max(0, (m - from) / (to - from)));
  if (minute >= DUSK - 60) return DEEP * ramp(DUSK - 60, NIGHT_FROM + 30, minute);
  if (minute < NIGHT_UNTIL) return DEEP;
  if (minute < DAWN + 60) return DEEP * (1 - ramp(NIGHT_UNTIL, DAWN + 60, minute));
  return 0;
}

export function timeLabel(c: Clock): string {
  const h = Math.floor(c.minute / 60);
  const m = c.minute % 60;
  const icon = { dawn: "🌅", day: "☀", dusk: "🌇", night: "🌙" }[phaseOf(c.minute)];
  return `Day ${c.day} · ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${icon}`;
}
