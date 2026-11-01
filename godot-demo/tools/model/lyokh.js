// A lyokh (a cellar) on its own, walked into like a hut: from outside an
// earth mound with a small timber gable; go in at its door and the mound
// lifts away like a roof, and there, in place, is the cellar dug 2.4 m into
// the ground, with the steps you walk down into it. No fade, no jump: the
// cutaway is rendered at the cellar's true depth, and the plan's "heights"
// tell the game how deep the kobzar stands (on the steps, a ramp from the
// ground at the door down to the floor). See otaman.js for what the models
// are for and lib.js for the pieces.
//
// The steps come down from the door (north) toward the camera, so every
// tread and riser shows; a flight going down away from the camera hides
// behind its own upper steps at this camera. The door faces north: the
// mound turns see-through as the kobzar walks round to it.
//
// build(THREE, {}): the mound from outside;
// build(THREE, {cutaway: true}): the cellar in its pit at its true depth,
// the near walls knee-high above its floor.
// Units are metres; x runs east, y up, z south.

import { kit } from "./lib.js";

// the cellar room (its walls' outer faces), and the steps. The flight
// comes down from the north through the room's north wall: you descend
// toward the camera, so every tread and riser shows (a flight going down
// away from the camera hides behind its own upper steps at this camera).
const R = { x: 3.6, z: 5.0, h: 2.4, t: 0.3 };
const ST = { x0: 1.3, x1: 2.25, foot: -1.4, top: -5.2, rise: 2.4, land: -6.1 };
// how deep the cellar's floor is: the steps rise exactly that far, to the ground
const DEPTH = R.h;
// the mound over it, and the entrance gable over the landing, its door
// facing north (away from the camera: the mound turns see-through as the
// kobzar walks round behind it)
export const SIZE = { x: 4.2, z: 6.4 };
const M0 = { x: -0.3, z: 0.3 };   // the mound's south-west corner, in the room's frame

const C = {
  stone: 0x7a6a50, white: 0xe9e4d6, thatch: 0xb39a5c, thatchDark: 0x7d6a3e,
  earth: 0x6f6046, grass: 0x6f7f45, grassDark: 0x55663a, timber: 0x7a5a3a,
  timberDark: 0x4e3a26, door: 0x4a3828, roof: 0x7f7564, clay: 0x7b6450,
  clayDark: 0x5a4838, planks: 0x9a7b56, step: 0x8a7258, jar: 0x9ab0a0,
  jar2: 0xc07a40, barrel: 0x7a5634, potato: 0xa08a5a, beet: 0x7a2a3a,
  lamp: 0xd9a040, light: 0xf1e6c8, wood: 0x8a6440, woodDark: 0x5e4129,
};

