// The otaman's khata (Myroslav's house) as a 3D model, built in code.
//
// What it is for: the picture generator can't keep a long three-room house
// at the Pillars-lite camera, so we build the house in 3D, render it from
// exactly that camera (render.html) and paint over the renders. The renders
// also give the exact numbers the game needs: the footprint, the door, the
// pich, the partitions and the furniture, in the picture's own pixels.
//
// Units are metres. x runs east, y up, z south. The walls' outer faces stand
// on x 0..11 and z -5.5..0, so z = 0 is the south face, the door wall facing
// the maidan. The house follows DESIGN.md, "The otaman's khata": built
// "through the siny", the working khata to the west, the svitlytsia to the
// east, pale-blue whitewash, a gont roof, red shutters, a carved porch over
// a green double door and the korohva by it.
//
// build(THREE, { cutaway }) returns a Group. With cutaway the roof, the
// chimney stack above the room, the porch roof, shutters and the korohva go,
// and the near walls (south and east) and the partitions drop to knee
// height, which is how the game shows a room you have walked into.

export const SIZE = { x: 11, z: 5.5 };
export const WALL = { h: 2.5, t: 0.35, knee: 0.45 };
// the rooms along the door wall, west to east (x)
export const ROOMS = { khata: [0, 4.0], siny: [4.0, 6.6], svitlytsia: [6.6, 11] };
export const DOOR = { x0: 4.65, x1: 5.95, h: 2.0 };   // the double door, in the siny

const C = {
  wall: 0xdde6ec,      // whitewash, a little blue
  wallIn: 0xe9e4d6,    // inside, warmer
  plinth: 0x8e8a78,
  roof: 0x8d8a82,      // gont shingles, weathered grey
  shutter: 0xb0262a,
  door: 0x4c7a48,
  wood: 0x8a6440,
  woodDark: 0x5e4129,
  brick: 0x9a4a32,
  clay: 0xc9a27a,
  floorClay: 0x9c8366,
  planks: 0xa57a4f,
  kylym: 0x9e2b2b,
  red: 0xa32626,
  glass: 0x3a4652,
  korohva: 0xb3122a,
  iron: 0x55585c,
  straw: 0xc8a85a,
};

