// The vatra (the fire in the middle of the maidan) as a 3D model; see
// otaman.js for what the models are for and lib.js for the pieces.
//
// The fire where the kobzar plays of an evening and the khutir eats its
// kulish (DESIGN.md "Evenings"). A ring of field stones round a bed of ash,
// split logs laid crossways and burnt down at their ends, and over it a
// tahan, an iron tripod, with the kazan (the black kulish cauldron) hanging
// from its chain. A few spare logs lie by the ring.
//
// No flames are modelled: the game lights the fire at night (maidan.gd's
// fire lamp) and can lay a flame on top, so the picture shows embers and
// ash that read by day and by night alike.
//
// A thing you walk round, not into: no interior (NO_INTERIOR). The
// footprint (solid in the game) is the ring, 1.8 x 1.2 m.

import { kit } from "./lib.js";

export const SIZE = { x: 1.8, z: 1.2 };
export const NO_INTERIOR = true;

const C = {
  stone: 0x8a857a, stoneDark: 0x6a665c, ash: 0x5a5650, ember: 0xb2482a,
  log: 0x7a6446, logEnd: 0xc8a878, char: 0x2a2420, iron: 0x3a3836, kazan: 0x26231f,
};

export function build(THREE) {
  const g = new THREE.Group();
  g.name = "vatra";
  const K = kit(THREE, g);
  const rod = (name, a, b, r, color, parent = g) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, A.distanceTo(B), 8), K.mat(color));
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    m.name = name;
    parent.add(m);
    return m;
  };

  const cx = SIZE.x / 2, cz = -SIZE.z / 2;
  const ra = 0.72, rb = 0.44;          // the ring's half-axes (east-west, north-south)

  // --- the ring of field stones, irregular -----------------------------------------
  const ring = K.group("ring");
  const N = 15;
  for (let i = 0; i < N; i++) {
    const f = (i / N) * Math.PI * 2;
    const s = 0.13 + 0.04 * Math.sin(i * 2.3);
    const st = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), K.mat(i % 3 ? C.stone : C.stoneDark));
    st.position.set(cx + ra * Math.cos(f), s * 0.55, cz + rb * Math.sin(f));
    st.scale.set(1.15, 0.7, 1);
    st.rotation.set(i * 0.7, i * 1.3, i * 0.4);
    st.name = "stone";
    ring.add(st);
  }
  // the ash bed inside, and the embers in its middle
  const ash = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.04, 20), K.mat(C.ash));
  ash.scale.set(ra - 0.08, 1, rb - 0.06); ash.position.set(cx, 0.02, cz); ash.name = "ash"; ring.add(ash);
  const emb = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.03, 16), K.mat(C.ember));
  emb.scale.set(0.3, 1, 0.2); emb.position.set(cx, 0.05, cz); emb.name = "embers"; ring.add(emb);

  // --- the logs, laid crossways and burnt down in the middle -------------------------
  const logs = K.group("logs");
  for (const [dx, dz, ex, ez, y] of [
    [-0.42, -0.05, -0.05, 0.02, 0.09], [0.42, 0.06, 0.05, -0.01, 0.09],
    [-0.12, -0.3, -0.02, -0.04, 0.16], [0.14, 0.3, 0.03, 0.05, 0.16],
  ]) {
    rod("log", [cx + dx, y, cz + dz], [cx + ex, y + 0.04, cz + ez], 0.06, C.log, logs);
    rod("char", [cx + ex * 0.5, y + 0.03, cz + ez * 0.5], [cx + ex, y + 0.05, cz + ez], 0.062, C.char, logs);
  }

  // --- the tahan (tripod), its chain and the kazan ------------------------------------
  const tah = K.group("tahan");
  const top = [cx, 1.35, cz];
  for (const f of [Math.PI * 0.75, Math.PI * 1.25, 0]) {
    rod("leg", [cx + (ra + 0.05) * Math.cos(f), 0, cz + (rb + 0.06) * Math.sin(f)], top, 0.022, C.iron, tah);
  }
  rod("chain", top, [cx, 0.78, cz], 0.012, C.iron, tah);
  // the kazan: a round-bellied cauldron with a bail
  const prof = [[0, 0], [0.12, 0.01], [0.21, 0.07], [0.25, 0.17], [0.24, 0.27], [0.21, 0.31], [0.22, 0.33]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const kz = new THREE.Mesh(new THREE.LatheGeometry(prof, 18), K.mat(C.kazan));
  kz.position.set(cx, 0.36, cz); kz.name = "kazan"; tah.add(kz);
  rod("bail", [cx - 0.22, 0.69, cz], [cx, 0.79, cz], 0.01, C.iron, tah);
  rod("bail", [cx + 0.22, 0.69, cz], [cx, 0.79, cz], 0.01, C.iron, tah);

  // --- spare logs by the ring, to the south-east ---------------------------------------
  const spare = K.group("spare");
  rod("spare", [cx + 0.35, 0.06, cz + rb + 0.13], [cx + 0.85, 0.06, cz + rb - 0.02], 0.06, C.log, spare);
  rod("spare", [cx + 0.3, 0.17, cz + rb + 0.1], [cx + 0.8, 0.17, cz + rb + 0.0], 0.055, C.log, spare);

  K.shadows();
  return g;
}

export function plan() {
  const X = SIZE.x, Z = SIZE.z;
  return {
    footprint: [[0, 0, 0], [X, 0, 0], [X, 0, -Z]],
    partitions: [],
  };
}