export function build(THREE, opts = {}) {
  if (!opts.cutaway) return buildMound(THREE);
  // the cutaway: the cellar sunk to its depth, and the gate's two timber
  // walls standing at ground level over the landing (their roof gone)
  const g = new THREE.Group();
  g.name = "lyokh_cutaway";
  const cel = buildCellar(THREE);
  cel.position.y = -DEPTH;
  g.add(cel);
  const K = kit(THREE, g);
  // the stone ring stands at ground level round the pit: the near sides
  // (south, east) cut low like any near wall, the far ones whole
  stoneRing(K, K.group("walls"), 0, STONE);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// --- outside: a low fieldstone wall under a steep thatch -----------------------------
// After the owner's reference (a Ukrainian pohrib in an open-air museum):
// a steep A of thatch coming straight down to the ground, no walls, a
// whitewashed clay gable at each end with barge boards along its edges,
// the plank door in one of them (here the north end: see the top of this
// file). A low earthen kerb holds the thatch's foot.
const STONE = 0.12;   // the kerb's height above the ground
function stoneRing(K, parent, nearH, farH) {
  const x0 = M0.x, x1 = M0.x + SIZE.x, z0 = M0.z, z1 = M0.z - SIZE.z, w = 0.4;
  // south and east are the near walls (the cutaway masks them, so they are
  // named wall_south / wall_east); the north one has the doorway
  if (nearH > 0) {   // (the cutaway leaves the near kerb out: it would hang over the pit)
    K.box("wall_south_stone", x0, 0, z0 - w, x1, nearH, z0, C.stone, parent);   // (an earth kerb)
    K.box("wall_east_stone", x1 - w, 0, z1, x1, nearH, z0, C.stone, parent);
  }
  K.box("wall_west_stone", x0, 0, z1, x0 + w, farH, z0, C.stone, parent);
  K.box("wall_north_stone", x0, 0, z1, ST.x0, farH, z1 + w, C.stone, parent);
  K.box("wall_north_stone", ST.x1, 0, z1, x1, farH, z1 + w, C.stone, parent);
}
function buildMound(THREE) {
  const g = new THREE.Group();
  g.name = "lyokh";
  const K = kit(THREE, g);
  const walls = K.group("walls");
  stoneRing(K, walls, STONE, STONE);
  // the stones' courses, for the ink pass
  const x0 = M0.x, x1 = M0.x + SIZE.x, z0 = M0.z, z1 = M0.z - SIZE.z;
  const lines = [];
  for (const y of [0.25, 0.5]) lines.push(x0, y, z0 + 0.01, x1, y, z0 + 0.01, x1 + 0.01, y, z0, x1 + 0.01, y, z1);
  const lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
  const ll = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2a2018 }));
  ll.name = "stone_courses";
  ll.userData.inkOnly = true;
  walls.add(ll);
  // the thatch: two steep slopes from just above the stones to the ridge,
  // which runs north to south, overhanging the walls a little
  const roof = K.group("roof");
  const o = 0.15, ey = 0.02, ry = 3.3, mx = (x0 + x1) / 2;
  K.poly("roof_west", [[x0 - o, ey, z0 + o], [mx, ry, z0 + o], [mx, ry, z1 - o], [x0 - o, ey, z1 - o]], C.thatch, roof);
  K.poly("roof_east", [[mx, ry, z0 + o], [x1 + o, ey, z0 + o], [x1 + o, ey, z1 - o], [mx, ry, z1 - o]], C.thatch, roof);
  // the thatch's thickness along the eaves
  K.poly("eave_e", [[x1 + o, ey - 0.25, z0 + o], [x1 + o, ey - 0.25, z1 - o], [x1 + o, ey, z1 - o], [x1 + o, ey, z0 + o]], C.thatchDark, roof);
  K.poly("eave_s", [[x0 - o, ey - 0.2, z0 + o], [x1 + o, ey - 0.2, z0 + o], [x1 + o, ey, z0 + o], [x0 - o, ey, z0 + o]], C.thatchDark, roof);
  // the south gable: boards under the thatch's end
  K.poly("gable_s", [[x0, 0, z0 + 0.01], [x1, 0, z0 + 0.01], [mx, ry - 0.2, z0 + 0.01]], C.white, roof);
  // the north gable, with the door in it (turned away from the camera)
  K.poly("gable_n", [[x0, 0, z1 - 0.01], [x1, 0, z1 - 0.01], [mx, ry - 0.2, z1 - 0.01]], C.white, roof);
  // barge boards along both gables' edges
  const ang = Math.atan2(ry - ey, mx - x0 + o), len = Math.hypot(ry - ey, mx - x0 + o);
  for (const z of [z0 + o - 0.02, z1 - o + 0.02]) {
    for (const sgn of [-1, 1]) {
      const bb = K.box("barge", -len / 2, -0.07, -0.04, len / 2, 0.07, 0.04, C.timber, roof);
      bb.position.set(mx + sgn * (mx - x0 + o) / 2, (ey + ry) / 2 + 0.06, z);
      bb.rotation.z = -sgn * ang;
    }
  }
  K.box("door_frame", ST.x0 - 0.08, 0, z1 - 0.05, ST.x1 + 0.08, 1.95, z1 + 0.02, C.timberDark, roof);
  K.box("door_leaf", ST.x0, 0, z1 - 0.07, ST.x1, 1.85, z1 - 0.03, C.door, roof);
  // the ridge itself, a bound roll of straw
  K.box("ridge", mx - 0.12, ry - 0.08, z1 - o, mx + 0.12, ry + 0.08, z0 + o, C.thatchDark, roof);
  K.shadows();
  return g;
}

