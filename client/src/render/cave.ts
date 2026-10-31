import { BACK_WALL, DOOR_GAP, HOUSE_RECTS, LAZNA_ROOM, WALL, ZMIIEVA_ROOM } from "../data/houses";
import { TUNNEL_SPOTS } from "../data/cave";
import { crackShown } from "../systems/cave";
import { flagHas } from "../systems/flags";
import { hash2 } from "../world/geometry";
import { darken } from "./people";
import { rr } from "./shapes";

// --- The Serpent's Cave and the tunnel under the river -----------------------------------
// Two places in the same painted hand as the khaty:
//   zmiieva — outside, a grassy hill with a rocky face and a black mouth to the south;
//             inside, the hall, ledges, a glowing pool, Onufriy's cell, Omelko's
//             rock and the serpent's lair with the hidden crack in its back wall
//   lazna   — outside, a bare rock ridge (nothing to see, nothing to find); inside,
//             a long timbered tunnel of candle niches, boulders, the smuggler's camp,
//             a sentry's bones, a ladder up at one end and a crack up at the other
// Both interiors are painted ONCE into an offscreen canvas and stamped each frame;
// only what moves (flames, drips, shimmer) and what the story changes (the crack,
// the sentry's pouch) is drawn live, on top. Creatures are in render/caveLife.ts.

type Ctx = CanvasRenderingContext2D;
const INK = "rgba(20,14,10,0.85)";

const baked = new Map<string, HTMLCanvasElement>();
function bake(key: string, w: number, h: number, paint: (g: Ctx) => void): HTMLCanvasElement {
  const have = baked.get(key);
  if (have) return have;
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const g = cv.getContext("2d");
  if (g) paint(g);
  baked.set(key, cv);
  return cv;
}

function blob(g: Ctx, x: number, y: number, rx: number, ry: number, fill: string | CanvasGradient, line = true): void {
  g.fillStyle = fill;
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill();
  if (line) { g.strokeStyle = INK; g.lineWidth = 1; g.stroke(); }
}
// a lump of rock with a lit upper-left and a dark lower-right
function rock(g: Ctx, x: number, y: number, rx: number, ry: number, base: string, moss = 0): void {
  const gr = g.createLinearGradient(x - rx, y - ry, x + rx, y + ry);
  gr.addColorStop(0, darken(base, 1.25)); gr.addColorStop(0.55, base); gr.addColorStop(1, darken(base, 0.62));
  blob(g, x, y, rx, ry, gr);
  g.strokeStyle = "rgba(20,14,10,0.35)"; g.lineWidth = 0.9;
  g.beginPath(); g.moveTo(x - rx * 0.3, y - ry * 0.5); g.lineTo(x + rx * 0.05, y + ry * 0.1); g.lineTo(x - rx * 0.1, y + ry * 0.6); g.stroke();
  if (moss > 0) {
    g.fillStyle = `rgba(92,128,60,${moss})`;
    g.beginPath(); g.ellipse(x - rx * 0.2, y - ry * 0.55, rx * 0.6, ry * 0.32, -0.2, 0, Math.PI * 2); g.fill();
  }
}

