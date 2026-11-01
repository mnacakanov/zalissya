// Kozly: a sawhorse with a log laid across it, half sawn through, the
// bow saw left hanging in the cut, sawdust and a couple of rounds at its
// foot. A prop you walk round (NO_INTERIOR); it runs east-west.
import { kit, propPlan } from "./lib.js";

export const SIZE = { x: 1.6, z: 0.8 };
export const NO_INTERIOR = true;
const C = { wood: 0x7a6248, bark: 0x5e4c34, cut: 0xc8a878, saw: 0x8a6440, blade: 0x6a6c70, dust: 0xd8c49a };

export function build(THREE) {
  const g = new THREE.Group(); g.name = "kozly";
  const K = kit(THREE, g);
  const zc = -SIZE.z / 2;
  // two X-frames
  for (const x of [0.35, 1.25]) {
    K.rod("leg", [x, 0, zc - 0.3], [x, 0.85, zc + 0.12], 0.035, C.wood);
    K.rod("leg", [x, 0, zc + 0.3], [x, 0.85, zc - 0.12], 0.035, C.wood);
  }
  K.rod("rail", [0.35, 0.3, zc], [1.25, 0.3, zc], 0.03, C.wood);
  // the log in the crotches
  K.rod("log", [0.0, 0.8, zc], [1.6, 0.8, zc], 0.13, C.bark, g, 10);
  K.rod("log_end", [1.595, 0.8, zc], [1.605, 0.8, zc], 0.125, C.cut, g, 10);
  // the bow saw in the half-cut, its frame standing up
  K.box("cut", 1.0, 0.72, zc - 0.135, 1.02, 0.94, zc + 0.135, C.cut);
  K.rod("saw_frame", [1.01, 0.75, zc - 0.32], [1.01, 1.35, zc - 0.32], 0.02, C.saw);
  K.rod("saw_frame", [1.01, 0.75, zc + 0.32], [1.01, 1.35, zc + 0.32], 0.02, C.saw);
  K.rod("saw_bar", [1.01, 1.1, zc - 0.32], [1.01, 1.1, zc + 0.32], 0.02, C.saw);
  K.box("blade", 1.0, 0.76, zc - 0.32, 1.02, 0.8, zc + 0.32, C.blade);
  // sawdust and two sawn rounds on the ground
  K.box("dust", 0.85, 0, zc - 0.25, 1.2, 0.02, zc + 0.25, C.dust);
  K.rod("round", [1.35, 0, zc + 0.3], [1.35, 0.18, zc + 0.3], 0.12, C.bark, g, 10);
  K.rod("round_top", [1.35, 0.18, zc + 0.3], [1.35, 0.19, zc + 0.3], 0.115, C.cut, g, 10);
  K.shadows();
  return g;
}
export const plan = propPlan(SIZE);
