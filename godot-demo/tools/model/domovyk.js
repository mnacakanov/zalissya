// The Domovyk's khata (the kobzar's lodging) as a 3D model, built in code;
// see otaman.js for what the models are for and README.md for the camera.
//
// It stands on the west arm of the maidan's horseshoe, so it faces east:
// its door is in the east wall, which the camera sees as the lower-right
// face. Units are metres; x runs east, y up, z south. The walls' outer faces
// stand on x 0..5 and z -7..0, so the house is long north to south, with
// the door wall long. One room, the old way: the pich in the corner by the
// door with its mouth to the room, the pil along the far wall beside it and
// the Domovyk's nook between them, the pokut (icon corner) diagonal to the
// pich with the table under it, a painted skrynia, a sabre and a lyulka on
// the wall, a palianytsia on the table, a broom by the door (DESIGN.md).
// Whitewashed clay walls and a thick thatched hip roof.

export const SIZE = { x: 5, z: 7 };
export const WALL = { h: 2.3, t: 0.35, knee: 0.45 };
export const DOOR = { z0: -4.65, z1: -3.7, h: 1.85 };   // in the east wall, just south of the pich

const C = {
  wall: 0xeee8da,      // whitewash, warm
  wallIn: 0xf1ead8,
  plinth: 0x8e8a78,
  thatch: 0xc4a25a,
  thatchDark: 0x8f7438,
  shutter: 0x4f6b8a,   // blue shutters, as on the old huts
  door: 0x7a5634,
  wood: 0x8a6440,
  woodDark: 0x5e4129,
  clay: 0xd9c4a0,
  floorClay: 0x9c8366,
  red: 0xa32626,
  painted: 0x2f5d8a,
  bread: 0xc98d45,
  glass: 0x3a4652,
  iron: 0x55585c,
  icon: 0xc9a23a,
  rushnyk: 0xf2ece0,
};