// --- outside: the hill -------------------------------------------------------------------
const PAD = 24;
export function drawCaveHill(c: Ctx, x: number, y: number, w: number, h: number, t: number, alpha: number): void {
  if (alpha <= 0.01) return;
  const cv = bake("hill", w + PAD * 2, h + PAD * 2, (g) => {
    g.translate(PAD, PAD);
    // its shadow on the forest floor
    g.fillStyle = "rgba(10,20,8,0.32)";
    g.beginPath(); g.ellipse(w / 2 + 14, h - 14, w * 0.5, 44, 0, 0, Math.PI * 2); g.fill();
    // the dome: grass on top, an uneven edge
    const pts: Array<[number, number]> = [];
    for (let k = 0; k < 36; k++) {
      const a = (k / 36) * Math.PI * 2;
      const j = 0.93 + hash2(k, 71) * 0.1;
      pts.push([w / 2 + Math.cos(a) * (w * 0.5 - 8) * j, h * 0.5 + Math.sin(a) * (h * 0.5 - 12) * j]);
    }
    const dome = g.createRadialGradient(w * 0.42, h * 0.3, 20, w / 2, h / 2, w * 0.55);
    dome.addColorStop(0, "#9ab868"); dome.addColorStop(0.55, "#628648"); dome.addColorStop(1, "#2f4a2a");
    g.fillStyle = dome;
    const domePath = () => { g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); };
    domePath(); g.fill();
    // the sun from the north-west: the far flank lies in shadow, contour lines wrap the slope
    g.save(); domePath(); g.clip();
    const sh = g.createLinearGradient(w * 0.2, 0, w * 0.9, h);
    sh.addColorStop(0, "rgba(255,246,190,0.16)"); sh.addColorStop(0.5, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(10,20,10,0.42)");
    g.fillStyle = sh; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(24,44,22,0.22)"; g.lineWidth = 1.4;
    for (const f of [0.86, 0.68, 0.5, 0.32]) { g.beginPath(); g.ellipse(w / 2, h * 0.46, w * 0.46 * f, h * 0.4 * f, 0, Math.PI * 0.08, Math.PI * 0.92); g.stroke(); }
    g.restore();
    domePath(); g.strokeStyle = INK; g.lineWidth = 1.5; g.stroke();
    // grass tufts and wildflowers
    for (let i = 0; i < 220; i++) {
      const gx = 40 + hash2(i, 5) * (w - 80);
      const gy = 20 + hash2(i, 9) * (h * 0.62);
      if (Math.hypot((gx - w / 2) / (w * 0.46), (gy - h * 0.46) / (h * 0.44)) > 0.95) continue;
      g.strokeStyle = i % 3 ? "rgba(40,72,30,0.6)" : "rgba(150,190,100,0.55)"; g.lineWidth = 1;
      g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx - 2, gy - 6); g.moveTo(gx, gy); g.lineTo(gx + 2, gy - 5); g.stroke();
      if (i % 29 === 0) { g.fillStyle = i % 2 ? "#f4e8a8" : "#e8a0c0"; g.beginPath(); g.arc(gx, gy - 6, 1.8, 0, Math.PI * 2); g.fill(); }
    }
    // outcrops of grey rock breaking through the turf
    for (let i = 0; i < 26; i++) {
      const rx = 90 + hash2(i, 13) * (w - 180);
      const ry = 40 + hash2(i, 17) * (h * 0.5);
      rock(g, rx, ry, 18 + hash2(i, 19) * 30, 10 + hash2(i, 23) * 16, i % 3 ? "#8c8678" : "#78746a", 0.55);
    }
    // a cliff of bare rock where the hill meets the ground, split with cracks
    {
      const cl = g.createLinearGradient(0, h * 0.58, 0, h);
      cl.addColorStop(0, "#9a9488"); cl.addColorStop(1, "#4a463e");
      g.fillStyle = cl;
      g.beginPath();
      g.moveTo(w * 0.14, h - 22);
      for (let k = 0; k <= 16; k++) g.lineTo(w * 0.14 + (k / 16) * w * 0.72, h * 0.64 + Math.sin(k * 1.3) * 12 + hash2(k, 83) * 16);
      g.lineTo(w * 0.86, h - 22);
      g.quadraticCurveTo(w / 2, h + 12, w * 0.14, h - 22);
      g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 1.3; g.stroke();
      g.strokeStyle = "rgba(20,16,12,0.45)"; g.lineWidth = 1.2;
      for (let k = 0; k < 18; k++) {
        const cx = w * 0.18 + hash2(k, 89) * w * 0.64;
        const cy = h * 0.68 + hash2(k, 91) * 40;
        g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + (hash2(k, 93) - 0.5) * 14, cy + 22); g.lineTo(cx + (hash2(k, 95) - 0.5) * 20, cy + 44); g.stroke();
      }
    }
    // the rocky face over the mouth: piled slabs, darker toward the ground
    for (let i = 0; i < 34; i++) {
      const fx = w * 0.17 + hash2(i, 29) * w * 0.66;
      const fy = h * 0.6 + hash2(i, 31) * h * 0.32;
      if (Math.abs(fx - w / 2) < 38 && fy > h - 90) continue;
      rock(g, fx, fy, 24 + hash2(i, 37) * 26, 12 + hash2(i, 41) * 14, i % 2 ? "#7a7468" : "#6a6458", i % 4 === 0 ? 0.4 : 0);
    }
    // the mouth: an arch of dark with a heavy lintel stone
    const mx = w / 2;
    g.fillStyle = "#0e0b0a";
    g.beginPath(); g.moveTo(mx - 46, h); g.quadraticCurveTo(mx - 48, h - 58, mx, h - 66); g.quadraticCurveTo(mx + 48, h - 58, mx + 46, h); g.closePath(); g.fill();
    const inner = g.createLinearGradient(0, h - 66, 0, h);
    inner.addColorStop(0, "rgba(0,0,0,0.9)"); inner.addColorStop(1, "rgba(40,28,20,0.5)");
    g.fillStyle = inner; g.fill();
    g.strokeStyle = INK; g.lineWidth = 1.4; g.stroke();
    rock(g, mx - 32, h - 62, 26, 14, "#8a8478");
    rock(g, mx + 30, h - 60, 28, 15, "#7e786c");
    rock(g, mx, h - 76, 34, 14, "#948e80", 0.3);
    // ferns and bushes at its feet
    for (const [bx, by, br] of [[mx - 78, h - 14, 16], [mx + 82, h - 12, 18], [mx - 128, h - 30, 13], [mx + 134, h - 26, 14], [w * 0.25, h * 0.4, 20], [w * 0.74, h * 0.34, 22]] as const) {
      blob(g, bx, by, br, br * 0.72, "#4a7a3c");
      blob(g, bx - br * 0.2, by - br * 0.22, br * 0.55, br * 0.4, "#6a9a52", false);
    }
    // a few stones worn flat before the mouth, where the monk's feet go
    for (let i = 0; i < 6; i++) rock(g, mx - 16 + (i % 3) * 16, h + 6 + (i > 2 ? 8 : 0), 7, 3.6, "#9a9486");
  });
  c.save();
  c.globalAlpha = alpha;
  c.drawImage(cv, x - PAD, y - PAD);
  // the monk's candle, flickering in the dark of the mouth
  const fl = 0.28 + Math.sin(t * 0.011) * 0.06 + Math.sin(t * 0.027) * 0.04;
  const gl = c.createRadialGradient(x + w / 2, y + h - 22, 2, x + w / 2, y + h - 22, 44);
  gl.addColorStop(0, `rgba(255,190,90,${fl})`); gl.addColorStop(1, "rgba(255,190,90,0)");
  c.fillStyle = gl; c.fillRect(x + w / 2 - 46, y + h - 68, 92, 68);
  c.restore();
}

