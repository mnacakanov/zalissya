// A plug: an old wooden plough left at a yard's edge between seasons, a
// heavy beam on two little wheels at the front, an iron share and
// mouldboard, two handles at the back. A prop you walk round (NO_INTERIOR);
// it runs east-west, the wheels to the east.
import { kit, propPlan } from "./lib.js";
import { wheel } from "./wheel.js";

export const SIZE = { x: 2.6, z: 0.8 };
export const NO_INTERIOR = true;
const C = { wood: 0x7a6248, dark: 0x4f3e2c, iron: 0x4a4a4c, rust: 0x7a4a2a };

export function build(THREE) {
  const g = new THREE.Group(); g.name = "plug";
  const K = kit(THREE, g);
  const zc = -SIZE.z / 2;
  // the beam, from the handles down to the fore-carriage
  K.rod("beam", [0.45, 0.55, zc], [2.2, 0.45, zc], 0.06, C.wood);
  // the two-wheeled fore-carriage
  for (const z of [zc - 0.28, zc + 0.28]) wheel(THREE, K, g, [2.25, 0.3, z], 0.3, C.wood, C.dark);
  K.rod("axle", [2.25, 0.3, zc - 0.35], [2.25, 0.3, zc + 0.35], 0.035, C.dark);
  K.rod("strut", [2.2, 0.45, zc], [2.25, 0.3, zc], 0.04, C.dark);
  // the sole, the share and the mouldboard at the back, resting on the ground
  K.box("sole", 0.35, 0, zc - 0.05, 1.0, 0.07, zc + 0.05, C.dark);
  K.rod("stilt", [0.7, 0.05, zc], [0.62, 0.55, zc], 0.04, C.wood);
  K.poly("share", [[1.0, 0.0, zc - 0.02], [1.25, 0.02, zc + 0.05], [0.95, 0.12, zc + 0.12]], C.iron);
  K.poly("mouldboard", [[0.75, 0.04, zc + 0.06], [1.0, 0.06, zc + 0.1], [0.95, 0.32, zc + 0.28], [0.7, 0.3, zc + 0.2]], C.rust);
  // two handles sweeping up and back
  K.rod("handle", [0.62, 0.55, zc], [0.05, 0.95, zc - 0.22], 0.03, C.wood);
  K.rod("handle", [0.62, 0.55, zc], [0.05, 0.95, zc + 0.22], 0.03, C.wood);
  K.rod("rung", [0.2, 0.86, zc - 0.17], [0.2, 0.86, zc + 0.17], 0.02, C.wood);
  K.shadows();
  return g;
}
export const plan = propPlan(SIZE);
