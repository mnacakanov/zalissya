import type { Bat, Crawler } from "../systems/cave";
import { darken } from "./people";

// --- The cave's creatures ---------------------------------------------------------------
// Same storybook hand as the people and spirits: soft shading, a thin ink line.
//   Zmiy     — the old serpent: a green-black coil round his hoard, a crest, amber
//              eyes. Awake his body also lies across the passage and his head is
//              raised; lulled he has drawn it all back and sleeps with his chin on
//              the coil, breathing.
//   Vohnyk   — a little wandering flame with a face
//   bats     — hanging folded from the back wall; wings when they fly
//   salamanders (black and yellow) at the pool, rats in the tunnel
// x, y are screen coordinates (camera-shifted).

const INK = "rgba(24,18,12,0.85)";

function ink(c: CanvasRenderingContext2D, w = 0.9): void {
  c.strokeStyle = INK; c.lineWidth = w; c.stroke();
}

// --- the Zmiy ---------------------------------------------------------------------------
// (sx, sy) is where the serpent "stands" (data/cave.ts ZMIY: lair coords 150,190). The
// curl lies round (sx + 5, sy - 34); the passage band he blocks while awake is
// 64…134 px east of him (data/houses.ts ZMIY_COIL).
export type ZmiyOpts = { lulled: boolean; hoardTaken: boolean };