// --- outside: the ridge over the tunnel --------------------------------------------------
// Nothing to find here, and it is meant to look it: a low bare ridge on the steppe.
export function drawLaznaRidge(c: Ctx, x: number, y: number, w: number, h: number, alpha: number): void {
  if (alpha <= 0.01) return;
  const cv = bake("ridge", w + PAD * 2, h + PAD * 2, (g) => {
    g.translate(PAD, PAD);
    g.fillStyle = "rgba(10,20,8,0.3)";
    g.beginPath(); g.ellipse(w / 2 + 10, h - 20, w * 0.5, 30, 0, 0, Math.PI * 2); g.fill();
    // a long low back of turf and rock
    const body = g.createLinearGradient(0, 0, 0, h);
    body.addColorStop(0, "#6e8a54"); body.addColorStop(0.55, "#587a44"); body.addColorStop(1, "#46603a");
    g.fillStyle = body;
    g.beginPath();
    g.moveTo(10, h - 30);
    for (let k = 0; k <= 40; k++) {
      const px = 10 + (k / 40) * (w - 20);
      g.lineTo(px, 24 + Math.sin(k * 0.55) * 10 + hash2(k, 73) * 12);
    }
    g.lineTo(w - 10, h - 30);
    for (let k = 40; k >= 0; k--) g.lineTo(10 + (k / 40) * (w - 20), h - 14 - hash2(k, 79) * 12);
    g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 1.3; g.stroke();
    for (let i = 0; i < 90; i++) {
      const rx = 30 + hash2(i, 3) * (w - 60);
      const ry = 34 + hash2(i, 7) * (h - 80);
      rock(g, rx, ry, 12 + hash2(i, 11) * 24, 7 + hash2(i, 15) * 12, i % 3 ? "#86806f" : "#706a5c", i % 3 === 0 ? 0.5 : 0.15);
    }
    for (let i = 0; i < 160; i++) {
      const gx = 20 + hash2(i, 21) * (w - 40);
      const gy = 30 + hash2(i, 25) * (h - 70);
      g.strokeStyle = i % 3 ? "rgba(40,72,30,0.55)" : "rgba(160,196,110,0.5)"; g.lineWidth = 1;
      g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx - 2, gy - 6); g.moveTo(gx, gy); g.lineTo(gx + 2, gy - 5); g.stroke();
    }
    // ferns in the clefts, and a fallen log nobody has moved in years
    for (let i = 0; i < 12; i++) blob(g, 60 + i * (w - 120) / 11, h - 40 + hash2(i, 31) * 16, 15, 9, "#4f8040", false);
    g.fillStyle = "#6a4a2c"; rr(g, w * 0.62, h * 0.52, 130, 14, 6); g.fill(); g.strokeStyle = INK; g.lineWidth = 1; g.stroke();
    g.fillStyle = "#8a6a44"; g.beginPath(); g.ellipse(w * 0.62 + 128, h * 0.52 + 7, 4, 7, 0, 0, Math.PI * 2); g.fill();
  });
  c.save();
  c.globalAlpha = alpha;
  c.drawImage(cv, x - PAD, y - PAD);
  c.restore();
}

// --- inside the cave ---------------------------------------------------------------------
// a glowing mushroom patch (drawn once; the glow breathes live)
const MUSHROOMS: Array<[number, number]> = [[520, 62], [690, 232], [90, 330], [716, 330], [330, 250]];

