import { type TreeKind } from "../data/village";
import { hash2 } from "../world/geometry";
import { darken } from "./people";

// --- Trees, storybook style -------------------------------------------------------
// Drawn in the hand of the people and the khaty (render/people.ts): one
// light from the upper left painting each crown as a single mass, a soft
// ink outline round the whole crown, leaf clusters picked out in darker
// strokes, and trunks with bark and a root flare.
//   oak     — a gnarled trunk, roots, a broad lobed crown of deep green
//   apple   — the khaty's orchards: a round crown, red apples
//   birch   — a slim white trunk with black marks, a light drooping crown
//   pine    — the spruce of the forests: ragged tiers, blue-green
//   cherry  — «садок вишневий коло хати»: small, dense, red berries
//   willow  — leaning over the water, long weeping fronds
// x, y are screen coordinates of the trunk's foot; tr.x / tr.y (world) seed
// the shapes and the sway, so they never shift as the camera moves.

const INK = "rgba(24,32,14,0.7)";

type Lobe = { x: number; y: number; r: number };

// A crown made of lobes, shaded as one mass, outlined as one shape.
function crown(c: CanvasRenderingContext2D, lobes: Lobe[], light: string, dark: string, cx: number, cy: number, size: number): void {
  // a filler at the heart, so no ink shows through between the lobes
  lobes = [...lobes, { x: cx, y: cy + size * 0.12, r: size * 0.62 }];
  // the ink outline: every lobe a little bigger, in ink, first
  c.fillStyle = INK;
  for (const l of lobes) { c.beginPath(); c.arc(l.x, l.y, l.r + 1.1, 0, Math.PI * 2); c.fill(); }
  // one light over the whole crown
  const g = c.createRadialGradient(cx - size * 0.35, cy - size * 0.4, size * 0.1, cx, cy, size * 1.1);
  g.addColorStop(0, light);
  g.addColorStop(0.55, darken(light, 0.82));
  g.addColorStop(1, dark);
  c.fillStyle = g;
  for (const l of lobes) { c.beginPath(); c.arc(l.x, l.y, l.r, 0, Math.PI * 2); c.fill(); }
}

// leaf clusters: little dark crescents, and sunlit dabs on the lit side
function leaves(c: CanvasRenderingContext2D, lobes: Lobe[], seed: number, dark: string, lit: string): void {
  c.strokeStyle = dark; c.lineWidth = 1;
  lobes.forEach((l, i) => {
    for (let k = 0; k < 3; k++) {
      const a = hash2(seed + i, k) * Math.PI * 2;
      const d = l.r * 0.55 * hash2(k, seed + i);
      const px = l.x + Math.cos(a) * d;
      const py = l.y + Math.sin(a) * d;
      c.beginPath(); c.arc(px, py, l.r * 0.28, 0.2 * Math.PI, 0.9 * Math.PI); c.stroke();
    }
  });
  c.fillStyle = lit;
  lobes.forEach((l, i) => {
    if (hash2(seed, i) < 0.5) return;
    c.beginPath(); c.ellipse(l.x - l.r * 0.35, l.y - l.r * 0.4, l.r * 0.32, l.r * 0.2, -0.5, 0, Math.PI * 2); c.fill();
  });
}

// a trunk: tapered, with a root flare and bark lines, lit from the left
function trunk(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string, lean = 0, roots = true): void {
  const g = c.createLinearGradient(x - w, 0, x + w, 0);
  g.addColorStop(0, col); g.addColorStop(0.45, col); g.addColorStop(1, darken(col, 0.6));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x - w * (roots ? 1.5 : 1), y);
  c.quadraticCurveTo(x - w * 0.9, y - h * 0.15, x - w * 0.55 + lean, y - h);
  c.lineTo(x + w * 0.55 + lean, y - h);
  c.quadraticCurveTo(x + w * 0.9, y - h * 0.15, x + w * (roots ? 1.5 : 1), y);
  c.closePath(); c.fill();
  c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
  c.strokeStyle = "rgba(30,20,10,0.35)"; c.lineWidth = 0.8;
  for (let k = -1; k <= 1; k++) {
    c.beginPath(); c.moveTo(x + k * w * 0.35, y - 2); c.quadraticCurveTo(x + k * w * 0.45 + lean * 0.4, y - h * 0.5, x + k * w * 0.25 + lean, y - h * 0.9); c.stroke();
  }
}

