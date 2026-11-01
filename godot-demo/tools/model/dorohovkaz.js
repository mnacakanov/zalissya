// A dorohovkaz: a signpost at the fork of the road in (data/village.ts
// SIGNPOSTS), a grey post with two plank arms pointing two ways. No letters:
// the game writes the names, a picture never does (ART_STYLE.md). A prop
// you walk round (NO_INTERIOR).
import { kit, propPlan } from "./lib.js";

export const SIZE = { x: 0.4, z: 0.4 };
export const NO_INTERIOR = true;
const C = { post: 0x6e6450, arm: 0x8a7a5a, armDark: 0x6a5c44, moss: 0x6e7650 };

export function build(THREE) {
  const g = new THREE.Group(); g.name = "dorohovkaz";
  const K = kit(THREE, g);
  const cx = SIZE.x / 2, cz = -SIZE.z / 2;
  K.rod("post", [cx, 0, cz], [cx, 2.2, cz], 0.07, C.post);
  K.box("cap", cx - 0.09, 2.2, cz - 0.09, cx + 0.09, 2.26, cz + 0.09, C.armDark);
  K.box("moss", cx - 0.075, 0, cz + 0.02, cx + 0.075, 0.3, cz + 0.075, C.moss);
  // two arms: one east (toward the steppe), one south-west (toward the forest),
  // each a plank with a pointed end
  const arm = (y, ang, color) => {
    const a = new THREE.Group(); a.position.set(cx, y, cz); a.rotation.y = ang; g.add(a);
    K.box("arm", 0.05, -0.1, -0.025, 0.85, 0.1, 0.025, color, a);
    K.poly("arm_tip", [[0.85, -0.1, 0.026], [1.0, 0, 0.026], [0.85, 0.1, 0.026]], color, a);
  };
  arm(1.95, 0, C.arm);
  arm(1.62, Math.PI * 0.8, C.armDark);
  K.shadows();
  return g;
}
export const plan = propPlan(SIZE);
