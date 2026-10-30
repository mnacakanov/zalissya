import { describe, expect, test } from "bun:test";
import { eveningMood, fireCheck, knownSongs, knowsSong, reception, rewardFor } from "./songs";

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
});
