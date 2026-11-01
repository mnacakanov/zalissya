// A kolodka: the chopping block in a yard, a thick round of oak with the
// axe left in it, split logs fallen round it and a few stacked for the pich.
// A prop you walk round (NO_INTERIOR).
import { kit, propPlan } from "./lib.js";

export const SIZE = { x: 1.0, z: 0.8 };
export const NO_INTERIOR = true;
const C = { bark: 0x5e4c34, top: 0xc8a878, split: 0xb39468, iron: 0x55585c, haft: 0x8a6440 };

export function build(THREE) {
  const g = new THREE.Group(); g.name = "kolodka";
  const K = kit(THREE, g);
  const cx = 0.4, cz = -0.4;
  K.rod("block", [cx, 0, cz], [cx, 0.5, cz], 0.26, C.bark, g, 12);
  K.rod("block_top", [cx, 0.5, cz], [cx, 0.51, cz], 0.25, C.top, g, 12);
  // the axe, bitten into the block, its haft up to the east
  const axe = new THREE.Group(); axe.position.set(cx + 0.02, 0.5, cz); axe.rotation.z = -0.9; g.add(axe);
  K.box("axe_head", -0.03, -0.05, -0.12, 0.05, 0.08, 0.04, C.iron, axe);
  K.rod("axe_haft", [0, 0.05, 0], [0, 0.72, 0], 0.022, C.haft, axe);
  // split logs: two fallen, a short stack against the block's west side
  K.box("split", 0.62, 0, -0.18, 0.98, 0.1, -0.06, C.split).rotation.y = 0.4;
  K.box("split", 0.0, 0, -0.1, 0.36, 0.1, 0.02, C.split).rotation.y = -0.3;
  for (const [y, z] of [[0, -0.75], [0, -0.62], [0.11, -0.69]]) K.box("stack", 0.02, y, z, 0.3, y + 0.11, z + 0.12, C.split);
  K.shadows();
  return g;
}
export const plan = propPlan(SIZE);
