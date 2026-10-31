import { describe, expect, test } from "bun:test";
import { keyName } from "./keys";

describe("keyName", () => {
  test("letters come from the key's place, whatever the layout types", () => {
    expect(keyName({ code: "KeyW", key: "ц" })).toBe("w");
    expect(keyName({ code: "KeyE", key: "у" })).toBe("e");
    expect(keyName({ code: "KeyM", key: "ь" })).toBe("m");
    expect(keyName({ code: "KeyA", key: "A" })).toBe("a");
  });
  test("arrows, space and shift keep the names the frame loop reads", () => {
    expect(keyName({ code: "ArrowUp", key: "ArrowUp" })).toBe("arrowup");
    expect(keyName({ code: "Space", key: " " })).toBe(" ");
    expect(keyName({ code: "ShiftRight", key: "Shift" })).toBe("shift");
  });
  test("an empty code falls back to the typed key", () => {
    expect(keyName({ code: "", key: "W" })).toBe("w");
  });
});