function bakeCave(g: Ctx, w: number, h: number): void {
  const room = ZMIIEVA_ROOM;
  // the floor: packed grit, lighter where the daylight comes in
  const fg = g.createRadialGradient(w / 2, h * 0.7, 20, w / 2, h * 0.55, w * 0.62);
  fg.addColorStop(0, "#5c5046"); fg.addColorStop(1, "#2a2420");
  g.fillStyle = fg; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 360; i++) {
    g.fillStyle = i % 2 ? "rgba(20,14,10,0.25)" : "rgba(180,160,130,0.12)";
    g.beginPath(); g.ellipse(hash2(i, 101) * w, hash2(i, 103) * h, 2 + hash2(i, 105) * 7, 1 + hash2(i, 107) * 3, 0, 0, Math.PI * 2); g.fill();
  }
  // puddles
  for (const [px, py, pr] of [[250, 270, 22], [560, 300, 28], [420, 380, 18], [140, 340, 16]] as const) {
    blob(g, px, py, pr, pr * 0.4, "rgba(70,100,110,0.45)", false);
    g.strokeStyle = "rgba(200,225,235,0.25)"; g.lineWidth = 1; g.beginPath(); g.ellipse(px - 2, py - 1, pr * 0.6, pr * 0.2, 0, 0, Math.PI * 2); g.stroke();
  }
  // the serpent's lair: dry sand, scattered bones and a rusted helm
  g.fillStyle = "rgba(150,126,86,0.4)"; rr(g, 16, BACK_WALL, 200, 182, 22); g.fill();
  for (let i = 0; i < 14; i++) {
    const bx = 30 + hash2(i, 111) * 170;
    const by = 50 + hash2(i, 113) * 150;
    g.strokeStyle = "#d8ceb4"; g.lineWidth = 2; g.lineCap = "round";
    g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + 8, by + 3 * (i % 3 - 1)); g.stroke();
  }
  rock(g, 190, 74, 11, 8, "#7a5a3a"); // the rusty helmet
  // the daylight from the mouth
  const dl = g.createRadialGradient(w / 2, h - 6, 4, w / 2, h - 6, 190);
  dl.addColorStop(0, "rgba(255,238,196,0.55)"); dl.addColorStop(1, "rgba(255,238,196,0)");
  g.fillStyle = dl; g.fillRect(w / 2 - 200, h - 220, 400, 220);
  // the walls: dark rock, lumpy on the inside edge
  g.fillStyle = "#241f1c";
  g.fillRect(0, 0, w, BACK_WALL); g.fillRect(0, 0, WALL, h); g.fillRect(w - WALL, 0, WALL, h);
  const half = (w - DOOR_GAP) / 2;
  g.fillRect(0, h - WALL, half, WALL); g.fillRect(w - half, h - WALL, half, WALL);
  for (let k = 0; k < 90; k++) {
    const px = hash2(k, 121) * w;
    rock(g, px, BACK_WALL - 4 + hash2(k, 123) * 6, 10 + hash2(k, 125) * 14, 6 + hash2(k, 127) * 6, k % 2 ? "#3a322c" : "#2e2824");
  }
  for (let k = 0; k < 30; k++) {
    const py = 14 + hash2(k, 131) * (h - 28);
    rock(g, WALL - 2, py, 8 + hash2(k, 133) * 6, 10 + hash2(k, 135) * 12, "#352d28");
    rock(g, w - WALL + 2, py + 6, 8 + hash2(k, 137) * 6, 10 + hash2(k, 139) * 12, "#352d28");
  }
  for (let k = 0; k < 20; k++) {
    if (Math.abs(k * 19 + 10 - w / 2) < DOOR_GAP / 2 + 10) continue;
    rock(g, 10 + k * 19, h - 8, 12, 7, "#34302a");
  }
  // stalactites hanging from the back wall
  for (let k = 0; k < 42; k++) {
    const sx = 20 + k * 17.4 + hash2(k, 141) * 8;
    const len = 8 + hash2(k, 143) * 24;
    const sg = g.createLinearGradient(sx - 5, 0, sx + 5, 0);
    sg.addColorStop(0, "#5c5248"); sg.addColorStop(1, "#2c2622");
    g.fillStyle = sg;
    g.beginPath(); g.moveTo(sx - 5, BACK_WALL - 5); g.lineTo(sx + 5, BACK_WALL - 5); g.lineTo(sx + 0.6, BACK_WALL - 5 + len); g.closePath(); g.fill();
    g.strokeStyle = "rgba(20,14,10,0.6)"; g.lineWidth = 0.8; g.stroke();
    g.fillStyle = "rgba(190,215,225,0.5)"; g.fillRect(sx - 0.4, BACK_WALL - 5 + len - 3, 1, 2.4);
  }
  // the faint seam in the lair's back wall (the way through opens it, live)
  g.strokeStyle = "rgba(0,0,0,0.45)"; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(52, 2); g.lineTo(48, 12); g.lineTo(54, 22); g.lineTo(49, BACK_WALL - 4); g.stroke();
  // cobwebs in the lair's corners
  g.strokeStyle = "rgba(230,230,235,0.28)"; g.lineWidth = 0.7;
  for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(16, BACK_WALL); g.quadraticCurveTo(26 + i * 6, BACK_WALL + 8 + i * 4, 18 + i * 10, BACK_WALL + 22 + i * 3); g.stroke(); }
  // the rock shelves (ledges)
  for (const L of [room.ledgeW, room.ledgeE]) {
    g.fillStyle = "rgba(10,8,6,0.4)"; rr(g, L.x + 4, L.y + 6, L.w, L.h, 10); g.fill();
    const lg = g.createLinearGradient(0, L.y, 0, L.y + L.h);
    lg.addColorStop(0, "#74685a"); lg.addColorStop(0.7, "#5a4e44"); lg.addColorStop(1, "#3a3028");
    g.fillStyle = lg; rr(g, L.x, L.y, L.w, L.h, 10); g.fill();
    g.strokeStyle = INK; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = "rgba(20,14,10,0.4)"; g.fillRect(L.x + 4, L.y + L.h - 10, L.w - 8, 8);
    for (let k = 0; k < 6; k++) rock(g, L.x + 14 + k * (L.w - 28) / 5, L.y + 10 + hash2(k, L.x) * 18, 12, 7, "#7d7162");
  }
  // the pool, a faint blue-green glow in its water
  {
    const p = room.pool;
    const pcx = p.x + p.w / 2;
    const pcy = p.y + p.h / 2;
    blob(g, pcx, pcy, p.w / 2 + 6, p.h / 2 + 5, "#2a2420");
    const pg = g.createRadialGradient(pcx, pcy, 4, pcx, pcy, p.w / 2);
    pg.addColorStop(0, "#58b8a8"); pg.addColorStop(0.55, "#2c7e7e"); pg.addColorStop(1, "#143844");
    blob(g, pcx, pcy, p.w / 2, p.h / 2, pg);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      rock(g, pcx + Math.cos(a) * (p.w / 2 + 4), pcy + Math.sin(a) * (p.h / 2 + 3), 7 + hash2(k, 151) * 5, 4 + hash2(k, 153) * 3, "#7a7064");
    }
  }
  // stalagmites
  for (const S of [room.stalag1, room.stalag2, room.stalag3, room.stalag4]) {
    const sx = S.x + S.w / 2;
    g.fillStyle = "rgba(10,8,6,0.35)"; g.beginPath(); g.ellipse(sx + 4, S.y + S.h, S.w * 0.6, 5, 0, 0, Math.PI * 2); g.fill();
    const sg = g.createLinearGradient(S.x, 0, S.x + S.w, 0);
    sg.addColorStop(0, "#8c8070"); sg.addColorStop(1, "#4a4038");
    g.fillStyle = sg;
    g.beginPath(); g.moveTo(S.x, S.y + S.h); g.lineTo(sx - 2, S.y - 14); g.lineTo(sx + 3, S.y - 14); g.lineTo(S.x + S.w, S.y + S.h); g.closePath(); g.fill();
    g.strokeStyle = INK; g.lineWidth = 1; g.stroke();
  }
  // Onufriy's cell: straw mat, blanket, jug, and a little table with a candle and a book
  {
    const m = room.mat;
    g.fillStyle = "rgba(10,8,6,0.3)"; rr(g, m.x + 3, m.y + 4, m.w, m.h, 6); g.fill();
    g.fillStyle = "#c8b070"; rr(g, m.x, m.y, m.w, m.h, 6); g.fill(); g.strokeStyle = INK; g.lineWidth = 1; g.stroke();
    g.strokeStyle = "rgba(120,90,40,0.5)"; g.lineWidth = 1;
    for (let k = 4; k < m.w; k += 6) { g.beginPath(); g.moveTo(m.x + k, m.y + 3); g.lineTo(m.x + k, m.y + m.h - 3); g.stroke(); }
    g.fillStyle = "#5e4636"; rr(g, m.x + 50, m.y + 3, 42, m.h - 6, 5); g.fill(); g.strokeStyle = INK; g.stroke();
    blob(g, m.x + 12, m.y + 15, 6, 5, "#8a6a48"); // the pillow of folded sackcloth
    const T = room.table;
    g.fillStyle = "rgba(10,8,6,0.3)"; rr(g, T.x + 3, T.y + 4, T.w, T.h, 3); g.fill();
    g.fillStyle = "#7a5a38"; rr(g, T.x, T.y, T.w, T.h, 3); g.fill(); g.strokeStyle = INK; g.stroke();
    g.fillStyle = "#e8dcb8"; g.fillRect(T.x + 4, T.y + 14, 14, 9); // the psalter
    g.strokeStyle = "#7a2a1a"; g.beginPath(); g.moveTo(T.x + 11, T.y + 14); g.lineTo(T.x + 11, T.y + 23); g.stroke();
    blob(g, T.x + 29, T.y + 17, 4.6, 3.4, "#b88a58"); // a wooden bowl
    g.fillStyle = "#f2e4b8"; g.fillRect(T.x + 17, T.y + 5, 4, 8); // the candle itself
    blob(g, m.x + 110, m.y + 10, 6, 8, "#7a5a40"); // the water jug
  }
  // Omelko's flat rock: a sheepskin thrown over it, a rushlight stuck in a crack
  {
    const S = room.seat;
    g.fillStyle = "rgba(10,8,6,0.3)"; rr(g, S.x + 3, S.y + 5, S.w, S.h, 8); g.fill();
    const sg = g.createLinearGradient(0, S.y, 0, S.y + S.h);
    sg.addColorStop(0, "#8a7e6e"); sg.addColorStop(1, "#5a5046");
    g.fillStyle = sg; rr(g, S.x, S.y, S.w, S.h, 8); g.fill(); g.strokeStyle = INK; g.stroke();
    g.fillStyle = "#d8cdb4"; rr(g, S.x + 8, S.y + 3, 30, S.h - 5, 6); g.fill(); g.strokeStyle = INK; g.lineWidth = 0.8; g.stroke();
    g.strokeStyle = "#5a3a22"; g.lineWidth = 2; g.beginPath(); g.moveTo(S.x + S.w - 8, S.y + 2); g.lineTo(S.x + S.w - 6, S.y - 18); g.stroke();
    blob(g, S.x + S.w + 8, S.y + 16, 5, 3.6, "#b88a58"); // a wooden cup
  }
  // glowing moss and mushrooms
  for (const [mx, my] of MUSHROOMS) {
    for (let k = 0; k < 5; k++) {
      const px = mx + (k - 2) * 7 + hash2(k, mx) * 4;
      const py = my + hash2(k, my) * 8;
      g.fillStyle = "#d8ecc0"; g.fillRect(px - 0.8, py, 1.6, 6);
      blob(g, px, py, 4.2 - (k % 2), 2.8, k % 2 ? "#9ad890" : "#6cc8a0");
    }
  }
  // rubble
  for (let i = 0; i < 40; i++) rock(g, 30 + hash2(i, 161) * (w - 60), 60 + hash2(i, 163) * (h - 100), 3 + hash2(i, 165) * 5, 2 + hash2(i, 167) * 3, "#5a5046");
}

