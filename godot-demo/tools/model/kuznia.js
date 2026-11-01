// Radek's kuznia (the forge) as a 3D model; see otaman.js for what the
// models are for and lib.js for the pieces.
//
// It stands on the west side of the maidan by the road, so it faces east:
// its door is in the east wall, the lower-right face to the camera (as the
// Domovyk's khata). A small, low, sooty building: clay walls never
// whitewashed (soot would have them grey in a week), a thatched hip roof
// with a squat clay chimney over the horn, a wide double door standing open
// on the road, a horseshoe nailed over it for luck, and one small window to
// the south. Radek fled his lord, a Polish smith in a Cossack khutir
// (CHARACTERS.md); the forge was cold until the kobzar brought him bog iron.
//
// Inside: the horn (the hearth) against the west wall under its clay hood,
// the mikh (the leather bellows) beside it to the north, the anvil on its
// oak stump before the horn, the quench tub, a heap of charcoal and bog
// iron, and the workbench along the north wall with tongs and hammers on a
// rack over it. A metre inside the door is kept clear (PIPELINE.md).

import { kit } from "./lib.js";

export const SIZE = { x: 3.0, z: 4.5 };
export const WALL = { h: 2.1, t: 0.3, knee: 0.45 };
export const DOOR = { z0: -1.75, z1: -0.55, h: 1.85 };   // in the east wall, a wide double door

const C = {
  wall: 0xb4a48a, soot: 0x5a5249, plinth: 0x7f7a6a, thatch: 0x9c8a5a, thatchDark: 0x63573a,
  clay: 0xa8875e, door: 0x5e4630, wood: 0x7a6248, woodDark: 0x4f3e2c, floor: 0x5f5548,
  glass: 0x2a2f36, iron: 0x3c3c3e, leather: 0x6a4a30, ember: 0xb2482a, char: 0x26221f,
  bogIron: 0x7a4a2a, water: 0x1c2228, stone: 0x8a857a,
};

