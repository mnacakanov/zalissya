// Hlechyky: a low plank bench by a khata's wall with clay pots and jugs
// set out on it to dry in the sun: a big makitra (mixing bowl), glechyky
// (milk jugs), a pot with a lid. A prop you walk round (NO_INTERIOR); it
// runs east-west.
import { kit, propPlan } from "./lib.js";

export const SIZE = { x: 1.6, z: 0.45 };
export const NO_INTERIOR = true;
const C = { plank: 0x8a7050, leg: 0x6a5238, clay: 0xa0583a, clayDark: 0x7a3e28, glaze: 0x5a6a3a, cream: 0xd8c8a0 };

export function build(THREE) {
  const g = new THREE.Group(); g.name = "hlechyky";
  const K = kit(THREE, g);
  const zc = -SIZE.z / 2;
  K.box("seat", 0, 0.4, -SIZE.z, SIZE.x, 0.46, 0, C.plank);
  for (const x of [0.12, SIZE.x - 0.18]) K.box("leg", x, 0, -SIZE.z + 0.04, x + 0.06, 0.4, -0.04, C.leg);
  const lathe = (name, pts, color, x, z, y = 0.46, flip = false) => {
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, h]) => new THREE.Vector2(r, h)), 14), K.mat(color));
    m.position.set(x, flip ? y + pts[pts.length - 1][1] : y, z);
    if (flip) m.rotation.x = Math.PI;
    m.name = name; g.add(m); return m;
  };
  const jug = [[0, 0], [0.06, 0.01], [0.1, 0.07], [0.11, 0.15], [0.08, 0.23], [0.05, 0.27], [0.055, 0.3], [0, 0.3]];
  const bowl = [[0, 0], [0.1, 0.01], [0.17, 0.06], [0.2, 0.13], [0.21, 0.14], [0, 0.14]];
  const pot = [[0, 0], [0.08, 0.01], [0.12, 0.08], [0.12, 0.16], [0.1, 0.2], [0.11, 0.21], [0, 0.21]];
  lathe("makitra", bowl, C.glaze, 0.3, zc);
  lathe("glechyk", jug, C.clay, 0.65, zc);
  lathe("glechyk", jug, C.clayDark, 0.9, zc, 0.46, true);   // one turned upside down to dry
  lathe("pot", pot, C.clay, 1.2, zc);
  lathe("lid", [[0, 0], [0.12, 0], [0.11, 0.02], [0.03, 0.04], [0.02, 0.07], [0, 0.07]], C.cream, 1.2, zc, 0.67);
  lathe("glechyk_small", jug.map(([r, h]) => [r * 0.7, h * 0.7]), C.cream, 1.45, zc);
  K.shadows();
  return g;
}
export const plan = propPlan(SIZE);
