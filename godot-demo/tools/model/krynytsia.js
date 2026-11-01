// The krynytsia (the khutir's well) as a 3D model; see otaman.js for what
// the models are for and lib.js for the pieces.
//
// A zhuravel, a crane well, as DESIGN.md has it: a square log crib with a
// plank lid half open, and beside it a forked post with a long sweep beam
// balanced on it. The beam's short end, to the east, carries a counterweight
// (a log chunk lashed on) and rests low; its long end rises over the crib,
// and from it a thin pole hangs straight down to a wooden bucket at the
// crib's mouth. A plank on the crib for setting the bucket down, and a
// wooden trough at its foot for the cattle.
//
// It is a thing you walk round, not into: no interior (NO_INTERIOR). The
// footprint (solid in the game) is the crib and the trough, 1.6 x 1.6 m; the
// post and beam stand outside it, to the east, and do not block.

import { kit } from "./lib.js";

export const SIZE = { x: 1.6, z: 1.6 };
export const NO_INTERIOR = true;

const C = {
  log: 0x8e7650, logDark: 0x5e4c34, plank: 0x7d6d52, water: 0x1c2228,
  post: 0x6e5a40, beam: 0x7a6446, rope: 0xb8a27a, bucket: 0x8a6a44,
  hoop: 0x3e3a36, stone: 0x8a857a, moss: 0x6e7650,
};

export function build(THREE) {
  const g = new THREE.Group();
  g.name = "krynytsia";
  const K = kit(THREE, g);

  // a round pole between two points
  const rod = (name, a, b, r, color, parent = g) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const len = A.distanceTo(B);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), K.mat(color));
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    m.name = name;
    parent.add(m);
    return m;
  };

  // --- the crib: logs laid square, their ends crossing at the corners ------------
  const cx = 0.75, cz = -0.85;         // the crib's centre
  const a = 0.55, t = 0.14, hgt = 0.85;
  const crib = K.group("crib");
  for (let i = 0, y = 0; y < hgt - 0.01; i++, y += 0.17) {
    const o = i % 2 ? 0.1 : 0;     // the log ends stick out on alternate courses
    const p = i % 2 ? 0 : 0.1;
    K.box("log", cx - a - o, y, cz + a - t, cx + a + o, y + 0.17, cz + a, C.log, crib);          // south
    K.box("log", cx - a - o, y, cz - a, cx + a + o, y + 0.17, cz - a + t, C.log, crib);          // north
    K.box("log", cx - a, y, cz - a - p, cx - a + t, y + 0.17, cz + a + p, C.logDark, crib);      // west
    K.box("log", cx + a - t, y, cz - a - p, cx + a, y + 0.17, cz + a + p, C.logDark, crib);      // east
  }
  // dark water a little way down
  K.box("water", cx - a + t, 0.55, cz - a + t, cx + a - t, 0.56, cz + a - t, C.water, crib);
  // the plank lid, half of it closed (the north half), and a plank shelf on the
  // west log for the bucket
  K.box("lid", cx - a, hgt, cz - a, cx + a, hgt + 0.04, cz - 0.02, C.plank, crib);
  K.box("shelf", cx - a - 0.05, hgt, cz - 0.02, cx - a + 0.25, hgt + 0.04, cz + a, C.plank, crib);
  // a few stones round its foot, and moss on the north side
  K.box("stones", cx - a - 0.1, 0, cz + a, cx + a + 0.1, 0.06, cz + a + 0.12, C.stone, crib);
  K.box("moss", cx - a, 0.05, cz - a - 0.01, cx + a, 0.3, cz - a, C.moss, crib);

  // --- the trough for the cattle, at the crib's south-east foot -------------------
  const tr = K.group("trough");
  K.box("trough", 0.95, 0, -0.18, 1.55, 0.3, -0.02, C.logDark, tr);
  K.box("trough_water", 0.99, 0.29, -0.15, 1.51, 0.3, -0.05, C.water, tr);

  // --- the zhuravel: the forked post and the sweep beam ----------------------------
  // The pivot stands east of the crib. The long arm rises west to a point over
  // the crib; the short arm drops east with the counterweight.
  const pivot = [cx + 2.8, 3.0, cz];
  const ang = 0.66;                    // the long arm's rise, ~38 degrees
  const short = 1.6;
  // the tip right over the crib's mouth
  const tip = [cx, pivot[1] + (pivot[0] - cx) * Math.tan(ang), cz];
  const butt = [pivot[0] + short * Math.cos(ang), pivot[1] - short * Math.sin(ang), cz];
  const zh = K.group("zhuravel");
  rod("post", [pivot[0], 0, cz], [pivot[0], pivot[1] - 0.35, cz], 0.13, C.post, zh);
  // the fork: two prongs holding the beam between them
  rod("fork_n", [pivot[0], pivot[1] - 0.4, cz], [pivot[0], pivot[1] + 0.2, cz - 0.16], 0.06, C.post, zh);
  rod("fork_s", [pivot[0], pivot[1] - 0.4, cz], [pivot[0], pivot[1] + 0.2, cz + 0.16], 0.06, C.post, zh);
  rod("pin", [pivot[0], pivot[1], cz - 0.2], [pivot[0], pivot[1], cz + 0.2], 0.025, C.hoop, zh);
  // the beam, thicker at the butt
  rod("beam_long", pivot, tip, 0.065, C.beam, zh);
  rod("beam_short", pivot, butt, 0.09, C.beam, zh);
  // the counterweight: a log chunk lashed under the butt
  rod("weight", [butt[0] - 0.25, butt[1] - 0.18, cz], [butt[0] + 0.15, butt[1] - 0.18, cz], 0.17, C.logDark, zh);
  rod("lashing", [butt[0] - 0.05, butt[1], cz], [butt[0] - 0.05, butt[1] - 0.2, cz], 0.02, C.rope, zh);
  // the pole hanging from the tip to the bucket
  const bucketTop = hgt + 0.55;
  rod("pole", tip, [cx, bucketTop + 0.05, cz], 0.025, C.post, zh);
  // the bucket: wooden staves, two iron hoops, a bail
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.3, 12), K.mat(C.bucket));
  b.position.set(cx, bucketTop - 0.15, cz); b.name = "bucket"; zh.add(b);
  for (const y of [bucketTop - 0.06, bucketTop - 0.24]) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.152, 0.152, 0.025, 12), K.mat(C.hoop));
    ring.position.set(cx, y, cz); ring.name = "hoop"; zh.add(ring);
  }
  rod("bail", [cx - 0.15, bucketTop, cz], [cx, bucketTop + 0.08, cz], 0.012, C.hoop, zh);
  rod("bail", [cx + 0.15, bucketTop, cz], [cx, bucketTop + 0.08, cz], 0.012, C.hoop, zh);

  K.shadows();
  return g;
}

// The plan in metres: the solid footprint is the crib and the trough.
export function plan() {
  const X = SIZE.x, Z = SIZE.z;
  return {
    footprint: [[0, 0, 0], [X, 0, 0], [X, 0, -Z]],
    partitions: [],
  };
}