export function drawTreeStorybook(
  c: CanvasRenderingContext2D, tr: { x: number; y: number; kind: TreeKind; s: number }, x: number, y: number, t: number,
  still = false,
): void {
  const s = tr.s;
  const seed = Math.round(tr.x * 7 + tr.y * 13);
  const sway = still ? 0 : Math.sin(t * 0.0012 + tr.x * 0.11) * 1.4;
  const R = (k: number) => hash2(seed, k);
  switch (tr.kind) {
    case "oak": {
      trunk(c, x, y, 7 * s, 46 * s, "#5d4228", 0);
      // two crooked limbs reaching into the crown
      c.strokeStyle = "#4e3620"; c.lineWidth = 4 * s; c.lineCap = "round";
      c.beginPath(); c.moveTo(x - 2 * s, y - 36 * s); c.quadraticCurveTo(x - 16 * s, y - 46 * s, x - 24 * s, y - 58 * s); c.stroke();
      c.beginPath(); c.moveTo(x + 2 * s, y - 40 * s); c.quadraticCurveTo(x + 18 * s, y - 50 * s, x + 26 * s, y - 62 * s); c.stroke();
      c.lineCap = "butt";
      const cx = x + sway;
      const cy = y - 78 * s;
      const lobes: Lobe[] = [];
      for (let k = 0; k < 11; k++) {
        const a = (k / 11) * Math.PI * 2 + R(k) * 0.4;
        const rr = (k % 2 ? 34 : 28) * s;
        lobes.push({ x: cx + Math.cos(a) * rr * 1.25, y: cy + Math.sin(a) * rr * 0.8, r: (19 + R(k + 20) * 7) * s });
      }
      lobes.push({ x: cx, y: cy, r: 30 * s }, { x: cx - 10 * s, y: cy - 16 * s, r: 22 * s }, { x: cx + 12 * s, y: cy - 14 * s, r: 20 * s });
      crown(c, lobes, "#6a9a3e", "#24461c", cx, cy, 52 * s);
      leaves(c, lobes, seed, "rgba(24,52,18,0.55)", "rgba(170,206,110,0.45)");
      break;
    }
    case "apple": {
      trunk(c, x, y, 5 * s, 32 * s, "#6a4a2c", 0);
      const cx = x + sway;
      const cy = y - 52 * s;
      const lobes: Lobe[] = [];
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + R(k) * 0.3;
        lobes.push({ x: cx + Math.cos(a) * 20 * s, y: cy + Math.sin(a) * 15 * s, r: (15 + R(k + 9) * 4) * s });
      }
      lobes.push({ x: cx, y: cy - 4 * s, r: 20 * s });
      crown(c, lobes, "#86b452", "#2e5a24", cx, cy, 36 * s);
      leaves(c, lobes, seed, "rgba(30,62,22,0.5)", "rgba(196,226,130,0.45)");
      for (let k = 0; k < 9; k++) {
        const a = R(k + 40) * Math.PI * 2;
        const d = R(k + 50) * 26 * s;
        const ax = cx + Math.cos(a) * d;
        const ay = cy + Math.sin(a) * d * 0.75;
        c.fillStyle = "#b8281e";
        c.beginPath(); c.arc(ax, ay, 2.8 * s, 0, Math.PI * 2); c.fill();
        c.fillStyle = "rgba(255,220,180,0.7)";
        c.beginPath(); c.arc(ax - 0.8 * s, ay - 0.8 * s, 0.9 * s, 0, Math.PI * 2); c.fill();
      }
      break;
    }
    case "birch": {
      // a slim white trunk with black marks, leaning a little
      const lean = (R(1) - 0.5) * 6 * s;
      trunk(c, x, y, 3.6 * s, 62 * s, "#ece6d8", lean, false);
      c.fillStyle = "#2e2a26";
      for (let k = 0; k < 6; k++) {
        const hy = y - (6 + k * 9 + R(k) * 4) * s;
        const hx = x + lean * ((y - hy) / (62 * s)) - 3 * s + R(k + 7) * 3 * s;
        c.fillRect(hx, hy, (2 + R(k + 3) * 3) * s, 1.4 * s);
      }
      const cx = x + lean + sway;
      const cy = y - 68 * s;
      const lobes: Lobe[] = [];
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2;
        lobes.push({ x: cx + Math.cos(a) * 16 * s, y: cy + Math.sin(a) * 20 * s + 6 * s, r: (11 + R(k + 30) * 5) * s });
      }
      lobes.push({ x: cx, y: cy - 10 * s, r: 15 * s });
      crown(c, lobes, "#a8cc62", "#4a7a30", cx, cy, 34 * s);
      // drooping twigs at the crown's foot
      c.strokeStyle = "rgba(70,110,40,0.8)"; c.lineWidth = 1.2;
      for (let k = 0; k < 7; k++) {
        const tx = cx - 18 * s + k * 6 * s;
        c.beginPath(); c.moveTo(tx, cy + 30 * s); c.quadraticCurveTo(tx + 2 * s, cy + 36 * s, tx + sway, cy + (42 + R(k) * 6) * s); c.stroke();
      }
      leaves(c, lobes, seed, "rgba(50,90,30,0.5)", "rgba(220,240,160,0.5)");
      break;
    }
    case "pine": {
      trunk(c, x, y, 4 * s, 22 * s, "#6e4a26", 0);
      // ragged tiers, the lowest widest; each tier drawn in ink, then paint
      const tiers: Array<[number, number]> = [[46, 26], [38, 46], [30, 66], [20, 84]];
      tiers.forEach(([w, base], i) => {
        const tipY = y - (base + 30) * s;
        const ox = sway * (i + 1) * 0.35;
        const pts: Array<[number, number]> = [[x + ox, tipY]];
        const n = 7;
        for (let k = 0; k <= n; k++) {
          const px = x - w * s + (k / n) * w * 2 * s;
          const py = y - base * s + 12 * s + (k % 2 ? -5 : 2) * s;
          pts.push([px, py]);
        }
        const path = () => {
          c.beginPath();
          c.moveTo(x + ox, tipY);
          for (const [px, py] of pts.slice(1)) c.lineTo(px, py);
          c.closePath();
        };
        const g = c.createLinearGradient(x - w * s, 0, x + w * s, 0);
        g.addColorStop(0, "#4a7c4a"); g.addColorStop(0.5, "#2f5c38"); g.addColorStop(1, "#1c3a26");
        path(); c.fillStyle = g; c.fill();
        c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
        // needles: short strokes along the lower edge
        c.strokeStyle = "rgba(140,190,140,0.35)"; c.lineWidth = 1;
        for (let k = 0; k < 5; k++) {
          const px = x - w * 0.6 * s + k * w * 0.3 * s;
          c.beginPath(); c.moveTo(px, y - base * s + 6 * s); c.lineTo(px + 4 * s, y - base * s); c.stroke();
        }
      });
      break;
    }
    case "cherry": {
      trunk(c, x, y, 3.4 * s, 24 * s, "#5a3a26", 0);
      c.strokeStyle = "#5a3a26"; c.lineWidth = 2.2 * s;
      c.beginPath(); c.moveTo(x, y - 18 * s); c.lineTo(x - 10 * s, y - 30 * s); c.moveTo(x, y - 20 * s); c.lineTo(x + 9 * s, y - 32 * s); c.stroke();
      const cx = x + sway;
      const cy = y - 42 * s;
      const lobes: Lobe[] = [];
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2 + R(k) * 0.5;
        lobes.push({ x: cx + Math.cos(a) * 15 * s, y: cy + Math.sin(a) * 10 * s, r: (10 + R(k + 5) * 4) * s });
      }
      lobes.push({ x: cx, y: cy - 4 * s, r: 14 * s });
      crown(c, lobes, "#5c9a44", "#1e4a1c", cx, cy, 28 * s);
      leaves(c, lobes, seed, "rgba(20,50,16,0.5)", "rgba(170,210,120,0.4)");
      c.fillStyle = "#a8102a";
      for (let k = 0; k < 12; k++) {
        const a = R(k + 60) * Math.PI * 2;
        const d = R(k + 70) * 18 * s;
        c.beginPath(); c.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, 1.9 * s, 0, Math.PI * 2); c.fill();
      }
      break;
    }
    case "willow": {
      // a leaning, split trunk and a curtain of fronds
      trunk(c, x, y, 6 * s, 40 * s, "#6a5a44", 4 * s);
      const cx = x + 4 * s + sway * 0.5;
      const cy = y - 52 * s;
      const lobes: Lobe[] = [
        { x: cx, y: cy, r: 24 * s }, { x: cx - 18 * s, y: cy + 4 * s, r: 16 * s }, { x: cx + 18 * s, y: cy + 4 * s, r: 16 * s },
        { x: cx - 6 * s, y: cy - 10 * s, r: 16 * s },
      ];
      crown(c, lobes, "#a2bc62", "#4e6a30", cx, cy, 34 * s);
      for (let i = 0; i < 18; i++) {
        const fx = cx + (i - 8.5) * 3.8 * s;
        const fs = still ? (i % 3 - 1) * 1.5 : Math.sin(t * 0.0014 + i * 0.7 + tr.x * 0.05) * 3;
        c.strokeStyle = i % 3 === 0 ? "#5a7a34" : i % 2 ? "#9cb860" : "#7c9a48";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(fx, cy - 4 * s);
        c.quadraticCurveTo(fx + fs * 0.5, cy + 20 * s, fx + fs, cy + (38 + (i % 4) * 5) * s);
        c.stroke();
      }
      break;
    }
  }
}

