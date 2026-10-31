import { GRAVE } from "../data/chumaky";
import { makeInk, paint, rr } from "./shapes";

// --- The chumak camp: drawing ----------------------------------------------
// A salt cart, grey oxen with long horns, a sick man on a sheepskin, and —
// if it comes to that — a fresh grave with a wooden cross by the road.

export function drawCart(c: CanvasRenderingContext2D, x: number, y: number, camX: number, camY: number): void {
  const sx = x - camX;
  const sy = y - camY;
  c.fillStyle = "rgba(30,50,20,0.3)";
  c.beginPath(); c.ellipse(sx, sy + 14, 40, 7, 0, 0, Math.PI * 2); c.fill();
  // wheels
  c.fillStyle = "#4a3320";
  for (const wx of [-24, 24]) {
    c.beginPath(); c.arc(sx + wx, sy + 8, 10, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#7a5a38";
    c.beginPath(); c.arc(sx + wx, sy + 8, 3, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#4a3320";
  }
  // bed of the cart
  c.fillStyle = "#8a6440";
  c.fillRect(sx - 34, sy - 12, 68, 16);
  c.fillStyle = "#6e4e30";
  c.fillRect(sx - 34, sy + 1, 68, 3);
  // salt sacks
  for (const [dx, dy] of [[-20, -18], [-2, -20], [16, -17], [-11, -27], [8, -28]] as const) {
    c.fillStyle = "#eae4d4";
    c.beginPath(); c.ellipse(sx + dx, sy + dy, 10, 7, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "rgba(160,150,130,0.6)";
    c.fillRect(sx + dx - 1, sy + dy - 7, 2, 4);
  }
  // shaft
  c.strokeStyle = "#6e4e30";
  c.lineWidth = 3;
  c.beginPath(); c.moveTo(sx + 34, sy - 2); c.lineTo(sx + 66, sy - 6); c.stroke();
}

const INK = "rgba(34,22,14,0.85)";
const ink = makeInk(INK);

// A grey steppe ox, the chumak's patient engine: long lyre horns, a dewlap,
// a slow chew, a tail at the flies.
export function drawOx(c: CanvasRenderingContext2D, x: number, y: number, face: number, camX: number, camY: number, t: number): void {
  const sx = x - camX;
  const sy = y - camY;
  const chew = Math.sin(t * 0.004 + x) * 1.2;
  c.fillStyle = "rgba(30,50,20,0.3)";
  c.beginPath(); c.ellipse(sx, sy + 11, 26, 5, 0, 0, Math.PI * 2); c.fill();
  // legs, the far pair darker
  for (const [lx, far] of [[-15, true], [9, true], [-10, false], [15, false]] as const) {
    c.fillStyle = far ? "#5e5a52" : "#7a756c";
    c.beginPath(); c.rect(sx + lx * face, sy - 2, 4.4, 13); c.fill(); ink(c, 0.6);
    c.fillStyle = "#2e2a26"; c.fillRect(sx + lx * face, sy + 9, 4.4, 2.4);
  }
  // the tail
  c.strokeStyle = "#6f6a62"; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(sx - face * 23, sy - 9); c.quadraticCurveTo(sx - face * (27 + Math.sin(t * 0.003) * 2), sy, sx - face * 25, sy + 6); c.stroke();
  // the body: a big grey barrel with a paler back
  c.fillStyle = paint(c, "#a8a296", sx - 24, 48);
  c.beginPath(); c.ellipse(sx, sy - 7, 24, 12, 0, 0, Math.PI * 2); c.fill(); ink(c);
  c.fillStyle = "rgba(220,214,200,0.5)";
  c.beginPath(); c.ellipse(sx - 2, sy - 12, 16, 4.6, 0, 0, Math.PI * 2); c.fill();
  // the yoke on its neck
  c.fillStyle = "#6e4525";
  c.fillRect(sx + face * 14 - 2, sy - 20, 4, 14);
  // the head with its dewlap and the great horns
  const hx = sx + face * 24;
  c.fillStyle = paint(c, "#948e84", hx - 8, 16);
  c.beginPath(); c.ellipse(hx, sy - 8 + chew * 0.3, 8, 7.4, 0, 0, Math.PI * 2); c.fill(); ink(c);
  c.fillStyle = "#4e4a44";
  c.beginPath(); c.ellipse(hx + face * 5, sy - 5 + chew * 0.3, 4, 3, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#1e1a16";
  c.beginPath(); c.arc(hx + face * 2, sy - 10, 1, 0, Math.PI * 2); c.fill();
  c.lineCap = "round";
  for (const s of [-1, 1]) {
    c.strokeStyle = INK; c.lineWidth = 3.4;
    c.beginPath(); c.moveTo(hx + s * 3, sy - 13); c.quadraticCurveTo(hx + s * 13, sy - 18, hx + s * 15, sy - 30); c.stroke();
    c.strokeStyle = "#e6dcc4"; c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(hx + s * 3, sy - 13); c.quadraticCurveTo(hx + s * 13, sy - 18, hx + s * 15, sy - 30); c.stroke();
  }
  c.lineCap = "butt";
}

// Ostap in the fever, lying on a sheepskin by the cart.
export function drawSickChumak(c: CanvasRenderingContext2D, x: number, y: number, tunic: string, hair: string, t: number): void {
  const breathe = Math.sin(t * 0.004) * 0.8;
  // the sheepskin, curly
  c.fillStyle = paint(c, "#e4d8bc", x - 32, 64);
  c.beginPath(); c.ellipse(x, y, 32, 11, 0, 0, Math.PI * 2); c.fill(); ink(c);
  c.fillStyle = "rgba(190,176,146,0.6)";
  for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(x - 26 + i * 6.4, y + (i % 2 ? 3 : -3), 2, 0, Math.PI * 2); c.fill(); }
  // his body under a red blanket, breathing
  c.fillStyle = paint(c, tunic, x - 16, 36);
  c.beginPath(); c.ellipse(x + 3, y - 3 - breathe, 20, 7.4, 0, 0, Math.PI * 2); c.fill(); ink(c);
  c.fillStyle = paint(c, "#9a2a30", x - 2, 24);
  rr(c, x - 2, y - 10 - breathe, 24, 9, 3); c.fill(); ink(c, 0.7);
  // the head, flushed with fever, a wet cloth on the brow
  c.fillStyle = paint(c, "#eaa88e", x - 27, 14);
  c.beginPath(); c.arc(x - 20, y - 5, 6.4, 0, Math.PI * 2); c.fill(); ink(c);
  c.fillStyle = hair;
  c.beginPath(); c.arc(x - 22, y - 7, 5.4, Math.PI * 0.9, Math.PI * 1.9); c.fill();
  c.fillStyle = "#3a2a1c";
  c.beginPath(); c.moveTo(x - 20, y - 2); c.quadraticCurveTo(x - 16, y - 1, x - 15, y + 2); c.lineTo(x - 18, y - 1); c.closePath(); c.fill();
  c.strokeStyle = "#2e2018"; c.lineWidth = 0.9;
  c.beginPath(); c.moveTo(x - 19, y - 6); c.lineTo(x - 16.6, y - 6); c.stroke(); // eyes shut
  c.fillStyle = "#f3efe4";
  rr(c, x - 25, y - 12, 9, 3.4, 1); c.fill(); ink(c, 0.5);
}

export function drawGrave(c: CanvasRenderingContext2D, camX: number, camY: number): void {
  const sx = GRAVE.x - camX;
  const sy = GRAVE.y - camY;
  c.fillStyle = "#5c4430";
  c.beginPath(); c.ellipse(sx, sy, 22, 8, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#6e543c";
  c.beginPath(); c.ellipse(sx, sy - 2, 18, 6, 0, 0, Math.PI * 2); c.fill();
  // wooden cross, a chumak's whip hung on it
  c.fillStyle = "#7a5a38";
  c.fillRect(sx - 2, sy - 34, 4, 32);
  c.fillRect(sx - 10, sy - 26, 20, 4);
  c.strokeStyle = "#2a2018";
  c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(sx + 9, sy - 24); c.quadraticCurveTo(sx + 14, sy - 14, sx + 8, sy - 6); c.stroke();
  // a few field flowers
  for (const [dx, col] of [[-12, "#f2c416"], [10, "#b9a6e8"], [14, "#f5f2e6"]] as const) {
    c.fillStyle = col;
    c.beginPath(); c.arc(sx + dx, sy + 3, 2, 0, Math.PI * 2); c.fill();
  }
}