// --- inside: the cellar and its steps ------------------------------------------------------
function buildCellar(THREE) {
  const g = new THREE.Group();
  g.name = "lyokh_cellar";
  const K = kit(THREE, g);
  const { x: X, z: Z, h, t } = R;
  const knee = 0.45;
  K.box("floor", t, -0.05, -Z + t, X - t, 0, -t, C.clayDark, K.group("floors"));
  const walls = K.group("walls");
  // the steps come in through the far (north) wall: a gap there
  K.wallX("wall_south", -t, 0, 0, X, [], knee, C.clay, walls);
  K.wallZ("wall_east", X - t, X, -Z, 0, [], knee, C.clay, walls);
  K.wallX("wall_north", -Z, -Z + t, 0, X, [{ a: ST.x0, b: ST.x1, y0: 0, y1: h }], h, C.clay, walls);
  K.wallZ("wall_west", 0, t, -Z, 0, [], h, C.clay, walls);
  for (const x of [0.35, 0.85, ST.x1 + 0.05, ST.x1 + 0.55]) if (x + 0.42 < X - t) K.box("lining", x, 0, -Z + t, x + 0.42, h, -Z + t + 0.03, C.planks, walls);
  for (let z = -Z + 0.35; z < -0.3; z += 0.5) K.box("lining", t, 0, z, t + 0.03, h, z + 0.42, C.planks, walls);
  // the passage beyond the north wall: earth sides up to the ground
  K.box("passage_w", ST.x0 - 0.3, 0, ST.land, ST.x0, h, -Z, C.clay, walls);
  K.box("passage_e", ST.x1, 0, ST.land, ST.x1 + 0.3, h, -Z, C.clay, walls);
  // the steps: twelve treads of 20 cm from the floor (south) up to the
  // landing (north), each a block down to the floor, with a plank nosing
  const steps = K.group("steps");
  const n = 12;
  const run = (ST.foot - ST.top) / n;
  for (let i = 0; i < n; i++) {
    const z1 = ST.foot - i * run, y = ((i + 1) * ST.rise) / n;
    K.box("step", ST.x0, 0, z1 - run, ST.x1, y, z1, C.step, steps);
    K.box("tread_edge", ST.x0, y - 0.04, z1 - 0.05, ST.x1, y, z1, C.woodDark, steps);
  }
  K.box("landing", ST.x0, 0, ST.land, ST.x1, ST.rise, ST.top, C.step, steps);
  K.box("daylight", ST.x0, ST.rise + 0.005, ST.land, ST.x1, ST.rise + 0.01, ST.top - 0.05, C.light, steps);
  // rail posts on both open sides of the flight
  for (let i = 3; i <= n; i += 3) {
    const z = ST.foot - i * run, y = (i * ST.rise) / n;
    for (const x of [ST.x0 - 0.07, ST.x1]) K.box("rail_post", x, 0, z - 0.03, x + 0.07, y + 0.9, z + 0.04, C.woodDark, steps);
  }
  // the room: shelves of jars along the north wall, barrels in the
  // south-east, bins of potatoes and beets in the middle
  const inside = K.group("inside");
  const fur = K.furnisher(inside);
  fur("shelves", ST.x1 + 0.4, 0, -Z + t, X - t, 1.8, -Z + t + 0.35, C.woodDark);
  let n2 = 0;
  for (let y = 0.4; y < 1.8; y += 0.45) {
    for (let x = ST.x1 + 0.45; x < X - t - 0.2; x += 0.27) K.box("jar", x, y, -Z + t + 0.05, x + 0.18, y + 0.24, -Z + t + 0.25, n2++ % 3 ? C.jar : C.jar2, inside);
  }
  for (const [x, z] of [[0.75, -3.9], [0.75, -3.1]]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.33, 0.9, 14), K.mat(C.barrel));
    b.position.set(x, 0.45, z);
    b.name = "barrel";
    b.userData.solid = true;
    inside.add(b);
  }
  fur("bin_potatoes", 2.6, 0, -3.4, 3.25, 0.6, -2.4, C.wood);
  K.box("potatoes", 2.65, 0.6, -3.35, 3.2, 0.66, -2.45, C.potato, inside);
  fur("bin_beets", 2.6, 0, -2.2, 3.25, 0.6, -1.4, C.wood);
  K.box("beets", 2.65, 0.6, -2.15, 3.2, 0.66, -1.45, C.beet, inside);
  // the oil lamp in a niche in the north wall
  K.box("lamp", 0.9, 1.3, -Z + t, 1.05, 1.45, -Z + t + 0.12, C.lamp, inside);
  K.shadows();
  return g;
}

