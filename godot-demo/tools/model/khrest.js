// The fihura: a wayside cross on the road into the khutir (data/village.ts
// WAYSIDE_CROSS), as they stood at Ukrainian crossroads: a tall oak cross
// with three bars (the lowest slanting), a little gabled plank roof over its
// head, an embroidered rushnyk tied on, set in a cairn of field stones. A
// prop you walk round (NO_INTERIOR).
import { kit, propPlan } from "./lib.js";

export const SIZE = { x: 0.9, z: 0.9 };
export const NO_INTERIOR = true;
const C = { oak: 0x5e4a34, roof: 0x6e5e44, stone: 0x8a857a, stoneDark: 0x6a665c, rushnyk: 0xeee6d2, red: 0xa32626 };

export function build(THREE) {
  const g = new THREE.Group(); g.name = "khrest";
  const K = kit(THREE, g);
  const cx = SIZE.x / 2, cz = -SIZE.z / 2;
  // the cairn
  for (let i = 0; i < 11; i++) {
    const f = i * 2.4, r = i < 7 ? 0.32 : 0.15, s = 0.12 + 0.03 * Math.sin(i * 3.1);
    const st = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), K.mat(i % 3 ? C.stone : C.stoneDark));
    st.position.set(cx + r * Math.cos(f), i < 7 ? s * 0.6 : 0.22, cz + r * Math.sin(f));
    st.scale.y = 0.75; st.rotation.set(i, i * 0.5, 0); st.name = "stone"; g.add(st);
  }
  // the cross, its face toward the road (south)
  const top = 2.7;
  K.box("upright", cx - 0.06, 0, cz - 0.06, cx + 0.06, top, cz + 0.06, C.oak);
  K.box("bar_top", cx - 0.18, top - 0.32, cz - 0.04, cx + 0.18, top - 0.24, cz + 0.04, C.oak);
  K.box("bar", cx - 0.42, top - 0.72, cz - 0.05, cx + 0.42, top - 0.62, cz + 0.05, C.oak);
  K.box("bar_foot", cx - 0.26, 0.85, cz - 0.04, cx + 0.26, 0.93, cz + 0.04, C.oak).rotation.z = 0.35;
  // the little roof over its head, gabled east-west
  const rx = 0.3, ry = top + 0.02, rz = 0.22;
  K.poly("roof_s", [[cx - rx, ry, cz + rz], [cx + rx, ry, cz + rz], [cx + rx, ry + 0.2, cz], [cx - rx, ry + 0.2, cz]], C.roof);
  K.poly("roof_n", [[cx - rx, ry, cz - rz], [cx + rx, ry, cz - rz], [cx + rx, ry + 0.2, cz], [cx - rx, ry + 0.2, cz]], C.roof);
  // the rushnyk tied at the crossing, hanging down both arms
  K.box("rushnyk", cx - 0.36, top - 1.05, cz + 0.055, cx - 0.28, top - 0.62, cz + 0.07, C.rushnyk);
  K.box("rushnyk", cx + 0.28, top - 1.05, cz + 0.055, cx + 0.36, top - 0.62, cz + 0.07, C.rushnyk);
  K.box("rushnyk_red", cx - 0.36, top - 1.0, cz + 0.07, cx - 0.28, top - 0.96, cz + 0.075, C.red);
  K.box("rushnyk_red", cx + 0.28, top - 1.0, cz + 0.07, cx + 0.36, top - 0.96, cz + 0.075, C.red);
  K.shadows();
  return g;
}
export const plan = propPlan(SIZE);
