import { describe, expect, test } from "bun:test";
import { fireCheck, knownSongs, knowsSong } from "./songs";

describe("songs", () => {
  test("a kobzar starts with the duma about Holota", () => {
    expect(knownSongs(new Set())).toEqual(["holota"]);
    expect(knowsSong(new Set(["song:hopak"]), "hopak")).toBe(true);
  });
  test("the khutir listens in the evening, once an evening", () => {
    expect(fireCheck(new Set(), 1, 12 * 60)).toEqual({ ok: false, reason: "daytime" });
    expect(fireCheck(new Set(), 1, 19 * 60)).toEqual({ ok: true, firstEver: true });
    expect(fireCheck(new Set(["played=3", "playedDay=2"]), 2, 19 * 60)).toEqual({ ok: false, reason: "alreadyPlayed" });
    expect(fireCheck(new Set(["played=3", "playedDay=2"]), 3, 19 * 60)).toEqual({ ok: true, firstEver: false });
  });
});
