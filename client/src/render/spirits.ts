import { darken } from "./people";
import { hash2 } from "../world/geometry";

// --- Spirit drawing -----------------------------------------------------------
// The nechyst in the same storybook hand as the people (render/people.ts):
// painted with soft side light, a thin ink outline, faces that read at a
// glance. x, y are the ground point (feet / waterline), camera-shifted.
//   Domovyk     — a little shaggy grandad in bast shoes, beard to the floor
//   Lisovyk     — tree-tall, bark for skin, a moss cloak, antlers, amber eyes
//   Chort       — Gogol's: "in front, a German exactly": tailcoat and red
//                 waistcoat, a pig's snout, little horns, goat legs, a tail
//   Bolotianyk  — a frog-faced old man of the pond, draped in weed
//   Viy         — squat and earth-black, roots for arms, an iron face, lids
//                 that hang to the ground and servants to lift them

const INK = "rgba(34,22,14,0.85)";

function paint(c: CanvasRenderingContext2D, col: string, x0: number, w: number): CanvasGradient {
  const g = c.createLinearGradient(x0, 0, x0 + w, 0);
  g.addColorStop(0, col); g.addColorStop(0.55, col); g.addColorStop(1, darken(col, 0.7));
  return g;
}
function ink(c: CanvasRenderingContext2D, w = 0.9): void {
  c.strokeStyle = INK; c.lineWidth = w; c.stroke();
}
function shadow(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, a = 0.3): void {
  c.fillStyle = `rgba(20,30,10,${a})`;
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill();
}

