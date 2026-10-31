import { hash2 } from "../world/geometry";
import { rr } from "./shapes";

// The small props of "A roof for Omelko" (systems/pustka.ts), drawn at their
// place in the world. Each is a handful of strokes, no gradients.
const INK = "rgba(34,22,14,0.85)";

// The chopping block in the pustka's yard: a stump with the axe in it, and
// the split logs piled beside it (one more for every log chopped, up to the
// six the stove needs).
export function drawChopBlock(c: CanvasRenderingContext2D, x: number, y: number, logs: number): void {
  c.fillStyle = "rgba(30,50,20,0.28)";
  c.beginPath(); c.ellipse(x, y + 3, 20, 6, 0, 0, Math.PI * 2); c.fill();
  // the stump
  c.fillStyle = "#6a4c30";
  rr(c, x - 11, y - 17, 22, 19, 3); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  c.fillStyle = "#b8905a";
  c.beginPath(); c.ellipse(x, y - 17, 11, 4.6, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.strokeStyle = "#8a6a3e"; c.lineWidth = 0.8;
  c.beginPath(); c.ellipse(x, y - 17, 6, 2.4, 0, 0, Math.PI * 2); c.stroke();
  // the axe, sunk in the top: helve slanting up, the blade in the wood
  c.strokeStyle = INK; c.lineWidth = 3.6; c.lineCap = "round";
  c.beginPath(); c.moveTo(x + 2, y - 18); c.lineTo(x + 15, y - 40); c.stroke();
  c.strokeStyle = "#8a6a44"; c.lineWidth = 2.2;
  c.beginPath(); c.moveTo(x + 2, y - 18); c.lineTo(x + 15, y - 40); c.stroke();
  c.lineCap = "butt";
  c.fillStyle = "#7a8088";
  c.beginPath(); c.moveTo(x - 6, y - 20); c.lineTo(x + 6, y - 22); c.lineTo(x + 6, y - 15); c.lineTo(x - 5, y - 14); c.closePath(); c.fill();
  c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
  // the pile: logs two to a row, standing ends toward us
  const n = Math.max(0, Math.min(6, logs));
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const lx = x - 44 + col * 11 + row * 5;
    const ly = y - 2 - row * 9;
    c.fillStyle = "#8a6238";
    rr(c, lx - 5, ly - 7, 10, 10, 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
    c.fillStyle = "#d4b07a";
    c.beginPath(); c.ellipse(lx, ly - 2, 3.6, 3.6, 0, 0, Math.PI * 2); c.fill();
  }
  // chips on the ground
  c.fillStyle = "#c8a46a";
  for (let i = 0; i < 6; i++) {
    c.beginPath(); c.ellipse(x - 22 + hash2(i, 3) * 44, y + 3 + hash2(i, 5) * 6, 2.2, 1, hash2(i, 7) * 3, 0, Math.PI * 2); c.fill();
  }
}

// A clump of reeds on the bank, ready to be cut: tall blades with brown
// heads, swaying a little. `t` is in ms; the phase comes from the place.
export function drawReedClump(c: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  for (let i = 0; i < 9; i++) {
    const dx = (i - 4) * 2.6 + (hash2(i, x) - 0.5) * 2;
    const h = 26 + hash2(i, y) * 14;
    const sway = Math.sin(t * 0.0015 + x * 0.05 + i) * 2.4;
    c.strokeStyle = i % 2 ? "#7a9a48" : "#6a8a3c"; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(x + dx, y); c.quadraticCurveTo(x + dx + sway * 0.4, y - h * 0.5, x + dx + sway, y - h); c.stroke();
    if (i % 3 === 1) {
      c.fillStyle = "#6a4a2a";
      c.beginPath(); c.ellipse(x + dx + sway, y - h - 3, 1.8, 5, sway * 0.05, 0, Math.PI * 2); c.fill();
    }
  }
}

// A sheaf of cut reeds lying on the ground (the spot has been cut).
export function drawReedStubble(c: CanvasRenderingContext2D, x: number, y: number): void {
  c.strokeStyle = "#8a9a58"; c.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(x + (i - 2.5) * 2.4, y); c.lineTo(x + (i - 2.5) * 2.4 + (hash2(i, 1) - 0.5) * 3, y - 5); c.stroke(); }
}