// --- inside the tunnel -------------------------------------------------------------------
function bakeTunnel(g: Ctx, w: number, h: number): void {
  const R = LAZNA_ROOM;
  // packed earth, trodden down the middle
  g.fillStyle = "#5a4632"; g.fillRect(0, 0, w, h);
  const worn = g.createLinearGradient(0, 40, 0, h - 14);
  worn.addColorStop(0, "rgba(40,28,16,0)"); worn.addColorStop(0.5, "rgba(150,118,76,0.3)"); worn.addColorStop(1, "rgba(40,28,16,0)");
  g.fillStyle = worn; g.fillRect(0, 40, w, h - 54);
  for (let i = 0; i < 520; i++) {
    g.fillStyle = i % 2 ? "rgba(30,20,12,0.28)" : "rgba(190,160,110,0.14)";
    g.beginPath(); g.ellipse(hash2(i, 201) * w, hash2(i, 203) * h, 1.5 + hash2(i, 205) * 6, 1 + hash2(i, 207) * 2.4, 0, 0, Math.PI * 2); g.fill();
  }
  // the walls: earth and root, shored up with timber
  g.fillStyle = "#2c2118";
  g.fillRect(0, 0, w, BACK_WALL); g.fillRect(0, 0, WALL, h); g.fillRect(w - WALL, 0, WALL, h); g.fillRect(0, h - WALL, w, WALL);
  for (let k = 0; k < 150; k++) rock(g, hash2(k, 211) * w, BACK_WALL - 5 + hash2(k, 213) * 6, 10 + hash2(k, 215) * 14, 5 + hash2(k, 217) * 6, k % 2 ? "#4a382a" : "#3a2c20");
  for (let k = 0; k < 60; k++) rock(g, hash2(k, 221) * w, h - 8 + hash2(k, 223) * 4, 10 + hash2(k, 225) * 12, 5 + hash2(k, 227) * 4, "#3e3024");
  // roots hanging in the back wall
  g.strokeStyle = "rgba(150,110,70,0.55)"; g.lineWidth = 1.2;
  for (let k = 0; k < 60; k++) {
    const rx = hash2(k, 231) * w;
    g.beginPath(); g.moveTo(rx, 2); g.quadraticCurveTo(rx + 6, 14, rx - 3, BACK_WALL - 4 + hash2(k, 233) * 10); g.stroke();
  }
  // timber posts and lintels every so often (the grandfathers' work)
  for (let px = 110; px < w - 100; px += 130) {
    g.fillStyle = "#6a4a2c"; g.fillRect(px, 2, 8, BACK_WALL + 6);
    g.fillStyle = "#8a6440"; g.fillRect(px, 2, 3, BACK_WALL + 6);
    g.fillStyle = "#5a3e24"; g.fillRect(px - 10, 2, 28, 7);
    g.strokeStyle = INK; g.lineWidth = 0.8; g.strokeRect(px, 2, 8, BACK_WALL + 6);
  }
  // candle niches in the wall
  for (const nx of [100, 640, 1080]) {
    g.fillStyle = "#120d08"; rr(g, nx - 9, 8, 18, 22, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 1; g.stroke();
    g.fillStyle = "#f0e0b0"; g.fillRect(nx - 2, 20, 4, 8);
    g.fillStyle = "#8a7050"; g.fillRect(nx - 5, 28, 10, 2);
  }
  // the boulders: three hang from the ceiling, three rise from the floor
  for (const [b, top] of [[R.a, true], [R.b, false], [R.c, true], [R.d, false], [R.e, true], [R.f, false]] as const) {
    const cx = b.x + b.w / 2;
    g.fillStyle = "rgba(8,6,4,0.4)"; g.beginPath(); g.ellipse(cx + 6, top ? b.y + b.h + 6 : b.y + b.h + 4, b.w * 0.7, 9, 0, 0, Math.PI * 2); g.fill();
    for (let k = 0; k < 7; k++) {
      const ry = top ? b.y + 8 + k * (b.h - 18) / 6 : b.y + b.h - 8 - k * (b.h - 18) / 6;
      const rw = (b.w * 0.5 + 6) * (1 - Math.abs(k - 3) * 0.07);
      rock(g, cx + (hash2(k, b.x) - 0.5) * 12, ry, rw, 16 + hash2(k, b.y) * 6, k % 2 ? "#6c6254" : "#5a5044", top ? 0 : 0.35);
    }
  }
  // Sydir's camp: casks, crates and sacks of salt along the wall, a bedroll below
  {
    const C = R.casks;
    for (let k = 0; k < 2; k++) {
      const bx = C.x + 18 + k * 38;
      g.fillStyle = "rgba(8,6,4,0.35)"; g.beginPath(); g.ellipse(bx + 3, C.y + C.h, 18, 6, 0, 0, Math.PI * 2); g.fill();
      const bg = g.createLinearGradient(bx - 18, 0, bx + 18, 0);
      bg.addColorStop(0, "#9a6a3a"); bg.addColorStop(0.5, "#b88448"); bg.addColorStop(1, "#6a4426");
      g.fillStyle = bg; rr(g, bx - 17, C.y, 34, C.h, 10); g.fill(); g.strokeStyle = INK; g.lineWidth = 1; g.stroke();
      g.strokeStyle = "#3a2a1a"; g.lineWidth = 2;
      for (const hy of [C.y + 7, C.y + C.h - 7]) { g.beginPath(); g.moveTo(bx - 16, hy); g.lineTo(bx + 16, hy); g.stroke(); }
    }
    const K = R.crates;
    g.fillStyle = "rgba(8,6,4,0.35)"; rr(g, K.x + 3, K.y + 5, K.w, K.h, 2); g.fill();
    g.fillStyle = "#8a6a40"; rr(g, K.x, K.y, K.w, K.h, 2); g.fill(); g.strokeStyle = INK; g.lineWidth = 1; g.stroke();
    g.strokeStyle = "rgba(40,26,14,0.7)";
    g.beginPath(); g.moveTo(K.x, K.y); g.lineTo(K.x + K.w, K.y + K.h); g.moveTo(K.x + K.w, K.y); g.lineTo(K.x, K.y + K.h); g.stroke();
    // sacks of salt heaped by the crates
    for (const [sx, sy] of [[K.x + K.w + 14, K.y + 8], [K.x + K.w + 30, K.y + 14], [K.x + K.w + 20, K.y + 22]] as const) {
      blob(g, sx, sy, 11, 8, "#e0d8c0"); g.strokeStyle = "rgba(90,70,40,0.6)"; g.beginPath(); g.moveTo(sx - 5, sy - 6); g.lineTo(sx + 5, sy - 6); g.stroke();
    }
    const B = R.bedroll;
    g.fillStyle = "rgba(8,6,4,0.3)"; rr(g, B.x + 3, B.y + 4, B.w, B.h, 12); g.fill();
    g.fillStyle = "#6e4a30"; rr(g, B.x, B.y, B.w, B.h, 12); g.fill(); g.strokeStyle = INK; g.lineWidth = 1; g.stroke();
    g.fillStyle = "#8a6a48"; rr(g, B.x + 6, B.y + 4, 28, B.h - 8, 8); g.fill();
    g.strokeStyle = "rgba(30,18,10,0.55)"; for (let k = 44; k < B.w - 6; k += 8) { g.beginPath(); g.moveTo(B.x + k, B.y + 4); g.lineTo(B.x + k, B.y + B.h - 4); g.stroke(); }
    // a tin kettle on a few stones where a fire was
    for (let k = 0; k < 5; k++) rock(g, 836 + Math.cos(k * 1.3) * 12, 216 + Math.sin(k * 1.3) * 5, 5, 3.4, "#4a4038");
    blob(g, 836, 212, 9, 7, "#7a7a82");
    g.strokeStyle = INK; g.beginPath(); g.moveTo(828, 208); g.lineTo(844, 208); g.stroke();
  }
  // the sentry: his bones along the south wall, a rusted sabre, a battered helmet
  {
    const sx = 470;
    const sy = 262;
    g.fillStyle = "rgba(60,40,24,0.55)"; g.beginPath(); g.ellipse(sx + 40, sy, 56, 12, 0.05, 0, Math.PI * 2); g.fill(); // what is left of his coat
    g.strokeStyle = "#e0d8c0"; g.lineWidth = 2.6; g.lineCap = "round";
    g.beginPath(); g.moveTo(sx + 10, sy); g.lineTo(sx + 80, sy - 1); g.stroke(); // the spine
    for (let k = 0; k < 6; k++) {
      g.lineWidth = 2;
      g.beginPath(); g.moveTo(sx + 22 + k * 8, sy); g.quadraticCurveTo(sx + 24 + k * 8, sy - 9, sx + 31 + k * 8, sy - 6); g.stroke();
      g.beginPath(); g.moveTo(sx + 22 + k * 8, sy); g.quadraticCurveTo(sx + 24 + k * 8, sy + 8, sx + 31 + k * 8, sy + 6); g.stroke();
    }
    blob(g, sx + 2, sy - 1, 8, 7, "#e0d8c0"); // the skull
    g.fillStyle = "#2a2018"; g.beginPath(); g.arc(sx, sy - 2, 1.6, 0, Math.PI * 2); g.arc(sx + 5, sy - 2, 1.6, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#e0d8c0"; g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(sx + 78, sy); g.lineTo(sx + 112, sy - 8); g.moveTo(sx + 78, sy); g.lineTo(sx + 110, sy + 9); g.stroke();
    g.strokeStyle = "#7a5a40"; g.lineWidth = 3; g.beginPath(); g.moveTo(sx - 30, sy + 10); g.lineTo(sx + 36, sy + 14); g.stroke(); // the sabre, rusted
    g.strokeStyle = "#c8c0b0"; g.lineWidth = 1; g.beginPath(); g.moveTo(sx - 30, sy + 9); g.lineTo(sx + 36, sy + 13); g.stroke();
    blob(g, sx - 16, sy - 6, 10, 6, "#6a5a48"); // helmet
  }
  // the east end: the shaft up to the kaplytsia, a ladder against its wall
  {
    const x0 = w - 66;
    const y0 = 60;
    g.fillStyle = "#16120e"; rr(g, x0, y0, 44, 64, 6); g.fill();
    const lg = g.createLinearGradient(0, y0, 0, y0 + 64);
    lg.addColorStop(0, "rgba(255,226,150,0.85)"); lg.addColorStop(1, "rgba(255,226,150,0.12)");
    g.fillStyle = lg; rr(g, x0 + 3, y0 + 3, 38, 58, 4); g.fill();
    g.strokeStyle = "#7a5636"; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x0 + 10, y0 + 2); g.lineTo(x0 + 10, y0 + 66); g.moveTo(x0 + 34, y0 + 2); g.lineTo(x0 + 34, y0 + 66); g.stroke();
    g.lineWidth = 2.4; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(x0 + 9, y0 + 8 + k * 11); g.lineTo(x0 + 35, y0 + 8 + k * 11); g.stroke(); }
  }
  // the west end: the crack up into the cave, steps of fallen stone
  {
    const x0 = 36;
    const y0 = 56;
    g.fillStyle = "#0e0a08"; g.beginPath(); g.moveTo(x0 + 6, y0); g.lineTo(x0 + 34, y0 + 4); g.lineTo(x0 + 40, y0 + 34); g.lineTo(x0 + 28, y0 + 56); g.lineTo(x0 + 4, y0 + 50); g.lineTo(x0 - 2, y0 + 22); g.closePath(); g.fill();
    g.strokeStyle = INK; g.lineWidth = 1.2; g.stroke();
    const cg = g.createRadialGradient(x0 + 20, y0 + 26, 2, x0 + 20, y0 + 26, 30);
    cg.addColorStop(0, "rgba(120,200,190,0.45)"); cg.addColorStop(1, "rgba(120,200,190,0)");
    g.fillStyle = cg; g.fillRect(x0 - 14, y0 - 10, 70, 70);
    for (let k = 0; k < 4; k++) rock(g, x0 + 14 + k * 5, y0 + 62 + k * 5 - 12, 12 - k, 5, "#6a5e50");
  }
  // chalk marks, cobwebs, and a few old coins' worth of grit
  g.strokeStyle = "rgba(235,230,215,0.5)"; g.lineWidth = 1.4;
  for (const cx0 of [260, 760, 990]) { g.beginPath(); g.moveTo(cx0, 14); g.lineTo(cx0 + 8, 26); g.moveTo(cx0 + 8, 14); g.lineTo(cx0, 26); g.stroke(); }
  g.strokeStyle = "rgba(230,230,235,0.26)"; g.lineWidth = 0.7;
  for (const [wx, dir] of [[18, 1], [w - 18, -1]] as const) for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(wx, BACK_WALL); g.quadraticCurveTo(wx + dir * (10 + i * 5), BACK_WALL + 6 + i * 3, wx + dir * (6 + i * 9), BACK_WALL + 20 + i * 2); g.stroke(); }
}

