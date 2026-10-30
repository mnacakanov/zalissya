import { GRAVE } from "../data/chumaky";

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

export function drawOx(c: CanvasRenderingContext2D, x: number, y: number, face: number, camX: number, camY: number, t: number): void {
  const sx = x - camX;
  const sy = y - camY;
  const chew = Math.sin(t * 0.004 + x) * 1.2;
  c.fillStyle = "rgba(30,50,20,0.3)";
  c.beginPath(); c.ellipse(sx, sy + 10, 24, 5, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#6f6a62";
  for (const lx of [-14, -6, 8, 15]) c.fillRect(sx + lx, sy, 4, 11);
  c.fillStyle = "#9d978c";
  c.beginPath(); c.ellipse(sx, sy - 6, 22, 11, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#b8b2a6";
  c.beginPath(); c.ellipse(sx - 2, sy - 9, 15, 5, 0, 0, Math.PI * 2); c.fill();
  // head
  const hx = sx + face * 22;
  c.fillStyle = "#8a847a";
  c.beginPath(); c.ellipse(hx, sy - 8 + chew * 0.3, 8, 7, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#4e4a44";
  c.beginPath(); c.ellipse(hx + face * 5, sy - 5 + chew * 0.3, 4, 3, 0, 0, Math.PI * 2); c.fill();
  // long grey-steppe horns
  c.strokeStyle = "#e6dcc4";
  c.lineWidth = 2.2;
  c.beginPath();
  c.moveTo(hx - 3, sy - 13); c.quadraticCurveTo(hx - 12, sy - 20, hx - 16, sy - 28);
  c.moveTo(hx + 3, sy - 13); c.quadraticCurveTo(hx + 12, sy - 20, hx + 16, sy - 28);
  c.stroke();
  // tail
  c.strokeStyle = "#6f6a62";
  c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(sx - face * 22, sy - 8); c.lineTo(sx - face * (25 + Math.sin(t * 0.003) * 2), sy + 6); c.stroke();
}

export function drawSickChumak(c: CanvasRenderingContext2D, x: number, y: number, tunic: string, hair: string, t: number): void {
  const breathe = Math.sin(t * 0.004) * 0.8;
  // sheepskin
  c.fillStyle = "#d8cbb0";
  c.beginPath(); c.ellipse(x, y, 30, 11, 0, 0, Math.PI * 2); c.fill();
  // body under a blanket, lying
  c.fillStyle = tunic;
  c.beginPath(); c.ellipse(x + 3, y - 3 - breathe, 20, 7, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#7e2430";
  c.fillRect(x - 2, y - 9 - breathe, 22, 8);
  // head, flushed with fever
  c.fillStyle = "#e8a88e";
  c.beginPath(); c.arc(x - 20, y - 5, 6.4, 0, Math.PI * 2); c.fill();
  c.fillStyle = hair;
  c.beginPath(); c.arc(x - 22, y - 7, 5.4, Math.PI * 0.9, Math.PI * 1.9); c.fill();
  // a wet cloth on the brow
  c.fillStyle = "#f3efe4";
  c.fillRect(x - 24, y - 11, 8, 3);
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
