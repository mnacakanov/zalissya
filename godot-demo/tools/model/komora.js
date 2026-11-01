// The komora (a storehouse) with its lyokh (the cellar under it) as a 3D
// model: the first building with two levels. See otaman.js for what the
// models are for and lib.js for the pieces.
//
// A komora is the farm's larder and treasury: a log building on a stone
// footing, its floor raised off the damp, a deep plank-roofed porch
// (piddashshia) on posts before the door, no pich (nothing that could burn
// the grain). Inside: the zasiky (grain bins) along the back wall, barrels,
// a skrynia for the good clothes, harness and a sickle on pegs, flitches of
// salo and strings of sausage from the beam, and in the floor the lyada, the
// hatch to the lyokh. Down there, steps cut in the clay come down under the
// hatch into a cool earth cellar lined with planks: shelves of jars, barrels
// of sauerkraut and pickles, bins of potatoes and beets in sand, and an
// oil lamp in a niche.
//
// It faces south. Units are metres; x runs east, y up, z south. The
// komora's walls stand on x 0..4.2, z -3.6..0; the cellar is dug under its
// back half and a little beyond.
//
// build(THREE, { cutaway, level }):
//   no options        the komora from outside;
//   cutaway           the komora with its roof off and near walls knee-high;
//   level: "cellar"   the lyokh alone, its floor at y 0 (the renderer and the
//                     game treat it as a room of its own; its near walls cut
//                     knee-high too, no ceiling).

import { kit } from "./lib.js";

export const SIZE = { x: 4.2, z: 3.6 };
export const WALL = { h: 2.4, t: 0.25, knee: 0.45 };
export const DOOR = { x0: 1.6, x1: 2.55, h: 1.85 };
// the raised floor: the komora stands on a stone footing
const FLOOR = 0.15;   // (a low sill: the game has no heights, so a raised floor would sink his feet)
// the hatch in the komora's floor, and the cellar
export const HATCH = { x0: 2.7, x1: 3.6, z0: -3.1, z1: -2.2 };
export const CELLAR = { x: 4.0, z: 3.2, h: 2.2, t: 0.3 };
// the cellar's steps, under the hatch, going down northward along the east wall
export const STEPS = { x0: 2.7, x1: 3.6, z0: -3.1, z1: -0.6 };

const C = {
  log: 0x8a6a48, logDark: 0x5f4630, stone: 0x8e8a78, roof: 0x7f7564,
  door: 0x5a4330, wood: 0x8a6440, woodDark: 0x5e4129, planks: 0x9a7b56,
  grain: 0xd8b860, barrel: 0x7a5634, hoop: 0x3c3c3c, salo: 0xeae0d0,
  sausage: 0x8a3a2a, iron: 0x55585c, painted: 0x2f5d8a, red: 0xa32626,
  clay: 0x7b6450, clayDark: 0x5a4838, jar: 0x9ab0a0, jar2: 0xc07a40,
  potato: 0xa08a5a, beet: 0x7a2a3a, lamp: 0xd9a040, hatch: 0x3e2e20,
};

