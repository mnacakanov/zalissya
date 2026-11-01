// The mlyn (vitriak): the post windmill on the rise by the old millstone
// (DESIGN.md "Into the windmill") as a 3D model; see otaman.js for what the
// models are for and lib.js for the pieces.
//
// A tall body of weathered vertical boards, its trestle boxed in under it, a steep
// board gable, and four lattice sails on the back (north) gable, so they
// rise behind it and never hide the door. The door faces south, a worn
// plank before it. Inside, one room of boards: the millstones in their
// wooden case under the hopper in the middle of the back, the great cog
// wheel on the back wall, the grain bin on the left, sacks of flour on the
// right, a ladder up to the loft by the bin, flour spilt on the floor. Solokha sits out
// the day here on a sack.

import { kit } from "./lib.js";

export const SIZE = { x: 4.0, z: 4.0 };
export const WALL = { h: 3.6, t: 0.2, knee: 0.45 };
export const DOOR = { x0: 1.5, x1: 2.4, h: 1.9 };   // in the south wall

const C = {
  board: 0x8a8070, boardDark: 0x5e5648, roof: 0x4f4a40, floor: 0x8a7a62, beam: 0x5e4a34, door: 0x4f4232,
  sail: 0x7a6a50, cloth: 0xd8cdb0, stone: 0x9a9284, flour: 0xeee6d2, grain: 0xc8a050, sack: 0xd8cdb0, iron: 0x3c3c3e,
};