// The plan in metres, on the ground (y 0): the game walks the kobzar in
// plan and lowers his figure by the depth under him ("heights"). The mound
// is the walk-in footprint, its door in the north edge; inside it, the
// cellar's walls, the passage and the flight's open sides are wall lines.
export function plan() {
  const midx = (ST.x0 + ST.x1) / 2;
  const W = SIZE.x, fz = M0.z, nz = M0.z - SIZE.z;
  const ex = M0.x + W;   // the mound's east edge
  const { x: X, z: Z, t } = R;
  const L = (a, b) => [[a[0], 0, a[1]], [b[0], 0, b[1]]];
  return {
    footprint: [[M0.x, 0, fz], [ex, 0, fz], [ex, 0, nz]],
    // its edges run SW→SE (south), SE→NE (east), NE→NW (north): t on the
    // north edge runs from its east end
    door: { wall: "north", t: [(ex - ST.x1) / W, (ex - ST.x0) / W] },
    pich: null,
    sunken: true,
    lamp: [0.97, 1.4 - DEPTH, -Z + t + 0.1],
    partitions: [
      // the cellar room's walls (their inner faces), the north one open
      // where the steps come in
      L([t, -t], [X - t, -t]), L([X - t, -t], [X - t, -Z + t]),
      L([X - t, -Z + t], [ST.x1, -Z + t]), L([ST.x0, -Z + t], [t, -Z + t]), L([t, -Z + t], [t, -t]),
      // the passage from the room up to the door
      L([ST.x0, -Z + t], [ST.x0, nz]), L([ST.x1, -Z + t], [ST.x1, nz]),
      // the flight's open sides inside the room, from a little above its foot
      L([ST.x0 - 0.05, ST.foot - 0.6], [ST.x0 - 0.05, -Z + t]), L([ST.x1 + 0.05, ST.foot - 0.6], [ST.x1 + 0.05, -Z + t]),
    ],
    heights: [
      // the steps first: from the floor at their foot up to the ground at
      // their top (and the landing beyond, at the ground)
      { quad: [[ST.x0, 0, ST.foot], [ST.x1, 0, ST.foot], [ST.x1, 0, nz], [ST.x0, 0, nz]],
        foot: [midx, 0, ST.foot], top: [midx, 0, ST.top], from: -DEPTH, to: 0 },
      // the cellar's floor
      { quad: [[t, 0, -t], [X - t, 0, -t], [X - t, 0, -Z + t], [t, 0, -Z + t]], h: -DEPTH },
    ],
  };
}