export function build(THREE, opts = {}) {
  const cut = !!opts.cutaway;
  const g = new THREE.Group();
  g.name = cut ? "otaman_cutaway" : "otaman";
  const mats = {};
  const mat = (c) => (mats[c] ??= new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, metalness: 0 }));

  // a box by its min and max corners; tagged with a part name for the glTF
  const box = (name, x0, y0, z0, x1, y1, z1, color, parent = g) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat(color));
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    m.name = name;
    parent.add(m);
    return m;
  };
  const group = (name) => {
    const s = new THREE.Group();
    s.name = name;
    g.add(s);
    return s;
  };

  const { t, h, knee } = WALL;
  const X = SIZE.x;
  const Z = SIZE.z;

  // --- the pryzba, the stone plinth round the house, and the floors -----------
  const base = group("plinth");
  box("pryzba_s", -0.45, 0, 0, X + 0.45, 0.35, 0.45, C.plinth, base);
  box("pryzba_n", -0.45, 0, -Z - 0.45, X + 0.45, 0.35, -Z, C.plinth, base);
  box("pryzba_w", -0.45, 0, -Z, 0, 0.35, 0, C.plinth, base);
  box("pryzba_e", X, 0, -Z, X + 0.45, 0.35, 0, C.plinth, base);
  const floors = group("floors");
  box("floor_khata", t, 0, -Z + t, ROOMS.khata[1], 0.05, -t, C.floorClay, floors);
  box("floor_siny", ROOMS.siny[0], 0, -Z + t, ROOMS.siny[1], 0.05, -t, C.floorClay, floors);
  box("floor_svitlytsia", ROOMS.svitlytsia[0], 0, -Z + t, X - t, 0.07, -t, C.planks, floors);

  // --- the walls, as boxes round their openings ----------------------------------
  // a wall along x at z0..z1, with openings [{a, b, y0, y1}] along x
  const walls = group("walls");
  const wallX = (name, z0, z1, x0, x1, openings, height, color) => {
    let x = x0;
    for (const o of [...openings].sort((p, q) => p.a - q.a)) {
      if (o.a > x) box(name, x, 0, z0, o.a, height, z1, color, walls);
      if (o.y0 > 0) box(name + "_sill", o.a, 0, z0, o.b, Math.min(o.y0, height), z1, color, walls);
      if (o.y1 < height) box(name + "_lintel", o.a, o.y1, z0, o.b, height, z1, color, walls);
      x = o.b;
    }
    if (x < x1) box(name, x, 0, z0, x1, height, z1, color, walls);
  };
  const wallZ = (name, x0, x1, z0, z1, openings, height, color) => {
    let z = z0;
    for (const o of [...openings].sort((p, q) => p.a - q.a)) {
      if (o.a > z) box(name, x0, 0, z, x1, height, o.a, color, walls);
      if (o.y0 > 0) box(name + "_sill", x0, 0, o.a, x1, Math.min(o.y0, height), o.b, color, walls);
      if (o.y1 < height) box(name + "_lintel", x0, o.y1, o.a, x1, height, o.b, color, walls);
      z = o.b;
    }
    if (z < z1) box(name, x0, 0, z, x1, height, z1, color, walls);
  };
  const win = (a, b) => ({ a, b, y0: 1.0, y1: 1.9 });
  const nearH = cut ? knee : h;
  // south (the door wall, near): two windows and the door
  wallX("wall_south", -t, 0, 0, X, [win(1.4, 2.4), { a: DOOR.x0, b: DOOR.x1, y0: 0, y1: DOOR.h }, win(8.4, 9.4)], nearH, C.wall);
  // east (near): one window
  wallZ("wall_east", X - t, X, -Z, 0, [win(-3.3, -2.3)], nearH, C.wall);
  // north and west (far): the west has a window, the north is blind
  wallX("wall_north", -Z, -Z + t, 0, X, [], h, C.wall);
  wallZ("wall_west", 0, t, -Z, 0, [win(-3.3, -2.3)], h, C.wall);
  // the siny's partitions, with doorways near the front into each room
  const doorway = { a: -1.7, b: -0.7, y0: 0, y1: 2.0 };
  const partH = cut ? knee : h;
  wallZ("partition_west", ROOMS.siny[0] - 0.1, ROOMS.siny[0] + 0.1, -Z + t, -t, [doorway], partH, C.wallIn);
  wallZ("partition_east", ROOMS.siny[1] - 0.1, ROOMS.siny[1] + 0.1, -Z + t, -t, [doorway], partH, C.wallIn);

  // windows: dark panes with a frame, red shutters outside (not in the cutaway)
  const glass = group("windows");
  if (!cut) {
    for (const [a, b] of [[1.4, 2.4], [8.4, 9.4]]) {
      box("pane", a, 1.0, -0.2, b, 1.9, -0.15, C.glass, glass);
      box("shutter", a - 0.52, 1.0, 0, a - 0.04, 1.9, 0.06, C.shutter, glass);
      box("shutter", b + 0.04, 1.0, 0, b + 0.52, 1.9, 0.06, C.shutter, glass);
    }
    box("pane", X - 0.2, 1.0, -3.3, X - 0.15, 1.9, -2.3, C.glass, glass);
    box("shutter", X, 1.0, -3.82, X + 0.06, 1.9, -3.34, C.shutter, glass);
    box("shutter", X, 1.0, -2.26, X + 0.06, 1.9, -1.78, C.shutter, glass);
    // the green double door, a little ajar
    box("door_leaf_w", DOOR.x0, 0, -0.2, (DOOR.x0 + DOOR.x1) / 2 - 0.01, DOOR.h, -0.14, C.door, glass);
    box("door_leaf_e", (DOOR.x0 + DOOR.x1) / 2 + 0.01, 0, -0.2, DOOR.x1, DOOR.h, -0.14, C.door, glass);
  }

  // --- the porch: a deck with steps, carved posts, its own little gable roof ---
  const porch = group("porch");
  const px0 = DOOR.x0 - 0.45;
  const px1 = DOOR.x1 + 0.45;
  box("porch_deck", px0, 0, 0, px1, 0.35, 1.5, C.wood, porch);
  box("porch_step", px0 + 0.3, 0, 1.5, px1 - 0.3, 0.18, 1.85, C.wood, porch);
  // (the posts would stand in front of the room in the cutaway)
  if (!cut) for (const x of [px0 + 0.1, px1 - 0.1]) box("porch_post", x - 0.09, 0.35, 1.3, x + 0.09, 2.55, 1.48, C.woodDark, porch);
  box("porch_rail_w", px0, 0.35, 0.1, px0 + 0.08, 1.2, 1.3, C.woodDark, porch);
  box("porch_rail_e", px1 - 0.08, 0.35, 0.1, px1, 1.2, 1.3, C.woodDark, porch);
  if (!cut) {
    // a gable roof over the porch, its ridge running out from the wall
    const ridgeY = 3.35;
    const eaveY = 2.55;
    const pr = (pts, name, color = C.roof) => porch.add(prism(THREE, pts, mat(color), name));
    pr([[px0 - 0.2, eaveY, 1.75], [(px0 + px1) / 2, ridgeY, 1.75], [(px0 + px1) / 2, ridgeY, -0.1], [px0 - 0.2, eaveY, -0.1]], "porch_roof_w");
    pr([[(px0 + px1) / 2, ridgeY, 1.75], [px1 + 0.2, eaveY, 1.75], [px1 + 0.2, eaveY, -0.1], [(px0 + px1) / 2, ridgeY, -0.1]], "porch_roof_e");
    // the carved gable board
    pr([[px0 - 0.1, eaveY, 1.78], [px1 + 0.1, eaveY, 1.78], [(px0 + px1) / 2, ridgeY - 0.05, 1.78]], "porch_gable", C.wood);
  }

  // --- the roof: a hipped gont roof over the eaves ------------------------------
  if (!cut) {
    const o = 0.5;   // overhang
    const ey = h;    // eaves height
    const ry = h + 2.4;
    const rx0 = -o + (Z + 2 * o) / 2;
    const rx1 = X + o - (Z + 2 * o) / 2;
    const rz = -Z / 2;
    const A = [-o, ey, o], B = [X + o, ey, o], Cc = [X + o, ey, -Z - o], D = [-o, ey, -Z - o];
    const R0 = [rx0, ry, rz], R1 = [rx1, ry, rz];
    const roof = group("roof");
    const m = mat(C.roof);
    roof.add(prism(THREE, [A, B, R1, R0], m, "roof_south"));
    roof.add(prism(THREE, [B, Cc, R1], m, "roof_east"));
    roof.add(prism(THREE, [Cc, D, R0, R1], m, "roof_north"));
    roof.add(prism(THREE, [D, A, R0], m, "roof_west"));
    // the courses of shingles, as lines for the ink pass
    const courses = [];
    for (let i = 1; i < 8; i++) {
      const f = i / 8;
      const lerp = (p, q) => p.map((v, k) => v + (q[k] - v) * f);
      for (const [p, q, r, s] of [[A, B, R0, R1], [B, Cc, R1, R1], [Cc, D, R1, R0], [D, A, R0, R0]]) {
        courses.push(...lerp(p, r), ...lerp(q, s));
      }
    }
    const cg = new THREE.BufferGeometry();
    cg.setAttribute("position", new THREE.Float32BufferAttribute(courses, 3));
    const cl = new THREE.LineSegments(cg, new THREE.LineBasicMaterial({ color: 0x2a2018 }));
    cl.name = "roof_courses";
    cl.userData.inkOnly = true;
    roof.add(cl);
  }

  // --- the chimney over the pich (the stack stops at the ceiling in the cutaway)
  box("chimney", 1.0, 1.6, -4.6, 1.6, cut ? 1.9 : h + 2.9, -4.0, C.brick, group("chimney"));

  // --- the korohva by the porch: a crimson banner with a gold cross ---------------
  if (!cut) {
    const k = group("korohva");
    box("korohva_pole", px1 + 0.5, 0, 1.15, px1 + 0.58, 3.7, 1.23, C.woodDark, k);
    box("korohva_cloth", px1 + 0.58, 2.6, 1.17, px1 + 1.38, 3.55, 1.21, C.korohva, k);
    box("korohva_cross_v", px1 + 0.95, 2.75, 1.215, px1 + 1.01, 3.4, 1.225, 0xd4a72c, k);
    box("korohva_cross_h", px1 + 0.78, 3.12, 1.215, px1 + 1.18, 3.18, 1.225, 0xd4a72c, k);
  }

  // --- inside ---------------------------------------------------------------------------
  const inside = group("inside");
  const fur = (name, x0, y0, z0, x1, y1, z1, color) => {
    const m = box(name, x0, y0, z0, x1, y1, z1, color, inside);
    m.userData.solid = y0 < 0.3;   // what stands on the floor is in the way
    return m;
  };
  // the working khata: the pich in the north-west corner, the pil along the
  // north wall, a bench along the west wall, the bread trough
  fur("pich", t, 0, -Z + t, t + 1.8, 1.6, -Z + t + 1.8, C.clay);
  box("pich_mouth", t + 0.6, 0.55, -Z + t + 1.8, t + 1.3, 1.05, -Z + t + 1.82, 0x2b1d14, inside);
  box("pich_top", t + 0.1, 1.6, -Z + t + 0.1, t + 1.5, 1.9, -Z + t + 1.4, C.clay, inside);
  fur("pil", 2.25, 0, -Z + t, 3.85, 0.55, -Z + t + 1.5, C.wood);
  box("pil_blanket", 2.35, 0.55, -Z + t + 0.1, 3.75, 0.62, -Z + t + 1.4, 0xb9a98a, inside);
  fur("bench_khata", t, 0, -3.0, t + 0.4, 0.45, -0.7, C.wood);
  fur("trough", 2.2, 0, -2.2, 3.3, 0.55, -1.55, C.woodDark);
  box("trough_cloth", 2.25, 0.55, -2.15, 3.25, 0.6, -1.6, 0xe8e2d0, inside);
  // the siny: the ladder to the loft, a barrel, a saddle on a peg
  fur("ladder", 5.0, 0, -Z + t, 5.6, 0.1, -Z + t + 0.9, C.woodDark);
  box("ladder_rail_w", 5.0, 0, -Z + t + 0.05, 5.06, h, -Z + t + 0.9, C.woodDark, inside).rotation.x = -0.35;
  box("ladder_rail_e", 5.54, 0, -Z + t + 0.05, 5.6, h, -Z + t + 0.9, C.woodDark, inside).rotation.x = -0.35;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.3, 0.85, 14), mat(C.wood));
  barrel.position.set(6.1, 0.425, -4.6);
  barrel.name = "barrel";
  barrel.userData.solid = true;
  inside.add(barrel);
  box("saddle", 4.15, 1.2, -3.6, 4.45, 1.55, -2.9, 0x6b3f22, inside);
  // the svitlytsia: the kylym, the weapons on a red cloth, the red skrynia with
  // the kuntush, the table with the pernach and a carved chair
  box("kylym", 7.4, 0.07, -3.6, 9.6, 0.09, -1.4, C.kylym, inside);
  box("weapon_cloth", 7.2, 1.0, -Z + t, 8.9, 2.2, -Z + t + 0.03, C.red, inside);
  box("sabre", 7.4, 1.7, -Z + t + 0.03, 8.6, 1.76, -Z + t + 0.06, C.iron, inside);
  box("musket", 7.3, 1.35, -Z + t + 0.03, 8.8, 1.41, -Z + t + 0.06, C.woodDark, inside);
  fur("skrynia", 7.2, 0, -Z + t, 8.5, 0.65, -Z + t + 0.6, C.red);
  box("kuntush", 7.3, 0.65, -Z + t + 0.05, 8.2, 0.72, -Z + t + 0.5, 0x2c3d6b, inside);
  fur("table", 9.0, 0, -4.7, 10.4, 0.78, -3.7, C.wood);
  box("pernach", 9.5, 0.78, -4.3, 9.8, 0.86, -4.2, 0xc9a23a, inside);
  box("candlestick", 10.1, 0.78, -4.5, 10.16, 1.05, -4.44, 0xc9a23a, inside);
  fur("chair", 10.42, 0, -4.5, 10.64, 1.2, -3.9, C.woodDark);
  fur("bench_svitlytsia", 9.0, 0, -3.5, 10.4, 0.45, -3.2, C.wood);

  // shadows and the ink pass want every mesh
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// a flat polygon (3 or 4 points, counter-clockwise from outside) as a mesh
function prism(THREE, pts, material, name) {
  const pos = [];
  const tri = (a, b, c) => pos.push(...a, ...b, ...c);
  tri(pts[0], pts[1], pts[2]);
  if (pts.length === 4) tri(pts[0], pts[2], pts[3]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, material);
  m.material.side = THREE.DoubleSide;
  m.name = name;
  return m;
}

// The rooms and the things the game needs to know, in metres: the plan.
export function plan() {
  const { t } = WALL;
  const Z = SIZE.z;
  return {
    footprint: [[0, 0, 0], [SIZE.x, 0, 0], [SIZE.x, 0, -Z]],   // SW, SE, NE: [left, front, right]
    door: [DOOR.x0 / SIZE.x, DOOR.x1 / SIZE.x],
    pich: [t + 0.9, 0, -Z + t + 0.9],
    partitions: [ROOMS.siny[0], ROOMS.siny[1]].flatMap((x) => [
      [[x, 0, -t], [x, 0, -0.7]],
      [[x, 0, -1.7], [x, 0, -Z + t]],
    ]),
  };
}
