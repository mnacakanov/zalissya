import { HUT_WALLS } from "../data/huts";
import { rr } from "./shapes";
import { flagHas } from "../systems/flags";
import { HUT_H, HUT_W } from "../world/areas";
import { type Rect } from "../world/geometry";

// --- Hut interiors ----------------------------------------------------------
// Inside a hut: lamplight, plank floor, log walls, and the furniture
// that makes the room whose it is. hut 0 is the Domovyk's (the pich is
// the warm heart of it); hut 1 is Vesna's (bed, work table, cauldron
// corner, herb shelf). Drawn in world space like everything else; the
// dark surround swallows whatever of the 820×600 room the camera does
// not cover, so the hut reads as a lit room in the night of the page.
export function drawHutInterior(
  c: CanvasRenderingContext2D,
  camX: number, camY: number, t: number,
  hut: 0 | 1,
  flags: ReadonlySet<string>,
) {
  // the dark beyond the walls
  c.fillStyle = "#120c07";
  c.fillRect(-camX - 240, -camY - 240, HUT_W + 480, HUT_H + 480);
  const fx = 70 - camX;
  const fy = 64 - camY;
  const fw = 680;
  const fh = 472;
  // plank floor
  c.fillStyle = "#8a6238";
  c.fillRect(fx, fy, fw, fh);
  c.fillStyle = "#835c33";
  for (let py = fy + 26; py < fy + fh; py += 52) c.fillRect(fx, py, fw, 24);
  c.strokeStyle = "rgba(70,42,18,0.5)";
  c.lineWidth = 1.4;
  for (let py = fy + 26; py < fy + fh; py += 26) {
    c.beginPath(); c.moveTo(fx, py); c.lineTo(fx + fw, py); c.stroke();
  }
  // a woven runner from the door to the room's heart
  c.fillStyle = "#a83c32";
  c.fillRect(410 - 17 - camX, 330 - camY, 34, 176);
  c.fillStyle = "#c8a568";
  c.fillRect(410 - 17 - camX, 330 - camY, 5, 176);
  c.fillRect(410 + 12 - camX, 330 - camY, 5, 176);
  // a round braided rug in the middle of the floor
  c.fillStyle = "#b03a2e";
  c.beginPath(); c.ellipse(410 - camX, 400 - camY, 92, 44, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#c8a568";
  c.beginPath(); c.ellipse(410 - camX, 400 - camY, 66, 30, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#7a4a2b";
  c.beginPath(); c.ellipse(410 - camX, 400 - camY, 38, 17, 0, 0, Math.PI * 2); c.fill();

  // log walls — bands with log seams, a pale top face catching the lamp
  const wall = (r: Rect) => {
    const x = r.x - camX;
    const y = r.y - camY;
    c.fillStyle = "#6e4525";
    c.fillRect(x, y, r.w, r.h);
    c.strokeStyle = "rgba(46,28,10,0.6)";
    c.lineWidth = 1.4;
    if (r.w >= r.h) {
      for (let ly = y + 10; ly < y + r.h; ly += 10) {
        c.beginPath(); c.moveTo(x, ly); c.lineTo(x + r.w, ly); c.stroke();
      }
    } else {
      for (let lx = x + 10; lx < x + r.w; lx += 10) {
        c.beginPath(); c.moveTo(lx, y); c.lineTo(lx, y + r.h); c.stroke();
      }
    }
    c.fillStyle = "rgba(255,214,140,0.14)";
    if (r.w >= r.h) c.fillRect(x, y, r.w, 4);
    else c.fillRect(x, y, 4, r.h);
  };
  for (const r of HUT_WALLS) wall(r);
  // the door: pale daylight on the step, and the door itself swung open
  c.fillStyle = "#d9c491";
  c.fillRect(384 - camX, 506 - camY, 52, 30);
  c.fillStyle = "rgba(255,240,200,0.35)";
  c.beginPath();
  c.moveTo(388 - camX, 506 - camY);
  c.lineTo(432 - camX, 506 - camY);
  c.lineTo(424 - camX, 452 - camY);
  c.lineTo(396 - camX, 452 - camY);
  c.closePath(); c.fill();
  c.fillStyle = "#5d3d20";
  rr(c, 440 - camX, 470 - camY, 10, 62, 3); c.fill();
  // a window in the north wall, lamplit from inside, dark pines beyond
  {
    const wx = 560 - camX;
    const wy = 66 - camY;
    c.fillStyle = "#2c3844";
    rr(c, wx, wy, 52, 26, 2); c.fill();
    c.fillStyle = "#ffd97a";
    c.beginPath(); c.arc(wx + 38, wy + 8, 4.6, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#5d3d20";
    c.lineWidth = 2.4;
    c.strokeRect(wx, wy, 52, 26);
    c.beginPath(); c.moveTo(wx + 26, wy); c.lineTo(wx + 26, wy + 26); c.stroke();
  }
  // a hanging oil lamp over the room's middle — the light source
  {
    const lx = 410 - camX;
    const ly = 210 - camY;
    const lg = c.createRadialGradient(lx, ly, 8, lx, ly, 210);
    lg.addColorStop(0, "rgba(255,190,90,0.34)");
    lg.addColorStop(1, "rgba(255,190,90,0)");
    c.fillStyle = lg;
    c.fillRect(lx - 210, ly - 210, 420, 420);
    c.strokeStyle = "#3c3630";
    c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(lx, 94 - camY); c.lineTo(lx, ly - 8); c.stroke();
    c.fillStyle = "#3c3630";
    c.beginPath(); c.ellipse(lx, ly, 7, 5, 0, 0, Math.PI * 2); c.fill();
    const fl = 3.6 + Math.sin(t * 0.02) * 0.9;
    c.fillStyle = "#ffb02e";
    c.beginPath(); c.ellipse(lx, ly - 3, 2.8, fl + 2, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#ffe89a";
    c.beginPath(); c.ellipse(lx, ly - 2, 1.4, fl, 0, 0, Math.PI * 2); c.fill();
  }

  // shared furniture: a bed (frame, blanket, pillow) and a table (top,
  // cloth, candle) — the two huts dress them differently.
  const bed = (bx: number, by: number, blanket: string) => {
    const x = bx - camX;
    const y = by - camY;
    c.fillStyle = "rgba(20,12,4,0.3)";
    c.beginPath(); c.ellipse(x + 75, y + 74, 82, 9, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#6e4525";
    rr(c, x, y, 150, 70, 4); c.fill();
    c.fillStyle = "#efe3c8";
    rr(c, x + 6, y + 6, 138, 58, 3); c.fill();
    c.fillStyle = blanket;
    rr(c, x + 44, y + 6, 100, 58, 3); c.fill();
    c.fillStyle = "rgba(255,255,255,0.16)";
    rr(c, x + 44, y + 6, 100, 12, 3); c.fill();
    c.fillStyle = "#f7efdb";
    rr(c, x + 10, y + 12, 30, 46, 5); c.fill();
  };
  const table = (tx: number, ty: number, dress: (x: number, y: number) => void) => {
    const x = tx - camX;
    const y = ty - camY;
    c.fillStyle = "rgba(20,12,4,0.3)";
    c.beginPath(); c.ellipse(x + 65, y + 64, 74, 8, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#7a4a24";
    rr(c, x, y, 130, 60, 4); c.fill();
    c.fillStyle = "#efe3c8";
    rr(c, x + 14, y + 8, 102, 44, 3); c.fill();
    c.fillStyle = "#b03a2e";
    for (let i = 0; i < 6; i++) c.fillRect(x + 20 + i * 16, y + 12, 3, 3);
    dress(x, y);
    // benches either side
    c.fillStyle = "#6e4525";
    rr(c, x + 8, y - 14, 114, 9, 3); c.fill();
    rr(c, x + 8, y + 65, 114, 9, 3); c.fill();
  };

  if (hut === 0) {
    // THE PICH — the great clay stove, the Domovyk's whole world:
    // a broad clay body against the north wall, its mouth breathing
    // fire, a kettle on top, and the sleeping bench (lezhanka) along
    // its warm side, where the house spirit naps between duties.
    const px = 110 - camX;
    const py = 94 - camY;
    const pg = c.createRadialGradient(px + 75, py + 78, 6, px + 75, py + 78, 120);
    pg.addColorStop(0, "rgba(255,166,60,0.4)");
    pg.addColorStop(1, "rgba(255,166,60,0)");
    c.fillStyle = pg;
    c.fillRect(px - 45, py - 42, 240, 240);
    c.fillStyle = "#8d7c62";
    c.fillRect(px + 55, py - 30, 40, 32); // chimney into the wall
    c.fillStyle = "#b3a58c";
    rr(c, px, py, 150, 96, 10); c.fill();
    c.fillStyle = "#c2b498";
    rr(c, px, py, 150, 26, 10); c.fill();
    // the fire mouth — an arch of dark, breathing orange
    c.fillStyle = "#241610";
    c.beginPath();
    c.moveTo(px + 48, py + 96);
    c.lineTo(px + 48, py + 62);
    c.quadraticCurveTo(px + 75, py + 34, px + 102, py + 62);
    c.lineTo(px + 102, py + 96);
    c.closePath(); c.fill();
    const fl = 5 + Math.sin(t * 0.017) * 1.8 + Math.sin(t * 0.041) * 1.1;
    c.fillStyle = "#ff8b2e";
    c.beginPath(); c.ellipse(px + 75, py + 88, 15, fl + 5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#ffd76a";
    c.beginPath(); c.ellipse(px + 75, py + 90, 8, fl, 0, 0, Math.PI * 2); c.fill();
    // glowing coals below the arch
    c.fillStyle = "#ff6a2e";
    for (const [cx, cy] of [[62, 92], [76, 94], [88, 91]] as const) {
      c.beginPath(); c.arc(px + cx, py + cy, 2.6, 0, Math.PI * 2); c.fill();
    }
    // a kettle and two clay pots on top
    c.fillStyle = "#2e2a26";
    c.beginPath(); c.ellipse(px + 34, py + 14, 11, 7.4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#a85f38";
    c.beginPath(); c.ellipse(px + 116, py + 15, 8, 6, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(px + 130, py + 16, 6, 4.6, 0, 0, Math.PI * 2); c.fill();
    // the lezhanka — the warm sleeping bench along the pich's side,
    // with a folded blanket: the Domovyk's throne and bed in one
    c.fillStyle = "#9a8663";
    rr(c, px + 4, py + 100, 142, 20, 4); c.fill();
    c.fillStyle = "#7a4a6e";
    rr(c, px + 88, py + 102, 52, 16, 3); c.fill();
    c.fillStyle = "#efe3c8";
    rr(c, px + 10, py + 103, 26, 14, 3); c.fill();
    // the woodpile, stacked round logs by the stove
    {
      const wx = 110 - camX;
      const wy = 210 - camY;
      c.fillStyle = "#6e4525";
      for (let row = 0; row < 3; row++) {
        for (let i = 0; i < 4 - (row === 2 ? 1 : 0); i++) {
          const lx = wx + 8 + i * 15 + row * 6;
          const ly = wy + 28 - row * 10;
          c.beginPath(); c.arc(lx, ly, 6.4, 0, Math.PI * 2); c.fill();
          c.fillStyle = "#c9a86a";
          c.beginPath(); c.arc(lx, ly, 4, 0, Math.PI * 2); c.fill();
          c.fillStyle = "#6e4525";
        }
      }
    }
    bed(560, 94, "#8a4a3a");
    table(345, 280, (x, y) => {
      // a bowl, a heel of bread, and the spirit's own tiny cup
      c.fillStyle = "#5d6b72";
      c.beginPath(); c.ellipse(x + 36, y + 30, 10, 6, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#c98d45";
      c.beginPath(); c.ellipse(x + 66, y + 32, 9, 5.6, -0.15, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#a85f38";
      c.beginPath(); c.ellipse(x + 92, y + 28, 5, 4, 0, 0, Math.PI * 2); c.fill();
      // the offering, once left, sits by the pich in spirit — here a
      // crumb trail by the table leg says someone small has feasted
      if (flagHas(flags, "offering")) {
        c.fillStyle = "#e8c98a";
        for (const [cx, cy] of [[58, 52], [64, 55], [70, 52]] as const) {
          c.beginPath(); c.arc(x + cx, y + cy, 1.5, 0, Math.PI * 2); c.fill();
        }
      }
    });
    // a broom by the door — no hut of the Domovyk's lacks one
    c.strokeStyle = "#7a5a30";
    c.lineWidth = 3;
    c.beginPath(); c.moveTo(486 - camX, 520 - camY); c.lineTo(478 - camX, 466 - camY); c.stroke();
    c.fillStyle = "#c9a86a";
    c.beginPath();
    c.moveTo(478 - camX, 466 - camY);
    c.lineTo(470 - camX, 448 - camY);
    c.lineTo(486 - camX, 448 - camY);
    c.closePath(); c.fill();
  } else {
    bed(110, 94, "#4c6b35");
    // the herb shelf along the north wall — bundles for every kind,
    // drawn as the drying rack outdoors is, because it is the same shelf
    {
      const sx = 300 - camX;
      const sy = 94 - camY;
      c.fillStyle = "#6e4525";
      c.fillRect(sx, sy, 240, 7);
      c.fillRect(sx, sy + 15, 240, 4);
      const bundleCols = ["#3f7a2e", "#8a9678", "#f28c1e", "#f2c416", "#e8e2cc", "#3f7a2e", "#f2c416"];
      bundleCols.forEach((col, i) => {
        const bx = sx + 18 + i * 32;
        const sway = Math.sin(t * 0.002 + i * 1.7) * 1.1;
        c.strokeStyle = "#c9b18a";
        c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(bx, sy + 19); c.lineTo(bx + sway, sy + 27); c.stroke();
        c.fillStyle = col;
        c.beginPath(); c.ellipse(bx + sway, sy + 33, 4.4, 6.8, sway * 0.06, 0, Math.PI * 2); c.fill();
      });
      // stoppered bottles along the shelf board
      const bottleCols = ["#7fb069", "#c98d45", "#7a9ab0", "#b06a8a"];
      bottleCols.forEach((col, i) => {
        const bx = sx + 30 + i * 52;
        c.fillStyle = col;
        rr(c, bx, sy - 12, 7, 12, 2); c.fill();
        c.fillStyle = "#c9a86a";
        c.fillRect(bx + 2, sy - 15, 3, 3);
      });
    }
    // the cauldron corner — a stone hearth in the NE, something green
    // at a gentle bubble, steam curling: Vesna's indoor alchemy
    {
      const cx = 600 - camX;
      const cy = 94 - camY;
      const cg = c.createRadialGradient(cx + 40, cy + 52, 6, cx + 40, cy + 52, 96);
      cg.addColorStop(0, "rgba(255,150,60,0.32)");
      cg.addColorStop(1, "rgba(255,150,60,0)");
      c.fillStyle = cg;
      c.fillRect(cx - 56, cy - 44, 192, 192);
      c.fillStyle = "#74726c";
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        c.beginPath(); c.ellipse(cx + 40 + Math.cos(a) * 30, cy + 52 + Math.sin(a) * 20, 7, 5.4, a, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = "#2e2a26";
      c.beginPath(); c.ellipse(cx + 40, cy + 46, 27, 21, 0, 0, Math.PI * 2); c.fill();
      const bub = 0.5 + Math.sin(t * 0.006) * 0.3;
      c.fillStyle = `rgba(140,220,150,${bub})`;
      c.beginPath(); c.ellipse(cx + 40, cy + 38, 21, 8.4, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "rgba(210,250,215,0.9)";
      const bph = (t * 0.05) % 9;
      c.beginPath(); c.arc(cx + 32 + (bph % 3) * 6, cy + 34 - bph * 0.7, 1.8, 0, Math.PI * 2); c.fill();
      const fl = 4 + Math.sin(t * 0.019) * 1.4;
      c.fillStyle = "#ff8b2e";
      c.beginPath(); c.ellipse(cx + 40, cy + 66, 9, fl + 3, 0, 0, Math.PI * 2); c.fill();
      const st = (t * 0.0004) % 1;
      c.fillStyle = `rgba(240,238,232,${0.4 * (1 - st)})`;
      c.beginPath(); c.arc(cx + 40 + Math.sin(st * 5) * 3, cy + 26 - st * 18, 3 + st * 4, 0, Math.PI * 2); c.fill();
    }
    table(330, 270, (x, y) => {
      // a mortar and pestle, loose herbs, and a notebook of recipes
      c.fillStyle = "#5d6b72";
      c.beginPath(); c.ellipse(x + 34, y + 30, 9, 6, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#8d8b85";
      c.lineWidth = 2.6;
      c.beginPath(); c.moveTo(x + 30, y + 26); c.lineTo(x + 40, y + 18); c.stroke();
      c.fillStyle = "#3f7a2e";
      for (const [hx, hy] of [[58, 26], [66, 33], [74, 25]] as const) {
        c.beginPath(); c.arc(x + hx, y + hy, 2.8, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = "#f7efdb";
      rr(c, x + 88, y + 16, 22, 28, 2); c.fill();
      c.strokeStyle = "#a3805a";
      c.lineWidth = 1;
      for (let ly = y + 22; ly < y + 40; ly += 5) {
        c.beginPath(); c.moveTo(x + 92, ly); c.lineTo(x + 106, ly); c.stroke();
      }
    });
    // a cat asleep by the cauldron's warmth — every znak harka has one
    {
      const cx = 556 - camX;
      const cy = 196 - camY;
      const br = Math.sin(t * 0.0016) * 0.8;
      c.fillStyle = "rgba(20,12,4,0.3)";
      c.beginPath(); c.ellipse(cx, cy + 4, 17, 4.6, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#4c4438";
      c.beginPath(); c.ellipse(cx, cy, 15 + br, 8.6, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(cx + 12, cy - 3, 6.4, 0, Math.PI * 2); c.fill();
      c.beginPath();
      c.moveTo(cx + 8, cy - 8); c.lineTo(cx + 10, cy - 12); c.lineTo(cx + 13, cy - 8);
      c.closePath(); c.fill();
      c.beginPath();
      c.moveTo(cx + 14, cy - 8); c.lineTo(cx + 17, cy - 12); c.lineTo(cx + 18, cy - 7);
      c.closePath(); c.fill();
      c.strokeStyle = "#4c4438";
      c.lineWidth = 3;
      c.beginPath(); c.moveTo(cx - 13, cy + 2); c.quadraticCurveTo(cx - 20, cy - 4, cx - 16, cy - 9); c.stroke();
    }
  }
}