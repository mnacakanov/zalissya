// A viz: the khutir's hay cart by the forge (DESIGN.md "Yard things"), a
// light four-wheeled wagon with ladder sides (drabyny), heaped with hay,
// its shaft resting on the ground at the front (east). A prop you walk
// round (NO_INTERIOR); it runs east-west.
import { kit, propPlan } from "./lib.js";
import { wheel } from "./wheel.js";

export const SIZE = { x: 3.6, z: 1.5 };
export const NO_INTERIOR = true;
const C = { wood: 0x8a7050, dark: 0x5e4a34, hay: 0xc8aa62, hayDark: 0x9c8248, iron: 0x3c3c3e };

export function build(THREE) {
  const g = new THREE.Group(); g.name = "viz";
  const K = kit(THREE, g);
  const zc = -SIZE.z / 2, x0 = 0.15, x1 = 2.75;   // the body, west to east
  const half = 0.5;                                 // the body's half-width
  // wheels: small at the front, large at the back
  for (const z of [zc - half - 0.12, zc + half + 0.12]) {
    wheel(THREE, K, g, [x0 + 0.45, 0.45, z], 0.45, C.wood, C.dark);
    wheel(THREE, K, g, [x1 - 0.4, 0.38, z], 0.38, C.wood, C.dark);
  }
  K.rod("axle", [x0 + 0.45, 0.45, zc - half - 0.2], [x0 + 0.45, 0.45, zc + half + 0.2], 0.04, C.dark);
  K.rod("axle", [x1 - 0.4, 0.38, zc - half - 0.2], [x1 - 0.4, 0.38, zc + half + 0.2], 0.04, C.dark);
  // the bed, and the long pole joining the axles
  K.box("bed", x0, 0.62, zc - half, x1, 0.68, zc + half, C.wood);
  K.rod("reach", [x0, 0.52, zc], [x1, 0.48, zc], 0.04, C.dark);
  // the ladder sides, splayed out
  for (const s of [-1, 1]) {
    const z0 = zc + s * half, z1 = zc + s * (half + 0.22);
    K.rod("rail", [x0 - 0.1, 0.68, z0], [x1 + 0.1, 0.68, z0], 0.03, C.wood);
    K.rod("rail", [x0 - 0.15, 1.15, z1], [x1 + 0.15, 1.15, z1], 0.03, C.wood);
    for (let x = x0 + 0.1; x < x1; x += 0.3) K.rod("rung", [x, 0.68, z0], [x, 1.15, z1], 0.018, C.wood, g, 5);
  }
  // the hay, heaped over the sides
  const hay = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), K.mat(C.hay));
  hay.scale.set((x1 - x0) / 2 + 0.15, 0.75, half + 0.3); hay.position.set((x0 + x1) / 2, 0.95, zc); hay.name = "hay"; g.add(hay);
  K.box("hay_skirt", x0 - 0.1, 0.7, zc - half - 0.25, x1 + 0.1, 1.0, zc + half + 0.25, C.hayDark);
  // the shaft, from the front axle down to the ground
  K.rod("shaft", [x1 - 0.4, 0.4, zc], [SIZE.x - 0.05, 0.05, zc], 0.04, C.dark);
  K.rod("shaft_bar", [SIZE.x - 0.1, 0.06, zc - 0.25], [SIZE.x - 0.1, 0.06, zc + 0.25], 0.03, C.dark);
  K.shadows();
  return g;
}
export const plan = propPlan(SIZE);
