import { HOUSE_RECTS } from "../data/houses";
import { LYSA_WORLD } from "../data/lysa";
const LYSA_TRAILHEAD = LYSA_WORLD.trailhead;
import { VILLAGE_W } from "../world/areas";
import { drawCherry, drawCraneWell, drawKhata, drawTyn, drawWillow } from "./khutir";
import { BOBBER, BREW_SPOT, CRUST_SPOT, type HerbDef } from "../data/items";
import { FIRE, GARDEN, POND, type TreeKind, WELL } from "../data/village";
import { rr } from "./shapes";
import { drawFolk, type FolkOpts } from "./people";
import { WORLD_H, WORLD_W } from "../world/areas";
import { clamp, hash2, type Rect } from "../world/geometry";


// --- The ground, baked once ---------------------------------------------------
// The grass used to be a grid of flat 34 px tiles, and it read as a
// checkerboard. Now the whole world's ground is painted once into a small
// texture (one texel per GROUND_TEXEL world px): soft value-noise patches of
// green that dry into steppe gold eastward, and every road, path and yard
// worn into it with a feathered edge. Each frame just stretches the visible
// part of it over the screen, smooth; the crisp detail (blades, flowers,
// ruts, pebbles) is drawn on top at full resolution.
const GROUND_TEXEL = 4;
let groundTex: HTMLCanvasElement | null = null;
let dirtMask: Uint8ClampedArray | null = null;
let maskW = 0;

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}
function valueNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const a = hash2(ix + seed, iy);
  const b = hash2(ix + 1 + seed, iy);
  const c = hash2(ix + seed, iy + 1);
  const d = hash2(ix + 1 + seed, iy + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

// --- Roads as they are worn, not drawn -----------------------------------------
// Every road is a centreline sampled every few px. It meanders a little
// off its line and swells and pinches as feet and wheels made it, so its
// edges are never straight. The maidan is a ragged blob trodden round the
// fire and the well. Along the roads lie puddles, potholes, mud and the
// two ruts the carts cut (ROAD_MARKS, drawn crisp every frame).
type Road = { pts: Array<{ x: number; y: number }>; w: number; seed: number; ruts: boolean };

function bezierPts(p0: number[], p1: number[], p2: number[], p3: number[], step: number): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = [];
  const len = Math.hypot((p3[0] ?? 0) - (p0[0] ?? 0), (p3[1] ?? 0) - (p0[1] ?? 0)) * 1.3;
  const n = Math.max(2, Math.ceil(len / step));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    const at = (k: 0 | 1) => u * u * u * (p0[k] ?? 0) + 3 * u * u * t * (p1[k] ?? 0) + 3 * u * t * t * (p2[k] ?? 0) + t * t * t * (p3[k] ?? 0);
    out.push({ x: at(0), y: at(1) });
  }
  return out;
}
function linePts(pts: number[][], step: number): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax = 0, ay = 0] = pts[i] ?? [];
    const [bx = 0, by = 0] = pts[i + 1] ?? [];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    for (let k = 0; k < n; k++) out.push({ x: ax + ((bx - ax) * k) / n, y: ay + ((by - ay) * k) / n });
  }
  const last = pts[pts.length - 1] ?? [0, 0];
  out.push({ x: last[0] ?? 0, y: last[1] ?? 0 });
  return out;
}

let roadsCache: Road[] | null = null;
function roads(): Road[] {
  if (roadsCache) return roadsCache;
  const r: Road[] = [
    // the khutir's road west–east, and south to the bridge and beyond
    { pts: linePts([[-40, 646], [VILLAGE_W - 40, 646]], 6), w: 80, seed: 1, ruts: true },
    { pts: linePts([[840, 300], [840, 1700]], 6), w: 96, seed: 2, ruts: true },
    // the steppe roads: the trail to Lysa Hora and the chumak road south
    { pts: bezierPts([VILLAGE_W - 80, 456], [2000, 330], [2350, 760], [LYSA_TRAILHEAD.x, LYSA_TRAILHEAD.y], 6), w: 34, seed: 3, ruts: false },
    { pts: [...bezierPts([VILLAGE_W - 60, 646], [1950, 660], [2250, 900], [2250, 1300], 6), ...linePts([[2250, 1300], [2250, WORLD_H + 40]], 6)], w: 50, seed: 4, ruts: true },
    { pts: linePts([[1500, 646], [1500, 452], [VILLAGE_W, 452]], 6), w: 54, seed: 5, ruts: false },
    { pts: bezierPts([2005, 1214], [2080, 1236], [2160, 1230], [2244, 1170], 6), w: 30, seed: 6, ruts: false },
  ];
  // footpaths worn from each door to the nearest road
  let seed = 10;
  for (const h of Object.values(HOUSE_RECTS)) {
    const dx = h.x + h.w / 2;
    const dy = h.y + h.h;
    const ty = dy < 600 ? 620 : dy + 34;
    r.push({ pts: bezierPts([dx, dy - 4], [dx, (dy + ty) / 2], [dx + (dx < 840 ? 6 : -6), (dy + ty) / 2 + 6], [dx + (dx < 840 ? 12 : -12), ty], 5), w: 20, seed: seed++, ruts: false });
  }
  // the pustka's path down to the maidan past the well, and the forge's yard
  r.push({ pts: bezierPts([1189, 312], [1160, 380], [1080, 430], [1000, 470], 5), w: 18, seed: seed++, ruts: false });
  r.push({ pts: linePts([[328, 556], [328, 616]], 5), w: 40, seed: seed++, ruts: false });
  roadsCache = r;
  return r;
}

// where a road actually runs at sample i: meandered off its line, with its
// own width there
function roadAt(rd: Road, i: number): { x: number; y: number; nx: number; ny: number; half: number } {
  const p = rd.pts[i] ?? { x: 0, y: 0 };
  const q = rd.pts[Math.min(rd.pts.length - 1, i + 1)] ?? p;
  const o = rd.pts[Math.max(0, i - 1)] ?? p;
  const tx = q.x - o.x;
  const ty = q.y - o.y;
  const tl = Math.hypot(tx, ty) || 1;
  const nx = -ty / tl;
  const ny = tx / tl;
  const s = i * 6;
  const wander = (valueNoise(s / 170, rd.seed * 7.3, 101) - 0.5) * rd.w * 0.4;
  const half = (rd.w / 2) * (0.78 + 0.45 * valueNoise(s / 55, rd.seed * 3.1, 131));
  return { x: p.x + nx * wander, y: p.y + ny * wander, nx, ny, half };
}

