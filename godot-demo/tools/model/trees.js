// Trees and bushes built in code: a low-poly generator. One species gives as
// many different trees as there are seeds: the height, the lean, the crown,
// the branches all vary. The trees of Zalissya: the oak (dub), the willow by
// the water (verba), the birch (bereza), the poplar (topolia); the bushes
// kalyna (guelder rose, with red berries) and lishchyna (hazel).
//
// makeTree(THREE, species, seed) returns a Group standing at the origin, its
// trunk's foot at (0, 0, 0). The species' files (derevo_*.js, kushch_*.js,
// kurtyna.js) wrap it for render.cjs. Everything is flat-shaded: faceted
// crowns read as low poly, and the painter paints over the facets.

// a small seeded random (mulberry32): the same seed, the same tree
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SPECIES = {
  // a broad old oak: a short thick trunk, heavy limbs, a wide domed crown
  dub: { h: [8, 10], trunk: [0.42, 0.55], crown: [4.0, 4.8], flat: 0.75, blobs: [9, 13], limbs: [4, 6],
         bark: 0x5a4632, leaf: [0x3d5a2a, 0x4a6a30, 0x355024], lean: 0.08, crownBase: 0.38 },
  // a willow by the water: a leaning, often forked trunk, a loose crown of
  // drooping, hanging masses, grey-green
  verba: { h: [7.5, 9], trunk: [0.38, 0.48], crown: [2.8, 3.3], flat: 0.85, blobs: [10, 13], limbs: [3, 5],
           bark: 0x6b6150, leaf: [0x7d8c5a, 0x8a9a66, 0x6e7e50], lean: 0.25, crownBase: 0.42, droop: true },
  // a birch: slender, white with black marks, a narrow airy crown, light green
  bereza: { h: [9, 12], trunk: [0.16, 0.22], crown: [2.0, 2.5], flat: 1.7, blobs: [9, 12], limbs: [3, 4],
            bark: 0xe8e4da, leaf: [0x7fa04a, 0x8fb056, 0x6f9040], lean: 0.06, crownBase: 0.4, marks: true },
  // a Lombardy poplar: a tall green column
  topolia: { h: [12, 15], trunk: [0.22, 0.3], crown: [1.5, 1.8], flat: 3.4, blobs: [14, 17], limbs: [0, 0],
             bark: 0x6a604e, leaf: [0x4f6e34, 0x5a7a3a, 0x46622e], lean: 0.02, crownBase: 0.12 },
  // bushes: several stems from the ground and a low round mass
  kalyna: { h: [2.0, 2.6], trunk: [0.05, 0.07], crown: [1.2, 1.5], flat: 0.8, blobs: [5, 7], limbs: [0, 0],
            bark: 0x6a5642, leaf: [0x4e6e34, 0x5c7c3e, 0x46642e], lean: 0, crownBase: 0.15, bush: true, berries: 0xb3202a },
  lishchyna: { h: [2.6, 3.4], trunk: [0.06, 0.08], crown: [1.5, 1.9], flat: 0.95, blobs: [6, 8], limbs: [0, 0],
               bark: 0x7a6648, leaf: [0x5a7a36, 0x668840, 0x506e30], lean: 0, crownBase: 0.12, bush: true },
};

