// A mazha: a chumak's ox-cart, standing by the road (DESIGN.md: the chumak
// caravan). Big, heavy and plain, four solid-spoked wheels, a deep body of
// planks and wicker heaped with sacks of Crimean salt under a rush mat, a
// yoke on the ground at the front (east) and, hung at the back, the kvach,
// the chumak's tar bucket for the axles. The oxen are not part of it. A prop
// you walk round (NO_INTERIOR); it runs east-west.
import { kit, propPlan } from "./lib.js";
import { wheel } from "./wheel.js";

export const SIZE = { x: 3.8, z: 1.7 };
export const NO_INTERIOR = true;
const C = { wood: 0x7a6248, dark: 0x4f3e2c, wicker: 0x9c8250, sack: 0xd8cdb0, mat: 0x9a8a5a, tar: 0x1e1a16 };

export function build(THREE) {
  const g = new THREE.Group(); g.name = "maza";
  const K = kit(THREE, g);
  const zc = -SIZE.z / 2, x0 = 0.25, x1 = 3.05, half = 0.55;
  for (const z of [zc - half - 0.1, zc + half + 0.1]) {
    wheel(THREE, K, g, [x0 + 0.5, 0.52, z], 0.52, C.wood, C.dark);
    wheel(THREE, K, g, [x1 - 0.5, 0.52, z], 0.52, C.wood, C.dark);
  }
  for (const x of [x0 + 0.5, x1 - 0.5]) K.rod("axle", [x, 0.52, zc - half - 0.2], [x, 0.52, zc + half + 0.2], 0.05, C.dark);
  // the body: a plank bed, wicker sides
  K.box("bed", x0, 0.72, zc - half, x1, 0.8, zc + half, C.wood);
  K.box("side", x0, 0.8, zc + half - 0.06, x1, 1.3, zc + half, C.wicker);
  K.box("side", x0, 0.8, zc - half, x1, 1.3, zc - half + 0.06, C.wicker);
  K.box("end", x0, 0.8, zc - half, x0 + 0.06, 1.3, zc + half, C.wicker);
  K.box("end", x1 - 0.06, 0.8, zc - half, x1, 1.3, zc + half, C.wicker);
  for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / 5) {
    K.rod("stake", [x, 0.8, zc + half + 0.02], [x, 1.35, zc + half + 0.02], 0.025, C.dark);
    K.rod("stake", [x, 0.8, zc - half - 0.02], [x, 1.35, zc - half - 0.02], 0.025, C.dark);
  }
  // the salt sacks, heaped, under a rush mat thrown over the back half
  for (const [x, z, y] of [[0.7, -0.25, 1.3], [1.3, 0.25, 1.3], [1.9, -0.2, 1.3], [1.0, 0.0, 1.55]]) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), K.mat(C.sack));
    s.scale.set(1.3, 0.75, 1); s.position.set(x0 + x, y, zc + z); s.name = "sack"; g.add(s);
  }
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.1, 12, 1, true, 0, Math.PI), K.mat(C.mat));
  m.material.side = THREE.DoubleSide;
  m.rotation.set(Math.PI / 2, 0, Math.PI / 2); m.scale.set(1, 1, 0.55);
  m.position.set(x1 - 0.6, 1.3, zc); m.name = "mat"; g.add(m);
  // the drawbar and the yoke on the ground in front
  K.rod("drawbar", [x1 - 0.5, 0.5, zc], [SIZE.x - 0.1, 0.12, zc], 0.05, C.dark);
  K.box("yoke", SIZE.x - 0.2, 0.04, zc - 0.65, SIZE.x - 0.05, 0.14, zc + 0.65, C.wood);
  // the kvach, the tar bucket, hung from the back
  K.rod("kvach_cord", [x0 - 0.02, 0.8, zc + 0.2], [x0 - 0.12, 0.6, zc + 0.2], 0.01, C.dark);
  K.rod("kvach", [x0 - 0.12, 0.35, zc + 0.2], [x0 - 0.12, 0.6, zc + 0.2], [0.09, 0.1], C.tar, g, 10);
  K.shadows();
  return g;
}
export const plan = propPlan(SIZE);
