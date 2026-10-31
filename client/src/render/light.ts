import { CAVE_LIGHTS, TUNNEL_LIGHTS } from "../data/cave";
import { HOUSE_RECTS, type HouseId } from "../data/houses";
import { RIVER_HALF, riverY } from "../data/land";
import { LYSA_WORLD } from "../data/lysa";
import { FIRE, KAPLYTSIA, POND } from "../data/village";
import { BOLOTO } from "../data/land";
import { DAWN, DUSK, NIGHT_FROM } from "../systems/time";
import { WORLD_W } from "../world/areas";

// --- Light and the time of day -------------------------------------------------
// Three passes over the finished world, all in screen space:
//   gradeDay  — the colour of the hour: pink-gold at dawn, a warm golden
//               hour before dusk, violet as the sun goes;
//   drawFog   — mist lying on the river and the pond in the first hours;
//   drawDark  — night as a dark layer with holes cut where there is light
//               (the fire, every lit window, the korchma's open door, the
//               chapel lamp, the room the kobzar stands in), then the warm
//               colour of those lights added back on top.
// The pustka has no light. Nobody lives there.

const ramp = (from: number, to: number, m: number) => Math.min(1, Math.max(0, (m - from) / (to - from)));
// up for the first half, down for the second
const bump = (from: number, to: number, m: number) => {
  const k = ramp(from, to, m);
  return k <= 0 || k >= 1 ? 0 : Math.sin(k * Math.PI);
};

