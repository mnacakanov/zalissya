import { HOUSE_RECTS } from "../data/houses";
import { LYSA_ORIGIN, LYSA_SUMMIT, LYSA_WORLD } from "../data/lysa";
const LYSA_TRAILHEAD = LYSA_WORLD.trailhead;
import { LYSA_H, LYSA_W, VILLAGE_W } from "../world/areas";
import { drawCraneWell, drawKhata, drawTyn } from "./khutir";
import { BOBBER, BREW_SPOT, CRUST_SPOT, type HerbDef } from "../data/items";
import { FIRE, FIRE_SEAT, GARDEN, POND, pondEdge, pondShore, type TreeKind, WELL } from "../data/village";
import { drawLand } from "./land";
import { BOLOTO_PATH, PROKIP_PATH } from "../data/land";
import { rr } from "./shapes";
import { drawFolk, type FolkOpts } from "./people";
import { drawTreeSprite } from "./trees";
import { WORLD_H, WORLD_W } from "../world/areas";
import { hash2, type Rect } from "../world/geometry";
import { clamp } from "../world/geometry";


// --- The ground, painted in tiles -----------------------------------------------
// After Drova's ground (an owner reference): roads are read by their
// texture, not their outline. Dark, mottled brown earth with damp patches
// and grit; grass in deep, uneven greens with lighter sunny patches; and
// the border between them torn at several scales, grass reaching into the
// road in clumps and bare earth biting into the grass.
// The ground is painted per texel (GROUND_TEXEL world px) into 256 px tiles,
// baked lazily as the camera reaches them (a few per frame, so walking
// never stalls), then stretched onto the screen. Where the roads lie comes
// from a coarse mask of the worn paths (paintPaths), sampled smoothly and
// broken up by noise at the edge. The crisp detail (blades, flowers, ruts,
// puddles) is drawn on top every frame.
const GROUND_TEXEL = 2;
const TILE = 256;
const MASK_TEXEL = 8;
let roadMask: Float32Array | null = null;
let maskW = 0;
let maskH = 0;
const tiles = new Map<number, HTMLCanvasElement>();

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}
// a fast integer hash in [0, 1)
function ih(x: number, y: number, s: number): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 982451653)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function valueNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const a = ih(ix, iy, seed);
  const b = ih(ix + 1, iy, seed);
  const c = ih(ix, iy + 1, seed);
  const d = ih(ix + 1, iy + 1, seed);
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
    { pts: linePts([[840, 300], [840, WORLD_H + 40]], 6), w: 96, seed: 2, ruts: true },
    // the steppe roads: the trail to Lysa Hora and the chumak road south
    { pts: bezierPts([VILLAGE_W - 80, 456], [2000, 330], [2350, 760], [LYSA_TRAILHEAD.x, LYSA_TRAILHEAD.y], 6), w: 34, seed: 3, ruts: false },
    { pts: [...bezierPts([VILLAGE_W - 60, 646], [1950, 660], [2250, 900], [2250, 1300], 6), ...linePts([[2250, 1300], [2250, WORLD_H + 40]], 6)], w: 50, seed: 4, ruts: true },
    { pts: linePts([[1500, 646], [1500, 452], [VILLAGE_W, 452]], 6), w: 54, seed: 5, ruts: false },
    { pts: bezierPts([2005, 1214], [2080, 1236], [2160, 1230], [2244, 1170], 6), w: 30, seed: 6, ruts: false },
    // the trail up Lysa Hora, switchbacking from the trailhead to the summit
    { pts: [
      ...bezierPts([LYSA_ORIGIN.x - 10, LYSA_ORIGIN.y + 470], [LYSA_ORIGIN.x + 140, LYSA_ORIGIN.y + 510], [LYSA_ORIGIN.x + 300, LYSA_ORIGIN.y + 500], [LYSA_ORIGIN.x + 430, LYSA_ORIGIN.y + 452], 6),
      ...bezierPts([LYSA_ORIGIN.x + 430, LYSA_ORIGIN.y + 452], [LYSA_ORIGIN.x + 490, LYSA_ORIGIN.y + 426], [LYSA_ORIGIN.x + 510, LYSA_ORIGIN.y + 404], [LYSA_ORIGIN.x + LYSA_SUMMIT.x - 120, LYSA_ORIGIN.y + LYSA_SUMMIT.y], 6),
    ], w: 36, seed: 7, ruts: false },
  ];
  // footpaths worn from each door to the nearest road
  let seed = 10;
  for (const [hid, h] of Object.entries(HOUSE_RECTS)) {
    // the tunnel has no door, so no path leads to its ridge
    if (hid === "lazna") continue;
    const dx = h.x + h.w / 2;
    const dy = h.y + h.h;
    const ty = dy < 600 ? 620 : dy + 34;
    r.push({ pts: bezierPts([dx, dy - 4], [dx, (dy + ty) / 2], [dx + (dx < 840 ? 6 : -6), (dy + ty) / 2 + 6], [dx + (dx < 840 ? 12 : -12), ty], 5), w: 20, seed: seed++, ruts: false });
  }
  // the footpath through the forest to the boloto
  {
    const [a, b, c2, d] = BOLOTO_PATH;
    if (a && b && c2 && d) r.push({ pts: bezierPts(a, b, c2, d, 6), w: 22, seed: seed++, ruts: false });
  }
  // the pustka's path down to the maidan past the well, and the forge's yard
  r.push({ pts: bezierPts([1189, 312], [1160, 380], [1080, 430], [1000, 470], 5), w: 18, seed: seed++, ruts: false });
  r.push({ pts: linePts([[328, 556], [328, 616]], 5), w: 40, seed: seed++, ruts: false });
  // the path nobody keeps: off the chumak road past the bridge, east through
  // the forest to Did Prokip's door (data/houses.ts HOUSE_RECTS.prokip)
  r.push({ pts: PROKIP_PATH.flatMap(([a = [], b = [], c2 = [], d = []]) => bezierPts(a, b, c2, d, 5)), w: 20, seed: seed++, ruts: false });
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
    for (const [col, w, dy] of [["rgba(48,32,16,0.5)", 3.4, 0], ["rgba(150,122,84,0.32)", 1.2, 2.2]] as const) {
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
      c.fillStyle = "rgba(56,40,22,0.42)";
      c.beginPath();
      for (let k = 0; k <= 12; k++) {
        const ang = (k / 12) * Math.PI * 2;
        const wob = 0.75 + 0.4 * hash2(m.seed, k);
        const px = Math.cos(ang) * m.w * 0.5 * wob;
        const py = Math.sin(ang) * m.h * 0.5 * wob;
        if (k === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.closePath(); c.fill();
      c.fillStyle = "rgba(40,28,14,0.35)";
      c.beginPath(); c.ellipse(m.w * 0.1, 0, m.w * 0.22, m.h * 0.22, 0, 0, Math.PI * 2); c.fill();
    } else if (m.kind === "hole") {
      // a pothole: a dark hollow with the sunlit far lip
      c.fillStyle = "rgba(36,24,12,0.6)";
      c.beginPath(); c.ellipse(0, 0, m.w * 0.5, m.h * 0.5, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "rgba(164,136,96,0.5)"; c.lineWidth = 1.2;
      c.beginPath(); c.ellipse(0, 0.6, m.w * 0.5, m.h * 0.5, 0, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();
    } else if (m.kind === "puddle") {
      // a puddle: a muddy rim, brown water, the sky glinting on it
      c.fillStyle = "rgba(56,40,22,0.6)";
      c.beginPath(); c.ellipse(0, 0, m.w * 0.55, m.h * 0.6, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "rgba(84,96,98,0.9)";
      c.beginPath(); c.ellipse(0, 0, m.w * 0.46, m.h * 0.45, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "rgba(180,200,210,0.5)";
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

// The coarse mask of where the earth is worn (0 grass … 1 road).
function buildRoadMask(): void {
  maskW = Math.ceil(WORLD_W / MASK_TEXEL);
  maskH = Math.ceil(WORLD_H / MASK_TEXEL);
  const cv = document.createElement("canvas");
  cv.width = maskW; cv.height = maskH;
  const g = cv.getContext("2d");
  roadMask = new Float32Array(maskW * maskH);
  if (!g) return;
  g.scale(1 / MASK_TEXEL, 1 / MASK_TEXEL);
  g.fillStyle = "#fff";
  paintPaths(g, 0);
  const d = g.getImageData(0, 0, maskW, maskH).data;
  for (let i = 0; i < maskW * maskH; i++) roadMask[i] = (d[i * 4 + 3] ?? 0) / 255;
}
function maskAt(x: number, y: number): number {
  if (!roadMask) return 0;
  const fx = x / MASK_TEXEL - 0.5;
  const fy = y / MASK_TEXEL - 0.5;
  const ix = clamp(Math.floor(fx), 0, maskW - 2);
  const iy = clamp(Math.floor(fy), 0, maskH - 2);
  const tx = clamp(fx - ix, 0, 1);
  const ty = clamp(fy - iy, 0, 1);
  const i = iy * maskW + ix;
  const a = roadMask[i] ?? 0, b = roadMask[i + 1] ?? 0, c = roadMask[i + maskW] ?? 0, d = roadMask[i + maskW + 1] ?? 0;
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
}
// How worn the ground is at a point, edge noise included (0 grass … 1 road).
function wearAt(x: number, y: number): number {
  const m = maskAt(x, y);
  if (m <= 0.02) return 0;
  const e = m + (valueNoise(x / 22, y / 22, 83) - 0.5) * 0.55 + (valueNoise(x / 7, y / 7, 89) - 0.5) * 0.22;
  return clamp((e - 0.4) / 0.14, 0, 1);
}

// palettes
const GRASS_D = [52, 88, 36], GRASS_L = [104, 142, 58], GRASS_SUN = [148, 158, 72];
const STEPPE_D = [128, 128, 70], STEPPE_L = [178, 168, 100];
const DIRT_D = [92, 66, 42], DIRT_L = [134, 102, 66], DIRT_WET = [66, 48, 32], GRIT = [168, 150, 120];

// --- Lysa Hora's rock --------------------------------------------------------------
// The Bald Mountain rises out of the dry steppe in the same ground as
// everything else: grey-violet rock, darker on the slopes, worn pale on the
// bald crown round the summit, its foot torn into the grass by noise rather
// than cut by an oval. mountainAt() says how much rock is at a point.
const MTN = {
  cx: LYSA_ORIGIN.x + LYSA_W / 2, cy: LYSA_ORIGIN.y + LYSA_H / 2,
  rx: LYSA_W / 2 + 40, ry: LYSA_H / 2 + 30,
};
export function mountainAt(x: number, y: number): number {
  const dx = (x - MTN.cx) / MTN.rx;
  const dy = (y - MTN.cy) / MTN.ry;
  const d = dx * dx + dy * dy;
  if (d > 1.6) return 0;
  const e = 1 - d + (valueNoise(x / 70, y / 70, 201) - 0.5) * 0.4 + (valueNoise(x / 18, y / 18, 203) - 0.5) * 0.14;
  return clamp(e / 0.22, 0, 1);
}
const ROCK_D = [62, 60, 74], ROCK_L = [112, 108, 120], CROWN = [150, 144, 140], LICHEN = [138, 148, 108];

function bakeTile(tx: number, ty: number): HTMLCanvasElement {
  const n = TILE / GROUND_TEXEL;
  const cv = document.createElement("canvas");
  cv.width = n; cv.height = n;
  const g = cv.getContext("2d");
  if (!g) return cv;
  const img = g.createImageData(n, n);
  const px = img.data;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const wx = tx * TILE + i * GROUND_TEXEL;
      const wy = ty * TILE + j * GROUND_TEXEL;
      // grass: big soft patches, smaller clumps, fine grain; sunny spots
      const g1 = valueNoise(wx / 320, wy / 320, 3);
      const g2 = valueNoise(wx / 70, wy / 70, 17);
      const g3 = valueNoise(wx / 12, wy / 12, 41);
      const gv = 0.5 * g1 + 0.3 * g2 + 0.2 * g3;
      const sun = Math.max(0, (g2 - 0.62) / 0.38) * (0.6 + 0.4 * g1);
      const dry = clamp((wx - VILLAGE_W + 160 + (g1 - 0.5) * 300) / 620, 0, 1);
      const grain = ih(wx, wy, 7);
      const k = (grain > 0.93 ? -0.25 : grain < 0.05 ? 0.2 : 0);
      // the ground under foot
      const w = wearAt(wx, wy);
      const mk = mountainAt(wx, wy);
      const o = (j * n + i) * 4;
      for (let ch = 0; ch < 3; ch++) {
        const lush = (GRASS_D[ch] ?? 0) + ((GRASS_L[ch] ?? 0) - (GRASS_D[ch] ?? 0)) * (gv + k);
        const sunny = lush + ((GRASS_SUN[ch] ?? 0) - lush) * sun * 0.6;
        const st = (STEPPE_D[ch] ?? 0) + ((STEPPE_L[ch] ?? 0) - (STEPPE_D[ch] ?? 0)) * (gv + k);
        let col = sunny + (st - sunny) * dry;
        if (mk > 0) {
          // the rock: mottled, with lichen, paler toward the bald crown
          const r1 = valueNoise(wx / 54, wy / 54, 211);
          const r2 = valueNoise(wx / 11, wy / 11, 213);
          const rv = 0.6 * r1 + 0.4 * r2;
          let rock = (ROCK_D[ch] ?? 0) + ((ROCK_L[ch] ?? 0) - (ROCK_D[ch] ?? 0)) * rv;
          const crown = Math.max(0, 1 - Math.hypot(wx - LYSA_WORLD.summit.x, (wy - LYSA_WORLD.summit.y) * 1.3) / 330);
          rock += ((CROWN[ch] ?? 0) - rock) * crown * 0.55;
          const lich = Math.max(0, (valueNoise(wx / 26, wy / 26, 217) - 0.72) / 0.28);
          rock += ((LICHEN[ch] ?? 0) - rock) * lich * 0.6;
          const gr = ih(wx >> 1, wy >> 1, 219);
          if (gr > 0.97) rock *= 1.25; else if (gr < 0.04) rock *= 0.72;
          col = col + (rock - col) * mk;
        }
        if (w > 0) {
          const d1 = valueNoise(wx / 46, wy / 46, 61);
          const d2 = valueNoise(wx / 9, wy / 9, 67);
          const dv = 0.6 * d1 + 0.4 * d2;
          let dirt = (DIRT_D[ch] ?? 0) + ((DIRT_L[ch] ?? 0) - (DIRT_D[ch] ?? 0)) * dv;
          // damp hollows, darker
          const wet = Math.max(0, (valueNoise(wx / 110, wy / 110, 71) - 0.66) / 0.34);
          dirt += ((DIRT_WET[ch] ?? 0) - dirt) * wet * 0.8;
          // grit and little stones
          const gr = ih(wx >> 1, wy >> 1, 13);
          if (gr > 0.975) dirt = GRIT[ch] ?? dirt;
          else if (gr < 0.03) dirt *= 0.8;
          // the very edge of the grass casts a little shade on the earth
          const shade = w < 0.6 ? 0.82 + 0.3 * w : 1;
          col = col + (dirt * shade - col) * w;
        }
        px[o + ch] = col;
      }
      px[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return cv;
}

// Grass blades stay off the road (the edge is decided per point, the same
// way the tiles were painted).
function dirtAt(x: number, y: number): number {
  return wearAt(x, y) * 255;
}

// --- Grass detail and crops, baked ------------------------------------------------
// Tufts of blades, clover, wildflowers and the crops in the fields were
// thousands of strokes a frame — the slowdown by the river and the fields.
// They are painted once per 256 px tile, at the screen's pixel density, into
// transparent tiles laid over the ground; the most recent DETAIL_KEEP stay.
const DETAIL_KEEP = 40;
const detailTiles = new Map<number, HTMLCanvasElement>();

function bakeDetail(tx: number, ty: number, px: number): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = cv.height = TILE * px;
  const g = cv.getContext("2d");
  if (!g) return cv;
  g.scale(px, px);
  drawGrassDetail(g, tx * TILE, ty * TILE, TILE, TILE);
  drawRockDetail(g, tx * TILE, ty * TILE, TILE, TILE);
  drawLand(g, tx * TILE, ty * TILE, TILE, TILE, 0);
  detailTiles.set(ty * 1000 + tx, cv);
  return cv;
}

// Cracks, scree and the odd boulder on the mountain's rock (baked).
function drawRockDetail(c: CanvasRenderingContext2D, camX: number, camY: number, vw: number, vh: number): void {
  if (camX > MTN.cx + MTN.rx * 1.3 || camX + vw < MTN.cx - MTN.rx * 1.3 || camY > MTN.cy + MTN.ry * 1.3 || camY + vh < MTN.cy - MTN.ry * 1.3) return;
  const cell = 26;
  c.lineCap = "round";
  for (let gy = Math.floor(camY / cell) - 1; gy * cell < camY + vh + cell; gy++) {
    for (let gx = Math.floor(camX / cell) - 1; gx * cell < camX + vw + cell; gx++) {
      const wx = gx * cell + hash2(gx, gy * 5) * cell;
      const wy = gy * cell + hash2(gx * 7, gy) * cell;
      const mk = mountainAt(wx, wy);
      if (mk < 0.6 || dirtAt(wx, wy) > 120) continue;
      const h = hash2(gx * 3, gy * 11);
      const x = wx - camX;
      const y = wy - camY;
      if (h < 0.22) {
        // a crack, forking
        c.strokeStyle = "rgba(24,22,32,0.5)"; c.lineWidth = 1.1;
        const a = hash2(gx, gy) * Math.PI;
        const l = 8 + h * 30;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * 0.6);
        c.lineTo(x + Math.cos(a + 0.6) * l * 1.4, y + Math.sin(a + 0.6) * l * 0.8); c.stroke();
      } else if (h < 0.4) {
        // scree: a scatter of pale chips with dark undersides
        for (let k = 0; k < 4; k++) {
          const sx = x + (hash2(gx + k, gy) - 0.5) * 16;
          const sy = y + (hash2(gx, gy + k) - 0.5) * 9;
          c.fillStyle = "rgba(20,18,28,0.45)";
          c.beginPath(); c.ellipse(sx + 0.6, sy + 0.8, 2.2, 1.4, 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = "#9a96a2";
          c.beginPath(); c.ellipse(sx, sy, 2, 1.3, 0, 0, Math.PI * 2); c.fill();
        }
      } else if (h > 0.96) {
        // a boulder, outlined like everything else
        const r = 6 + hash2(gy, gx) * 6;
        c.fillStyle = "rgba(14,12,20,0.4)";
        c.beginPath(); c.ellipse(x + 2, y + r * 0.5, r * 1.1, r * 0.4, 0, 0, Math.PI * 2); c.fill();
        const g = c.createLinearGradient(x - r, 0, x + r, 0);
        g.addColorStop(0, "#8e8a98"); g.addColorStop(1, "#4a4656");
        c.fillStyle = g;
        c.beginPath(); c.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = "rgba(24,20,30,0.75)"; c.lineWidth = 0.9; c.stroke();
      }
    }
  }
  c.lineCap = "butt";
}

function drawGrassDetail(c: CanvasRenderingContext2D, camX: number, camY: number, vw: number, vh: number): void {
  const t = 0;
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
      if (dirtAt(wx, wy) > 90 || mountainAt(wx, wy) > 0.5) continue;
      const steppe = wx > VILLAGE_W - 100;
      const px = wx - camX;
      const py = wy - camY;
      // a tuft: 3–5 blades fanned from one root, light ones in front
      const blades = 3 + Math.floor(h * 3);
      for (let b = 0; b < blades; b++) {
        const a = (b / (blades - 1) - 0.5) * 1.1;
        const len = (steppe ? 8 : 6) + hash2(b, gx + gy) * 5;
        const sway = Math.sin(t * 0.0016 + wx * 0.05 + wy * 0.03) * 1.6;
        c.strokeStyle = b % 2 ? (steppe ? "rgba(120,110,50,0.55)" : "rgba(34,64,20,0.55)") : (steppe ? "rgba(200,190,120,0.55)" : "rgba(122,164,72,0.5)");
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

}

export function drawGround(c: CanvasRenderingContext2D, camX: number, camY: number, vw: number, vh: number, t: number) {
  if (!roadMask) buildRoadMask();
  const tx0 = Math.max(0, Math.floor(camX / TILE));
  const ty0 = Math.max(0, Math.floor(camY / TILE));
  const tx1 = Math.min(Math.ceil(WORLD_W / TILE) - 1, Math.floor((camX + vw) / TILE));
  const ty1 = Math.min(Math.ceil(WORLD_H / TILE) - 1, Math.floor((camY + vh) / TILE));
  // on the first frame paint everything in view; after that, a few tiles a
  // frame as the camera moves (a plain green stands in until they are done)
  let budget = tiles.size === 0 ? 999 : 2;
  c.imageSmoothingEnabled = true;
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const key = ty * 1000 + tx;
      let tile = tiles.get(key);
      if (!tile && budget > 0) { tile = bakeTile(tx, ty); tiles.set(key, tile); budget--; }
      if (tile) c.drawImage(tile, tx * TILE - camX, ty * TILE - camY, TILE + 0.5, TILE + 0.5);
      else { c.fillStyle = "#5e8a3c"; c.fillRect(tx * TILE - camX, ty * TILE - camY, TILE + 0.5, TILE + 0.5); }
    }
  }
  // tiles just beyond the edge of the screen, ahead of the walk
  for (let ty = ty0 - 1; ty <= ty1 + 1 && budget > 0; ty++) {
    for (let tx = tx0 - 1; tx <= tx1 + 1 && budget > 0; tx++) {
      if (tx < 0 || ty < 0 || tx * TILE >= WORLD_W || ty * TILE >= WORLD_H) continue;
      const key = ty * 1000 + tx;
      if (!tiles.has(key)) { tiles.set(key, bakeTile(tx, ty)); budget--; }
    }
  }

  // the grass, flowers and crops, baked into tiles of their own that lie
  // over the ground (an LRU of DETAIL_KEEP), then the road marks crisp
  const detailPx = Math.min(2, Math.max(1, Math.round(window.devicePixelRatio || 1)));
  let detailBudget = detailTiles.size === 0 ? 999 : 2;
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const key = ty * 1000 + tx;
      let tile = detailTiles.get(key);
      if (!tile && detailBudget > 0) { tile = bakeDetail(tx, ty, detailPx); detailBudget--; }
      if (tile) {
        // keep the most recently seen at the end of the LRU
        detailTiles.delete(key); detailTiles.set(key, tile);
        c.drawImage(tile, tx * TILE - camX, ty * TILE - camY, TILE, TILE);
      }
    }
  }
  // and one tile ahead of the walk, if this frame had none to paint
  if (detailBudget === 2) {
    outer: for (let ty = ty0 - 1; ty <= ty1 + 1; ty++) {
      for (let tx = tx0 - 1; tx <= tx1 + 1; tx++) {
        if (tx < 0 || ty < 0 || tx * TILE >= WORLD_W || ty * TILE >= WORLD_H) continue;
        if (!detailTiles.has(ty * 1000 + tx)) { bakeDetail(tx, ty, detailPx); break outer; }
      }
    }
  }
  while (detailTiles.size > DETAIL_KEEP) {
    const oldest = detailTiles.keys().next().value;
    if (oldest === undefined) break;
    detailTiles.delete(oldest);
  }

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


  // Pond: its shore wanders (data/village.ts pondR), a band of wet mud
  // and sedge round it, shallows paler along the edge, the deep middle
  // dark; reeds stand in clumps along the bank, but not on the west
  // shore where people fish nor by the bench on the north shore.
  if (POND.x + POND.rx * 1.3 > camX && POND.x - POND.rx * 1.3 < camX + vw && POND.y + POND.ry * 1.3 + 40 > camY && POND.y - POND.ry * 1.3 < camY + vh) {
    const px = POND.x - camX;
    const py = POND.y - camY;
    const loop = (pts: Array<{ x: number; y: number }>) => {
      c.beginPath();
      pts.forEach((q, i) => (i ? c.lineTo(q.x - camX, q.y - camY) : c.moveTo(q.x - camX, q.y - camY)));
      c.closePath();
    };
    c.lineJoin = "round";
    c.fillStyle = "rgba(96,104,58,0.55)"; loop(pondShore(14)); c.fill();
    c.fillStyle = "#5e6a3a"; loop(pondShore(5)); c.fill();
    const pg = c.createRadialGradient(px - 30, py - 18, 12, px, py, POND.rx * 1.1);
    pg.addColorStop(0, "#4f8aa2");
    pg.addColorStop(1, "#3a6a80");
    c.fillStyle = pg;
    loop(pondShore(0)); c.fill();
    c.strokeStyle = "rgba(140,190,204,0.45)"; c.lineWidth = 12; loop(pondShore(-6)); c.stroke();
    c.strokeStyle = "rgba(220,238,240,0.5)"; c.lineWidth = 2; loop(pondShore(-1)); c.stroke();
    c.strokeStyle = "rgba(255,255,255,0.5)";
    c.lineWidth = 1.6;
    for (let i = 0; i < 7; i++) {
      const sx = px - 100 + hash2(i, 31) * 200;
      const sy = py - 44 + hash2(i, 47) * 88;
      const off = Math.sin(t * 0.002 + i * 1.7) * 4;
      c.beginPath();
      c.moveTo(sx + off, sy);
      c.lineTo(sx + off + 14, sy);
      c.stroke();
    }
    // lily pads
    for (const [lx, ly, r] of [[-52, 16, 13], [38, -26, 12], [84, 22, 11], [96, 8, 8], [-20, 44, 9], [118, -12, 10]] as const) {
      c.fillStyle = "#4d8a3d";
      c.beginPath(); c.ellipse(px + lx, py + ly, r, r * 0.6, 0.4, 0.3, Math.PI * 2); c.lineTo(px + lx, py + ly); c.fill();
    }
    c.fillStyle = "#f0c8d8";
    c.beginPath(); c.arc(px + 38, py - 28, 3.4, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(px + 96, py + 6, 2.6, 0, Math.PI * 2); c.fill();
    // reeds and cattails in clumps round the bank
    c.lineWidth = 1.8;
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + hash2(i, 95) * 0.15;
      // a ≈ π is the west shore (the fishing place); -π/2…-π/3 the bench
      if (Math.abs(a - Math.PI) < 0.45 || (a > Math.PI * 1.35 && a < Math.PI * 1.62)) continue;
      if (hash2(i, 97) < 0.3) continue;
      const e = pondEdge(POND.x + Math.cos(a) * POND.rx, POND.y + Math.sin(a) * POND.ry, -3);
      for (let j = 0; j < 4; j++) {
        const rx = e.x + (j - 1.5) * 4 - camX;
        const ry = e.y + (j % 2) * 3 - camY;
        const sway = Math.sin(t * 0.0018 + (e.x + j * 4) * 0.07) * 1.5;
        const hgt = 20 + hash2(i, j) * 12;
        c.strokeStyle = "#3e6b2a";
        c.beginPath(); c.moveTo(rx, ry); c.quadraticCurveTo(rx + sway * 0.4, ry - hgt / 2, rx + sway - 2, ry - hgt); c.stroke();
        if (j === 1 || j === 2 && hash2(i, 99) > 0.5) {
          c.fillStyle = "#6e4a26";
          c.beginPath(); c.ellipse(rx + sway - 2, ry - hgt - 3, 1.8, 5, 0, 0, Math.PI * 2); c.fill();
        }
      }
    }
    c.lineJoin = "miter";
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

// --- Tree shadows ---------------------------------------------------------------
// After Drova: trees throw big, soft, lumpy shadows that give the ground
// depth. They are a pass of their own on the ground (under everything that
// stands), and they follow the sun: long to the west in the morning, short
// at noon, long to the east in the evening, faint under the moon.
const CANOPY: Record<TreeKind, { r: number; h: number }> = {
  oak: { r: 60, h: 72 }, apple: { r: 36, h: 50 }, birch: { r: 42, h: 56 }, pine: { r: 44, h: 62 }, cherry: { r: 32, h: 42 }, willow: { r: 40, h: 54 },
};
// one soft dark blob, stamped for every shadow
let blobCv: HTMLCanvasElement | null = null;
function shadowBlob(): HTMLCanvasElement {
  if (blobCv) return blobCv;
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const g = cv.getContext("2d");
  if (g) {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(16,28,10,1)");
    gr.addColorStop(0.6, "rgba(16,28,10,0.7)");
    gr.addColorStop(1, "rgba(16,28,10,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
  }
  blobCv = cv;
  return cv;
}

export function drawTreeShadows(
  c: CanvasRenderingContext2D, trees: ReadonlyArray<{ x: number; y: number; kind: TreeKind; s: number }>,
  camX: number, camY: number, vw: number, vh: number, minute: number, dark: number,
): void {
  // the sun: -1 at 06:00 (in the east), 0 at 13:00, +1 at 20:00 (west)
  const sunK = clamp((minute - 13 * 60) / (7 * 60), -1, 1);
  const day = Math.max(0, 1 - dark / 0.62);
  const strength = 0.12 + 0.26 * day;
  for (const tr of trees) {
    const cp = CANOPY[tr.kind];
    const R = cp.r * tr.s;
    const Hc = cp.h * tr.s;
    // a little south-east always (the light of the scene comes from the
    // upper left), then swung by the sun
    const len = 0.35 + Math.abs(sunK) * 0.75;
    const dx = Hc * (0.25 + sunK * 0.8) * day;
    const dy = Hc * 0.16;
    const cx = tr.x + dx - camX;
    const cy = tr.y + dy - camY;
    if (cx + R * 2 < 0 || cx - R * 2 > vw || cy + R < 0 || cy - R > vh) continue;
    // three overlapping blobs make the shadow lumpy, like a real crown
    // (each one a stamp of the same soft blob — no gradient per frame)
    const blob = shadowBlob();
    c.globalAlpha = strength;
    for (let k = 0; k < 3; k++) {
      const ox = (hash2(tr.x, k) - 0.5) * R * 0.6;
      const oy = (hash2(k, tr.y) - 0.5) * R * 0.25;
      const rx = R * (0.75 + 0.2 * hash2(tr.x + k, tr.y)) * (1 + len * 0.3);
      const ry = R * 0.42;
      c.drawImage(blob, cx + ox - rx, cy + oy - ry, rx * 2, ry * 2);
    }
    // the dark where the trunk meets the ground
    c.globalAlpha = 0.5 * (0.5 + 0.5 * day);
    c.drawImage(blob, tr.x - camX - 18 * tr.s, tr.y + 2 - camY - 7 * tr.s, 36 * tr.s, 14 * tr.s);
    c.globalAlpha = 1;
  }
}

export function drawTree(c: CanvasRenderingContext2D, tr: { x: number; y: number; kind: TreeKind; s: number }, camX: number, camY: number, t: number) {
  // (its shadow is cast on the ground beforehand: drawTreeShadows; the tree
  // itself is drawn in the storybook hand: render/trees.ts)
  drawTreeSprite(c, tr, tr.x - camX, tr.y - camY, t);
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

// The fire on the maidan: crossed logs in a ring of stones, the two log
// benches either side. No pot: this fire is for gathering and songs (the
// cooking is done at Vesna's kabytsia, drawKabytsia).
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
  // log benches: the otaman's and Vesna's either side, and the kobzar's
  // on the near side, facing the khutir (FIRE_SEAT)
  c.fillStyle = "#7a4a24";
  rr(c, x - 74, y - 4, 34, 9, 4); c.fill();
  rr(c, x + 40, y - 4, 34, 9, 4); c.fill();
  {
    const sx = FIRE_SEAT.x - camX;
    const sy = FIRE_SEAT.y - camY + 5;
    c.fillStyle = "rgba(30,50,20,0.28)";
    c.beginPath(); c.ellipse(sx, sy + 7, 24, 4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#7a4a24";
    rr(c, sx - 21, sy - 1, 42, 10, 5); c.fill();
    c.fillStyle = "#a8743c";
    c.beginPath(); c.ellipse(sx - 21, sy + 4, 3, 5, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(sx + 21, sy + 4, 3, 5, 0, 0, Math.PI * 2); c.fill();
  }
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
  // a speckled hen, painted and outlined like everyone else
  const sx = x - camX;
  const sy = y - camY;
  c.fillStyle = "rgba(30,50,20,0.25)";
  c.beginPath(); c.ellipse(sx, sy + 3, 8.4, 2.8, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#d9a020"; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(sx - 1.6, sy - 1); c.lineTo(sx - 2, sy + 3); c.moveTo(sx + 1.6, sy - 1); c.lineTo(sx + 2, sy + 3); c.stroke();
  const g = c.createLinearGradient(sx - 9, 0, sx + 9, 0);
  g.addColorStop(0, "#fbf6ea"); g.addColorStop(0.6, "#f0e8d6"); g.addColorStop(1, "#c8bea8");
  c.fillStyle = g;
  c.strokeStyle = "rgba(34,22,14,0.8)"; c.lineWidth = 0.8;
  c.beginPath(); c.ellipse(sx - 7, sy - 8, 4.4, 2.6, -0.7, 0, Math.PI * 2); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(sx, sy - 3, 8.4, 6, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = "rgba(140,120,90,0.5)";
  for (const [dx, dy] of [[-3, -4], [1, -2], [3, -5], [-1, -1]] as const) { c.beginPath(); c.arc(sx + dx, sy + dy, 0.8, 0, Math.PI * 2); c.fill(); }
  const hy = sy - 8 + peck * 4;
  c.fillStyle = "#f8f2e4";
  c.beginPath(); c.arc(sx + 7.4, hy, 3.8, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = "#d94f3d";
  c.beginPath(); c.arc(sx + 7, hy - 3.8, 1.6, 0, Math.PI * 2); c.arc(sx + 8.6, hy - 3.6, 1.4, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(sx + 9.6, hy + 2.6, 1, 1.4, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#e8a020";
  c.beginPath(); c.moveTo(sx + 10.8, hy - 0.4); c.lineTo(sx + 13.6, hy + 0.8); c.lineTo(sx + 10.8, hy + 2); c.closePath(); c.fill();
  c.fillStyle = "#2e2018";
  c.fillRect(sx + 7.8, hy - 1, 1.4, 1.4);
}
// The kabytsia: a low clay summer hearth, whitewashed and painted with a
// red-and-ochre zigzag, its mouth to the south with embers in it, and a
// clay pot (horshchyk) of soup on top, steaming.
// `wx` is the hearth's WORLD x: the steam and the embers take their phase from
// it, never from the screen x, which is hugely negative when the hearth is far
// off screen (on Lysa Hora). A negative phase once made the steam radius
// negative, and the throw aborted the whole y-sorted draw list every frame.
export function drawKabytsia(c: CanvasRenderingContext2D, x: number, y: number, t: number, wx: number) {
  const INK = "rgba(34,22,14,0.85)";
  c.fillStyle = "rgba(30,50,20,0.28)";
  c.beginPath(); c.ellipse(x, y + 4, 24, 7, 0, 0, Math.PI * 2); c.fill();
  // the clay body: a squat horseshoe
  const g = c.createLinearGradient(x - 18, 0, x + 18, 0);
  g.addColorStop(0, "#f4ecdc"); g.addColorStop(0.6, "#e6dcc6"); g.addColorStop(1, "#bfb39a");
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x - 18, y + 2); c.lineTo(x - 18, y - 16); c.quadraticCurveTo(x - 18, y - 24, x - 10, y - 24);
  c.lineTo(x + 10, y - 24); c.quadraticCurveTo(x + 18, y - 24, x + 18, y - 16); c.lineTo(x + 18, y + 2); c.closePath();
  c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  // the painted band
  c.strokeStyle = "#b0302a"; c.lineWidth = 1.4;
  c.beginPath();
  for (let i = 0; i <= 8; i++) { const zx = x - 16 + i * 4; const zy = y - 18 + (i % 2) * 3; if (i) c.lineTo(zx, zy); else c.moveTo(zx, zy); }
  c.stroke();
  // the mouth, embers glowing in it
  c.fillStyle = "#2a1c12";
  c.beginPath(); c.moveTo(x - 7, y + 2); c.lineTo(x - 7, y - 6); c.quadraticCurveTo(x, y - 13, x + 7, y - 6); c.lineTo(x + 7, y + 2); c.closePath(); c.fill();
  const fl = 0.6 + Math.sin(t * 0.011 + wx) * 0.2 + Math.sin(t * 0.029) * 0.1;
  c.fillStyle = `rgba(255,140,40,${fl})`;
  c.beginPath(); c.ellipse(x, y - 1, 5, 2.6, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = `rgba(255,220,120,${fl * 0.8})`;
  c.beginPath(); c.ellipse(x, y - 1.5, 2.4, 1.4, 0, 0, Math.PI * 2); c.fill();
  // the clay pot on top
  const pg = c.createLinearGradient(x - 9, 0, x + 9, 0);
  pg.addColorStop(0, "#b8743a"); pg.addColorStop(1, "#7a4420");
  c.fillStyle = pg;
  c.beginPath(); c.ellipse(x, y - 30, 9, 8, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
  c.fillStyle = "#5a3418";
  c.beginPath(); c.ellipse(x, y - 37, 6, 2, 0, 0, Math.PI * 2); c.fill();
  // steam, its phase from the world (x) so it never slides
  for (let i = 0; i < 2; i++) {
    const st = (t * 0.0004 + i * 0.5 + wx * 0.001) % 1;
    c.fillStyle = `rgba(240,238,232,${0.4 * (1 - st)})`;
    c.beginPath(); c.arc(x + Math.sin(st * 5 + i) * 3, y - 42 - st * 18, 2.4 + st * 3.6, 0, Math.PI * 2); c.fill();
  }
}