export function drawZmiy(c: CanvasRenderingContext2D, sx: number, sy: number, t: number, o: ZmiyOpts): void {
  const breathe = Math.sin(t * (o.lulled ? 0.0011 : 0.0018)) * (o.lulled ? 1.6 : 1.1);
  const cx = sx + 5;
  const cy = sy - 34;
  // his shadow on the sand
  c.fillStyle = "rgba(10,12,8,0.35)";
  c.beginPath(); c.ellipse(cx, cy + 22, 86, 24, 0, 0, Math.PI * 2); c.fill();
  // the hoard under his tail: a kerchief and a heap of chervintsi
  drawHoard(c, sx + 100, sy, t, o.hoardTaken);
  const body = (rx: number, ry: number, lw: number, a0: number, a1: number, shade: number) => {
    // each ring: dark green back, a lighter belly edge, scale ticks
    c.lineCap = "round";
    c.strokeStyle = darken("#2f4a34", shade);
    c.lineWidth = lw + 2.4;
    c.beginPath(); c.ellipse(cx, cy, rx, ry + breathe * 0.4, 0, a0, a1); c.stroke();
    c.strokeStyle = darken("#3d6a40", shade);
    c.lineWidth = lw;
    c.beginPath(); c.ellipse(cx, cy, rx, ry + breathe * 0.4, 0, a0, a1); c.stroke();
    c.strokeStyle = "rgba(190,200,120,0.5)";
    c.lineWidth = lw * 0.28;
    c.beginPath(); c.ellipse(cx, cy + lw * 0.22, rx, ry + breathe * 0.4, 0, a0 + 0.2, a1 - 0.2); c.stroke();
    // scales
    c.strokeStyle = "rgba(20,36,22,0.55)";
    c.lineWidth = 1;
    for (let a = a0; a < a1; a += 0.17) {
      const px = cx + Math.cos(a) * rx;
      const py = cy + Math.sin(a) * (ry + breathe * 0.4);
      c.beginPath(); c.arc(px, py, lw * 0.28, 0.3, 2.8); c.stroke();
    }
  };
  // a spiral of three rings
  body(70, 36, 22, 0.1, Math.PI * 2 + 0.1, 0.85);
  body(48, 24, 20, 0.5, Math.PI * 2 + 0.3, 1);
  body(26, 12, 17, 0.2, Math.PI * 2, 1.05);
  if (!o.lulled) {
    // awake: the body runs out across the passage, up to the back wall and down
    // to the tail, coiling over the hoard; it sways a little
    const bx = sx + 98;
    const sway = Math.sin(t * 0.0014) * 4;
    const top = sy - 152;
    const bot = sy + 18;
    const path = () => {
      c.beginPath();
      c.moveTo(cx + 62, cy - 4);
      c.bezierCurveTo(cx + 78, cy - 10, bx - 26 + sway, sy - 70, bx + sway * 0.5, sy - 90);
      c.bezierCurveTo(bx + 24 + sway, sy - 112, bx - 16, top + 26, bx + 4, top);
    };
    // the upper run, into the dark of the back wall
    c.lineCap = "round";
    c.strokeStyle = "#233a28"; c.lineWidth = 31; path(); c.stroke();
    c.strokeStyle = "#3d6a40"; c.lineWidth = 27; path(); c.stroke();
    c.strokeStyle = "rgba(190,200,120,0.45)"; c.lineWidth = 7; path(); c.stroke();
    // the lower run: a loop that ends in the tail on the hoard
    const lower = () => {
      c.beginPath();
      c.moveTo(cx + 64, cy + 6);
      c.bezierCurveTo(bx + 24 + sway, sy - 36, bx - 28, sy - 6, bx + sway * 0.6, bot - 2);
    };
    c.strokeStyle = "#233a28"; c.lineWidth = 29; lower(); c.stroke();
    c.strokeStyle = "#3d6a40"; c.lineWidth = 25; lower(); c.stroke();
    c.strokeStyle = "rgba(190,200,120,0.45)"; c.lineWidth = 6; lower(); c.stroke();
    // the tail tip
    c.fillStyle = "#3d6a40";
    c.beginPath(); c.moveTo(bx - 12 + sway * 0.6, bot - 4); c.quadraticCurveTo(bx + sway * 0.6, bot + 26, bx + 14 + sway * 0.6, bot - 4); c.closePath(); c.fill(); ink(c);
    // scale ticks along the runs
    c.strokeStyle = "rgba(20,36,22,0.5)"; c.lineWidth = 1;
    for (let k = 0; k < 14; k++) {
      const ty = top + 10 + k * 11;
      c.beginPath(); c.arc(bx + Math.sin(k * 0.8) * 4 + sway * 0.4, ty, 7, 0.4, 2.7); c.stroke();
    }
  }
  // the neck and head
  if (o.lulled) {
    // asleep: the chin rests on the coil, the eyes shut, the crest drooping
    drawHead(c, cx - 58, cy - 6 + breathe, 1, t, true);
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.00035 + i / 3) % 1;
      c.fillStyle = `rgba(190,215,240,${0.55 * (1 - ph)})`;
      c.beginPath(); c.arc(cx - 70 + ph * 18 + i * 4, cy - 28 - ph * 46, 2.6 + i * 1.5, 0, Math.PI * 2); c.fill();
      c.strokeStyle = `rgba(60,80,110,${0.5 * (1 - ph)})`; c.lineWidth = 0.7; c.stroke();
    }
  } else {
    // awake: the neck rises out of the coil and bends toward the hall
    const nx = cx - 36 + Math.sin(t * 0.0012) * 4;
    const ny = cy - 76 + breathe;
    const neck = () => {
      c.beginPath();
      c.moveTo(cx - 40, cy - 10);
      c.bezierCurveTo(cx - 64, cy - 22, cx - 62, cy - 56, nx, ny + 10);
    };
    c.lineCap = "round";
    c.strokeStyle = "#233a28"; c.lineWidth = 24; neck(); c.stroke();
    c.strokeStyle = "#3d6a40"; c.lineWidth = 20; neck(); c.stroke();
    c.strokeStyle = "rgba(200,205,130,0.5)"; c.lineWidth = 6; neck(); c.stroke();
    drawHead(c, nx, ny, 0, t, false);
    // a thread of smoke from the nostrils
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.0005 + i / 3) % 1;
      c.fillStyle = `rgba(200,200,205,${0.35 * (1 - ph)})`;
      c.beginPath(); c.arc(nx + 22 + ph * 16, ny + 6 - ph * 18, 2 + ph * 4, 0, Math.PI * 2); c.fill();
    }
  }
}