export function build(THREE, opts = {}) {
  const cut = !!opts.cutaway;
  const g = new THREE.Group();
  g.name = cut ? "kuznia_cutaway" : "kuznia";
  const K = kit(THREE, g);
  const { t, h, knee } = WALL;
  const X = SIZE.x, Z = SIZE.z;

  K.pryzba(X, Z, 0.2, 0.15, C.plinth);
  // a beaten earth floor, dark with scale and soot
  K.box("floor", t, 0, -Z + t, X - t, 0.04, -t, C.floor, K.group("floors"));

  const walls = K.group("walls");
  const nearH = cut ? knee : h;
  const S_WIN = [1.2, 1.75];
  K.wallZ("wall_east", X - t, X, -Z, 0, [{ a: DOOR.z0, b: DOOR.z1, y0: 0, y1: DOOR.h }], nearH, C.wall, walls);
  K.wallX("wall_south", -t, 0, 0, X, [{ a: S_WIN[0], b: S_WIN[1], y0: 1.0, y1: 1.5 }], nearH, C.wall, walls);
  K.wallX("wall_north", -Z, -Z + t, 0, X, [], h, C.wall, walls);
  K.wallZ("wall_west", 0, t, -Z, 0, [], h, C.wall, walls);

  if (!cut) {
    const fx = K.group("details");
    // soot over the door and under the eaves
    K.box("soot", X, DOOR.h, DOOR.z0 - 0.1, X + 0.01, h, DOOR.z1 + 0.1, C.soot, fx);
    K.box("soot", 0.2, h - 0.35, 0, X - 0.2, h, 0.01, C.soot, fx);
    // the small south window, a shutter to one side
    K.box("pane", S_WIN[0], 1.0, -0.2, S_WIN[1], 1.5, -0.15, C.glass, fx);
    K.box("shutter", S_WIN[0] - 0.5, 1.0, 0, S_WIN[0] - 0.03, 1.5, 0.05, C.woodDark, fx);
    // the double door, both leaves swung out back toward the wall
    K.box("door_leaf", X, 0.02, DOOR.z0 - 0.62, X + 0.06, DOOR.h - 0.05, DOOR.z0 - 0.02, C.door, fx).rotation.y = 0.25;
    K.box("door_leaf", X, 0.02, DOOR.z1 + 0.02, X + 0.06, DOOR.h - 0.05, DOOR.z1 + 0.62, C.door, fx).rotation.y = -0.25;
    // a horseshoe over the door, ends up, for luck
    const zc = (DOOR.z0 + DOOR.z1) / 2;
    K.box("horseshoe", X + 0.01, DOOR.h + 0.06, zc - 0.08, X + 0.04, DOOR.h + 0.2, zc + 0.08, C.iron, fx);
    // a stone before the door, worn by hooves and boots
    K.box("step", X + 0.2, 0, DOOR.z0, X + 0.6, 0.1, DOOR.z1, C.stone, fx);

    K.hipRoof(X, Z, h - 0.15, h + 1.7, 0.5, C.thatch, C.thatchDark);
    // the squat clay chimney over the horn
    K.box("chimney", t + 0.15, h, -2.95, t + 0.75, h + 1.85, -2.35, C.clay, K.group("chimney"));
    K.box("chimney_soot", t + 0.13, h + 1.6, -2.97, t + 0.77, h + 1.87, -2.33, C.soot, K.group("chimney"));
  }

  // --- inside -----------------------------------------------------------------------
  const inside = K.group("inside");
  const fur = K.furnisher(inside);
  const rod = (name, a, b, r, color) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, A.distanceTo(B), 10), K.mat(color));
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    m.name = name;
    inside.add(m);
    return m;
  };
  // the horn: a waist-high hearth of stone and clay against the west wall, the
  // fire-bed on top with embers, the clay hood over it narrowing to the flue
  fur("horn", t, 0, -3.15, t + 1.0, 0.8, -2.15, C.stone);
  // the coals heaped low on the fire-bed, glowing in the middle
  K.box("coal_bed", t + 0.15, 0.8, -3.0, t + 0.85, 0.84, -2.3, C.char, inside);
  K.box("embers", t + 0.3, 0.84, -2.85, t + 0.7, 0.87, -2.45, C.ember, inside);
  // the hood: a clay funnel against the west wall, wide over the fire and
  // narrowing up into the flue, which climbs the wall to the roof
  const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.72, 0.5, 4, 1), K.mat(C.clay));
  hood.rotation.y = Math.PI / 4;
  hood.position.set(t + 0.5, 1.6, -2.65);
  hood.name = "hood";
  inside.add(hood);
  K.box("flue", t, 1.85, -2.93, t + 0.56, h, -2.37, C.clay, inside);
  // the mikh: two boards and leather between them, on a trestle north of the
  // horn, its nozzle to the fire; a pole to work it
  fur("mikh_stand", t, 0, -Z + t + 0.05, t + 0.9, 0.55, -3.25, C.woodDark);
  K.box("mikh_board", t + 0.05, 0.55, -Z + t + 0.1, t + 0.85, 0.6, -3.3, C.wood, inside);
  K.box("mikh_leather", t + 0.08, 0.6, -Z + t + 0.12, t + 0.82, 0.82, -3.32, C.leather, inside);
  K.box("mikh_board", t + 0.05, 0.82, -Z + t + 0.1, t + 0.85, 0.87, -3.3, C.wood, inside).rotation.x = -0.12;
  K.box("nozzle", t + 0.4, 0.68, -3.32, t + 0.5, 0.76, -3.05, C.iron, inside);
  rod("mikh_pole", [t + 0.45, 0.87, -3.6], [t + 1.35, 1.35, -3.6], 0.025, C.woodDark);
  // the anvil on its oak stump, before the horn
  rod("stump", [1.75, 0, -2.65], [1.75, 0.55, -2.65], 0.22, C.woodDark).userData.solid = true;
  K.box("anvil_body", 1.62, 0.55, -2.85, 1.88, 0.72, -2.45, C.iron, inside);
  K.box("anvil_face", 1.58, 0.72, -2.95, 1.92, 0.8, -2.35, C.iron, inside);
  rod("anvil_horn", [1.75, 0.76, -2.95], [1.75, 0.74, -3.2], 0.04, C.iron);
  K.box("hammer", 1.6, 0.8, -2.6, 1.68, 0.84, -2.3, C.wood, inside);
  // the quench tub, a sawn barrel, south of the horn
  rod("quench_tub", [t + 0.45, 0, -1.65], [t + 0.45, 0.55, -1.65], 0.28, C.wood).userData.solid = true;
  rod("quench_water", [t + 0.45, 0.55, -1.65], [t + 0.45, 0.56, -1.65], 0.25, C.water);
  // charcoal and bog iron heaped in the south-west corner
  fur("charcoal", t, 0, -t - 0.75, t + 0.75, 0.3, -t, C.char);
  K.box("bog_iron", t + 0.1, 0.3, -t - 0.55, t + 0.45, 0.42, -t - 0.2, C.bogIron, inside);
  // the workbench along the north wall, tongs and hammers on a rack above it
  fur("workbench", 1.45, 0, -Z + t, X - t - 0.05, 0.85, -Z + t + 0.55, C.wood);
  K.box("vice", 2.35, 0.85, -Z + t + 0.3, 2.5, 1.0, -Z + t + 0.5, C.iron, inside);
  K.box("rack", 1.5, 1.35, -Z + t, X - t - 0.1, 1.42, -Z + t + 0.06, C.woodDark, inside);
  for (let i = 0; i < 5; i++) K.box("tool", 1.6 + i * 0.2, 0.95, -Z + t + 0.02, 1.64 + i * 0.2, 1.38, -Z + t + 0.06, C.iron, inside);
  // horseshoes hung on a peg on the north wall by the door
  K.box("horseshoes", 2.45, 1.45, -Z + t, 2.6, 1.7, -Z + t + 0.04, C.iron, inside);

  K.shadows();
  return g;
}

// The plan in metres. The door is in the east wall: t runs along the
// footprint's east edge from its south-east corner (z 0) to the north-east.
// The "pich" is where the room's own light comes from: the horn's fire.
export function plan() {
  const { t } = WALL;
  const Z = SIZE.z, X = SIZE.x;
  return {
    footprint: [[0, 0, 0], [X, 0, 0], [X, 0, -Z]],
    door: { wall: "east", t: [-DOOR.z1 / Z, -DOOR.z0 / Z] },
    pich: [t + 0.5, 0, -2.65],
    partitions: [],
  };
}
