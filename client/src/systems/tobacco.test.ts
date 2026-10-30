import { describe, expect, test } from "bun:test";
import { tobaccoDawn, tobaccoStage } from "./tobacco";

describe("tobacco for the otaman", () => {
  test("stages follow the flags", () => {
    expect(tobaccoStage(new Set())).toBe("none");
    expect(tobaccoStage(new Set(["tobaccoQuest", "tobaccoLeaves=2", "hempFibre"]))).toBe("gather");
    expect(tobaccoStage(new Set(["tobaccoQuest", "tobaccoLeaves=3", "hempFibre"]))).toBe("hang");
    expect(tobaccoStage(new Set(["tobaccoQuest", "tobaccoDryingDay=4"]))).toBe("drying");
    expect(tobaccoStage(new Set(["tobaccoQuest", "tobaccoDryingDay=4", "tobaccoDry"]))).toBe("ready");
    expect(tobaccoStage(new Set(["tobaccoGiven", "tobaccoDry"]))).toBe("done");
  });
  test("it dries at the next dawn, not the same one", () => {
    const hung = new Set(["tobaccoQuest", "tobaccoDryingDay=4"]);
    expect(tobaccoDawn(hung, 4)).toEqual([]);
    expect(tobaccoDawn(hung, 5)).toEqual(["tobaccoDry"]);
  });
});