// --- Sprites ---------------------------------------------------------------------
// Painting a tree is a few dozen paths and gradients; the forest has
// hundreds, and redrawing them every frame was what slowed the game by the
// river and the woods. So each kind is painted once, in a few variants, into
// a sprite at twice the world resolution, and the frame only stamps it:
// scaled to the tree's size, and skewed from the foot for the sway (the
// foot stays put, the crown moves).
// sprites at the screen's density (twice the world on phones, once on plain screens)
const SPRITE_PX = typeof window === "undefined" ? 2 : Math.min(2, Math.max(1, Math.round(window.devicePixelRatio || 1)));
const SPRITE_W = 170;
const SPRITE_H = 160;
const SPRITE_FOOT = 150;
const VARIANTS = 5;
const sprites = new Map<string, HTMLCanvasElement>();

function treeSprite(kind: TreeKind, v: number): HTMLCanvasElement {
  const key = `${kind}${v}`;
  const have = sprites.get(key);
  if (have) return have;
  const cv = document.createElement("canvas");
  cv.width = SPRITE_W * SPRITE_PX;
  cv.height = SPRITE_H * SPRITE_PX;
  const g = cv.getContext("2d");
  if (g) {
    g.scale(SPRITE_PX, SPRITE_PX);
    drawTreeStorybook(g, { x: 97 * v + 11, y: 53 * v + 7, kind, s: 1 }, SPRITE_W / 2, SPRITE_FOOT, 0, true);
  }
  sprites.set(key, cv);
  return cv;
}

export function drawTreeSprite(
  c: CanvasRenderingContext2D, tr: { x: number; y: number; kind: TreeKind; s: number }, x: number, y: number, t: number,
): void {
  const v = Math.floor(hash2(tr.x, tr.y) * VARIANTS);
  const sp = treeSprite(tr.kind, v);
  const sway = Math.sin(t * 0.0012 + tr.x * 0.11) * (tr.kind === "willow" ? 2.4 : 1.6);
  const k = tr.s / SPRITE_PX;
  c.save();
  c.translate(x, y);
  // skew from the foot: a point h px up moves sway·h/80 px sideways
  c.transform(1, 0, -sway / 80, 1, 0, 0);
  c.scale(k, k);
  c.drawImage(sp, -(SPRITE_W / 2) * SPRITE_PX, -SPRITE_FOOT * SPRITE_PX);
  c.restore();
}
