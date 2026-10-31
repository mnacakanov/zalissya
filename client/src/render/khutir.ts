import { hash2 } from "../world/geometry";
import { rr } from "./shapes";

// --- The khutir look --------------------------------------------------------
// A Cossack khutir, not a northern forest village: whitewashed clay khaty
// under hipped thatch, a crane well (журавель), woven wattle fences (тин)
// with clay pots on the stakes, cherry trees by the huts (садок вишневий
// коло хати), willows over the pond, sunflowers and mallows along the
// yards, a windmill on the rise and a burial mound (курган) with a stone
// idol (кам'яна баба) at the steppe edge. All procedural, like the rest.

export function drawKhata(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, seed: number): void {
  const wallTop = y + 26;
  // walls: whitewashed clay, a touch cooler on the shaded side
  c.fillStyle = "#f3eee3";
  rr(c, x, wallTop, w, h - 26, 4); c.fill();
  c.fillStyle = "rgba(150,140,120,0.18)";
  c.fillRect(x + w * 0.72, wallTop, w * 0.28, h - 26);
  // призьба — the clay bench along the wall, ochre-painted
  c.fillStyle = "#a8643c";
  rr(c, x - 4, y + h - 12, w + 8, 12, 3); c.fill();
  c.fillStyle = "#8c4f2e";
  c.fillRect(x - 4, y + h - 3, w + 8, 3);
  // door, framed, a little sunk
  const dx = x + w / 2 - 13;
  c.fillStyle = "#e4dccb";
  c.fillRect(dx - 3, y + h - 50, 32, 40);
  c.fillStyle = "#5a3a22";
  rr(c, dx, y + h - 47, 26, 37, 2); c.fill();
  c.fillStyle = "#46301c";
  c.fillRect(dx + 12, y + h - 47, 2, 37);
  c.fillStyle = "#d9a441";
  c.fillRect(dx + 19, y + h - 30, 3, 3);
  // windows: small, blue frames, warm light, painted flowers around
  for (const wx of [x + 16, x + w - 46]) {
    const wy = y + 46;
    c.fillStyle = "#3f63a8";
    rr(c, wx - 3, wy - 3, 36, 30, 3); c.fill();
    c.fillStyle = "#ffe2a4";
    c.fillRect(wx, wy, 30, 24);
    c.fillStyle = "#3f63a8";
    c.fillRect(wx + 14, wy, 2, 24);
    c.fillRect(wx, wy + 11, 30, 2);
    // painted petals (Petrykivka-style dots) above the window
    for (let i = 0; i < 5; i++) {
      c.fillStyle = i % 2 ? "#c8402e" : "#3f7a2e";
      c.beginPath(); c.arc(wx + 3 + i * 6, wy - 8 - (i === 2 ? 2 : 0), 2.2, 0, Math.PI * 2); c.fill();
    }
  }
  // hipped thatch roof (чотирисхилий дах), thick rounded eaves
  const eave = wallTop + 6;
  c.fillStyle = "#9c7a3e";
  c.beginPath();
  c.moveTo(x - 16, eave + 4);
  c.quadraticCurveTo(x - 20, eave - 10, x + w * 0.22, y - 24);
  c.lineTo(x + w * 0.78, y - 24);
  c.quadraticCurveTo(x + w + 20, eave - 10, x + w + 16, eave + 4);
  c.closePath(); c.fill();
  c.fillStyle = "#b8954f";
  c.beginPath();
  c.moveTo(x - 10, eave - 2);
  c.quadraticCurveTo(x - 12, eave - 14, x + w * 0.24, y - 20);
  c.lineTo(x + w * 0.76, y - 20);
  c.quadraticCurveTo(x + w + 12, eave - 14, x + w + 10, eave - 2);
  c.closePath(); c.fill();
  // straw texture
  c.strokeStyle = "rgba(110,82,36,0.45)";
  c.lineWidth = 1.2;
  for (let i = 0; i < 26; i++) {
    const px = x - 8 + (i / 25) * (w + 16);
    const topX = x + w * 0.24 + (i / 25) * (w * 0.52);
    c.beginPath(); c.moveTo(topX, y - 18); c.lineTo(px + (hash2(i, seed) - 0.5) * 4, eave - 1); c.stroke();
  }
  // the eave's cut edge, a shadow under it
  c.fillStyle = "#7d6030";
  c.beginPath();
  c.moveTo(x - 16, eave + 4); c.lineTo(x + w + 16, eave + 4); c.lineTo(x + w + 10, eave + 9); c.lineTo(x - 10, eave + 9);
  c.closePath(); c.fill();
  c.fillStyle = "rgba(60,40,20,0.18)";
  c.fillRect(x, eave + 9, w, 6);
  // ridge
  c.fillStyle = "#86672f";
  rr(c, x + w * 0.22 - 2, y - 27, w * 0.56 + 4, 7, 3); c.fill();
  // clay chimney with smoke
  const chx = x + w * 0.64;
  c.fillStyle = "#e9e3d6";
  c.fillRect(chx, y - 34, 14, 20);
  c.fillStyle = "#c9c0ae";
  c.fillRect(chx - 2, y - 37, 18, 5);
  for (let i = 0; i < 3; i++) {
    const ph = (t * 0.00016 + i / 3 + hash2(seed, i)) % 1;
    c.fillStyle = `rgba(240,238,232,${0.45 * (1 - ph)})`;
    c.beginPath();
    c.arc(chx + 7 + ph * 16 + Math.sin(ph * 6 + seed) * 3, y - 42 - ph * 44, 4 + ph * 8, 0, Math.PI * 2);
    c.fill();
  }
}

// Журавель — the crane well: a log frame, a forked post, a long sweep with a
// counterweight, a pole and a bucket over the mouth.
export function drawCraneWell(c: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  c.fillStyle = "rgba(30,50,20,0.25)";
  c.beginPath(); c.ellipse(x + 34, y + 52, 42, 10, 0, 0, Math.PI * 2); c.fill();
  // log frame (зруб)
  c.fillStyle = "#7a5a38";
  rr(c, x + 6, y + 22, 56, 30, 3); c.fill();
  c.strokeStyle = "rgba(60,40,22,0.6)";
  c.lineWidth = 1.4;
  for (let ly = y + 29; ly < y + 52; ly += 7) { c.beginPath(); c.moveTo(x + 8, ly); c.lineTo(x + 60, ly); c.stroke(); }
  c.fillStyle = "#24303a";
  c.beginPath(); c.ellipse(x + 34, y + 24, 22, 6, 0, 0, Math.PI * 2); c.fill();
  // forked post
  c.fillStyle = "#6e4e30";
  c.fillRect(x + 76, y - 34, 6, 80);
  c.fillRect(x + 72, y - 38, 4, 8);
  c.fillRect(x + 82, y - 38, 4, 8);
  // the sweep rocks a little in the wind
  const tilt = Math.sin(t * 0.0006) * 2;
  const px = x + 79;
  const py = y - 34;
  const lx = x + 34;
  const ly = y - 76 + tilt;
  const sx = px + (px - lx) * 0.45;
  const sy = py + (py - ly) * 0.45;
  c.strokeStyle = "#7a5a38";
  c.lineWidth = 4;
  c.beginPath(); c.moveTo(lx, ly); c.lineTo(sx, sy); c.stroke();
  // counterweight stone
  c.fillStyle = "#8a8780";
  c.beginPath(); c.ellipse(sx, sy + 2, 7, 5, 0, 0, Math.PI * 2); c.fill();
  // pole and bucket
  c.strokeStyle = "#6e4e30";
  c.lineWidth = 2.2;
  c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx, y + 10); c.stroke();
  c.fillStyle = "#5d3d20";
  rr(c, lx - 6, y + 8, 12, 11, 2); c.fill();
  c.fillStyle = "#8a6440";
  c.fillRect(lx - 6, y + 11, 12, 2);
}