export function build(THREE, opts = {}) {
  if (opts.level === "cellar") return buildCellar(THREE);
  const cut = !!opts.cutaway;
  const g = new THREE.Group();
  g.name = cut ? "komora_cutaway" : "komora";
  const K = kit(THREE, g);
  const { t, h, knee } = WALL;
  const X = SIZE.x, Z = SIZE.z;

  // the stone footing, its south and east sides masked with the near walls
  K.pryzba(X, Z, 0.15, FLOOR, C.stone);
  K.box("footing", 0, 0, -Z, X, FLOOR, 0, C.stone, K.group("footing"));
  const floors = K.group("floors");
  K.box("floor", t, FLOOR, -Z + t, X - t, FLOOR + 0.05, -t, C.planks, floors);

  // log walls (the walls stand on the footing, from FLOOR up)
  const walls = K.group("walls");
  const nearH = cut ? knee : h;
  const lift = (m) => { m.position.y += FLOOR; return m; };
  const before = walls.children.length;
  K.wallX("wall_south", -t, 0, 0, X, [{ a: DOOR.x0, b: DOOR.x1, y0: 0, y1: DOOR.h }], nearH, C.log, walls);
  K.wallZ("wall_east", X - t, X, -Z, 0, [], nearH, C.log, walls);
  K.wallX("wall_north", -Z, -Z + t, 0, X, [], h, C.log, walls);
  K.wallZ("wall_west", 0, t, -Z, 0, [{ a: -2.2, b: -1.7, y0: 1.4, y1: 1.7 }], h, C.log, walls);
  walls.children.slice(before).forEach(lift);
  if (!cut) {
    // the logs' courses, as ink lines on the near walls
    const lines = [];
    for (let y = FLOOR + 0.25; y < FLOOR + h; y += 0.25) {
      lines.push(0, y, 0.01, DOOR.x0, y, 0.01);
      if (y > FLOOR + DOOR.h) lines.push(DOOR.x0, y, 0.01, DOOR.x1, y, 0.01);
      lines.push(DOOR.x1, y, 0.01, X, y, 0.01);
      lines.push(X + 0.01, y, 0, X + 0.01, y, -Z);
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
    const ll = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2a2018 }));
    ll.name = "log_courses";
    ll.userData.inkOnly = true;
    walls.add(ll);
    // the corner log ends, sticking out
    for (const [x, z] of [[X, 0], [0, 0], [X, -Z]]) K.box("log_ends", x - 0.12, FLOOR, z - 0.12, x + 0.12, FLOOR + h, z + 0.12, C.logDark, walls);
    // the door, a heavy plank leaf with an iron hasp
    const fx = K.group("door");
    K.box("door_leaf", DOOR.x0, FLOOR, -0.15, DOOR.x1, FLOOR + DOOR.h, -0.1, C.door, fx);
    K.box("hasp", DOOR.x1 - 0.2, FLOOR + 0.9, -0.1, DOOR.x1 - 0.1, FLOOR + 1.05, -0.06, C.iron, fx);
    // the roof: a hip roof of planks, its eaves deep over the porch
    K.hipRoof(X, Z, FLOOR + h, FLOOR + h + 1.7, 0.45, C.roof);
    // the piddashshia: the roof runs on out over a porch on posts
    const porch = K.group("porch");
    K.poly("porch_roof", [[-0.45, FLOOR + h, 0.45], [X + 0.45, FLOOR + h, 0.45], [X + 0.45, FLOOR + h - 0.55, 1.6], [-0.45, FLOOR + h - 0.55, 1.6]], C.roof, porch);
    for (const x of [0.1, X / 2, X - 0.1]) K.box("porch_post", x - 0.08, 0, 1.35, x + 0.08, FLOOR + h - 0.5, 1.5, C.woodDark, porch);
  }
  // the porch floor and steps (in the cutaway too: you climb them to go in)
  const pf = K.group("porch_floor");
  K.box("porch_deck", 0, 0, 0, X, FLOOR, 1.5, C.planks, pf);
  K.box("porch_step", DOOR.x0 - 0.2, 0, 1.5, DOOR.x1 + 0.2, FLOOR / 2, 1.85, C.planks, pf);

  // --- inside -----------------------------------------------------------------------
  const inside = K.group("inside");
  const fur = (name, x0, y0, z0, x1, y1, z1, color) => {
    const m = K.box(name, x0, y0 + FLOOR, z0, x1, y1 + FLOOR, z1, color, inside);
    m.userData.solid = y0 < 0.3;
    return m;
  };
  // the zasiky: grain bins along the north wall, west of the hatch
  fur("zasik", t, 0, -Z + t, 1.3, 1.0, -Z + t + 0.9, C.wood);
  K.box("grain", t + 0.05, FLOOR + 1.0, -Z + t + 0.05, 1.25, FLOOR + 1.02, -Z + t + 0.85, C.grain, inside);
  fur("zasik", 1.35, 0, -Z + t, 2.5, 1.0, -Z + t + 0.9, C.wood);
  K.box("grain", 1.4, FLOOR + 1.0, -Z + t + 0.05, 2.45, FLOOR + 1.02, -Z + t + 0.85, C.grain, inside);
  // barrels by the west wall, the skrynia by the east
  for (const [x, z] of [[0.75, -1.9], [0.75, -1.1]]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.3, 0.85, 14), K.mat(C.barrel));
    b.position.set(x, FLOOR + 0.425, z);
    b.name = "barrel";
    b.userData.solid = true;
    inside.add(b);
  }
  fur("skrynia", X - t - 0.55, 0, -1.6, X - t, 0.6, -0.5, C.painted);
  K.box("skrynia_flowers", X - t - 0.57, FLOOR + 0.15, -1.4, X - t - 0.55, FLOOR + 0.45, -0.7, C.red, inside);
  // harness and a sickle on pegs, salo and sausage from the beam
  K.box("harness", t, FLOOR + 1.3, -3.0, t + 0.06, FLOOR + 1.9, -2.6, 0x4a3020, inside);
  K.box("sickle", t, FLOOR + 1.4, -0.9, t + 0.05, FLOOR + 1.8, -0.6, C.iron, inside);
  K.box("beam", 0.5, FLOOR + 2.1, -2.0, X - 0.5, FLOOR + 2.18, -1.9, C.woodDark, inside);
  K.box("salo", 1.0, FLOOR + 1.6, -2.0, 1.3, FLOOR + 2.1, -1.9, C.salo, inside);
  K.box("sausage", 1.6, FLOOR + 1.5, -1.98, 1.75, FLOOR + 2.1, -1.92, C.sausage, inside);
  K.box("sausage", 1.95, FLOOR + 1.6, -1.98, 2.1, FLOOR + 2.1, -1.92, C.sausage, inside);
  // the lyada, open, the dark of the cellar under it, the lid leant back
  K.box("hatch_hole", HATCH.x0, FLOOR + 0.051, HATCH.z0, HATCH.x1, FLOOR + 0.055, HATCH.z1, 0x120d08, inside);
  K.box("hatch_lid", HATCH.x0, FLOOR + 0.05, HATCH.z0 - 0.08, HATCH.x1, FLOOR + 0.9, HATCH.z0 - 0.02, C.hatch, inside).rotation.x = 0.15;

  K.shadows();
  return g;
}

