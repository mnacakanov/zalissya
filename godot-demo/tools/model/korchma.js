// The korchma on the chumak road (DESIGN.md "The korchma") as a 3D model;
// see otaman.js for what the models are for and lib.js for the pieces.
//
// A long log house, not a clay one, under a shaggy dark thatch, small
// lamplit windows, the door standing open and the vykha (a sheaf of straw
// on a pole, the inn's sign) hung out over it; a bench along the front. It
// faces south. Inside, one smoky hall: the shynkvas (the counter) across the
// back with barrels and shelves of mugs behind it, Okhrim's debt chalked on
// its front; two long tables with benches; the pich by the door; the hatch
// to the cellar. Odarka keeps it.

import { kit } from "./lib.js";

export const SIZE = { x: 9.0, z: 6.0 };
export const WALL = { h: 2.4, t: 0.3, knee: 0.45 };
export const DOOR = { x0: 4.1, x1: 5.1, h: 1.9 };   // in the south wall

const C = {
  log: 0x9a7e56, logDark: 0x6e5a3e, stone: 0x7f7a6a, floor: 0x7a6448, thatch: 0x7a6a48, thatchDark: 0x4f4430,
  clay: 0xd9c4a0, door: 0x5e4630, lamp: 0xd8a04a, shutter: 0x5a4a38, wood: 0x7a6248, woodDark: 0x4f3e2c,
  barrel: 0x6e5236, hoop: 0x3c3c3e, mug: 0xb07a4a, cloth: 0xc8b890, straw: 0xc8aa62, hatch: 0x3e3226,
};