export function makeTree(THREE, species, seed) {
  const S = SPECIES[species];
  const R = rng(seed * 7919 + species.length * 104729);
  const pick = ([a, b]) => a + (b - a) * R();
  const g = new THREE.Group();
  g.name = `${species}_${seed}`;
  const mats = {};
  const mat = (c) => (mats[c] ??= new THREE.MeshStandardMaterial({ color: c, roughness: 1, metalness: 0, flatShading: true }));
  const H = pick(S.h), r0 = pick(S.trunk), CR = pick(S.crown);
  const leanA = R() * Math.PI * 2, lean = S.lean * (0.5 + R());
  const lx = Math.cos(leanA) * lean, lz = Math.sin(leanA) * lean;
  // the trunk: a tapering six-sided column, bent by its lean, in segments
  const top = H * (S.bush ? 0.6 : (1 - S.crownBase * 0.6));
  const pts = [];
  const nSeg = 4;
  for (let i = 0; i <= nSeg; i++) {
    const f = i / nSeg;
    pts.push(new THREE.Vector3(lx * top * f * f, top * f, lz * top * f * f));
  }
  const stems = S.bush ? 4 + Math.floor(R() * 3) : 1;
  for (let s = 0; s < stems; s++) {
    const a = (s / stems) * Math.PI * 2 + R();
    const off = S.bush ? new THREE.Vector3(Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25) : new THREE.Vector3();
    const tilt = S.bush ? new THREE.Vector3(Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35) : new THREE.Vector3();
    for (let i = 0; i < nSeg; i++) {
      const p = pts[i].clone().add(off).addScaledVector(tilt, pts[i].y);
      const q = pts[i + 1].clone().add(off).addScaledVector(tilt, pts[i + 1].y);
      const ra = r0 * (1 - 0.55 * (i / nSeg)), rb = r0 * (1 - 0.55 * ((i + 1) / nSeg));
      const seg = cylinderBetween(THREE, p, q, rb, ra, mat(S.bark));
      seg.name = "trunk";
      g.add(seg);
    }
  }
  // birch: black marks on the white bark
  if (S.marks) {
    for (let i = 0; i < 9; i++) {
      const y = 0.4 + R() * top * 0.9;
      const a = R() * Math.PI * 2;
      const rr = r0 * (1 - 0.5 * (y / top)) + 0.005;
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.12 + R() * 0.1, 0.05, 0.02), mat(0x1e1c1a));
      m.position.set(lx * y * y / top + Math.cos(a) * rr, y, lz * y * y / top + Math.sin(a) * rr);
      m.rotation.y = -a + Math.PI / 2;
      m.name = "bark_mark";
      g.add(m);
    }
  }
  // limbs: a few thick branches from the upper trunk out into the crown
  const crownC = new THREE.Vector3(lx * top, H - CR * S.flat * (S.droop ? 0.9 : 0.75), lz * top);
  const limbEnds = [];
  const nL = Math.round(pick(S.limbs));
  for (let i = 0; i < nL; i++) {
    const a = (i / Math.max(1, nL)) * Math.PI * 2 + R() * 0.8;
    const from = new THREE.Vector3(lx * top * 0.7, top * (0.65 + R() * 0.3), lz * top * 0.7);
    const to = crownC.clone().add(new THREE.Vector3(Math.cos(a) * CR * 0.65, (R() - 0.2) * CR * 0.5, Math.sin(a) * CR * 0.65));
    const l = cylinderBetween(THREE, from, to, r0 * 0.25, r0 * 0.45, mat(S.bark));
    l.name = "limb";
    g.add(l);
    limbEnds.push(to);
  }
  // the crown: clusters of jittered low-poly blobs round the crown's middle
  // and the limbs' ends
  const nB = Math.round(pick(S.blobs));
  for (let i = 0; i < nB; i++) {
    let c;
    if (S.flat > 2) {
      // a poplar: masses stacked up the trunk from low down to the top
      const f = (i + 0.5) / nB;
      c = new THREE.Vector3(lx * top * f * f + (R() - 0.5) * CR * 0.4, H * (0.12 + 0.8 * f), lz * top * f * f + (R() - 0.5) * CR * 0.4);
    } else if (S.bush) {
      const a = R() * Math.PI * 2, rr = Math.sqrt(R()) * CR * 0.55;
      c = new THREE.Vector3(Math.cos(a) * rr, H * (0.35 + R() * 0.3), Math.sin(a) * rr);
    } else if (limbEnds.length && i < limbEnds.length) c = limbEnds[i].clone();
    else {
      const a = R() * Math.PI * 2, rr = Math.sqrt(R()) * CR * 0.75;
      c = crownC.clone().add(new THREE.Vector3(Math.cos(a) * rr, (R() - 0.35) * CR * S.flat * 0.9, Math.sin(a) * rr));
    }
    const rad = CR * (0.42 + R() * 0.28) * (S.bush ? 0.7 : S.flat > 2 ? 0.95 : 1);
    const geo = new THREE.IcosahedronGeometry(rad, 1);
    const pos = geo.attributes.position;
    for (let v = 0; v < pos.count; v++) {
      const j = 0.82 + 0.3 * hash3(pos.getX(v) + i, pos.getY(v), pos.getZ(v));
      pos.setXYZ(v, pos.getX(v) * j, pos.getY(v) * j * (S.droop ? 1.25 : S.flat > 2 ? 1.7 : 0.9), pos.getZ(v) * j);
    }
    // a willow's masses hang: pull their lower halves down
    if (S.droop) for (let v = 0; v < pos.count; v++) if (pos.getY(v) < 0) pos.setY(v, pos.getY(v) * 1.8);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat(S.leaf[i % S.leaf.length]));
    m.position.copy(c);
    m.rotation.set(R() * 3, R() * 3, R() * 3);
    m.name = "leaves";
    g.add(m);
  }
  // kalyna's berries: red clusters on the crown's sunny side
  if (S.berries) {
    for (let i = 0; i < 12; i++) {
      const a = -Math.PI * (0.1 + R() * 0.8), rr = CR * (0.75 + R() * 0.2);
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07 + R() * 0.04, 0), mat(S.berries));
      b.position.set(Math.cos(a) * rr * 0.75, H * (0.3 + R() * 0.35), -Math.sin(a) * rr * 0.5 + 0.35);
      b.name = "berries";
      g.add(b);
    }
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

function cylinderBetween(THREE, a, b, rTop, rBottom, material) {
  const d = new THREE.Vector3().subVectors(b, a);
  const geo = new THREE.CylinderGeometry(rTop, rBottom, d.length(), 6, 1);
  const m = new THREE.Mesh(geo, material);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  return m;
}

function hash3(x, y, z) {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

// A tree file for render.cjs: the footprint is its trunk (what the kobzar
// bumps into); the picture shows the whole tree.
export function treeModel(species, seed, trunk = 0.6) {
  return {
    SIZE: { x: trunk, z: trunk },
    NO_INTERIOR: true,
    build: (THREE) => {
      const g = new THREE.Group();
      const t = makeTree(THREE, species, seed);
      t.position.set(trunk / 2, 0, -trunk / 2);
      g.add(t);
      return g;
    },
    plan: () => ({ footprint: [[0, 0, 0], [trunk, 0, 0], [trunk, 0, -trunk]], partitions: [] }),
  };
}
