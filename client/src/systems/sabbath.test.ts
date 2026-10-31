import { describe, expect, test } from "bun:test";
import { isSabbath } from "./sabbath";

describe("the sabbath's hours", () => {
  test("gathers at dusk, breaks up before dawn, and never by day", () => {
    expect(isSabbath(21 * 60)).toBe(true);
    expect(isSabbath(2 * 60)).toBe(true);
    expect(isSabbath(12 * 60)).toBe(false);
    expect(isSabbath(19 * 60)).toBe(false);
    expect(isSabbath(5 * 60)).toBe(false);
  });
});
