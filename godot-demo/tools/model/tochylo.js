// A tochylo: the grindstone by the forge, a big sandstone wheel on an axle
// with a crank, in a wooden frame over a trough of water to keep it wet. A
// prop you walk round (NO_INTERIOR); the wheel turns in the x-y plane.
import { kit, propPlan } from "./lib.js";

export const SIZE = { x: 1.1, z: 0.6 };
export const NO_INTERIOR = true;
const C = { wood: 0x7a6248, dark: 0x4f3e2c, stone: 0xb0a080, iron: 0x3c3c3e, water: 0x1c2228 };

export function build(THREE) {
  const g = new THREE.Group(); g.name = "tochylo";
  const K = kit(THREE, g);
  const zc = -SIZE.z / 2, cx = 0.55;
  // the frame: four legs, two rails
  for (const x of [0.1, 1.0]) for (const z of [zc - 0.22, zc + 0.22]) K.rod("leg", [x, 0, z], [x, 0.6, z], 0.035, C.wood);
  for (const z of [zc - 0.22, zc + 0.22]) K.rod("rail", [0.05, 0.6, z], [1.05, 0.6, z], 0.035, C.wood);
  // the trough under the wheel
  K.box("trough", cx - 0.3, 0.25, zc - 0.14, cx + 0.3, 0.45, zc + 0.14, C.dark);
  K.box("trough_water", cx - 0.27, 0.44, zc - 0.11, cx + 0.27, 0.45, zc + 0.11, C.water);
  // the stone wheel, its axle across the rails, a crank on the near side
  const st = K.rod("stone", [cx, 0.85, zc - 0.08], [cx, 0.85, zc + 0.08], 0.4, C.stone, g, 24);
  st.name = "stone";
  K.rod("axle", [cx, 0.85, zc - 0.32], [cx, 0.85, zc + 0.36], 0.025, C.iron);
  K.rod("crank", [cx, 0.85, zc + 0.36], [cx + 0.2, 0.7, zc + 0.36], 0.02, C.iron);
  K.rod("crank_grip", [cx + 0.2, 0.7, zc + 0.36], [cx + 0.2, 0.7, zc + 0.48], 0.022, C.wood);
  K.rod("post", [cx, 0.6, zc - 0.22], [cx, 0.88, zc - 0.22], 0.03, C.wood);
  K.rod("post", [cx, 0.6, zc + 0.22], [cx, 0.88, zc + 0.22], 0.03, C.wood);
  K.shadows();
  return g;
}
export const plan = propPlan(SIZE);