function drawHead(c: CanvasRenderingContext2D, x: number, y: number, rest: 0 | 1, t: number, asleep: boolean): void {
  // a broad wedge of a head with a crest of spines, drawn facing east/south
  const g = c.createLinearGradient(x - 24, y, x + 26, y);
  g.addColorStop(0, "#50804c"); g.addColorStop(1, "#27412c");
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x - 26, y + 4);
  c.quadraticCurveTo(x - 24, y - 16, x - 2, y - 17);
  c.quadraticCurveTo(x + 22, y - 18, x + 32, y - 2);
  c.quadraticCurveTo(x + 36, y + 6, x + 24, y + 12);
  c.quadraticCurveTo(x + 4, y + 18, x - 26, y + 4);
  c.closePath(); c.fill(); ink(c, 1.1);
  // the crest: a row of spines
  c.fillStyle = "#d8b45a";
  const droop = asleep ? 0.55 : 0;
  for (let k = 0; k < 5; k++) {
    const px = x - 20 + k * 8;
    const py = y - 14 + Math.abs(k - 2) * 1.5;
    c.beginPath();
    c.moveTo(px - 3, py); c.lineTo(px + 1, py - 14 + droop * 8 * (k % 2)); c.lineTo(px + 4, py);
    c.closePath(); c.fill(); ink(c, 0.7);
  }
  // the brow ridge and the nostrils
  c.strokeStyle = "rgba(20,36,22,0.7)"; c.lineWidth = 1.3;
  c.beginPath(); c.moveTo(x - 4, y - 6); c.quadraticCurveTo(x + 6, y - 11, x + 16, y - 6); c.stroke();
  c.fillStyle = "#16241a";
  c.beginPath(); c.ellipse(x + 30, y - 1, 1.4, 2, 0, 0, Math.PI * 2); c.fill();
  // eyes: amber slits when awake, a line when asleep
  if (asleep) {
    c.strokeStyle = "#16241a"; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(x + 2, y - 3); c.quadraticCurveTo(x + 8, y + 1, x + 14, y - 3); c.stroke();
  } else {
    const blink = Math.sin(t * 0.0009) > 0.985 ? 0.2 : 1;
    c.fillStyle = "#f0b838";
    c.beginPath(); c.ellipse(x + 9, y - 3, 6, 4 * blink, 0, 0, Math.PI * 2); c.fill(); ink(c, 0.8);
    c.fillStyle = "#1a1208";
    c.beginPath(); c.ellipse(x + 10, y - 3, 1.5, 3.6 * blink, 0, 0, Math.PI * 2); c.fill();
  }
  // the jaw line and a hint of teeth
  c.strokeStyle = "rgba(20,36,22,0.7)"; c.lineWidth = 1;
  c.beginPath(); c.moveTo(x - 22, y + 6); c.quadraticCurveTo(x + 6, y + 13, x + 30, y + 5); c.stroke();
  if (!asleep && rest === 0) {
    c.fillStyle = "#f2eede";
    for (const tx of [10, 16, 22]) { c.beginPath(); c.moveTo(tx + x - 2, y + 7); c.lineTo(tx + x, y + 11); c.lineTo(tx + x + 2, y + 7); c.closePath(); c.fill(); }
  }
}

// Her dowry: chervintsi tied in an embroidered kerchief, one corner coming undone.
function drawHoard(c: CanvasRenderingContext2D, x: number, y: number, t: number, taken: boolean): void {
  if (taken) {
    // only the empty kerchief remains
    c.fillStyle = "#e8dcc0"; c.beginPath(); c.moveTo(x - 12, y - 2); c.lineTo(x + 2, y - 8); c.lineTo(x + 14, y); c.lineTo(x + 2, y + 6); c.closePath(); c.fill(); ink(c, 0.7);
    c.strokeStyle = "#b0302a"; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 7, y - 1); c.lineTo(x + 9, y + 1); c.stroke();
    return;
  }
  c.fillStyle = "#e8dcc0";
  c.beginPath(); c.moveTo(x - 16, y + 2); c.quadraticCurveTo(x - 4, y - 18, x + 10, y - 14); c.quadraticCurveTo(x + 20, y - 6, x + 14, y + 6); c.quadraticCurveTo(x, y + 12, x - 16, y + 2); c.closePath(); c.fill(); ink(c, 0.8);
  c.strokeStyle = "#b0302a"; c.lineWidth = 1.1;
  c.beginPath(); c.moveTo(x - 10, y - 2); c.lineTo(x + 10, y - 6); c.moveTo(x - 8, y + 3); c.lineTo(x + 10, y + 1); c.stroke();
  // spilled coins
  c.fillStyle = "#e0b840";
  for (let k = 0; k < 7; k++) {
    const px = x - 6 + (k % 4) * 6 + (k > 3 ? 3 : 0);
    const py = y + 8 + Math.floor(k / 4) * 4;
    c.beginPath(); c.ellipse(px, py, 3.2, 1.8, 0, 0, Math.PI * 2); c.fill(); ink(c, 0.5);
  }
  // a glint now and then
  const gl = Math.max(0, Math.sin(t * 0.003));
  c.fillStyle = `rgba(255,248,200,${gl * 0.9})`;
  c.beginPath(); c.arc(x + 4, y + 8, 1 + gl * 1.6, 0, Math.PI * 2); c.fill();
}

