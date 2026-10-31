import { darken, drawFolk } from "./people";
import { LYSA_OFFER_SPOT, LYSA_STONES, LYSA_SUMMIT, LYSA_THRONE } from "../data/lysa";
import { CAM, rr } from "./shapes";
import { LYSA_W } from "../world/areas";
import { hash2 } from "../world/geometry";

// --- Lysa Hora drawing ------------------------------------------------------
// The summit is drawn at night: blue-rock ground, a huge crescent moon
// riding over the north edge, the sabbath bonfire, broomsticks and a
// cauldron by the stones, and witch silhouettes in the firelight.

// The mountain's rock, crown and trail are part of the world's ground now
// (render/village.ts: mountainAt, the trail in roads()). What is drawn here
// stands on it: the moon over the north edge, the dead snags, the ring of
// standing stones, Beelzebub's seat, the offering stone, brooms and cauldron.
const INK = "rgba(20,16,26,0.85)";
function ink(c: CanvasRenderingContext2D, w = 0.9): void { c.strokeStyle = INK; c.lineWidth = w; c.stroke(); }

export function drawLysaGround(c: CanvasRenderingContext2D, camX: number, camY: number, vw: number, vh: number, t: number, offered: boolean) {
  void vw; void vh;
  // Dead snags — the only "trees" the mountain allows, long burnt: gnarled,
  // forked, reaching like hands
  for (const [dx, dy] of [[240, 180], [1080, 700], [150, 760], [1150, 160]] as const) {
    const sx = dx - camX;
    const sy = dy - camY;
    c.fillStyle = "rgba(10,8,16,0.35)";
    c.beginPath(); c.ellipse(sx + 6, sy + 22, 16, 4, 0, 0, Math.PI * 2); c.fill();
    const g = c.createLinearGradient(sx - 4, 0, sx + 5, 0);
    g.addColorStop(0, "#5a5058"); g.addColorStop(1, "#24202a");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(sx - 6, sy + 22); c.quadraticCurveTo(sx - 2, sy, sx - 1, sy - 26);
    c.lineTo(sx + 3, sy - 26); c.quadraticCurveTo(sx + 4, sy, sx + 7, sy + 22); c.closePath(); c.fill(); ink(c);
    c.strokeStyle = "#2e2832"; c.lineCap = "round";
    for (const [bx, by, ex, ey, w] of [[0, -10, -15, -26, 2.6], [1, -18, 15, -32, 2.2], [-8, -21, -12, -32, 1.4], [12, -27, 18, -36, 1.2], [1, -26, 3, -40, 2]] as const) {
      c.lineWidth = w + 1.4; c.strokeStyle = INK;
      c.beginPath(); c.moveTo(sx + bx, sy + by); c.quadraticCurveTo(sx + (bx + ex) / 2 + 3, sy + (by + ey) / 2, sx + ex, sy + ey); c.stroke();
      c.lineWidth = w; c.strokeStyle = "#3e3640";
      c.beginPath(); c.moveTo(sx + bx, sy + by); c.quadraticCurveTo(sx + (bx + ex) / 2 + 3, sy + (by + ey) / 2, sx + ex, sy + ey); c.stroke();
    }
    c.lineCap = "butt";
  }
  // The great crescent moon, low over the north edge, and its stars
  {
    const mx = 880 - camX;
    const my = 66 - camY;
    const mg = c.createRadialGradient(mx, my, 8, mx, my, 130);
    mg.addColorStop(0, "rgba(220,228,255,0.34)");
    mg.addColorStop(1, "rgba(220,228,255,0)");
    c.fillStyle = mg;
    c.fillRect(mx - 130, my - 130, 260, 260);
    c.save();
    c.beginPath(); c.arc(mx, my, 34, 0, Math.PI * 2); c.arc(mx + 15, my - 7, 29, 0, Math.PI * 2, true); c.clip("evenodd");
    const mgr = c.createLinearGradient(mx - 34, my, mx + 10, my);
    mgr.addColorStop(0, "#f4f4e2"); mgr.addColorStop(1, "#c8ccb8");
    c.fillStyle = mgr;
    c.fillRect(mx - 40, my - 40, 80, 80);
    c.restore();
    c.fillStyle = "rgba(240,244,255,0.85)";
    for (let i = 0; i < 40; i++) {
      const sx = hash2(i, 811) * LYSA_W - camX;
      const sy = hash2(i, 813) * 190 - camY;
      const tw = 0.5 + Math.sin(t * 0.002 + i * 1.9) * 0.4;
      c.globalAlpha = Math.max(0.15, tw);
      c.fillRect(sx, sy, 2, 2);
    }
    c.globalAlpha = 1;
  }
  // The standing stones of the ritual ring: rough menhirs, leaning a
  // little, lichen on the lit side, a crescent cut into some
  for (const s of LYSA_STONES) {
    const sx = s.x - camX;
    const sy = s.y - camY;
    const lean = (hash2(s.x, 3) - 0.5) * 4;
    c.fillStyle = "rgba(10,8,16,0.4)";
    c.beginPath(); c.ellipse(sx + 3, sy + 4, 14, 4.6, 0, 0, Math.PI * 2); c.fill();
    const g = c.createLinearGradient(sx - 8, 0, sx + 8, 0);
    g.addColorStop(0, "#9894a2"); g.addColorStop(0.5, "#6e6a7a"); g.addColorStop(1, "#3e3a4a");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(sx - 8, sy + 4); c.lineTo(sx - 7 + lean * 0.5, sy - s.h * 0.7);
    c.quadraticCurveTo(sx - 4 + lean, sy - s.h - 3, sx + 2 + lean, sy - s.h);
    c.lineTo(sx + 7 + lean * 0.6, sy - s.h * 0.6); c.lineTo(sx + 8, sy + 4); c.closePath(); c.fill(); ink(c);
    c.fillStyle = "rgba(150,166,110,0.55)";
    c.beginPath(); c.ellipse(sx - 4, sy - s.h * 0.35, 2.6, 4, 0.2, 0, Math.PI * 2); c.fill();
    if (Math.floor(s.x) % 3 === 0) {
      c.strokeStyle = "rgba(233,237,218,0.6)"; c.lineWidth = 1.4;
      c.beginPath(); c.arc(sx + lean * 0.5, sy - s.h / 2, 4, 0.6, Math.PI * 1.7); c.stroke();
    }
  }
  // Beelzebub's seat — a throne of black stone at the summit's north edge
  {
    const tx = LYSA_THRONE.x - camX;
    const ty = LYSA_THRONE.y - camY;
    c.fillStyle = "rgba(8,8,14,0.45)";
    c.beginPath(); c.ellipse(tx + 48, ty + 48, 62, 13, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#2c2833";
    rr(c, tx + 14, ty - 26, 68, 62, 5); c.fill();
    c.fillStyle = "#38333f";
    rr(c, tx + 14, ty - 26, 68, 14, 5); c.fill();
    c.fillStyle = "#211e28";
    rr(c, tx, ty + 22, 96, 22, 4); c.fill();
    c.fillStyle = "#e9edda";
    c.beginPath(); c.arc(tx + 48, ty - 12, 4.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#33333f";
    c.beginPath(); c.arc(tx + 50.4, ty - 13.4, 3.8, 0, Math.PI * 2); c.fill();
  }
  // The offering stone — a flat altar slab north of the fire. Once the
  // nichnyky are laid, they glow on it for the rest of the night (and
  // every night after).
  {
    const ox = LYSA_OFFER_SPOT.x - camX;
    const oy = LYSA_OFFER_SPOT.y - camY;
    c.fillStyle = "rgba(10,10,16,0.4)";
    c.beginPath(); c.ellipse(ox, oy + 10, 30, 8, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#6a6a76";
    c.beginPath(); c.ellipse(ox, oy + 2, 27, 10, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#7d7d8a";
    c.beginPath(); c.ellipse(ox, oy, 23, 8, 0, 0, Math.PI * 2); c.fill();
    if (offered) {
      const pulse = 0.6 + Math.sin(t * 0.004) * 0.25;
      const og = c.createRadialGradient(ox, oy - 2, 2, ox, oy - 2, 30);
      og.addColorStop(0, `rgba(220,230,255,${pulse * 0.65})`);
      og.addColorStop(1, "rgba(220,230,255,0)");
      c.fillStyle = og;
      c.fillRect(ox - 30, oy - 32, 60, 60);
      c.fillStyle = "#eef0dc";
      for (const [fx, fy] of [[-11, -1], [0, -4], [11, -1]] as const) {
        c.beginPath(); c.arc(ox + fx, oy + fy, 3.4, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#c9d4f2";
        c.beginPath(); c.arc(ox + fx, oy + fy, 1.5, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#eef0dc";
      }
    }
  }
  // Broomsticks leaning on a stone + a cauldron by the ring's south side —
  // the witches' parked transport and the night 's supper.
  {
    const bx = 838 - camX;
    const by = 512 - camY;
    c.strokeStyle = "#7a5a30";
    c.lineWidth = 3;
    for (const lean of [-8, 0, 8]) {
      c.beginPath(); c.moveTo(bx + lean, by + 16); c.lineTo(bx + lean * 0.4, by - 22); c.stroke();
      c.strokeStyle = "#a8894a";
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(bx + lean * 0.4, by - 22); c.lineTo(bx + lean * 0.4 - 4, by - 31); c.stroke();
      c.beginPath(); c.moveTo(bx + lean * 0.4, by - 22); c.lineTo(bx + lean * 0.4 + 4, by - 31); c.stroke();
      c.strokeStyle = "#7a5a30";
      c.lineWidth = 3;
    }
    const cx2 = 486 - camX;
    const cy2 = 522 - camY;
    c.fillStyle = "#23202a";
    c.beginPath(); c.ellipse(cx2, cy2, 15, 11, 0, 0, Math.PI * 2); c.fill();
    const bub = 0.5 + Math.sin(t * 0.005) * 0.3;
    c.fillStyle = `rgba(178,132,220,${bub})`;
    c.beginPath(); c.ellipse(cx2, cy2 - 3, 11.6, 4.4, 0, 0, Math.PI * 2); c.fill();
  }
}

export function drawLysaFire(c: CanvasRenderingContext2D, camX: number, camY: number, t: number, lit = true) {
  // The sabbath bonfire — the village campfire's wicked older brother.
  const x = LYSA_SUMMIT.x - camX;
  const y = LYSA_SUMMIT.y - camY + 14;
  if (!lit) {
    // by day: a black ring of stones, cold ash, a last thread of smoke
    c.fillStyle = "rgba(30,26,30,0.55)";
    c.beginPath(); c.ellipse(x, y, 34, 12, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#55555f";
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      c.beginPath(); c.ellipse(x + Math.cos(a) * 40, y + Math.sin(a) * 14, 7, 5, a, 0, Math.PI * 2); c.fill();
    }
    c.strokeStyle = "#1e1a1a"; c.lineWidth = 6;
    c.beginPath(); c.moveTo(x - 22, y + 4); c.lineTo(x + 18, y - 4); c.stroke();
    c.fillStyle = "#8a2a1a";
    for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(x - 8 + i * 6, y - 1 + (i % 2) * 2, 1.4, 0, Math.PI * 2); c.fill(); }
    const ph = (t * 0.0003) % 1;
    c.fillStyle = `rgba(200,196,190,${0.35 * (1 - ph)})`;
    c.beginPath(); c.arc(x + Math.sin(ph * 5) * 4, y - 10 - ph * 40, 3 + ph * 6, 0, Math.PI * 2); c.fill();
    return;
  }
  const glow = c.createRadialGradient(x, y - 10, 10, x, y - 10, 190);
  glow.addColorStop(0, "rgba(255,150,50,0.5)");
  glow.addColorStop(0.55, "rgba(160,70,140,0.16)");
  glow.addColorStop(1, "rgba(120,40,120,0)");
  c.fillStyle = glow;
  c.fillRect(x - 190, y - 200, 380, 380);
  c.fillStyle = "#55555f";
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    c.beginPath(); c.ellipse(x + Math.cos(a) * 40, y + Math.sin(a) * 14, 7, 5, a, 0, Math.PI * 2); c.fill();
  }
  c.strokeStyle = "#4a3423";
  c.lineWidth = 7;
  c.beginPath(); c.moveTo(x - 24, y + 6); c.lineTo(x + 20, y - 6); c.stroke();
  c.beginPath(); c.moveTo(x + 24, y + 6); c.lineTo(x - 20, y - 6); c.stroke();
  const fl = Math.sin(t * 0.014) * 4 + Math.sin(t * 0.037) * 2.4;
  c.fillStyle = "#ff7b2e";
  c.beginPath(); c.ellipse(x, y - 22, 15, 26 + fl, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#ffa02e";
  c.beginPath(); c.ellipse(x, y - 17, 10, 18 + fl * 0.7, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#ffe89a";
  c.beginPath(); c.ellipse(x, y - 11, 5, 10 + fl * 0.4, 0, 0, Math.PI * 2); c.fill();
  // sparks — violet as well as gold, because it is that kind of fire
  for (let i = 0; i < 7; i++) {
    const sp = (t * 0.03 + i * 131) % 46;
    c.fillStyle = i % 3 === 0 ? "rgba(196,150,255,0.9)" : "rgba(255,196,110,0.9)";
    c.fillRect(x + Math.sin(t * 0.004 + i * 2.4) * (8 + sp * 0.4), y - 26 - sp, 2.2, 2.2);
  }
}

// The witches and the dancers are people, in the people's storybook hand
// (render/people.ts, style "witch"); the dancers dance with arms up.
export function drawWitch(c: CanvasRenderingContext2D, x: number, y: number, tunic: string, hair: string, t: number, dancing: boolean, sitting = false, warlock = false) {
  const phase = t * 0.012 + (x + CAM.x) * 0.3;
  const pose = dancing ? { pose: "dance" as const } : sitting ? { pose: "sit" as const } : {};
  drawFolk(c, x, y, { tunic, hair, style: warlock ? "warlock" : "witch", moving: dancing, phase, face: 0, t, ...pose });
}

// Beelzebub presiding: broad, horned, enthroned — twice a mortal's width,
// ember eyes, a grin of gold teeth he keeps for guests, smoke for a beard.
export function drawBeelzebub(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const breathe = Math.sin(t * 0.0011) * 1.6;
  const top = y - 70 + breathe;
  const INK = "rgba(20,12,16,0.9)";
  const paint = (col: string, x0: number, w: number) => {
    const g = c.createLinearGradient(x0, 0, x0 + w, 0);
    g.addColorStop(0, col); g.addColorStop(0.55, col); g.addColorStop(1, darken(col, 0.65));
    return g;
  };
  const ink = (w = 1.1) => { c.strokeStyle = INK; c.lineWidth = w; c.stroke(); };
  c.fillStyle = "rgba(6,6,10,0.5)";
  c.beginPath(); c.ellipse(x, y + 4, 38, 9, 0, 0, Math.PI * 2); c.fill();
  // the throne of black stone behind him
  c.fillStyle = paint("#2a2630", x - 34, 68);
  c.beginPath(); c.moveTo(x - 34, y); c.lineTo(x - 32, top - 6); c.quadraticCurveTo(x, top - 26, x + 32, top - 6); c.lineTo(x + 34, y); c.closePath(); c.fill(); ink();
  // the robe, vast and dark, with a crimson lining
  c.fillStyle = paint("#3a2a40", x - 28, 56);
  c.beginPath(); c.moveTo(x - 10, top + 10); c.lineTo(x - 28, y + 2); c.lineTo(x + 28, y + 2); c.lineTo(x + 10, top + 10); c.closePath(); c.fill(); ink();
  c.fillStyle = "#7a1a2a";
  c.beginPath(); c.moveTo(x - 4, top + 14); c.lineTo(x - 9, y + 2); c.lineTo(x + 9, y + 2); c.lineTo(x + 4, top + 14); c.closePath(); c.fill();
  // clawed hands on the throne's arms
  for (const s of [-1, 1]) {
    c.fillStyle = paint("#5a3a4a", x + s * 26 - 6, 12);
    c.beginPath(); c.ellipse(x + s * 26, top + 42, 6, 8, s * 0.3, 0, Math.PI * 2); c.fill(); ink(0.8);
    c.strokeStyle = "#e8e0cc"; c.lineWidth = 1.4;
    for (let f = -1; f <= 1; f++) { c.beginPath(); c.moveTo(x + s * 26 + f * 2.6, top + 48); c.lineTo(x + s * 26 + f * 3.4, top + 53); c.stroke(); }
  }
  // the head: heavy brow, great curled horns, ember eyes
  c.fillStyle = paint("#5a3444", x - 13, 26);
  c.beginPath(); c.ellipse(x, top + 2, 13, 12.6, 0, 0, Math.PI * 2); c.fill(); ink();
  for (const s of [-1, 1]) {
    c.fillStyle = paint("#e7ddc4", x + s * 8 - 6, 12);
    c.beginPath();
    c.moveTo(x + s * 7, top - 7);
    c.quadraticCurveTo(x + s * 24, top - 12, x + s * 21, top - 30);
    c.quadraticCurveTo(x + s * 16, top - 14, x + s * 4, top - 3);
    c.closePath(); c.fill(); ink(0.8);
  }
  const glowE = 0.7 + Math.sin(t * 0.0026) * 0.25;
  c.fillStyle = `rgba(255,120,40,${glowE})`;
  c.beginPath(); c.ellipse(x - 4.6, top + 1.4, 2.2, 1.6, 0, 0, Math.PI * 2); c.ellipse(x + 4.6, top + 1.4, 2.2, 1.6, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#e8c96a"; c.lineWidth = 1.6;
  c.beginPath(); c.arc(x, top + 6, 6.4, 0.3, Math.PI - 0.3); c.stroke();
  // a beard of smoke-grey hair, drifting
  c.fillStyle = paint("#7a7482", x - 8, 16);
  c.beginPath(); c.moveTo(x - 8, top + 10); c.quadraticCurveTo(x - 6 + Math.sin(t * 0.002) * 2, top + 26, x, top + 30); c.quadraticCurveTo(x + 6, top + 24, x + 8, top + 10); c.closePath(); c.fill(); ink(0.8);
}

export function drawLysaFlower(c: CanvasRenderingContext2D, sx: number, sy: number, camX: number, camY: number, t: number, available: boolean) {
  const x = sx - camX;
  const y = sy - camY;
  if (!available) {
    c.fillStyle = "#5a5a48";
    for (let i = 0; i < 3; i++) {
      c.beginPath(); c.arc(x - 5 + i * 5, y + (i % 2) * 2, 2.6, 0, Math.PI * 2); c.fill();
    }
    return;
  }
  const pulse = 0.55 + Math.sin(t * 0.004 + sx) * 0.25;
  const g = c.createRadialGradient(x, y, 2, x, y, 28);
  g.addColorStop(0, `rgba(205,218,255,${pulse * 0.6})`);
  g.addColorStop(1, "rgba(205,218,255,0)");
  c.fillStyle = g;
  c.fillRect(x - 28, y - 28, 56, 56);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + hash2(sx, i) * 0.7;
    const lx = x + Math.cos(a) * 8;
    const ly = y + Math.sin(a) * 4;
    c.strokeStyle = "#6a7256";
    c.lineWidth = 1.7;
    c.beginPath(); c.moveTo(lx, ly + 5); c.quadraticCurveTo(lx + 2, ly, lx + 3, ly - 6); c.stroke();
    // a pale bell of a flower, open to the moon
    c.fillStyle = "#eef0dc";
    c.beginPath(); c.ellipse(lx + 3, ly - 8, 3.4, 4.2, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#b9c6ee";
    c.beginPath(); c.arc(lx + 3, ly - 8, 1.6, 0, Math.PI * 2); c.fill();
  }
}
// Beelzebub asleep on his stone bed by day, wrapped in his robe like a bat,
// snoring so the cave sheds pebbles; one yellow eye opens now and then.
export function drawBeelzebubAsleep(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const br = Math.sin(t * 0.0012) * 1.6;
  const INK = "rgba(20,12,16,0.9)";
  const g = c.createLinearGradient(x - 40, 0, x + 40, 0);
  g.addColorStop(0, "#4a3450"); g.addColorStop(1, "#24182a");
  c.fillStyle = g;
  c.beginPath(); c.ellipse(x + 6, y - 8 - br * 0.4, 36, 11 + br * 0.3, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
  c.fillStyle = "#7a1a2a";
  c.beginPath(); c.ellipse(x + 10, y - 6, 22, 4, 0, 0, Math.PI); c.fill();
  // the head on the stone, horns curling
  c.fillStyle = "#5a3444";
  c.beginPath(); c.ellipse(x - 34, y - 10, 11, 10, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  for (const s of [-1, 1]) {
    c.fillStyle = "#e7ddc4";
    c.beginPath(); c.moveTo(x - 34 + s * 6, y - 18); c.quadraticCurveTo(x - 34 + s * 16, y - 24, x - 34 + s * 14, y - 34); c.quadraticCurveTo(x - 34 + s * 10, y - 22, x - 34 + s * 2, y - 16); c.closePath(); c.fill(); c.stroke();
  }
  const eye = (t % 9000) > 8000;
  c.fillStyle = eye ? "#ffb02e" : "#2a1a20";
  c.beginPath(); c.ellipse(x - 30, y - 11, 2.2, eye ? 1.6 : 0.6, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#7a7482";
  c.beginPath(); c.ellipse(x - 30, y - 2, 6, 4, 0.3, 0, Math.PI * 2); c.fill();
  // the snore: pebbles off the ceiling
  const ph = (t * 0.0008) % 1;
  c.fillStyle = `rgba(150,146,160,${1 - ph})`;
  c.fillRect(x - 6, y - 60 + ph * 40, 2, 2); c.fillRect(x + 14, y - 66 + ph * 50, 1.6, 1.6);
}
