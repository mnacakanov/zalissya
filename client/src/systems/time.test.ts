import { describe, expect, test } from "bun:test";
import { advance, darkness, isNight, minutesUntil, readClock, timeLabel, writeClock } from "./time";

describe("clock", () => {
  test("old saves start on day 1 at 08:00", () => {
    expect(readClock(new Set(["bread", "fish=2"]))).toEqual({ day: 1, minute: 480 });
  });
  test("round-trips through flags, replacing old values", () => {
    const f = new Set(["day=1", "clock=10", "bread"]);
    writeClock(f, { day: 3, minute: 1300 });
    expect([...f].sort()).toEqual(["bread", "clock=1300", "day=3"]);
    expect(readClock(f)).toEqual({ day: 3, minute: 1300 });
  });
  test("advance rolls over midnight and counts dawns", () => {
    expect(advance({ day: 1, minute: 1430 }, 20)).toEqual({ clock: { day: 2, minute: 10 }, dawns: 0 });
    expect(advance({ day: 1, minute: 359 }, 1)).toEqual({ clock: { day: 1, minute: 360 }, dawns: 1 });
    expect(advance({ day: 1, minute: 360 }, 1).dawns).toBe(0);
    expect(advance({ day: 1, minute: 300 }, 1440 * 2).dawns).toBe(2);
  });
  test("minutesUntil wraps to the next occurrence", () => {
    expect(minutesUntil({ day: 1, minute: 600 }, 420)).toBe(1260);
    expect(minutesUntil({ day: 1, minute: 400 }, 420)).toBe(20);
  });
  test("night window and darkness", () => {
    expect(isNight(21 * 60)).toBe(true);
    expect(isNight(3 * 60 + 59)).toBe(true);
    expect(isNight(4 * 60)).toBe(false);
    expect(darkness(12 * 60)).toBe(0);
    expect(darkness(23 * 60)).toBeCloseTo(0.62);
    expect(darkness(5 * 60)).toBeGreaterThan(0);
    expect(timeLabel({ day: 2, minute: 21 * 60 + 5 })).toBe("Day 2 · 21:05 🌙");
  });
});
