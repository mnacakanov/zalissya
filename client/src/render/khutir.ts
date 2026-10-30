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
