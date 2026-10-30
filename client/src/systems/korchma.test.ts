import { describe, expect, test } from "bun:test";
import { korchmaMood } from "./korchma";
import { eveningMood } from "./songs";

describe("korchma moods", () => {
  test("merry most nights, maudlin every fourth", () => {
    const none = new Set<string>();
    expect(korchmaMood(2, none)).toEqual({ mood: "happy", reason: "merry" });
    expect(korchmaMood(5, none)).toEqual({ mood: "sad", reason: "maudlin" });
  });
  test("follows the khutir's grief and the chumak feast", () => {
    expect(korchmaMood(4, new Set(["ostapDiedDay=4"])).mood).toBe("sad");
    expect(korchmaMood(5, new Set(["ostapDiedDay=4"])).reason).toBe("mourning");
    expect(korchmaMood(5, new Set(["ostapHealed"])).reason).toBe("chumaky");
  });
  test("the korchma and the campfire can want different songs on the same night", () => {
    const none = new Set<string>();
    // day 4: a memorial at the khutir (sad), the korchma merry (happy)
    expect(eveningMood(4, none).mood).toBe("sad");
    expect(korchmaMood(4, none).mood).toBe("happy");
  });
});
