import { LYSA_OFFER_SPOT, LYSA_STONES, LYSA_SUMMIT, LYSA_THRONE } from "../data/lysa";
import { rr } from "./shapes";
import { LYSA_H, LYSA_W } from "../world/areas";
import { hash2 } from "../world/geometry";

// --- Lysa Hora drawing ------------------------------------------------------
// The summit is drawn at night: blue-rock ground, a huge crescent moon
// riding over the north edge, the sabbath bonfire, broomsticks and a
// cauldron by the stones, and witch silhouettes in the firelight.

export function drawLysaGround(c: CanvasRenderingContext2D, camX: number, camY: number, vw: number, vh: number, t: number, offered: boolean) {
  // Night rock — layered blue-grey cells, no green anywhere. The mountain
  // is BALD: that is the whole point of Lysa Hora.
  const cell = 34;
  const x0 = Math.max(0, Math.floor(camX / cell) - 1);
  const y0 = Math.max(0, Math.floor(camY / cell) - 1);
  const x1 = Math.min(Math.ceil(LYSA_W / cell), Math.ceil((camX + vw) / cell) + 1);
  const y1 = Math.min(Math.ceil(LYSA_H / cell), Math.ceil((camY + vh) / cell) + 1);
  const shades = ["#4a4a58", "#474754", "#4d4d5c", "#434350"];
  for (let gy = y0; gy < y1; gy++) {
    for (let gx = x0; gx < x1; gx++) {
      const h = hash2(gx * 3, gy * 7);
      c.fillStyle = shades[Math.floor(h * shades.length)] ?? shades[0]!;
      c.fillRect(gx * cell - camX, gy * cell - camY, cell + 1, cell + 1);
      // rock cracks + pale lichen, never grass
      if (h > 0.72) {
        c.strokeStyle = "rgba(20,20,30,0.4)";
        c.lineWidth = 1.2;
        const bx = gx * cell - camX;
        const by = gy * cell - camY;
        c.beginPath();
        c.moveTo(bx + h * 20, by + 6);
        c.lineTo(bx + h * 26, by + 18);
        c.lineTo(bx + h * 14, by + 27);
        c.stroke();
      }
      if (h < 0.12) {
        c.fillStyle = "rgba(168,178,160,0.35)";
        c.beginPath();
        c.arc(gx * cell - camX + 10 + h * 90, gy * cell - camY + 12, 3.4, 0, Math.PI * 2);
        c.fill();
      }
    }
  }
  // The dome's crown — paler, worn rock around the summit circle.
  const dg = c.createRadialGradient(LYSA_SUMMIT.x - camX, LYSA_SUMMIT.y - camY, 30, LYSA_SUMMIT.x - camX, LYSA_SUMMIT.y - camY, 300);
  dg.addColorStop(0, "rgba(196,192,178,0.28)");
  dg.addColorStop(1, "rgba(196,192,178,0)");
  c.fillStyle = dg;
  c.fillRect(LYSA_SUMMIT.x - 300 - camX, LYSA_SUMMIT.y - 300 - camY, 600, 600);
  // The trail in from the west trailhead, switchbacking to the summit.
  c.strokeStyle = "#6b6252";
  c.lineWidth = 44;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(-10 - camX, 470 - camY);
  c.quadraticCurveTo(280 - camX, 520 - camY, 430 - camX, 452 - camY);
  c.quadraticCurveTo(540 - camX, 404 - camY, LYSA_SUMMIT.x - 120 - camX, LYSA_SUMMIT.y - camY);
  c.stroke();
  c.strokeStyle = "rgba(40,36,30,0.35)";
  c.lineWidth = 1.6;
  for (let i = 0; i < 46; i++) {
    const px = hash2(i, 801) * LYSA_W;
    const py = 380 + hash2(i, 803) * 190;
    if (px < camX - 8 || px > camX + vw + 8 || py < camY - 8 || py > camY + vh + 8) continue;
    c.beginPath(); c.arc(px - camX, py - camY, 1.6 + hash2(i, 805) * 2, 0, Math.PI * 2); c.stroke();
  }
  // Dead snags — the only "trees" the mountain allows, long burnt.
  c.strokeStyle = "#26222c";
  for (const [dx, dy] of [[240, 180], [1080, 700], [150, 760], [1150, 160]] as const) {
    const sx = dx - camX;
    const sy = dy - camY;
    c.lineWidth = 4;
    c.beginPath(); c.moveTo(sx, sy + 20); c.lineTo(sx + 3, sy - 22); c.stroke();
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(sx + 3, sy - 10); c.lineTo(sx - 12, sy - 24); c.stroke();
    c.beginPath(); c.moveTo(sx + 3, sy - 16); c.lineTo(sx + 16, sy - 28); c.stroke();
  }
  // The great crescent moon, low over the north edge — drawn in world
  // space so it hangs over the summit like a lamp.
  {
    const mx = 880 - camX;
    const my = 66 - camY;
    const mg = c.createRadialGradient(mx, my, 8, mx, my, 120);
    mg.addColorStop(0, "rgba(220,228,255,0.34)");
    mg.addColorStop(1, "rgba(220,228,255,0)");
    c.fillStyle = mg;
    c.fillRect(mx - 120, my - 120, 240, 240);
    c.fillStyle = "#e9edda";
    c.beginPath(); c.arc(mx, my, 34, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#33333f";
    c.beginPath(); c.arc(mx + 15, my - 7, 29, 0, Math.PI * 2); c.fill();
    // stars
    c.fillStyle = "rgba(240,244,255,0.85)";
    for (let i = 0; i < 40; i++) {
      const sx = hash2(i, 811) * LYSA_W - camX;
      const sy = hash2(i, 813) * 190 - camY;
      const tw = 0.5 + Math.sin(t * 0.002 + i * 1.9) * 0.4;
      c.globalAlpha = Math.max(0.15, tw);
      c.fillRect(sx, sy, 2, 2);
    }
    c.globalAlpha = 1;
  }
  // Standing stones of the ritual ring
  for (const s of LYSA_STONES) {
    const sx = s.x - camX;
    const sy = s.y - camY;
    c.fillStyle = "rgba(10,10,16,0.4)";
    c.beginPath(); c.ellipse(sx, sy + 4, 13, 4.6, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#5c5c68";
    rr(c, sx - 7, sy - s.h, 14, s.h + 6, 3); c.fill();
    c.fillStyle = "rgba(220,226,255,0.16)";
    rr(c, sx - 7, sy - s.h, 5.4, s.h + 6, 2); c.fill();
    // a carved crescent on every third stone
    if (Math.floor(s.x) % 3 === 0) {
      c.strokeStyle = "rgba(233,237,218,0.55)";
      c.lineWidth = 1.4;
      c.beginPath(); c.arc(sx, sy - s.h / 2, 4, 0.6, Math.PI * 1.7); c.stroke();
    }
  }
  // Beelzebub's seat — a throne of black stone at the summit's north edge
  {
    const tx = LYSA_THRONE.x - camX;
    const ty = LYSA_THRONE.y - camY;
    c.fillStyle = "rgba(8,8,14,0.45)";
    c.beginPath(); c.ellipse(tx + 48, ty + 48, 62, 13, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#2c2833";
    rr(c, tx + 14, ty - 26, 68, 62, 5); c.fill();
    c.fillStyle = "#38333f";
    rr(c, tx + 14, ty - 26, 68, 14, 5); c.fill();
    c.fillStyle = "#211e28";
    rr(c, tx, ty + 22, 96, 22, 4); c.fill();
    c.fillStyle = "#e9edda";
    c.beginPath(); c.arc(tx + 48, ty - 12, 4.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#33333f";
    c.beginPath(); c.arc(tx + 50.4, ty - 13.4, 3.8, 0, Math.PI * 2); c.fill();
  }
  // The offering stone — a flat altar slab north of the fire. Once the
  // nichnyky are laid, they glow on it for the rest of the night (and
  // every night after).
  {
    const ox = LYSA_OFFER_SPOT.x - camX;
    const oy = LYSA_OFFER_SPOT.y - camY;
    c.fillStyle = "rgba(10,10,16,0.4)";
    c.beginPath(); c.ellipse(ox, oy + 10, 30, 8, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#6a6a76";
    c.beginPath(); c.ellipse(ox, oy + 2, 27, 10, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#7d7d8a";
    c.beginPath(); c.ellipse(ox, oy, 23, 8, 0, 0, Math.PI * 2); c.fill();
    if (offered) {
      const pulse = 0.6 + Math.sin(t * 0.004) * 0.25;
      const og = c.createRadialGradient(ox, oy - 2, 2, ox, oy - 2, 30);
      og.addColorStop(0, `rgba(220,230,255,${pulse * 0.65})`);
      og.addColorStop(1, "rgba(220,230,255,0)");
      c.fillStyle = og;
      c.fillRect(ox - 30, oy - 32, 60, 60);
      c.fillStyle = "#eef0dc";
      for (const [fx, fy] of [[-11, -1], [0, -4], [11, -1]] as const) {
        c.beginPath(); c.arc(ox + fx, oy + fy, 3.4, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#c9d4f2";
        c.beginPath(); c.arc(ox + fx, oy + fy, 1.5, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#eef0dc";
      }
    }
  }
  // Broomsticks leaning on a stone + a cauldron by the ring's south side —
  // the witches' parked transport and the night 's supper.
  {
    const bx = 838 - camX;
    const by = 512 - camY;
    c.strokeStyle = "#7a5a30";
    c.lineWidth = 3;
    for (const lean of [-8, 0, 8]) {
      c.beginPath(); c.moveTo(bx + lean, by + 16); c.lineTo(bx + lean * 0.4, by - 22); c.stroke();
      c.strokeStyle = "#a8894a";
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(bx + lean * 0.4, by - 22); c.lineTo(bx + lean * 0.4 - 4, by - 31); c.stroke();
      c.beginPath(); c.moveTo(bx + lean * 0.4, by - 22); c.lineTo(bx + lean * 0.4 + 4, by - 31); c.stroke();
      c.strokeStyle = "#7a5a30";
      c.lineWidth = 3;
    }
    const cx2 = 486 - camX;
    const cy2 = 522 - camY;
    c.fillStyle = "#23202a";
    c.beginPath(); c.ellipse(cx2, cy2, 15, 11, 0, 0, Math.PI * 2); c.fill();
    const bub = 0.5 + Math.sin(t * 0.005) * 0.3;
    c.fillStyle = `rgba(178,132,220,${bub})`;
    c.beginPath(); c.ellipse(cx2, cy2 - 3, 11.6, 4.4, 0, 0, Math.PI * 2); c.fill();
  }
}

export function drawLysaFire(c: CanvasRenderingContext2D, camX: number, camY: number, t: number) {
  // The sabbath bonfire — the village campfire's wicked older brother.
  const x = LYSA_SUMMIT.x - camX;
  const y = LYSA_SUMMIT.y - camY + 14;
  const glow = c.createRadialGradient(x, y - 10, 10, x, y - 10, 190);
  glow.addColorStop(0, "rgba(255,150,50,0.5)");
  glow.addColorStop(0.55, "rgba(160,70,140,0.16)");
  glow.addColorStop(1, "rgba(120,40,120,0)");
  c.fillStyle = glow;
  c.fillRect(x - 190, y - 200, 380, 380);
  c.fillStyle = "#55555f";
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    c.beginPath(); c.ellipse(x + Math.cos(a) * 40, y + Math.sin(a) * 14, 7, 5, a, 0, Math.PI * 2); c.fill();
  }
  c.strokeStyle = "#4a3423";
  c.lineWidth = 7;
  c.beginPath(); c.moveTo(x - 24, y + 6); c.lineTo(x + 20, y - 6); c.stroke();
  c.beginPath(); c.moveTo(x + 24, y + 6); c.lineTo(x - 20, y - 6); c.stroke();
  const fl = Math.sin(t * 0.014) * 4 + Math.sin(t * 0.037) * 2.4;
  c.fillStyle = "#ff7b2e";
  c.beginPath(); c.ellipse(x, y - 22, 15, 26 + fl, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#ffa02e";
  c.beginPath(); c.ellipse(x, y - 17, 10, 18 + fl * 0.7, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#ffe89a";
  c.beginPath(); c.ellipse(x, y - 11, 5, 10 + fl * 0.4, 0, 0, Math.PI * 2); c.fill();
  // sparks — violet as well as gold, because it is that kind of fire
  for (let i = 0; i < 7; i++) {
    const sp = (t * 0.03 + i * 131) % 46;
    c.fillStyle = i % 3 === 0 ? "rgba(196,150,255,0.9)" : "rgba(255,196,110,0.9)";
    c.fillRect(x + Math.sin(t * 0.004 + i * 2.4) * (8 + sp * 0.4), y - 26 - sp, 2.2, 2.2);
  }
}

export function drawWitch(c: CanvasRenderingContext2D, x: number, y: number, tunic: string, hair: string, t: number, dancing: boolean) {
  const bob = dancing ? Math.abs(Math.sin(t * 0.006 + x * 0.2)) * 3 : Math.sin(t * 0.002 + x * 0.13) * 0.8;
  const top = y - 42 + bob * 0.4;
  c.fillStyle = "rgba(8,8,14,0.4)";
  c.beginPath(); c.ellipse(x, y + 3, 13, 4.4, 0, 0, Math.PI * 2); c.fill();
  // long skirt + bodice
  c.fillStyle = tunic;
  c.beginPath();
  c.moveTo(x, top + 10);
  c.lineTo(x - 11, top + 38);
  c.lineTo(x + 11, top + 38);
  c.closePath(); c.fill();
  rr(c, x - 7.4, top + 9, 14.8, 12, 3); c.fill();
  // arms — raised when dancing
  c.strokeStyle = tunic;
  c.lineWidth = 4;
  c.beginPath();
  if (dancing) {
    c.moveTo(x - 6, top + 12); c.lineTo(x - 13, top + 2 + Math.sin(t * 0.006 + x) * 2);
    c.moveTo(x + 6, top + 12); c.lineTo(x + 13, top + 4 + Math.cos(t * 0.006 + x) * 2);
  } else {
    c.moveTo(x - 6, top + 12); c.lineTo(x - 11, top + 24);
    c.moveTo(x + 6, top + 12); c.lineTo(x + 11, top + 24);
  }
  c.stroke();
  // head + tall pointed hat, the honest silhouette of a vidma
  c.fillStyle = "#e8b88a";
  c.beginPath(); c.ellipse(x, top + 3, 6.4, 6.8, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = hair;
  c.fillRect(x - 7.4, top + 4, 3.4, 10);
  c.fillRect(x + 4, top + 4, 3.4, 10);
  c.fillStyle = "#241f2c";
  c.beginPath(); c.ellipse(x, top - 2.6, 10.4, 2.6, 0, 0, Math.PI * 2); c.fill();
  c.beginPath();
  c.moveTo(x - 5.4, top - 3);
  c.quadraticCurveTo(x + 3, top - 24, x + 8.6, top - 27);
  c.quadraticCurveTo(x + 2, top - 12, x + 5, top - 3);
  c.closePath(); c.fill();
}

export function drawBeelzebub(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  // Beelzebub presiding: broad, horned, seated — roughly twice a mortal's
  // width, with ember eyes and a grin he keeps for guests.
  const breathe = Math.sin(t * 0.0011) * 1.6;
  const top = y - 66 + breathe;
  c.fillStyle = "rgba(6,6,10,0.5)";
  c.beginPath(); c.ellipse(x, y + 4, 34, 8, 0, 0, Math.PI * 2); c.fill();
  // vast dark robe
  c.fillStyle = "#2c2130";
  c.beginPath();
  c.moveTo(x, top + 8);
  c.lineTo(x - 26, y + 2);
  c.lineTo(x + 26, y + 2);
  c.closePath(); c.fill();
  c.fillStyle = "#3a2a3e";
  c.beginPath();
  c.moveTo(x, top + 8);
  c.lineTo(x - 10, y + 2);
  c.lineTo(x + 12, y + 2);
  c.closePath(); c.fill();
  // clawed hands resting on the throne arms
  c.fillStyle = "#4c3542";
  c.beginPath(); c.ellipse(x - 24, top + 40, 6, 8, 0.3, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(x + 24, top + 40, 6, 8, -0.3, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#d8d2c4";
  c.lineWidth = 1.4;
  for (const s of [-1, 1]) {
    for (let f = -1; f <= 1; f++) {
      c.beginPath();
      c.moveTo(x + s * 24 + f * 2.6, top + 46);
      c.lineTo(x + s * 24 + f * 3.4, top + 51);
      c.stroke();
    }
  }
  // head: heavy brow, great curved horns, ember eyes
  c.fillStyle = "#503040";
  c.beginPath(); c.ellipse(x, top + 2, 13, 12, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#e7ddc4";
  c.lineWidth = 3.4;
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(x + s * 8, top - 6);
    c.quadraticCurveTo(x + s * 22, top - 12, x + s * 20, top - 26);
    c.stroke();
  }
  const glowE = 0.7 + Math.sin(t * 0.0026) * 0.25;
  c.fillStyle = `rgba(255,120,40,${glowE})`;
  c.fillRect(x - 6.4, top + 0.4, 3.6, 3);
  c.fillRect(x + 2.8, top + 0.4, 3.6, 3);
  // a grin of filed gold teeth, kept for guests
  c.strokeStyle = "#e8c96a";
  c.lineWidth = 1.6;
  c.beginPath(); c.arc(x, top + 6, 6.4, 0.3, Math.PI - 0.3); c.stroke();
  // beard of smoke-grey hair
  c.fillStyle = "#6a6472";
  c.beginPath(); c.ellipse(x, top + 13, 7.4, 7, 0, 0, Math.PI * 2); c.fill();
}

export function drawLysaFlower(c: CanvasRenderingContext2D, sx: number, sy: number, camX: number, camY: number, t: number, available: boolean) {
  const x = sx - camX;
  const y = sy - camY;
  if (!available) {
    c.fillStyle = "#5a5a48";
    for (let i = 0; i < 3; i++) {
      c.beginPath(); c.arc(x - 5 + i * 5, y + (i % 2) * 2, 2.6, 0, Math.PI * 2); c.fill();
    }
    return;
  }
  const pulse = 0.55 + Math.sin(t * 0.004 + sx) * 0.25;
  const g = c.createRadialGradient(x, y, 2, x, y, 28);
  g.addColorStop(0, `rgba(205,218,255,${pulse * 0.6})`);
  g.addColorStop(1, "rgba(205,218,255,0)");
  c.fillStyle = g;
  c.fillRect(x - 28, y - 28, 56, 56);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + hash2(sx, i) * 0.7;
    const lx = x + Math.cos(a) * 8;
    const ly = y + Math.sin(a) * 4;
    c.strokeStyle = "#6a7256";
    c.lineWidth = 1.7;
    c.beginPath(); c.moveTo(lx, ly + 5); c.quadraticCurveTo(lx + 2, ly, lx + 3, ly - 6); c.stroke();
    // a pale bell of a flower, open to the moon
    c.fillStyle = "#eef0dc";
    c.beginPath(); c.ellipse(lx + 3, ly - 8, 3.4, 4.2, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#b9c6ee";
    c.beginPath(); c.arc(lx + 3, ly - 8, 1.6, 0, Math.PI * 2); c.fill();
  }
}