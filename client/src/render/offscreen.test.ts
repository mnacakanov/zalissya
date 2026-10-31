import { describe, expect, test } from "bun:test";
import { drawKabytsia } from "./village";

// A canvas stand-in that throws the way a real one does on a negative radius.
// Anything drawn far off screen (the kabytsia, while the player is on Lysa
// Hora) gets a hugely negative screen x; a phase taken from that x once made
// the steam radius negative and aborted the whole frame, every frame.
function fakeCtx(): CanvasRenderingContext2D {
  const grad = { addColorStop() {} };
  return new Proxy({} as Record<string, unknown>, {
    get(_t, name) {
      if (name === "createLinearGradient" || name === "createRadialGradient") return () => grad;
      if (name === "arc") return (_x: number, _y: number, r: number) => { if (r < 0) throw new RangeError(`negative arc radius ${r}`); };
      if (name === "ellipse") return (_x: number, _y: number, rx: number, ry: number) => { if (rx < 0 || ry < 0) throw new RangeError("negative ellipse radius"); };
      return () => {};
    },
    set() { return true; },
  }) as unknown as CanvasRenderingContext2D;
}

describe("drawing far off screen", () => {
  test("the kabytsia never gets a negative radius, wherever the camera is", () => {
    const c = fakeCtx();
    for (const sx of [-3200, -1700, -40, 0, 60, 900]) {
      for (let t = 0; t < 60000; t += 997) expect(() => drawKabytsia(c, sx, 500, t, 520)).not.toThrow();
    }
  });
});