// Тин — a woven wattle fence, with clay pots (глечики) upturned on stakes.
export function drawTyn(c: CanvasRenderingContext2D, fx: number, fy: number, fw: number, fh: number, camX: number, camY: number): void {
  const x = fx - camX;
  const y = fy - camY;
  const horiz = fw >= fh;
  const len = horiz ? fw : fh;
  const step = 16;
  // stakes
  c.fillStyle = "#6e4e30";
  for (let i = 0; i <= len; i += step) {
    if (horiz) c.fillRect(x + i - 1.5, y - 10, 3, 22);
    else c.fillRect(x - 1.5, y + i - 6, 3, 18);
  }
  // wicker
  for (let row = 0; row < 3; row++) {
    c.strokeStyle = row % 2 ? "#a3804e" : "#8c6a3c";
    c.lineWidth = 2.6;
    c.beginPath();
    for (let i = 0; i < len; i += step / 2) {
      const wob = ((i / (step / 2)) % 2 ? 1.6 : -1.6) * (row % 2 ? -1 : 1);
      if (horiz) {
        const yy = y - 6 + row * 5 + wob;
        if (i === 0) c.moveTo(x, yy); else c.lineTo(x + i, yy);
      } else {
        const xx = x + wob;
        const yy = y + i;
        if (i === 0) c.moveTo(xx, yy - 2 + row * 3); else c.lineTo(xx, yy - 2 + row * 3);
      }
    }
    c.stroke();
  }
  // pots on every third stake
  for (let i = step; i < len; i += step * 3) {
    const px = horiz ? x + i : x;
    const py = horiz ? y - 12 : y + i - 8;
    c.fillStyle = hash2(fx + i, fy) > 0.5 ? "#b5653a" : "#8e4a2a";
    c.beginPath(); c.ellipse(px, py, 5.4, 6.4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#7a3c22";
    c.fillRect(px - 3, py + 4, 6, 2.4);
  }
}

export function drawSunflower(c: CanvasRenderingContext2D, x: number, y: number, t: number, seed: number): void {
  const sway = Math.sin(t * 0.0011 + seed) * 1.5;
  const hgt = 34 + seed * 14;
  c.strokeStyle = "#4c7a2e";
  c.lineWidth = 2.4;
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + sway, y - hgt / 2, x + sway, y - hgt); c.stroke();
  c.fillStyle = "#4c7a2e";
  c.beginPath(); c.ellipse(x - 5, y - hgt * 0.45, 6, 3, -0.5, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(x + 5, y - hgt * 0.6, 6, 3, 0.5, 0, Math.PI * 2); c.fill();
  const hx = x + sway;
  const hy = y - hgt;
  c.fillStyle = "#f2c416";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    c.beginPath(); c.ellipse(hx + Math.cos(a) * 7, hy + Math.sin(a) * 7, 4, 2.2, a, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = "#5a3a1e";
  c.beginPath(); c.arc(hx, hy, 5.4, 0, Math.PI * 2); c.fill();
}

export function drawMallow(c: CanvasRenderingContext2D, x: number, y: number, t: number, seed: number): void {
  const sway = Math.sin(t * 0.0013 + seed * 3) * 1.2;
  const hgt = 38 + seed * 16;
  c.strokeStyle = "#557d3a";
  c.lineWidth = 2;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + sway, y - hgt); c.stroke();
  const col = ["#d9548a", "#f0a3c0", "#b0304f", "#f5f2e6"][Math.floor(seed * 4)] ?? "#d9548a";
  for (let i = 0; i < 5; i++) {
    const fy = y - hgt + i * 7;
    const fx = x + sway * (1 - i / 5) + (i % 2 ? 3 : -3);
    c.fillStyle = col;
    c.beginPath(); c.arc(fx, fy, 3.4 - i * 0.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#f2d16a";
    c.fillRect(fx - 0.6, fy - 0.6, 1.2, 1.2);
  }
}

// Ковила — feather grass at the steppe edge: silver plumes in the wind.
export function drawKovyla(c: CanvasRenderingContext2D, x: number, y: number, t: number, seed: number): void {
  c.strokeStyle = "rgba(232,228,206,0.85)";
  c.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    const sway = Math.sin(t * 0.0018 + seed * 5 + i) * 4;
    c.beginPath();
    c.moveTo(x + i * 3 - 8, y);
    c.quadraticCurveTo(x + i * 3 - 8 + sway * 0.5, y - 10, x + i * 3 - 8 + sway, y - 20 - (i % 3) * 3);
    c.stroke();
  }
}

// (cherries and willows are trees now: render/trees.ts)

// Курган with a кам'яна баба — an ancient steppe mound and its stone idol.
export function drawKurhan(c: CanvasRenderingContext2D, x: number, y: number): void {
  c.fillStyle = "rgba(30,50,20,0.25)";
  c.beginPath(); c.ellipse(x, y + 6, 70, 16, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#7da34a";
  c.beginPath(); c.ellipse(x, y - 4, 64, 24, 0, Math.PI, 0); c.lineTo(x + 64, y + 2); c.lineTo(x - 64, y + 2); c.closePath(); c.fill();
  c.fillStyle = "#8fb357";
  c.beginPath(); c.ellipse(x - 8, y - 12, 40, 12, 0, Math.PI, 0); c.closePath(); c.fill();
  // the stone woman: weathered grey, hands folded over a bowl
  const bx = x;
  const by = y - 22;
  c.fillStyle = "#8d8a82";
  rr(c, bx - 8, by - 34, 16, 34, 5); c.fill();
  c.beginPath(); c.arc(bx, by - 38, 7, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#6f6c65";
  c.fillRect(bx - 6, by - 18, 12, 4);
  c.fillRect(bx - 3, by - 41, 2, 2);
  c.fillRect(bx + 1, by - 41, 2, 2);
  c.fillStyle = "rgba(255,255,255,0.12)";
  c.fillRect(bx - 7, by - 32, 3, 28);
}

// A khata you can walk into, seen from outside: a deep hipped thatch roof
// over the whole footprint and the whitewashed front wall with its door.
// `alpha` fades it out while the kobzar is inside (the room shows through).
export function drawKhataBig(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, seed: number, alpha: number, smoke = true): void {
  if (alpha <= 0.01) return;
  c.save();
  c.globalAlpha = alpha;
  const front = 64; // height of the visible front wall
  const wallTop = y + h - front;
  // shadow on the ground
  c.fillStyle = "rgba(30,50,20,0.28)";
  c.beginPath(); c.ellipse(x + w / 2, y + h + 8, w * 0.58, 13, 0, 0, Math.PI * 2); c.fill();
  // front wall
  c.fillStyle = "#f3eee3";
  rr(c, x, wallTop, w, front, 4); c.fill();
  c.fillStyle = "rgba(150,140,120,0.18)";
  c.fillRect(x + w * 0.74, wallTop, w * 0.26, front);
  c.fillStyle = "#a8643c";
  rr(c, x - 4, y + h - 12, w + 8, 12, 3); c.fill();
  // door (matches the gap in the walls: houseSolids, DOOR_GAP 46)
  const dx = x + w / 2 - 17;
  c.fillStyle = "#e4dccb";
  c.fillRect(dx - 3, y + h - 54, 40, 44);
  c.fillStyle = "#5a3a22";
  rr(c, dx, y + h - 51, 34, 41, 2); c.fill();
  c.fillStyle = "#46301c";
  c.fillRect(dx + 16, y + h - 51, 2, 41);
  c.fillStyle = "#d9a441";
  c.fillRect(dx + 25, y + h - 32, 3, 3);
  // windows either side
  for (const wx of [x + 34, x + w - 70]) {
    const wy = wallTop + 14;
    c.fillStyle = "#3f63a8";
    rr(c, wx - 3, wy - 3, 42, 30, 3); c.fill();
    c.fillStyle = "#ffe2a4";
    c.fillRect(wx, wy, 36, 24);
    c.fillStyle = "#3f63a8";
    c.fillRect(wx + 17, wy, 2, 24);
    c.fillRect(wx, wy + 11, 36, 2);
    for (let i = 0; i < 5; i++) {
      c.fillStyle = i % 2 ? "#c8402e" : "#3f7a2e";
      c.beginPath(); c.arc(wx + 4 + i * 7, wy - 8 - (i === 2 ? 2 : 0), 2.2, 0, Math.PI * 2); c.fill();
    }
  }
  // the roof: back slope (darker), ridge, front slope over the eave
  const eave = wallTop + 6;
  const ridge = y + (eave - y) * 0.42;
  c.fillStyle = "#86672f";
  c.beginPath();
  c.moveTo(x - 16, ridge); c.quadraticCurveTo(x - 18, y - 6, x + w * 0.2, y - 14);
  c.lineTo(x + w * 0.8, y - 14); c.quadraticCurveTo(x + w + 18, y - 6, x + w + 16, ridge);
  c.closePath(); c.fill();
  c.fillStyle = "#b8954f";
  c.beginPath();
  c.moveTo(x - 18, eave + 4); c.lineTo(x - 16, ridge); c.lineTo(x + w + 16, ridge); c.lineTo(x + w + 18, eave + 4);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(110,82,36,0.42)";
  c.lineWidth = 1.2;
  for (let i = 0; i < 34; i++) {
    const px = x - 14 + (i / 33) * (w + 28);
    c.beginPath(); c.moveTo(px, ridge + 2); c.lineTo(px + (hash2(i, seed) - 0.5) * 5, eave + 2); c.stroke();
  }
  c.strokeStyle = "rgba(90,66,28,0.35)";
  for (let i = 0; i < 24; i++) {
    const px = x - 10 + (i / 23) * (w + 20);
    c.beginPath(); c.moveTo(px, y - 10); c.lineTo(px + (hash2(seed, i) - 0.5) * 4, ridge - 2); c.stroke();
  }
  c.fillStyle = "#7d6030";
  rr(c, x - 18, ridge - 4, w + 36, 8, 4); c.fill();
  c.fillStyle = "#7d6030";
  c.fillRect(x - 18, eave + 2, w + 36, 6);
  c.fillStyle = "rgba(60,40,20,0.18)";
  c.fillRect(x, eave + 8, w, 6);
  // clay chimney with smoke
  const chx = x + w * 0.66;
  const chy = ridge - 26;
  c.fillStyle = "#e9e3d6";
  c.fillRect(chx, chy, 16, 26);
  c.fillStyle = "#c9c0ae";
  c.fillRect(chx - 2, chy - 3, 20, 5);
  for (let i = 0; i < (smoke ? 3 : 0); i++) {
    const ph = (t * 0.00016 + i / 3 + hash2(seed, i)) % 1;
    c.fillStyle = `rgba(240,238,232,${0.45 * (1 - ph)})`;
    c.beginPath();
    c.arc(chx + 8 + ph * 16 + Math.sin(ph * 6 + seed) * 3, chy - 6 - ph * 44, 4 + ph * 8, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

// The otaman's khata: the richest house on the khutir, and it shows.
// Longer (two rooms through the siny), whitewashed with a touch of blue,
// a shingled (gont) roof instead of thatch, red shutters on four windows,
// a carved porch (ganok) over a double door, and a brick chimney.
export function drawOtamanKhata(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, alpha: number): void {
  if (alpha <= 0.01) return;
  c.save();
  c.globalAlpha = alpha;
  const front = 70;
  const wallTop = y + h - front;
  c.fillStyle = "rgba(30,50,20,0.28)";
  c.beginPath(); c.ellipse(x + w / 2, y + h + 10, w * 0.58, 15, 0, 0, Math.PI * 2); c.fill();
  // front wall, blued whitewash, and the red-ochre pryzba along its foot
  c.fillStyle = "#e6eef3";
  rr(c, x, wallTop, w, front, 4); c.fill();
  c.fillStyle = "rgba(120,140,160,0.16)";
  c.fillRect(x + w * 0.8, wallTop, w * 0.2, front);
  c.fillStyle = "#b0583a";
  rr(c, x - 4, y + h - 14, w + 8, 14, 3); c.fill();
  // a painted band under the eaves
  c.fillStyle = "#3f63a8";
  c.fillRect(x, wallTop + 6, w, 3);
  for (let fx = x + 10; fx < x + w - 6; fx += 18) {
    c.fillStyle = ((fx - x) / 18) % 2 < 1 ? "#c8402e" : "#e8a33a";
    c.beginPath(); c.arc(fx, wallTop + 14, 2, 0, Math.PI * 2); c.fill();
  }
  // four windows with red shutters (vikonnytsi) folded back
  for (const wx of [x + 30, x + 92, x + 250, x + 316]) {
    const wy = wallTop + 22;
    c.fillStyle = "#a8322a";
    c.fillRect(wx - 12, wy - 2, 10, 30);
    c.fillRect(wx + 34, wy - 2, 10, 30);
    c.fillStyle = "#e8c66a";
    c.fillRect(wx - 9, wy + 4, 4, 18);
    c.fillRect(wx + 37, wy + 4, 4, 18);
    c.fillStyle = "#ffe2a4";
    c.fillRect(wx, wy, 32, 26);
    c.fillStyle = "#2c4a8a";
    c.fillRect(wx + 15, wy, 2, 26);
    c.fillRect(wx, wy + 12, 32, 2);
    c.strokeStyle = "#2c4a8a"; c.lineWidth = 2;
    c.strokeRect(wx, wy, 32, 26);
  }
  // the double door under the porch
  const dx = x + w / 2 - 20;
  c.fillStyle = "#3c5a3a";
  rr(c, dx, y + h - 58, 40, 46, 2); c.fill();
  c.fillStyle = "#2c442c";
  c.fillRect(dx + 19, y + h - 58, 2, 46);
  c.fillStyle = "#d9a441";
  c.fillRect(dx + 14, y + h - 36, 3, 3);
  c.fillRect(dx + 23, y + h - 36, 3, 3);
  // the ganok: two carved posts, a little shingled gable, wooden steps
  c.fillStyle = "#8a5a2e";
  rr(c, dx - 16, y + h - 2, 72, 12, 2); c.fill();
  c.fillStyle = "#6e4525";
  c.fillRect(dx - 12, y + h + 6, 64, 4);
  for (const px of [dx - 14, dx + 48]) {
    c.fillStyle = "#7a4a24";
    c.fillRect(px, y + h - 66, 6, 72);
    c.fillStyle = "#a8743c";
    for (let k = 0; k < 4; k++) c.fillRect(px - 1, y + h - 56 + k * 16, 8, 3);
  }
  c.fillStyle = "#5e4c3c";
  c.beginPath();
  c.moveTo(dx - 22, y + h - 64); c.lineTo(dx + 20, y + h - 90); c.lineTo(dx + 62, y + h - 64);
  c.closePath(); c.fill();
  c.strokeStyle = "#d9c79a"; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(dx - 18, y + h - 66); c.lineTo(dx + 20, y + h - 88); c.lineTo(dx + 58, y + h - 66); c.stroke();
  c.fillStyle = "#e8c66a";
  c.beginPath(); c.arc(dx + 20, y + h - 74, 3.4, 0, Math.PI * 2); c.fill();
  // the roof: shingles in staggered rows, back slope darker, a carved ridge
  const eave = wallTop + 6;
  const ridge = y + (eave - y) * 0.42;
  c.fillStyle = "#4e4036";
  c.beginPath();
  c.moveTo(x - 14, ridge); c.lineTo(x + w * 0.12, y - 12); c.lineTo(x + w * 0.88, y - 12); c.lineTo(x + w + 14, ridge);
  c.closePath(); c.fill();
  c.fillStyle = "#6b5a4a";
  c.beginPath();
  c.moveTo(x - 18, eave + 4); c.lineTo(x - 14, ridge); c.lineTo(x + w + 14, ridge); c.lineTo(x + w + 18, eave + 4);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(40,30,24,0.45)"; c.lineWidth = 1;
  let row = 0;
  for (let ry = ridge + 8; ry < eave + 4; ry += 8, row++) {
    c.beginPath(); c.moveTo(x - 16, ry); c.lineTo(x + w + 16, ry); c.stroke();
    for (let rx = x - 14 + (row % 2) * 7; rx < x + w + 14; rx += 14) {
      c.beginPath(); c.moveTo(rx, ry - 8); c.lineTo(rx, ry); c.stroke();
    }
  }
  c.strokeStyle = "rgba(30,24,20,0.35)";
  for (let ry = y - 4; ry < ridge; ry += 8) {
    c.beginPath(); c.moveTo(x + w * 0.1, ry); c.lineTo(x + w * 0.9, ry); c.stroke();
  }
  c.fillStyle = "#3a2e26";
  rr(c, x - 16, ridge - 4, w + 32, 8, 3); c.fill();
  c.fillStyle = "#a8743c";
  for (let px = x; px < x + w; px += 20) c.fillRect(px, ridge - 7, 4, 4);
  c.fillStyle = "#3a2e26";
  c.fillRect(x - 18, eave + 2, w + 36, 6);
  c.fillStyle = "rgba(60,40,20,0.2)";
  c.fillRect(x, eave + 8, w, 6);
  // a brick chimney over the khata half, smoking
  const chx = x + w * 0.2;
  const chy = ridge - 28;
  c.fillStyle = "#a84a32";
  c.fillRect(chx, chy, 18, 28);
  c.strokeStyle = "rgba(60,20,10,0.4)"; c.lineWidth = 1;
  for (let by = chy + 6; by < chy + 28; by += 6) { c.beginPath(); c.moveTo(chx, by); c.lineTo(chx + 18, by); c.stroke(); }
  c.fillStyle = "#7a3424";
  c.fillRect(chx - 2, chy - 3, 22, 5);
  for (let i = 0; i < 3; i++) {
    const ph = (t * 0.00016 + i / 3) % 1;
    c.fillStyle = `rgba(240,238,232,${0.45 * (1 - ph)})`;
    c.beginPath();
    c.arc(chx + 9 + ph * 16 + Math.sin(ph * 6) * 3, chy - 6 - ph * 44, 4 + ph * 8, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

// The otaman's korohva: a crimson banner on a tall pole by his porch,
// lifting and falling with the steppe wind.
export function drawKorohva(c: CanvasRenderingContext2D, x: number, y: number, t: number, dir: 1 | -1 = 1): void {
  c.fillStyle = "rgba(30,50,20,0.25)";
  c.beginPath(); c.ellipse(x, y + 2, 10, 4, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#6e4525";
  c.fillRect(x - 2, y - 150, 4, 152);
  c.fillStyle = "#d9a441";
  c.beginPath(); c.moveTo(x, y - 162); c.lineTo(x + 4, y - 150); c.lineTo(x - 4, y - 150); c.closePath(); c.fill();
  c.fillStyle = "#a8222a";
  c.beginPath();
  c.moveTo(x + dir * 2, y - 148);
  for (let i = 0; i <= 10; i++) {
    const fx = x + dir * (2 + i * 5.4);
    c.lineTo(fx, y - 148 + Math.sin(t * 0.004 + i * 0.7) * 3 * (i / 10));
  }
  for (let i = 10; i >= 0; i--) {
    const fx = x + dir * (2 + i * 5.4);
    c.lineTo(fx, y - 112 + Math.sin(t * 0.004 + i * 0.7) * 3 * (i / 10));
  }
  c.closePath(); c.fill();
  // a gold cross on it, as on the Zaporozhian banners
  const cx = x + dir * 26;
  const cy = y - 130 + Math.sin(t * 0.004 + 4.5 * 0.7) * 1.4;
  c.fillStyle = "#e8c66a";
  c.fillRect(cx - 1.5, cy - 8, 3, 16);
  c.fillRect(cx - 6, cy - 3, 12, 3);
}

// The korchma on the chumak road: a long log house (zrub, not clay — it
// was put up fast, for travellers), a shaggy dark thatch, small warm
// windows, a door that stands open all evening, a hitching rail and
// barrels, and over the door the vykha: a sheaf of straw on a pole, which
// is how a korchma tells the steppe what it is.
export function drawKorchma(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, alpha: number): void {
  if (alpha <= 0.01) return;
  c.save();
  c.globalAlpha = alpha;
  const front = 72;
  const wallTop = y + h - front;
  c.fillStyle = "rgba(30,50,20,0.28)";
  c.beginPath(); c.ellipse(x + w / 2, y + h + 10, w * 0.6, 15, 0, 0, Math.PI * 2); c.fill();
  // log wall: rows of round logs, their cut ends showing at the corners
  c.fillStyle = "#8a5a32";
  c.fillRect(x, wallTop, w, front);
  for (let ly = wallTop; ly < y + h; ly += 9) {
    c.fillStyle = (ly - wallTop) % 18 ? "#7e5230" : "#94633a";
    c.fillRect(x, ly, w, 8);
    c.fillStyle = "rgba(255,220,160,0.12)";
    c.fillRect(x, ly + 1, w, 1.6);
    c.fillStyle = "rgba(40,24,10,0.4)";
    c.fillRect(x, ly + 7.4, w, 1.4);
    for (const ex of [x - 4, x + w - 4]) {
      c.fillStyle = "#6e4525";
      c.beginPath(); c.arc(ex + 4, ly + 4.4, 4.6, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#c9a06a";
      c.beginPath(); c.arc(ex + 4, ly + 4.4, 2.8, 0, Math.PI * 2); c.fill();
    }
  }
  // small windows, lamplit from inside
  for (const wx of [x + 34, x + 96, x + w - 126, x + w - 64]) {
    const wy = wallTop + 18;
    c.fillStyle = "#4e3018";
    c.fillRect(wx - 3, wy - 3, 32, 26);
    c.fillStyle = "#ffcf7a";
    c.fillRect(wx, wy, 26, 20);
    c.fillStyle = "#4e3018";
    c.fillRect(wx + 12, wy, 2, 20);
  }
  // the door, standing open: warm light and noise spill onto the yard
  const dx = x + w / 2 - 22;
  c.fillStyle = "#4e3018";
  c.fillRect(dx - 4, y + h - 62, 52, 62);
  c.fillStyle = "#3a2010";
  c.fillRect(dx, y + h - 58, 44, 58);
  const glow = 0.55 + Math.sin(t * 0.004) * 0.08;
  c.fillStyle = `rgba(255,190,100,${glow})`;
  c.fillRect(dx + 4, y + h - 54, 36, 54);
  c.fillStyle = "#6e4525";
  c.fillRect(dx - 12, y + h - 58, 10, 58); // the door leaf swung out
  // the vykha: a sheaf of straw hung on a pole over the door
  c.strokeStyle = "#5a3a22"; c.lineWidth = 3;
  c.beginPath(); c.moveTo(dx + 22, y + h - 66); c.lineTo(dx + 62, y + h - 92); c.stroke();
  const sway = Math.sin(t * 0.003) * 2;
  c.fillStyle = "#e0bd5a";
  c.beginPath();
  c.moveTo(dx + 58 + sway, y + h - 90); c.lineTo(dx + 68 + sway, y + h - 66); c.lineTo(dx + 50 + sway, y + h - 66);
  c.closePath(); c.fill();
  c.fillStyle = "#b8862a";
  c.fillRect(dx + 54 + sway, y + h - 82, 10, 3);
  // a bench under the windows, barrels, and the hitching rail
  c.fillStyle = "#6e4525";
  c.fillRect(x + 28, y + h - 6, 70, 6);
  for (const bx of [x + w - 40, x + w - 20]) {
    c.fillStyle = "#7a4a24";
    rr(c, bx - 9, y + h - 22, 18, 24, 4); c.fill();
    c.fillStyle = "#3a3230";
    c.fillRect(bx - 9, y + h - 17, 18, 2); c.fillRect(bx - 9, y + h - 6, 18, 2);
  }
  c.fillStyle = "#5a3a22";
  c.fillRect(x + w + 12, y + h - 26, 5, 30);
  c.fillRect(x + w + 52, y + h - 26, 5, 30);
  c.fillRect(x + w + 10, y + h - 24, 50, 4);
  // the roof: deep, shaggy, darker thatch than the khaty
  const eave = wallTop + 6;
  const ridge = y + (eave - y) * 0.4;
  c.fillStyle = "#6e5428";
  c.beginPath();
  c.moveTo(x - 18, ridge); c.quadraticCurveTo(x - 20, y - 8, x + w * 0.18, y - 16);
  c.lineTo(x + w * 0.82, y - 16); c.quadraticCurveTo(x + w + 20, y - 8, x + w + 18, ridge);
  c.closePath(); c.fill();
  c.fillStyle = "#9c7a3c";
  c.beginPath();
  c.moveTo(x - 22, eave + 6); c.lineTo(x - 18, ridge); c.lineTo(x + w + 18, ridge); c.lineTo(x + w + 22, eave + 6);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(80,58,24,0.5)"; c.lineWidth = 1.3;
  for (let i = 0; i < 40; i++) {
    const px = x - 18 + (i / 39) * (w + 36);
    c.beginPath(); c.moveTo(px, ridge + 2); c.lineTo(px + (hash2(i, 7) - 0.5) * 7, eave + 5 + hash2(i, 3) * 4); c.stroke();
  }
  c.fillStyle = "#5e4620";
  rr(c, x - 20, ridge - 5, w + 40, 9, 4); c.fill();
  // the ragged eave
  c.fillStyle = "#7d6030";
  for (let i = 0; i < 36; i++) {
    const px = x - 22 + (i / 35) * (w + 44);
    c.beginPath(); c.moveTo(px - 6, eave + 4); c.lineTo(px + 6, eave + 4); c.lineTo(px + (hash2(i, 9) - 0.5) * 4, eave + 10 + hash2(i, 11) * 4); c.closePath(); c.fill();
  }
  // clay chimney, smoking hard: the pich is always going here
  const chx = x + w * 0.16;
  const chy = ridge - 26;
  c.fillStyle = "#d9d0bc";
  c.fillRect(chx, chy, 16, 26);
  c.fillStyle = "#b9ae98";
  c.fillRect(chx - 2, chy - 3, 20, 5);
  for (let i = 0; i < 4; i++) {
    const ph = (t * 0.0002 + i / 4) % 1;
    c.fillStyle = `rgba(230,228,222,${0.5 * (1 - ph)})`;
    c.beginPath();
    c.arc(chx + 8 + ph * 20 + Math.sin(ph * 6) * 3, chy - 6 - ph * 50, 4 + ph * 9, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

// The kaplytsia at the head of the maidan: a small log chapel of pale
// pine, like the Sich church in miniature — a shingled roof, one dark
// onion dome on a drum, a gold cross, an arched door facing the fire.
export function drawKaplytsia(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number): void {
  const base = y + h;
  const wallH = 52;
  const top = base - wallH;
  c.fillStyle = "rgba(30,50,20,0.28)";
  c.beginPath(); c.ellipse(x + w / 2, base + 6, w * 0.7, 10, 0, 0, Math.PI * 2); c.fill();
  // log walls, pale pine
  for (let ly = top; ly < base; ly += 7) {
    c.fillStyle = (ly - top) % 14 < 7 ? "#d4a868" : "#c8995a";
    c.fillRect(x, ly, w, 6.4);
    c.fillStyle = "rgba(90,60,26,0.35)";
    c.fillRect(x, ly + 6, w, 1);
  }
  c.fillStyle = "rgba(120,80,30,0.2)";
  c.fillRect(x + w * 0.75, top, w * 0.25, wallH);
  // the arched door and two narrow windows
  const dx = x + w / 2;
  c.fillStyle = "#5a3a22";
  c.beginPath();
  c.moveTo(dx - 11, base); c.lineTo(dx - 11, base - 26); c.quadraticCurveTo(dx, base - 40, dx + 11, base - 26); c.lineTo(dx + 11, base);
  c.closePath(); c.fill();
  c.fillStyle = "#d9a441";
  c.fillRect(dx + 5, base - 16, 2, 3);
  for (const wx of [x + 10, x + w - 18]) {
    c.fillStyle = "#3f4a5a";
    c.beginPath(); c.moveTo(wx, top + 30); c.lineTo(wx, top + 16); c.quadraticCurveTo(wx + 4, top + 10, wx + 8, top + 16); c.lineTo(wx + 8, top + 30); c.closePath(); c.fill();
    c.fillStyle = "rgba(255,210,120,0.5)";
    c.fillRect(wx + 2, top + 20, 4, 8);
  }
  c.fillStyle = "#8a6238";
  rr(c, dx - 18, base - 2, 36, 6, 2); c.fill();
  // the shingled roof: a deep gable whose eaves overhang the logs
  const ridge = top - 30;
  c.fillStyle = "#4e4036";
  c.beginPath();
  c.moveTo(x - 10, top + 4); c.lineTo(x + w / 2, ridge); c.lineTo(x + w + 10, top + 4);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(30,22,16,0.45)"; c.lineWidth = 1;
  for (let i = 1; i < 5; i++) {
    const yy = ridge + (top + 4 - ridge) * (i / 5);
    const half = (w / 2 + 10) * (i / 5);
    c.beginPath(); c.moveTo(x + w / 2 - half, yy); c.lineTo(x + w / 2 + half, yy); c.stroke();
  }
  c.fillStyle = "#3a2e26";
  c.fillRect(x - 12, top + 2, w + 24, 4);
  // the drum and the onion dome, and the cross catching the light
  const cx = x + w / 2;
  c.fillStyle = "#c8995a";
  c.fillRect(cx - 11, ridge - 18, 22, 22);
  c.fillStyle = "#4e4036";
  c.fillRect(cx - 14, ridge - 20, 28, 4);
  c.fillStyle = "#3e342c";
  c.beginPath();
  c.moveTo(cx - 14, ridge - 20);
  c.bezierCurveTo(cx - 18, ridge - 34, cx - 4, ridge - 38, cx, ridge - 48);
  c.bezierCurveTo(cx + 4, ridge - 38, cx + 18, ridge - 34, cx + 14, ridge - 20);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(255,230,180,0.18)"; c.lineWidth = 1;
  c.beginPath(); c.moveTo(cx - 6, ridge - 24); c.quadraticCurveTo(cx - 6, ridge - 36, cx - 1, ridge - 44); c.stroke();
  const glint = 0.75 + Math.sin(t * 0.002) * 0.25;
  c.fillStyle = `rgba(232,198,106,${glint})`;
  c.fillRect(cx - 1.2, ridge - 64, 2.4, 17);
  c.fillRect(cx - 6, ridge - 59, 12, 2.4);
  c.fillRect(cx - 4, ridge - 53, 8, 2);
}

// Taras Dovhyi's pustka: a khata nobody has whitewashed in seven years.
// The same khata as the others underneath (drawKhataBig), gone grey, the
// clay showing through, the windows boarded, the door hanging ajar, a hole
// rotted through the thatch, and weeds up to the sill.
export function drawPustka(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, alpha: number): void {
  if (alpha <= 0.01) return;
  drawKhataBig(c, x, y, w, h, t, 77, alpha, false); // nobody lights the pich
  c.save();
  c.globalAlpha = alpha;
  const wallTop = y + h - 64;
  // grime and the clay showing through where the whitewash fell away
  c.fillStyle = "rgba(90,84,70,0.32)";
  c.fillRect(x, wallTop + 6, w, 52);
  c.fillStyle = "#a88a62";
  for (let i = 0; i < 9; i++) {
    const px = x + 8 + hash2(i, 5) * (w - 30);
    const py = wallTop + 10 + hash2(i, 9) * 40;
    c.beginPath(); c.ellipse(px, py, 5 + hash2(i, 13) * 9, 3 + hash2(i, 17) * 4, 0, 0, Math.PI * 2); c.fill();
  }
  // boarded windows
  for (const wx of [x + 34, x + w - 70]) {
    const wy = wallTop + 14;
    c.fillStyle = "#3a342c";
    c.fillRect(wx, wy, 36, 24);
    c.fillStyle = "#7a6248";
    c.save(); c.translate(wx + 18, wy + 12); c.rotate(-0.25); c.fillRect(-22, -4, 44, 6); c.restore();
    c.save(); c.translate(wx + 18, wy + 12); c.rotate(0.3); c.fillRect(-22, -3, 44, 5); c.restore();
  }
  // the door, hanging ajar on one hinge: dark inside
  const dx = x + w / 2 - 17;
  c.fillStyle = "#1e1a16";
  c.fillRect(dx, y + h - 51, 34, 41);
  c.fillStyle = "#5e4a36";
  c.save(); c.translate(dx, y + h - 51); c.rotate(-0.08); c.fillRect(0, 0, 12, 41); c.restore();
  // a hole rotted through the thatch, ribs of the roof showing
  const eave = wallTop + 6;
  const ridge = y + (eave - y) * 0.42;
  const hx = x + w * 0.62;
  const hy = (ridge + eave) / 2;
  c.fillStyle = "#2a241c";
  c.beginPath(); c.ellipse(hx, hy, 22, 11, 0.1, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#6e5a3a"; c.lineWidth = 2;
  for (const o of [-12, 0, 12]) { c.beginPath(); c.moveTo(hx + o - 4, hy - 10); c.lineTo(hx + o + 4, hy + 10); c.stroke(); }
  // the thatch grey and sagging; weeds along the pryzba
  c.fillStyle = "rgba(70,70,64,0.3)";
  c.fillRect(x - 18, ridge, w + 36, eave - ridge + 6);
  c.strokeStyle = "#5d7a3a"; c.lineWidth = 1.6;
  for (let i = 0; i < 22; i++) {
    const px = x - 6 + (i / 21) * (w + 12);
    if (Math.abs(px - (x + w / 2)) < 24) continue;
    const ht = 8 + hash2(i, 23) * 12;
    c.beginPath(); c.moveTo(px, y + h); c.quadraticCurveTo(px + 3, y + h - ht / 2, px + (hash2(i, 29) - 0.5) * 6, y + h - ht); c.stroke();
  }
  c.restore();
}

// The windmill (vitriak), walk-in: a post mill whose body is one room of
// boards. Seen from outside: the board walls on their post-frame, a short
// ladder to the door, a gable roof of boards, and the sails on the gable,
// turning. When the kobzar is inside the walls and roof lift away like a
// khata's, and the sails grow faint (they are still there, overhead).
export function drawMlyn(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, alpha: number): void {
  const INK = "rgba(34,22,14,0.85)";
  const ink = (lw = 1) => { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); };
  const front = 70;
  const wallTop = y + h - front;
  if (alpha > 0.01) {
    c.save();
    c.globalAlpha = alpha;
    c.fillStyle = "rgba(30,50,20,0.28)";
    c.beginPath(); c.ellipse(x + w / 2, y + h + 8, w * 0.6, 12, 0, 0, Math.PI * 2); c.fill();
    // the trestle legs it stands on, under the body
    c.fillStyle = "#5c4430";
    c.fillRect(x + 10, y + h - 10, 6, 12); c.fillRect(x + w - 16, y + h - 10, 6, 12);
    // the board walls, weathered
    const g = c.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, "#9a7048"); g.addColorStop(0.6, "#8a6440"); g.addColorStop(1, "#6a4a2c");
    c.fillStyle = g;
    c.beginPath(); c.rect(x, wallTop, w, front - 8); c.fill(); ink();
    c.strokeStyle = "rgba(50,32,16,0.45)"; c.lineWidth = 1;
    for (let bx = x + 10; bx < x + w; bx += 10) { c.beginPath(); c.moveTo(bx, wallTop + 2); c.lineTo(bx, y + h - 10); c.stroke(); }
    // the door and the little ladder up to it
    const dx = x + w / 2 - 16;
    c.fillStyle = "#3a2614";
    c.fillRect(dx, y + h - 52, 32, 44);
    c.fillStyle = "#5a3a22";
    c.fillRect(dx - 12, y + h - 50, 10, 42); // the door leaf, swung open
    c.strokeStyle = "#6e4a2a"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(dx + 4, y + h - 8); c.lineTo(dx + 2, y + h + 8); c.moveTo(dx + 28, y + h - 8); c.lineTo(dx + 30, y + h + 8); c.stroke();
    c.lineWidth = 1.6;
    for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(dx + 3, y + h - 4 + k * 5); c.lineTo(dx + 29, y + h - 4 + k * 5); c.stroke(); }
    // a little window high up
    c.fillStyle = "#2e2418"; c.fillRect(x + 18, wallTop + 12, 16, 12);
    c.fillStyle = "rgba(255,220,150,0.25)"; c.fillRect(x + 20, wallTop + 14, 12, 8);
    // the gable roof of boards, steep
    const ridge = y - 26;
    c.fillStyle = "#5e4630";
    c.beginPath(); c.moveTo(x - 10, wallTop + 4); c.lineTo(x + w / 2, ridge); c.lineTo(x + w + 10, wallTop + 4); c.closePath(); c.fill(); ink(1.1);
    c.strokeStyle = "rgba(30,20,10,0.4)"; c.lineWidth = 1;
    for (let k = 1; k < 7; k++) {
      const yy = ridge + ((wallTop + 4 - ridge) * k) / 7;
      const half = ((w / 2 + 10) * k) / 7;
      c.beginPath(); c.moveTo(x + w / 2 - half, yy); c.lineTo(x + w / 2 + half, yy); c.stroke();
    }
    c.restore();
  }
  // the sails on the gable: still there, faintly, when the walls are gone
  c.save();
  c.globalAlpha = 0.3 + 0.7 * alpha;
  const hubX = x + w / 2;
  const hubY = y + 6;
  const a0 = t * 0.0004;
  for (let i = 0; i < 4; i++) {
    const a = a0 + (i * Math.PI) / 2;
    const ex = hubX + Math.cos(a) * 92;
    const ey = hubY + Math.sin(a) * 92;
    c.strokeStyle = "#4e3826"; c.lineWidth = 4;
    c.beginPath(); c.moveTo(hubX, hubY); c.lineTo(ex, ey); c.stroke();
    const nx = -Math.sin(a) * 15;
    const ny = Math.cos(a) * 15;
    c.fillStyle = "rgba(232,222,198,0.85)";
    c.beginPath();
    c.moveTo(hubX + Math.cos(a) * 22, hubY + Math.sin(a) * 22);
    c.lineTo(ex, ey); c.lineTo(ex + nx, ey + ny);
    c.lineTo(hubX + Math.cos(a) * 22 + nx, hubY + Math.sin(a) * 22 + ny);
    c.closePath(); c.fill(); ink(0.8);
    c.strokeStyle = "rgba(90,70,40,0.6)"; c.lineWidth = 0.8;
    for (let k = 1; k < 5; k++) {
      const r = 22 + k * 14;
      c.beginPath(); c.moveTo(hubX + Math.cos(a) * r, hubY + Math.sin(a) * r); c.lineTo(hubX + Math.cos(a) * r + nx, hubY + Math.sin(a) * r + ny); c.stroke();
    }
  }
  c.fillStyle = "#3a2a1c";
  c.beginPath(); c.arc(hubX, hubY, 6, 0, Math.PI * 2); c.fill();
  c.restore();
}

// --- The sabbath's hiding places, from outside (data/hideouts.ts) ---------------
// Each is a walk-in building: what stands over the room fades when the
// kobzar is inside (alpha), like a khata's roof.

// The old hollow oak in the south forest: a vast trunk whose hollow is the
// door, under a heavy crown. Motrya sleeps inside by day.
export function drawDuplo(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, alpha: number): void {
  if (alpha <= 0.01) return;
  void t;
  const INK = "rgba(24,18,10,0.85)";
  const cx = x + w / 2;
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = "rgba(16,28,10,0.35)";
  c.beginPath(); c.ellipse(cx + 16, y + h + 6, w * 0.9, 20, 0, 0, Math.PI * 2); c.fill();
  // roots spreading into the ground
  c.strokeStyle = "#4e3620"; c.lineCap = "round";
  for (const [ex, ey, lw] of [[-70, 10, 9], [-40, 16, 7], [62, 12, 9], [34, 18, 6]] as const) {
    c.lineWidth = lw + 2; c.strokeStyle = INK;
    c.beginPath(); c.moveTo(cx + ex * 0.3, y + h - 8); c.quadraticCurveTo(cx + ex * 0.7, y + h, cx + ex, y + h + ey); c.stroke();
    c.lineWidth = lw; c.strokeStyle = "#5d4228";
    c.beginPath(); c.moveTo(cx + ex * 0.3, y + h - 8); c.quadraticCurveTo(cx + ex * 0.7, y + h, cx + ex, y + h + ey); c.stroke();
  }
  c.lineCap = "butt";
  // the trunk, wider than a khata's door is tall, covering the room
  const g = c.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, "#7a5a3a"); g.addColorStop(0.5, "#5d4228"); g.addColorStop(1, "#3a2818");
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x - 4, y + h); c.quadraticCurveTo(x - 2, y + h * 0.4, x + 10, y - 40);
  c.lineTo(x + w - 10, y - 40); c.quadraticCurveTo(x + w + 2, y + h * 0.4, x + w + 4, y + h); c.closePath(); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  c.strokeStyle = "rgba(30,20,10,0.4)"; c.lineWidth = 1.2;
  for (let k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(cx + k * 13, y + h - 4); c.quadraticCurveTo(cx + k * 11, y + h * 0.4, cx + k * 9, y - 36); c.stroke(); }
  // the hollow: the way in
  c.fillStyle = "#120c0a";
  c.beginPath(); c.ellipse(cx, y + h - 26, 20, 28, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#3e2a18"; c.lineWidth = 3; c.stroke();
  // the crown, dark and heavy over everything
  const lobes: Array<[number, number, number]> = [[0, -84, 62], [-62, -60, 46], [62, -62, 48], [-34, -112, 44], [36, -116, 44], [0, -44, 46]];
  c.fillStyle = "rgba(24,32,14,0.8)";
  for (const [lx, ly, r] of lobes) { c.beginPath(); c.arc(cx + lx, y + ly, r + 1.2, 0, Math.PI * 2); c.fill(); }
  const cg = c.createRadialGradient(cx - 30, y - 120, 10, cx, y - 70, 110);
  cg.addColorStop(0, "#4e7a32"); cg.addColorStop(1, "#1c3414");
  c.fillStyle = cg;
  for (const [lx, ly, r] of lobes) { c.beginPath(); c.arc(cx + lx, y + ly, r, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = "#8aa860";
  c.beginPath(); c.arc(cx + 44, y - 80, 9, 0, Math.PI * 2); c.fill(); // mistletoe
  c.restore();
}

// The steppe kurhan: a grassy mound with its stone baba on top and a
// timbered entrance dug into its south side. Opanas lives under it by day.
export function drawKurhanMound(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, alpha: number): void {
  if (alpha <= 0.01) return;
  void t;
  const INK = "rgba(24,20,10,0.8)";
  const cx = x + w / 2;
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = "rgba(30,40,14,0.3)";
  c.beginPath(); c.ellipse(cx + 8, y + h + 4, w * 0.6, 14, 0, 0, Math.PI * 2); c.fill();
  // the mound, dry steppe grass over old earth
  const g = c.createRadialGradient(cx - 30, y + 10, 10, cx, y + h * 0.6, w * 0.7);
  g.addColorStop(0, "#b8b070"); g.addColorStop(0.6, "#8e8a50"); g.addColorStop(1, "#6a6a3a");
  c.fillStyle = g;
  c.beginPath(); c.ellipse(cx, y + h * 0.6, w * 0.58, h * 0.62, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
  c.strokeStyle = "rgba(90,80,40,0.5)"; c.lineWidth = 1;
  for (let k = 0; k < 26; k++) {
    const a = (k / 26) * Math.PI * 2;
    const px = cx + Math.cos(a) * w * 0.45 * (0.6 + 0.4 * ((k * 37) % 7) / 7);
    const py = y + h * 0.6 + Math.sin(a) * h * 0.45 * 0.8;
    c.beginPath(); c.moveTo(px, py); c.lineTo(px + 2, py - 8); c.stroke();
  }
  // the timbered entrance
  c.fillStyle = "#1a1410";
  c.beginPath(); c.moveTo(cx - 22, y + h); c.lineTo(cx - 22, y + h - 30); c.quadraticCurveTo(cx, y + h - 40, cx + 22, y + h - 30); c.lineTo(cx + 22, y + h); c.closePath(); c.fill();
  c.fillStyle = "#6e4a2a";
  c.fillRect(cx - 26, y + h - 34, 6, 34); c.fillRect(cx + 20, y + h - 34, 6, 34); c.fillRect(cx - 28, y + h - 38, 56, 6);
  // the stone baba on top, weathered, hands on her belly
  const bx = cx;
  const by = y + 26;
  const sg = c.createLinearGradient(bx - 10, 0, bx + 10, 0);
  sg.addColorStop(0, "#b8b4a8"); sg.addColorStop(1, "#6e6a60");
  c.fillStyle = sg;
  c.beginPath(); c.moveTo(bx - 9, by); c.lineTo(bx - 8, by - 34); c.quadraticCurveTo(bx, by - 46, bx + 8, by - 34); c.lineTo(bx + 9, by); c.closePath(); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  c.strokeStyle = "rgba(40,36,30,0.6)";
  c.beginPath(); c.moveTo(bx - 6, by - 14); c.lineTo(bx + 6, by - 14); c.moveTo(bx - 3, by - 30); c.lineTo(bx - 1, by - 30); c.moveTo(bx + 1, by - 30); c.lineTo(bx + 3, by - 30); c.stroke();
  c.restore();
}

// Beelzebub's cave: a rock outcrop on the slope, its black mouth breathing
// warm, yellow air when he is home.
export function drawPechera(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, alpha: number, home: boolean): void {
  if (alpha <= 0.01) return;
  const INK = "rgba(18,14,22,0.85)";
  const cx = x + w / 2;
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = "rgba(10,8,16,0.4)";
  c.beginPath(); c.ellipse(cx + 10, y + h + 6, w * 0.62, 14, 0, 0, Math.PI * 2); c.fill();
  // the outcrop: piled slabs of grey-violet rock
  const slabs: Array<[number, number, number, number]> = [[0, 40, w * 0.56, h * 0.62], [-w * 0.3, 70, w * 0.3, h * 0.42], [w * 0.32, 66, w * 0.3, h * 0.44], [-10, -2, w * 0.36, h * 0.34]];
  for (const [ox, oy, rx, ry] of slabs) {
    const g = c.createLinearGradient(cx + ox - rx, 0, cx + ox + rx, 0);
    g.addColorStop(0, "#9894a2"); g.addColorStop(0.5, "#6e6a7a"); g.addColorStop(1, "#3e3a4a");
    c.fillStyle = g;
    c.beginPath(); c.ellipse(cx + ox, y + oy, rx, ry, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
  }
  c.strokeStyle = "rgba(20,16,26,0.5)"; c.lineWidth = 1;
  for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(cx - 60 + k * 24, y + 20 + (k % 2) * 18); c.lineTo(cx - 50 + k * 24, y + 46 + (k % 3) * 10); c.stroke(); }
  // the mouth
  c.fillStyle = "#0e0a10";
  c.beginPath(); c.moveTo(cx - 24, y + h); c.quadraticCurveTo(cx - 24, y + h - 40, cx, y + h - 46); c.quadraticCurveTo(cx + 24, y + h - 40, cx + 24, y + h); c.closePath(); c.fill();
  if (home) {
    const br = 0.3 + Math.sin(t * 0.0012) * 0.2;
    const gl = c.createRadialGradient(cx, y + h - 14, 2, cx, y + h - 14, 28);
    gl.addColorStop(0, `rgba(255,170,60,${br})`); gl.addColorStop(1, "rgba(255,170,60,0)");
    c.fillStyle = gl; c.fillRect(cx - 28, y + h - 46, 56, 46);
  }
  c.restore();
}
