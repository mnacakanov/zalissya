import { CAM } from "./shapes";
import { BRIDGES, type CropKind, FIELDS, GARDENS, RIVER_HALF, riverY } from "../data/land";
import { hash2, type Rect } from "../world/geometry";

// --- Fields, kitchen gardens and the river: drawing -------------------------
// Ground-level, top-down rows of crops over tilled soil, each crop with its
// own colours and a hint of its shape; the river is a band of water with
// reeds on the banks, crossed by two plank bridges.

const visible = (r: Rect, camX: number, camY: number, vw: number, vh: number) =>
  r.x + r.w > camX && r.x < camX + vw && r.y + r.h > camY - 40 && r.y < camY + vh;

function plant(c: CanvasRenderingContext2D, crop: CropKind, x: number, y: number, t: number, seed: number): void {
  const sway = Math.sin(t * 0.0016 + (x + CAM.x) * 0.05 + (y + CAM.y) * 0.03) * 1.4;
  switch (crop) {
    case "buckwheat": // reddish stems, clouds of tiny white-pink flowers
      c.strokeStyle = "#a6503e"; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(x, y + 6); c.lineTo(x + sway, y - 4); c.stroke();
      c.fillStyle = seed > 0.5 ? "#f5ecef" : "#f2d4dc";
      c.beginPath(); c.arc(x + sway, y - 6, 3.6, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(x + sway + 3, y - 3, 2.4, 0, Math.PI * 2); c.fill();
      return;
    case "barley": // golden ears with long whiskers (awns)
      c.strokeStyle = "#c9a24a"; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(x, y + 6); c.lineTo(x + sway, y - 6); c.stroke();
      c.fillStyle = "#e3c06a";
      c.beginPath(); c.ellipse(x + sway, y - 9, 2.2, 5, 0.1, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "rgba(240,214,140,0.9)"; c.lineWidth = 0.8;
      c.beginPath(); c.moveTo(x + sway, y - 13); c.lineTo(x + sway + 3, y - 20); c.moveTo(x + sway - 1, y - 12); c.lineTo(x + sway - 3, y - 19); c.stroke();
      return;
    case "oats": // pale stalks with drooping, dangling spikelets
      c.strokeStyle = "#b9c27a"; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(x, y + 6); c.quadraticCurveTo(x + sway, y - 4, x + sway + 3, y - 8); c.stroke();
      c.fillStyle = "#dfe0a8";
      for (const [dx, dy] of [[3, -6], [5, -3], [1, -2]] as const) { c.beginPath(); c.ellipse(x + sway + dx, y + dy, 1.4, 2.6, 0.4, 0, Math.PI * 2); c.fill(); }
      return;
    case "hemp": { // tall, dark, with fan-shaped leaves
      c.strokeStyle = "#3e6a2c"; c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(x, y + 8); c.lineTo(x + sway, y - 14); c.stroke();
      c.fillStyle = seed > 0.5 ? "#3f7a2e" : "#4c8a36";
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i - 2) * 0.5;
        c.beginPath(); c.ellipse(x + sway + Math.cos(a) * 5, y - 10 + Math.sin(a) * 5, 5.2, 1.5, a, 0, Math.PI * 2); c.fill();
      }
      return;
    }
    case "tobacco": // broad pale leaves and pink trumpet flowers
      c.fillStyle = "#86b45a";
      c.beginPath(); c.ellipse(x - 5, y, 7, 3.6, -0.4, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(x + 5, y - 1, 7, 3.6, 0.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#9ac46a";
      c.beginPath(); c.ellipse(x + sway * 0.5, y - 6, 4, 6, 0, 0, Math.PI * 2); c.fill();
      if (seed > 0.4) {
        c.fillStyle = "#eaa0b8";
        c.beginPath(); c.arc(x + sway, y - 13, 2.4, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(x + sway + 3, y - 11, 2, 0, Math.PI * 2); c.fill();
      }
      return;
    case "cabbage":
      c.fillStyle = "#9bc47a"; c.beginPath(); c.arc(x, y, 6.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#c4e0a2"; c.beginPath(); c.arc(x, y - 1, 3.6, 0, Math.PI * 2); c.fill();
      return;
    case "beet":
      c.fillStyle = "#3f6a2c";
      c.beginPath(); c.ellipse(x - 3, y - 3, 3, 5.4, -0.4, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(x + 3, y - 3, 3, 5.4, 0.4, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#a01e3c"; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x - 3, y); c.lineTo(x - 3, y - 6); c.moveTo(x + 3, y); c.lineTo(x + 3, y - 6); c.stroke();
      c.fillStyle = "#7a1430"; c.beginPath(); c.arc(x, y + 2, 2.6, 0, Math.PI * 2); c.fill();
      return;
    case "cucumber":
      c.strokeStyle = "#4c7a2e"; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(x - 7, y); c.quadraticCurveTo(x, y - 5, x + 7, y); c.stroke();
      c.fillStyle = "#5a8a3a"; c.beginPath(); c.arc(x - 2, y - 2, 3.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#f2d43a"; c.beginPath(); c.arc(x + 4, y - 3, 1.6, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#3e6a24"; c.beginPath(); c.ellipse(x + 1, y + 2, 4, 1.6, 0.2, 0, Math.PI * 2); c.fill();
      return;
    case "carrot": // feathery tops, an orange shoulder
      c.strokeStyle = "#5e9a3a"; c.lineWidth = 1;
      for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + i * 2 + sway * 0.5, y - 7 - Math.abs(i)); c.stroke(); }
      c.fillStyle = "#e8781e"; c.beginPath(); c.arc(x, y + 1, 1.8, 0, Math.PI * 2); c.fill();
      return;
    case "radish":
      c.fillStyle = "#5e8a3a";
      c.beginPath(); c.ellipse(x - 2, y - 3, 2.4, 4, -0.5, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(x + 2, y - 3, 2.4, 4, 0.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#d8344a"; c.beginPath(); c.arc(x, y + 1.6, 2.2, 0, Math.PI * 2); c.fill();
      return;
    case "onion":
      c.strokeStyle = "#6fae4a"; c.lineWidth = 1.4;
      for (const d of [-2, 0, 2]) { c.beginPath(); c.moveTo(x + d * 0.5, y); c.lineTo(x + d + sway * 0.3, y - 9); c.stroke(); }
      c.fillStyle = "#d8b46a"; c.beginPath(); c.arc(x, y + 1, 2.2, 0, Math.PI * 2); c.fill();
      return;
    case "garlic":
      c.strokeStyle = "#8ab06a"; c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x - 3, y - 8); c.moveTo(x, y); c.lineTo(x + 3, y - 8); c.stroke();
      c.fillStyle = "#f3efe4"; c.beginPath(); c.arc(x, y + 1.4, 2.4, 0, Math.PI * 2); c.fill();
      return;
  }
}

const SOIL: Record<"field" | "garden", string> = { field: "#8a6a44", garden: "#6e5034" };
const FIELD_TINT: Partial<Record<CropKind, string>> = {
  buckwheat: "#a8805a", barley: "#c2a25a", oats: "#a8a868", hemp: "#56723a", tobacco: "#7a8a4a",
};

export function drawLand(c: CanvasRenderingContext2D, camX: number, camY: number, vw: number, vh: number, t: number): void {
  // kitchen gardens: dark tilled soil, a row per crop, a wattle edge
  for (const g of GARDENS) {
    if (!visible(g, camX, camY, vw, vh)) continue;
    const x = g.x - camX;
    const y = g.y - camY;
    c.fillStyle = SOIL.garden;
    c.fillRect(x, y, g.w, g.h);
    const rowH = g.h / g.rows.length;
    g.rows.forEach((crop, ri) => {
      c.fillStyle = "rgba(40,26,14,0.25)";
      c.fillRect(x + 4, y + ri * rowH + rowH - 6, g.w - 8, 3);
      for (let px = 12; px < g.w - 6; px += 16) plant(c, crop, x + px, y + ri * rowH + rowH / 2 + 2, t, hash2(g.x + px, ri));
    });
    c.strokeStyle = "#8c6a3c"; c.lineWidth = 2;
    c.strokeRect(x - 1, y - 1, g.w + 2, g.h + 2);
  }
  // strip fields: furrows of the crop over soil
  for (const f of FIELDS) {
    if (!visible(f, camX, camY, vw, vh)) continue;
    const x = f.x - camX;
    const y = f.y - camY;
    c.fillStyle = SOIL.field;
    c.fillRect(x, y, f.w, f.h);
    c.fillStyle = FIELD_TINT[f.crop] ?? SOIL.field;
    c.globalAlpha = 0.55;
    c.fillRect(x, y, f.w, f.h);
    c.globalAlpha = 1;
    const sp = f.crop === "hemp" || f.crop === "tobacco" ? 18 : 11;
    const x0 = Math.max(f.x, camX - 20);
    const x1 = Math.min(f.x + f.w, camX + vw + 20);
    const y0 = Math.max(f.y, camY - 30);
    const y1 = Math.min(f.y + f.h, camY + vh + 30);
    for (let wy = f.y + sp / 2; wy < f.y + f.h; wy += sp) {
      if (wy < y0 || wy > y1) continue;
      for (let wx = f.x + sp / 2 + ((wy / sp) % 2) * (sp / 2); wx < f.x + f.w; wx += sp) {
        if (wx < x0 || wx > x1) continue;
        plant(c, f.crop, wx - camX, wy - camY, t, hash2(wx, wy));
      }
    }
  }
}

export function drawRiver(c: CanvasRenderingContext2D, camX: number, camY: number, vw: number, vh: number, t: number): void {
  const xa = Math.floor((camX - 40) / 20) * 20;
  const xb = camX + vw + 40;
  const top = (x: number) => riverY(x) - RIVER_HALF;
  const bot = (x: number) => riverY(x) + RIVER_HALF;
  if (top(camX) > camY + vh + 80 && top(camX + vw) > camY + vh + 80) return;
  // banks
  c.fillStyle = "#7a8a4a";
  c.beginPath();
  c.moveTo(xa - camX, top(xa) - 8 - camY);
  for (let x = xa; x <= xb; x += 20) c.lineTo(x - camX, top(x) - 8 - camY);
  for (let x = xb; x >= xa; x -= 20) c.lineTo(x - camX, bot(x) + 8 - camY);
  c.closePath(); c.fill();
  // water: a deep middle, lighter shallows along both banks (drawn along
  // the banks themselves, so nothing slides about as the camera moves)
  c.fillStyle = "#4a7f98";
  c.beginPath();
  c.moveTo(xa - camX, top(xa) - camY);
  for (let x = xa; x <= xb; x += 20) c.lineTo(x - camX, top(x) - camY);
  for (let x = xb; x >= xa; x -= 20) c.lineTo(x - camX, bot(x) - camY);
  c.closePath(); c.fill();
  c.lineJoin = "round";
  for (const [edge, w, col] of [[top, 26, "rgba(120,170,186,0.45)"], [bot, 26, "rgba(120,170,186,0.45)"], [top, 6, "rgba(200,226,232,0.5)"], [bot, 4, "rgba(60,90,70,0.5)"]] as const) {
    c.strokeStyle = col; c.lineWidth = w;
    c.beginPath();
    for (let x = xa; x <= xb; x += 20) {
      if (x === xa) c.moveTo(x - camX, edge(x) - camY); else c.lineTo(x - camX, edge(x) - camY);
    }
    c.stroke();
  }
  // the current: little ripples born on the water, drifting downstream
  // (east) a few dozen px while they fade in and out — anchored to the
  // river, not the screen
  const P = 64;
  c.lineCap = "round";
  for (let cx = Math.floor((camX - 60) / P) * P; cx < xb; cx += P) {
    for (let k = 0; k < 3; k++) {
      const life = (t * 0.00022 + hash2(cx, k * 7 + 1)) % 1;
      const x = cx + hash2(k, cx * 3 + 1) * P + life * 36;
      const y = riverY(x) + (hash2(cx + k, 11) - 0.5) * RIVER_HALF * 1.5;
      const a = Math.sin(life * Math.PI) * 0.45;
      const len = 6 + hash2(cx, k + 21) * 10;
      c.strokeStyle = `rgba(230,244,248,${a})`; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(x - camX, y - camY); c.quadraticCurveTo(x + len / 2 - camX, y - 1.6 - camY, x + len - camX, y - camY); c.stroke();
    }
  }
  c.lineCap = "butt";
  // reeds on both banks, on a grid of the world (not of the screen)
  c.strokeStyle = "#5e6e34";
  c.lineWidth = 1.6;
  for (let x = Math.floor((camX - 40) / 13) * 13; x <= xb; x += 13) {
    if (hash2(x, 3) < 0.45) continue;
    for (const side of [-1, 1]) {
      const by = riverY(x) + side * (RIVER_HALF + 2);
      const sway = Math.sin(t * 0.0018 + x * 0.07) * 1.4;
      c.beginPath(); c.moveTo(x - camX, by - camY); c.quadraticCurveTo(x + sway * 0.4 - camX, by - 8 - camY, x + sway - camX, by - 15 - camY); c.stroke();
      if (hash2(x, side) > 0.7) {
        c.fillStyle = "#6a4a2a";
        c.beginPath(); c.ellipse(x + sway - camX, by - 17 - camY, 1.6, 3.4, sway * 0.05, 0, Math.PI * 2); c.fill();
      }
    }
  }
  // bridges
  for (const b of BRIDGES) {
    const yc = riverY(b.x) - camY;
    const x = b.x - b.w / 2 - camX;
    c.fillStyle = "rgba(20,30,40,0.3)";
    c.fillRect(x + 4, yc - RIVER_HALF - 10 + 6, b.w, RIVER_HALF * 2 + 20);
    c.fillStyle = "#8a6440";
    c.fillRect(x, yc - RIVER_HALF - 12, b.w, RIVER_HALF * 2 + 24);
    c.strokeStyle = "rgba(60,40,22,0.6)";
    c.lineWidth = 1.2;
    for (let py = yc - RIVER_HALF - 12; py < yc + RIVER_HALF + 12; py += 8) {
      c.beginPath(); c.moveTo(x, py); c.lineTo(x + b.w, py); c.stroke();
    }
    c.fillStyle = "#5c4430";
    c.fillRect(x - 4, yc - RIVER_HALF - 16, 5, RIVER_HALF * 2 + 32);
    c.fillRect(x + b.w - 1, yc - RIVER_HALF - 16, 5, RIVER_HALF * 2 + 32);
  }
}
