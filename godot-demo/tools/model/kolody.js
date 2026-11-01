// A koloda: a log laid by the fire for sitting on, its top hewn flat and
// worn smooth by the khutir's evenings, on two short chocks. A prop you walk
// round (NO_INTERIOR); it runs east-west.
import { kit, propPlan } from "./lib.js";

export const SIZE = { x: 1.7, z: 0.45 };
export const NO_INTERIOR = true;
const C = { bark: 0x5e4c34, wood: 0xb39468, end: 0xc8a878, chock: 0x4f3e2c };

export function build(THREE) {
  const g = new THREE.Group(); g.name = "kolody";
  const K = kit(THREE, g);
  const X = SIZE.x, zc = -SIZE.z / 2;
  K.box("chock", 0.2, 0, zc - 0.18, 0.4, 0.14, zc + 0.18, C.chock);
  K.box("chock", X - 0.4, 0, zc - 0.18, X - 0.2, 0.14, zc + 0.18, C.chock);
  K.rod("log", [0, 0.32, zc], [X, 0.32, zc], [0.2, 0.18], C.bark, g, 12);
  // the hewn seat along its top
  K.box("seat", 0.08, 0.46, zc - 0.13, X - 0.08, 0.5, zc + 0.13, C.wood);
  // its sawn ends show pale
  K.rod("end", [X - 0.005, 0.32, zc], [X + 0.005, 0.32, zc], 0.18, C.end, g, 12);
  K.shadows();
  return g;
}
export const plan = propPlan(SIZE);