function buildCellar(THREE) {
  const g = new THREE.Group();
  g.name = "lyokh";
  const K = kit(THREE, g);
  const { x: X, z: Z, h, t } = CELLAR;
  const knee = WALL.knee;
  // its floor is y 0 here; in the house it lies about 2.2 m under the komora
  K.box("floor", t, -0.05, -Z + t, X - t, 0, -t, C.clayDark, K.group("floors"));
  const walls = K.group("walls");
  // earth walls lined with planks; the near ones cut knee-high, as a room is
  K.wallX("wall_south", -t, 0, 0, X, [], knee, C.clay, walls);
  K.wallZ("wall_east", X - t, X, -Z, 0, [], knee, C.clay, walls);
  K.wallX("wall_north", -Z, -Z + t, 0, X, [], h, C.clay, walls);
  K.wallZ("wall_west", 0, t, -Z, 0, [], h, C.clay, walls);
  // the planks lining the far walls
  for (let x = 0.35; x < X - 0.3; x += 0.5) K.box("lining", x, 0, -Z + t, x + 0.42, h, -Z + t + 0.03, C.planks, walls);
  for (let z = -Z + 0.35; z < -0.3; z += 0.5) K.box("lining", t, 0, z, t + 0.03, h, z + 0.42, C.planks, walls);
  // the steps come down from the hatch along the east wall, from the north
  // (under the hatch, at the top) to the south (their foot)
  const steps = K.group("steps");
  const n = 8;
  for (let i = 0; i < n; i++) {
    const z1 = STEPS.z0 + ((i + 1) * (STEPS.z1 - STEPS.z0)) / n;
    const y = h - ((i + 1) * h) / n;
    const m = K.box("step", STEPS.x0, 0, STEPS.z0, STEPS.x1, y + h / n, z1, C.clay, steps);
    m.userData.solid = i < n - 2;   // the lowest two you can stand on
  }
  // the light from the hatch above: a pale square on the steps (only a hint)
  K.box("hatch_light", STEPS.x0, h + 0.01, STEPS.z0, STEPS.x1, h + 0.02, STEPS.z0 + 0.9, 0xf1e6c8, steps);
  const inside = K.group("inside");
  const fur = K.furnisher(inside);
  // shelves of jars along the north wall
  fur("shelves", 0.5, 0, -Z + t, 2.4, 1.8, -Z + t + 0.35, C.woodDark);
  let n2 = 0;
  for (let y = 0.4; y < 1.8; y += 0.45) {
    for (let x = 0.6; x < 2.3; x += 0.28) K.box("jar", x, y, -Z + t + 0.05, x + 0.18, y + 0.24, -Z + t + 0.25, n2++ % 3 ? C.jar : C.jar2, inside);
  }
  // barrels of sauerkraut and pickles by the west wall
  for (const [x, z] of [[0.75, -1.9], [0.75, -1.1]]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.33, 0.9, 14), K.mat(C.barrel));
    b.position.set(x, 0.45, z);
    b.name = "barrel";
    b.userData.solid = true;
    inside.add(b);
  }
  // bins of potatoes and beets in sand, in the middle
  fur("bin_potatoes", 1.4, 0, -1.6, 2.2, 0.6, -0.8, C.wood);
  K.box("potatoes", 1.45, 0.6, -1.55, 2.15, 0.66, -0.85, C.potato, inside);
  fur("bin_beets", 1.4, 0, -0.7, 2.2, 0.6, -t, C.wood);
  K.box("beets", 1.45, 0.6, -0.65, 2.15, 0.66, -t - 0.05, C.beet, inside);
  // the oil lamp in a niche in the west wall
  K.box("lamp", t, 1.3, -2.7, t + 0.12, 1.45, -2.55, C.lamp, inside);
  K.shadows();
  return g;
}

