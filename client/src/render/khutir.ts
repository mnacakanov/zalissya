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

export function drawCherry(c: CanvasRenderingContext2D, x: number, y: number, s: number, t: number): void {
  const sway = Math.sin(t * 0.0012 + x * 0.11) * 1.2;
  c.fillStyle = "rgba(30,50,20,0.25)";
  c.beginPath(); c.ellipse(x, y + 3, 22 * s, 7 * s, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#5a3a26";
  c.fillRect(x - 3 * s, y - 22 * s, 6 * s, 24 * s);
  c.strokeStyle = "#5a3a26";
  c.lineWidth = 2.4 * s;
  c.beginPath(); c.moveTo(x, y - 18 * s); c.lineTo(x - 10 * s, y - 30 * s); c.moveTo(x, y - 20 * s); c.lineTo(x + 9 * s, y - 32 * s); c.stroke();
  for (const [dx, dy, r, col] of [[-12, -38, 15, "#3f7a32"], [10, -40, 14, "#467f36"], [0, -50, 15, "#4c8a3a"]] as const) {
    c.fillStyle = col;
    c.beginPath(); c.arc(x + (dx + sway) * s, y + dy * s, r * s, 0, Math.PI * 2); c.fill();
  }
  // cherries
  c.fillStyle = "#b3122a";
  for (let i = 0; i < 9; i++) {
    const a = hash2(x + i, y) * Math.PI * 2;
    const r = 6 + hash2(i, x) * 10;
    c.beginPath(); c.arc(x + (Math.cos(a) * r + sway) * s, y + (-42 + Math.sin(a) * r * 0.8) * s, 2 * s, 0, Math.PI * 2); c.fill();
  }
}

export function drawWillow(c: CanvasRenderingContext2D, x: number, y: number, s: number, t: number): void {
  c.fillStyle = "rgba(30,50,20,0.25)";
  c.beginPath(); c.ellipse(x, y + 4, 30 * s, 8 * s, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#6a5a44";
  c.beginPath();
  c.moveTo(x - 6 * s, y + 2); c.lineTo(x - 3 * s, y - 40 * s); c.lineTo(x + 4 * s, y - 40 * s); c.lineTo(x + 7 * s, y + 2);
  c.closePath(); c.fill();
  c.fillStyle = "#7d9a4a";
  c.beginPath(); c.ellipse(x, y - 52 * s, 30 * s, 20 * s, 0, 0, Math.PI * 2); c.fill();
  // weeping fronds
  for (let i = 0; i < 16; i++) {
    const fx = x + (i - 7.5) * 4 * s;
    const sway = Math.sin(t * 0.0014 + i * 0.7 + x) * 3;
    c.strokeStyle = i % 2 ? "#8fae58" : "#6f8f40";
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(fx, y - 56 * s);
    c.quadraticCurveTo(fx + sway * 0.5, y - 34 * s, fx + sway, y - (12 + (i % 4) * 4) * s);
    c.stroke();
  }
}

// Вітряк — the windmill on the rise by the old millstone, sails turning.
export function drawWindmill(c: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  c.fillStyle = "rgba(30,50,20,0.3)";
  c.beginPath(); c.ellipse(x, y + 6, 40, 10, 0, 0, Math.PI * 2); c.fill();
  // legs / base
  c.fillStyle = "#5c4430";
  c.fillRect(x - 22, y - 20, 5, 26);
  c.fillRect(x + 17, y - 20, 5, 26);
  // body
  c.fillStyle = "#8a6440";
  c.beginPath();
  c.moveTo(x - 24, y - 18); c.lineTo(x - 18, y - 86); c.lineTo(x + 18, y - 86); c.lineTo(x + 24, y - 18);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(60,40,22,0.5)";
  c.lineWidth = 1.2;
  for (let ly = y - 80; ly < y - 18; ly += 8) { c.beginPath(); c.moveTo(x - 22, ly); c.lineTo(x + 22, ly); c.stroke(); }
  c.fillStyle = "#4a3320";
  c.fillRect(x - 6, y - 40, 12, 22);
  // roof
  c.fillStyle = "#6e543c";
  c.beginPath(); c.moveTo(x - 24, y - 84); c.lineTo(x, y - 110); c.lineTo(x + 24, y - 84); c.closePath(); c.fill();
  // sails
  const hubX = x;
  const hubY = y - 82;
  const a0 = t * 0.0004;
  for (let i = 0; i < 4; i++) {
    const a = a0 + (i * Math.PI) / 2;
    const ex = hubX + Math.cos(a) * 62;
    const ey = hubY + Math.sin(a) * 62;
    c.strokeStyle = "#5c4430";
    c.lineWidth = 3;
    c.beginPath(); c.moveTo(hubX, hubY); c.lineTo(ex, ey); c.stroke();
    // lattice sail
    const nx = -Math.sin(a) * 10;
    const ny = Math.cos(a) * 10;
    c.fillStyle = "rgba(232,222,198,0.75)";
    c.beginPath();
    c.moveTo(hubX + Math.cos(a) * 16, hubY + Math.sin(a) * 16);
    c.lineTo(ex, ey);
    c.lineTo(ex + nx, ey + ny);
    c.lineTo(hubX + Math.cos(a) * 16 + nx, hubY + Math.sin(a) * 16 + ny);
    c.closePath(); c.fill();
  }
  c.fillStyle = "#3a2a1c";
  c.beginPath(); c.arc(hubX, hubY, 4, 0, Math.PI * 2); c.fill();
}

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
export function drawKhataBig(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, seed: number, alpha: number): void {
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
  for (let i = 0; i < 3; i++) {
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
export function drawKorohva(c: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  c.fillStyle = "rgba(30,50,20,0.25)";
  c.beginPath(); c.ellipse(x, y + 2, 10, 4, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#6e4525";
  c.fillRect(x - 2, y - 150, 4, 152);
  c.fillStyle = "#d9a441";
  c.beginPath(); c.moveTo(x, y - 162); c.lineTo(x + 4, y - 150); c.lineTo(x - 4, y - 150); c.closePath(); c.fill();
  c.fillStyle = "#a8222a";
  c.beginPath();
  c.moveTo(x + 2, y - 148);
  for (let i = 0; i <= 10; i++) {
    const fx = x + 2 + i * 5.4;
    c.lineTo(fx, y - 148 + Math.sin(t * 0.004 + i * 0.7) * 3 * (i / 10));
  }
  for (let i = 10; i >= 0; i--) {
    const fx = x + 2 + i * 5.4;
    c.lineTo(fx, y - 112 + Math.sin(t * 0.004 + i * 0.7) * 3 * (i / 10));
  }
  c.closePath(); c.fill();
  // a gold cross on it, as on the Zaporozhian banners
  const cx = x + 26;
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