export function build(THREE, opts = {}) {
  const cut = !!opts.cutaway;
  const g = new THREE.Group();
  g.name = cut ? "korchma_cutaway" : "korchma";
  const K = kit(THREE, g);
  const { t, h, knee } = WALL;
  const X = SIZE.x, Z = SIZE.z;

  K.pryzba(X, Z, 0.2, 0.25, C.stone);
  K.box("floor", t, 0, -Z + t, X - t, 0.05, -t, C.floor, K.group("floors"));

  const walls = K.group("walls");
  const win = (a, b) => ({ a, b, y0: 1.0, y1: 1.55 });
  const S_WIN = [[1.6, 2.3], [6.6, 7.3]];
  const E_WIN = [[-3.4, -2.7]];
  const nearH = cut ? knee : h;
  K.wallX("wall_south", -t, 0, 0, X, [...S_WIN.map(([a, b]) => win(a, b)), { a: DOOR.x0, b: DOOR.x1, y0: 0, y1: DOOR.h }], nearH, C.log, walls);
  K.wallZ("wall_east", X - t, X, -Z, 0, E_WIN.map(([a, b]) => win(a, b)), nearH, C.log, walls);
  K.wallX("wall_north", -Z, -Z + t, 0, X, [], h, C.log, walls);
  K.wallZ("wall_west", 0, t, -Z, 0, [], h, C.log, walls);

  if (!cut) {
    const fx = K.group("details");
    // corner log ends at the three corners we see
    for (let i = 0, y = 0.3; y < h - 0.1; i++, y += 0.3) {
      const a = i % 2 ? 0.18 : 0;
      K.box("log_end", -a, y, -t, 0, y + 0.24, 0, C.logDark, fx);
      K.box("log_end", X, y, -t, X + a, y + 0.24, 0, C.logDark, fx);
      K.box("log_end", X, y, -Z, X + a, y + 0.24, -Z + t, C.logDark, fx);
    }
    // log courses as ink lines on the faces we see
    const lines = [];
    for (let y = 0.3; y < h - 0.05; y += 0.25) {
      lines.push(0, y, 0.003, X, y, 0.003);
      lines.push(X + 0.003, y, -Z, X + 0.003, y, 0);
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
    const ll = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2a2018 }));
    ll.name = "log_courses"; ll.userData.inkOnly = true; fx.add(ll);
    // small lamplit windows with plank shutters
    for (const [a, b] of S_WIN) {
      K.box("pane", a, 1.0, -0.2, b, 1.55, -0.15, C.lamp, fx);
      K.box("shutter", a - 0.36, 1.0, 0, a - 0.03, 1.55, 0.05, C.shutter, fx);
    }
    K.box("pane", X - 0.2, 1.0, E_WIN[0][0], X - 0.15, 1.55, E_WIN[0][1], C.lamp, fx);
    // the door standing open, swung in, warm light in the gap
    K.box("door_light", DOOR.x0, 0.05, -0.28, DOOR.x1, DOOR.h, -0.26, C.lamp, fx);
    const d = K.box("door_open", DOOR.x0, 0, -0.3, DOOR.x0 + 0.06, DOOR.h, -0.3 + 0.95, C.door, fx);
    d.position.z -= 0.65;
    K.box("step", DOOR.x0 - 0.15, 0, 0, DOOR.x1 + 0.15, 0.12, 0.45, C.stone, fx);
    // the vykha: a pole out over the door with a sheaf of straw hung on it
    K.rod("vykha_pole", [DOOR.x1 + 0.2, 2.1, -0.05], [DOOR.x1 + 0.2, 2.25, 0.9], 0.035, C.woodDark, fx);
    K.rod("vykha", [DOOR.x1 + 0.2, 2.2, 0.82], [DOOR.x1 + 0.2, 1.65, 0.82], [0.05, 0.16], C.straw, fx, 9);
    // a bench along the front, west of the door
    K.box("bench_out", 0.4, 0.42, 0.25, 1.4, 0.48, 0.6, C.wood, fx);
    K.box("bench_leg", 0.5, 0, 0.3, 0.58, 0.42, 0.55, C.woodDark, fx);
    K.box("bench_leg", 1.22, 0, 0.3, 1.3, 0.42, 0.55, C.woodDark, fx);
    // the shaggy dark thatch, and the pich's chimney through it
    K.hipRoof(X, Z, h - 0.15, h + 2.6, 0.7, C.thatch, C.thatchDark);
    K.box("chimney", 0.9, h, -1.5, 1.4, h + 2.2, -1.0, C.clay, K.group("chimney"));
  }

  // --- inside -----------------------------------------------------------------------
  const inside = K.group("inside");
  const fur = K.furnisher(inside);
  const back = -Z + t;
  // the shynkvas across the back, Okhrim's chalk on its front
  fur("shynkvas", 3.4, 0, back + 1.2, X - t - 0.4, 1.0, back + 1.6, C.wood);
  K.box("shynkvas_top", 3.35, 1.0, back + 1.15, X - t - 0.35, 1.05, back + 1.65, C.woodDark, inside);
  K.box("chalk", 3.6, 0.5, back + 1.6, 4.4, 0.8, back + 1.61, 0xe8e2d0, inside);
  // barrels on their sides behind it, and shelves of mugs on the back wall
  for (let i = 0; i < 4; i++) {
    const x = 4.0 + i * 1.0;
    const b = K.rod("barrel", [x, 0.35, back + 0.02], [x, 0.35, back + 0.75], [0.33, 0.33], C.barrel, inside, 12);
    b.userData.solid = true;
    K.rod("hoop", [x, 0.35, back + 0.15], [x, 0.35, back + 0.19], 0.345, C.hoop, inside, 12);
    K.rod("hoop", [x, 0.35, back + 0.58], [x, 0.35, back + 0.62], 0.345, C.hoop, inside, 12);
  }
  for (const y of [1.45, 1.85]) {
    K.box("shelf", 3.8, y, back, X - t - 0.3, y + 0.04, back + 0.25, C.woodDark, inside);
    for (let x = 4.0; x < X - t - 0.4; x += 0.35) K.rod("mug", [x, y + 0.04, back + 0.12], [x, y + 0.2, back + 0.12], 0.06, C.mug, inside, 8);
  }
  // the pich in the south-west corner by the door
  fur("pich", t, 0, -t - 1.7, t + 1.6, 1.5, -t, C.clay);
  K.box("pich_top", t + 0.1, 1.5, -t - 1.6, t + 1.5, 1.75, -t - 0.6, C.clay, inside);
  K.box("pich_mouth", t + 1.6, 0.5, -t - 1.3, t + 1.62, 0.95, -t - 0.7, 0x2b1d14, inside);
  // two long tables with benches
  const table = (x0, z0) => {
    fur("table", x0, 0, z0, x0 + 2.4, 0.78, z0 + 0.8, C.wood);
    fur("lava", x0, 0, z0 - 0.45, x0 + 2.4, 0.45, z0 - 0.15, C.woodDark);
    fur("lava", x0, 0, z0 + 0.95, x0 + 2.4, 0.45, z0 + 1.25, C.woodDark);
    K.rod("mug", [x0 + 0.6, 0.78, z0 + 0.3], [x0 + 0.6, 0.94, z0 + 0.3], 0.06, C.mug, inside, 8);
    K.rod("mug", [x0 + 1.7, 0.78, z0 + 0.5], [x0 + 1.7, 0.94, z0 + 0.5], 0.06, C.mug, inside, 8);
  };
  table(0.6, back + 0.9);
  table(5.9, -2.6);
  // the hatch to the cellar, in the floor
  K.box("hatch", 2.5, 0.05, -2.9, 3.3, 0.07, -2.2, C.hatch, inside);
  K.box("hatch_ring", 2.85, 0.07, -2.6, 2.95, 0.08, -2.5, C.hoop, inside);

  K.shadows();
  return g;
}

export function plan() {
  const { t } = WALL;
  const Z = SIZE.z, X = SIZE.x;
  return {
    footprint: [[0, 0, 0], [X, 0, 0], [X, 0, -Z]],
    door: [DOOR.x0 / X, DOOR.x1 / X],
    pich: [t + 0.8, 0, -t - 0.85],
    partitions: [],
  };
}
