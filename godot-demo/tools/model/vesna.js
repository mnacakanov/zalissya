// Vesna's khata (the znakharka's) as a 3D model; see otaman.js for what the
// models are for and lib.js for the pieces.
//
// It stands on the east arm of the maidan's horseshoe, so it faces west: its
// door is in the west wall, turned away from the camera. Outside we see her
// house from behind, the east (back) wall on the lower right and the south
// wall on the lower left; the game turns it see-through when the kobzar
// walks round to the door. Inside (the cutaway) the door shows as a gap in
// the far left wall. Her room (DESIGN.md, CHARACTERS.md): herbs drying on a
// pole under the ceiling, a stand of tinctures, her mortar and book of
// cures, a pot of something green in the pich's mouth, a cat asleep on top
// of the pich; and her bed and table. Whitewash with a green-painted dado,
// green shutters, a thatched hip roof; a herb garden is the yard's business.

import { kit } from "./lib.js";

export const SIZE = { x: 5, z: 7 };
export const WALL = { h: 2.3, t: 0.35, knee: 0.45 };
export const DOOR = { z0: -4.7, z1: -3.75, h: 1.85 };   // in the west wall, clear of the pich

const C = {
  wall: 0xeeeadc, dado: 0x6f8f5a, plinth: 0x8e8a78,
  thatch: 0xc0a058, thatchDark: 0x8a7036, shutter: 0x4d7a4a, door: 0x6e5030,
  wood: 0x8a6440, woodDark: 0x5e4129, clay: 0xd9c4a0, floor: 0x9c8366,
  glass: 0x3a4652, herbs: 0x6d8a3e, herbsDry: 0x9a8a4a, green: 0x5fa041,
  bottle: 0x7a9a8a, bottle2: 0xa0603a, book: 0x6b2f22, iron: 0x3c3c3c,
  cat: 0x2b2722, linen: 0xe8e0cc, red: 0xa32626,
};

