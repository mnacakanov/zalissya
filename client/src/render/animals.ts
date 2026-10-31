import { darken } from "./people";
import { CAM } from "./shapes";
import { hash2 } from "../world/geometry";

// --- The living khutir: animals and yard things ---------------------------------
// In the storybook hand of the people (render/people.ts): painted side
// light, a thin ink outline. x, y are screen coordinates of the ground point.

const INK = "rgba(34,22,14,0.85)";
function paint(c: CanvasRenderingContext2D, col: string, x0: number, w: number): CanvasGradient {
  const g = c.createLinearGradient(x0, 0, x0 + w, 0);
  g.addColorStop(0, col); g.addColorStop(0.55, col); g.addColorStop(1, darken(col, 0.7));
  return g;
}
function ink(c: CanvasRenderingContext2D, w = 0.9): void { c.strokeStyle = INK; c.lineWidth = w; c.stroke(); }
function shadow(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
  c.fillStyle = "rgba(20,30,10,0.28)";
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill();
}

// The otaman's yard dog: a shaggy brown-and-white mutt with a curled tail.
export function drawDog(c: CanvasRenderingContext2D, x: number, y: number, face: number, moving: boolean, sitting: boolean, phase: number, asleep: boolean): void {
  shadow(c, x, y + 1, 13, 3.4);
  c.save(); c.translate(x, y); c.scale(face, 1);
  if (asleep) {
    // curled up nose to tail
    c.fillStyle = paint(c, "#9a6a3a", -12, 24);
    c.beginPath(); c.ellipse(0, -5, 12, 6.4, 0, 0, Math.PI * 2); c.fill(); ink(c);
    c.fillStyle = "#e8dcc4";
    c.beginPath(); c.ellipse(7, -5, 5, 4, 0, 0, Math.PI * 2); c.fill(); ink(c, 0.7);
    c.fillStyle = "#6e4a2a";
    c.beginPath(); c.ellipse(5, -9, 2.6, 1.6, -0.4, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#2e2018"; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(8, -5); c.lineTo(10, -5); c.stroke();
    c.restore();
    return;
  }
  const step = moving ? Math.sin(phase * 14) : 0;
  const wag = Math.sin(phase * (moving || sitting ? 16 : 5)) * 0.5;
  // tail, curled up over the back
  c.strokeStyle = "#8a5a32"; c.lineWidth = 3; c.lineCap = "round";
  c.beginPath(); c.moveTo(-10, sitting ? -6 : -10); c.quadraticCurveTo(-17, -16 + wag * 4, -11 + wag * 3, -19); c.stroke();
  c.lineCap = "butt";
  if (sitting) {
    // sitting: haunches down, front legs straight
    c.fillStyle = paint(c, "#9a6a3a", -12, 22);
    c.beginPath(); c.ellipse(-4, -6, 9, 6.6, 0, 0, Math.PI * 2); c.fill(); ink(c);
    c.fillStyle = paint(c, "#a87a46", 0, 10);
    c.beginPath(); c.ellipse(3, -11, 6, 8, 0.3, 0, Math.PI * 2); c.fill(); ink(c);
    c.fillStyle = "#e8dcc4";
    c.fillRect(3, -6, 2.4, 6); c.fillRect(7, -6, 2.4, 6);
  } else {
    for (const [lx, s] of [[-8, 1], [-4, -1], [5, -1], [9, 1]] as const) {
      c.fillStyle = "#7a5230";
      c.fillRect(lx, -6 + (s * step > 0 ? -1.5 : 0), 2.6, 6);
    }
    c.fillStyle = paint(c, "#9a6a3a", -12, 24);
    c.beginPath(); c.ellipse(0, -10, 12, 6, 0, 0, Math.PI * 2); c.fill(); ink(c);
    c.fillStyle = "#e8dcc4";
    c.beginPath(); c.ellipse(5, -8, 5, 3.4, 0, 0, Math.PI * 2); c.fill();
  }
  // the head, ears flopping, tongue out when it has been running
  const hx = sitting ? 7 : 12;
  const hy = sitting ? -19 : -14;
  c.fillStyle = paint(c, "#a87a46", hx - 5, 10);
  c.beginPath(); c.ellipse(hx, hy, 5.4, 4.6, 0, 0, Math.PI * 2); c.fill(); ink(c);
  c.fillStyle = "#e8dcc4";
  c.beginPath(); c.ellipse(hx + 4, hy + 1.4, 3, 2.2, 0, 0, Math.PI * 2); c.fill(); ink(c, 0.6);
  c.fillStyle = "#2e2018";
  c.beginPath(); c.arc(hx + 6.4, hy + 0.6, 1.1, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(hx + 1.6, hy - 1.4, 0.9, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#6e4a2a";
  c.beginPath(); c.ellipse(hx - 3, hy - 2, 2.4, 4, -0.5, 0, Math.PI * 2); c.fill(); ink(c, 0.6);
  if (moving || sitting) { c.fillStyle = "#d9606a"; c.fillRect(hx + 4, hy + 3, 1.8, 2.6); }
  c.restore();
}

// A grey goose: on land, or swimming (then only the body shows).
export function drawGoose(c: CanvasRenderingContext2D, x: number, y: number, face: number, moving: boolean, phase: number, swimming: boolean, asleep = false): void {
  if (asleep) {
    // settled on the grass, head tucked under a wing
    shadow(c, x, y + 1, 9, 2.6);
    c.fillStyle = paint(c, "#cfcac0", x - 9, 18);
    c.beginPath(); c.ellipse(x, y - 4, 9, 5.6, 0, 0, Math.PI * 2); c.fill(); ink(c);
    c.fillStyle = "#8a8478";
    c.beginPath(); c.ellipse(x - 1, y - 5, 6, 3.4, -0.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#ece8de";
    c.beginPath(); c.arc(x + 6 * face, y - 7, 3, 0, Math.PI * 2); c.fill(); ink(c, 0.6);
    return;
  }
  c.save(); c.translate(x, y); c.scale(face, 1);
  if (swimming) {
    c.strokeStyle = "rgba(230,244,248,0.45)"; c.lineWidth = 1;
    const r = (phase * 6) % 8;
    c.beginPath(); c.ellipse(0, 0, 9 + r, 3 + r * 0.3, 0, 0, Math.PI * 2); c.stroke();
  } else {
    shadow(c, 0, 1, 8, 2.4);
    const step = moving ? Math.sin(phase * 12) : 0;
    c.strokeStyle = "#e08a2a"; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(-1.6, -3); c.lineTo(-2 + step, 1); c.moveTo(1.6, -3); c.lineTo(2 - step, 1); c.stroke();
  }
  const by = swimming ? -2 : -6;
  c.fillStyle = paint(c, "#cfcac0", -9, 18);
  c.beginPath(); c.ellipse(0, by, 9, 5.4, 0, 0, Math.PI * 2); c.fill(); ink(c);
  c.fillStyle = "#8a8478";
  c.beginPath(); c.ellipse(-2, by - 1, 5.6, 3, -0.2, 0, Math.PI * 2); c.fill();
  // the long neck and the head
  const peck = moving ? 0 : Math.max(0, Math.sin(phase * 1.3)) * 4;
  c.strokeStyle = "#e4e0d6"; c.lineWidth = 3.4; c.lineCap = "round";
  c.beginPath(); c.moveTo(6, by - 2); c.quadraticCurveTo(9, by - 8 + peck, 8, by - 13 + peck * 1.6); c.stroke();
  c.lineCap = "butt";
  c.fillStyle = "#ece8de";
  c.beginPath(); c.arc(8.4, by - 13.6 + peck * 1.6, 2.6, 0, Math.PI * 2); c.fill(); ink(c, 0.6);
  c.fillStyle = "#e08a2a";
  c.beginPath(); c.moveTo(10.6, by - 14 + peck * 1.6); c.lineTo(14, by - 13 + peck * 1.6); c.lineTo(10.6, by - 12 + peck * 1.6); c.closePath(); c.fill();
  c.fillStyle = "#1e1a16";
  c.fillRect(8.6, by - 15 + peck * 1.6, 1, 1);
  c.restore();
}

// A red-and-white cow, grazing, a bell at her neck.
export function drawCow(c: CanvasRenderingContext2D, x: number, y: number, face: number, moving: boolean, phase: number, asleep = false): void {
  shadow(c, x, y + 2, 24, 5);
  c.save(); c.translate(x, y); c.scale(face, 1);
  if (asleep) {
    // lying in the straw, legs folded under, head down on her forelegs
    c.fillStyle = paint(c, "#a8583a", -22, 44);
    c.beginPath(); c.ellipse(0, -8, 22, 9, 0, 0, Math.PI * 2); c.fill(); ink(c);
    c.fillStyle = "#f2ece0";
    c.beginPath(); c.ellipse(-6, -10, 6, 4, 0.3, 0, Math.PI * 2); c.fill();
    c.fillStyle = paint(c, "#a8583a", 16, 14);
    c.beginPath(); c.ellipse(22, -6, 6.6, 6, 0.4, 0, Math.PI * 2); c.fill(); ink(c);
    c.strokeStyle = "#e8e0c8"; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(20, -11); c.quadraticCurveTo(17, -15, 18, -17); c.stroke();
    c.restore();
    return;
  }
  const step = moving ? Math.sin(phase * 6) : 0;
  for (const [lx, s] of [[-16, 1], [-11, -1], [10, -1], [15, 1]] as const) {
    c.fillStyle = "#7a5038";
    c.fillRect(lx, -12 + (s * step > 0 ? -1 : 0), 4, 12);
    c.fillStyle = "#2e2a26"; c.fillRect(lx, -2, 4, 2);
  }
  const swish = Math.sin(phase * 2.4) * 3;
  c.strokeStyle = "#8a4a2a"; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(-21, -20); c.quadraticCurveTo(-25, -12, -23 + swish, -4); c.stroke();
  c.fillStyle = "#2e2a26"; c.beginPath(); c.ellipse(-23 + swish, -3, 1.6, 2.6, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = paint(c, "#a8583a", -22, 44);
  c.beginPath(); c.ellipse(0, -18, 22, 10.6, 0, 0, Math.PI * 2); c.fill(); ink(c);
  c.fillStyle = "#f2ece0";
  for (const [px, py, rx, ry] of [[-8, -20, 6, 4.4], [6, -15, 5, 3.6], [12, -22, 3.6, 2.6]] as const) {
    c.beginPath(); c.ellipse(px, py, rx, ry, 0.3, 0, Math.PI * 2); c.fill();
  }
  // the head, lowered to graze when she is still
  const graze = moving ? 0 : 6 + Math.sin(phase * 0.8) * 1.5;
  const hx = 22;
  const hy = -20 + graze;
  c.fillStyle = paint(c, "#a8583a", hx - 6, 14);
  c.beginPath(); c.ellipse(hx, hy, 6.6, 7.4, 0.2, 0, Math.PI * 2); c.fill(); ink(c);
  c.fillStyle = "#f2ece0";
  c.beginPath(); c.ellipse(hx + 1.6, hy + 4, 4.6, 3.4, 0, 0, Math.PI * 2); c.fill(); ink(c, 0.6);
  c.strokeStyle = "#e8e0c8"; c.lineWidth = 1.8;
  c.beginPath(); c.moveTo(hx - 3, hy - 6); c.quadraticCurveTo(hx - 7, hy - 10, hx - 5, hy - 12); c.moveTo(hx + 3, hy - 6); c.quadraticCurveTo(hx + 7, hy - 10, hx + 6, hy - 12); c.stroke();
  c.fillStyle = "#1e1a16"; c.beginPath(); c.arc(hx + 2, hy - 2, 1.1, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#c9a040";
  c.beginPath(); c.arc(hx - 4, hy + 6, 2, 0, Math.PI * 2); c.fill(); ink(c, 0.5);
  c.restore();
}

// A bay horse tied at the rail, shifting its weight, tail swishing.
export function drawHorse(c: CanvasRenderingContext2D, x: number, y: number, face: number, phase: number): void {
  shadow(c, x, y + 2, 24, 5);
  c.save(); c.translate(x, y); c.scale(face, 1);
  const shift = Math.sin(phase * 0.7);
  for (const [lx, lift] of [[-15, 0], [-10, shift > 0.6 ? 2 : 0], [10, 0], [15, 0]] as const) {
    c.fillStyle = "#4a2c1a";
    c.fillRect(lx, -16 - lift, 3.6, 16 + lift);
    c.fillStyle = "#1e1612"; c.fillRect(lx - 0.4, -2, 4.4, 2);
  }
  const swish = Math.sin(phase * 2) * 3;
  c.fillStyle = "#2a1a12";
  c.beginPath(); c.moveTo(-20, -26); c.quadraticCurveTo(-28 + swish, -16, -24 + swish, -6); c.lineTo(-20, -18); c.closePath(); c.fill();
  c.fillStyle = paint(c, "#8a4a26", -21, 42);
  c.beginPath(); c.ellipse(0, -24, 21, 9.6, 0, 0, Math.PI * 2); c.fill(); ink(c);
  // saddle cloth
  c.fillStyle = "#7a1a2a"; c.fillRect(-6, -33, 12, 9);
  c.fillStyle = "#e8c66a"; c.fillRect(-6, -26, 12, 1.4);
  // neck and head, bowed a little to the rail
  c.fillStyle = paint(c, "#8a4a26", 12, 14);
  c.beginPath(); c.moveTo(14, -28); c.quadraticCurveTo(22, -40, 26, -42); c.lineTo(31, -34); c.quadraticCurveTo(24, -30, 21, -20); c.closePath(); c.fill(); ink(c);
  c.beginPath(); c.ellipse(30, -36, 4.4, 7.4, -0.6, 0, Math.PI * 2); c.fill(); ink(c);
  c.fillStyle = "#2a1a12";
  c.beginPath(); c.moveTo(14, -30); c.quadraticCurveTo(19, -42, 25, -44); c.lineTo(23, -40); c.quadraticCurveTo(19, -36, 17, -28); c.closePath(); c.fill();
  c.fillStyle = "#1e1612"; c.beginPath(); c.arc(29, -39, 1, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#f2ece0"; c.beginPath(); c.ellipse(32, -32, 1.4, 2.6, -0.6, 0, Math.PI * 2); c.fill();
  c.restore();
}

// A stork's nest on a tall pole, the stork in it, clattering now and then.
export function drawStorkNest(c: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  shadow(c, x, y + 1, 6, 2);
  c.fillStyle = paint(c, "#6e4a2a", x - 3, 6);
  c.beginPath(); c.rect(x - 2.6, y - 120, 5.2, 120); c.fill(); ink(c, 0.7);
  // the nest, a great untidy wheel of sticks
  const ny = y - 122;
  c.fillStyle = paint(c, "#7a5a36", x - 22, 44);
  c.beginPath(); c.ellipse(x, ny, 22, 8, 0, 0, Math.PI * 2); c.fill(); ink(c);
  c.strokeStyle = "#5a3a1e"; c.lineWidth = 1.2;
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2;
    c.beginPath(); c.moveTo(x + Math.cos(a) * 14, ny + Math.sin(a) * 5); c.lineTo(x + Math.cos(a + 0.4) * 25, ny + Math.sin(a + 0.4) * 9); c.stroke();
  }
  // the stork: white, black wing-ends, red legs and bill
  const clatter = (t % 9000) > 8200;
  const bob = clatter ? Math.sin(t * 0.06) * 2 : 0;
  c.fillStyle = paint(c, "#f4f0e6", x - 8, 16);
  c.beginPath(); c.ellipse(x, ny - 10, 7, 9.4, 0.2, 0, Math.PI * 2); c.fill(); ink(c);
  c.fillStyle = "#1e1a16";
  c.beginPath(); c.ellipse(x - 3, ny - 5, 5, 6, 0.4, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#f4f0e6"; c.lineWidth = 3; c.lineCap = "round";
  c.beginPath(); c.moveTo(x + 2, ny - 17); c.quadraticCurveTo(x + 4, ny - 24, x + 2 + bob * 0.3, ny - 28 + bob); c.stroke();
  c.lineCap = "butt";
  c.fillStyle = "#f4f0e6"; c.beginPath(); c.arc(x + 2 + bob * 0.3, ny - 29 + bob, 3, 0, Math.PI * 2); c.fill(); ink(c, 0.6);
  c.strokeStyle = "#d8402a"; c.lineWidth = 1.6;
  const open = clatter ? Math.abs(Math.sin(t * 0.06)) * 2 : 0;
  c.beginPath(); c.moveTo(x + 4, ny - 30 + bob); c.lineTo(x + 13, ny - 28 + bob - open); c.moveTo(x + 4, ny - 29 + bob); c.lineTo(x + 13, ny - 27 + bob + open); c.stroke();
  c.fillStyle = "#1e1a16"; c.fillRect(x + 2.6 + bob * 0.3, ny - 30.6 + bob, 1, 1);
}

// A stork crossing the sky now and then, its shadow sliding over the ground.
// Returns nothing; drawn above everything that stands.
export function drawFlyingStork(c: CanvasRenderingContext2D, camX: number, camY: number, vw: number, vh: number, t: number): void {
  const PERIOD = 52000;
  const k = (t % PERIOD) / PERIOD;
  if (k > 0.35) return;
  const lap = Math.floor(t / PERIOD);
  const y0 = 300 + hash2(lap, 3) * 900;
  const wx = -200 + (k / 0.35) * 2400;
  const wy = y0 - (k / 0.35) * 160;
  const sx = wx - camX;
  const sy = wy - camY;
  if (sx < -80 || sx > vw + 80 || sy < -200 || sy > vh + 200) return;
  // its shadow far below and to the side
  c.fillStyle = "rgba(16,28,10,0.18)";
  c.beginPath(); c.ellipse(sx + 40, sy + 140, 22, 5, 0, 0, Math.PI * 2); c.fill();
  const flap = Math.sin(t * 0.008);
  c.save(); c.translate(sx, sy);
  c.fillStyle = "#f4f0e6";
  c.beginPath(); c.ellipse(0, 0, 12, 4, -0.08, 0, Math.PI * 2); c.fill(); ink(c, 0.7);
  for (const s of [-1, 1]) {
    c.fillStyle = "#f4f0e6";
    c.beginPath(); c.moveTo(-4, 0); c.quadraticCurveTo(-2, s * 14 * flap, 2, s * 22 * flap); c.lineTo(8, s * 2); c.closePath(); c.fill(); ink(c, 0.6);
    c.fillStyle = "#1e1a16";
    c.beginPath(); c.moveTo(-2, s * 14 * flap); c.lineTo(2, s * 22 * flap); c.lineTo(4, s * 12 * flap); c.closePath(); c.fill();
  }
  c.strokeStyle = "#f4f0e6"; c.lineWidth = 2.4;
  c.beginPath(); c.moveTo(10, -1); c.lineTo(18, -3); c.stroke();
  c.strokeStyle = "#d8402a"; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(18, -3); c.lineTo(26, -3); c.moveTo(-10, 1); c.lineTo(-22, 3); c.stroke();
  c.restore();
}

// Butterflies by day round the flowers, fireflies over the grass at night,
// bats over the pustka and the hollow. All anchored to the world.
export function drawSmallLife(
  c: CanvasRenderingContext2D, flowers: ReadonlyArray<{ x: number; y: number; kind: string }>,
  camX: number, camY: number, vw: number, vh: number, t: number, night: boolean,
): void {
  if (!night) {
    flowers.forEach((f, i) => {
      if (f.kind === "kovyla" || hash2(i, 41) < 0.45) return;
      const sx = f.x - camX;
      const sy = f.y - camY;
      if (sx < -40 || sx > vw + 40 || sy < -60 || sy > vh + 40) return;
      const ph = t * 0.0012 + i * 2.1;
      const bx = sx + Math.sin(ph) * 16 + Math.sin(ph * 2.3) * 6;
      const by = sy - 30 + Math.cos(ph * 1.4) * 9;
      const flap = Math.abs(Math.sin(t * 0.03 + i));
      const col = ["#f2c14e", "#f5efdc", "#d96a5a", "#7aa6e0"][i % 4] ?? "#fff";
      c.fillStyle = col;
      c.beginPath(); c.ellipse(bx - 2, by, 2.6 * flap + 0.4, 2, -0.4, 0, Math.PI * 2); c.ellipse(bx + 2, by, 2.6 * flap + 0.4, 2, 0.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#2e2018"; c.fillRect(bx - 0.4, by - 1.6, 0.8, 3.2);
    });
    return;
  }
  // fireflies: one or two in some 120 px cells over the khutir and fields
  const G = 120;
  for (let gx = Math.floor(camX / G); gx * G < camX + vw; gx++) {
    for (let gy = Math.floor(camY / G); gy * G < camY + vh; gy++) {
      if (hash2(gx, gy * 3 + 1) < 0.55) continue;
      const ph = t * 0.0006 + hash2(gx, gy) * 20;
      const fx = gx * G + 60 + Math.sin(ph) * 40 - camX;
      const fy = gy * G + 60 + Math.cos(ph * 1.3) * 30 - camY;
      const glow = Math.max(0, Math.sin(t * 0.003 + gx * 7 + gy * 3));
      if (glow < 0.15) continue;
      c.fillStyle = `rgba(220,255,140,${glow * 0.25})`;
      c.beginPath(); c.arc(fx, fy, 5, 0, Math.PI * 2); c.fill();
      c.fillStyle = `rgba(240,255,190,${glow})`;
      c.beginPath(); c.arc(fx, fy, 1.4, 0, Math.PI * 2); c.fill();
    }
  }
  // bats round the pustka and Viy's hollow
  for (let k = 0; k < 4; k++) {
    const ph = t * 0.0011 + k * 1.6;
    const bx = 1300 + Math.cos(ph) * (80 + k * 18) - camX;
    const by = 170 + Math.sin(ph * 1.7) * 40 - camY - k * 10;
    if (bx < -20 || bx > vw + 20 || by < -20 || by > vh + 20) continue;
    const flap = Math.sin(t * 0.03 + k) * 4;
    c.fillStyle = "#1a1418";
    c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - 7, by - 3 + flap); c.lineTo(bx - 3, by + 1); c.lineTo(bx, by - 1); c.lineTo(bx + 3, by + 1); c.lineTo(bx + 7, by - 3 + flap); c.closePath(); c.fill();
  }
}

// --- Yard things ---------------------------------------------------------------
// A haystack (kopytsia) on a frame of poles.
export function drawHaystack(c: CanvasRenderingContext2D, x: number, y: number): void {
  shadow(c, x + 4, y + 2, 20, 5);
  c.fillStyle = paint(c, "#d8b860", x - 18, 36);
  c.beginPath(); c.moveTo(x - 18, y); c.quadraticCurveTo(x - 20, y - 26, x, y - 38); c.quadraticCurveTo(x + 20, y - 26, x + 18, y); c.closePath(); c.fill(); ink(c);
  c.strokeStyle = "rgba(140,104,40,0.6)"; c.lineWidth = 1;
  for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x + k * 6, y - 2); c.quadraticCurveTo(x + k * 5, y - 20, x + k * 2, y - 34); c.stroke(); }
  c.strokeStyle = "#6e4a2a"; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(x, y - 36); c.lineTo(x + 1, y - 46); c.stroke();
}

// A log beehive, standing on its end with a little thatched cap.
export function drawBeehive(c: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  shadow(c, x + 2, y + 1, 9, 2.6);
  c.fillStyle = paint(c, "#7a5a3a", x - 7, 14);
  c.beginPath(); c.rect(x - 7, y - 20, 14, 20); c.fill(); ink(c);
  c.fillStyle = "#2e2018"; c.beginPath(); c.arc(x, y - 8, 1.8, 0, Math.PI * 2); c.fill();
  c.fillStyle = paint(c, "#c8a858", x - 10, 20);
  c.beginPath(); c.moveTo(x - 10, y - 19); c.quadraticCurveTo(x, y - 30, x + 10, y - 19); c.closePath(); c.fill(); ink(c);
  // the bees, a little cloud of them by day
  c.fillStyle = "#2e2018";
  const wx = x + CAM.x;
  for (let k = 0; k < 4; k++) {
    const ph = t * 0.004 + k * 1.7 + wx;
    c.fillRect(x + Math.sin(ph) * 9, y - 12 + Math.cos(ph * 1.3) * 6, 1.4, 1.4);
  }
}

// Washing on a line between two posts, lifting in the wind.
export function drawLaundry(c: CanvasRenderingContext2D, x: number, y: number, w: number, t: number): void {
  for (const px of [x, x + w]) {
    shadow(c, px, y + 1, 3, 1.4);
    c.fillStyle = "#6e4a2a"; c.fillRect(px - 1.4, y - 34, 2.8, 34);
  }
  c.strokeStyle = "#cfc6b4"; c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(x, y - 32); c.quadraticCurveTo(x + w / 2, y - 27, x + w, y - 32); c.stroke();
  const items = [["#f6f1e4", 16, 20], ["#b8302a", 12, 14], ["#f6f1e4", 14, 22], ["#3a5a8a", 12, 12]] as const;
  let px = x + 8;
  items.forEach(([col, iw, ih], i) => {
    const lift = Math.sin(t * 0.002 + i * 1.3 + (x + CAM.x) * 0.01) * 3;
    const top = y - 31 + Math.sin(((px - x) / w) * Math.PI) * 4;
    c.fillStyle = col;
    c.beginPath(); c.moveTo(px, top); c.lineTo(px + iw, top); c.lineTo(px + iw + lift, top + ih); c.lineTo(px + lift, top + ih); c.closePath(); c.fill(); ink(c, 0.6);
    if (col === "#f6f1e4") { c.fillStyle = "#b8302a"; c.fillRect(px + lift, top + ih - 3, iw, 1.6); }
    px += iw + 5;
  });
}

// A hay cart left by the road, shafts down.
export function drawHayCart(c: CanvasRenderingContext2D, x: number, y: number): void {
  shadow(c, x, y + 2, 30, 6);
  c.strokeStyle = "#6e4a2a"; c.lineWidth = 2.4;
  c.beginPath(); c.moveTo(x + 24, y - 6); c.lineTo(x + 46, y + 2); c.moveTo(x + 24, y - 12); c.lineTo(x + 46, y - 4); c.stroke();
  c.fillStyle = paint(c, "#8a6440", x - 26, 52);
  c.beginPath(); c.rect(x - 26, y - 20, 52, 12); c.fill(); ink(c);
  c.fillStyle = paint(c, "#d8b860", x - 24, 48);
  c.beginPath(); c.moveTo(x - 24, y - 20); c.quadraticCurveTo(x - 20, y - 36, x, y - 38); c.quadraticCurveTo(x + 22, y - 36, x + 24, y - 20); c.closePath(); c.fill(); ink(c);
  for (const wx of [x - 16, x + 16]) {
    c.fillStyle = "#5a3a22";
    c.beginPath(); c.arc(wx, y - 6, 7, 0, Math.PI * 2); c.fill(); ink(c);
    c.strokeStyle = "#8a6440"; c.lineWidth = 1;
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI; c.beginPath(); c.moveTo(wx + Math.cos(a) * 6, y - 6 + Math.sin(a) * 6); c.lineTo(wx - Math.cos(a) * 6, y - 6 - Math.sin(a) * 6); c.stroke(); }
  }
}

// A plain plank bench on two stumps, for resting by day.
export function drawBench(c: CanvasRenderingContext2D, x: number, y: number): void {
  shadow(c, x + 2, y + 1, 22, 4);
  for (const lx of [x - 14, x + 14]) {
    c.fillStyle = paint(c, "#6e4a2a", lx - 4, 8);
    c.beginPath(); c.rect(lx - 3.4, y - 8, 6.8, 8); c.fill(); ink(c, 0.7);
  }
  c.fillStyle = paint(c, "#a8784a", x - 22, 44);
  c.beginPath(); c.rect(x - 22, y - 12, 44, 6); c.fill(); ink(c);
  c.fillStyle = "rgba(255,230,180,0.25)";
  c.fillRect(x - 21, y - 11.4, 42, 1.4);
}

// Radek's straw bed by the forge: a heap of straw with a sheepskin on it.
export function drawStrawBed(c: CanvasRenderingContext2D, x: number, y: number): void {
  shadow(c, x + 2, y + 2, 24, 5);
  c.fillStyle = paint(c, "#d8b860", x - 24, 48);
  c.beginPath(); c.ellipse(x, y - 3, 24, 8, 0, 0, Math.PI * 2); c.fill(); ink(c);
  c.strokeStyle = "rgba(150,110,40,0.6)"; c.lineWidth = 1;
  for (let k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(x + k * 6, y - 8); c.lineTo(x + k * 6 + 3, y + 2); c.stroke(); }
  c.fillStyle = paint(c, "#e8dcc0", x - 14, 28);
  c.beginPath(); c.ellipse(x + 2, y - 5, 14, 5, 0.05, 0, Math.PI * 2); c.fill(); ink(c, 0.6);
}

// The cow's shed (khliv): wattle walls under a thatch lean-to, open at the front.
export function drawShed(c: CanvasRenderingContext2D, x: number, y: number): void {
  shadow(c, x + 4, y + 30, 46, 8);
  c.fillStyle = "rgba(60,40,20,0.35)";
  c.fillRect(x - 40, y - 4, 80, 34);
  c.strokeStyle = "#7a5a34"; c.lineWidth = 1.4;
  for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(x - 40, y + k * 5); c.quadraticCurveTo(x - 20, y + k * 5 + 2, x - 38 + 0.0, y + k * 5); c.stroke(); }
  c.fillStyle = paint(c, "#8a6440", x - 42, 8);
  c.fillRect(x - 42, y - 6, 6, 36); c.fillRect(x + 36, y - 6, 6, 36);
  c.fillStyle = paint(c, "#b8954f", x - 50, 100);
  c.beginPath(); c.moveTo(x - 50, y); c.lineTo(x - 36, y - 26); c.lineTo(x + 36, y - 26); c.lineTo(x + 50, y); c.closePath(); c.fill(); ink(c);
  c.strokeStyle = "rgba(110,82,36,0.5)"; c.lineWidth = 1;
  for (let k = 0; k < 14; k++) { const px = x - 46 + k * 7; c.beginPath(); c.moveTo(px + 4, y - 24); c.lineTo(px, y - 1); c.stroke(); }
}

// The hen-house (kurnyk): a little clay hut on stilts with a ladder.
export function drawHenHouse(c: CanvasRenderingContext2D, x: number, y: number): void {
  shadow(c, x + 2, y + 1, 18, 4);
  c.fillStyle = "#6e4a2a";
  c.fillRect(x - 12, y - 10, 3, 10); c.fillRect(x + 9, y - 10, 3, 10);
  c.fillStyle = paint(c, "#e8e0cc", x - 14, 28);
  c.beginPath(); c.rect(x - 14, y - 28, 28, 18); c.fill(); ink(c);
  c.fillStyle = "#2e2018"; c.fillRect(x - 3, y - 20, 6, 8);
  c.fillStyle = paint(c, "#b8954f", x - 18, 36);
  c.beginPath(); c.moveTo(x - 18, y - 26); c.lineTo(x, y - 40); c.lineTo(x + 18, y - 26); c.closePath(); c.fill(); ink(c);
  c.strokeStyle = "#8a6440"; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(x, y - 12); c.lineTo(x + 10, y + 2); c.moveTo(x + 2, y - 8); c.lineTo(x + 6, y - 6); c.moveTo(x + 5, y - 4); c.lineTo(x + 9, y - 2); c.stroke();
}
