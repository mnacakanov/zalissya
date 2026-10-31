import { type Npc } from "./characters";
import { OMELKO } from "./cave";
import { BACK_WALL, HOUSE_RECTS, PUSTKA_ROOM, toWorld } from "./houses";
import { POND, pondEdge } from "./village";
import { type Light } from "../render/light";

// A roof for Omelko (systems/pustka.ts): where the work is done.
const R = HOUSE_RECTS.pustka;

// the chopping block in the yard, east of the door, with the axe in it
export const CHOP_SPOT = { x: R.x + R.w - 4, y: R.y + R.h + 38 };
// the ladder against the west corner, where the thatch is mended
export const THATCH_SPOT = { x: R.x + 26, y: R.y + R.h + 30 };
// in front of the pich, where the firewood is stacked
export const STACK_SPOT = toWorld("pustka", { x: PUSTKA_ROOM.pich.x + 30, y: PUSTKA_ROOM.pich.y + PUSTKA_ROOM.pich.h + 20 });
// four clumps of reeds on the pond's bank
export const REED_SPOTS = [0.55, 1.95, 3.55, 5.1].map((a) =>
  pondEdge(POND.x + Math.cos(a) * POND.rx, POND.y + Math.sin(a) * POND.ry, 14));

// Omelko, once he lives here: on the bench by the pich
export const OMELKO_HOME: Npc = {
  ...OMELKO,
  ...toWorld("pustka", { x: 42, y: BACK_WALL + 90 }),
};

// the lit windows of a lived-in pustka (as the other khaty's: render/light.ts)
export const PUSTKA_WINDOWS: Light[] = [34, R.w - 70].flatMap((wx) => [
  { x: R.x + wx + 18, y: R.y + R.h - 64 + 26, r: 22, col: "255,200,110", k: 0.95 },
  { x: R.x + wx + 18, y: R.y + R.h + 18, r: 46, col: "255,180,90", k: 0.55 },
]);

// Where a piece of the repair work is done (systems/pustka.ts workTargets)
export function workSpot(w: { kind: "chop" } | { kind: "reed"; idx: number } | { kind: "thatch" } | { kind: "stack" }): { x: number; y: number } {
  switch (w.kind) {
    case "chop": return CHOP_SPOT;
    case "thatch": return THATCH_SPOT;
    case "stack": return STACK_SPOT;
    case "reed": return REED_SPOTS[w.idx] ?? CHOP_SPOT;
  }
}
