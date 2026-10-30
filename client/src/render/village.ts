import { BOBBER, BREW_SPOT, CRUST_SPOT, type HerbDef } from "../data/items";
import { FIRE, GARDEN, POND, type TreeKind, WELL } from "../data/village";
import { rr } from "./shapes";
import { WORLD_H, WORLD_W } from "../world/areas";
import { clamp, hash2, type Rect } from "../world/geometry";

export function drawGround(c: CanvasRenderingContext2D, camX: number, camY: number, vw: number, vh: number, t: number) {
  const cell = 34;
  const x0 = Math.max(0, Math.floor(camX / cell) - 1);
  const y0 = Math.max(0, Math.floor(camY / cell) - 1);
  const x1 = Math.min(Math.ceil(WORLD_W / cell), Math.ceil((camX + vw) / cell) + 1);
  const y1 = Math.min(Math.ceil(WORLD_H / cell), Math.ceil((camY + vh) / cell) + 1);
  const shades = ["#6da344", "#6aa141", "#6ea646", "#68a03f"];
  for (let gy = y0; gy < y1; gy++) {
    for (let gx = x0; gx < x1; gx++) {
      const h = hash2(gx, gy);
      c.fillStyle = shades[Math.floor(h * shades.length)] ?? shades[0]!;
      c.fillRect(gx * cell - camX, gy * cell - camY, cell + 1, cell + 1);
      // grass blades
      c.strokeStyle = "rgba(46,84,28,0.35)";
      c.lineWidth = 1.4;
      const bx = gx * cell - camX;
      const by = gy * cell - camY;
      for (let b = 0; b < 3; b++) {
        const px = bx + hash2(gx * 7 + b, gy * 3) * cell;
        const py = by + hash2(gx * 5, gy * 9 + b) * cell;
        const sway = Math.sin(t * 0.0016 + px * 0.05 + py * 0.03) * 1.6;
        c.beginPath();
        c.moveTo(px, py);
        c.lineTo(px + sway, py - 5 - hash2(b, gx) * 3);
        c.stroke();
      }
      // wildflowers
      if (h > 0.9) {
        const fx = bx + 6 + hash2(gx, gy * 13) * 22;
        const fy = by + 6 + hash2(gx * 11, gy) * 22;
        const cols = ["#f5efdc", "#f2c14e", "#d96a5a", "#b48ad6"];
        const col = cols[Math.floor(hash2(gy, gx) * cols.length)] ?? "#fff";
        c.strokeStyle = "#4c7a2e";
        c.beginPath();
        c.moveTo(fx, fy + 4);
        c.lineTo(fx, fy);
        c.stroke();
        c.fillStyle = col;
        c.beginPath();
        c.arc(fx, fy - 1, 2.4, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#e8a020";
        c.fillRect(fx - 0.7, fy - 1.7, 1.4, 1.4);
      }
    }
  }

  // Dirt paths — a cross through the clearing.
  c.fillStyle = "#c8a568";
  rr(c, 0 - camX, 600 - camY, WORLD_W, 92, 40); c.fill();
  rr(c, 768 - camX, 120 - camY, 144, 900, 60); c.fill();
  c.fillStyle = "rgba(160,124,72,0.5)";
  for (let i = 0; i < 260; i++) {
    const onH = hash2(i, 77) > 0.35;
    const px = onH ? hash2(i, 1) * WORLD_W : 768 + hash2(i, 2) * 144;
    const py = onH ? 600 + hash2(i, 3) * 92 : 120 + hash2(i, 4) * 900;
    if (px < camX - 10 || px > camX + vw + 10 || py < camY - 10 || py > camY + vh + 10) continue;
    c.beginPath();
    c.arc(px - camX, py - camY, 1.6 + hash2(i, 5) * 2.6, 0, Math.PI * 2);
    c.fill();
  }

  // The Lysa Hora trail — a narrower spur leaving the clearing eastward,
  // climbing (in spirit) to the Bald Mountain. Two cairns mark the edge
  // where the village lets go of you.
  c.fillStyle = "#b99c62";
  rr(c, 1120 - camX, 416 - camY, WORLD_W - 1120, 72, 30); c.fill();
  for (const cy of [404, 502]) {
    const cx = WORLD_W - 26 - camX;
    const cyy = cy - camY;
    c.fillStyle = "#8d8b85";
    c.beginPath(); c.ellipse(cx, cyy + 8, 11, 5, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(cx, cyy + 2, 8, 4.4, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(cx, cyy - 3, 5, 3.4, 0, 0, Math.PI * 2); c.fill();
  }

  // Central clearing — worn pale earth around the fire.
  const grad = c.createRadialGradient(840 - camX, 640 - camY, 20, 840 - camX, 640 - camY, 210);
  grad.addColorStop(0, "rgba(216,182,120,0.55)");
  grad.addColorStop(1, "rgba(216,182,120,0)");
  c.fillStyle = grad;
  c.fillRect(840 - 210 - camX, 640 - 210 - camY, 420, 420);

  // Pond
  const px = POND.x - camX;
  const py = POND.y - camY;
  c.fillStyle = "#3f7089";
  c.beginPath(); c.ellipse(px, py, POND.rx + 8, POND.ry + 7, 0, 0, Math.PI * 2); c.fill();
  const pg = c.createRadialGradient(px - 30, py - 18, 12, px, py, POND.rx);
  pg.addColorStop(0, "#8fc3d4");
  pg.addColorStop(1, "#55879e");
  c.fillStyle = pg;
  c.beginPath(); c.ellipse(px, py, POND.rx, POND.ry, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(255,255,255,0.5)";
  c.lineWidth = 1.6;
  for (let i = 0; i < 5; i++) {
    const sx = px - 90 + hash2(i, 31) * 180;
    const sy = py - 40 + hash2(i, 47) * 80;
    const off = Math.sin(t * 0.002 + i * 1.7) * 4;
    c.beginPath();
    c.moveTo(sx + off, sy);
    c.lineTo(sx + off + 14, sy);
    c.stroke();
  }
  // lily pads
  c.fillStyle = "#4d8a3d";
  for (const [lx, ly] of [[-52, 16], [38, -26], [84, 22]] as const) {
    c.beginPath(); c.ellipse(px + lx, py + ly, 13, 8, 0.4, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = "#e88bb0";
  c.beginPath(); c.arc(px + 38, py - 28, 3.4, 0, Math.PI * 2); c.fill();
  // reeds + cattails at the near edge
  for (let i = 0; i < 9; i++) {
    const rx = px - 130 + i * 30 + hash2(i, 91) * 10;
    const ry = py + POND.ry - 6 + hash2(i, 93) * 12;
    c.strokeStyle = "#3e6b2a";
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx - 3, ry - 26); c.stroke();
    c.fillStyle = "#6e4a26";
    c.fillRect(rx - 4.4, ry - 30, 3, 11);
  }

  // Vij's hollow — a blighted circle at the north-east forest edge where
  // nothing green grows and the grass will not take.
  {
    const hx = 1420 - camX;
    const hy = 262 - camY;
    const hg = c.createRadialGradient(hx, hy, 12, hx, hy, 148);
    hg.addColorStop(0, "rgba(52,46,58,0.88)");
    hg.addColorStop(0.62, "rgba(66,60,66,0.6)");
    hg.addColorStop(1, "rgba(66,60,66,0)");
    c.fillStyle = hg;
    c.fillRect(hx - 148, hy - 148, 296, 296);
    // cracked dead earth
    c.strokeStyle = "rgba(24,20,30,0.55)";
    c.lineWidth = 1.4;
    for (let i = 0; i < 9; i++) {
      const a = hash2(i, 511) * Math.PI * 2;
      const r0 = 16 + hash2(i, 513) * 22;
      const r1 = r0 + 26 + hash2(i, 517) * 42;
      c.beginPath();
      c.moveTo(hx + Math.cos(a) * r0, hy + Math.sin(a) * r0 * 0.72);
      c.lineTo(hx + Math.cos(a + 0.24) * r1, hy + Math.sin(a + 0.24) * r1 * 0.72);
      c.stroke();
    }
    // a ring of old standing stones, leaning like bad teeth
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.4;
      const sx = hx + Math.cos(a) * 128;
      const sy = hy + Math.sin(a) * 88;
      const sh = 20 + hash2(i, 521) * 13;
      c.fillStyle = "#6d6a72";
      rr(c, sx - 5.5, sy - sh, 11, sh, 3); c.fill();
      c.fillStyle = "rgba(255,255,255,0.14)";
      rr(c, sx - 5.5, sy - sh, 4.4, sh, 2); c.fill();
    }
    // dead snags — bare branches over the hollow
    c.strokeStyle = "#3c3630";
    c.lineWidth = 3;
    for (const [dx, dy] of [[-104, -52], [112, -38]] as const) {
      c.beginPath(); c.moveTo(hx + dx, hy + dy + 26); c.lineTo(hx + dx + 3, hy + dy - 14); c.stroke();
      c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(hx + dx + 3, hy + dy - 6); c.lineTo(hx + dx - 11, hy + dy - 18); c.stroke();
      c.beginPath(); c.moveTo(hx + dx + 3, hy + dy - 10); c.lineTo(hx + dx + 15, hy + dy - 22); c.stroke();
      c.lineWidth = 3;
    }
  }

  // The old millstone — all that is left of a mill that stood south of the
  // clearing before anyone can remember. Devils are fond of old mills.
  {
    const mx = 545 - camX;
    const my = 1082 - camY;
    c.fillStyle = "rgba(30,50,20,0.25)";
    c.beginPath(); c.ellipse(mx, my + 6, 44, 12, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#8d8b85";
    c.beginPath(); c.ellipse(mx, my, 34, 13, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#74726c";
    c.beginPath(); c.ellipse(mx, my - 1, 27, 9.6, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#4c4438";
    c.beginPath(); c.ellipse(mx, my - 1, 6, 2.6, 0, 0, Math.PI * 2); c.fill();
    // a fallen, rotting mill beam beside it
    c.fillStyle = "#6e4a26";
    rr(c, mx - 96, my + 12, 56, 9, 3); c.fill();
    c.fillStyle = "#5d3d20";
    rr(c, mx - 96, my + 17, 56, 4, 2); c.fill();
  }

  // Vesna's horod (garden) soil rows
  c.fillStyle = "#6e4c2a";
  rr(c, GARDEN.x - camX, GARDEN.y - camY, GARDEN.w, GARDEN.h, 6); c.fill();
  c.fillStyle = "#7d5831";
  for (let r = 0; r < 4; r++) c.fillRect(GARDEN.x + 8 - camX, GARDEN.y + 12 + r * 22 - camY, GARDEN.w - 16, 9);
  for (let r = 0; r < 4; r++) {
    for (let s = 0; s < 7; s++) {
      const sx = GARDEN.x + 18 + s * 19 - camX;
      const sy = GARDEN.y + 16 + r * 22 - camY;
      c.fillStyle = "#5da244";
      c.beginPath(); c.arc(sx, sy, 4.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#79bd58";
      c.beginPath(); c.arc(sx - 1.4, sy - 1.4, 2.4, 0, Math.PI * 2); c.fill();
    }
  }
}

export function drawTree(c: CanvasRenderingContext2D, tr: { x: number; y: number; kind: TreeKind; s: number }, camX: number, camY: number, t: number) {
  const x = tr.x - camX;
  const y = tr.y - camY;
  const s = tr.s;
  const sway = Math.sin(t * 0.0012 + tr.x * 0.11) * 1.4;
  c.fillStyle = "rgba(30,50,20,0.25)";
  c.beginPath(); c.ellipse(x, y + 4, 26 * s, 8 * s, 0, 0, Math.PI * 2); c.fill();
  if (tr.kind === "pine") {
    c.fillStyle = "#6e4a26";
    c.fillRect(x - 3.4 * s, y - 20 * s, 6.8 * s, 22 * s);
    const layers: Array<[number, number, string]> = [
      [46, 30, "#2c5a30"], [38, 52, "#336636"], [29, 74, "#3d733c"],
    ];
    layers.forEach(([w, top, col], i) => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(x + sway * (i + 1) * 0.4, y - (top + 26) * s);
      c.lineTo(x - w * s, y - top * s + 14 * s);
      c.lineTo(x + w * s, y - top * s + 14 * s);
      c.closePath(); c.fill();
      c.fillStyle = "rgba(120,180,90,0.35)";
      c.beginPath();
      c.moveTo(x + sway * (i + 1) * 0.4, y - (top + 26) * s);
      c.lineTo(x + 2 * s, y - top * s + 12 * s);
      c.lineTo(x + w * 0.55 * s, y - top * s + 13 * s);
      c.closePath(); c.fill();
    });
  } else if (tr.kind === "birch") {
    c.fillStyle = "#e9e4d6";
    c.fillRect(x - 3 * s, y - 34 * s, 6 * s, 36 * s);
    c.fillStyle = "#3a3a3a";
    c.fillRect(x - 3 * s, y - 26 * s, 6 * s, 2.2);
    c.fillRect(x - 1 * s, y - 15 * s, 4 * s, 2);
    const blobs: Array<[number, number, number, string]> = [
      [0, -62, 27, "#79ac49"], [-20, -48, 19, "#6da344"], [20, -50, 20, "#86ba57"], [0, -44, 22, "#71a846"],
    ];
    for (const [bx, by, br, col] of blobs) {
      c.fillStyle = col;
      c.beginPath(); c.arc(x + bx * s + sway, y + by * s, br * s, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = "rgba(190,225,140,0.5)";
    c.beginPath(); c.arc(x - 8 * s + sway, y - 62 * s, 9 * s, 0, Math.PI * 2); c.fill();
  } else {
    c.fillStyle = "#5d3d20";
    c.fillRect(x - 5 * s, y - 30 * s, 10 * s, 32 * s);
    c.fillRect(x - 14 * s, y - 44 * s, 6 * s, 18 * s);
    c.fillRect(x + 9 * s, y - 46 * s, 6 * s, 20 * s);
    const blobs: Array<[number, number, number, string]> = [
      [0, -78, 34, "#4f7d33"], [-30, -58, 25, "#598a39"], [30, -60, 26, "#679c3e"],
      [-12, -44, 24, "#5f943a"], [16, -42, 22, "#74ab4b"], [0, -96, 22, "#5f943a"],
    ];
    for (const [bx, by, br, col] of blobs) {
      c.fillStyle = col;
      c.beginPath(); c.arc(x + bx * s + sway, y + by * s, br * s, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = "rgba(200,230,150,0.4)";
    c.beginPath(); c.arc(x - 14 * s + sway, y - 82 * s, 11 * s, 0, Math.PI * 2); c.fill();
    // apples
    c.fillStyle = "#c8452c";
    for (const [ax, ay] of [[-22, -52], [14, -70], [26, -44]] as const) {
      c.beginPath(); c.arc(x + ax * s + sway, y + ay * s, 2.6 * s, 0, Math.PI * 2); c.fill();
    }
  }
}

export function drawHouse(c: CanvasRenderingContext2D, h: Rect & { kind: string }, camX: number, camY: number, t: number) {
  const x = h.x - camX;
  const y = h.y - camY;
  c.fillStyle = "rgba(30,50,20,0.28)";
  c.beginPath(); c.ellipse(x + h.w / 2, y + h.h + 8, h.w * 0.58, 13, 0, 0, Math.PI * 2); c.fill();

  if (h.kind === "forge") {
    // open smithy: posts, roof, anvil, barrel, fire glow
    c.fillStyle = "#7a4a24";
    c.fillRect(x + 8, y + 26, 9, h.h - 26);
    c.fillRect(x + h.w - 17, y + 26, 9, h.h - 26);
    c.fillStyle = "#8a5a33";
    c.beginPath();
    c.moveTo(x - 8, y + 30); c.lineTo(x + h.w / 2, y - 16); c.lineTo(x + h.w + 8, y + 30);
    c.closePath(); c.fill();
    c.strokeStyle = "rgba(90,58,26,0.6)";
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.moveTo(x + 6 + i * (h.w / 5), y + 26 - i * 1.5);
      c.lineTo(x + 20 + i * (h.w / 5), y - 8);
      c.stroke();
    }
    const fg = c.createRadialGradient(x + h.w * 0.68, y + h.h - 14, 4, x + h.w * 0.68, y + h.h - 14, 46);
    fg.addColorStop(0, "rgba(255,170,60,0.75)");
    fg.addColorStop(1, "rgba(255,170,60,0)");
    c.fillStyle = fg;
    c.fillRect(x + h.w * 0.68 - 46, y + h.h - 60, 92, 92);
    c.fillStyle = "#3c3c40";
    rr(c, x + h.w * 0.6, y + h.h - 26, 34, 12, 3); c.fill();
    c.fillRect(x + h.w * 0.6 + 12, y + h.h - 14, 10, 10);
    c.fillStyle = "#8a5a33";
    rr(c, x + 22, y + h.h - 34, 26, 32, 5); c.fill();
    c.strokeStyle = "#5d3d20";
    c.beginPath(); c.moveTo(x + 22, y + h.h - 22); c.lineTo(x + 48, y + h.h - 22); c.stroke();
    const fl = 5 + Math.sin(t * 0.02) * 1.6;
    c.fillStyle = "#ff9c2e";
    c.beginPath(); c.ellipse(x + h.w * 0.68 + 8, y + h.h - 30, 5, fl + 4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#ffd76a";
    c.beginPath(); c.ellipse(x + h.w * 0.68 + 8, y + h.h - 28, 2.6, fl, 0, 0, Math.PI * 2); c.fill();
    return;
  }

  // Log walls
  c.fillStyle = "#8a5a33";
  rr(c, x, y + 22, h.w, h.h - 22, 3); c.fill();
  c.strokeStyle = "rgba(70,42,18,0.55)";
  c.lineWidth = 1.6;
  for (let ly = y + 34; ly < y + h.h - 4; ly += 11) {
    c.beginPath(); c.moveTo(x + 3, ly); c.lineTo(x + h.w - 3, ly); c.stroke();
  }
  c.fillStyle = "#6e4525";
  c.fillRect(x - 2, y + 22, 7, h.h - 22);
  c.fillRect(x + h.w - 5, y + 22, 7, h.h - 22);
  // Thatch roof with layered strokes
  c.fillStyle = "#a87f42";
  c.beginPath();
  c.moveTo(x - 13, y + 30); c.lineTo(x + h.w / 2, y - 34); c.lineTo(x + h.w + 13, y + 30);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(122,88,36,0.65)";
  c.lineWidth = 2;
  for (let i = -5; i <= 5; i++) {
    c.beginPath();
    c.moveTo(x + h.w / 2 + i * 4, y - 30);
    c.lineTo(x + h.w / 2 + i * (h.w / 9.4), y + 27);
    c.stroke();
  }
  c.fillStyle = "#8a6530";
  c.beginPath();
  c.moveTo(x - 13, y + 30); c.lineTo(x + h.w + 13, y + 30); c.lineTo(x + h.w + 6, y + 38); c.lineTo(x - 6, y + 38);
  c.closePath(); c.fill();
  // Carved fascia — white/red triangle trim, a Ukrainian touch
  for (let i = 0; i < Math.floor(h.w / 13); i++) {
    c.fillStyle = i % 2 === 0 ? "#f3e9d2" : "#b03a2e";
    const tx = x + 4 + i * 13;
    c.beginPath();
    c.moveTo(tx, y + 39); c.lineTo(tx + 6, y + 47); c.lineTo(tx + 12, y + 39);
    c.closePath(); c.fill();
  }
  // Ridge beam + chimney with smoke
  c.fillStyle = "#5d3d20";
  c.fillRect(x + h.w / 2 - 26, y - 38, 52, 6);
  c.fillStyle = "#7d7a74";
  c.fillRect(x + h.w * 0.68, y - 30, 15, 24);
  c.fillStyle = "#5c5a56";
  c.fillRect(x + h.w * 0.68 - 2, y - 33, 19, 5);
  for (let i = 0; i < 3; i++) {
    const ph = (t * 0.00016 + i / 3 + hash2(h.x, i)) % 1;
    c.fillStyle = `rgba(240,238,232,${0.5 * (1 - ph)})`;
    c.beginPath();
    c.arc(x + h.w * 0.68 + 8 + ph * 16 + Math.sin(ph * 6 + h.x) * 3, y - 38 - ph * 44, 4 + ph * 8, 0, Math.PI * 2);
    c.fill();
  }
  // Door + glowing window + flower box
  c.fillStyle = "#5d3d20";
  rr(c, x + h.w / 2 - 13, y + h.h - 44, 26, 44, 3); c.fill();
  c.fillStyle = "#d9a441";
  c.fillRect(x + h.w / 2 + 6, y + h.h - 24, 3.4, 3.4);
  c.fillStyle = "#ffd97a";
  rr(c, x + 20, y + 48, 26, 24, 2); c.fill();
  c.strokeStyle = "#5d3d20";
  c.lineWidth = 2.4;
  c.strokeRect(x + 20, y + 48, 26, 24);
  c.beginPath(); c.moveTo(x + 33, y + 48); c.lineTo(x + 33, y + 72); c.stroke();
  c.beginPath(); c.moveTo(x + 20, y + 60); c.lineTo(x + 46, y + 60); c.stroke();
  c.fillStyle = "#7a4a24";
  c.fillRect(x + 17, y + 73, 32, 6);
  c.fillStyle = "#d94f3d";
  for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(x + 22 + i * 8, y + 72, 2.6, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = "#4c7a2e";
  for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(x + 24 + i * 8, y + 75, 2.4, 0, Math.PI * 2); c.fill(); }
}

export function drawWell(c: CanvasRenderingContext2D, camX: number, camY: number) {
  const x = WELL.x - camX;
  const y = WELL.y - camY;
  c.fillStyle = "rgba(30,50,20,0.25)";
  c.beginPath(); c.ellipse(x + 34, y + 52, 42, 10, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#8d8b85";
  rr(c, x + 4, y + 26, 60, 26, 5); c.fill();
  c.fillStyle = "#74726c";
  c.fillRect(x + 4, y + 34, 60, 3);
  c.fillRect(x + 4, y + 44, 60, 3);
  c.fillStyle = "#2c3844";
  c.beginPath(); c.ellipse(x + 34, y + 28, 25, 6, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#6e4525";
  c.fillRect(x + 2, y - 8, 6, 40);
  c.fillRect(x + 60, y - 8, 6, 40);
  c.fillStyle = "#a87f42";
  c.beginPath();
  c.moveTo(x - 6, y - 4); c.lineTo(x + 34, y - 30); c.lineTo(x + 74, y - 4);
  c.closePath(); c.fill();
  c.strokeStyle = "#5d3d20";
  c.lineWidth = 3;
  c.beginPath(); c.moveTo(x + 6, y - 8); c.lineTo(x + 62, y - 8); c.stroke();
  c.strokeStyle = "#c9b18a";
  c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(x + 34, y - 8); c.lineTo(x + 34, y + 12); c.stroke();
  c.fillStyle = "#7a4a24";
  rr(c, x + 27, y + 12, 14, 12, 2); c.fill();
}

export function drawFire(c: CanvasRenderingContext2D, camX: number, camY: number, t: number) {
  const x = FIRE.x - camX + 34;
  const y = FIRE.y - camY + 26;
  const glow = c.createRadialGradient(x, y - 6, 6, x, y - 6, 90);
  glow.addColorStop(0, "rgba(255,166,60,0.4)");
  glow.addColorStop(1, "rgba(255,166,60,0)");
  c.fillStyle = glow;
  c.fillRect(x - 90, y - 96, 180, 180);
  c.fillStyle = "#8d8b85";
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    c.beginPath(); c.ellipse(x + Math.cos(a) * 24, y + Math.sin(a) * 9, 5.4, 4, a, 0, Math.PI * 2); c.fill();
  }
  c.strokeStyle = "#6e4525";
  c.lineWidth = 5;
  c.beginPath(); c.moveTo(x - 15, y + 4); c.lineTo(x + 13, y - 3); c.stroke();
  c.beginPath(); c.moveTo(x + 15, y + 4); c.lineTo(x - 13, y - 3); c.stroke();
  const fl = Math.sin(t * 0.016) * 2.4 + Math.sin(t * 0.043) * 1.4;
  c.fillStyle = "#ff8b2e";
  c.beginPath(); c.ellipse(x, y - 10, 8.6, 13 + fl, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#ffb02e";
  c.beginPath(); c.ellipse(x, y - 8, 5.6, 9 + fl * 0.7, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#ffe89a";
  c.beginPath(); c.ellipse(x, y - 5, 2.8, 5 + fl * 0.4, 0, 0, Math.PI * 2); c.fill();
  // log benches
  c.fillStyle = "#7a4a24";
  rr(c, x - 74, y - 4, 34, 9, 4); c.fill();
  rr(c, x + 40, y - 4, 34, 9, 4); c.fill();
  // The cooking pot: an iron tripod and a hanging kettle over the flames —
  // karas soup has a home now (Cooking skill, 1 fish + 1 herb).
  c.strokeStyle = "#3c3630";
  c.lineWidth = 2.4;
  c.beginPath(); c.moveTo(x - 17, y + 7); c.lineTo(x, y - 27); c.stroke();
  c.beginPath(); c.moveTo(x + 17, y + 7); c.lineTo(x, y - 27); c.stroke();
  c.beginPath(); c.moveTo(x, y - 27); c.lineTo(x, y - 19); c.stroke();
  c.fillStyle = "#2e2a26";
  c.beginPath(); c.ellipse(x, y - 13, 11.5, 8, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#6e7a3a";
  c.beginPath(); c.ellipse(x, y - 16.4, 9.4, 3.6, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#f28c1e";
  c.beginPath(); c.arc(x - 3.4, y - 16.8, 1.7, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#f5f2e6";
  c.beginPath(); c.arc(x + 3.8, y - 16.2, 1.5, 0, Math.PI * 2); c.fill();
  // a wisp of soup steam
  const st = (t * 0.0004) % 1;
  c.fillStyle = `rgba(240,238,232,${0.4 * (1 - st)})`;
  c.beginPath(); c.arc(x + Math.sin(st * 5) * 2.4, y - 22 - st * 15, 2.4 + st * 3.4, 0, Math.PI * 2); c.fill();
}

// Vesna's alchemy bench: a drying rack hung with herb bundles over a
// little copper cauldron, south of the north-east hut (BREW_SPOT).
export function drawBrewBench(c: CanvasRenderingContext2D, camX: number, camY: number, t: number) {
  const x = BREW_SPOT.x - camX;
  const y = BREW_SPOT.y - camY;
  c.fillStyle = "rgba(30,50,20,0.25)";
  c.beginPath(); c.ellipse(x, y + 8, 34, 8, 0, 0, Math.PI * 2); c.fill();
  // rack posts + crossbar
  c.fillStyle = "#6e4525";
  c.fillRect(x - 26, y - 34, 4.6, 42);
  c.fillRect(x + 22, y - 34, 4.6, 42);
  c.fillRect(x - 29, y - 36, 58, 4.4);
  // hanging herb bundles — a colour for every kind on the znak harka's shelf
  const bundleCols = ["#3f7a2e", "#8a9678", "#f28c1e", "#f2c416", "#e8e2cc"];
  bundleCols.forEach((col, i) => {
    const bx = x - 21 + i * 11;
    const sway = Math.sin(t * 0.002 + i * 1.7) * 1.2;
    c.strokeStyle = "#c9b18a";
    c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(bx, y - 32); c.lineTo(bx + sway, y - 24); c.stroke();
    c.fillStyle = col;
    c.beginPath(); c.ellipse(bx + sway, y - 19, 3.6, 5.6, sway * 0.06, 0, Math.PI * 2); c.fill();
  });
  // the cauldron, gently at work
  c.fillStyle = "#4a3b2c";
  c.beginPath(); c.ellipse(x + 1, y + 3, 12.5, 8.6, 0, 0, Math.PI * 2); c.fill();
  const bub = 0.5 + Math.sin(t * 0.006) * 0.3;
  c.fillStyle = `rgba(140,220,150,${bub})`;
  c.beginPath(); c.ellipse(x + 1, y - 0.6, 9.6, 3.8, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "rgba(210,250,215,0.9)";
  const bph = (t * 0.05) % 9;
  c.beginPath(); c.arc(x - 3 + (bph % 3) * 3, y - 3 - bph * 0.7, 1.4, 0, Math.PI * 2); c.fill();
  // a stoppered bottle, ready for a tonic
  c.fillStyle = "#7fb069";
  rr(c, x + 19, y - 3, 5.4, 9, 2); c.fill();
  c.fillStyle = "#c9a86a";
  c.fillRect(x + 20.4, y - 6, 2.6, 3);
}

// The crust of bread waiting by the campfire for a kind traveller.
export function drawCrust(c: CanvasRenderingContext2D, camX: number, camY: number, t: number) {
  const x = CRUST_SPOT.x - camX;
  const y = CRUST_SPOT.y - camY;
  const pulse = 0.5 + Math.sin(t * 0.004) * 0.22;
  const g = c.createRadialGradient(x, y, 2, x, y, 24);
  g.addColorStop(0, `rgba(255,214,130,${pulse * 0.55})`);
  g.addColorStop(1, "rgba(255,214,130,0)");
  c.fillStyle = g;
  c.fillRect(x - 24, y - 24, 48, 48);
  // a folded cloth, and the crust on it
  c.fillStyle = "#efe3c8";
  c.beginPath(); c.ellipse(x, y + 3, 13, 5, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#c98d45";
  c.beginPath(); c.ellipse(x, y, 8.6, 5.6, -0.15, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#a86f2e";
  c.beginPath(); c.ellipse(x - 1, y - 1.4, 6.4, 3.8, -0.15, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#8a5a24";
  c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(x - 4, y - 2.6); c.lineTo(x + 2, y - 1.2); c.stroke();
  // a pinch of salt beside it — the Domovyk is particular
  c.fillStyle = "#ffffff";
  c.beginPath(); c.arc(x + 9, y + 2, 1.7, 0, Math.PI * 2); c.fill();
}

// Fishing: a rod leaning over the shore, the line, and the bobber. While a
// fish bites, the bobber dunks and rings spread — that is the moment to
// reel in. Drawn in world space (world coords minus camera).
export function drawFishing(
  c: CanvasRenderingContext2D,
  px: number, py: number,
  camX: number, camY: number, t: number,
  phase: "wait" | "bite",
) {
  const sx = px - camX;
  const sy = py - camY;
  const bx = BOBBER.x - camX;
  const bobDip = phase === "bite" ? Math.abs(Math.sin(t * 0.03)) * 3.4 : Math.sin(t * 0.003) * 1.1;
  const by = BOBBER.y - camY + bobDip;
  // the rod, angled from the player's hands over the water
  c.strokeStyle = "#7a5a30";
  c.lineWidth = 2.4;
  c.beginPath(); c.moveTo(sx + 6, sy - 22); c.lineTo(sx + 44, sy - 44); c.stroke();
  // the line, sagging a little
  c.strokeStyle = "rgba(240,240,230,0.75)";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(sx + 44, sy - 44);
  c.quadraticCurveTo((sx + 44 + bx) / 2, Math.min(sy - 44, by) - 12 + Math.abs(bx - sx) * 0.04, bx, by - 3);
  c.stroke();
  // ripples around the bobber — frantic while biting
  const rings = phase === "bite" ? 3 : 2;
  for (let i = 0; i < rings; i++) {
    const rp = ((t * (phase === "bite" ? 0.06 : 0.02) + i * 7) % 14);
    c.strokeStyle = `rgba(230,245,250,${0.5 * (1 - rp / 14)})`;
    c.lineWidth = 1.2;
    c.beginPath(); c.ellipse(bx, by + 2, 4 + rp, (4 + rp) * 0.36, 0, 0, Math.PI * 2); c.stroke();
  }
  // the bobber: red over white, the village way
  c.fillStyle = "#f3e9d2";
  c.beginPath(); c.ellipse(bx, by, 3.4, 4.4, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#c23b2a";
  c.beginPath(); c.ellipse(bx, by - 1.8, 3.4, 2.6, 0, Math.PI, 2 * Math.PI); c.fill();
  if (phase === "bite") {
    // splashes
    c.fillStyle = "rgba(225,242,250,0.9)";
    for (let i = 0; i < 4; i++) {
      const a = hash2(i, Math.floor(t / 90)) * Math.PI * 2;
      c.fillRect(bx + Math.cos(a) * 6, by - 3 - hash2(i, 3) * 4, 1.7, 1.7);
    }
  }
}

export function drawFence(c: CanvasRenderingContext2D, f: Rect, camX: number, camY: number) {
  const x = f.x - camX;
  const y = f.y - camY;
  c.fillStyle = "#9a7448";
  if (f.w >= f.h) {
    c.fillRect(x, y + 2, f.w, 3.4);
    c.fillRect(x, y + 7, f.w, 3.4);
    for (let px = x + 2; px < x + f.w; px += 22) c.fillRect(px, y - 2, 5, 15);
  } else {
    c.fillRect(x + 2, y, 3.4, f.h);
    c.fillRect(x + 7, y, 3.4, f.h);
    for (let py = y + 2; py < y + f.h; py += 22) c.fillRect(x - 2, py, 15, 5);
  }
}

export function drawHerbPatch(c: CanvasRenderingContext2D, sx: number, sy: number, camX: number, camY: number, t: number, available: boolean, herb: HerbDef) {
  const x = sx - camX;
  const y = sy - camY;
  if (!available) {
    c.fillStyle = "#548636";
    for (let i = 0; i < 4; i++) {
      c.beginPath(); c.arc(x - 8 + i * 5.4, y + (i % 2) * 3, 3.4, 0, Math.PI * 2); c.fill();
    }
    return;
  }
  const pulse = 0.55 + Math.sin(t * 0.004 + sx) * 0.25;
  const g = c.createRadialGradient(x, y, 2, x, y, 30);
  g.addColorStop(0, `rgba(${herb.glow},${pulse * 0.5})`);
  g.addColorStop(1, `rgba(${herb.glow},0)`);
  c.fillStyle = g;
  c.fillRect(x - 30, y - 30, 60, 60);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + hash2(sx, i) * 0.6;
    const lx = x + Math.cos(a) * 10;
    const ly = y + Math.sin(a) * 5;
    c.strokeStyle = herb.leaf;
    c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(lx, ly + 5); c.quadraticCurveTo(lx + 2, ly, lx + 3, ly - 6); c.stroke();
    c.fillStyle = herb.flower;
    c.beginPath(); c.arc(lx + 3, ly - 7, 3, 0, Math.PI * 2); c.fill();
    c.fillStyle = herb.flowerCore;
    c.beginPath(); c.arc(lx + 3, ly - 7, 1.3, 0, Math.PI * 2); c.fill();
  }
  const sp = (t * 0.03 + sx) % 14;
  c.fillStyle = "rgba(255,240,180,0.9)";
  c.fillRect(x + Math.sin(t * 0.003 + sx) * 12, y - 10 - sp, 1.8, 1.8);
}

export function drawPerson(
  c: CanvasRenderingContext2D,
  x: number, y: number,
  opts: { tunic: string; hair: string; style: "player" | "elder" | "herbalist" | "smith"; moving: boolean; phase: number; face: number; t: number; shadow?: boolean },
) {
  const bob = opts.moving ? Math.abs(Math.sin(opts.phase)) * 2.2 : Math.sin(opts.t * 0.002 + x * 0.13) * 0.7;
  const top = y - 40 + bob * 0.4;
  // shadow === false: the Chort has it. It is a bargain, not a bug.
  if (opts.shadow !== false) {
    c.fillStyle = "rgba(30,50,20,0.3)";
    c.beginPath(); c.ellipse(x, y + 3, 13, 4.6, 0, 0, Math.PI * 2); c.fill();
  }
  const swing = opts.moving ? Math.sin(opts.phase) * 3.4 : 0;
  // legs + boots
  c.fillStyle = "#4c3a28";
  c.fillRect(x - 7, top + 27 + (swing > 0 ? -swing * 0.4 : 0), 5.6, 9);
  c.fillRect(x + 1.6, top + 27 + (swing < 0 ? swing * 0.4 : 0), 5.6, 9);
  c.fillStyle = "#2c2015";
  c.fillRect(x - 7.6, top + 34.4 + (swing > 0 ? -swing * 0.4 : 0), 7, 3.4);
  c.fillRect(x + 1.2, top + 34.4 + (swing < 0 ? swing * 0.4 : 0), 7, 3.4);
  // arms
  c.fillStyle = opts.tunic;
  c.fillRect(x - 12.4, top + 12 - swing * 0.5, 4.6, 13);
  c.fillRect(x + 7.8, top + 12 + swing * 0.5, 4.6, 13);
  c.fillStyle = "#e8b88a";
  c.fillRect(x - 12.4, top + 24 - swing * 0.5, 4.6, 3.6);
  c.fillRect(x + 7.8, top + 24 + swing * 0.5, 4.6, 3.6);
  // tunic body
  c.fillStyle = opts.tunic;
  rr(c, x - 9, top + 9, 18, 20, 3); c.fill();
  if (opts.style === "player" || opts.style === "herbalist") {
    // embroidered chest — white base with red pattern for the player
    if (opts.style === "player") {
      c.fillStyle = "#efe3c8";
      rr(c, x - 9, top + 9, 18, 20, 3); c.fill();
      c.fillStyle = "#b03a2e";
      for (let i = 0; i < 3; i++) c.fillRect(x - 1.2, top + 12 + i * 5, 2.4, 2.4);
      c.fillRect(x - 5, top + 14.4, 2, 2);
      c.fillRect(x + 3, top + 14.4, 2, 2);
      c.fillRect(x - 5, top + 24.4, 2, 2);
      c.fillRect(x + 3, top + 24.4, 2, 2);
    } else {
      c.fillStyle = "#f3e9d2";
      c.fillRect(x - 9, top + 20, 18, 3);
      c.fillStyle = "#e8b13c";
      for (let i = 0; i < 4; i++) c.fillRect(x - 7 + i * 4.4, top + 21, 2, 1.6);
    }
  }
  if (opts.style === "smith") {
    c.fillStyle = "#33302c";
    rr(c, x - 7, top + 13, 14, 15, 2); c.fill();
  }
  // belt
  c.fillStyle = "#5d3d20";
  c.fillRect(x - 9, top + 25, 18, 3.4);
  c.fillStyle = "#d9a441";
  c.fillRect(x - 1.8, top + 25.4, 3.6, 2.6);
  // head
  c.fillStyle = "#e8b88a";
  rr(c, x - 7, top - 5, 14, 14, 4); c.fill();
  c.fillStyle = "#2e2018";
  const fx = clamp(opts.face, -1.6, 1.6);
  c.fillRect(x - 3.6 + fx, top + 2.4, 2, 2.6);
  c.fillRect(x + 1.8 + fx, top + 2.4, 2, 2.6);
  if (opts.style === "elder") {
    c.fillStyle = opts.hair;
    rr(c, x - 7.6, top - 6.4, 15.2, 6, 3); c.fill();
    c.fillStyle = "#cfc8bb";
    rr(c, x - 5.4, top + 5, 10.8, 7.6, 3); c.fill(); // beard
  } else if (opts.style === "herbalist") {
    c.fillStyle = opts.hair;
    rr(c, x - 8, top - 6.4, 16, 7, 3); c.fill();
    c.fillRect(x - 8.6, top, 4.4, 15);
    c.fillRect(x + 4.2, top, 4.4, 15);
    // flower wreath
    const wc = ["#d94f3d", "#f2c14e", "#f5efdc", "#d96a5a"];
    for (let i = 0; i < 5; i++) {
      c.fillStyle = wc[i % wc.length] ?? "#fff";
      c.beginPath(); c.arc(x - 6 + i * 3, top - 5.4, 1.7, 0, Math.PI * 2); c.fill();
    }
  } else if (opts.style === "player") {
    c.fillStyle = opts.hair;
    rr(c, x - 7.4, top - 6.2, 14.8, 6.4, 3); c.fill();
    c.fillStyle = "#b03a2e"; // headband
    c.fillRect(x - 7.4, top - 1.6, 14.8, 2.4);
  } else {
    c.fillStyle = opts.hair;
    rr(c, x - 7.4, top - 6.2, 14.8, 5.6, 3); c.fill();
  }
}

export function drawChicken(c: CanvasRenderingContext2D, x: number, y: number, peck: number, camX: number, camY: number) {
  const sx = x - camX;
  const sy = y - camY;
  c.fillStyle = "rgba(30,50,20,0.22)";
  c.beginPath(); c.ellipse(sx, sy + 3, 8, 2.8, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#f5efdc";
  c.beginPath(); c.ellipse(sx, sy - 3, 8.4, 6, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(sx - 7, sy - 8, 4.4, 2.6, -0.7, 0, Math.PI * 2); c.fill();
  const hy = sy - 8 + peck * 4;
  c.beginPath(); c.arc(sx + 7.4, hy, 3.8, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#d94f3d";
  c.beginPath(); c.arc(sx + 7.4, hy - 3.8, 1.8, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#e8a020";
  c.beginPath();
  c.moveTo(sx + 10.8, hy); c.lineTo(sx + 13.6, hy + 1.4); c.lineTo(sx + 10.8, hy + 2.6);
  c.closePath(); c.fill();
  c.fillStyle = "#2e2018";
  c.fillRect(sx + 7.8, hy - 1, 1.4, 1.4);
}