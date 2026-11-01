// A kurtyna (a clump of the deep forest) as one picture: a few generated
// trees and bushes standing together, so the thick of the forest is a
// handful of sprites rather than hundreds. Its footprint is the clump's
// middle, a little wider than a trunk: you walk round a clump, not through.
import { makeTree } from "./trees.js";
export const SIZE = { x: 2.0, z: 2.0 };
export const NO_INTERIOR = true;
const PARTS = [
  ["dub", 7, 1.0, -1.0], ["bereza", 3, -1.6, -3.0], ["dub", 11, 3.4, -3.4],
  ["bereza", 8, 2.6, 0.6], ["lishchyna", 5, -0.6, 1.4], ["kalyna", 9, 3.8, 1.2], ["lishchyna", 1, -2.4, -0.4],
];
export function build(THREE) {
  const g = new THREE.Group();
  for (const [sp, seed, x, z] of PARTS) {
    const t = makeTree(THREE, sp, seed);
    t.position.set(x, 0, z);
    g.add(t);
  }
  return g;
}
export const plan = () => ({ footprint: [[0, 0, 0], [SIZE.x, 0, 0], [SIZE.x, 0, -SIZE.z]], partitions: [] });
