// The kaplytsia (the log chapel at the head of the maidan) as a 3D model; see
// otaman.js for what the models are for and lib.js for the pieces.
//
// It stands between the otaman's porch and the fire, its door facing the
// fire, so it faces south (CLAUDE.md, DESIGN.md "The kaplytsia is walk-in").
// One small room of pale pine logs, the corner ends sticking out, on a low
// stone footing; a plank hip roof rising almost to a point, and on it a
// small drum with a pear-shaped wooden cupola and a three-barred cross: a
// Ukrainian wooden dome (a bania), not an onion dome (ART_STYLE.md).
// Inside: the iconostas across the back, red and gold, the holy doors in
// its middle and the lampadka burning before them; the analoy with the
// book left open; the kanun, the stand of thin candles for the dead; a
// bench along each side wall; a rug before the door (the old game hid a
// hatch to the tunnel under it).

import { kit } from "./lib.js";

export const SIZE = { x: 3.8, z: 3.4 };
export const WALL = { h: 2.4, t: 0.3, knee: 0.45 };
export const DOOR = { x0: 1.425, x1: 2.375, h: 1.85 };   // in the south wall, centred

const C = {
  log: 0xb89c6c, logDark: 0x8e7448, stone: 0x8a857a, floor: 0x8a6e4a,
  plank: 0x7d6d52, plankDark: 0x57493a, dome: 0x6c6450, gold: 0xd4a83a,
  door: 0x5e4630, glass: 0x2e3338, ink: 0x1a1410,
  red: 0x8f2f26, redDark: 0x6a211b, wood: 0x8a6440, woodDark: 0x5e4129,
  wax: 0xece2c4, book: 0x6b2f22, rug: 0x7a3a2c, linen: 0xe8e0cc,
};

