import { BACK_WALL, DOOR_GAP, HOUSE_RECTS, type HouseId, KORCHMA_ROOM, MLYN_ROOM, OTAMAN_DOORS, OTAMAN_ROOM, OTAMAN_WALLS, PUSTKA_ROOM, ROOM, WALL } from "../data/houses";
import { flagHas } from "../systems/flags";
import { hash2 } from "../world/geometry";
import { rr } from "./shapes";

// --- Inside a khata ---------------------------------------------------------
// Drawn at world scale into the khata's footprint once its roof lifts away
// (layout and the reasons for it: data/houses.ts). A khata inside is white:
// whitewashed walls, a clay floor (dolivka) smeared smooth, a painted pich,
// and colour only where people put it — rushnyky, the ornament on the pich,
// the skrynia, the lizhnyk on the pil. hut0 is the Domovyk's (and the
// kobzar's bed); hut1 is Vesna's, all herbs and bottles and a cat.
export function drawKhataInterior(
  c: CanvasRenderingContext2D,
  id: HouseId,
  x: number, y: number, t: number,
  flags: ReadonlySet<string>,
): void {
  if (id === "otaman") { drawOtamanInterior(c, x, y, t); return; }
  if (id === "korchma") { drawKorchmaInterior(c, x, y, t); return; }
  if (id === "pustka") { drawPustkaInterior(c, x, y, t, flags); return; }
  if (id === "mlyn") { drawMlynInterior(c, x, y, t); return; }
  const { w, h } = HOUSE_RECTS[id];
  const vesna = id === "hut1";
  const R = (r: { x: number; y: number; w: number; h: number }) => ({ x: x + r.x, y: y + r.y, w: r.w, h: r.h });
  const shadow = (r: { x: number; y: number; w: number; h: number }) => {
    c.fillStyle = "rgba(60,36,14,0.22)";
    rr(c, r.x + 3, r.y + 4, r.w, r.h, 4); c.fill();
  };

  // the dolivka: clay floor, smeared smooth, a little darker where feet go
  c.fillStyle = "#c19a68";
  c.fillRect(x, y, w, h);
  for (let i = 0; i < 70; i++) {
    const fx = hash2(i, 31) * w;
    const fy = hash2(i, 77) * h;
    c.fillStyle = i % 2 ? "rgba(140,98,54,0.18)" : "rgba(230,200,150,0.18)";
    c.beginPath(); c.ellipse(x + fx, y + fy, 6 + hash2(i, 5) * 10, 3 + hash2(i, 9) * 4, 0, 0, Math.PI * 2); c.fill();
  }
  // daylight from the two front windows lying on the floor
  c.fillStyle = "rgba(255,244,210,0.22)";
  for (const wx of [34, w - 70]) {
    c.beginPath();
    c.moveTo(x + wx, y + h - WALL); c.lineTo(x + wx + 36, y + h - WALL);
    c.lineTo(x + wx + 44, y + h - WALL - 40); c.lineTo(x + wx + 8, y + h - WALL - 40);
    c.closePath(); c.fill();
  }
  // a woven runner (dorizhka) from the door into the room
  {
    const rx = x + w / 2 - 13;
    const ry = y + 100;
    const rh = h - WALL - 100;
    c.fillStyle = vesna ? "#3f6a3a" : "#a8322a";
    c.fillRect(rx, ry, 26, rh);
    c.fillStyle = "#1e1a16";
    for (let sy = ry + 8; sy < ry + rh; sy += 16) c.fillRect(rx, sy, 26, 3);
    c.fillStyle = "#e8c66a";
    for (let sy = ry + 4; sy < ry + rh; sy += 16) c.fillRect(rx + 4, sy, 18, 2);
    c.fillStyle = "rgba(255,255,255,0.25)";
    for (let fx = rx + 2; fx < rx + 26; fx += 4) c.fillRect(fx, ry - 3, 1.4, 3);
  }

  // --- the walls: tops of clay walls, and the back wall's whitewashed face
  c.fillStyle = "#f4efe3";
  c.fillRect(x, y + WALL, w, BACK_WALL - WALL);
  // a painted blue band at the foot of the wall, and a row of little
  // painted flowers above it — the way the khaty were decorated for feasts
  c.fillStyle = "#3f63a8";
  c.fillRect(x, y + BACK_WALL - 4, w, 4);
  for (let fx = 24; fx < w - 20; fx += 22) {
    c.fillStyle = (fx / 22) % 2 < 1 ? "#c8402e" : "#e8a33a";
    c.beginPath(); c.arc(x + fx, y + BACK_WALL - 9, 2, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#3f7a2e";
    c.fillRect(x + fx - 4, y + BACK_WALL - 8, 3, 1.4);
    c.fillRect(x + fx + 1, y + BACK_WALL - 8, 3, 1.4);
  }
  c.fillStyle = "#ddd2bc";
  c.fillRect(x, y, w, WALL); // north wall top
  c.fillRect(x, y, WALL, h); // west
  c.fillRect(x + w - WALL, y, WALL, h); // east
  const half = (w - DOOR_GAP) / 2;
  c.fillRect(x, y + h - WALL, half, WALL);
  c.fillRect(x + w - half, y + h - WALL, half, WALL);
  c.fillStyle = "rgba(120,100,70,0.35)";
  c.fillRect(x + WALL, y + WALL, 2, h - 2 * WALL); // inner edges catch shadow
  c.fillRect(x + w - WALL - 2, y + WALL, 2, h - 2 * WALL);
  // window panes seen through the thickness of the front wall
  for (const wx of [34, w - 70]) {
    c.fillStyle = "#9cc4dc";
    c.fillRect(x + wx, y + h - WALL + 4, 36, 6);
    c.fillStyle = "#3f63a8";
    c.fillRect(x + wx + 17, y + h - WALL + 4, 2, 6);
  }
  // the door step, and the door swung inward against the wall
  c.fillStyle = "#a8643c";
  c.fillRect(x + half, y + h - WALL, DOOR_GAP, WALL);
  c.fillStyle = "#5a3a22";
  rr(c, x + half + DOOR_GAP - 6, y + h - WALL - 34, 6, 34, 2); c.fill();
  // a small window in the back wall
  {
    const wx = x + 176;
    const wy = y + 15;
    c.fillStyle = "#3f63a8";
    rr(c, wx - 2, wy - 1, 28, 15, 2); c.fill();
    c.fillStyle = "#bfe0f0";
    c.fillRect(wx, wy + 1, 24, 11);
    c.fillStyle = "#3f63a8";
    c.fillRect(wx + 11, wy + 1, 2, 11);
  }

  // --- the pokut: the icon in the NE corner under an embroidered rushnyk,
  // a lampadka burning before it
  drawIcon(c, x + w - WALL - 30, y + WALL + 2, t);

  // on the back wall: the Domovyk's khata keeps a sabre and a lyulka
  // hung on a nail; Vesna's has herbs drying on a pole under the ceiling
  if (!vesna) {
    c.strokeStyle = "#9aa0a6"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x + 26, y + 18); c.quadraticCurveTo(x + 52, y + 30, x + 80, y + 24); c.stroke();
    c.fillStyle = "#5a3a22";
    c.fillRect(x + 20, y + 15, 9, 5);
    c.strokeStyle = "#6e4525"; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(x + 92, y + 18); c.lineTo(x + 104, y + 24); c.stroke();
    c.fillStyle = "#6e4525";
    c.beginPath(); c.arc(x + 105, y + 25, 2.6, 0, Math.PI * 2); c.fill();
  } else {
    c.fillStyle = "#6e4525";
    c.fillRect(x + 20, y + 15, 150, 2);
    const cols = ["#3f7a2e", "#8a9678", "#f28c1e", "#f2c416", "#e8e2cc", "#5d8a3a", "#b0507a", "#3f7a2e", "#f2c416"];
    cols.forEach((col, i) => {
      const bx = x + 28 + i * 16;
      const sway = Math.sin(t * 0.002 + i * 1.7) * 0.8;
      c.strokeStyle = "#c9b18a"; c.lineWidth = 1;
      c.beginPath(); c.moveTo(bx, y + 17); c.lineTo(bx + sway, y + 21); c.stroke();
      c.fillStyle = col;
      c.beginPath(); c.ellipse(bx + sway, y + 25, 3.2, 5.4, sway * 0.08, 0, Math.PI * 2); c.fill();
    });
  }

  // --- the pil: a plank sleeping platform with a woollen lizhnyk and a
  // stack of embroidered pillows
  {
    const p = R(ROOM.pil);
    shadow(p);
    c.fillStyle = "#7a4a24";
    rr(c, p.x, p.y, p.w, p.h, 3); c.fill();
    c.fillStyle = vesna ? "#4c6b35" : "#8a3a2e";
    rr(c, p.x + 20, p.y + 3, p.w - 23, p.h - 6, 3); c.fill();
    c.fillStyle = vesna ? "#d9c27a" : "#e8b84a";
    for (let sx = p.x + 26; sx < p.x + p.w - 6; sx += 9) c.fillRect(sx, p.y + 3, 2.4, p.h - 6);
    c.fillStyle = "rgba(0,0,0,0.18)";
    c.fillRect(p.x + 20, p.y + p.h - 10, p.w - 23, 7);
    for (const [py, ph] of [[p.y + 4, 22], [p.y + 28, 22]] as const) {
      c.fillStyle = "#fbf7ee";
      rr(c, p.x + 3, py, 18, ph, 4); c.fill();
      c.fillStyle = "#c8402e";
      c.fillRect(p.x + 5, py + ph - 4, 14, 2);
    }
  }

  // --- the skrynia (painted dowry chest) — or Vesna's tinctures stand
  {
    const s = R(ROOM.skrynia);
    shadow(s);
    if (!vesna) {
      c.fillStyle = "#2e6a6a";
      rr(c, s.x, s.y, s.w, s.h, 3); c.fill();
      c.fillStyle = "#3d8080";
      c.fillRect(s.x + 2, s.y + 2, s.w - 4, 6);
      c.fillStyle = "#3a3230";
      c.fillRect(s.x + 8, s.y, 3, s.h);
      c.fillRect(s.x + s.w - 11, s.y, 3, s.h);
      for (const [fx, col] of [[s.x + 18, "#e8a33a"], [s.x + 24, "#c8402e"], [s.x + 30, "#e8a33a"]] as const) {
        c.fillStyle = col;
        c.beginPath(); c.arc(fx, s.y + 14, 2.6, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = "#d9a441";
      c.fillRect(s.x + s.w / 2 - 2, s.y + 6, 4, 4);
    } else {
      c.fillStyle = "#6e4525";
      rr(c, s.x, s.y, s.w, s.h, 2); c.fill();
      const bc = ["#7fb069", "#c98d45", "#7a9ab0", "#b06a8a", "#d8c25a"];
      bc.forEach((col, i) => {
        const bx = s.x + 5 + i * 9;
        c.fillStyle = col;
        rr(c, bx, s.y + 4, 6, 12, 2); c.fill();
        c.fillStyle = "rgba(255,255,255,0.4)";
        c.fillRect(bx + 1, s.y + 6, 1.4, 6);
        c.fillStyle = "#c9a86a";
        c.fillRect(bx + 1.5, s.y + 1.5, 3, 3);
      });
    }
  }

  // --- lavy along the back and east walls
  for (const r of [ROOM.lavaN, ROOM.lavaE]) {
    const b = R(r);
    shadow(b);
    c.fillStyle = "#8a5a2e";
    rr(c, b.x, b.y, b.w, b.h, 2); c.fill();
    c.fillStyle = "rgba(255,220,160,0.18)";
    if (b.w > b.h) c.fillRect(b.x, b.y, b.w, 2); else c.fillRect(b.x, b.y, 2, b.h);
  }

  // --- the table in the pokut: a white cloth with a red border
  {
    const tb = R(ROOM.table);
    shadow(tb);
    c.fillStyle = "#7a4a24";
    rr(c, tb.x, tb.y, tb.w, tb.h, 3); c.fill();
    c.fillStyle = "#faf6ec";
    rr(c, tb.x + 3, tb.y + 3, tb.w - 6, tb.h - 6, 2); c.fill();
    c.strokeStyle = "#c8402e"; c.lineWidth = 1.4;
    c.strokeRect(tb.x + 6, tb.y + 6, tb.w - 12, tb.h - 12);
    if (!vesna) {
      // a palianytsia, a salt cellar, a kahanets (clay lamp)
      c.fillStyle = "#b8742e";
      c.beginPath(); c.ellipse(tb.x + 22, tb.y + 20, 11, 8, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#d89a4a";
      c.beginPath(); c.ellipse(tb.x + 22, tb.y + 18, 8, 5, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#8a5420"; c.lineWidth = 1;
      c.beginPath(); c.moveTo(tb.x + 16, tb.y + 18); c.lineTo(tb.x + 28, tb.y + 18); c.stroke();
      c.fillStyle = "#e8e2cc";
      c.beginPath(); c.arc(tb.x + 38, tb.y + 16, 3, 0, Math.PI * 2); c.fill();
    } else {
      // a mortar and pestle, loose herbs, her book of cures
      c.fillStyle = "#5d6b72";
      c.beginPath(); c.ellipse(tb.x + 16, tb.y + 20, 7, 5, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#8d8b85"; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(tb.x + 14, tb.y + 17); c.lineTo(tb.x + 22, tb.y + 10); c.stroke();
      c.fillStyle = "#3f7a2e";
      for (const [hx, hy] of [[28, 14], [32, 22], [26, 26]] as const) {
        c.beginPath(); c.arc(tb.x + hx, tb.y + hy, 2.2, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = "#6a3a20";
      rr(c, tb.x + 40, tb.y + 10, 14, 18, 1.5); c.fill();
      c.fillStyle = "#f7efdb";
      c.fillRect(tb.x + 42, tb.y + 12, 10, 14);
    }
    // the kahanets, with its flame
    const lx = tb.x + tb.w - 14;
    const ly = tb.y + tb.h - 14;
    c.fillStyle = "#a85f38";
    c.beginPath(); c.ellipse(lx, ly, 5, 3.4, 0, 0, Math.PI * 2); c.fill();
    const fl = 2.4 + Math.sin(t * 0.02) * 0.7;
    c.fillStyle = "#ffb02e";
    c.beginPath(); c.ellipse(lx + 3, ly - 3, 1.8, fl + 1, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#ffe89a";
    c.beginPath(); c.ellipse(lx + 3, ly - 2.6, 0.9, fl, 0, 0, Math.PI * 2); c.fill();
    const lg = c.createRadialGradient(lx, ly, 4, lx, ly, 90);
    lg.addColorStop(0, "rgba(255,190,90,0.22)");
    lg.addColorStop(1, "rgba(255,190,90,0)");
    c.fillStyle = lg;
    c.fillRect(lx - 90, ly - 90, 180, 180);
  }

  // --- the mysnyk by the door: bowls, plates and glechyky on its shelves
  {
    const m = R(ROOM.mysnyk);
    shadow(m);
    c.fillStyle = "#6e4525";
    rr(c, m.x, m.y, m.w, m.h, 2); c.fill();
    c.fillStyle = "#4e3018";
    for (let sy = m.y + 14; sy < m.y + m.h; sy += 14) c.fillRect(m.x, sy, m.w, 2);
    const dish = ["#e8e2cc", "#3f63a8", "#c8402e", "#e8a33a", "#e8e2cc", "#3f7a2e"];
    dish.forEach((col, i) => {
      c.fillStyle = col;
      c.beginPath(); c.arc(m.x + 5 + (i % 2) * 6, m.y + 7 + Math.floor(i / 2) * 14, 3.4, 0, Math.PI * 2); c.fill();
    });
  }

  // --- the pich: a broad whitewashed stove in the corner by the door,
  // painted with flowers, its mouth (cheliusti) open to the room
  {
    const p = R(ROOM.pich);
    const { mx, my } = drawPich(c, p, t);
    if (vesna) {
      // her pot sits in the mouth, something green at a slow bubble
      c.fillStyle = "#2e2a26";
      c.beginPath(); c.ellipse(mx + 15, my + 17, 8, 7, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = `rgba(140,220,150,${0.55 + Math.sin(t * 0.006) * 0.25})`;
      c.beginPath(); c.ellipse(mx + 15, my + 15, 6, 3.4, 0, 0, Math.PI * 2); c.fill();
      const st = (t * 0.0005) % 1;
      c.fillStyle = `rgba(240,238,232,${0.45 * (1 - st)})`;
      c.beginPath(); c.arc(mx + 20 + st * 14, my + 12 - st * 16, 2.4 + st * 4, 0, Math.PI * 2); c.fill();
      // and the cat asleep on the warm top of the pich
      const cx = p.x + 52;
      const cy = p.y + 30;
      const br = Math.sin(t * 0.0016) * 0.6;
      c.fillStyle = "#4c4438";
      c.beginPath(); c.ellipse(cx, cy, 11 + br, 6.4, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(cx + 9, cy - 2, 4.8, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(cx + 6, cy - 6); c.lineTo(cx + 7.5, cy - 9.5); c.lineTo(cx + 9.5, cy - 6); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(cx + 10, cy - 6); c.lineTo(cx + 12.5, cy - 9.5); c.lineTo(cx + 13.5, cy - 5); c.closePath(); c.fill();
      c.strokeStyle = "#4c4438"; c.lineWidth = 2.4;
      c.beginPath(); c.moveTo(cx - 10, cy + 2); c.quadraticCurveTo(cx - 15, cy - 3, cx - 12, cy - 7); c.stroke();
    } else {
      // a pot of kulish on the lezhanka, keeping warm
      c.fillStyle = "#a85f38";
      c.beginPath(); c.ellipse(p.x + 48, p.y + 22, 7, 5.4, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#e0c070";
      c.beginPath(); c.ellipse(p.x + 48, p.y + 20, 5, 2.4, 0, 0, Math.PI * 2); c.fill();
    }
    // the pripichok ledge in front of the mouth: where the Domovyk's
    // crust is left, and where his gift glints in the morning
    if (!vesna && flagHas(flags, "offering")) {
      c.fillStyle = "#c98d45";
      c.beginPath(); c.ellipse(p.x + p.w + 8, p.y + 76, 6, 3.6, -0.2, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#e8c98a";
      c.beginPath(); c.arc(p.x + p.w + 15, p.y + 79, 1.4, 0, Math.PI * 2); c.fill();
      if (!flagHas(flags, "stone")) {
        const tw = 0.5 + Math.sin(t * 0.005) * 0.5;
        c.fillStyle = `rgba(255,250,210,${0.4 + tw * 0.5})`;
        c.beginPath(); c.arc(p.x + p.w + 6, p.y + 66, 1.6 + tw * 1.4, 0, Math.PI * 2); c.fill();
      }
    }
    drawUkhvat(c, p);
  }

  // a broom by the door (no khata of the Domovyk's lacks one); Vesna
  // keeps a basket of fresh-cut herbs there instead
  const bx = x + w / 2 + DOOR_GAP / 2 + 10;
  const by = y + h - WALL - 4;
  if (!vesna) {
    c.strokeStyle = "#7a5a30"; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(bx + 6, by); c.lineTo(bx, by - 30); c.stroke();
    c.fillStyle = "#c9a86a";
    c.beginPath(); c.moveTo(bx + 6, by); c.lineTo(bx + 1, by - 12); c.lineTo(bx + 12, by - 12); c.closePath(); c.fill();
  } else {
    c.fillStyle = "#a8854a";
    c.beginPath(); c.ellipse(bx + 6, by - 6, 10, 7, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#3f7a2e";
    for (const [hx, hy] of [[2, -10], [8, -12], [12, -9], [5, -7]] as const) {
      c.beginPath(); c.arc(bx + hx, by + hy, 2.6, 0, Math.PI * 2); c.fill();
    }
  }
}

type Box = { x: number; y: number; w: number; h: number };

// The pich every khata is built around: a broad whitewashed stove in the
// corner by the door, painted with flowers, its mouth (cheliusti) open to
// the room with the fire breathing in it. Returns where the mouth is, so
// each khata can set its own pot in it.
function drawPich(c: CanvasRenderingContext2D, p: Box, t: number): { mx: number; my: number } {
  const glow = c.createRadialGradient(p.x + p.w, p.y + 52, 4, p.x + p.w, p.y + 52, 90);
  glow.addColorStop(0, "rgba(255,150,60,0.32)");
  glow.addColorStop(1, "rgba(255,150,60,0)");
  c.fillStyle = glow;
  c.fillRect(p.x, p.y - 40, 190, 150);
  c.fillStyle = "rgba(60,36,14,0.22)";
  rr(c, p.x + 3, p.y + 4, p.w, p.h, 4); c.fill();
  // the body, its top (the warm lezhanka where people sleep) lighter
  c.fillStyle = "#e6dfcf";
  rr(c, p.x, p.y, p.w, p.h, 6); c.fill();
  c.fillStyle = "#f6f2e8";
  rr(c, p.x + 2, p.y + 2, p.w - 4, p.h - 26, 5); c.fill();
  // the chimney rising into the back corner
  c.fillStyle = "#d9d0bc";
  rr(c, p.x + 4, p.y + 4, 26, 24, 3); c.fill();
  c.fillStyle = "#4a3e34";
  c.fillRect(p.x + 10, p.y + 9, 14, 8);
  // painted ornament along the front: red and blue flowers on green stems
  for (let i = 0; i < 4; i++) {
    const fx = p.x + 12 + i * 19;
    const fy = p.y + p.h - 12;
    c.strokeStyle = "#3f7a2e"; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(fx, fy + 6); c.quadraticCurveTo(fx + 3, fy + 2, fx, fy - 2); c.stroke();
    c.fillStyle = i % 2 ? "#3f63a8" : "#c8402e";
    c.beginPath(); c.arc(fx, fy - 3, 3, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#e8a33a";
    c.beginPath(); c.arc(fx, fy - 3, 1.2, 0, Math.PI * 2); c.fill();
  }
  // the mouth on the room side: a dark arch, fire breathing in it
  const mx = p.x + p.w - 22;
  const my = p.y + 34;
  c.fillStyle = "#d9d0bc";
  rr(c, mx - 4, my - 4, 26, 42, 4); c.fill();
  c.fillStyle = "#241610";
  c.beginPath();
  c.moveTo(mx + 22, my); c.lineTo(mx + 8, my);
  c.quadraticCurveTo(mx, my + 17, mx + 8, my + 34);
  c.lineTo(mx + 22, my + 34); c.closePath(); c.fill();
  const fl = 4 + Math.sin(t * 0.017) * 1.5 + Math.sin(t * 0.041) * 0.9;
  c.fillStyle = "#ff8b2e";
  c.beginPath(); c.ellipse(mx + 13, my + 17, fl + 2, 9, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#ffd76a";
  c.beginPath(); c.ellipse(mx + 13, my + 18, fl - 1, 5, 0, 0, Math.PI * 2); c.fill();
  return { mx, my };
}

// the ukhvat (oven fork) leaning against the pich
function drawUkhvat(c: CanvasRenderingContext2D, p: Box): void {
  c.strokeStyle = "#7a5a30"; c.lineWidth = 2;
  c.beginPath(); c.moveTo(p.x + p.w + 4, p.y + p.h - 4); c.lineTo(p.x + p.w - 6, p.y + 12); c.stroke();
  c.strokeStyle = "#5d5852"; c.lineWidth = 1.6;
  c.beginPath(); c.arc(p.x + p.w - 6, p.y + 9, 4, Math.PI * 0.9, Math.PI * 2.1); c.stroke();
}

// the icon under its rushnyk (red ends hanging), a lampadka before it
function drawIcon(c: CanvasRenderingContext2D, ix: number, iy: number, t: number): void {
  c.fillStyle = "#b8862a";
  rr(c, ix, iy, 18, 15, 1.5); c.fill();
  c.fillStyle = "#6a3a20";
  c.fillRect(ix + 3, iy + 3, 12, 9);
  c.fillStyle = "#f0c860";
  c.beginPath(); c.arc(ix + 9, iy + 6, 2.6, 0, Math.PI * 2); c.fill();
  // the rushnyk draped over it, red ends hanging
  c.fillStyle = "#faf6ec";
  c.beginPath();
  c.moveTo(ix - 7, iy - 1); c.quadraticCurveTo(ix + 9, iy + 5, ix + 25, iy - 1);
  c.lineTo(ix + 25, iy + 17); c.lineTo(ix + 21, iy + 17); c.lineTo(ix + 21, iy + 3);
  c.quadraticCurveTo(ix + 9, iy + 7, ix - 3, iy + 3);
  c.lineTo(ix - 3, iy + 17); c.lineTo(ix - 7, iy + 17); c.closePath(); c.fill();
  c.fillStyle = "#c8402e";
  c.fillRect(ix - 7, iy + 12, 4, 3);
  c.fillRect(ix + 21, iy + 12, 4, 3);
  const fl = 1.6 + Math.sin(t * 0.013) * 0.4;
  c.fillStyle = "#b03a2e";
  c.beginPath(); c.arc(ix + 9, iy + 17, 2, 0, Math.PI); c.fill();
  c.fillStyle = "#ffcf5a";
  c.beginPath(); c.ellipse(ix + 9, iy + 15, 1.1, fl, 0, 0, Math.PI * 2); c.fill();
}

// --- The otaman's khata -----------------------------------------------------
// Built "through the siny" (data/houses.ts): the clay-floored passage in
// the middle, the working khata with the pich to the west, and to the east
// the svitlytsia — the clean room, planked and carpeted, where Myroslav
// sits under his sabres and judges who stole whose fence-post.
function drawOtamanInterior(c: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  const { w, h } = HOUSE_RECTS.otaman;
  const R = (r: Box): Box => ({ x: x + r.x, y: y + r.y, w: r.w, h: r.h });
  const shadow = (r: Box) => {
    c.fillStyle = "rgba(60,36,14,0.22)";
    rr(c, r.x + 3, r.y + 4, r.w, r.h, 4); c.fill();
  };
  const west = OTAMAN_WALLS.west;
  const east = OTAMAN_WALLS.east + OTAMAN_WALLS.w;
  const room = OTAMAN_ROOM;

  // floors: clay in the khata and the siny, planks in the svitlytsia
  c.fillStyle = "#c19a68";
  c.fillRect(x, y, east, h);
  for (let i = 0; i < 40; i++) {
    c.fillStyle = i % 2 ? "rgba(140,98,54,0.18)" : "rgba(230,200,150,0.18)";
    c.beginPath(); c.ellipse(x + hash2(i, 13) * east, y + hash2(i, 17) * h, 6 + hash2(i, 5) * 9, 3 + hash2(i, 9) * 3, 0, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = "rgba(90,60,30,0.16)"; // the siny are trodden darker
  c.fillRect(x + west + OTAMAN_WALLS.w, y, OTAMAN_WALLS.east - west - OTAMAN_WALLS.w, h);
  c.fillStyle = "#b07e4a";
  c.fillRect(x + east, y, w - east, h);
  c.strokeStyle = "rgba(90,56,26,0.45)"; c.lineWidth = 1;
  for (let py = y + BACK_WALL + 12; py < y + h; py += 12) {
    c.beginPath(); c.moveTo(x + east, py); c.lineTo(x + w, py); c.stroke();
    const off = (py / 12) % 2 ? 40 : 0;
    for (let px = x + east + 20 + off; px < x + w; px += 80) {
      c.beginPath(); c.moveTo(px, py - 12); c.lineTo(px, py); c.stroke();
    }
  }
  // the kylym on the svitlytsia floor: red field, black and gold lozenges
  {
    const kx = x + 248;
    const ky = y + 130;
    const kw = 96;
    const kh = 48;
    c.fillStyle = "#9c2a24";
    c.fillRect(kx, ky, kw, kh);
    c.fillStyle = "#1e1a16";
    c.fillRect(kx, ky, kw, 5); c.fillRect(kx, ky + kh - 5, kw, 5);
    for (let i = 0; i < 4; i++) {
      const cx = kx + 14 + i * 23;
      const cy = ky + kh / 2;
      c.fillStyle = i % 2 ? "#e8b84a" : "#1e1a16";
      c.beginPath(); c.moveTo(cx, cy - 12); c.lineTo(cx + 9, cy); c.lineTo(cx, cy + 12); c.lineTo(cx - 9, cy); c.closePath(); c.fill();
      c.fillStyle = i % 2 ? "#9c2a24" : "#e8b84a";
      c.beginPath(); c.moveTo(cx, cy - 5); c.lineTo(cx + 4, cy); c.lineTo(cx, cy + 5); c.lineTo(cx - 4, cy); c.closePath(); c.fill();
    }
    c.fillStyle = "rgba(255,255,255,0.3)";
    for (let fx = kx + 2; fx < kx + kw; fx += 4) { c.fillRect(fx, ky - 3, 1.2, 3); c.fillRect(fx, ky + kh, 1.2, 3); }
  }

  // --- walls: the back wall's whitewashed face, with the blue band
  c.fillStyle = "#f4efe3";
  c.fillRect(x, y + WALL, w, BACK_WALL - WALL);
  c.fillStyle = "#3f63a8";
  c.fillRect(x, y + BACK_WALL - 4, w, 4);
  // in the svitlytsia the band carries a painted vine, not just flowers
  c.strokeStyle = "#3f7a2e"; c.lineWidth = 1.2;
  c.beginPath();
  for (let fx = east + 6; fx < w - WALL; fx += 2) {
    const fy = y + BACK_WALL - 9 + Math.sin(fx * 0.25) * 2.2;
    if (fx === east + 6) c.moveTo(x + fx, fy); else c.lineTo(x + fx, fy);
  }
  c.stroke();
  for (let fx = east + 12; fx < w - WALL; fx += 16) {
    c.fillStyle = (fx / 16) % 2 < 1 ? "#c8402e" : "#e8a33a";
    c.beginPath(); c.arc(x + fx, y + BACK_WALL - 9 + Math.sin(fx * 0.25) * 2.2, 2, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = "#ddd2bc";
  c.fillRect(x, y, w, WALL);
  c.fillRect(x, y, WALL, h);
  c.fillRect(x + w - WALL, y, WALL, h);
  const half = (w - DOOR_GAP) / 2;
  c.fillRect(x, y + h - WALL, half, WALL);
  c.fillRect(x + w - half, y + h - WALL, half, WALL);
  // the two partitions, each with a door into the siny
  for (const px of [west, OTAMAN_WALLS.east]) {
    c.fillStyle = "#ddd2bc";
    c.fillRect(x + px, y + BACK_WALL, OTAMAN_WALLS.w, OTAMAN_DOORS.y - BACK_WALL);
    c.fillRect(x + px, y + OTAMAN_DOORS.y + OTAMAN_DOORS.h, OTAMAN_WALLS.w, 186 - OTAMAN_DOORS.y - OTAMAN_DOORS.h);
    c.fillStyle = "rgba(120,100,70,0.35)";
    c.fillRect(x + px, y + BACK_WALL, OTAMAN_WALLS.w, 2);
    // the door, swung open against the partition
    c.fillStyle = "#6e4525";
    c.fillRect(x + px + 2, y + OTAMAN_DOORS.y - 1, OTAMAN_WALLS.w - 4, 3);
    c.fillStyle = "#a8643c";
    c.fillRect(x + px, y + OTAMAN_DOORS.y, OTAMAN_WALLS.w, OTAMAN_DOORS.h);
  }
  c.fillStyle = "rgba(120,100,70,0.35)";
  c.fillRect(x + WALL, y + WALL, 2, h - 2 * WALL);
  c.fillRect(x + w - WALL - 2, y + WALL, 2, h - 2 * WALL);
  // windows in the front wall: two for each room, none for the siny
  for (const wx of [30, 92, 250, 316]) {
    c.fillStyle = "#9cc4dc";
    c.fillRect(x + wx, y + h - WALL + 4, 32, 6);
    c.fillStyle = "#3f63a8";
    c.fillRect(x + wx + 15, y + h - WALL + 4, 2, 6);
    c.fillStyle = "rgba(255,244,210,0.2)";
    c.beginPath();
    c.moveTo(x + wx, y + h - WALL); c.lineTo(x + wx + 32, y + h - WALL);
    c.lineTo(x + wx + 40, y + h - WALL - 34); c.lineTo(x + wx + 8, y + h - WALL - 34);
    c.closePath(); c.fill();
  }
  // the front door step
  c.fillStyle = "#a8643c";
  c.fillRect(x + half, y + h - WALL, DOOR_GAP, WALL);

  // --- the khata (west): the pich, the pil, a lava, the bread trough
  {
    const p = R(room.pil);
    shadow(p);
    c.fillStyle = "#7a4a24";
    rr(c, p.x, p.y, p.w, p.h, 3); c.fill();
    c.fillStyle = "#3a4a7a";
    rr(c, p.x + 16, p.y + 3, p.w - 19, p.h - 6, 3); c.fill();
    c.fillStyle = "#d8c27a";
    for (let sx = p.x + 21; sx < p.x + p.w - 5; sx += 8) c.fillRect(sx, p.y + 3, 2, p.h - 6);
    c.fillStyle = "#fbf7ee";
    rr(c, p.x + 3, p.y + 5, 14, 18, 4); c.fill();
    rr(c, p.x + 3, p.y + 26, 14, 18, 4); c.fill();
  }
  {
    const b = R(room.lava);
    shadow(b);
    c.fillStyle = "#8a5a2e";
    rr(c, b.x, b.y, b.w, b.h, 2); c.fill();
    // a cushion on the lava: the guest's place, kept for singers
    c.fillStyle = "#c98d45";
    c.beginPath(); c.ellipse(b.x + 40, b.y + 6, 7, 4, 0, 0, Math.PI * 2); c.fill();
  }
  {
    const p = R(room.pich);
    const { mx, my } = drawPich(c, p, t);
    // a pot of borshch in the mouth, and a palianytsia cooling on top
    c.fillStyle = "#a85f38";
    c.beginPath(); c.ellipse(mx + 15, my + 17, 7, 6, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#a8322a";
    c.beginPath(); c.ellipse(mx + 15, my + 15, 5, 2.6, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#b8742e";
    c.beginPath(); c.ellipse(p.x + 44, p.y + 20, 10, 7, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#d89a4a";
    c.beginPath(); c.ellipse(p.x + 44, p.y + 18, 7, 4.4, 0, 0, Math.PI * 2); c.fill();
    drawUkhvat(c, p);
  }
  {
    const d = R(room.dizha);
    shadow(d);
    c.fillStyle = "#7a4a24";
    c.beginPath(); c.ellipse(d.x + d.w / 2, d.y + d.h / 2, d.w / 2, d.h / 2, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#efe3c8"; // dough rising under a cloth
    c.beginPath(); c.ellipse(d.x + d.w / 2, d.y + d.h / 2 - 1, d.w / 2 - 3, d.h / 2 - 4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#c8402e";
    c.fillRect(d.x + 3, d.y + d.h / 2 - 1, d.w - 6, 2);
  }
  // a rushnyk over the khata's corner, where its own little icon hangs
  drawIcon(c, x + 112, y + WALL + 2, t);

  // --- the siny: a ladder up to the horyshche, a barrel, a saddle on a peg
  {
    const l = R(room.ladder);
    c.strokeStyle = "#7a5a30"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(l.x + 3, y + WALL); c.lineTo(l.x + 3, l.y + l.h); c.stroke();
    c.beginPath(); c.moveTo(l.x + l.w - 3, y + WALL); c.lineTo(l.x + l.w - 3, l.y + l.h); c.stroke();
    c.lineWidth = 1.6;
    for (let ry = y + WALL + 4; ry < l.y + l.h; ry += 6) {
      c.beginPath(); c.moveTo(l.x + 3, ry); c.lineTo(l.x + l.w - 3, ry); c.stroke();
    }
    const b = R(room.barrel);
    shadow(b);
    c.fillStyle = "#7a4a24";
    c.beginPath(); c.arc(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#3a3230"; c.lineWidth = 1.6;
    c.beginPath(); c.arc(b.x + b.w / 2, b.y + b.h / 2, b.w / 2 - 2, 0, Math.PI * 2); c.stroke();
    c.fillStyle = "#5a3a22";
    c.beginPath(); c.arc(b.x + b.w / 2, b.y + b.h / 2, b.w / 2 - 4, 0, Math.PI * 2); c.fill();
    // a kovsh (ladle) hooked on the rim
    c.fillStyle = "#8a6a3a";
    c.beginPath(); c.ellipse(b.x + b.w / 2 + 3, b.y + b.h / 2, 3.4, 2.4, 0, 0, Math.PI * 2); c.fill();
    // a saddle and bridle on a peg by the front door
    c.fillStyle = "#6a3a20";
    rr(c, x + 196, y + 150, 18, 12, 4); c.fill();
    c.fillStyle = "#8a5a2e";
    c.fillRect(x + 196, y + 154, 18, 3);
    c.strokeStyle = "#3a2a1c"; c.lineWidth = 1.2;
    c.beginPath(); c.arc(x + 172, y + 158, 6, 0, Math.PI * 2); c.stroke();
  }

  // --- the svitlytsia (east)
  // on the back wall, his arms: two crossed sabres, a pair of pistols and
  // a long musket, all of it on a red cloth
  {
    c.fillStyle = "#8a2a24";
    c.fillRect(x + 296, y + WALL + 1, 44, 18);
    c.strokeStyle = "#c8ccd0"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x + 300, y + WALL + 16); c.quadraticCurveTo(x + 318, y + WALL + 6, x + 336, y + WALL + 2); c.stroke();
    c.beginPath(); c.moveTo(x + 336, y + WALL + 16); c.quadraticCurveTo(x + 318, y + WALL + 6, x + 300, y + WALL + 2); c.stroke();
    c.fillStyle = "#d9a441";
    c.fillRect(x + 298, y + WALL + 14, 5, 4);
    c.fillRect(x + 333, y + WALL + 14, 5, 4);
    c.strokeStyle = "#5a3a22"; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(x + 246, y + WALL + 6); c.lineTo(x + 292, y + WALL + 6); c.stroke();
    c.strokeStyle = "#5d5852"; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(x + 262, y + WALL + 5); c.lineTo(x + 292, y + WALL + 5); c.stroke();
    for (const px of [248, 270]) {
      c.fillStyle = "#5a3a22";
      rr(c, x + px, y + WALL + 11, 8, 5, 2); c.fill();
      c.fillStyle = "#5d5852";
      c.fillRect(x + px + 7, y + WALL + 12, 10, 2.4);
    }
  }
  drawIcon(c, x + w - WALL - 30, y + WALL + 2, t);
  {
    const s = R(room.skrynia);
    shadow(s);
    c.fillStyle = "#9c3a2a";
    rr(c, s.x, s.y, s.w, s.h, 3); c.fill();
    c.fillStyle = "#b44a36";
    c.fillRect(s.x + 2, s.y + 2, s.w - 4, 6);
    c.fillStyle = "#3a3230";
    c.fillRect(s.x + 7, s.y, 3, s.h);
    c.fillRect(s.x + s.w - 10, s.y, 3, s.h);
    for (const [fx, col] of [[s.x + 18, "#e8c66a"], [s.x + 24, "#3f63a8"], [s.x + 30, "#e8c66a"]] as const) {
      c.fillStyle = col;
      c.beginPath(); c.arc(fx, s.y + 14, 2.6, 0, Math.PI * 2); c.fill();
    }
    // his blue kuntush folded on the lid
    c.fillStyle = "#2c4a8a";
    rr(c, s.x + 12, s.y + 3, 22, 8, 2); c.fill();
  }
  {
    const b = R(room.lavaE);
    shadow(b);
    c.fillStyle = "#8a5a2e";
    rr(c, b.x, b.y, b.w, b.h, 2); c.fill();
    // a kylym thrown over the bench, as it is for guests
    c.fillStyle = "#9c2a24";
    c.fillRect(b.x + 1, b.y + 20, b.w - 2, 60);
    c.fillStyle = "#e8b84a";
    for (let ky = b.y + 26; ky < b.y + 78; ky += 12) c.fillRect(b.x + 4, ky, b.w - 8, 3);
  }
  {
    const tb = R(room.table);
    shadow(tb);
    c.fillStyle = "#6a3a1c";
    rr(c, tb.x, tb.y, tb.w, tb.h, 3); c.fill();
    c.fillStyle = "#faf6ec";
    rr(c, tb.x + 3, tb.y + 3, tb.w - 6, tb.h - 6, 2); c.fill();
    c.strokeStyle = "#c8402e"; c.lineWidth = 1.4;
    c.strokeRect(tb.x + 6, tb.y + 6, tb.w - 12, tb.h - 12);
    c.strokeStyle = "#1e1a16"; c.lineWidth = 0.8;
    c.strokeRect(tb.x + 8, tb.y + 8, tb.w - 16, tb.h - 16);
    // the pernach (the otaman's mace), his papers, ink and a quill
    c.strokeStyle = "#8a6a3a"; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(tb.x + 12, tb.y + 30); c.lineTo(tb.x + 30, tb.y + 22); c.stroke();
    c.fillStyle = "#d9a441";
    c.beginPath(); c.arc(tb.x + 32, tb.y + 21, 4.4, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#f2d07a";
    c.beginPath(); c.arc(tb.x + 31, tb.y + 20, 1.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#efe3c8";
    c.save(); c.translate(tb.x + 44, tb.y + 18); c.rotate(-0.12);
    c.fillRect(-7, -6, 14, 18);
    c.strokeStyle = "#8a7a6a"; c.lineWidth = 0.8;
    for (let ly = -3; ly < 10; ly += 3) { c.beginPath(); c.moveTo(-5, ly); c.lineTo(5, ly); c.stroke(); }
    c.restore();
    c.fillStyle = "#1e1a16";
    c.beginPath(); c.arc(tb.x + 54, tb.y + 30, 2.6, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#f4efe3"; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(tb.x + 54, tb.y + 29); c.lineTo(tb.x + 60, tb.y + 20); c.stroke();
    // a brass candlestick with its flame and its light
    const lx = tb.x + 22;
    const ly = tb.y + tb.h - 10;
    c.fillStyle = "#c9a040";
    c.beginPath(); c.arc(lx, ly, 3.4, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#f4efe3";
    c.fillRect(lx - 1, ly - 7, 2, 6);
    const fl = 2.4 + Math.sin(t * 0.02) * 0.7;
    c.fillStyle = "#ffb02e";
    c.beginPath(); c.ellipse(lx, ly - 9, 1.6, fl + 1, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#ffe89a";
    c.beginPath(); c.ellipse(lx, ly - 8.6, 0.8, fl, 0, 0, Math.PI * 2); c.fill();
    const lg = c.createRadialGradient(lx, ly, 4, lx, ly, 100);
    lg.addColorStop(0, "rgba(255,190,90,0.22)");
    lg.addColorStop(1, "rgba(255,190,90,0)");
    c.fillStyle = lg;
    c.fillRect(lx - 100, ly - 100, 200, 200);
    // the otaman's carved chair at the head of the table
    c.fillStyle = "#5a3a22";
    rr(c, tb.x - 14, tb.y + 10, 12, 22, 2); c.fill();
    c.fillStyle = "#8a2a24";
    rr(c, tb.x - 12, tb.y + 13, 8, 16, 2); c.fill();
  }
}

// --- The korchma --------------------------------------------------------------
// One smoky hall with log walls: the shynkvas across the back with the
// barrels behind it, Okhrim's debt chalked on its front, two long tables
// with mugs and pickles, the pich by the door, a lantern over it all, and
// a dog asleep where the floor is warmest.
function drawKorchmaInterior(c: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  const { w, h } = HOUSE_RECTS.korchma;
  const R = (r: Box): Box => ({ x: x + r.x, y: y + r.y, w: r.w, h: r.h });
  const shadow = (r: Box) => {
    c.fillStyle = "rgba(30,18,6,0.3)";
    rr(c, r.x + 3, r.y + 4, r.w, r.h, 3); c.fill();
  };
  const room = KORCHMA_ROOM;

  // a plank floor, dark with years of spilled horilka, straw underfoot
  c.fillStyle = "#7e5630";
  c.fillRect(x, y, w, h);
  c.strokeStyle = "rgba(50,30,12,0.5)"; c.lineWidth = 1;
  for (let py = y + BACK_WALL + 11; py < y + h; py += 11) {
    c.beginPath(); c.moveTo(x, py); c.lineTo(x + w, py); c.stroke();
  }
  c.strokeStyle = "rgba(224,190,100,0.5)"; c.lineWidth = 1;
  for (let i = 0; i < 46; i++) {
    const sx = x + hash2(i, 91) * w;
    const sy = y + BACK_WALL + hash2(i, 93) * (h - BACK_WALL);
    const a = hash2(i, 95) * Math.PI;
    c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.cos(a) * 6, sy + Math.sin(a) * 6); c.stroke();
  }
  c.fillStyle = "rgba(40,24,10,0.22)";
  for (let i = 0; i < 6; i++) {
    c.beginPath(); c.ellipse(x + 40 + hash2(i, 61) * (w - 80), y + 60 + hash2(i, 63) * 120, 8 + hash2(i, 65) * 8, 4, 0, 0, Math.PI * 2); c.fill();
  }
  // daylight (or lamplight) from the front windows
  c.fillStyle = "rgba(255,230,170,0.16)";
  for (const wx of [34, 96, w - 126, w - 64]) {
    c.beginPath();
    c.moveTo(x + wx, y + h - WALL); c.lineTo(x + wx + 26, y + h - WALL);
    c.lineTo(x + wx + 32, y + h - WALL - 30); c.lineTo(x + wx + 6, y + h - WALL - 30);
    c.closePath(); c.fill();
  }

  // --- walls: logs, inside as outside
  for (let ly = y + WALL; ly < y + BACK_WALL; ly += 7) {
    c.fillStyle = (ly - y) % 14 < 7 ? "#7e5230" : "#8a5a32";
    c.fillRect(x, ly, w, 6.4);
    c.fillStyle = "rgba(40,24,10,0.45)";
    c.fillRect(x, ly + 6, w, 1);
  }
  c.fillStyle = "#5a3a20";
  c.fillRect(x, y, w, WALL);
  c.fillRect(x, y, WALL, h);
  c.fillRect(x + w - WALL, y, WALL, h);
  const half = (w - DOOR_GAP) / 2;
  c.fillRect(x, y + h - WALL, half, WALL);
  c.fillRect(x + w - half, y + h - WALL, half, WALL);
  c.fillStyle = "rgba(255,210,140,0.12)";
  c.fillRect(x, y + WALL - 2, w, 2);
  for (const wx of [34, 96, w - 126, w - 64]) {
    c.fillStyle = "#ffcf7a";
    c.fillRect(x + wx, y + h - WALL + 4, 26, 6);
  }
  c.fillStyle = "#8a6238";
  c.fillRect(x + half, y + h - WALL, DOOR_GAP, WALL);
  // shelves of mugs and bottles behind the counter, and a rushnyk-hung
  // icon in the corner that has seen everything and forgives most of it
  c.fillStyle = "#5a3a20";
  c.fillRect(x + 152, y + WALL + 8, 146, 3);
  const ware = ["#c98d45", "#5d6b72", "#a85f38", "#3f6a3a", "#c98d45", "#e8e2cc", "#7a9ab0", "#a85f38", "#5d6b72", "#c98d45"];
  ware.forEach((col, i) => {
    c.fillStyle = col;
    if (i % 3 === 1) { rr(c, x + 158 + i * 14, y + WALL - 2, 6, 10, 2); c.fill(); }
    else { rr(c, x + 156 + i * 14, y + WALL + 1, 9, 7, 2); c.fill(); }
  });
  drawIcon(c, x + w - WALL - 30, y + WALL + 2, t);

  // --- the barrels behind the counter, lying in a cradle, taps out
  {
    const b = R(room.barrels);
    c.fillStyle = "#4e3018";
    c.fillRect(b.x, b.y + b.h - 4, b.w, 4);
    for (let i = 0; i < 5; i++) {
      const bx = b.x + 4 + i * 29;
      c.fillStyle = "#7a4a24";
      rr(c, bx, b.y + 1, 25, b.h - 3, 6); c.fill();
      c.fillStyle = "#3a3230";
      c.fillRect(bx + 4, b.y + 1, 2, b.h - 3); c.fillRect(bx + 19, b.y + 1, 2, b.h - 3);
      c.fillStyle = "#c9a040";
      c.fillRect(bx + 11, b.y + b.h - 4, 3, 5);
    }
  }
  // --- the shynkvas, with Okhrim's three winters chalked on its front
  {
    const ct = R(room.counter);
    shadow(ct);
    c.fillStyle = "#6a4020";
    rr(c, ct.x, ct.y, ct.w, ct.h, 2); c.fill();
    c.fillStyle = "#8a5a32";
    c.fillRect(ct.x, ct.y, ct.w, 5);
    c.strokeStyle = "rgba(245,240,230,0.85)"; c.lineWidth = 1;
    for (let g = 0; g < 9; g++) {
      const gx = ct.x + 8 + g * 13;
      for (let k = 0; k < 4; k++) {
        c.beginPath(); c.moveTo(gx + k * 2.4, ct.y + 7); c.lineTo(gx + k * 2.4, ct.y + 14); c.stroke();
      }
      c.beginPath(); c.moveTo(gx - 1, ct.y + 13); c.lineTo(gx + 9, ct.y + 8); c.stroke();
    }
    // a jug and two cups on the counter top
    c.fillStyle = "#a85f38";
    c.beginPath(); c.ellipse(ct.x + 150, ct.y + 3, 5, 4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#c98d45";
    c.beginPath(); c.arc(ct.x + 164, ct.y + 3, 3, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(ct.x + 172, ct.y + 3, 3, 0, Math.PI * 2); c.fill();
  }

  // --- the long tables with their benches
  const table = (tb: Box, west: boolean) => {
    shadow(tb);
    c.fillStyle = "#6a4020";
    rr(c, tb.x, tb.y, tb.w, tb.h, 3); c.fill();
    c.fillStyle = "rgba(255,220,160,0.14)";
    c.fillRect(tb.x + 2, tb.y + 2, tb.w - 4, 3);
    c.strokeStyle = "rgba(40,24,10,0.5)"; c.lineWidth = 1;
    c.beginPath(); c.moveTo(tb.x + 2, tb.y + tb.h / 2); c.lineTo(tb.x + tb.w - 2, tb.y + tb.h / 2); c.stroke();
    // mugs, a jug, a dish of pickles, a heel of bread, spilled drink
    const mugs = west ? [[12, 8], [30, 18], [66, 9], [84, 17]] : [[14, 17], [40, 8], [76, 16]];
    for (const [mx, my] of mugs) {
      c.fillStyle = "#c98d45";
      c.beginPath(); c.arc(tb.x + (mx ?? 0), tb.y + (my ?? 0), 3.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#5a3418";
      c.beginPath(); c.arc(tb.x + (mx ?? 0), tb.y + (my ?? 0), 2, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = "#e8e2cc";
    c.beginPath(); c.ellipse(tb.x + 50, tb.y + 14, 8, 5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#5d8a3a";
    for (const [px, py] of [[47, 13], [52, 15], [50, 12]] as const) {
      c.beginPath(); c.ellipse(tb.x + px, tb.y + py, 2.4, 1.4, 0.5, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = "#a85f38";
    c.beginPath(); c.ellipse(tb.x + (west ? 46 : 60), tb.y + (west ? 4 : 22), 4.4, 3.4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "rgba(200,170,110,0.35)";
    c.beginPath(); c.ellipse(tb.x + (west ? 74 : 26), tb.y + 20, 6, 2.4, 0, 0, Math.PI * 2); c.fill();
  };
  for (const r of [room.benchWn, room.benchWs, room.benchEn, room.benchEs]) {
    const b = R(r);
    shadow(b);
    c.fillStyle = "#7a4a24";
    rr(c, b.x, b.y, b.w, b.h, 2); c.fill();
  }
  table(R(room.tableW), true);
  table(R(room.tableE), false);

  // --- the pich, with a cauldron of something meaty in its mouth
  {
    const p = R(room.pich);
    const { mx, my } = drawPich(c, p, t);
    c.fillStyle = "#2e2a26";
    c.beginPath(); c.ellipse(mx + 15, my + 17, 8, 7, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#c8a060";
    c.beginPath(); c.ellipse(mx + 15, my + 15, 6, 3, 0, 0, Math.PI * 2); c.fill();
    drawUkhvat(c, p);
  }
  // the dog, asleep by the pich
  {
    const dx = x + 104;
    const dy = y + 186;
    const br = Math.sin(t * 0.0018) * 0.6;
    c.fillStyle = "rgba(30,18,6,0.3)";
    c.beginPath(); c.ellipse(dx, dy + 4, 16, 4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#a07a4a";
    c.beginPath(); c.ellipse(dx, dy, 14 + br, 7, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(dx + 12, dy - 2, 6, 5, 0.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#6e4e2a";
    c.beginPath(); c.ellipse(dx + 12, dy - 6, 3, 2, 0.6, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#a07a4a"; c.lineWidth = 3;
    c.beginPath(); c.moveTo(dx - 13, dy + 1); c.quadraticCurveTo(dx - 20, dy + 4, dx - 18, dy - 4); c.stroke();
  }
  // the cellar hatch (liada) in the floor
  {
    const hx = x + 252;
    const hy = y + 176;
    c.fillStyle = "#5a3a20";
    c.fillRect(hx, hy, 30, 16);
    c.strokeStyle = "#3a2410"; c.lineWidth = 1;
    c.strokeRect(hx, hy, 30, 16);
    c.beginPath(); c.moveTo(hx + 10, hy); c.lineTo(hx + 10, hy + 16); c.moveTo(hx + 20, hy); c.lineTo(hx + 20, hy + 16); c.stroke();
    c.fillStyle = "#3a3230";
    c.beginPath(); c.arc(hx + 15, hy + 8, 2.2, 0, Math.PI * 2); c.fill();
  }
  // the lantern over the hall: the light everyone drinks under
  for (const lx of [x + 80, x + 260]) {
    const ly = y + 100;
    const lg = c.createRadialGradient(lx, ly, 6, lx, ly, 120);
    lg.addColorStop(0, "rgba(255,180,90,0.26)");
    lg.addColorStop(1, "rgba(255,180,90,0)");
    c.fillStyle = lg;
    c.fillRect(lx - 120, ly - 120, 240, 240);
  }
}

// --- The pustka ---------------------------------------------------------------
// Taras Dovhyi's empty khata: grey walls, the clay floor gone to dust and
// leaf-litter, a cold pich with a crack down its face, a sagging pil, a
// bench on its side, cobwebs in every corner, a shaft of light through the
// hole in the thatch, and the icon turned to the wall by somebody who did
// not want it to watch. His skrynia still holds his letter.
function drawPustkaInterior(c: CanvasRenderingContext2D, x: number, y: number, t: number, flags: ReadonlySet<string>): void {
  const { w, h } = HOUSE_RECTS.pustka;
  const R = (r: Box): Box => ({ x: x + r.x, y: y + r.y, w: r.w, h: r.h });
  const shadow = (r: Box) => {
    c.fillStyle = "rgba(30,24,16,0.28)";
    rr(c, r.x + 3, r.y + 4, r.w, r.h, 3); c.fill();
  };
  const room = PUSTKA_ROOM;
  // a dusty floor, leaves blown in under the door
  c.fillStyle = "#9c8a6c";
  c.fillRect(x, y, w, h);
  for (let i = 0; i < 40; i++) {
    c.fillStyle = i % 3 ? "rgba(120,104,80,0.25)" : "rgba(170,150,110,0.25)";
    c.beginPath(); c.ellipse(x + hash2(i, 41) * w, y + hash2(i, 43) * h, 5 + hash2(i, 45) * 9, 3 + hash2(i, 47) * 3, 0, 0, Math.PI * 2); c.fill();
  }
  for (let i = 0; i < 14; i++) {
    c.fillStyle = i % 2 ? "#a8743c" : "#8a6a30";
    const lx = x + w / 2 - 30 + hash2(i, 51) * 60;
    const ly = y + h - WALL - 4 - hash2(i, 53) * 50;
    c.beginPath(); c.ellipse(lx, ly, 3, 1.6, hash2(i, 55) * 3, 0, Math.PI * 2); c.fill();
  }
  // the shaft of light through the roof, with dust turning in it
  {
    const lx = x + w * 0.62;
    const g = c.createLinearGradient(lx, y + 40, lx, y + h);
    g.addColorStop(0, "rgba(255,244,210,0.0)");
    g.addColorStop(1, "rgba(255,244,210,0.22)");
    c.fillStyle = g;
    c.beginPath(); c.moveTo(lx - 14, y + 40); c.lineTo(lx + 14, y + 40); c.lineTo(lx + 30, y + 150); c.lineTo(lx - 2, y + 150); c.closePath(); c.fill();
    c.fillStyle = "rgba(255,244,210,0.55)";
    for (let i = 0; i < 6; i++) {
      const ph = (t * 0.00008 + i / 6) % 1;
      c.beginPath(); c.arc(lx + Math.sin(ph * 6 + i) * 8 + ph * 12, y + 50 + ph * 90, 0.9, 0, Math.PI * 2); c.fill();
    }
  }
  // walls: the inner face gone grey, the whitewash flaking
  c.fillStyle = "#cfc6b2";
  c.fillRect(x, y + WALL, w, BACK_WALL - WALL);
  c.fillStyle = "#a88a62";
  for (let i = 0; i < 7; i++) {
    c.beginPath(); c.ellipse(x + 16 + hash2(i, 61) * (w - 32), y + WALL + 4 + hash2(i, 63) * 14, 4 + hash2(i, 65) * 6, 2.4, 0, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = "#3f63a8";
  c.globalAlpha = 0.35;
  c.fillRect(x, y + BACK_WALL - 4, w, 4);
  c.globalAlpha = 1;
  c.fillStyle = "#bdb39c";
  c.fillRect(x, y, w, WALL);
  c.fillRect(x, y, WALL, h);
  c.fillRect(x + w - WALL, y, WALL, h);
  const half = (w - DOOR_GAP) / 2;
  c.fillRect(x, y + h - WALL, half, WALL);
  c.fillRect(x + w - half, y + h - WALL, half, WALL);
  c.fillStyle = "#3a342c";
  for (const wx of [34, w - 70]) c.fillRect(x + wx, y + h - WALL + 4, 36, 6);
  c.fillStyle = "#7e6a52";
  c.fillRect(x + half, y + h - WALL, DOOR_GAP, WALL);
  // the icon turned to the wall: its bare back board, a rushnyk gone grey
  {
    const ix = x + w - WALL - 30;
    const iy = y + WALL + 2;
    c.fillStyle = "#6e5a40";
    rr(c, ix, iy, 18, 15, 1.5); c.fill();
    c.strokeStyle = "#4e3e2a"; c.lineWidth = 1;
    c.beginPath(); c.moveTo(ix + 2, iy + 5); c.lineTo(ix + 16, iy + 5); c.moveTo(ix + 2, iy + 10); c.lineTo(ix + 16, iy + 10); c.stroke();
    c.fillStyle = "#b8b0a0";
    c.fillRect(ix - 5, iy - 1, 4, 16);
  }
  // cobwebs in the corners
  c.strokeStyle = "rgba(235,235,230,0.55)"; c.lineWidth = 0.8;
  for (const [cx, cy, sx, sy] of [[x + WALL, y + BACK_WALL, 1, 1], [x + w - WALL, y + BACK_WALL, -1, 1], [x + WALL, y + h - WALL, 1, -1]] as const) {
    for (let k = 0; k < 4; k++) {
      const a = (k / 3) * (Math.PI / 2);
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * 22 * sx, cy + Math.sin(a) * 22 * sy); c.stroke();
    }
    for (const r of [8, 15]) {
      c.beginPath();
      for (let k = 0; k < 4; k++) {
        const a = (k / 3) * (Math.PI / 2);
        const px = cx + Math.cos(a) * r * sx;
        const py = cy + Math.sin(a) * r * sy;
        if (k === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.stroke();
    }
  }
  // the cold pich, cracked, no fire in its mouth
  {
    const p = R(room.pich);
    shadow(p);
    c.fillStyle = "#c8c0ae";
    rr(c, p.x, p.y, p.w, p.h, 6); c.fill();
    c.fillStyle = "#d8d0be";
    rr(c, p.x + 2, p.y + 2, p.w - 4, p.h - 20, 5); c.fill();
    c.fillStyle = "#2a2420";
    c.beginPath();
    c.moveTo(p.x + p.w - 4, p.y + 22); c.lineTo(p.x + p.w - 16, p.y + 22);
    c.quadraticCurveTo(p.x + p.w - 22, p.y + 34, p.x + p.w - 16, p.y + 46); c.lineTo(p.x + p.w - 4, p.y + 46); c.closePath(); c.fill();
    c.strokeStyle = "#7a6e5c"; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(p.x + 20, p.y + 4); c.lineTo(p.x + 26, p.y + 18); c.lineTo(p.x + 22, p.y + 30); c.lineTo(p.x + 30, p.y + 50); c.stroke();
    c.fillStyle = "#8a8070";
    for (const [bx, by] of [[p.x + p.w + 4, p.y + p.h - 2], [p.x + p.w + 10, p.y + p.h + 3]] as const) {
      c.beginPath(); c.ellipse(bx, by, 3.4, 2.2, 0, 0, Math.PI * 2); c.fill();
    }
  }
  // his skrynia, its paint gone, the lid a little open
  {
    const s = R(room.skrynia);
    shadow(s);
    c.fillStyle = "#5e4a3a";
    rr(c, s.x, s.y, s.w, s.h, 2); c.fill();
    c.fillStyle = "#6e5a46";
    c.fillRect(s.x + 1, s.y + 1, s.w - 2, 5);
    c.fillStyle = "#3a3230";
    c.fillRect(s.x + 6, s.y, 2.4, s.h); c.fillRect(s.x + s.w - 8, s.y, 2.4, s.h);
    if (!flagHas(flags, "dovhyiLetter")) {
      const tw = 0.4 + Math.sin(t * 0.004) * 0.3;
      c.fillStyle = `rgba(250,240,200,${tw})`;
      c.fillRect(s.x + s.w / 2 - 5, s.y + 7, 10, 3);
    }
  }
  // the pil, one leg gone, the planks slid to the floor
  {
    const p = R(room.pil);
    shadow(p);
    c.fillStyle = "#6a523a";
    c.save(); c.translate(p.x + p.w / 2, p.y + p.h / 2); c.rotate(0.06);
    rr(c, -p.w / 2, -p.h / 2, p.w, p.h, 2); c.fill();
    c.strokeStyle = "#4e3a28"; c.lineWidth = 1;
    for (let k = -p.w / 2 + 8; k < p.w / 2; k += 8) { c.beginPath(); c.moveTo(k, -p.h / 2); c.lineTo(k, p.h / 2); c.stroke(); }
    c.restore();
    c.fillStyle = "#8a7a62";
    rr(c, p.x + 4, p.y + 6, 18, 14, 3); c.fill(); // a pillow, mouse-eaten
  }
  // the bench on its side, and the table askew
  {
    const b = R(room.lava);
    shadow(b);
    c.fillStyle = "#6a523a";
    rr(c, b.x, b.y, b.w, b.h, 2); c.fill();
    c.fillStyle = "#4e3a28";
    c.fillRect(b.x + 4, b.y - 6, 4, 8); c.fillRect(b.x + b.w - 8, b.y - 6, 4, 8);
    const tb = R(room.table);
    shadow(tb);
    c.save(); c.translate(tb.x + tb.w / 2, tb.y + tb.h / 2); c.rotate(-0.1);
    c.fillStyle = "#6a523a";
    rr(c, -tb.w / 2, -tb.h / 2, tb.w, tb.h, 2); c.fill();
    c.fillStyle = "#8a8070";
    c.beginPath(); c.ellipse(-8, -2, 6, 4, 0, 0, Math.PI * 2); c.fill(); // a dry bowl
    c.restore();
  }
}

// --- The windmill -------------------------------------------------------------------
// A room of boards, flour everywhere: the millstones in their wooden case
// under the hopper, the great cog-wheel on the back wall, the grain bin,
// sacks of flour (Solokha's seat by day), a ladder to the loft, and flour
// dust turning in the light from the little window.
function drawMlynInterior(c: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  const { w, h } = HOUSE_RECTS.mlyn;
  const R = (r: Box): Box => ({ x: x + r.x, y: y + r.y, w: r.w, h: r.h });
  const shadow = (r: Box) => { c.fillStyle = "rgba(30,20,10,0.28)"; rr(c, r.x + 3, r.y + 4, r.w, r.h, 3); c.fill(); };
  const room = MLYN_ROOM;
  // a plank floor, floured
  c.fillStyle = "#9a7a54";
  c.fillRect(x, y, w, h);
  c.strokeStyle = "rgba(60,40,20,0.4)"; c.lineWidth = 1;
  for (let px = x + 12; px < x + w; px += 12) { c.beginPath(); c.moveTo(px, y + BACK_WALL); c.lineTo(px, y + h); c.stroke(); }
  c.fillStyle = "rgba(244,238,224,0.35)";
  for (let i = 0; i < 18; i++) {
    c.beginPath(); c.ellipse(x + 20 + hash2(i, 931) * (w - 40), y + 40 + hash2(i, 933) * (h - 60), 5 + hash2(i, 935) * 8, 3, 0, 0, Math.PI * 2); c.fill();
  }
  // board walls; the back wall's face with the great cog-wheel
  c.fillStyle = "#7a5a38";
  c.fillRect(x, y + WALL, w, BACK_WALL - WALL);
  c.strokeStyle = "rgba(40,26,12,0.45)";
  for (let px = x + 8; px < x + w; px += 8) { c.beginPath(); c.moveTo(px, y + WALL); c.lineTo(px, y + BACK_WALL); c.stroke(); }
  c.fillStyle = "#5a3a20";
  c.fillRect(x, y, w, WALL); c.fillRect(x, y, WALL, h); c.fillRect(x + w - WALL, y, WALL, h);
  const half = (w - DOOR_GAP) / 2;
  c.fillRect(x, y + h - WALL, half, WALL); c.fillRect(x + w - half, y + h - WALL, half, WALL);
  c.fillStyle = "#8a6a44"; c.fillRect(x + half, y + h - WALL, DOOR_GAP, WALL);
  {
    const gx = x + w / 2 - 6;
    const gy = y + WALL + 8;
    const spin = t * 0.0004;
    c.strokeStyle = "#4e3420"; c.lineWidth = 3;
    c.beginPath(); c.arc(gx, gy, 14, Math.PI, 0); c.stroke();
    c.lineWidth = 1.6;
    for (let k = 0; k < 7; k++) {
      const a = Math.PI + (k / 6) * Math.PI + (spin % (Math.PI / 6));
      if (a > Math.PI * 2) continue;
      c.beginPath(); c.moveTo(gx + Math.cos(a) * 14, gy + Math.sin(a) * 14); c.lineTo(gx + Math.cos(a) * 18, gy + Math.sin(a) * 18); c.stroke();
    }
  }
  // the little window, and its shaft of light with flour turning in it
  c.fillStyle = "#cfe0e8"; c.fillRect(x + 18, y + WALL + 3, 14, 10);
  {
    const g = c.createLinearGradient(x + 25, y + BACK_WALL, x + 40, y + h);
    g.addColorStop(0, "rgba(255,244,210,0.3)"); g.addColorStop(1, "rgba(255,244,210,0)");
    c.fillStyle = g;
    c.beginPath(); c.moveTo(x + 18, y + BACK_WALL); c.lineTo(x + 32, y + BACK_WALL); c.lineTo(x + 70, y + h - 20); c.lineTo(x + 46, y + h - 20); c.closePath(); c.fill();
    c.fillStyle = "rgba(255,250,235,0.7)";
    for (let i = 0; i < 7; i++) {
      const ph = (t * 0.00006 + i / 7) % 1;
      c.beginPath(); c.arc(x + 26 + ph * 30 + Math.sin(ph * 8 + i) * 4, y + BACK_WALL + ph * 60, 0.9, 0, Math.PI * 2); c.fill();
    }
  }
  // the ladder up to the loft
  c.strokeStyle = "#6e4a2a"; c.lineWidth = 2;
  c.beginPath(); c.moveTo(x + w - WALL - 14, y + WALL); c.lineTo(x + w - WALL - 14, y + BACK_WALL + 30); c.moveTo(x + w - WALL - 4, y + WALL); c.lineTo(x + w - WALL - 4, y + BACK_WALL + 30); c.stroke();
  for (let ry = y + WALL + 5; ry < y + BACK_WALL + 30; ry += 6) { c.beginPath(); c.moveTo(x + w - WALL - 14, ry); c.lineTo(x + w - WALL - 4, ry); c.stroke(); }
  // the millstones in their case, the hopper above, flour spilling out
  {
    const m = R(room.millstones);
    shadow(m);
    c.fillStyle = "#7a5a38";
    rr(c, m.x, m.y, m.w, m.h, 4); c.fill();
    c.strokeStyle = "rgba(30,20,10,0.8)"; c.lineWidth = 0.9; c.stroke();
    const cx = m.x + m.w / 2;
    const cy = m.y + m.h / 2 + 2;
    const gg = c.createRadialGradient(cx - 6, cy - 4, 2, cx, cy, 20);
    gg.addColorStop(0, "#c8c4bc"); gg.addColorStop(1, "#7a766e");
    c.fillStyle = gg;
    c.beginPath(); c.ellipse(cx, cy, 20, 11, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = "#3a3632";
    c.beginPath(); c.ellipse(cx, cy, 3.4, 2, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#8a6440";
    c.beginPath(); c.moveTo(cx - 12, cy - 22); c.lineTo(cx + 12, cy - 22); c.lineTo(cx + 4, cy - 8); c.lineTo(cx - 4, cy - 8); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = "#f4eee0";
    c.beginPath(); c.ellipse(m.x + m.w + 2, m.y + m.h, 8, 3.4, 0, 0, Math.PI * 2); c.fill();
  }
  // the grain bin, heaped with grain
  {
    const b = R(room.bin);
    shadow(b);
    c.fillStyle = "#6e4a2a"; rr(c, b.x, b.y, b.w, b.h, 2); c.fill();
    c.strokeStyle = "rgba(30,20,10,0.8)"; c.lineWidth = 0.9; c.stroke();
    c.fillStyle = "#d8b860";
    c.beginPath(); c.ellipse(b.x + b.w / 2, b.y + 8, b.w / 2 - 3, 5, 0, 0, Math.PI * 2); c.fill();
  }
  // sacks of flour, slumped against each other
  {
    const s0 = R(room.sacks);
    for (const [ox, oy, sw, sh] of [[0, 4, 14, 22], [13, 2, 15, 24], [5, 18, 16, 14]] as const) {
      const sx = s0.x + ox;
      const sy = s0.y + oy;
      c.fillStyle = "rgba(30,20,10,0.25)"; rr(c, sx + 2, sy + 3, sw, sh, 5); c.fill();
      const g = c.createLinearGradient(sx, 0, sx + sw, 0);
      g.addColorStop(0, "#efe6d2"); g.addColorStop(1, "#b8ac94");
      c.fillStyle = g; rr(c, sx, sy, sw, sh, 5); c.fill();
      c.strokeStyle = "rgba(30,20,10,0.7)"; c.lineWidth = 0.8; c.stroke();
      c.strokeStyle = "#8a6440"; c.beginPath(); c.moveTo(sx + 3, sy + 4); c.lineTo(sx + sw - 3, sy + 4); c.stroke();
    }
    // one more, lying by the wall: Solokha's seat by day
    c.fillStyle = "#e4dac2"; rr(c, x + 104, y + 94, 24, 12, 5); c.fill();
    c.strokeStyle = "rgba(30,20,10,0.7)"; c.lineWidth = 0.8; c.stroke();
  }
}