export function build(THREE, opts = {}) {
  const cut = !!opts.cutaway;
  const g = new THREE.Group();
  g.name = cut ? "vesna_cutaway" : "vesna";
  const K = kit(THREE, g);
  const { t, h, knee } = WALL;
  const X = SIZE.x, Z = SIZE.z;

  K.pryzba(X, Z, 0.4, 0.3, C.plinth);
  K.box("floor", t, 0, -Z + t, X - t, 0.05, -t, C.floor, K.group("floors"));

  const walls = K.group("walls");
  const win = (a, b) => ({ a, b, y0: 0.95, y1: 1.7 });
  const nearH = cut ? knee : h;
  const W_EAST = [[-5.2, -4.4], [-2.6, -1.8]];
  const W_SOUTH = [[2.1, 2.9]];
  const W_WEST = [[-2.6, -1.8]];
  // west (far, the door wall facing the maidan): the door and a window
  K.wallZ("wall_west", 0, t, -Z, 0, [{ a: DOOR.z0, b: DOOR.z1, y0: 0, y1: DOOR.h }, ...W_WEST.map(([a, b]) => win(a, b))], h, C.wall, walls);
  K.wallX("wall_north", -Z, -Z + t, 0, X, [], h, C.wall, walls);
  // near walls: the back (east) and the south, with windows
  K.wallZ("wall_east", X - t, X, -Z, 0, W_EAST.map(([a, b]) => win(a, b)), nearH, C.wall, walls);
  K.wallX("wall_south", -t, 0, 0, X, W_SOUTH.map(([a, b]) => win(a, b)), nearH, C.wall, walls);
  if (!cut) {
    // a green-painted dado along the visible walls
    K.box("dado_e", X, 0, -Z, X + 0.02, 0.45, 0, C.dado, walls);
    K.box("dado_s", 0, 0, 0, X, 0.45, 0.02, C.dado, walls);
    const fx = K.group("windows");
    for (const [a, b] of W_EAST) {
      K.box("pane", X - 0.2, 0.95, a, X - 0.15, 1.7, b, C.glass, fx);
      K.box("shutter", X, 0.95, a - 0.42, X + 0.06, 1.7, a - 0.03, C.shutter, fx);
      K.box("shutter", X, 0.95, b + 0.03, X + 0.06, 1.7, b + 0.42, C.shutter, fx);
    }
    for (const [a, b] of W_SOUTH) {
      K.box("pane", a, 0.95, -0.2, b, 1.7, -0.15, C.glass, fx);
      K.box("shutter", a - 0.42, 0.95, 0, a - 0.03, 1.7, 0.06, C.shutter, fx);
      K.box("shutter", b + 0.03, 0.95, 0, b + 0.42, 1.7, 0.06, C.shutter, fx);
    }
    // bunches of herbs hung under the eaves of the back wall
    for (let z = -6.4; z < -0.4; z += 0.7) K.box("herb_bunch", X + 0.12, 1.75, z, X + 0.22, 2.15, z + 0.18, C.herbsDry, fx);
    K.hipRoof(X, Z, h - 0.15, h + 2.6, 0.7, C.thatch, C.thatchDark);
    K.box("chimney", 0.9, h, -6.3, 1.4, h + 2.8, -5.8, C.clay, K.group("chimney"));
  }

  // --- inside -----------------------------------------------------------------------
  const inside = K.group("inside");
  const fur = K.furnisher(inside);
  // the pich in the north-west corner by the door, its mouth to the room
  // (east), the green pot in its mouth, the cat asleep on top
  fur("pich", t, 0, -Z + t, t + 1.7, 1.55, -Z + t + 1.6, C.clay);
  K.box("pich_top", t + 0.1, 1.55, -Z + t + 0.1, t + 1.6, 1.85, -Z + t + 1.2, C.clay, inside);
  K.box("pich_mouth", t + 1.7, 0.55, -Z + t + 0.5, t + 1.72, 1.0, -Z + t + 1.1, 0x2b1d14, inside);
  K.box("green_pot", t + 1.55, 0.55, -Z + t + 0.6, t + 1.85, 0.85, -Z + t + 0.95, C.green, inside);
  K.box("cat", t + 0.5, 1.85, -Z + t + 0.4, t + 1.0, 2.05, -Z + t + 0.75, C.cat, inside);
  fur("pripichok", t + 1.7, 0, -Z + t + 0.2, t + 2.2, 0.5, -Z + t + 1.4, C.clay);
  // her bed along the north wall east of the pich
  fur("bed", t + 2.4, 0, -Z + t, X - t, 0.55, -Z + t + 1.3, C.wood);
  K.box("bed_linen", t + 2.5, 0.55, -Z + t + 0.1, X - t - 0.1, 0.65, -Z + t + 1.2, C.linen, inside);
  // the stand of tinctures along the east wall: shelves of bottles
  fur("tincture_stand", X - t - 0.45, 0, -4.3, X - t, 1.9, -2.9, C.woodDark);
  let n = 0;
  for (let y = 0.55; y < 1.9; y += 0.45) {
    for (let z = -4.2; z < -3.0; z += 0.28) K.box("bottle", X - t - 0.5, y, z, X - t - 0.4, y + 0.22, z + 0.1, n++ % 3 ? C.bottle : C.bottle2, inside);
  }
  // her work table in the middle with the mortar and the book of cures
  fur("table", 1.6, 0, -3.2, 3.0, 0.8, -2.2, C.wood);
  K.box("mortar", 1.8, 0.8, -2.9, 2.05, 1.0, -2.65, C.iron, inside);
  K.box("book", 2.3, 0.8, -2.95, 2.75, 0.86, -2.6, C.book, inside);
  K.box("herbs_table", 2.2, 0.8, -2.45, 2.8, 0.85, -2.3, C.herbs, inside);
  fur("bench", 1.6, 0, -2.0, 3.0, 0.45, -1.7, C.wood);
  // the pokut, diagonal to the pich: the south-east corner, icon and rushnyk
  K.box("icon", X - t - 0.05, 1.65, -t - 0.6, X - t, 2.0, -t - 0.2, 0xc9a23a, inside);
  K.box("rushnyk", X - t - 0.04, 1.4, -t - 0.7, X - t, 2.05, -t - 0.65, C.linen, inside);
  // a basket of roots and a broom by the door
  fur("basket", t, 0, DOOR.z1 + 0.2, t + 0.5, 0.4, DOOR.z1 + 0.7, C.woodDark);
  K.box("broom", t + 0.1, 0, DOOR.z0 - 0.3, t + 0.25, 1.3, DOOR.z0 - 0.15, C.thatch, inside);
  // the pole of drying herbs under the ceiling, across the room (not in the
  // way: it hangs at 2 m)
  K.box("herb_pole", 1.0, 2.05, -3.6, X - 1.0, 2.1, -3.5, C.woodDark, inside);
  let m = 0;
  for (let x = 1.2; x < X - 1.1; x += 0.35) K.box("herb_hang", x, 1.65, -3.6, x + 0.14, 2.05, -3.5, m++ % 2 ? C.herbs : C.herbsDry, inside);

  K.shadows();
  return g;
}

// The plan in metres. The door is in the west wall: t runs along the
// footprint's west edge, from its north-west corner (z -Z) to the
// south-west (z 0), as the game walks the walls SW→SE→NE→NW→SW.
export function plan() {
  const { t } = WALL;
  const Z = SIZE.z, X = SIZE.x;
  return {
    footprint: [[0, 0, 0], [X, 0, 0], [X, 0, -Z]],
    door: { wall: "west", t: [(DOOR.z0 + Z) / Z, (DOOR.z1 + Z) / Z] },
    pich: [t + 0.85, 0, -Z + t + 0.8],
    partitions: [],
  };
}