// --- the little flame -------------------------------------------------------------------
export function drawVohnyk(c: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  const bob = Math.sin(t * 0.004 + x * 0.01) * 3;
  const fy = y - 34 + bob;
  // a pool of light on the stone, and a small shadow
  c.fillStyle = "rgba(10,10,6,0.22)";
  c.beginPath(); c.ellipse(x, y + 2, 7, 2.4, 0, 0, Math.PI * 2); c.fill();
  const g = c.createRadialGradient(x, fy, 2, x, fy, 38);
  g.addColorStop(0, "rgba(255,226,130,0.5)"); g.addColorStop(1, "rgba(255,226,130,0)");
  c.fillStyle = g; c.fillRect(x - 40, fy - 40, 80, 80);
  // the flame: a teardrop that wavers
  const w1 = Math.sin(t * 0.013) * 1.8;
  const w2 = Math.sin(t * 0.019 + 1) * 1.4;
  c.fillStyle = "#ffb938";
  c.beginPath();
  c.moveTo(x, fy - 21 + w2);
  c.quadraticCurveTo(x + 12 + w1, fy - 6, x + 8, fy + 6);
  c.quadraticCurveTo(x, fy + 14, x - 8, fy + 6);
  c.quadraticCurveTo(x - 12 + w1, fy - 6, x, fy - 21 + w2);
  c.closePath(); c.fill(); ink(c, 0.7);
  c.fillStyle = "#ffe880";
  c.beginPath(); c.ellipse(x, fy + 2, 6, 8.5, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#fffbe0";
  c.beginPath(); c.ellipse(x, fy + 5, 3.6, 5, 0, 0, Math.PI * 2); c.fill();
  // a face: two dots and a puzzled little mouth
  c.fillStyle = "#4a2a10";
  c.beginPath(); c.arc(x - 2.6, fy + 2, 1, 0, Math.PI * 2); c.arc(x + 2.6, fy + 2, 1, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#4a2a10"; c.lineWidth = 0.8;
  c.beginPath(); c.arc(x, fy + 7, 1.6, 0.2, Math.PI - 0.2); c.stroke();
  // sparks
  for (let i = 0; i < 3; i++) {
    const ph = (t * 0.0007 + i / 3) % 1;
    c.fillStyle = `rgba(255,214,110,${0.8 * (1 - ph)})`;
    c.beginPath(); c.arc(x + Math.sin(ph * 6 + i * 2) * 8, fy - 14 - ph * 20, 1.1, 0, Math.PI * 2); c.fill();
  }
}

// --- bats --------------------------------------------------------------------------------
export function drawBats(c: CanvasRenderingContext2D, bats: readonly Bat[], camX: number, camY: number, t: number): void {
  for (const b of bats) {
    const x = b.x - camX;
    const y = b.y - camY;
    if (x < -30 || x > c.canvas.width + 30 || y < -30 || y > c.canvas.height + 30) continue;
    if (b.hang) {
      // folded up, hanging by its feet
      c.fillStyle = "#2a2230";
      c.beginPath(); c.ellipse(x, y + 5, 2.6, 5, 0, 0, Math.PI * 2); c.fill(); ink(c, 0.6);
      c.fillStyle = "#3a3042";
      c.beginPath(); c.moveTo(x - 1.6, y + 9); c.lineTo(x - 2.4, y + 12); c.lineTo(x, y + 10); c.lineTo(x + 2.4, y + 12); c.lineTo(x + 1.6, y + 9); c.closePath(); c.fill();
      continue;
    }
    // in flight: wings that beat, each bat at its own pace
    const flap = Math.sin(t * 0.03 + b.seed * 1.9);
    const lift = 4 + flap * 5;
    c.fillStyle = "#241e2c";
    for (const s of [-1, 1] as const) {
      c.beginPath();
      c.moveTo(x + s * 1.5, y);
      c.quadraticCurveTo(x + s * 8, y - lift, x + s * 13, y - lift * 0.4 + 2);
      c.quadraticCurveTo(x + s * 10, y + 1, x + s * 8, y + 2.5);
      c.quadraticCurveTo(x + s * 5, y + 0.5, x + s * 3, y + 3);
      c.closePath(); c.fill(); ink(c, 0.6);
    }
    c.fillStyle = "#332a3a";
    c.beginPath(); c.ellipse(x, y + 1.5, 2.4, 3.4, 0, 0, Math.PI * 2); c.fill(); ink(c, 0.6);
    c.fillStyle = "#332a3a";
    c.beginPath(); c.moveTo(x - 2, y - 1); c.lineTo(x - 2.4, y - 4); c.lineTo(x - 0.4, y - 2); c.moveTo(x + 2, y - 1); c.lineTo(x + 2.4, y - 4); c.lineTo(x + 0.4, y - 2); c.fill();
  }
}

// --- salamanders and rats ----------------------------------------------------------------
export function drawCrawler(c: CanvasRenderingContext2D, k: Crawler, camX: number, camY: number): void {
  const x = k.x - camX;
  const y = k.y - camY;
  const f = k.face;
  const wig = k.moving ? Math.sin(k.phase) : Math.sin(k.phase * 0.2 + k.seed) * 0.2;
  c.save();
  c.translate(x, y);
  c.scale(f, 1);
  c.fillStyle = "rgba(10,10,6,0.25)";
  c.beginPath(); c.ellipse(0, 2, k.kind === "rat" ? 7 : 8, 2, 0, 0, Math.PI * 2); c.fill();
  if (k.kind === "newt") {
    // the cave salamander: black with yellow spots, a tail that swings
    c.strokeStyle = INK; c.lineWidth = 1;
    c.fillStyle = "#1c1a1c";
    c.beginPath();
    c.moveTo(7, -1);
    c.quadraticCurveTo(0, -3.4 + wig, -6, -1);
    c.quadraticCurveTo(-11, 0 - wig * 3, -15, 1 + wig * 3);
    c.quadraticCurveTo(-11, 2 - wig * 3, -6, 2);
    c.quadraticCurveTo(0, 3, 7, 1.4);
    c.closePath(); c.fill(); c.stroke();
    c.fillStyle = "#1c1a1c";
    c.beginPath(); c.ellipse(8, 0, 3.4, 2.4, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = "#f0c418";
    for (const sx of [3, -1, -5]) { c.beginPath(); c.arc(sx, -0.6 + wig * 0.4, 1, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = "#e8d890";
    c.beginPath(); c.arc(9, -0.8, 0.6, 0, Math.PI * 2); c.fill();
    // legs
    c.strokeStyle = "#1c1a1c"; c.lineWidth = 1.2;
    for (const lx of [3, -4]) { c.beginPath(); c.moveTo(lx, 1.6); c.lineTo(lx + wig * 2, 4); c.moveTo(lx, -1); c.lineTo(lx - wig * 2, -3.2); c.stroke(); }
  } else {
    // a grey tunnel rat with a long pink tail
    c.strokeStyle = "#b88a86"; c.lineWidth = 1;
    c.beginPath(); c.moveTo(-7, 0); c.quadraticCurveTo(-13, -2 + wig * 3, -17, 1 - wig * 2); c.stroke();
    c.fillStyle = "#6e6a68";
    c.beginPath(); c.ellipse(0, -2, 8, 4.2, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
    c.beginPath(); c.moveTo(6, -4.4); c.quadraticCurveTo(12, -3, 11, -0.6); c.quadraticCurveTo(7, 0.4, 5, -0.5); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = "#d6a8a2";
    c.beginPath(); c.arc(5.4, -5.4, 1.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#180f10";
    c.beginPath(); c.arc(8.4, -2.6, 0.7, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#e0a8a4";
    c.beginPath(); c.arc(11.4, -1.4, 0.8, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#4a4644"; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(-3, 1); c.lineTo(-3 + wig * 2, 3.4); c.moveTo(3, 1); c.lineTo(3 - wig * 2, 3.4); c.stroke();
  }
  c.restore();
}
