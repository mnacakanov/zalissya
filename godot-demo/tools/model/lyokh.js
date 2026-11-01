// A lyokh (a cellar) on its own, with real steps down: from outside an
// earth mound with a small timber gable and a door; inside, steps cut down
// through the near wall into a cool room under the ground. You walk down
// the steps and up them; the game lifts the kobzar as he climbs (the
// plan's "stairs": their outline, their foot and top, and how high they
// rise). See otaman.js for what the models are for and lib.js for the pieces.
//
// The steps come down from the door (south) toward the north, along the
// room's west wall: you descend going away from the camera, which is how a
// cellar under a mound is entered, and you see the whole flight from above.
//
// build(THREE, {}): the mound from outside (no interior: it is not a room
// you see into from above);
// build(THREE, {level: "cellar"}): the cellar alone, its floor at y 0.
// Units are metres; x runs east, y up, z south.

import { kit } from "./lib.js";

// the cellar room (its walls' outer faces), and the steps. The flight
// comes down from the north through the room's north wall: you descend
// toward the camera, so every tread and riser shows (a flight going down
// away from the camera hides behind its own upper steps at this camera).
const R = { x: 3.6, z: 5.0, h: 2.4, t: 0.3 };
const ST = { x0: 1.3, x1: 2.25, foot: -1.4, top: -5.2, rise: 2.4, land: -5.6 };
// the mound over it, and the entrance gable over the landing, its door
// facing north (away from the camera: the mound turns see-through as the
// kobzar walks round behind it)
export const SIZE = { x: 4.2, z: 6.4 };
const M0 = { x: -0.3, z: 0.3 };   // the mound's south-west corner, in the room's frame
// (no interior picture: a mound is not a room you see into from above)
export const NO_INTERIOR = true;

const C = {
  earth: 0x6f6046, grass: 0x6f7f45, grassDark: 0x55663a, timber: 0x7a5a3a,
  timberDark: 0x4e3a26, door: 0x4a3828, roof: 0x7f7564, clay: 0x7b6450,
  clayDark: 0x5a4838, planks: 0x9a7b56, step: 0x8a7258, jar: 0x9ab0a0,
  jar2: 0xc07a40, barrel: 0x7a5634, potato: 0xa08a5a, beet: 0x7a2a3a,
  lamp: 0xd9a040, light: 0xf1e6c8, wood: 0x8a6440, woodDark: 0x5e4129,
};

export function build(THREE, opts = {}) {
  return opts.level === "cellar" ? buildCellar(THREE) : buildMound(THREE);
}

// --- outside: the mound and its gable ---------------------------------------------------
function buildMound(THREE) {
  const g = new THREE.Group();
  g.name = "lyokh";
  const K = kit(THREE, g);
  // the mound: an earth barrow, long north to south, grassed over (a hip of
  // earth from a low foot to a rounded ridge)
  const mound = K.group("mound");
  const ox = M0.x, oz = M0.z, X = SIZE.x, Z = SIZE.z;
  const sub = new THREE.Group();
  sub.position.set(ox, 0, oz);
  mound.add(sub);
  const K2 = kit(THREE, sub);
  K2.hipRoof(X, Z, 0.5, 2.3, 0, C.grass, C.earth);
  K2.box("mound_foot", 0, 0, -Z, X, 0.5, 0, C.earth);
  // the entrance gable at the north end, over the landing: two timber walls
  // and a little plank roof, the door in its north face
  const gate = K.group("gate");
  const gx0 = ST.x0 - 0.35, gx1 = ST.x1 + 0.35, gz0 = M0.z - SIZE.z - 0.05, gz1 = ST.top + 0.3;
  K.box("gate_wall_w", gx0, 0, gz0, gx0 + 0.2, 1.95, gz1, C.timber, gate);
  K.box("gate_wall_e", gx1 - 0.2, 0, gz0, gx1, 1.95, gz1, C.timber, gate);
  K.box("gate_lintel", gx0, 1.85, gz0, gx1, 2.05, gz0 + 0.2, C.timberDark, gate);
  K.box("door_leaf", ST.x0, 0, gz0 - 0.02, ST.x1, 1.85, gz0 + 0.04, C.door, gate);
  const mid = (gx0 + gx1) / 2;
  K.poly("gate_roof_w", [[gx0 - 0.15, 1.95, gz1], [mid, 2.6, gz1], [mid, 2.6, gz0 - 0.2], [gx0 - 0.15, 1.95, gz0 - 0.2]], C.roof, gate);
  K.poly("gate_roof_e", [[mid, 2.6, gz1], [gx1 + 0.15, 1.95, gz1], [gx1 + 0.15, 1.95, gz0 - 0.2], [mid, 2.6, gz0 - 0.2]], C.roof, gate);
  // a vent pipe toward the mound's south end
  K.box("vent", 2.6, 1.2, -1.6, 2.8, 2.4, -1.4, C.timberDark, mound);
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

// The plan in metres. The mound's footprint is what the game makes solid
// outside; descend.at is the threshold before its door, descend.out where
// you come back out. The cellar's footprint is the room; its south wall has
// a gap where the steps come through ("gap", t along the wall from its
// south-west corner); "walls" close the flight's open side and its landing;
// "stairs" tells the game how high you stand on them.
export function plan() {
  const midx = (ST.x0 + ST.x1) / 2;
  const fz = M0.z;
  const nz = M0.z - SIZE.z;   // the mound's north edge, where its door is
  return {
    footprint: [[M0.x, 0, fz], [M0.x + SIZE.x, 0, fz], [M0.x + SIZE.x, 0, nz]],
    door: null,
    pich: null,
    partitions: [],
    descend: { at: [midx, 0, nz - 0.4], out: [midx, 0, nz - 1.2] },
    cellar: {
      footprint: [[0, 0, 0], [R.x, 0, 0], [R.x, 0, -R.z]],
      gap: { wall: "north", t: [(R.x - ST.x1) / R.x, (R.x - ST.x0) / R.x] },
      walls: [
        // the flight's open sides, from a little above its foot to the landing
        [[ST.x0 - 0.05, 0, ST.foot - 0.6], [ST.x0 - 0.05, 0, ST.land]],
        [[ST.x1 + 0.05, 0, ST.foot - 0.6], [ST.x1 + 0.05, 0, ST.land]],
        // the landing's end, under the door
        [[ST.x0 - 0.05, 0, ST.land], [ST.x1 + 0.05, 0, ST.land]],
      ],
      stairs: {
        quad: [[ST.x0, 0, ST.foot], [ST.x1, 0, ST.foot], [ST.x1, 0, ST.land], [ST.x0, 0, ST.land]],
        foot: [midx, 0, ST.foot], top: [midx, 0, ST.top], rise: ST.rise,
      },
      // you arrive near the top of the flight and walk down it; you leave
      // from the landing
      arrive: [midx, 0, ST.top + 0.75],
      up: [midx, 0, (ST.top + ST.land) / 2],
      lamp: [0.97, 1.4, -R.z + R.t + 0.1],
    },
  };
}
