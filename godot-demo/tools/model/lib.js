// Shared pieces for the building models (vesna.js, pustka.js, …): boxes,
// walls round their openings, flat polygons and a hip roof. Units are metres;
// x runs east, y up, z south; a building's walls stand on x 0..X, z -Z..0.
// See README.md for the camera and the passes.

export function kit(THREE, g) {
  const mats = {};
  const mat = (c) => (mats[c] ??= new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, metalness: 0 }));
  const group = (name) => { const s = new THREE.Group(); s.name = name; g.add(s); return s; };
  // a box by its min and max corners
  const box = (name, x0, y0, z0, x1, y1, z1, color, parent = g) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat(color));
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    m.name = name;
    parent.add(m);
    return m;
  };
  // a flat polygon (3 or 4 points)
  const poly = (name, pts, color, parent = g) => {
    const pos = [];
    const tri = (a, b, c) => pos.push(...a, ...b, ...c);
    tri(pts[0], pts[1], pts[2]);
    if (pts.length === 4) tri(pts[0], pts[2], pts[3]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat(color));
    m.material.side = THREE.DoubleSide;
    m.name = name;
    parent.add(m);
    return m;
  };
  // A wall along x (at z0..z1) or along z (at x0..x1), as boxes round its
  // openings [{a, b, y0, y1}] (a..b along the wall). Name the near walls
  // wall_south / wall_east: the renderer masks them for the game.
  const wallX = (name, z0, z1, x0, x1, openings, height, color, parent) => {
    let x = x0;
    for (const o of [...openings].sort((p, q) => p.a - q.a)) {
      if (o.a > x) box(name, x, 0, z0, o.a, height, z1, color, parent);
      if (o.y0 > 0) box(name + "_sill", o.a, 0, z0, o.b, Math.min(o.y0, height), z1, color, parent);
      if (o.y1 < height) box(name + "_lintel", o.a, o.y1, z0, o.b, height, z1, color, parent);
      x = o.b;
    }
    if (x < x1) box(name, x, 0, z0, x1, height, z1, color, parent);
  };
  const wallZ = (name, x0, x1, z0, z1, openings, height, color, parent) => {
    let z = z0;
    for (const o of [...openings].sort((p, q) => p.a - q.a)) {
      if (o.a > z) box(name, x0, 0, z, x1, height, o.a, color, parent);
      if (o.y0 > 0) box(name + "_sill", x0, 0, o.a, x1, Math.min(o.y0, height), o.b, color, parent);
      if (o.y1 < height) box(name + "_lintel", x0, o.y1, o.a, x1, height, o.b, color, parent);
      z = o.b;
    }
    if (z < z1) box(name, x0, 0, z, x1, height, z1, color, parent);
  };
  // A hip roof over the walls, its ridge along the longer side, eaves at
  // `ey` overhanging by `o`, the ridge at `ry`. Adds the courses as ink-only
  // lines (the ink pass draws them; colour renders don't).
  const hipRoof = (X, Z, ey, ry, o, color, edgeColor) => {
    const roof = group("roof");
    const A = [-o, ey, o], B = [X + o, ey, o], C = [X + o, ey, -Z - o], D = [-o, ey, -Z - o];
    const W = X + 2 * o, L = Z + 2 * o;
    let faces, R0, R1;
    if (W >= L) {   // ridge east-west
      R0 = [-o + L / 2, ry, -Z / 2]; R1 = [X + o - L / 2, ry, -Z / 2];
      faces = [["roof_south", [A, B, R1, R0]], ["roof_east", [B, C, R1]], ["roof_north", [C, D, R0, R1]], ["roof_west", [D, A, R0]]];
    } else {        // ridge north-south: R0 south end, R1 north end
      R0 = [X / 2, ry, o - W / 2]; R1 = [X / 2, ry, -Z - o + W / 2];
      faces = [["roof_south", [A, B, R0]], ["roof_east", [B, C, R1, R0]], ["roof_north", [C, D, R1]], ["roof_west", [D, A, R0, R1]]];
    }
    for (const [n, p] of faces) poly(n, p, color, roof);
    if (edgeColor !== undefined) {
      // the thatch's thickness at the eaves, under the near edges
      poly("eave_s", [[-o, ey - 0.25, o], [X + o, ey - 0.25, o], B, A], edgeColor, roof);
      poly("eave_e", [[X + o, ey - 0.25, o], [X + o, ey - 0.25, -Z - o], C, B], edgeColor, roof);
    }
    const lines = [];
    for (let i = 1; i < 7; i++) {
      const f = i / 7;
      const lerp = (p, q) => p.map((v, k) => v + (q[k] - v) * f);
      for (const [, p] of faces) {
        const top = p.length === 3 ? [p[2], p[2]] : [p[3], p[2]];
        lines.push(...lerp(p[0], top[0]), ...lerp(p[1], top[1]));
      }
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
    const ll = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2a2018 }));
    ll.name = "roof_courses";
    ll.userData.inkOnly = true;
    roof.add(ll);
    return { roof, ridge: [R0, R1] };
  };
  // the pryzba, a low ledge round the house (its south and east sides are
  // masked with the near walls)
  const pryzba = (X, Z, w, hgt, color) => {
    const base = group("plinth");
    box("pryzba_s", -w, 0, 0, X + w, hgt, w, color, base);
    box("pryzba_n", -w, 0, -Z - w, X + w, hgt, -Z, color, base);
    box("pryzba_w", -w, 0, -Z, 0, hgt, 0, color, base);
    box("pryzba_e", X, 0, -Z, X + w, hgt, 0, color, base);
  };
  // furniture that stands on the floor is solid in the game
  const furnisher = (parent) => (name, x0, y0, z0, x1, y1, z1, color) => {
    const m = box(name, x0, y0, z0, x1, y1, z1, color, parent);
    m.userData.solid = y0 < 0.3;
    return m;
  };
  // a round pole between two points (r, or [r at a, r at b]); `seg` sides
  const rod = (name, a, b, r, color, parent = g, seg = 8) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const [r0, r1] = Array.isArray(r) ? r : [r, r];
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, A.distanceTo(B), seg), mat(color));
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    m.name = name;
    parent.add(m);
    return m;
  };
  const shadows = () => g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { mat, group, box, poly, rod, wallX, wallZ, hipRoof, pryzba, furnisher, shadows };
}

// The plan of a prop you walk round, not into (NO_INTERIOR): its footprint.
export const propPlan = (SIZE) => () => ({
  footprint: [[0, 0, 0], [SIZE.x, 0, 0], [SIZE.x, 0, -SIZE.z]],
  partitions: [],
});