export function gradeDay(c: CanvasRenderingContext2D, minute: number, vw: number, vh: number): void {
  const dawn = bump(DAWN - 70, DAWN + 120, minute);
  const golden = bump(DUSK - 180, DUSK + 20, minute);
  const violet = bump(DUSK - 20, NIGHT_FROM + 40, minute);
  if (dawn + golden + violet <= 0.01) return;
  c.save();
  c.globalCompositeOperation = "soft-light";
  if (dawn > 0) { c.fillStyle = `rgba(255,150,140,${dawn * 0.55})`; c.fillRect(0, 0, vw, vh); }
  if (golden > 0) { c.fillStyle = `rgba(255,160,60,${golden * 0.42})`; c.fillRect(0, 0, vw, vh); }
  if (violet > 0) { c.fillStyle = `rgba(150,90,200,${violet * 0.5})`; c.fillRect(0, 0, vw, vh); }
  c.restore();
  // a low sun warms everything from the side it sets on
  if (golden > 0.05) {
    c.save();
    c.globalCompositeOperation = "lighter";
    const g = c.createLinearGradient(vw, 0, 0, vh);
    g.addColorStop(0, `rgba(255,170,80,${golden * 0.07})`);
    g.addColorStop(1, "rgba(255,170,80,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, vw, vh);
    c.restore();
  }
}

export function drawFog(c: CanvasRenderingContext2D, minute: number, camX: number, camY: number, vw: number, vh: number, t: number): void {
  const k = Math.max(bump(DAWN - 90, DAWN + 150, minute), 0.6 * ramp(NIGHT_FROM, NIGHT_FROM + 120, minute));
  if (k <= 0.02) return;
  c.save();
  // banks of mist lying along the river, drifting slowly downstream
  for (let x = Math.floor(camX / 90) * 90 - 90; x < camX + vw + 90; x += 90) {
    if (x < 0 || x > WORLD_W) continue;
    const drift = (t * 0.006) % 90;
    const fx = x + drift - camX;
    const fy = riverY(x) - camY;
    if (fy < -120 || fy > vh + 120) continue;
    const g = c.createRadialGradient(fx, fy, 6, fx, fy, RIVER_HALF + 60);
    g.addColorStop(0, `rgba(236,240,246,${k * 0.42})`);
    g.addColorStop(1, "rgba(236,240,246,0)");
    c.fillStyle = g;
    c.fillRect(fx - 130, fy - 110, 260, 220);
  }
  // and over the pond
  const px = POND.x - camX;
  const py = POND.y - camY;
  const pg = c.createRadialGradient(px, py, 20, px, py, POND.rx + 60);
  pg.addColorStop(0, `rgba(236,240,246,${k * 0.38})`);
  pg.addColorStop(1, "rgba(236,240,246,0)");
  c.fillStyle = pg;
  c.fillRect(px - POND.rx - 70, py - POND.ry - 80, (POND.rx + 70) * 2, (POND.ry + 80) * 2);
  c.restore();
}

export type Light = { x: number; y: number; r: number; col: string; k: number };

// Where the lit windows are on each walk-in house's front wall (they
// match the drawings in render/khutir.ts), in world coordinates.
function windowLights(id: HouseId): Light[] {
  const r = HOUSE_RECTS[id];
  const base = r.y + r.h;
  const at = (xs: number[], wy: number, w: number): Light[] =>
    xs.flatMap((wx) => [
      { x: r.x + wx + w / 2, y: wy, r: 22, col: "255,200,110", k: 0.95 },
      { x: r.x + wx + w / 2, y: base + 18, r: 46, col: "255,180,90", k: 0.55 },
    ]);
  switch (id) {
    case "hut0": case "hut1": return at([34, r.w - 70], base - 64 + 26, 36);
    // Prokip's pich is always lit, and he doesn't sleep
    case "prokip": return at([34, r.w - 70], base - 64 + 26, 36);
    case "otaman": return at([30, 92, 250, 316], base - 70 + 35, 32);
    case "korchma": return [
      ...at([34, 96, r.w - 126, r.w - 64], base - 72 + 28, 26),
      { x: r.x + r.w / 2, y: base + 10, r: 90, col: "255,170,80", k: 0.85 },
    ];
    case "pustka": return [];
    case "mlyn": return []; // nobody grinds by night (that anyone admits to)
    case "duplo": case "kurhan": case "pechera": return [];
    // the monk's candle at the cave's mouth; the tunnel's ridge shows nothing
    case "zmiieva": return [{ x: r.x + r.w / 2, y: base - 20, r: 56, col: "255,190,100", k: 0.55 }];
    case "lazna": return [];
    // the lampadka before the icons, through the two narrow windows
    case "kaplytsia": return at([16, r.w - 30], base - 60 + 24, 14);
  }
}

// Night: a dark layer with holes where light falls, then the lights'
// colour added on top. `inside` is the house the kobzar is in (its room
// is lamp-lit); `roofs` says which roofs are up (windows only glow from
// outside).
let darkLayer: HTMLCanvasElement | null = null;
export function drawDark(
  c: CanvasRenderingContext2D, dark: number, camX: number, camY: number, vw: number, vh: number, dpr: number, t: number,
  inside: HouseId | null,
  extra: readonly Light[] = [],
  player?: { x: number; y: number },
): void {
  // the cave and the tunnel are dark at noon too: only candles, the pool's glow and
  // the kobzar's own kahanets (a little oil lamp) light them
  const underground = inside === "zmiieva" || inside === "lazna";
  if (underground) dark = Math.max(dark, 0.9);
  if (dark <= 0.001) return;
  const fl = 1 + Math.sin(t * 0.011) * 0.05 + Math.sin(t * 0.027) * 0.03;
  const lights: Light[] = [
    { x: FIRE.x + FIRE.w / 2, y: FIRE.y + FIRE.h / 2, r: 200 * fl, col: "255,150,60", k: 1 },
    { x: KAPLYTSIA.x + KAPLYTSIA.w / 2, y: KAPLYTSIA.y + KAPLYTSIA.h + 6, r: 40, col: "255,200,120", k: 0.6 },
    // the sabbath bonfire on Lysa Hora, and the moon's pale wash on its crown
    { x: LYSA_WORLD.summit.x, y: LYSA_WORLD.summit.y, r: 260 * fl, col: "255,140,90", k: 1 },
    { x: LYSA_WORLD.summit.x + 120, y: LYSA_WORLD.summit.y - 160, r: 420, col: "170,180,255", k: 0.45 },
    { x: LYSA_WORLD.offer.x, y: LYSA_WORLD.offer.y, r: 50, col: "200,210,255", k: 0.5 },
    ...extra,
    // will-o'-the-wisps (блудні вогники) drifting over the bog
    ...[0, 1, 2].map((i) => ({
      x: BOLOTO.x - 120 + i * 110 + Math.sin(t * 0.0004 + i * 2.1) * 40,
      y: BOLOTO.y - 30 + Math.cos(t * 0.00031 + i * 1.3) * 30 - i * 10,
      r: 16 + Math.sin(t * 0.003 + i) * 4, col: "160,235,190", k: 0.9,
    })),
  ];
  for (const id of Object.keys(HOUSE_RECTS) as HouseId[]) {
    if (id === inside) {
      if (underground) continue;
      const r = HOUSE_RECTS[id];
      lights.push({ x: r.x + r.w / 2, y: r.y + r.h / 2, r: r.w * 0.75, col: "255,170,80", k: 0.9 });
    } else if (!underground) lights.push(...windowLights(id));
  }
  if (underground) {
    for (const l of inside === "zmiieva" ? CAVE_LIGHTS : TUNNEL_LIGHTS) lights.push({ ...l, r: l.r * fl });
    if (player) lights.push({ x: player.x, y: player.y - 18, r: 150 * fl, col: "255,206,130", k: 0.95 });
  }
  const vis = lights.filter((l) => l.x + l.r > camX && l.x - l.r < camX + vw && l.y + l.r > camY && l.y - l.r < camY + vh);
  // the darkness, with holes
  const w = Math.ceil(vw * dpr);
  const h = Math.ceil(vh * dpr);
  if (!darkLayer) darkLayer = document.createElement("canvas");
  if (darkLayer.width !== w || darkLayer.height !== h) { darkLayer.width = w; darkLayer.height = h; }
  const d = darkLayer.getContext("2d");
  if (!d) return;
  d.setTransform(dpr, 0, 0, dpr, 0, 0);
  d.globalCompositeOperation = "source-over";
  d.clearRect(0, 0, vw, vh);
  d.fillStyle = `rgba(8,12,38,${dark})`;
  d.fillRect(0, 0, vw, vh);
  d.globalCompositeOperation = "destination-out";
  for (const l of vis) {
    const g = d.createRadialGradient(l.x - camX, l.y - camY, 0, l.x - camX, l.y - camY, l.r);
    g.addColorStop(0, `rgba(0,0,0,${0.85 * l.k})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    d.fillStyle = g;
    d.fillRect(l.x - camX - l.r, l.y - camY - l.r, l.r * 2, l.r * 2);
  }
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.drawImage(darkLayer, 0, 0);
  c.restore();
  // the warm colour of the light itself
  c.save();
  c.globalCompositeOperation = "lighter";
  for (const l of vis) {
    const g = c.createRadialGradient(l.x - camX, l.y - camY, 0, l.x - camX, l.y - camY, l.r);
    g.addColorStop(0, `rgba(${l.col},${dark * 0.5 * l.k})`);
    g.addColorStop(1, `rgba(${l.col},0)`);
    c.fillStyle = g;
    c.fillRect(l.x - camX - l.r, l.y - camY - l.r, l.r * 2, l.r * 2);
  }
  c.restore();
}

// The vignette that warms the edges of the screen (cool on Lysa Hora): a
// full-screen gradient is costly to fill every frame, so it is painted once
// per screen size and stamped.
let vignette: { cv: HTMLCanvasElement; key: string } | null = null;
export function drawVignette(c: CanvasRenderingContext2D, vw: number, vh: number, lysa: boolean): void {
  const key = `${vw}x${vh}${lysa ? "L" : ""}`;
  if (!vignette || vignette.key !== key) {
    const cv = document.createElement("canvas");
    // half resolution is plenty for a gradient this soft
    cv.width = Math.max(1, Math.ceil(vw / 2));
    cv.height = Math.max(1, Math.ceil(vh / 2));
    const g = cv.getContext("2d");
    if (g) {
      g.scale(0.5, 0.5);
      const vg = g.createRadialGradient(vw / 2, vh * 0.42, Math.min(vw, vh) * 0.36, vw / 2, vh * 0.5, Math.max(vw, vh) * 0.78);
      vg.addColorStop(0, "rgba(60,30,0,0)");
      vg.addColorStop(1, lysa ? "rgba(6,6,24,0.42)" : "rgba(43,26,4,0.28)");
      g.fillStyle = vg;
      g.fillRect(0, 0, vw, vh);
    }
    vignette = { cv, key };
  }
  c.drawImage(vignette.cv, 0, 0, vw, vh);
}