const flame = (c: Ctx, x: number, y: number, t: number, seed: number, s = 1): void => {
  const f = 2.6 * s + Math.sin(t * 0.014 + seed) * 0.7 * s;
  c.fillStyle = "#ffb838"; c.beginPath(); c.ellipse(x, y - f * 0.4, 1.6 * s, f, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#fff0b0"; c.beginPath(); c.ellipse(x, y - f * 0.2, 0.8 * s, f * 0.55, 0, 0, Math.PI * 2); c.fill();
};

// Inside either place. (x, y) is the footprint's top-left on screen.
export function drawCaveInterior(c: Ctx, id: "zmiieva" | "lazna", x: number, y: number, t: number, flags: ReadonlySet<string>): void {
  const { w, h } = HOUSE_RECTS[id];
  if (id === "zmiieva") {
    c.drawImage(bake("cave", w, h, (g) => bakeCave(g, w, h)), x, y);
    const room = ZMIIEVA_ROOM;
    // the pool breathes: slow rings and a pale streak
    {
      const p = room.pool;
      const cx = x + p.x + p.w / 2;
      const cy = y + p.y + p.h / 2;
      const ph = (t * 0.0004) % 1;
      c.strokeStyle = `rgba(190,245,235,${0.4 * (1 - ph)})`; c.lineWidth = 1;
      c.beginPath(); c.ellipse(cx + 10, cy - 4, 6 + ph * 26, 3 + ph * 12, 0, 0, Math.PI * 2); c.stroke();
      const ph2 = (ph + 0.5) % 1;
      c.strokeStyle = `rgba(190,245,235,${0.4 * (1 - ph2)})`;
      c.beginPath(); c.ellipse(cx - 18, cy + 8, 5 + ph2 * 22, 2.4 + ph2 * 10, 0, 0, Math.PI * 2); c.stroke();
    }
    // mushrooms glow, out of step with one another
    MUSHROOMS.forEach(([mx, my], i) => {
      const k = 0.22 + Math.sin(t * 0.002 + i * 1.7) * 0.1;
      const g = c.createRadialGradient(x + mx, y + my, 1, x + mx, y + my, 30);
      g.addColorStop(0, `rgba(150,255,190,${k})`); g.addColorStop(1, "rgba(150,255,190,0)");
      c.fillStyle = g; c.fillRect(x + mx - 30, y + my - 30, 60, 60);
    });
    // Onufriy's candle and Omelko's rushlight
    flame(c, x + room.table.x + 19, y + room.table.y + 4, t, 1);
    flame(c, x + room.seat.x + room.seat.w - 6, y + room.seat.y - 18, t, 5, 0.85);
    // drips from three stalactites, each at its own pace
    for (let i = 0; i < 3; i++) {
      const dx = [88, 372, 566][i] ?? 0;
      const ph = ((t * 0.0006 + i * 0.37) % 1);
      const dy = BACK_WALL + 6 + ph * ph * 120;
      c.fillStyle = "rgba(200,225,235,0.8)";
      if (ph < 0.97) c.fillRect(x + dx, y + dy, 1.2, 2.6);
      else { c.strokeStyle = "rgba(200,225,235,0.5)"; c.beginPath(); c.ellipse(x + dx, y + BACK_WALL + 126, 4, 1.6, 0, 0, Math.PI * 2); c.stroke(); }
    }
    // the way through: the seam opens once the serpent sleeps (or you came by it)
    if (crackShown(flags)) {
      c.fillStyle = "#050403";
      c.beginPath(); c.moveTo(x + 40, y + 2); c.lineTo(x + 62, y + 2); c.lineTo(x + 66, y + 20); c.lineTo(x + 58, y + BACK_WALL + 6); c.lineTo(x + 40, y + BACK_WALL + 6); c.lineTo(x + 46, y + 18); c.closePath(); c.fill();
      c.strokeStyle = "rgba(150,230,215,0.55)"; c.lineWidth = 1.2; c.stroke();
      const dr = c.createRadialGradient(x + 52, y + BACK_WALL, 2, x + 52, y + BACK_WALL, 38);
      dr.addColorStop(0, "rgba(150,230,215,0.3)"); dr.addColorStop(1, "rgba(150,230,215,0)");
      c.fillStyle = dr; c.fillRect(x + 10, y, 90, 80);
      for (let k = 0; k < 5; k++) {
        c.fillStyle = k % 2 ? "#6a5e50" : "#7a6e60";
        c.beginPath(); c.ellipse(x + 38 + k * 8, y + BACK_WALL + 10 + (k % 2) * 3, 5, 3, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke();
      }
    }
    return;
  }
  // --- the tunnel
  c.drawImage(bake("lazna", w, h, (g) => bakeTunnel(g, w, h)), x, y);
  for (const nx of [100, 640, 1080]) {
    const k = 0.35 + Math.sin(t * 0.012 + nx) * 0.08;
    const g = c.createRadialGradient(x + nx, y + 20, 1, x + nx, y + 20, 36);
    g.addColorStop(0, `rgba(255,200,110,${k})`); g.addColorStop(1, "rgba(255,200,110,0)");
    c.fillStyle = g; c.fillRect(x + nx - 36, y - 16, 72, 72);
    flame(c, x + nx, y + 19, t, nx, 0.9);
  }
  // a candle in a niche of the second boulder, and Sydir's lantern on its bucket
  flame(c, x + 352, y + 188, t, 3, 0.9);
  {
    const lx = x + 774;
    const ly = y + 168;
    c.fillStyle = "#6e4a2a"; c.fillRect(lx - 7, ly, 14, 12); c.strokeStyle = INK; c.lineWidth = 0.8; c.strokeRect(lx - 7, ly, 14, 12);
    c.fillStyle = "#2a2018"; rr(c, lx - 5, ly - 12, 10, 12, 2); c.fill();
    c.fillStyle = "rgba(255,206,110,0.8)"; c.fillRect(lx - 3.4, ly - 10, 6.8, 8);
    flame(c, lx, ly - 3, t, 9, 0.8);
  }
  // the shaft's pale light, pulsing very slightly (the chapel's lamp, far above)
  {
    const sx = x + w - 44;
    const sy = y + 90;
    const k = 0.28 + Math.sin(t * 0.003) * 0.05;
    const g = c.createRadialGradient(sx, sy, 3, sx, sy, 64);
    g.addColorStop(0, `rgba(255,226,150,${k})`); g.addColorStop(1, "rgba(255,226,150,0)");
    c.fillStyle = g; c.fillRect(sx - 64, sy - 64, 128, 128);
  }
  // the sentry's pouch, until someone takes it
  if (!flagHas(flags, "sentryPouch")) {
    const px = x + TUNNEL_SPOTS.pouch.x - HOUSE_RECTS.lazna.x;
    const py = y + TUNNEL_SPOTS.pouch.y - HOUSE_RECTS.lazna.y;
    c.fillStyle = "#6e4a2a";
    c.beginPath(); c.moveTo(px - 7, py + 4); c.quadraticCurveTo(px - 8, py - 7, px, py - 8); c.quadraticCurveTo(px + 8, py - 7, px + 7, py + 4); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
    c.strokeStyle = "#2a1c10"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(px - 5, py - 4); c.lineTo(px + 5, py - 4); c.stroke();
    const gl = Math.max(0, Math.sin(t * 0.003));
    c.fillStyle = `rgba(255,240,170,${gl * 0.85})`; c.beginPath(); c.arc(px + 3, py - 8, 1 + gl * 1.5, 0, Math.PI * 2); c.fill();
  }
}