export function drawDomovyk(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const bob = Math.sin(t * 0.0024 + x * 0.2) * 0.8;
  const top = y - 34 + bob;
  shadow(c, x, y + 1, 12, 3.6);
  // bast shoes (postoly) peeping out under the fur
  for (const s of [-1, 1]) {
    c.fillStyle = paint(c, "#c9a86a", x + s * 5 - 4, 8);
    c.beginPath(); c.ellipse(x + s * 5, y - 1, 4.4, 2.6, 0, 0, Math.PI * 2); c.fill(); ink(c, 0.7);
    c.strokeStyle = "#8a6a3a"; c.lineWidth = 0.6;
    c.beginPath(); c.moveTo(x + s * 5 - 3, y - 1); c.lineTo(x + s * 5 + 3, y - 1); c.stroke();
  }
  // the shaggy body: a little haystack of brown fur, its edge in tufts
  c.fillStyle = paint(c, "#7a5a3a", x - 12, 24);
  c.beginPath();
  for (let k = 0; k <= 20; k++) {
    const a = Math.PI * (k / 20) * 2;
    const r = (k % 2 ? 1 : 0.86);
    const px = x + Math.cos(a) * 11 * r;
    const py = top + 20 + Math.sin(a) * 13 * r;
    if (k === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.closePath(); c.fill(); ink(c);
  c.strokeStyle = "rgba(60,40,22,0.5)"; c.lineWidth = 1;
  for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(x + i * 4, top + 12); c.lineTo(x + i * 4.6, top + 30); c.stroke(); }
  // a red belt somewhere in all that hair
  c.fillStyle = "#a8322a";
  c.fillRect(x - 10, top + 22, 20, 2.4);
  // little hands, one holding his wooden spoon like a sceptre
  for (const s of [-1, 1]) {
    c.fillStyle = "#e2b48a";
    c.beginPath(); c.arc(x + s * 11, top + 22, 2.4, 0, Math.PI * 2); c.fill(); ink(c, 0.6);
  }
  c.strokeStyle = "#c9a86a"; c.lineWidth = 2;
  c.beginPath(); c.moveTo(x + 11, top + 22); c.lineTo(x + 14, top + 8); c.stroke();
  c.fillStyle = "#c9a86a";
  c.beginPath(); c.ellipse(x + 14.6, top + 6, 2.6, 3.4, 0.4, 0, Math.PI * 2); c.fill(); ink(c, 0.6);
  // the beard, grey and long — he is very old and very particular
  c.fillStyle = paint(c, "#bdb3a2", x - 8, 16);
  c.beginPath();
  c.moveTo(x - 7, top + 10); c.quadraticCurveTo(x - 9, top + 24, x, top + 32);
  c.quadraticCurveTo(x + 9, top + 24, x + 7, top + 10); c.closePath(); c.fill(); ink(c, 0.7);
  // the face peeking out, a big kind nose, bushy brows
  c.fillStyle = paint(c, "#e2b48a", x - 6, 12);
  c.beginPath(); c.ellipse(x, top + 7, 6, 5.4, 0, 0, Math.PI * 2); c.fill(); ink(c, 0.7);
  c.fillStyle = "#7a5a3a";
  c.beginPath(); c.ellipse(x, top + 2, 7.4, 3.6, 0, Math.PI, 0); c.fill();
  c.fillStyle = "#2e2018";
  c.beginPath(); c.arc(x - 2.4, top + 6.4, 1, 0, Math.PI * 2); c.arc(x + 2.4, top + 6.4, 1, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#d0d0c8";
  c.fillRect(x - 4.4, top + 4.4, 3, 1.2); c.fillRect(x + 1.4, top + 4.4, 3, 1.2);
  c.fillStyle = "#c98a5a";
  c.beginPath(); c.ellipse(x, top + 9, 1.8, 2.2, 0, 0, Math.PI * 2); c.fill();
}

export function drawLisovyk(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const sway = Math.sin(t * 0.0016 + x * 0.07) * 1.6;
  shadow(c, x, y + 2, 20, 5, 0.35);
  // the staff, a crooked branch still in leaf
  c.strokeStyle = "#5d4630"; c.lineWidth = 3.4; c.lineCap = "round";
  c.beginPath(); c.moveTo(x + 19, y + 1); c.quadraticCurveTo(x + 15, y - 40, x + 18, y - 70); c.stroke();
  c.lineWidth = 1.2; c.strokeStyle = INK;
  c.beginPath(); c.moveTo(x + 19, y + 1); c.quadraticCurveTo(x + 15, y - 40, x + 18, y - 70); c.stroke();
  c.fillStyle = "#557d3a";
  for (const [lx, ly] of [[20, -72], [15, -66], [22, -64]] as const) { c.beginPath(); c.ellipse(x + lx, y + ly, 3.4, 2, 0.6, 0, Math.PI * 2); c.fill(); }
  // the moss cloak, tree-tall, its hem ragged like roots
  c.fillStyle = paint(c, "#3d5c34", x - 18, 36);
  c.beginPath();
  c.moveTo(x - 9 + sway, y - 78);
  c.quadraticCurveTo(x - 22, y - 30, x - 18, y);
  for (let k = 0; k <= 8; k++) c.lineTo(x - 18 + k * 4.5, y + (k % 2 ? -5 : 1));
  c.quadraticCurveTo(x + 22, y - 30, x + 9 + sway, y - 78);
  c.closePath(); c.fill(); ink(c, 1);
  c.fillStyle = "rgba(120,160,70,0.6)";
  for (const [px, py, pr] of [[-8, -30, 4.6], [6, -48, 3.8], [-3, -14, 3.2], [9, -20, 3]] as const) {
    c.beginPath(); c.arc(x + px + sway * 0.5, y + py, pr, 0, Math.PI * 2); c.fill();
  }
  // bark arms, knotted
  for (const s of [-1, 1]) {
    c.strokeStyle = "#4c3a26"; c.lineWidth = 4.6;
    c.beginPath(); c.moveTo(x + s * 9 + sway, y - 70); c.quadraticCurveTo(x + s * 17, y - 54, x + s * 15, y - 38); c.stroke();
  }
  c.fillStyle = "#6e5638";
  c.beginPath(); c.arc(x + 15, y - 38, 3, 0, Math.PI * 2); c.arc(x - 15, y - 38, 3, 0, Math.PI * 2); c.fill();
  // the head: bark-brown, a long beard of moss, branching antlers
  const hx = x + sway;
  const hy = y - 86;
  c.fillStyle = paint(c, "#a8865a", hx - 9, 18);
  c.beginPath(); c.ellipse(hx, hy, 8.6, 10, 0, 0, Math.PI * 2); c.fill(); ink(c);
  c.strokeStyle = "rgba(70,50,30,0.55)"; c.lineWidth = 0.8;
  for (const o of [-4, 0, 4]) { c.beginPath(); c.moveTo(hx + o, hy - 8); c.lineTo(hx + o * 1.2, hy + 2); c.stroke(); }
  c.fillStyle = paint(c, "#6f8152", hx - 7, 14);
  c.beginPath(); c.moveTo(hx - 7, hy + 3); c.quadraticCurveTo(hx - 6, hy + 20, hx, hy + 24); c.quadraticCurveTo(hx + 6, hy + 20, hx + 7, hy + 3); c.closePath(); c.fill(); ink(c, 0.8);
  c.lineCap = "round";
  for (const s of [-1, 1]) {
    c.strokeStyle = "#6e5638"; c.lineWidth = 2.8;
    c.beginPath(); c.moveTo(hx + s * 5, hy - 8); c.quadraticCurveTo(hx + s * 15, hy - 16, hx + s * 19, hy - 30); c.stroke();
    c.lineWidth = 1.9;
    c.beginPath(); c.moveTo(hx + s * 12, hy - 14); c.lineTo(hx + s * 18, hy - 20); c.stroke();
    c.beginPath(); c.moveTo(hx + s * 17, hy - 24); c.lineTo(hx + s * 23, hy - 26); c.stroke();
  }
  c.lineCap = "butt";
  // amber eyes that do not blink
  const glow = 0.72 + Math.sin(t * 0.003 + x) * 0.22;
  c.fillStyle = `rgba(255,178,44,${glow})`;
  c.beginPath(); c.arc(hx - 3.2, hy - 1, 1.6, 0, Math.PI * 2); c.arc(hx + 3.2, hy - 1, 1.6, 0, Math.PI * 2); c.fill();
}

export function drawChort(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const hop = Math.abs(Math.sin(t * 0.004 + x * 0.1)) * 1.2;
  const top = y - 48 - hop;
  shadow(c, x, y + 1, 12, 3.6, 0.3);
  // the tail, with its tuft, wagging like a dog's at a market stall
  const wag = Math.sin(t * 0.006 + x) * 4;
  c.strokeStyle = "#2c1a1e"; c.lineWidth = 2.2; c.lineCap = "round";
  c.beginPath(); c.moveTo(x + 5, top + 32); c.quadraticCurveTo(x + 18, top + 36, x + 16 + wag, top + 20); c.stroke();
  c.fillStyle = "#2c1a1e";
  c.beginPath(); c.ellipse(x + 16 + wag, top + 18, 2.6, 3.6, 0.3, 0, Math.PI * 2); c.fill();
  // goat legs, backward knees, little hooves
  for (const s of [-1, 1]) {
    c.fillStyle = paint(c, "#4a3036", x + s * 5 - 4, 8);
    c.beginPath();
    c.moveTo(x + s * 2, top + 30); c.lineTo(x + s * 7, top + 30);
    c.quadraticCurveTo(x + s * 9, top + 38, x + s * 5, top + 42);
    c.lineTo(x + s * 6, y - 2); c.lineTo(x + s * 3, y - 2);
    c.quadraticCurveTo(x + s * 2, top + 38, x + s * 2, top + 30);
    c.closePath(); c.fill(); ink(c, 0.7);
    c.fillStyle = "#1a1214";
    c.beginPath(); c.ellipse(x + s * 4.6, y - 0.6, 2.8, 1.8, 0, 0, Math.PI * 2); c.fill();
  }
  // the tailcoat — black, with tails behind — over a red waistcoat
  c.fillStyle = paint(c, "#241c20", x - 10, 20);
  c.beginPath();
  c.moveTo(x - 8, top + 13); c.lineTo(x + 8, top + 13);
  c.lineTo(x + 10, top + 34); c.lineTo(x + 6, top + 30); c.lineTo(x - 6, top + 30); c.lineTo(x - 10, top + 34);
  c.closePath(); c.fill(); ink(c);
  c.fillStyle = paint(c, "#9a2430", x - 4, 8);
  c.beginPath(); c.moveTo(x - 4, top + 14); c.lineTo(x + 4, top + 14); c.lineTo(x + 3, top + 29); c.lineTo(x - 3, top + 29); c.closePath(); c.fill();
  c.fillStyle = "#e8c66a";
  for (const by of [17, 21, 25]) { c.beginPath(); c.arc(x, top + by, 0.9, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = "#f3efe4"; // a starched collar
  c.beginPath(); c.moveTo(x - 4, top + 12); c.lineTo(x, top + 16); c.lineTo(x + 4, top + 12); c.closePath(); c.fill();
  // arms: one leaning on the pitchfork, one doffing an invisible hat
  c.strokeStyle = "#241c20"; c.lineWidth = 3.6;
  c.beginPath(); c.moveTo(x - 7.4, top + 15); c.lineTo(x - 14, top + 24); c.stroke();
  const doff = Math.sin(t * 0.003) * 1.6;
  c.beginPath(); c.moveTo(x + 7.4, top + 15); c.lineTo(x + 12, top + 7 + doff); c.stroke();
  c.fillStyle = "#4a3036";
  c.beginPath(); c.arc(x - 14, top + 24, 1.8, 0, Math.PI * 2); c.arc(x + 12, top + 7 + doff, 1.8, 0, Math.PI * 2); c.fill();
  c.lineCap = "butt";
  // the pitchfork, polished like a shop sign
  c.strokeStyle = "#8a8d90"; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(x - 17, y); c.lineTo(x - 17, top + 10); c.stroke();
  c.beginPath(); c.moveTo(x - 20.4, top + 16); c.lineTo(x - 20.4, top + 9); c.lineTo(x - 17, top + 12); c.lineTo(x - 13.6, top + 9); c.lineTo(x - 13.6, top + 16); c.stroke();
  // the head: narrow, sly, a pig's snout, little curled horns, a goatee
  c.fillStyle = paint(c, "#5a3a42", x - 7, 14);
  c.beginPath(); c.ellipse(x, top + 4, 6.6, 7.8, 0, 0, Math.PI * 2); c.fill(); ink(c);
  c.fillStyle = "#e7ddc4";
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(x + s * 3.4, top - 2);
    c.quadraticCurveTo(x + s * 8, top - 6, x + s * 6.6, top - 11);
    c.quadraticCurveTo(x + s * 4.6, top - 7, x + s * 2, top - 3);
    c.closePath(); c.fill(); ink(c, 0.6);
  }
  c.fillStyle = paint(c, "#a8606a", x - 3.4, 7);
  c.beginPath(); c.ellipse(x, top + 6.6, 3.4, 2.6, 0, 0, Math.PI * 2); c.fill(); ink(c, 0.6);
  c.fillStyle = "#3a1a20";
  c.beginPath(); c.arc(x - 1.2, top + 6.6, 0.7, 0, Math.PI * 2); c.arc(x + 1.2, top + 6.6, 0.7, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#ffd76a";
  c.beginPath(); c.ellipse(x - 2.8, top + 2.4, 1.3, 1.1, 0, 0, Math.PI * 2); c.ellipse(x + 2.8, top + 2.4, 1.3, 1.1, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#1a1214"; c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(x + 1.4, top - 0.6); c.lineTo(x + 4.6, top - 1.6); c.stroke(); // one raised brow
  c.fillStyle = "#1a1214";
  c.beginPath(); c.moveTo(x - 1.6, top + 10); c.lineTo(x + 1.6, top + 10); c.lineTo(x, top + 15); c.closePath(); c.fill();
}

export function drawBolotianyk(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  // the murk where he breaks the pond's surface
  c.fillStyle = "rgba(40,60,44,0.5)";
  c.beginPath(); c.ellipse(x, y + 14, 34, 10, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(220,235,205,0.4)"; c.lineWidth = 1.4;
  const rip = (t * 0.02) % 16;
  c.beginPath(); c.ellipse(x, y + 14, 20 + rip, 6 + rip * 0.32, 0, 0, Math.PI * 2); c.stroke();
  const rise = Math.sin(t * 0.0009) * 3;
  const top = y - 28 + rise;
  // the drowned body, sunk to the chest
  c.fillStyle = paint(c, "#56705a", x - 18, 36);
  c.beginPath(); c.ellipse(x, top + 24, 17, 15, 0, Math.PI, 0); c.lineTo(x + 17, top + 34); c.lineTo(x - 17, top + 34); c.closePath(); c.fill(); ink(c);
  // weed hanging off his shoulders like a shawl
  c.strokeStyle = "#3e6b2a"; c.lineWidth = 1.6;
  for (let i = 0; i < 7; i++) {
    const wx = x - 15 + i * 5;
    c.beginPath(); c.moveTo(wx, top + 12 + Math.abs(i - 3)); c.quadraticCurveTo(wx + 2, top + 24, wx - 1 + Math.sin(t * 0.002 + i) * 1.5, top + 32); c.stroke();
  }
  // long dripping arms, webbed hands resting on the water
  for (const s of [-1, 1]) {
    c.strokeStyle = "#46604a"; c.lineWidth = 4.6; c.lineCap = "round";
    c.beginPath(); c.moveTo(x + s * 14, top + 16); c.quadraticCurveTo(x + s * 23, top + 26, x + s * 22, top + 34); c.stroke();
    c.fillStyle = "#56705a";
    c.beginPath(); c.ellipse(x + s * 23, top + 35, 5, 2.6, 0, 0, Math.PI * 2); c.fill(); ink(c, 0.6);
  }
  c.lineCap = "butt";
  // the broad frog head, eyes up top, a mouth that has waited a long time
  c.fillStyle = paint(c, "#5d785e", x - 14, 28);
  c.beginPath(); c.ellipse(x, top + 6, 13.6, 9, 0, 0, Math.PI * 2); c.fill(); ink(c);
  for (const s of [-1, 1]) {
    c.fillStyle = "#5d785e";
    c.beginPath(); c.arc(x + s * 7, top - 2.6, 4.4, 0, Math.PI * 2); c.fill(); ink(c, 0.7);
    c.fillStyle = "#e8e3b0";
    c.beginPath(); c.arc(x + s * 7, top - 2.8, 3, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#141c14";
    c.fillRect(x + s * 7 - 0.7, top - 5, 1.4, 4.4);
  }
  c.strokeStyle = "#24302a"; c.lineWidth = 1.6;
  c.beginPath(); c.arc(x, top + 6, 9, 0.3, Math.PI - 0.3); c.stroke();
  // a lily and reeds caught on his crown
  c.strokeStyle = "#3e6b2a"; c.lineWidth = 1.8;
  for (const [dx, len] of [[-9, 13], [-4, 17], [3, 11]] as const) {
    c.beginPath(); c.moveTo(x + dx, top); c.lineTo(x + dx - 1.6, top - len); c.stroke();
  }
  c.fillStyle = "#4d8a3d";
  c.beginPath(); c.ellipse(x + 9, top - 1, 5.4, 3, 0.4, 0, Math.PI * 2); c.fill(); ink(c, 0.6);
  c.fillStyle = "#f0c8d8";
  c.beginPath(); c.arc(x + 10, top - 3, 2, 0, Math.PI * 2); c.fill();
  // drips
  c.fillStyle = "rgba(200,225,235,0.75)";
  c.fillRect(x - 22, top + 36 + ((t * 0.045) % 13), 1.6, 3);
  c.fillRect(x + 21, top + 34 + ((t * 0.045 + 6) % 13), 1.6, 3);
}

export function drawViy(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  // Viy, after Gogol: squat, all clad in black earth; his arms and legs
  // like strong roots grown into it; an iron face; eyelids hanging to the
  // ground; and the servants who must lift them. x, y is the ground at his
  // chin; he is ~190 px wide.
  shadow(c, x, y + 8, 104, 22, 0.5);
  const breathe = Math.sin(t * 0.0009) * 2.2;
  const hy = y - 74 + breathe;
  // the root-arms, gripping the earth either side
  for (const s of [-1, 1]) {
    c.strokeStyle = "#2e261e"; c.lineWidth = 11; c.lineCap = "round";
    c.beginPath(); c.moveTo(x + s * 56, hy - 6); c.quadraticCurveTo(x + s * 92, hy + 10, x + s * 84, y + 2); c.stroke();
    c.lineWidth = 2; c.strokeStyle = INK;
    c.beginPath(); c.moveTo(x + s * 60, hy - 10); c.quadraticCurveTo(x + s * 97, hy + 8, x + s * 90, y + 2); c.stroke();
    c.strokeStyle = "#3a3026"; c.lineWidth = 3.4;
    for (const [dx, dy] of [[-10, 6], [4, 8], [14, 4]] as const) {
      c.beginPath(); c.moveTo(x + s * 84, y); c.quadraticCurveTo(x + s * (84 + dx), y + dy * 0.5, x + s * (84 + dx * 1.5), y + dy); c.stroke();
    }
  }
  c.lineCap = "butt";
  // the withered servants, leaning on the forks that lift his lids
  for (const s of [-1, 1]) {
    const sx = x + s * 108;
    c.fillStyle = paint(c, "#2a2432", sx - 10, 20);
    c.beginPath(); c.ellipse(sx, y - 30, 9, 26, s * 0.12, 0, Math.PI * 2); c.fill(); ink(c);
    c.fillStyle = paint(c, "#5a5462", sx - 6, 12);
    c.beginPath(); c.arc(sx, y - 60, 6.4, 0, Math.PI * 2); c.fill(); ink(c);
    c.fillStyle = "#141018";
    c.fillRect(sx - 3, y - 61, 1.6, 1.6); c.fillRect(sx + 1.4, y - 61, 1.6, 1.6);
    c.strokeStyle = "#6d6a72"; c.lineWidth = 2.6;
    c.beginPath(); c.moveTo(sx, y - 4); c.lineTo(x + s * 44, hy - 24); c.stroke();
    c.lineWidth = 1.7;
    c.beginPath(); c.moveTo(x + s * 44, hy - 24); c.lineTo(x + s * 38, hy - 33); c.moveTo(x + s * 44, hy - 24); c.lineTo(x + s * 50, hy - 33); c.stroke();
  }
  // the body behind the head, all earth and clods
  c.fillStyle = "#2a231c";
  c.beginPath(); c.ellipse(x, hy + 8, 86, 62, 0, Math.PI, 0); c.lineTo(x + 86, y); c.lineTo(x - 86, y); c.closePath(); c.fill(); ink(c, 1.4);
  c.fillStyle = "#3a3026";
  for (let i = 0; i < 9; i++) {
    c.beginPath(); c.ellipse(x - 70 + hash2(i, 701) * 140, hy - 30 + hash2(i, 703) * 80, 6 + hash2(i, 705) * 6, 4, 0, 0, Math.PI * 2); c.fill();
  }
  // the iron face: cold, dented, with a dull sheen
  const hg = c.createRadialGradient(x - 26, hy - 40, 12, x, hy, 92);
  hg.addColorStop(0, "#9aa0a6");
  hg.addColorStop(0.5, "#6a6e74");
  hg.addColorStop(1, "#3e4248");
  c.fillStyle = hg;
  c.beginPath(); c.ellipse(x, hy, 68, 62, 0, 0, Math.PI * 2); c.fill(); ink(c, 1.6);
  c.strokeStyle = "rgba(30,26,24,0.45)"; c.lineWidth = 1.2;
  for (let i = 0; i < 7; i++) {
    const a = hash2(i, 601) * Math.PI * 2;
    c.beginPath();
    c.moveTo(x + Math.cos(a) * 40, hy + Math.sin(a) * 36 - 16);
    c.lineTo(x + Math.cos(a + 0.4) * 62, hy + Math.sin(a + 0.4) * 54 - 12);
    c.stroke();
  }
  c.fillStyle = "rgba(120,60,30,0.35)"; // rust in the dents
  for (let i = 0; i < 5; i++) {
    c.beginPath(); c.ellipse(x - 40 + hash2(i, 621) * 80, hy - 30 + hash2(i, 623) * 30, 5, 3, 0, 0, Math.PI * 2); c.fill();
  }
  // the brow, like a cliff
  c.fillStyle = paint(c, "#5a5e64", x - 60, 120);
  c.beginPath(); c.ellipse(x, hy - 32, 60, 14, 0, 0, Math.PI * 2); c.fill(); ink(c, 1.2);
  // THE EYELIDS — hanging from the brow all the way to the ground, the
  // whole horror of him. Every so often one seam twitches open a crack.
  const seamCycle = t % 11000;
  const seam = seamCycle > 9200 && seamCycle < 10300 ? Math.sin(((seamCycle - 9200) / 1100) * Math.PI) * 5 : 0;
  for (const s of [-1, 1]) {
    const lx = x + s * 31;
    const lg = c.createLinearGradient(lx, hy - 30, lx, y + 4);
    lg.addColorStop(0, "#6a5e56");
    lg.addColorStop(1, "#3e3630");
    c.fillStyle = lg;
    c.beginPath();
    c.moveTo(lx - 29, hy - 30);
    c.quadraticCurveTo(lx, hy - 38, lx + 29, hy - 30);
    c.quadraticCurveTo(lx + 26, y - 6, lx + 17, y + 3);
    c.quadraticCurveTo(lx, y + 8, lx - 17, y + 3);
    c.quadraticCurveTo(lx - 26, y - 6, lx - 29, hy - 30);
    c.closePath(); c.fill(); ink(c, 1.2);
    c.strokeStyle = "rgba(60,30,30,0.6)"; c.lineWidth = 1.4;
    for (let v = -1; v <= 1; v++) {
      c.beginPath(); c.moveTo(lx + v * 11, hy - 28); c.quadraticCurveTo(lx + v * 13, hy + 6, lx + v * 8, y - 1); c.stroke();
    }
    c.strokeStyle = "rgba(20,14,12,0.9)"; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(lx - 22, y + 1); c.quadraticCurveTo(lx, y + 6, lx + 22, y + 1); c.stroke();
    if (seam > 0.4) {
      c.fillStyle = `rgba(255,64,32,${0.35 + seam * 0.09})`;
      c.beginPath(); c.ellipse(lx, y + 1 - seam * 0.4, 15, seam * 0.55, 0, 0, Math.PI * 2); c.fill();
    }
  }
  // the nose, and a mouth that has not spoken in an age
  c.fillStyle = paint(c, "#5e6268", x - 13, 26);
  c.beginPath(); c.ellipse(x, hy + 16, 12, 18, 0, 0, Math.PI * 2); c.fill(); ink(c, 1);
  c.fillStyle = "rgba(20,18,16,0.75)";
  c.beginPath(); c.ellipse(x - 5, hy + 29, 2.6, 3.4, 0, 0, Math.PI * 2); c.ellipse(x + 5, hy + 29, 2.6, 3.4, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(20,16,14,0.85)"; c.lineWidth = 2.6;
  c.beginPath(); c.moveTo(x - 21, y - 8); c.quadraticCurveTo(x, y - 3 + breathe * 0.4, x + 21, y - 8); c.stroke();
  // dead grass and clods on the crown
  c.strokeStyle = "#494540"; c.lineWidth = 1.6;
  for (let i = 0; i < 7; i++) {
    const hx = x - 30 + i * 10 + hash2(i, 607) * 5;
    c.beginPath(); c.moveTo(hx, hy - 58); c.lineTo(hx + (hash2(i, 611) - 0.5) * 7, hy - 70 - hash2(i, 613) * 6); c.stroke();
  }
}
