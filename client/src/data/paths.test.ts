import { describe, expect, test } from "bun:test";
import { PROKIP_PATH } from "./land";
import { SOLID } from "./village";
import { PLAYER_R } from "../world/areas";

// Every footpath must stay walkable: tree trunks, fences and walls are solid
// (data/village.ts SOLID), and a path you cannot walk is a bug, not scenery.
function bez(P: number[][], u: number): { x: number; y: number } {
  const v = 1 - u;
  const at = (k: 0 | 1) => v * v * v * (P[0]?.[k] ?? 0) + 3 * v * v * u * (P[1]?.[k] ?? 0) + 3 * v * u * u * (P[2]?.[k] ?? 0) + u * u * u * (P[3]?.[k] ?? 0);
  return { x: at(0), y: at(1) };
}

describe("footpaths", () => {
  test("nothing solid stands on the path to Did Prokip", () => {
    const blocked: string[] = [];
    for (const P of PROKIP_PATH) {
      for (let i = 0; i <= 80; i++) {
        const p = bez(P, i / 80);
        for (const r of SOLID) {
          const cx = Math.max(r.x, Math.min(p.x, r.x + r.w));
          const cy = Math.max(r.y, Math.min(p.y, r.y + r.h));
          if (Math.hypot(p.x - cx, p.y - cy) < PLAYER_R + 2) blocked.push(`${Math.round(p.x)},${Math.round(p.y)}`);
        }
      }
    }
    expect(blocked).toEqual([]);
  });
});