export function build(THREE, opts = {}) {
  const cut = !!opts.cutaway;
  const g = new THREE.Group();
  g.name = cut ? "kaplytsia_cutaway" : "kaplytsia";
  const K = kit(THREE, g);
  const { t, h, knee } = WALL;
  const X = SIZE.x, Z = SIZE.z;

  K.pryzba(X, Z, 0.2, 0.3, C.stone);
  K.box("floor", t, 0, -Z + t, X - t, 0.05, -t, C.floor, K.group("floors"));

  const walls = K.group("walls");
  const win = (a, b) => ({ a, b, y0: 0.95, y1: 1.6 });
  const S_WIN = [[0.45, 0.95], [2.85, 3.35]];
  const E_WIN = [[-2.0, -1.5]];
  const nearH = cut ? knee : h;
  K.wallX("wall_south", -t, 0, 0, X, [...S_WIN.map(([a, b]) => win(a, b)), { a: DOOR.x0, b: DOOR.x1, y0: 0, y1: DOOR.h }], nearH, C.log, walls);
  K.wallZ("wall_east", X - t, X, -Z, 0, E_WIN.map(([a, b]) => win(a, b)), nearH, C.log, walls);
  K.wallX("wall_north", -Z, -Z + t, 0, X, [], h, C.log, walls);
  K.wallZ("wall_west", 0, t, -Z, 0, [], h, C.log, walls);

  if (!cut) {
    const fx = K.group("details");
    // the corner ends of the logs, alternating, at the three corners we see
    for (let i = 0, y = 0.4; y < h - 0.1; i++, y += 0.3) {
      const a = i % 2 ? 0.16 : 0;
      const b = i % 2 ? 0 : 0.16;
      K.box("log_end", -a, y, -t, 0, y + 0.22, 0, C.logDark, fx);          // SW, along x
      K.box("log_end", 0, y, b === 0 ? 0 : 0, t, y + 0.22, b, C.logDark, fx); // SW, along z
      K.box("log_end", X, y, -t, X + a, y + 0.22, 0, C.logDark, fx);       // SE, along x
      K.box("log_end", X - t, y, 0, X, y + 0.22, b, C.logDark, fx);        // SE, along z
      K.box("log_end", X, y, -Z, X + a, y + 0.22, -Z + t, C.logDark, fx);  // NE, along x
      K.box("log_end", X - t, y, -Z - b, X, y + 0.22, -Z, C.logDark, fx);  // NE, along z
    }
    // windows: dark glass, small shutters
    for (const [a, b] of S_WIN) {
      K.box("pane", a, 0.95, -0.2, b, 1.6, -0.15, C.glass, fx);
      K.box("shutter", a - 0.22, 0.95, 0, a - 0.03, 1.6, 0.05, C.plankDark, fx);
      K.box("shutter", b + 0.03, 0.95, 0, b + 0.22, 1.6, 0.05, C.plankDark, fx);
    }
    for (const [a, b] of E_WIN) {
      K.box("pane", X - 0.2, 0.95, a, X - 0.15, 1.6, b, C.glass, fx);
      K.box("shutter", X, 0.95, a - 0.22, X + 0.05, 1.6, a - 0.03, C.plankDark, fx);
      K.box("shutter", X, 0.95, b + 0.03, X + 0.05, 1.6, b + 0.22, C.plankDark, fx);
    }
    // the door: heavy planks, an iron ring, set in a little
    K.box("door", DOOR.x0 + 0.05, 0, -0.2, DOOR.x1 - 0.05, DOOR.h - 0.05, -0.12, C.door, fx);
    K.box("door_ring", 1.62, 0.95, -0.12, 1.72, 1.05, -0.08, C.ink, fx);
    // the stone step
    K.box("step", DOOR.x0 - 0.1, 0, 0, DOOR.x1 + 0.1, 0.12, 0.4, C.stone, fx);

    // the roof: planks, rising nearly to a point; courses in ink only
    const { ridge } = K.hipRoof(X, Z, h - 0.1, h + 1.7, 0.45, C.plank, C.plankDark);
    // log courses as ink lines on the two faces we see, round the openings
    const lines = [];
    for (let y = 0.3; y < h - 0.05; y += 0.24) {
      const spans = [[0, X]];
      const cutSpan = (a, b) => {
        for (let i = spans.length - 1; i >= 0; i--) {
          const [s0, s1] = spans[i];
          if (b <= s0 || a >= s1) continue;
          spans.splice(i, 1);
          if (a > s0) spans.push([s0, a]);
          if (b < s1) spans.push([b, s1]);
        }
      };
      if (y < DOOR.h) cutSpan(DOOR.x0, DOOR.x1);
      if (y > 0.9 && y < 1.65) for (const [a, b] of S_WIN) cutSpan(a, b);
      for (const [a, b] of spans) lines.push(a, y, 0.003, b, y, 0.003);
      const zs = [[-Z, 0]];
      if (y > 0.9 && y < 1.65) {
        const [a, b] = E_WIN[0];
        zs.splice(0, 1, [-Z, a], [b, 0]);
      }
      for (const [a, b] of zs) lines.push(X + 0.003, y, a, X + 0.003, y, b);
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
    const ll = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2a2018 }));
    ll.name = "log_courses";
    ll.userData.inkOnly = true;
    fx.add(ll);

    // the drum and the pear-shaped cupola on the roof's peak, and the cross
    const cx = (ridge[0][0] + ridge[1][0]) / 2, cz = ridge[0][2], ry = ridge[0][1];
    const top = K.group("cupola");
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.55, 8), K.mat(C.plankDark));
    drum.position.set(cx, ry + 0.2, cz); drum.name = "drum"; top.add(drum);
    const profile = [[0, 0], [0.5, 0], [0.56, 0.12], [0.46, 0.34], [0.26, 0.58], [0.1, 0.78], [0.04, 0.92], [0, 0.98]]
      .map(([r, y]) => new THREE.Vector2(r, y));
    const dome = new THREE.Mesh(new THREE.LatheGeometry(profile, 16), K.mat(C.dome));
    dome.position.set(cx, ry + 0.45, cz); dome.name = "dome"; top.add(dome);
    const cy = ry + 0.45 + 0.98;
    K.box("cross_v", cx - 0.03, cy, cz - 0.03, cx + 0.03, cy + 0.62, cz + 0.03, C.gold, top);
    K.box("cross_h", cx - 0.17, cy + 0.34, cz - 0.03, cx + 0.17, cy + 0.4, cz + 0.03, C.gold, top);
    K.box("cross_top", cx - 0.09, cy + 0.5, cz - 0.03, cx + 0.09, cy + 0.55, cz + 0.03, C.gold, top);
    K.box("cross_foot", cx - 0.1, cy + 0.14, cz - 0.03, cx + 0.1, cy + 0.19, cz + 0.03, C.gold, top).rotation.z = 0.35;
  }

  // --- inside -----------------------------------------------------------------------
  const inside = K.group("inside");
  const fur = K.furnisher(inside);
  const mid = X / 2;
  const back = -Z + t;   // the inner face of the north wall
  // the iconostas across the back: a red and gold screen, the holy doors
  // (a gold, carved pair) in its middle
  fur("iconostas", t + 0.1, 0, back, X - t - 0.1, 2.1, back + 0.18, C.red);
  // the upper tier of icons in gold frames, the lower tier dark red, the holy doors between
  K.box("icon_frames", t + 0.2, 1.55, back + 0.18, X - t - 0.2, 1.95, back + 0.22, C.gold, inside);
  K.box("icon_tier_w", t + 0.2, 0.35, back + 0.18, mid - 0.4, 1.45, back + 0.22, C.redDark, inside);
  K.box("icon_tier_e", mid + 0.4, 0.35, back + 0.18, X - t - 0.2, 1.45, back + 0.22, C.redDark, inside);
  K.box("holy_doors", mid - 0.3, 0.3, back + 0.18, mid + 0.3, 1.5, back + 0.25, C.gold, inside);
  K.box("icon_cross", mid - 0.05, 1.9, back + 0.18, mid + 0.05, 2.35, back + 0.24, C.gold, inside);
  // the lampadka hanging before the holy doors
  K.box("lampadka", mid - 0.07, 1.55, back + 0.5, mid + 0.07, 1.75, back + 0.64, C.gold, inside);
  // the analoy (lectern) with the book left open
  fur("analoy", mid - 0.22, 0, back + 0.95, mid + 0.22, 1.05, back + 1.3, C.wood);
  K.box("book", mid - 0.18, 1.05, back + 1.0, mid + 0.18, 1.1, back + 1.25, C.book, inside);
  // the kanun: a stand of thin candles for the dead, by the west wall
  fur("kanun", t + 0.15, 0, -1.7, t + 0.65, 0.95, -1.25, C.woodDark);
  for (let i = 0; i < 5; i++) K.box("candle", t + 0.2 + i * 0.09, 0.95, -1.6, t + 0.25 + i * 0.09, 1.2, -1.55, C.wax, inside);
  // a bench along each side wall, for the old
  fur("lava_w", t, 0, -2.6, t + 0.3, 0.45, -1.8, C.wood);
  fur("lava_e", X - t - 0.3, 0, -2.6, X - t, 0.45, -1.8, C.wood);
  // a rug before the door, flat (the old game hid a hatch under it)
  K.box("rug", mid - 0.45, 0.05, -1.0, mid + 0.45, 0.07, -0.45, C.rug, inside);
  K.box("rug_band", mid - 0.45, 0.07, -0.75, mid + 0.45, 0.075, -0.7, C.linen, inside);

  K.shadows();
  return g;
}

// The plan in metres. The door is in the south wall (t along it, west to
// east). The "pich" is where the room's own light comes from: here, the
// lampadka before the holy doors.
export function plan() {
  const { t } = WALL;
  const Z = SIZE.z, X = SIZE.x;
  return {
    footprint: [[0, 0, 0], [X, 0, 0], [X, 0, -Z]],
    door: [DOOR.x0 / X, DOOR.x1 / X],
    pich: [X / 2, 0, -Z + t + 0.6],
    partitions: [],
  };
}
