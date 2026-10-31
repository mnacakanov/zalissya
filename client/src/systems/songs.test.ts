import { describe, expect, test } from "bun:test";
import { flagCount } from "./flags";
import { eveningMood, fireCheck, knownSongs, knowsSong, recordPerformance, reception, rewardFor } from "./songs";

describe("songs", () => {
  test("a kobzar starts with the duma about Holota", () => {
    expect(knownSongs(new Set())).toEqual(["holota"]);
    expect(knowsSong(new Set(["song:polechko"]), "polechko")).toBe(true);
  });
  test("the khutir listens in the evening, once an evening", () => {
    expect(fireCheck(new Set(), 1, 12 * 60)).toEqual({ ok: false, reason: "daytime" });
    expect(fireCheck(new Set(), 1, 19 * 60)).toEqual({ ok: true, firstEver: true });
    expect(fireCheck(new Set(["played=3", "playedDay=2"]), 2, 19 * 60)).toEqual({ ok: false, reason: "alreadyPlayed" });
  });
  test("evenings have moods: mourning after a death, a feast after a healing", () => {
    expect(eveningMood(3, new Set(["ostapDied", "ostapDiedDay=3"]))).toEqual({ mood: "sad", reason: "mourning" });
    expect(eveningMood(2, new Set(["ostapHealed"]))).toEqual({ mood: "happy", reason: "chumakFeast" });
    expect(eveningMood(1, new Set()).mood).toBe("neutral");
  });
  test("reading the room", () => {
    expect(rewardFor(reception("sad", "sad"))).toEqual({ music: 2, kulish: true });
    expect(rewardFor(reception("happy", "neutral"))).toEqual({ music: 1, kulish: true });
    expect(rewardFor(reception("sad", "happy"))).toEqual({ music: 1, kulish: false });
  });
  test("a performance uses up the evening, pays the Music reward and feeds a kobzar who pleased", () => {
    const f = new Set(["played=1", "playedDay=1", "meals=2"]);
    const r = recordPerformance(f, 2, "match");
    expect(flagCount(f, "played")).toBe(3);
    expect(flagCount(f, "playedDay")).toBe(2);
    expect(flagCount(f, "meals")).toBe(3);
    expect(typeof r.level).toBe("number");
    expect(fireCheck(f, 2, 19 * 60)).toEqual({ ok: false, reason: "alreadyPlayed" });
  });
  test("a clash still teaches a little but earns no kulish", () => {
    const f = new Set<string>();
    recordPerformance(f, 1, "clash");
    expect(flagCount(f, "played")).toBe(1);
    expect(flagCount(f, "meals")).toBe(0);
    expect(f.has("playedDay=1")).toBe(true);
  });
});
