// Vesna's sushka: the rack where the znakharka dries her herbs, two forked
// posts with a pole across and two rails below, bundles of herbs hung head
// down from them (DESIGN.md: she brews tonics at her drying rack). A prop
// you walk round (NO_INTERIOR); it runs east-west.
import { kit, propPlan } from "./lib.js";

export const SIZE = { x: 2.0, z: 0.5 };
export const NO_INTERIOR = true;
const C = { post: 0x6a5238, pole: 0x7a6446, twine: 0xb8a27a,
  herbs: [0x7a8a52, 0x8f8a5a, 0xa8925a, 0x6e7a4a, 0x9a6a7a, 0xb8a050] };

export function build(THREE) {
  const g = new THREE.Group(); g.name = "sushka";
  const K = kit(THREE, g);
  const X = SIZE.x, zc = -SIZE.z / 2;
  for (const x of [0.1, X - 0.1]) {
    K.rod("post", [x, 0, zc], [x, 1.55, zc], 0.05, C.post);
    K.rod("fork", [x, 1.5, zc], [x - 0.06, 1.72, zc], 0.025, C.post);
    K.rod("fork", [x, 1.5, zc], [x + 0.06, 1.72, zc], 0.025, C.post);
  }
  const rails = [[1.62, zc], [1.25, zc - 0.12], [1.25, zc + 0.12]];
  for (const [y, z] of rails) K.rod("rail", [0.02, y, z], [X - 0.02, y, z], 0.025, C.pole);
  // bundles of herbs, tied at the stem, hanging head down
  let n = 0;
  for (const [y, z] of rails) {
    for (let x = 0.3; x < X - 0.25; x += 0.22) {
      const len = 0.28 + 0.08 * Math.sin(n * 1.7);
      K.rod("twine", [x, y, z], [x, y - 0.06, z], 0.008, C.twine);
      K.rod("bundle", [x, y - 0.06, z], [x, y - 0.06 - len, z], [0.025, 0.07], C.herbs[n % C.herbs.length], g, 7);
      n++;
    }
  }
  K.shadows();
  return g;
}
export const plan = propPlan(SIZE);