export function build(THREE, opts = {}) {
  const cut = !!opts.cutaway;
  const g = new THREE.Group();
  g.name = cut ? "domovyk_cutaway" : "domovyk";
  const mats = {};
  const mat = (c) => (mats[c] ??= new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, metalness: 0 }));
  const box = (name, x0, y0, z0, x1, y1, z1, color, parent = g) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat(color));
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    m.name = name;
    parent.add(m);
    return m;
  };
  const group = (name) => { const s = new THREE.Group(); s.name = name; g.add(s); return s; };

  const { t, h, knee } = WALL;
  const X = SIZE.x;
  const Z = SIZE.z;

  // --- the pryzba (a low clay ledge round the house) and the floor ---------------
  const base = group("plinth");
  box("pryzba_s", -0.4, 0, 0, X + 0.4, 0.3, 0.4, C.plinth, base);
  box("pryzba_n", -0.4, 0, -Z - 0.4, X + 0.4, 0.3, -Z, C.plinth, base);
  box("pryzba_w", -0.4, 0, -Z, 0, 0.3, 0, C.plinth, base);
  box("pryzba_e", X, 0, -Z, X + 0.4, 0.3, 0, C.plinth, base);
  box("floor", t, 0, -Z + t, X - t, 0.05, -t, C.floorClay, group("floors"));

  // --- walls, as boxes round their openings ---------------------------------------
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
  const win = (a, b) => ({ a, b, y0: 0.95, y1: 1.7 });
  const nearH = cut ? knee : h;
  const W_EAST = [[-2.9, -2.1], [-1.5, -0.7]];
  const W_SOUTH = [[2.1, 2.9]];
  // east (near, the door wall): the door near its north end, two windows
  wallZ("wall_east", X - t, X, -Z, 0, [{ a: DOOR.z0, b: DOOR.z1, y0: 0, y1: DOOR.h }, ...W_EAST.map(([a, b]) => win(a, b))], nearH, C.wall);
  // south (near): one window toward the road
  wallX("wall_south", -t, 0, 0, X, W_SOUTH.map(([a, b]) => win(a, b)), nearH, C.wall);
  // north and west (far): blind, the west against the weather
  wallX("wall_north", -Z, -Z + t, 0, X, [], h, C.wall);
  wallZ("wall_west", 0, t, -Z, 0, [], h, C.wall);

  if (!cut) {
    const fx = group("windows");
    for (const [a, b] of W_EAST) {
      box("pane", X - 0.2, 0.95, a, X - 0.15, 1.7, b, C.glass, fx);
      box("shutter", X, 0.95, a - 0.42, X + 0.06, 1.7, a - 0.03, C.shutter, fx);
      box("shutter", X, 0.95, b + 0.03, X + 0.06, 1.7, b + 0.42, C.shutter, fx);
    }
    for (const [a, b] of W_SOUTH) {
      box("pane", a, 0.95, -0.2, b, 1.7, -0.15, C.glass, fx);
      box("shutter", a - 0.42, 0.95, 0, a - 0.03, 1.7, 0.06, C.shutter, fx);
      box("shutter", b + 0.03, 0.95, 0, b + 0.42, 1.7, 0.06, C.shutter, fx);
    }
    box("door_leaf", X - 0.2, 0, DOOR.z0, X - 0.14, DOOR.h, DOOR.z1, C.door, fx);
    // a plank step before the door, and a bench along the wall by it
    box("step", X + 0.4, 0, DOOR.z0 - 0.1, X + 0.85, 0.15, DOOR.z1 + 0.1, C.wood, fx);
    box("bench_out", X + 0.4, 0, -2.0, X + 0.75, 0.42, -0.6, C.wood, fx);
  }

  // --- the roof: a thick thatched hip, its ridge running north to south ----------
  if (!cut) {
    const o = 0.7;           // deep eaves, as thatch has
    const ey = h - 0.15;     // the thatch comes down over the wall head
    const ry = h + 2.6;
    const rz0 = -Z - o + (X + 2 * o) / 2;
    const rz1 = o - (X + 2 * o) / 2;
    const rx = X / 2;
    const A = [-o, ey, o], B = [X + o, ey, o], Cc = [X + o, ey, -Z - o], D = [-o, ey, -Z - o];
    const R0 = [rx, ry, rz1], R1 = [rx, ry, rz0];   // R0 south end of the ridge, R1 north
    const roof = group("roof");
    const m = mat(C.thatch);
    roof.add(prism(THREE, [A, B, R0], m, "roof_south"));
    roof.add(prism(THREE, [B, Cc, R1, R0], m, "roof_east"));
    roof.add(prism(THREE, [Cc, D, R1], m, "roof_north"));
    roof.add(prism(THREE, [D, A, R0, R1], m, "roof_west"));
    // the thatch's thickness at the eaves, a dark band under the edge
    const md = mat(C.thatchDark);
    roof.add(prism(THREE, [[-o, ey - 0.25, o], [X + o, ey - 0.25, o], B, A], md, "eave_s"));
    roof.add(prism(THREE, [[X + o, ey - 0.25, o], [X + o, ey - 0.25, -Z - o], Cc, B], md, "eave_e"));
    // the ridge's straw binding and the courses, for the ink pass
    const lines = [];
    for (let i = 1; i < 7; i++) {
      const f = i / 7;
      const lerp = (p, q) => p.map((v, k) => v + (q[k] - v) * f);
      for (const [p, q, r, s] of [[A, B, R0, R0], [B, Cc, R0, R1], [Cc, D, R1, R1], [D, A, R1, R0]]) {
        lines.push(...lerp(p, r), ...lerp(q, s));
      }
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
    const ll = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2a2018 }));
    ll.name = "roof_courses";
    ll.userData.inkOnly = true;
    roof.add(ll);
    // the chimney through the thatch over the pich
    box("chimney", 3.6, h, -6.3, 4.1, ry + 0.2, -5.8, C.clay, group("chimney"));
  }

  // --- inside -----------------------------------------------------------------------
  const inside = group("inside");
  const fur = (name, x0, y0, z0, x1, y1, z1, color) => {
    const m = box(name, x0, y0, z0, x1, y1, z1, color, inside);
    m.userData.solid = y0 < 0.3;
    return m;
  };
  // the pich in the north-east corner, by the door; its mouth faces west into
  // the room, the pripichok (the ledge before it) with the Domovyk's crust
  fur("pich", X - t - 1.7, 0, -Z + t, X - t, 1.55, -Z + t + 1.6, C.clay);
  box("pich_top", X - t - 1.6, 1.55, -Z + t + 0.1, X - t - 0.1, 1.85, -Z + t + 1.2, C.clay, inside);
  box("pich_mouth", X - t - 1.72, 0.55, -Z + t + 0.5, X - t - 1.7, 1.0, -Z + t + 1.1, 0x2b1d14, inside);
  fur("pripichok", X - t - 2.2, 0, -Z + t + 0.2, X - t - 1.7, 0.5, -Z + t + 1.4, C.clay);
  box("crust", X - t - 2.1, 0.5, -Z + t + 0.7, X - t - 1.85, 0.56, -Z + t + 0.9, C.bread, inside);
  // the pil (sleeping platform) along the north wall west of the pich; the
  // Domovyk's nook is the dark gap between them
  fur("pil", t, 0, -Z + t, t + 2.1, 0.55, -Z + t + 1.7, C.wood);
  box("pil_blanket", t + 0.1, 0.55, -Z + t + 0.1, t + 2.0, 0.62, -Z + t + 1.6, 0xb98a5a, inside);
  box("pillows", t + 0.15, 0.62, -Z + t + 0.15, t + 0.7, 0.8, -Z + t + 1.5, C.rushnyk, inside);
  // the pokut, diagonal to the pich: the south-west corner, the icon on a
  // shelf with a rushnyk, the table under it with the palianytsia, benches
  box("icon_shelf", t, 1.6, -t - 0.6, t + 0.3, 1.65, -t, C.wood, inside);
  box("icon", t, 1.65, -t - 0.5, t + 0.05, 2.0, -t - 0.1, C.icon, inside);
  box("rushnyk", t, 1.4, -t - 0.6, t + 0.04, 2.05, -t - 0.55, C.rushnyk, inside);
  fur("table", t + 0.6, 0, -2.3, t + 1.6, 0.78, -0.8, C.wood);
  box("palianytsia", t + 0.95, 0.78, -1.7, t + 1.3, 0.92, -1.35, C.bread, inside);
  fur("bench_w", t, 0, -3.2, t + 0.4, 0.45, -0.4, C.wood);
  fur("bench_s", t + 0.4, 0, -t - 0.4, t + 2.2, 0.45, -t, C.wood);
  // the painted skrynia along the west wall north of the bench
  fur("skrynia", t, 0, -4.7, t + 0.6, 0.6, -3.5, C.painted);
  box("skrynia_flowers", t + 0.6, 0.15, -4.5, t + 0.62, 0.45, -3.7, C.red, inside);
  // a sabre and the lyulka on the west wall above the skrynia
  box("sabre", t, 1.5, -4.8, t + 0.04, 1.56, -3.6, C.iron, inside);
  box("lyulka", t, 1.25, -4.3, t + 0.05, 1.33, -4.0, C.woodDark, inside);
  // the broom by the door, inside
  box("broom", X - t - 0.25, 0, DOOR.z1 + 0.15, X - t - 0.1, 1.3, DOOR.z1 + 0.3, C.thatch, inside);

  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

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

// The plan in metres. The door is in the east wall: t runs along the
// footprint's east edge, from its south-east corner (z 0) to the north-east
// (z -Z).
export function plan() {
  const { t } = WALL;
  const Z = SIZE.z;
  const X = SIZE.x;
  return {
    footprint: [[0, 0, 0], [X, 0, 0], [X, 0, -Z]],
    door: { wall: "east", t: [-DOOR.z1 / Z, -DOOR.z0 / Z] },
    pich: [X - t - 0.85, 0, -Z + t + 0.8],
    partitions: [],
  };
}
