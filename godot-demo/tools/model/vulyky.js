// Vulyky: three old log beehives (hollowed trunks stood upright, each
// with a plank lid weighted by a stone and a little flight hole) on a
// low log by Vesna's herb garden (DESIGN.md "Yard things"). A prop you walk
// round (NO_INTERIOR).
import { kit, propPlan } from "./lib.js";

export const SIZE = { x: 1.8, z: 0.6 };
export const NO_INTERIOR = true;
const C = { bark: 0x6e5a40, barkDark: 0x5a4834, lid: 0x7d6d52, stone: 0x8a857a, hole: 0x1a1410, log: 0x4f3e2c };

export function build(THREE) {
  const g = new THREE.Group(); g.name = "vulyky";
  const K = kit(THREE, g);
  const zc = -SIZE.z / 2;
  K.rod("base", [0.05, 0.08, zc], [SIZE.x - 0.05, 0.08, zc], 0.09, C.log, g, 10);
  for (const [i, x, hgt] of [[0, 0.32, 0.95], [1, 0.9, 1.05], [2, 1.48, 0.9]]) {
    K.rod("hive", [x, 0.15, zc], [x, 0.15 + hgt, zc], [0.24, 0.21], i % 2 ? C.barkDark : C.bark, g, 12);
    K.box("lid", x - 0.28, 0.15 + hgt, zc - 0.26, x + 0.28, 0.2 + hgt, zc + 0.26, C.lid);
    const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08, 0), K.mat(C.stone));
    st.position.set(x + 0.04, 0.26 + hgt, zc); st.scale.y = 0.7; st.name = "stone"; g.add(st);
    // the flight hole, on the side toward the camera
    K.box("hole", x - 0.04, 0.5 + hgt * 0.3, zc + 0.205, x + 0.04, 0.56 + hgt * 0.3, zc + 0.24, C.hole);
  }
  K.shadows();
  return g;
}
export const plan = propPlan(SIZE);
