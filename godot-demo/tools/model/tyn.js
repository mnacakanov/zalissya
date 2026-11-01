// A tyn: one 3 m section of wattle fence, withies woven between stakes, as
// round every yard in the khutir (CONTENT_GUIDE.md), with clay pots turned
// upside down on two of the stakes to dry. A prop you walk round
// (NO_INTERIOR); it runs east-west.
import { kit, propPlan } from "./lib.js";

export const SIZE = { x: 3.0, z: 0.2 };
export const NO_INTERIOR = true;
const C = { stake: 0x6a5238, withy: 0x8f7a52, withyDark: 0x6e5c3c, pot: 0xa0583a, potDark: 0x7a3e28 };

export function build(THREE) {
  const g = new THREE.Group(); g.name = "tyn";
  const K = kit(THREE, g);
  const X = SIZE.x, zc = -SIZE.z / 2;
  const stakes = [];
  for (let x = 0.08; x < X; x += 0.48) stakes.push(x);
  for (const [i, x] of stakes.entries()) K.rod("stake", [x, 0, zc], [x, 1.15 + (i % 2) * 0.08, zc], 0.035, C.stake);
  // the withies, in bands, weaving in front of and behind the stakes
  for (let i = 0, y = 0.15; y < 1.0; i++, y += 0.09) {
    for (let k = 0; k < stakes.length - 1; k++) {
      const off = ((i + k) % 2 ? 1 : -1) * 0.045;
      K.rod("withy", [stakes[k], y, zc - off], [stakes[k + 1], y, zc + off], 0.022, i % 3 ? C.withy : C.withyDark);
    }
  }
  // two glechyky upside down on the stakes
  const prof = [[0, 0], [0.06, 0.01], [0.1, 0.06], [0.11, 0.13], [0.08, 0.2], [0.06, 0.24], [0.065, 0.27], [0, 0.27]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  for (const [k, c] of [[1, C.pot], [4, C.potDark]]) {
    const pot = new THREE.Mesh(new THREE.LatheGeometry(prof, 14), K.mat(c));
    pot.rotation.x = Math.PI;
    pot.position.set(stakes[k], 1.15 + (k % 2) * 0.08 + 0.25, zc);
    pot.name = "pot"; g.add(pot);
  }
  K.shadows();
  return g;
}
export const plan = propPlan(SIZE);
