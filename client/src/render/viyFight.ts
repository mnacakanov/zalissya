import { CIRCLE_R, type FightState, wardReach } from "../systems/viyFight";

// --- Viy's vigil: drawing ----------------------------------------------------
// Drawn in world space around the circle centre, on top of the village:
// the chalk ring, the iron nails (while they last), the ward's flash, and
// the nechyst crawling in. Viy himself is drawn by drawViy as always; the
// gaze overlays (red warning, and the dark of covered eyes) are screen
// space and drawn by drawVigilOverlay after everything else.

export function drawVigil(
  c: CanvasRenderingContext2D,
  s: FightState,
  cx: number,
  cy: number,
  camX: number,
  camY: number,
  now: number,
): void {
  const x = cx - camX;
  const y = cy - camY;
  // ward reach, faint — so a player can learn how far their words carry
  c.strokeStyle = "rgba(243,233,210,0.12)";
  c.lineWidth = 1;
  c.setLineDash([4, 8]);
  c.beginPath();
  c.ellipse(x, y, wardReach(s.prep.wis), wardReach(s.prep.wis) * 0.62, 0, 0, Math.PI * 2);
  c.stroke();
  c.setLineDash([]);
  // the chalk ring (squashed for the top-down tilt)
  c.strokeStyle = "rgba(245,242,230,0.9)";
  c.lineWidth = 3.2;
  c.beginPath();
  c.ellipse(x, y, CIRCLE_R, CIRCLE_R * 0.62, 0, 0, Math.PI * 2);
  c.stroke();
  // iron nails, one per charge left
  for (let i = 0; i < s.ironCharges; i++) {
    const a = -Math.PI / 2 + (i - 1) * 0.9;
    const nx = x + Math.cos(a) * CIRCLE_R;
    const ny = y + Math.sin(a) * CIRCLE_R * 0.62;
    c.fillStyle = "#3a3a3e";
    c.fillRect(nx - 1.5, ny - 7, 3, 9);
    c.fillStyle = "rgba(255,170,90,0.6)";
    c.fillRect(nx - 2.5, ny - 8, 5, 2);
  }
  // the ward's flash
  if (s.t < s.wardFlashUntil) {
    const k = (s.wardFlashUntil - s.t) / 0.35;
    const r = wardReach(s.prep.wis) * (1 - k * 0.4);
    c.strokeStyle = `rgba(255,236,170,${0.7 * k})`;
    c.lineWidth = 6 * k + 1;
    c.beginPath();
    c.ellipse(x, y, r, r * 0.62, 0, 0, Math.PI * 2);
    c.stroke();
  }
  // the host: smoky wisps with pale eyes
  for (const sp of s.spirits) {
    const wob = Math.sin(now * 0.006 + sp.wobble) * 6;
    const sx = x + Math.cos(sp.angle) * sp.dist + Math.sin(sp.angle) * wob;
    const sy = y + Math.sin(sp.angle) * sp.dist * 0.62;
    // a pale corpse-light halo, so the host reads against the night
    const halo = c.createRadialGradient(sx, sy - 8, 4, sx, sy - 8, 30);
    halo.addColorStop(0, "rgba(150,170,220,0.35)");
    halo.addColorStop(1, "rgba(150,170,220,0)");
    c.fillStyle = halo;
    c.fillRect(sx - 30, sy - 38, 60, 60);
    const g = c.createRadialGradient(sx, sy - 10, 2, sx, sy - 6, 20);
    g.addColorStop(0, "rgba(40,32,58,0.98)");
    g.addColorStop(1, "rgba(40,32,58,0)");
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(sx, sy - 8, 16, 20, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(40,32,58,0.85)";
    c.beginPath();
    c.moveTo(sx - 10, sy - 4);
    c.quadraticCurveTo(sx, sy + 10 + wob * 0.4, sx + 10, sy - 4);
    c.fill();
    c.fillStyle = s.gaze === "open" ? "rgba(255,90,70,0.9)" : "rgba(220,230,255,0.9)";
    c.fillRect(sx - 6, sy - 15, 4, 3);
    c.fillRect(sx + 2, sy - 15, 4, 3);
  }
}

// Screen-space: the red pulse of rising lids, the glare of the open gaze,
// and the near-black of covered eyes.
export function drawVigilOverlay(c: CanvasRenderingContext2D, s: FightState, vw: number, vh: number, lookAway: boolean, now: number): void {
  if (s.gaze === "rising") {
    const k = 1 - Math.max(0, s.gazePhaseEnd - s.t) / 2.4;
    c.fillStyle = `rgba(150,20,20,${0.08 + k * 0.22 + Math.sin(now * 0.02) * 0.04})`;
    c.fillRect(0, 0, vw, vh);
  } else if (s.gaze === "open" && !lookAway) {
    c.fillStyle = "rgba(255,60,40,0.42)";
    c.fillRect(0, 0, vw, vh);
  }
  if (lookAway) {
    c.fillStyle = "rgba(4,3,8,0.82)";
    c.fillRect(0, 0, vw, vh);
  }
}

// Night over the open village: a blue-black wash, with the campfire
// keeping a warm pocket of light around it.
export function drawNight(c: CanvasRenderingContext2D, dark: number, vw: number, vh: number, fireX: number, fireY: number): void {
  if (dark <= 0.001) return;
  c.save();
  c.fillStyle = `rgba(8,12,38,${dark})`;
  c.fillRect(0, 0, vw, vh);
  c.globalCompositeOperation = "lighter";
  const g = c.createRadialGradient(fireX, fireY, 8, fireX, fireY, 190);
  g.addColorStop(0, `rgba(255,150,60,${dark * 0.55})`);
  g.addColorStop(1, "rgba(255,150,60,0)");
  c.fillStyle = g;
  c.fillRect(fireX - 200, fireY - 200, 400, 400);
  c.restore();
}
