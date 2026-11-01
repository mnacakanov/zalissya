// A lava: a plain plank bench on split-log legs, for the maidan and the
// forge's door (DESIGN.md: the residents rest on benches at midday). A prop
// you walk round (NO_INTERIOR); it runs east-west.
import { kit, propPlan } from "./lib.js";

export const SIZE = { x: 1.8, z: 0.4 };
export const NO_INTERIOR = true;
const C = { plank: 0x8a7050, leg: 0x6a5238, dark: 0x4f3e2c };

export function build(THREE) {
  const g = new THREE.Group(); g.name = "lava";
  const K = kit(THREE, g);
  const X = SIZE.x, Z = SIZE.z;
  // a thick plank seat, a little worn at the middle
  K.box("seat", 0, 0.4, -Z, X, 0.47, 0, C.plank);
  // two pairs of splayed legs, pegged through
  for (const x of [0.2, X - 0.2]) {
    K.rod("leg", [x, 0, -0.04], [x, 0.4, -0.14], 0.04, C.leg);
    K.rod("leg", [x, 0, -Z + 0.04], [x, 0.4, -Z + 0.14], 0.04, C.leg);
    K.box("peg", x - 0.03, 0.47, -0.25, x + 0.03, 0.49, -0.15, C.dark);
  }
  K.shadows();
  return g;
}
export const plan = propPlan(SIZE);