// The plan in metres. door: the komora's door in its south wall; hatch: the
// lyada's middle; cellar: the lyokh's own plan (its footprint, the foot of
// the steps where you arrive, the top step under the hatch where you leave,
// and its lamp).
export function plan() {
  const X = SIZE.x;
  return {
    footprint: [[0, 0, 0], [X, 0, 0], [X, 0, -SIZE.z]],
    door: [DOOR.x0 / X, DOOR.x1 / X],
    // no pich: the light in a komora is the doorway's
    pich: null,
    partitions: [],
    hatch: [(HATCH.x0 + HATCH.x1) / 2, FLOOR, (HATCH.z0 + HATCH.z1) / 2],
    // where you come back up: beside the hatch, on the komora's floor
    hatch_out: [(HATCH.x0 + HATCH.x1) / 2 - 1.0, FLOOR, (HATCH.z0 + HATCH.z1) / 2 + 0.6],
    cellar: {
      footprint: [[0, 0, 0], [CELLAR.x, 0, 0], [CELLAR.x, 0, -CELLAR.z]],
      arrive: [(STEPS.x0 + STEPS.x1) / 2 - 0.6, 0, STEPS.z1 + 0.25],
      up: [(STEPS.x0 + STEPS.x1) / 2, 0, STEPS.z1 - 0.4],
      lamp: [CELLAR.t + 0.3, 1.4, -2.6],
    },
  };
}
