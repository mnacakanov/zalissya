import { rr } from "./shapes";
import { hash2 } from "../world/geometry";

// --- Spirit drawing ---------------------------------------------------------
// x, y are the ground point (feet / waterline), already camera-shifted.

export function drawDomovyk(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const bob = Math.sin(t * 0.0024 + x * 0.2) * 1.1;
  const top = y - 30 + bob;
  c.fillStyle = "rgba(30,50,20,0.3)";
  c.beginPath(); c.ellipse(x, y + 2, 12, 3.8, 0, 0, Math.PI * 2); c.fill();
  // shaggy fur body — a small walking haystack of a spirit
  c.fillStyle = "#6e5136";
  c.beginPath(); c.ellipse(x, top + 17, 11.5, 13, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#5d432c";
  c.lineWidth = 1.4;
  for (let i = -2; i <= 2; i++) {
    c.beginPath(); c.moveTo(x + i * 4.4, top + 8); c.lineTo(x + i * 4.8, top + 27); c.stroke();
  }
  // great grey-brown beard
  c.fillStyle = "#a08b6d";
  c.beginPath(); c.ellipse(x, top + 14, 7.6, 9, 0, 0, Math.PI * 2); c.fill();
  // face peeking out of the hair
  c.fillStyle = "#e8b88a";
  c.beginPath(); c.ellipse(x, top + 6.4, 5.6, 4.8, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#2e2018";
  c.fillRect(x - 3.4, top + 5.6, 1.9, 2.3);
  c.fillRect(x + 1.6, top + 5.6, 1.9, 2.3);
  c.fillStyle = "#c98a5a";
  c.beginPath(); c.arc(x, top + 8.6, 1.5, 0, Math.PI * 2); c.fill();
  // a tiny wooden spoon, tucked in like a sceptre — he takes the pich seriously
  c.strokeStyle = "#c9a86a";
  c.lineWidth = 2;
  c.beginPath(); c.moveTo(x + 9, top + 16); c.lineTo(x + 13.4, top + 7); c.stroke();
  c.fillStyle = "#c9a86a";
  c.beginPath(); c.ellipse(x + 14, top + 5.8, 2.6, 3.4, 0.5, 0, Math.PI * 2); c.fill();
}

export function drawLisovyk(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const sway = Math.sin(t * 0.0016 + x * 0.07) * 1.6;
  c.fillStyle = "rgba(20,40,16,0.35)";
  c.beginPath(); c.ellipse(x, y + 3, 17, 5, 0, 0, Math.PI * 2); c.fill();
  // long moss-cloak, tree-tall
  c.fillStyle = "#33502e";
  c.beginPath();
  c.moveTo(x + sway, y - 84);
  c.lineTo(x - 16, y + 1);
  c.lineTo(x + 16, y + 1);
  c.closePath(); c.fill();
  c.fillStyle = "#3d5c34";
  c.beginPath();
  c.moveTo(x + sway, y - 84);
  c.lineTo(x - 6, y + 1);
  c.lineTo(x + 8, y + 1);
  c.closePath(); c.fill();
  // cloak ragged hem + moss patches
  c.fillStyle = "#557d3a";
  for (const [px, py, pr] of [[-8, -26, 4.6], [6, -44, 3.8], [-3, -12, 3.2]] as const) {
    c.beginPath(); c.arc(x + px + sway * 0.5, y + py, pr, 0, Math.PI * 2); c.fill();
  }
  // bark-brown arms, one holding a gnarled staff
  c.strokeStyle = "#4c3a26";
  c.lineWidth = 4.4;
  c.beginPath(); c.moveTo(x - 9 + sway, y - 62); c.lineTo(x - 16, y - 30); c.stroke();
  c.beginPath(); c.moveTo(x + 9 + sway, y - 62); c.lineTo(x + 15, y - 38); c.stroke();
  c.strokeStyle = "#5d4630";
  c.lineWidth = 3.4;
  c.beginPath(); c.moveTo(x + 17, y + 2); c.lineTo(x + 15, y - 62); c.stroke();
  c.beginPath(); c.moveTo(x + 15, y - 62); c.lineTo(x + 22, y - 70); c.stroke();
  // head: aged face, long moss beard, branching antlers
  c.fillStyle = "#c9a678";
  c.beginPath(); c.ellipse(x + sway, y - 88, 8.4, 9.4, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#6f8152";
  c.beginPath(); c.ellipse(x + sway, y - 78, 6.4, 8.6, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#6e5638";
  c.lineWidth = 2.6;
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(x + sway + s * 5, y - 95);
    c.quadraticCurveTo(x + sway + s * 15, y - 104, x + sway + s * 19, y - 116);
    c.stroke();
    c.lineWidth = 1.9;
    c.beginPath();
    c.moveTo(x + sway + s * 12, y - 101);
    c.lineTo(x + sway + s * 17, y - 108);
    c.stroke();
    c.lineWidth = 2.6;
  }
  // amber eyes that do not blink
  const glow = 0.72 + Math.sin(t * 0.003 + x) * 0.22;
  c.fillStyle = `rgba(255,178,44,${glow})`;
  c.fillRect(x + sway - 4.6, y - 90.4, 2.8, 2.8);
  c.fillRect(x + sway + 1.9, y - 90.4, 2.8, 2.8);
}

export function drawChort(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const hop = Math.abs(Math.sin(t * 0.004 + x * 0.1)) * 1.6;
  const top = y - 40 - hop;
  c.fillStyle = "rgba(30,20,20,0.3)";
  c.beginPath(); c.ellipse(x, y + 2, 11, 3.6, 0, 0, Math.PI * 2); c.fill();
  // curling tail with an arrow tip, wagging like a dog at a market stall
  const wag = Math.sin(t * 0.006 + x) * 4;
  c.strokeStyle = "#40232a";
  c.lineWidth = 2.6;
  c.beginPath();
  c.moveTo(x + 6, top + 30);
  c.quadraticCurveTo(x + 16, top + 32, x + 15 + wag, top + 18);
  c.stroke();
  c.fillStyle = "#40232a";
  c.beginPath();
  c.moveTo(x + 15 + wag, top + 12);
  c.lineTo(x + 11.4 + wag, top + 19);
  c.lineTo(x + 18.6 + wag, top + 19);
  c.closePath(); c.fill();
  // little hooves and legs
  c.fillStyle = "#40232a";
  c.fillRect(x - 6.4, top + 30, 4.6, 8);
  c.fillRect(x + 2, top + 30, 4.6, 8);
  c.fillStyle = "#241a1c";
  c.fillRect(x - 7.4, top + 37, 6.2, 3);
  c.fillRect(x + 1.6, top + 37, 6.2, 3);
  // red waistcoat, because a devil doing business dresses for it
  c.fillStyle = "#7e2430";
  rr(c, x - 8, top + 11, 16, 21, 3); c.fill();
  c.fillStyle = "#d9a441";
  c.fillRect(x - 0.8, top + 15, 1.6, 2.2);
  c.fillRect(x - 0.8, top + 20, 1.6, 2.2);
  c.fillRect(x - 0.8, top + 25, 1.6, 2.2);
  // arms — one doffing an invisible hat, endlessly polite
  c.strokeStyle = "#40232a";
  c.lineWidth = 3.6;
  c.beginPath(); c.moveTo(x - 7.4, top + 14); c.lineTo(x - 12.4, top + 24); c.stroke();
  c.beginPath(); c.moveTo(x + 7.4, top + 14); c.lineTo(x + 12.6, top + 9 + Math.sin(t * 0.003) * 1.6); c.stroke();
  // head: dark, sly, horned
  c.fillStyle = "#503038";
  c.beginPath(); c.ellipse(x, top + 4, 7.6, 7.8, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#e7ddc4";
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(x + s * 4.6, top - 1.6);
    c.quadraticCurveTo(x + s * 8.6, top - 6.4, x + s * 7.8, top - 11);
    c.quadraticCurveTo(x + s * 4.8, top - 7, x + s * 3.2, top - 3.4);
    c.closePath(); c.fill();
  }
  // a salesman's grin and one raised brow
  c.fillStyle = "#ffd76a";
  c.fillRect(x - 4.2, top + 2.4, 2.4, 2.4);
  c.fillRect(x + 1.9, top + 2.4, 2.4, 2.4);
  c.strokeStyle = "#f3e9d2";
  c.lineWidth = 1.4;
  c.beginPath(); c.arc(x, top + 6.4, 3.8, 0.25, Math.PI - 0.25); c.stroke();
  // pitchfork planted beside him, polished like a shop sign
  c.strokeStyle = "#8a8d90";
  c.lineWidth = 1.8;
  c.beginPath(); c.moveTo(x - 17, top + 40); c.lineTo(x - 17, top + 8); c.stroke();
  c.beginPath(); c.moveTo(x - 20.4, top + 14); c.lineTo(x - 20.4, top + 8); c.lineTo(x - 17, top + 11); c.lineTo(x - 13.6, top + 8); c.lineTo(x - 13.6, top + 14); c.stroke();
}

export function drawBolotianyk(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  // murk ring where he breaks the pond's surface
  c.fillStyle = "rgba(52,74,52,0.5)";
  c.beginPath(); c.ellipse(x, y + 14, 34, 10, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(220,235,205,0.4)";
  c.lineWidth = 1.4;
  const rip = (t * 0.02) % 16;
  c.beginPath(); c.ellipse(x, y + 14, 20 + rip, 6 + rip * 0.32, 0, 0, Math.PI * 2); c.stroke();
  const rise = Math.sin(t * 0.0009) * 3;
  const top = y - 26 + rise;
  // bloated swamp body, half-sunk
  c.fillStyle = "#46584a";
  c.beginPath(); c.ellipse(x, top + 22, 17, 15, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#57695a";
  c.beginPath(); c.ellipse(x - 4, top + 16, 10, 9, 0, 0, Math.PI * 2); c.fill();
  // dripping arms trailing pondweed
  c.strokeStyle = "#3d5040";
  c.lineWidth = 5;
  c.beginPath(); c.moveTo(x - 14, top + 18); c.quadraticCurveTo(x - 21, top + 28, x - 18, top + 38); c.stroke();
  c.beginPath(); c.moveTo(x + 14, top + 18); c.quadraticCurveTo(x + 21, top + 28, x + 18, top + 38); c.stroke();
  c.strokeStyle = "#5d7050";
  c.lineWidth = 1.8;
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(x + s * 18, top + 36); c.lineTo(x + s * 19, top + 44); c.stroke();
  }
  // broad drowned-log head with eyes on top, like a frog that knows things
  c.fillStyle = "#4c5f4e";
  c.beginPath(); c.ellipse(x, top + 4, 13.4, 8.6, 0, 0, Math.PI * 2); c.fill();
  for (const s of [-1, 1]) {
    c.fillStyle = "#4c5f4e";
    c.beginPath(); c.arc(x + s * 6.8, top - 4.6, 4, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#e8e3b0";
    c.beginPath(); c.arc(x + s * 6.8, top - 4.8, 2.7, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#141c14";
    c.fillRect(x + s * 6.8 - 0.7, top - 7, 1.4, 4.2);
  }
  // wide, patient mouth
  c.strokeStyle = "#2c3a2e";
  c.lineWidth = 1.8;
  c.beginPath(); c.arc(x, top + 5, 8, 0.35, Math.PI - 0.35); c.stroke();
  // reeds and a lily caught on his crown
  c.strokeStyle = "#3e6b2a";
  c.lineWidth = 2;
  for (const [dx, len] of [[-9, 15], [-4, 19], [3, 13]] as const) {
    c.beginPath(); c.moveTo(x + dx, top - 2); c.lineTo(x + dx - 1.6, top - 2 - len); c.stroke();
  }
  c.fillStyle = "#4d8a3d";
  c.beginPath(); c.ellipse(x + 9, top - 3, 5.4, 3.2, 0.4, 0, Math.PI * 2); c.fill();
  // drips
  c.fillStyle = "rgba(200,225,235,0.75)";
  const drip = (t * 0.045) % 13;
  c.fillRect(x - 17.4, top + 36 + drip, 1.6, 3);
  c.fillRect(x + 16.2, top + 34 + ((t * 0.045 + 6) % 13), 1.6, 3);
}

export function drawVij(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  // Vij: a giant ash-grey head planted in the hollow, servants and all.
  // x, y is the ground point at his chin; he is ~150px wide, ~170 tall.
  c.fillStyle = "rgba(12,8,18,0.5)";
  c.beginPath(); c.ellipse(x, y + 8, 96, 20, 0, 0, Math.PI * 2); c.fill();
  const breathe = Math.sin(t * 0.0009) * 2.2; // the mountain, breathing
  const hy = y - 74 + breathe;
  // withered servants leaning on the eyelid forks, motionless
  for (const s of [-1, 1]) {
    const sx = x + s * 96;
    c.fillStyle = "#241f2c";
    c.beginPath(); c.ellipse(sx, y - 34, 9, 24, s * 0.12, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#3a3444";
    c.beginPath(); c.arc(sx, y - 60, 6.4, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#6d6a72";
    c.lineWidth = 2.6;
    c.beginPath(); c.moveTo(sx, y - 6); c.lineTo(x + s * 44, hy - 24); c.stroke();
    c.lineWidth = 1.7;
    c.beginPath(); c.moveTo(x + s * 44, hy - 24); c.lineTo(x + s * 38, hy - 33); c.stroke();
    c.beginPath(); c.moveTo(x + s * 44, hy - 24); c.lineTo(x + s * 50, hy - 33); c.stroke();
  }
  // the great head
  const hg = c.createRadialGradient(x - 26, hy - 44, 18, x, hy, 96);
  hg.addColorStop(0, "#8d877e");
  hg.addColorStop(1, "#5f5a52");
  c.fillStyle = hg;
  c.beginPath(); c.ellipse(x, hy, 72, 66, 0, 0, Math.PI * 2); c.fill();
  // cracked, veined skin
  c.strokeStyle = "rgba(52,46,40,0.5)";
  c.lineWidth = 1.3;
  for (let i = 0; i < 6; i++) {
    const a = hash2(i, 601) * Math.PI * 2;
    c.beginPath();
    c.moveTo(x + Math.cos(a) * 46, hy + Math.sin(a) * 40 - 18);
    c.lineTo(x + Math.cos(a + 0.5) * 66, hy + Math.sin(a + 0.5) * 58 - 14);
    c.stroke();
  }
  // brow ridge like a cliff
  c.fillStyle = "#6d675e";
  c.beginPath(); c.ellipse(x, hy - 34, 62, 15, 0, 0, Math.PI * 2); c.fill();
  // THE EYELIDS — hanging from the brow all the way to the ground, the
  // whole horror of him. Every so often one seam twitches open a crack.
  const seamCycle = t % 11000;
  const seam = seamCycle > 9200 && seamCycle < 10300
    ? Math.sin(((seamCycle - 9200) / 1100) * Math.PI) * 5
    : 0;
  for (const s of [-1, 1]) {
    const lx = x + s * 31;
    const lg = c.createLinearGradient(lx, hy - 30, lx, y + 4);
    lg.addColorStop(0, "#7b7568");
    lg.addColorStop(1, "#57524a");
    c.fillStyle = lg;
    c.beginPath();
    c.moveTo(lx - 29, hy - 32);
    c.quadraticCurveTo(lx, hy - 40, lx + 29, hy - 32);
    c.quadraticCurveTo(lx + 26, y - 6, lx + 17, y + 3);
    c.quadraticCurveTo(lx, y + 8, lx - 17, y + 3);
    c.quadraticCurveTo(lx - 26, y - 6, lx - 29, hy - 32);
    c.closePath(); c.fill();
    // lid veins and seam
    c.strokeStyle = "rgba(64,44,48,0.65)";
    c.lineWidth = 1.5;
    for (let v = -1; v <= 1; v++) {
      c.beginPath();
      c.moveTo(lx + v * 11, hy - 30);
      c.quadraticCurveTo(lx + v * 13, hy + 6, lx + v * 8, y - 1);
      c.stroke();
    }
    c.strokeStyle = "rgba(30,22,20,0.85)";
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(lx - 22, y + 1);
    c.quadraticCurveTo(lx, y + 6, lx + 22, y + 1);
    c.stroke();
    if (seam > 0.4) {
      // a slit of dull red light under the lid — he is dreaming, or listening
      c.fillStyle = `rgba(255,64,32,${0.35 + seam * 0.09})`;
      c.beginPath(); c.ellipse(lx, y + 1 - seam * 0.4, 15, seam * 0.55, 0, 0, Math.PI * 2); c.fill();
    }
  }
  // nose and a mouth that has not spoken in an age
  c.fillStyle = "#655f56";
  c.beginPath(); c.ellipse(x, hy + 16, 13, 19, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "rgba(40,34,30,0.7)";
  c.beginPath(); c.ellipse(x - 5.4, hy + 30, 2.6, 3.6, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(x + 5.4, hy + 30, 2.6, 3.6, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(34,28,26,0.8)";
  c.lineWidth = 2.6;
  c.beginPath();
  c.moveTo(x - 21, y - 8);
  c.quadraticCurveTo(x, y - 3 + breathe * 0.4, x + 21, y - 8);
  c.stroke();
  // sparse hairs like dead grass on the crown
  c.strokeStyle = "#494540";
  c.lineWidth = 1.6;
  for (let i = 0; i < 7; i++) {
    const hx = x - 30 + i * 10 + hash2(i, 607) * 5;
    c.beginPath(); c.moveTo(hx, hy - 60); c.lineTo(hx + (hash2(i, 611) - 0.5) * 7, hy - 72 - hash2(i, 613) * 6); c.stroke();
  }
}