function paintPaths(g: CanvasRenderingContext2D, widen: number): void {
  for (const rd of roads()) {
    for (let i = 0; i < rd.pts.length; i++) {
      const a = roadAt(rd, i);
      g.beginPath(); g.arc(a.x, a.y, a.half + widen / 2, 0, Math.PI * 2); g.fill();
    }
  }
  // the maidan: a ragged blob trodden round the fire and the well
  g.beginPath();
  for (let k = 0; k <= 64; k++) {
    const ang = (k / 64) * Math.PI * 2;
    const wob = 0.82 + 0.3 * valueNoise(Math.cos(ang) * 2.2 + 5, Math.sin(ang) * 2.2 + 5, 151);
    const x = 840 + Math.cos(ang) * (196 + widen / 2) * wob;
    const y = 572 + Math.sin(ang) * (132 + widen / 2) * wob;
    if (k === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath(); g.fill();
}

// Puddles, potholes, mud and cart ruts, laid out once along the roads.
type Mark = { kind: "puddle" | "hole" | "mud" | "stones"; x: number; y: number; w: number; h: number; a: number; seed: number };
let marksCache: { marks: Mark[]; ruts: Array<Array<{ x: number; y: number }>> } | null = null;
function roadMarks(): { marks: Mark[]; ruts: Array<Array<{ x: number; y: number }>> } {
  if (marksCache) return marksCache;
  const marks: Mark[] = [];
  const ruts: Array<Array<{ x: number; y: number }>> = [];
  for (const rd of roads()) {
    if (rd.w < 30) continue;
    for (let i = 4; i < rd.pts.length - 4; i += 7) {
      const h = hash2(i * 1.7 + rd.seed, rd.seed * 9.1);
      const a = roadAt(rd, i);
      const off = (hash2(i, rd.seed * 13) - 0.5) * a.half * 1.2;
      const x = a.x + a.nx * off;
      const y = a.y + a.ny * off;
      const ang = Math.atan2(a.ny, a.nx) + Math.PI / 2;
      const size = 0.6 + hash2(i * 3, rd.seed) * 0.8;
      if (h < 0.1) marks.push({ kind: "puddle", x, y, w: 16 * size + 6, h: 7 * size + 3, a: ang, seed: i + rd.seed });
      else if (h < 0.22) marks.push({ kind: "hole", x, y, w: 9 * size + 4, h: 5 * size + 2, a: ang, seed: i + rd.seed });
      else if (h < 0.42) marks.push({ kind: "mud", x, y, w: 22 * size + 8, h: 10 * size + 4, a: ang, seed: i + rd.seed });
      else if (h < 0.55) marks.push({ kind: "stones", x, y, w: 10, h: 6, a: ang, seed: i + rd.seed });
    }
    if (rd.ruts) {
      for (const side of [-1, 1] as const) {
        const line: Array<{ x: number; y: number }> = [];
        for (let i = 0; i < rd.pts.length; i += 2) {
          const a = roadAt(rd, i);
          const o = side * Math.min(a.half * 0.45, 18) + (valueNoise(i / 9, side * 5 + rd.seed, 171) - 0.5) * 3;
          line.push({ x: a.x + a.nx * o, y: a.y + a.ny * o });
        }
        ruts.push(line);
      }
    }
  }
  // the maidan is churned and wet round the well, trampled round the fire
  for (let k = 0; k < 14; k++) {
    const ang = hash2(k, 191) * Math.PI * 2;
    const rr2 = 40 + hash2(k, 193) * 120;
    marks.push({ kind: hash2(k, 197) < 0.12 ? "puddle" : hash2(k, 197) < 0.45 ? "stones" : "mud", x: 860 + Math.cos(ang) * rr2 * 1.4, y: 575 + Math.sin(ang) * rr2 * 0.8, w: 14 + hash2(k, 199) * 22, h: 7 + hash2(k, 201) * 8, a: hash2(k, 203) * 3, seed: k + 500 });
  }
  marks.push({ kind: "mud", x: 950, y: 540, w: 52, h: 20, a: 0.2, seed: 777 });
  marks.push({ kind: "puddle", x: 960, y: 548, w: 26, h: 9, a: 0.1, seed: 778 });
  marksCache = { marks, ruts };
  return marksCache;
}

function drawRoadMarks(c: CanvasRenderingContext2D, camX: number, camY: number, vw: number, vh: number, t: number): void {
  const { marks, ruts } = roadMarks();
  // the cart ruts: two dark grooves with a pale ridge beside each
  c.lineCap = "round"; c.lineJoin = "round";
  for (const line of ruts) {
    let open = false;
    for (const [col, w, dy] of [["rgba(120,86,46,0.42)", 3.2, 0], ["rgba(236,206,150,0.35)", 1.2, 2]] as const) {
      c.strokeStyle = col; c.lineWidth = w;
      c.beginPath(); open = false;
      for (const pt of line) {
        const x = pt.x - camX;
        const y = pt.y - camY + dy;
        if (x < -40 || x > vw + 40 || y < -40 || y > vh + 40) { if (open) { c.stroke(); c.beginPath(); open = false; } continue; }
        if (!open) { c.moveTo(x, y); open = true; } else c.lineTo(x, y);
      }
      if (open) c.stroke();
    }
  }
  for (const m of marks) {
    const x = m.x - camX;
    const y = m.y - camY;
    if (x < -40 || x > vw + 40 || y < -30 || y > vh + 30) continue;
    c.save(); c.translate(x, y); c.rotate(m.a);
    if (m.kind === "mud") {
      // wet, dark earth with a lumpy edge
      c.fillStyle = "rgba(110,78,42,0.42)";
      c.beginPath();
      for (let k = 0; k <= 12; k++) {
        const ang = (k / 12) * Math.PI * 2;
        const wob = 0.75 + 0.4 * hash2(m.seed, k);
        const px = Math.cos(ang) * m.w * 0.5 * wob;
        const py = Math.sin(ang) * m.h * 0.5 * wob;
        if (k === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.closePath(); c.fill();
      c.fillStyle = "rgba(80,56,30,0.35)";
      c.beginPath(); c.ellipse(m.w * 0.1, 0, m.w * 0.22, m.h * 0.22, 0, 0, Math.PI * 2); c.fill();
    } else if (m.kind === "hole") {
      // a pothole: a dark hollow with the sunlit far lip
      c.fillStyle = "rgba(70,48,24,0.55)";
      c.beginPath(); c.ellipse(0, 0, m.w * 0.5, m.h * 0.5, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "rgba(236,210,160,0.55)"; c.lineWidth = 1.2;
      c.beginPath(); c.ellipse(0, 0.6, m.w * 0.5, m.h * 0.5, 0, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();
    } else if (m.kind === "puddle") {
      // a puddle: a muddy rim, brown water, the sky glinting on it
      c.fillStyle = "rgba(96,70,40,0.55)";
      c.beginPath(); c.ellipse(0, 0, m.w * 0.55, m.h * 0.6, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "rgba(124,140,140,0.85)";
      c.beginPath(); c.ellipse(0, 0, m.w * 0.46, m.h * 0.45, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "rgba(200,220,228,0.6)";
      const sh = Math.sin(t * 0.0012 + m.seed) * m.w * 0.08;
      c.beginPath(); c.ellipse(-m.w * 0.12 + sh, -m.h * 0.12, m.w * 0.18, m.h * 0.1, 0, 0, Math.PI * 2); c.fill();
    } else {
      // pebbles
      for (let k = 0; k < 4; k++) {
        c.fillStyle = k % 2 ? "#9a9488" : "#b8b0a0";
        c.beginPath(); c.ellipse((hash2(m.seed, k) - 0.5) * 12, (hash2(k, m.seed) - 0.5) * 6, 1.8 + hash2(k * 3, m.seed) * 1.8, 1.3 + hash2(m.seed * 3, k), 0, 0, Math.PI * 2); c.fill();
      }
    }
    c.restore();
  }
  c.lineCap = "butt"; c.lineJoin = "miter";
}

function bakeGround(): HTMLCanvasElement {
  const w = Math.ceil(WORLD_W / GROUND_TEXEL);
  const h = Math.ceil(WORLD_H / GROUND_TEXEL);
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const g = cv.getContext("2d");
  if (!g) return cv;
  // grass: two layers of soft patches, drying into steppe eastward
  const img = g.createImageData(w, h);
  const lushDark = [86, 140, 54], lushLight = [132, 180, 84];
  const dryDark = [150, 156, 86], dryLight = [192, 186, 112];
  for (let ty = 0; ty < h; ty++) {
    for (let tx = 0; tx < w; tx++) {
      const wx = tx * GROUND_TEXEL;
      const wy = ty * GROUND_TEXEL;
      const n = 0.55 * valueNoise(wx / 280, wy / 280, 3) + 0.3 * valueNoise(wx / 95, wy / 95, 17) + 0.15 * valueNoise(wx / 28, wy / 28, 41);
      const dry = clamp((wx - VILLAGE_W + 160 + (valueNoise(wx / 220, wy / 220, 59) - 0.5) * 300) / 620, 0, 1);
      const i = (ty * w + tx) * 4;
      for (let k = 0; k < 3; k++) {
        const lush = (lushDark[k] ?? 0) + ((lushLight[k] ?? 0) - (lushDark[k] ?? 0)) * n;
        const st = (dryDark[k] ?? 0) + ((dryLight[k] ?? 0) - (dryDark[k] ?? 0)) * n;
        img.data[i + k] = lush + (st - lush) * dry;
      }
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  // the paths, on their own layer first so their shape can be read back
  // (no grass blades are drawn on dirt)
  const pc = document.createElement("canvas");
  pc.width = w; pc.height = h;
  const p = pc.getContext("2d");
  if (!p) return cv;
  p.scale(1 / GROUND_TEXEL, 1 / GROUND_TEXEL);
  // a worn, half-bare fringe, then the trodden earth itself
  p.fillStyle = p.strokeStyle = "rgba(168,140,84,0.45)";
  paintPaths(p, 18);
  p.fillStyle = p.strokeStyle = "rgb(190,150,92)";
  paintPaths(p, 0);
  // dust lighter in the middle of the maidan, where everyone stands
  const mg = p.createRadialGradient(840, 600, 20, 840, 600, 200);
  mg.addColorStop(0, "rgba(214,180,120,0.7)");
  mg.addColorStop(1, "rgba(222,192,132,0)");
  p.fillStyle = mg;
  p.globalCompositeOperation = "source-atop"; // only where it is already dirt
  p.fillRect(600, 400, 480, 360);
  p.globalCompositeOperation = "source-over";
  const pd = p.getImageData(0, 0, w, h).data;
  dirtMask = new Uint8ClampedArray(w * h);
  for (let i = 0; i < w * h; i++) dirtMask[i] = pd[i * 4 + 3] ?? 0;
  maskW = w;
  g.drawImage(pc, 0, 0);
  return cv;
}

// How bare the earth is at a world point (0 grass … 255 trodden dirt).
function dirtAt(x: number, y: number): number {
  if (!dirtMask) return 0;
  return dirtMask[Math.floor(y / GROUND_TEXEL) * maskW + Math.floor(x / GROUND_TEXEL)] ?? 0;
}

export function drawGround(c: CanvasRenderingContext2D, camX: number, camY: number, vw: number, vh: number, t: number) {
  if (!groundTex) groundTex = bakeGround();
  c.imageSmoothingEnabled = true;
  c.drawImage(groundTex, camX / GROUND_TEXEL, camY / GROUND_TEXEL, vw / GROUND_TEXEL, vh / GROUND_TEXEL, 0, 0, vw, vh);

  // grass detail at full resolution: tufts of blades, clover, wildflowers,
  // scattered on a jittered grid so no tiling shows; none on the dirt
  const cell = 30;
  const x0 = Math.max(0, Math.floor(camX / cell) - 1);
  const y0 = Math.max(0, Math.floor(camY / cell) - 1);
  const x1 = Math.min(Math.ceil(WORLD_W / cell), Math.ceil((camX + vw) / cell) + 1);
  const y1 = Math.min(Math.ceil(WORLD_H / cell), Math.ceil((camY + vh) / cell) + 1);
  c.lineCap = "round";
  for (let gy = y0; gy < y1; gy++) {
    for (let gx = x0; gx < x1; gx++) {
      const h = hash2(gx, gy);
      const wx = gx * cell + hash2(gx * 3, gy * 7) * cell;
      const wy = gy * cell + hash2(gx * 5, gy * 11) * cell;
      if (dirtAt(wx, wy) > 90) continue;
      const steppe = wx > VILLAGE_W - 100;
      const px = wx - camX;
      const py = wy - camY;
      // a tuft: 3–5 blades fanned from one root, light ones in front
      const blades = 3 + Math.floor(h * 3);
      for (let b = 0; b < blades; b++) {
        const a = (b / (blades - 1) - 0.5) * 1.1;
        const len = (steppe ? 8 : 6) + hash2(b, gx + gy) * 5;
        const sway = Math.sin(t * 0.0016 + wx * 0.05 + wy * 0.03) * 1.6;
        c.strokeStyle = b % 2 ? (steppe ? "rgba(120,110,50,0.55)" : "rgba(52,96,30,0.5)") : (steppe ? "rgba(200,190,120,0.55)" : "rgba(150,196,96,0.55)");
        c.lineWidth = 1.3;
        c.beginPath();
        c.moveTo(px + b - blades / 2, py);
        c.quadraticCurveTo(px + Math.sin(a) * len * 0.5, py - len * 0.6, px + Math.sin(a) * len + sway, py - len);
        c.stroke();
      }
      // clover in the lush grass
      if (!steppe && h > 0.62 && h < 0.7) {
        c.fillStyle = "rgba(70,124,46,0.7)";
        for (let k = 0; k < 3; k++) {
          c.beginPath(); c.arc(px + 8 + Math.cos(k * 2.1) * 2.4, py - 6 + Math.sin(k * 2.1) * 2.4, 2, 0, Math.PI * 2); c.fill();
        }
      }
      // wildflowers
      if (h > 0.9) {
        const fx = px + 6 + hash2(gx, gy * 13) * 14;
        const fy = py - 4 + hash2(gx * 11, gy) * 10;
        const cols = steppe ? ["#e8d8a0", "#c9a0d8", "#f2c14e"] : ["#f5efdc", "#f2c14e", "#d96a5a", "#b48ad6"];
        const col = cols[Math.floor(hash2(gy, gx) * cols.length)] ?? "#fff";
        c.strokeStyle = "#4c7a2e";
        c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(fx, fy + 4); c.lineTo(fx, fy); c.stroke();
        c.fillStyle = col;
        c.beginPath(); c.arc(fx, fy - 1, 2.4, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#e8a020";
        c.fillRect(fx - 0.7, fy - 1.7, 1.4, 1.4);
      }
    }
  }
  c.lineCap = "butt";

  // puddles, potholes, mud, pebbles and cart ruts on the roads
  drawRoadMarks(c, camX, camY, vw, vh, t);

  // The Lysa Hora trail — a narrower spur leaving the clearing eastward
  // into the steppe. Two cairns mark the edge where the khutir lets go
  // of you.
  // (it is baked into the ground with the other paths: paintPaths)
  for (const cy of [404, 502]) {
    const cx = VILLAGE_W - 26 - camX;
    const cyy = cy - camY;
    c.fillStyle = "#8d8b85";
    c.beginPath(); c.ellipse(cx, cyy + 8, 11, 5, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(cx, cyy + 2, 8, 4.4, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(cx, cyy - 3, 5, 3.4, 0, 0, Math.PI * 2); c.fill();
  }


  // Pond
  const px = POND.x - camX;
  const py = POND.y - camY;
  c.fillStyle = "#3f7089";
  c.beginPath(); c.ellipse(px, py, POND.rx + 8, POND.ry + 7, 0, 0, Math.PI * 2); c.fill();
  const pg = c.createRadialGradient(px - 30, py - 18, 12, px, py, POND.rx);
  pg.addColorStop(0, "#8fc3d4");
  pg.addColorStop(1, "#55879e");
  c.fillStyle = pg;
  c.beginPath(); c.ellipse(px, py, POND.rx, POND.ry, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(255,255,255,0.5)";
  c.lineWidth = 1.6;
  for (let i = 0; i < 5; i++) {
    const sx = px - 90 + hash2(i, 31) * 180;
    const sy = py - 40 + hash2(i, 47) * 80;
    const off = Math.sin(t * 0.002 + i * 1.7) * 4;
    c.beginPath();
    c.moveTo(sx + off, sy);
    c.lineTo(sx + off + 14, sy);
    c.stroke();
  }
  // lily pads
  c.fillStyle = "#4d8a3d";
  for (const [lx, ly] of [[-52, 16], [38, -26], [84, 22]] as const) {
    c.beginPath(); c.ellipse(px + lx, py + ly, 13, 8, 0.4, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = "#e88bb0";
  c.beginPath(); c.arc(px + 38, py - 28, 3.4, 0, Math.PI * 2); c.fill();
  // reeds + cattails at the near edge
  for (let i = 0; i < 9; i++) {
    const rx = px - 130 + i * 30 + hash2(i, 91) * 10;
    const ry = py + POND.ry - 6 + hash2(i, 93) * 12;
    c.strokeStyle = "#3e6b2a";
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx - 3, ry - 26); c.stroke();
    c.fillStyle = "#6e4a26";
    c.fillRect(rx - 4.4, ry - 30, 3, 11);
  }

  // Viy's hollow — a blighted circle at the north-east forest edge where
  // nothing green grows and the grass will not take.
  {
    const hx = 1420 - camX;
    const hy = 262 - camY;
    const hg = c.createRadialGradient(hx, hy, 12, hx, hy, 148);
    hg.addColorStop(0, "rgba(52,46,58,0.88)");
    hg.addColorStop(0.62, "rgba(66,60,66,0.6)");
    hg.addColorStop(1, "rgba(66,60,66,0)");
    c.fillStyle = hg;
    c.fillRect(hx - 148, hy - 148, 296, 296);
    // cracked dead earth
    c.strokeStyle = "rgba(24,20,30,0.55)";
    c.lineWidth = 1.4;
    for (let i = 0; i < 9; i++) {
      const a = hash2(i, 511) * Math.PI * 2;
      const r0 = 16 + hash2(i, 513) * 22;
      const r1 = r0 + 26 + hash2(i, 517) * 42;
      c.beginPath();
      c.moveTo(hx + Math.cos(a) * r0, hy + Math.sin(a) * r0 * 0.72);
      c.lineTo(hx + Math.cos(a + 0.24) * r1, hy + Math.sin(a + 0.24) * r1 * 0.72);
      c.stroke();
    }
    // a ring of old standing stones, leaning like bad teeth
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.4;
      const sx = hx + Math.cos(a) * 128;
      const sy = hy + Math.sin(a) * 88;
      const sh = 20 + hash2(i, 521) * 13;
      c.fillStyle = "#6d6a72";
      rr(c, sx - 5.5, sy - sh, 11, sh, 3); c.fill();
      c.fillStyle = "rgba(255,255,255,0.14)";
      rr(c, sx - 5.5, sy - sh, 4.4, sh, 2); c.fill();
    }
    // dead snags — bare branches over the hollow
    c.strokeStyle = "#3c3630";
    c.lineWidth = 3;
    for (const [dx, dy] of [[-104, -52], [112, -38]] as const) {
      c.beginPath(); c.moveTo(hx + dx, hy + dy + 26); c.lineTo(hx + dx + 3, hy + dy - 14); c.stroke();
      c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(hx + dx + 3, hy + dy - 6); c.lineTo(hx + dx - 11, hy + dy - 18); c.stroke();
      c.beginPath(); c.moveTo(hx + dx + 3, hy + dy - 10); c.lineTo(hx + dx + 15, hy + dy - 22); c.stroke();
      c.lineWidth = 3;
    }
  }

  // The old millstone — all that is left of a mill that stood south of the
  // clearing before anyone can remember. Devils are fond of old mills.
  {
    const mx = 545 - camX;
    const my = 1082 - camY;
    c.fillStyle = "rgba(30,50,20,0.25)";
    c.beginPath(); c.ellipse(mx, my + 6, 44, 12, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#8d8b85";
    c.beginPath(); c.ellipse(mx, my, 34, 13, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#74726c";
    c.beginPath(); c.ellipse(mx, my - 1, 27, 9.6, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#4c4438";
    c.beginPath(); c.ellipse(mx, my - 1, 6, 2.6, 0, 0, Math.PI * 2); c.fill();
    // a fallen, rotting mill beam beside it
    c.fillStyle = "#6e4a26";
    rr(c, mx - 96, my + 12, 56, 9, 3); c.fill();
    c.fillStyle = "#5d3d20";
    rr(c, mx - 96, my + 17, 56, 4, 2); c.fill();
  }

  // Vesna's horod (garden) soil rows
  c.fillStyle = "#6e4c2a";
  rr(c, GARDEN.x - camX, GARDEN.y - camY, GARDEN.w, GARDEN.h, 6); c.fill();
  c.fillStyle = "#7d5831";
  for (let r = 0; r < 4; r++) c.fillRect(GARDEN.x + 8 - camX, GARDEN.y + 12 + r * 22 - camY, GARDEN.w - 16, 9);
  for (let r = 0; r < 4; r++) {
    for (let s = 0; s < 7; s++) {
      const sx = GARDEN.x + 18 + s * 19 - camX;
      const sy = GARDEN.y + 16 + r * 22 - camY;
      c.fillStyle = "#5da244";
      c.beginPath(); c.arc(sx, sy, 4.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#79bd58";
      c.beginPath(); c.arc(sx - 1.4, sy - 1.4, 2.4, 0, Math.PI * 2); c.fill();
    }
  }
}

export function drawTree(c: CanvasRenderingContext2D, tr: { x: number; y: number; kind: TreeKind; s: number }, camX: number, camY: number, t: number) {
  const x = tr.x - camX;
  const y = tr.y - camY;
  const s = tr.s;
  const sway = Math.sin(t * 0.0012 + tr.x * 0.11) * 1.4;
  c.fillStyle = "rgba(30,50,20,0.25)";
  c.beginPath(); c.ellipse(x, y + 4, 26 * s, 8 * s, 0, 0, Math.PI * 2); c.fill();
  if (tr.kind === "cherry") {
    drawCherry(c, x, y, s, t);
    return;
  }
  if (tr.kind === "willow") {
    drawWillow(c, x, y, s, t);
    return;
  }
  if (tr.kind === "pine") {
    c.fillStyle = "#6e4a26";
    c.fillRect(x - 3.4 * s, y - 20 * s, 6.8 * s, 22 * s);
    const layers: Array<[number, number, string]> = [
      [46, 30, "#2c5a30"], [38, 52, "#336636"], [29, 74, "#3d733c"],
    ];
    layers.forEach(([w, top, col], i) => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(x + sway * (i + 1) * 0.4, y - (top + 26) * s);
      c.lineTo(x - w * s, y - top * s + 14 * s);
      c.lineTo(x + w * s, y - top * s + 14 * s);
      c.closePath(); c.fill();
      c.fillStyle = "rgba(120,180,90,0.35)";
      c.beginPath();
      c.moveTo(x + sway * (i + 1) * 0.4, y - (top + 26) * s);
      c.lineTo(x + 2 * s, y - top * s + 12 * s);
      c.lineTo(x + w * 0.55 * s, y - top * s + 13 * s);
      c.closePath(); c.fill();
    });
  } else if (tr.kind === "birch") {
    c.fillStyle = "#e9e4d6";
    c.fillRect(x - 3 * s, y - 34 * s, 6 * s, 36 * s);
    c.fillStyle = "#3a3a3a";
    c.fillRect(x - 3 * s, y - 26 * s, 6 * s, 2.2);
    c.fillRect(x - 1 * s, y - 15 * s, 4 * s, 2);
    const blobs: Array<[number, number, number, string]> = [
      [0, -62, 27, "#79ac49"], [-20, -48, 19, "#6da344"], [20, -50, 20, "#86ba57"], [0, -44, 22, "#71a846"],
    ];
    for (const [bx, by, br, col] of blobs) {
      c.fillStyle = col;
      c.beginPath(); c.arc(x + bx * s + sway, y + by * s, br * s, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = "rgba(190,225,140,0.5)";
    c.beginPath(); c.arc(x - 8 * s + sway, y - 62 * s, 9 * s, 0, Math.PI * 2); c.fill();
  } else {
    c.fillStyle = "#5d3d20";
    c.fillRect(x - 5 * s, y - 30 * s, 10 * s, 32 * s);
    c.fillRect(x - 14 * s, y - 44 * s, 6 * s, 18 * s);
    c.fillRect(x + 9 * s, y - 46 * s, 6 * s, 20 * s);
    const blobs: Array<[number, number, number, string]> = [
      [0, -78, 34, "#4f7d33"], [-30, -58, 25, "#598a39"], [30, -60, 26, "#679c3e"],
      [-12, -44, 24, "#5f943a"], [16, -42, 22, "#74ab4b"], [0, -96, 22, "#5f943a"],
    ];
    for (const [bx, by, br, col] of blobs) {
      c.fillStyle = col;
      c.beginPath(); c.arc(x + bx * s + sway, y + by * s, br * s, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = "rgba(200,230,150,0.4)";
    c.beginPath(); c.arc(x - 14 * s + sway, y - 82 * s, 11 * s, 0, Math.PI * 2); c.fill();
    // apples
    c.fillStyle = "#c8452c";
    for (const [ax, ay] of [[-22, -52], [14, -70], [26, -44]] as const) {
      c.beginPath(); c.arc(x + ax * s + sway, y + ay * s, 2.6 * s, 0, Math.PI * 2); c.fill();
    }
  }
}

export function drawHouse(c: CanvasRenderingContext2D, h: Rect & { kind: string }, camX: number, camY: number, t: number) {
  const x = h.x - camX;
  const y = h.y - camY;
  c.fillStyle = "rgba(30,50,20,0.28)";
  c.beginPath(); c.ellipse(x + h.w / 2, y + h.h + 8, h.w * 0.58, 13, 0, 0, Math.PI * 2); c.fill();

  if (h.kind === "forge") {
    // open smithy: posts, roof, anvil, barrel, fire glow
    c.fillStyle = "#7a4a24";
    c.fillRect(x + 8, y + 26, 9, h.h - 26);
    c.fillRect(x + h.w - 17, y + 26, 9, h.h - 26);
    c.fillStyle = "#8a5a33";
    c.beginPath();
    c.moveTo(x - 8, y + 30); c.lineTo(x + h.w / 2, y - 16); c.lineTo(x + h.w + 8, y + 30);
    c.closePath(); c.fill();
    c.strokeStyle = "rgba(90,58,26,0.6)";
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.moveTo(x + 6 + i * (h.w / 5), y + 26 - i * 1.5);
      c.lineTo(x + 20 + i * (h.w / 5), y - 8);
      c.stroke();
    }
    const fg = c.createRadialGradient(x + h.w * 0.68, y + h.h - 14, 4, x + h.w * 0.68, y + h.h - 14, 46);
    fg.addColorStop(0, "rgba(255,170,60,0.75)");
    fg.addColorStop(1, "rgba(255,170,60,0)");
    c.fillStyle = fg;
    c.fillRect(x + h.w * 0.68 - 46, y + h.h - 60, 92, 92);
    c.fillStyle = "#3c3c40";
    rr(c, x + h.w * 0.6, y + h.h - 26, 34, 12, 3); c.fill();
    c.fillRect(x + h.w * 0.6 + 12, y + h.h - 14, 10, 10);
    c.fillStyle = "#8a5a33";
    rr(c, x + 22, y + h.h - 34, 26, 32, 5); c.fill();
    c.strokeStyle = "#5d3d20";
    c.beginPath(); c.moveTo(x + 22, y + h.h - 22); c.lineTo(x + 48, y + h.h - 22); c.stroke();
    const fl = 5 + Math.sin(t * 0.02) * 1.6;
    c.fillStyle = "#ff9c2e";
    c.beginPath(); c.ellipse(x + h.w * 0.68 + 8, y + h.h - 30, 5, fl + 4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#ffd76a";
    c.beginPath(); c.ellipse(x + h.w * 0.68 + 8, y + h.h - 28, 2.6, fl, 0, 0, Math.PI * 2); c.fill();
    return;
  }

  drawKhata(c, x, y, h.w, h.h, t, h.x);
}

export function drawWell(c: CanvasRenderingContext2D, camX: number, camY: number, t = 0) {
  drawCraneWell(c, WELL.x - camX, WELL.y - camY, t);
}

export function drawFire(c: CanvasRenderingContext2D, camX: number, camY: number, t: number) {
  const x = FIRE.x - camX + 34;
  const y = FIRE.y - camY + 26;
  const glow = c.createRadialGradient(x, y - 6, 6, x, y - 6, 90);
  glow.addColorStop(0, "rgba(255,166,60,0.4)");
  glow.addColorStop(1, "rgba(255,166,60,0)");
  c.fillStyle = glow;
  c.fillRect(x - 90, y - 96, 180, 180);
  c.fillStyle = "#8d8b85";
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    c.beginPath(); c.ellipse(x + Math.cos(a) * 24, y + Math.sin(a) * 9, 5.4, 4, a, 0, Math.PI * 2); c.fill();
  }
  c.strokeStyle = "#6e4525";
  c.lineWidth = 5;
  c.beginPath(); c.moveTo(x - 15, y + 4); c.lineTo(x + 13, y - 3); c.stroke();
  c.beginPath(); c.moveTo(x + 15, y + 4); c.lineTo(x - 13, y - 3); c.stroke();
  const fl = Math.sin(t * 0.016) * 2.4 + Math.sin(t * 0.043) * 1.4;
  c.fillStyle = "#ff8b2e";
  c.beginPath(); c.ellipse(x, y - 10, 8.6, 13 + fl, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#ffb02e";
  c.beginPath(); c.ellipse(x, y - 8, 5.6, 9 + fl * 0.7, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#ffe89a";
  c.beginPath(); c.ellipse(x, y - 5, 2.8, 5 + fl * 0.4, 0, 0, Math.PI * 2); c.fill();
  // log benches
  c.fillStyle = "#7a4a24";
  rr(c, x - 74, y - 4, 34, 9, 4); c.fill();
  rr(c, x + 40, y - 4, 34, 9, 4); c.fill();
  // The cooking pot: an iron tripod and a hanging kettle over the flames —
  // karas soup has a home now (Cooking skill, 1 fish + 1 herb).
  c.strokeStyle = "#3c3630";
  c.lineWidth = 2.4;
  c.beginPath(); c.moveTo(x - 17, y + 7); c.lineTo(x, y - 27); c.stroke();
  c.beginPath(); c.moveTo(x + 17, y + 7); c.lineTo(x, y - 27); c.stroke();
  c.beginPath(); c.moveTo(x, y - 27); c.lineTo(x, y - 19); c.stroke();
  c.fillStyle = "#2e2a26";
  c.beginPath(); c.ellipse(x, y - 13, 11.5, 8, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#6e7a3a";
  c.beginPath(); c.ellipse(x, y - 16.4, 9.4, 3.6, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#f28c1e";
  c.beginPath(); c.arc(x - 3.4, y - 16.8, 1.7, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#f5f2e6";
  c.beginPath(); c.arc(x + 3.8, y - 16.2, 1.5, 0, Math.PI * 2); c.fill();
  // a wisp of soup steam
  const st = (t * 0.0004) % 1;
  c.fillStyle = `rgba(240,238,232,${0.4 * (1 - st)})`;
  c.beginPath(); c.arc(x + Math.sin(st * 5) * 2.4, y - 22 - st * 15, 2.4 + st * 3.4, 0, Math.PI * 2); c.fill();
}

// Vesna's alchemy bench: a drying rack hung with herb bundles over a
// little copper cauldron, in Vesna's yard by her khata (BREW_SPOT).
export function drawBrewBench(c: CanvasRenderingContext2D, camX: number, camY: number, t: number) {
  const x = BREW_SPOT.x - camX;
  const y = BREW_SPOT.y - camY;
  c.fillStyle = "rgba(30,50,20,0.25)";
  c.beginPath(); c.ellipse(x, y + 8, 34, 8, 0, 0, Math.PI * 2); c.fill();
  // rack posts + crossbar
  c.fillStyle = "#6e4525";
  c.fillRect(x - 26, y - 34, 4.6, 42);
  c.fillRect(x + 22, y - 34, 4.6, 42);
  c.fillRect(x - 29, y - 36, 58, 4.4);
  // hanging herb bundles — a colour for every kind on the znakharka's shelf
  const bundleCols = ["#3f7a2e", "#8a9678", "#f28c1e", "#f2c416", "#e8e2cc"];
  bundleCols.forEach((col, i) => {
    const bx = x - 21 + i * 11;
    const sway = Math.sin(t * 0.002 + i * 1.7) * 1.2;
    c.strokeStyle = "#c9b18a";
    c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(bx, y - 32); c.lineTo(bx + sway, y - 24); c.stroke();
    c.fillStyle = col;
    c.beginPath(); c.ellipse(bx + sway, y - 19, 3.6, 5.6, sway * 0.06, 0, Math.PI * 2); c.fill();
  });
  // the cauldron, gently at work
  c.fillStyle = "#4a3b2c";
  c.beginPath(); c.ellipse(x + 1, y + 3, 12.5, 8.6, 0, 0, Math.PI * 2); c.fill();
  const bub = 0.5 + Math.sin(t * 0.006) * 0.3;
  c.fillStyle = `rgba(140,220,150,${bub})`;
  c.beginPath(); c.ellipse(x + 1, y - 0.6, 9.6, 3.8, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "rgba(210,250,215,0.9)";
  const bph = (t * 0.05) % 9;
  c.beginPath(); c.arc(x - 3 + (bph % 3) * 3, y - 3 - bph * 0.7, 1.4, 0, Math.PI * 2); c.fill();
  // a stoppered bottle, ready for a tonic
  c.fillStyle = "#7fb069";
  rr(c, x + 19, y - 3, 5.4, 9, 2); c.fill();
  c.fillStyle = "#c9a86a";
  c.fillRect(x + 20.4, y - 6, 2.6, 3);
}

// The crust of bread waiting by the campfire for a kind traveller.
export function drawCrust(c: CanvasRenderingContext2D, camX: number, camY: number, t: number) {
  const x = CRUST_SPOT.x - camX;
  const y = CRUST_SPOT.y - camY;
  const pulse = 0.5 + Math.sin(t * 0.004) * 0.22;
  const g = c.createRadialGradient(x, y, 2, x, y, 24);
  g.addColorStop(0, `rgba(255,214,130,${pulse * 0.55})`);
  g.addColorStop(1, "rgba(255,214,130,0)");
  c.fillStyle = g;
  c.fillRect(x - 24, y - 24, 48, 48);
  // a folded cloth, and the crust on it
  c.fillStyle = "#efe3c8";
  c.beginPath(); c.ellipse(x, y + 3, 13, 5, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#c98d45";
  c.beginPath(); c.ellipse(x, y, 8.6, 5.6, -0.15, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#a86f2e";
  c.beginPath(); c.ellipse(x - 1, y - 1.4, 6.4, 3.8, -0.15, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#8a5a24";
  c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(x - 4, y - 2.6); c.lineTo(x + 2, y - 1.2); c.stroke();
  // a pinch of salt beside it — the Domovyk is particular
  c.fillStyle = "#ffffff";
  c.beginPath(); c.arc(x + 9, y + 2, 1.7, 0, Math.PI * 2); c.fill();
}

// Fishing: a rod leaning over the shore, the line, and the bobber. While a
// fish bites, the bobber dunks and rings spread — that is the moment to
// reel in. Drawn in world space (world coords minus camera).
export function drawFishing(
  c: CanvasRenderingContext2D,
  px: number, py: number,
  camX: number, camY: number, t: number,
  phase: "wait" | "bite",
) {
  const sx = px - camX;
  const sy = py - camY;
  const bx = BOBBER.x - camX;
  const bobDip = phase === "bite" ? Math.abs(Math.sin(t * 0.03)) * 3.4 : Math.sin(t * 0.003) * 1.1;
  const by = BOBBER.y - camY + bobDip;
  // the rod, angled from the player's hands over the water
  c.strokeStyle = "#7a5a30";
  c.lineWidth = 2.4;
  c.beginPath(); c.moveTo(sx + 6, sy - 22); c.lineTo(sx + 44, sy - 44); c.stroke();
  // the line, sagging a little
  c.strokeStyle = "rgba(240,240,230,0.75)";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(sx + 44, sy - 44);
  c.quadraticCurveTo((sx + 44 + bx) / 2, Math.min(sy - 44, by) - 12 + Math.abs(bx - sx) * 0.04, bx, by - 3);
  c.stroke();
  // ripples around the bobber — frantic while biting
  const rings = phase === "bite" ? 3 : 2;
  for (let i = 0; i < rings; i++) {
    const rp = ((t * (phase === "bite" ? 0.06 : 0.02) + i * 7) % 14);
    c.strokeStyle = `rgba(230,245,250,${0.5 * (1 - rp / 14)})`;
    c.lineWidth = 1.2;
    c.beginPath(); c.ellipse(bx, by + 2, 4 + rp, (4 + rp) * 0.36, 0, 0, Math.PI * 2); c.stroke();
  }
  // the bobber: red over white, the village way
  c.fillStyle = "#f3e9d2";
  c.beginPath(); c.ellipse(bx, by, 3.4, 4.4, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#c23b2a";
  c.beginPath(); c.ellipse(bx, by - 1.8, 3.4, 2.6, 0, Math.PI, 2 * Math.PI); c.fill();
  if (phase === "bite") {
    // splashes
    c.fillStyle = "rgba(225,242,250,0.9)";
    for (let i = 0; i < 4; i++) {
      const a = hash2(i, Math.floor(t / 90)) * Math.PI * 2;
      c.fillRect(bx + Math.cos(a) * 6, by - 3 - hash2(i, 3) * 4, 1.7, 1.7);
    }
  }
}

export function drawFence(c: CanvasRenderingContext2D, f: Rect, camX: number, camY: number) {
  drawTyn(c, f.x, f.y, f.w, f.h, camX, camY);
}

export function drawHerbPatch(c: CanvasRenderingContext2D, sx: number, sy: number, camX: number, camY: number, t: number, available: boolean, herb: HerbDef) {
  const x = sx - camX;
  const y = sy - camY;
  if (!available) {
    c.fillStyle = "#548636";
    for (let i = 0; i < 4; i++) {
      c.beginPath(); c.arc(x - 8 + i * 5.4, y + (i % 2) * 3, 3.4, 0, Math.PI * 2); c.fill();
    }
    return;
  }
  const pulse = 0.55 + Math.sin(t * 0.004 + sx) * 0.25;
  const g = c.createRadialGradient(x, y, 2, x, y, 30);
  g.addColorStop(0, `rgba(${herb.glow},${pulse * 0.5})`);
  g.addColorStop(1, `rgba(${herb.glow},0)`);
  c.fillStyle = g;
  c.fillRect(x - 30, y - 30, 60, 60);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + hash2(sx, i) * 0.6;
    const lx = x + Math.cos(a) * 10;
    const ly = y + Math.sin(a) * 5;
    c.strokeStyle = herb.leaf;
    c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(lx, ly + 5); c.quadraticCurveTo(lx + 2, ly, lx + 3, ly - 6); c.stroke();
    c.fillStyle = herb.flower;
    c.beginPath(); c.arc(lx + 3, ly - 7, 3, 0, Math.PI * 2); c.fill();
    c.fillStyle = herb.flowerCore;
    c.beginPath(); c.arc(lx + 3, ly - 7, 1.3, 0, Math.PI * 2); c.fill();
  }
  const sp = (t * 0.03 + sx) % 14;
  c.fillStyle = "rgba(255,240,180,0.9)";
  c.fillRect(x + Math.sin(t * 0.003 + sx) * 12, y - 10 - sp, 1.8, 1.8);
}

// Every human figure, the kobzar included, is drawn in the storybook style
// (render/people.ts); this keeps the old call shape.
export function drawPerson(c: CanvasRenderingContext2D, x: number, y: number, opts: FolkOpts) {
  drawFolk(c, x, y, opts);
}

export function drawChicken(c: CanvasRenderingContext2D, x: number, y: number, peck: number, camX: number, camY: number) {
  const sx = x - camX;
  const sy = y - camY;
  c.fillStyle = "rgba(30,50,20,0.22)";
  c.beginPath(); c.ellipse(sx, sy + 3, 8, 2.8, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#f5efdc";
  c.beginPath(); c.ellipse(sx, sy - 3, 8.4, 6, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(sx - 7, sy - 8, 4.4, 2.6, -0.7, 0, Math.PI * 2); c.fill();
  const hy = sy - 8 + peck * 4;
  c.beginPath(); c.arc(sx + 7.4, hy, 3.8, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#d94f3d";
  c.beginPath(); c.arc(sx + 7.4, hy - 3.8, 1.8, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#e8a020";
  c.beginPath();
  c.moveTo(sx + 10.8, hy); c.lineTo(sx + 13.6, hy + 1.4); c.lineTo(sx + 10.8, hy + 2.6);
  c.closePath(); c.fill();
  c.fillStyle = "#2e2018";
  c.fillRect(sx + 7.8, hy - 1, 1.4, 1.4);
}