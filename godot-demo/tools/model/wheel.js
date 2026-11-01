// A wooden cart wheel (rim, hub, spokes), shared by the cart models. The
// wheel stands in the x-y plane, centred at c, its axle along z.
export function wheel(THREE, K, parent, c, r, color, hubColor, name = "wheel") {
  const w = new THREE.Group(); w.name = name; w.position.set(...c); parent.add(w);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r - 0.035, 0.035, 6, 20), K.mat(color));
  rim.scale.z = 1.4; rim.name = "rim"; w.add(rim);
  K.rod("hub", [0, 0, -0.1], [0, 0, 0.1], 0.07, hubColor, w, 10);
  for (let i = 0; i < 10; i++) {
    const f = (i / 10) * Math.PI * 2;
    K.rod("spoke", [0, 0, 0], [(r - 0.05) * Math.cos(f), (r - 0.05) * Math.sin(f), 0], 0.015, color, w, 5);
  }
  return w;
}
