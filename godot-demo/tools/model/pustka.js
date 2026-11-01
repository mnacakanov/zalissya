// The pustka (Taras Dovhyi's empty hut) as a 3D model; see otaman.js for
// what the models are for and lib.js for the pieces.
//
// Taras planted the tobacco field, rode to the Sich and never came back;
// the hut has stood empty five years (CHARACTERS.md, DESIGN.md "A roof for
// Omelko"). It stands in the north-east corner of the maidan and faces
// south. Small, one room, gone grey: a sagging thatch with a hole in it,
// whitewash flaking to the clay, one shutter hanging, the door ajar. Inside:
// the cold pich, a bare pil, an overturned bench, the skrynia with Taras's
// letter, a cobwebbed icon corner, dead leaves blown in.

import { kit } from "./lib.js";

export const SIZE = { x: 4.4, z: 4.0 };
export const WALL = { h: 2.2, t: 0.35, knee: 0.45 };
export const DOOR = { x0: 2.6, x1: 3.5, h: 1.8 };   // in the south wall

const C = {
  wall: 0xcfc8b6, clay: 0xa8875e, plinth: 0x7f7a6a,
  thatch: 0x8f8466, thatchDark: 0x5f563f, hole: 0x231d16, shutter: 0x6d6a5e,
  door: 0x5a4a38, wood: 0x7a6248, woodDark: 0x4f3e2c, floor: 0x8a7a62,
  glass: 0x2a2f36, leaves: 0x8a6a2e, painted: 0x3f5a72, paper: 0xe6dcc0,
};

export function build(THREE, opts = {}) {
  const cut = !!opts.cutaway;
  const g = new THREE.Group();
  g.name = cut ? "pustka_cutaway" : "pustka";
  const K = kit(THREE, g);
  const { t, h, knee } = WALL;
  const X = SIZE.x, Z = SIZE.z;

  K.pryzba(X, Z, 0.35, 0.25, C.plinth);
  K.box("floor", t, 0, -Z + t, X - t, 0.05, -t, C.floor, K.group("floors"));

  const walls = K.group("walls");
  const win = (a, b) => ({ a, b, y0: 0.95, y1: 1.6 });
  const nearH = cut ? knee : h;
  K.wallX("wall_south", -t, 0, 0, X, [win(0.9, 1.6), { a: DOOR.x0, b: DOOR.x1, y0: 0, y1: DOOR.h }], nearH, C.wall, walls);
  K.wallZ("wall_east", X - t, X, -Z, 0, [win(-2.4, -1.7)], nearH, C.wall, walls);
  K.wallX("wall_north", -Z, -Z + t, 0, X, [], h, C.wall, walls);
  K.wallZ("wall_west", 0, t, -Z, 0, [], h, C.wall, walls);
  if (!cut) {
    const fx = K.group("windows");
    // whitewash flaked off to the clay in patches
    K.box("flake", 0.3, 0.4, 0, 0.8, 0.9, 0.02, C.clay, fx);
    K.box("flake", 3.7, 1.2, 0, 4.1, 1.8, 0.02, C.clay, fx);
    K.box("flake", X, 0.5, -3.4, X + 0.02, 1.1, -2.9, C.clay, fx);
    K.box("pane", 0.9, 0.95, -0.2, 1.6, 1.6, -0.15, C.glass, fx);
    K.box("shutter", 0.48, 0.95, 0, 0.87, 1.6, 0.06, C.shutter, fx);
    // the other shutter hangs by one hinge
    K.box("shutter_hanging", 1.63, 0.7, 0.02, 2.0, 1.32, 0.08, C.shutter, fx).rotation.z = -0.35;
    K.box("pane", X - 0.2, 0.95, -2.4, X - 0.15, 1.6, -1.7, C.glass, fx);
    // the door ajar, swung in
    const d = K.box("door_ajar", DOOR.x0, 0, -0.25, DOOR.x0 + 0.06, DOOR.h, -0.25 + 0.85, C.door, fx);
    d.position.z -= 0.45;
    // the sagging thatch, with a dark hole torn in its south slope
    K.hipRoof(X, Z, h - 0.2, h + 2.0, 0.55, C.thatch, C.thatchDark);
    K.poly("roof_hole", [[1.1, h + 0.78, -0.55], [2.0, h + 0.76, -0.5], [2.2, h + 1.47, -1.3], [1.3, h + 1.5, -1.35]], C.hole, K.group("hole"));
    K.box("chimney", 0.6, h, -3.4, 1.05, h + 2.0, -2.95, C.clay, K.group("chimney"));
  }

  // --- inside -----------------------------------------------------------------------
  const inside = K.group("inside");
  const fur = K.furnisher(inside);
  // the cold pich in the north-west corner, cracked
  fur("pich", t, 0, -Z + t, t + 1.5, 1.45, -Z + t + 1.5, C.clay);
  K.box("pich_top", t + 0.1, 1.45, -Z + t + 0.1, t + 1.4, 1.7, -Z + t + 1.1, C.clay, inside);
  K.box("pich_mouth", t + 0.5, 0.5, -Z + t + 1.5, t + 1.1, 0.95, -Z + t + 1.52, 0x1a1410, inside);
  // the bare pil along the north wall
  fur("pil", t + 1.7, 0, -Z + t, X - t, 0.5, -Z + t + 1.3, C.wood);
  // the skrynia with Taras's letter, against the east wall
  fur("skrynia", X - t - 0.6, 0, -2.2, X - t, 0.6, -1.1, C.painted);
  K.box("letter", X - t - 0.45, 0.6, -1.9, X - t - 0.2, 0.62, -1.6, C.paper, inside);
  // an overturned bench, and a table
  K.box("bench_over", 0.9, 0, -1.4, 2.2, 0.35, -1.05, C.woodDark, inside).rotation.y = 0.3;
  fur("table", t + 0.1, 0, -2.0, t + 0.9, 0.75, -1.1, C.wood);
  // dead leaves blown in at the door
  K.box("leaves", DOOR.x0 - 0.1, 0.05, -1.0, DOOR.x1 + 0.2, 0.08, -0.4, C.leaves, inside);

  K.shadows();
  return g;
}

export function plan() {
  const { t } = WALL;
  const Z = SIZE.z, X = SIZE.x;
  return {
    footprint: [[0, 0, 0], [X, 0, 0], [X, 0, -Z]],
    door: [DOOR.x0 / X, DOOR.x1 / X],
    pich: [t + 0.75, 0, -Z + t + 0.75],
    partitions: [],
  };
}
