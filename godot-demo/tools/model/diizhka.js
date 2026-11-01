// A diizhka: a water barrel by the forge for the smith (an oak cask with
// iron hoops, a dipper hung on its rim), and a spare cart wheel leaning on
// it. A prop you walk round (NO_INTERIOR).
import { kit, propPlan } from "./lib.js";
import { wheel } from "./wheel.js";

export const SIZE = { x: 1.2, z: 0.8 };
export const NO_INTERIOR = true;
const C = { oak: 0x7a6248, hoop: 0x3c3c3e, water: 0x1c2228, wood: 0x8a7050, dark: 0x5e4a34, dipper: 0x9c7a50 };

export function build(THREE) {
  const g = new THREE.Group(); g.name = "diizhka";
  const K = kit(THREE, g);
  const cx = 0.4, cz = -0.4;
  const prof = [[0, 0], [0.28, 0], [0.33, 0.25], [0.34, 0.45], [0.31, 0.75], [0.29, 0.8], [0.27, 0.8], [0.27, 0.72], [0, 0.72]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const b = new THREE.Mesh(new THREE.LatheGeometry(prof, 16), K.mat(C.oak)); b.position.set(cx, 0, cz); b.name = "barrel"; g.add(b);
  for (const y of [0.08, 0.3, 0.6, 0.76]) {
    const r = y < 0.1 || y > 0.7 ? 0.3 : 0.335;
    K.rod("hoop", [cx, y, cz], [cx, y + 0.03, cz], r + 0.008, C.hoop, g, 16);
  }
  K.rod("water", [cx, 0.7, cz], [cx, 0.71, cz], 0.26, C.water, g, 16);
  K.rod("dipper", [cx + 0.2, 0.8, cz], [cx + 0.35, 0.55, cz + 0.05], 0.015, C.dipper);
  // the spare wheel, leaning on the barrel's east side
  const w = wheel(THREE, K, g, [0.95, 0.42, -0.4], 0.42, C.wood, C.dark);
  w.rotation.y = Math.PI / 2; w.rotation.x = 0.0; w.rotation.z = 0;
  w.rotateX(-0.25);
  K.shadows();
  return g;
}
export const plan = propPlan(SIZE);