export function build(THREE, opts = {}) {
  const cut = !!opts.cutaway;
  const g = new THREE.Group();
  g.name = cut ? "mlyn_cutaway" : "mlyn";
  const K = kit(THREE, g);
  const { t, h, knee } = WALL;
  const X = SIZE.x, Z = SIZE.z;

  // a low timber sill round the foot (the trestle is boxed in under the body)
  K.pryzba(X, Z, 0.15, 0.3, C.beam);
  K.box("floor", t, 0, -Z + t, X - t, 0.05, -t, C.floor, K.group("floors"));
  const walls = K.group("walls");
  const nearH = cut ? knee : h;
  K.wallX("wall_south", -t, 0, 0, X, [{ a: DOOR.x0, b: DOOR.x1, y0: 0, y1: DOOR.h }, { a: 2.9, b: 3.3, y0: 2.4, y1: 2.8 }], nearH, C.board, walls);
  K.wallZ("wall_east", X - t, X, -Z, 0, [{ a: -2.4, b: -2.0, y0: 1.5, y1: 1.9 }], nearH, C.board, walls);
  K.wallX("wall_north", -Z, -Z + t, 0, X, [], h, C.board, walls);
  K.wallZ("wall_west", 0, t, -Z, 0, [], h, C.board, walls);

  if (!cut) {
    const fx = K.group("details");
    // the boards, vertical, as ink lines on the faces we see
    const lines = [];
    for (let x = 0.25; x < X; x += 0.25) lines.push(x, 0, 0.003, x, h, 0.003);
    for (let z = -0.25; z > -Z; z -= 0.25) lines.push(X + 0.003, 0, z, X + 0.003, h, z);
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
    const ll = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2a2018 }));
    ll.name = "boards"; ll.userData.inkOnly = true; fx.add(ll);
    K.box("door", DOOR.x0 + 0.05, 0, -0.16, DOOR.x1 - 0.05, DOOR.h - 0.05, -0.1, C.door, fx);
    K.box("plank", DOOR.x0 - 0.1, 0, 0, DOOR.x1 + 0.1, 0.08, 0.6, C.beam, fx);
    K.box("pane", 2.9, 2.4, -0.15, 3.3, 2.8, -0.1, 0x2a2f36, fx);
    // the steep gable roof, its ridge north-south, the eaves over the sides
    const o = 0.3, ey = h, ry = h + 2.2;
    K.poly("roof_w", [[-o, ey, o], [X / 2, ry, o], [X / 2, ry, -Z - o], [-o, ey, -Z - o]], C.roof, fx);
    K.poly("roof_e", [[X + o, ey, o], [X / 2, ry, o], [X / 2, ry, -Z - o], [X + o, ey, -Z - o]], C.roof, fx);
    K.poly("gable_s", [[0, ey, 0.01], [X, ey, 0.01], [X / 2, ry, 0.01]], C.boardDark, fx);
    K.poly("gable_n", [[0, ey, -Z - 0.01], [X, ey, -Z - 0.01], [X / 2, ry, -Z - 0.01]], C.boardDark, fx);
    // the sails on the north gable: a windshaft and four lattice arms in an X
    const hub = [X / 2, h + 0.9, -Z - 0.6];
    K.rod("windshaft", [X / 2, h + 0.8, -Z + 0.6], hub, 0.14, C.beam, fx);
    const R = 5.2;
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i * Math.PI) / 2;
      const ux = Math.cos(a), uy = Math.sin(a);
      const tip = [hub[0] + R * ux, hub[1] + R * uy, hub[2]];
      K.rod("stock", hub, tip, 0.07, C.beam, fx);
      // the lattice frame on one side of the stock, from a third of the way out
      const px = -uy, py = ux, w = 0.8;
      const p = (s, off) => [hub[0] + s * ux + off * px, hub[1] + s * uy + off * py, hub[2] - 0.03];
      K.poly("sail", [p(1.6, 0), p(R, 0), p(R, w), p(1.6, w)], C.cloth, fx);
      for (let s = 1.6; s <= R + 0.01; s += 0.6) K.rod("bar", p(s, 0), p(s, w), 0.025, C.sail, fx);
      K.rod("rail", p(1.6, w), p(R, w), 0.03, C.sail, fx);
    }
  }

  // --- inside -----------------------------------------------------------------------
  const inside = K.group("inside");
  const fur = K.furnisher(inside);
  const back = -Z + t, mid = X / 2;
  // the millstones in their wooden case, the hopper over them
  fur("case", mid - 0.7, 0, back + 0.4, mid + 0.7, 0.75, back + 1.6, C.beam);
  K.rod("millstone", [mid, 0.75, back + 1.0], [mid, 0.85, back + 1.0], 0.55, C.stone, inside, 20);
  const hop = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.15, 0.6, 4, 1), K.mat(C.beam));
  hop.rotation.y = Math.PI / 4; hop.position.set(mid, 1.35, back + 1.0); hop.name = "hopper"; inside.add(hop);
  K.rod("hopper_post", [mid - 0.5, 0.75, back + 0.55], [mid - 0.5, 1.6, back + 0.55], 0.04, C.beam, inside);
  K.rod("hopper_post", [mid + 0.5, 0.75, back + 0.55], [mid + 0.5, 1.6, back + 0.55], 0.04, C.beam, inside);
  K.box("flour_spill", mid - 0.5, 0.05, back + 1.6, mid + 0.3, 0.08, back + 2.1, C.flour, inside);
  // the great cog-wheel on the back wall
  const cog = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.08, 6, 24), K.mat(C.beam));
  cog.position.set(mid, 2.5, back + 0.15); cog.name = "cog"; inside.add(cog);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 4;
    K.rod("cog_spoke", [mid - 0.8 * Math.cos(a), 2.5 - 0.8 * Math.sin(a), back + 0.15], [mid + 0.8 * Math.cos(a), 2.5 + 0.8 * Math.sin(a), back + 0.15], 0.04, C.beam, inside);
  }
  // the grain bin on the left, heaped
  fur("bin", t, 0, -2.6, t + 0.7, 0.9, -1.0, C.beam);
  K.box("grain", t + 0.05, 0.9, -2.55, t + 0.65, 0.98, -1.05, C.grain, inside);
  // sacks of flour on the right
  for (const [x, z, y] of [[X - t - 0.35, back + 0.4, 0], [X - t - 0.35, back + 1.0, 0], [X - t - 0.4, back + 0.7, 0.45]]) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), K.mat(C.sack));
    s.scale.set(0.9, 0.8, 0.8); s.position.set(x, y + 0.26, z); s.name = "sack"; inside.add(s);
  }
  fur("sacks", X - t - 0.7, 0, back + 0.05, X - t, 0.5, back + 1.35, C.sack).visible = false;
  // the ladder up to the loft, leaning on the back wall by the bin
  for (const x of [t + 0.35, t + 0.85]) K.rod("ladder", [x, 0, back + 0.7], [x, h, back + 0.05], 0.035, C.beam, inside);
  for (let y = 0.35; y < h; y += 0.35) {
    const z = back + 0.7 - 0.65 * (y / h);
    K.rod("rung", [t + 0.35, y, z], [t + 0.85, y, z], 0.02, C.beam, inside);
  }

  K.shadows();
  return g;
}

export function plan() {
  const { t } = WALL;
  const Z = SIZE.z, X = SIZE.x;
  return {
    footprint: [[0, 0, 0], [X, 0, 0], [X, 0, -Z]],
    door: [DOOR.x0 / X, DOOR.x1 / X],
    pich: [X / 2, 0, -Z + t + 1.0],
    partitions: [],
  };
}
