// Bakes the current procedural khutir into image layers for the Godot
// demo (run by bake.cjs in a headless browser; nothing here ships with the
// game). It stands in for painted art: a background with the buildings in
// it, each building again on its own transparent layer (the BG2-style
// "wall" overlay that covers whoever walks behind it), tree sprites, a few
// people's animation frames, and the collision data.
import { drawBrewBench, drawFence, drawFire, drawGround, drawHouse, drawTreeShadows, drawWell, drawKabytsia } from "../../client/src/render/village";
import { drawKaplytsia, drawKhataBig, drawKovyla, drawMallow, drawMlyn, drawOtamanKhata, drawPustka, drawSunflower } from "../../client/src/render/khutir";
import { drawTreeSprite } from "../../client/src/render/trees";
import { drawFolk, type FolkOpts } from "../../client/src/render/people";
import { CAM } from "../../client/src/render/shapes";
import { HOUSE_IDS, HOUSE_RECTS, type HouseId } from "../../client/src/data/houses";
import { DECOR, FENCES, FIRE, HOUSES, SOLID, TREES, WELL, pondShore } from "../../client/src/data/village";
import { KABYTSIA } from "../../client/src/data/items";
import { hash2 } from "../../client/src/world/geometry";

const R = { x: 0, y: 0, w: 1680, h: 1320 };
const S = 2; // pixels per world px
const files: Record<string, string> = {};

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const cv = document.createElement("canvas");
  cv.width = Math.ceil(w * S); cv.height = Math.ceil(h * S);
  const c = cv.getContext("2d");
  if (!c) throw new Error("no 2d");
  c.scale(S, S);
  return [cv, c];
}
// the tight bounds of what was painted, in canvas pixels
function trim(cv: HTMLCanvasElement): { x: number; y: number; w: number; h: number } | null {
  const c = cv.getContext("2d");
  if (!c) return null;
  const d = c.getImageData(0, 0, cv.width, cv.height).data;
  let x0 = cv.width, y0 = cv.height, x1 = -1, y1 = -1;
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
    if ((d[(y * cv.width + x) * 4 + 3] ?? 0) > 4) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
function save(name: string, cv: HTMLCanvasElement, crop?: { x: number; y: number; w: number; h: number }): void {
  let out = cv;
  if (crop) {
    out = document.createElement("canvas");
    out.width = crop.w; out.height = crop.h;
    out.getContext("2d")?.drawImage(cv, -crop.x, -crop.y);
  }
  files[name] = out.toDataURL("image/png");
}

const inRegion = (x: number, y: number) => x >= R.x && x < R.x + R.w && y >= R.y && y < R.y + R.h;
const DEMO_HOUSES = HOUSE_IDS.filter((id) => { const r = HOUSE_RECTS[id]; return inRegion(r.x + r.w / 2, r.y + r.h / 2); });

function drawBuilding(c: CanvasRenderingContext2D, id: HouseId, camX: number, camY: number): void {
  const r = HOUSE_RECTS[id];
  const x = r.x - camX, y = r.y - camY;
  if (id === "otaman") drawOtamanKhata(c, x, y, r.w, r.h, 0, 1);
  else if (id === "pustka") drawPustka(c, x, y, r.w, r.h, 0, 1);
  else if (id === "mlyn") drawMlyn(c, x, y, r.w, r.h, 0, 1);
  else if (id === "kaplytsia") drawKaplytsia(c, x, y, r.w, r.h, 0, 1);
  else drawKhataBig(c, x, y, r.w, r.h, 0, r.x, 1, false);
}

async function bake(): Promise<unknown> {
  CAM.x = 0; CAM.y = 0;
  const trees = TREES.filter((t) => inRegion(t.x, t.y));
  // 1. the background: ground, shadows, everything flat, and the buildings
  //    painted in (as a painter would), in depth order
  {
    const [cv, c] = canvas(R.w, R.h);
    drawGround(c, R.x, R.y, R.w, R.h, 0);
    drawTreeShadows(c, trees, R.x, R.y, R.w, R.h, 13 * 60, 0);
    drawWell(c, R.x, R.y, 0);
    drawFire(c, R.x, R.y, 0);
    drawBrewBench(c, R.x, R.y, 0);
    const things: Array<{ y: number; draw: () => void }> = [];
    for (const id of DEMO_HOUSES) things.push({ y: HOUSE_RECTS[id].y + HOUSE_RECTS[id].h, draw: () => drawBuilding(c, id, R.x, R.y) });
    for (const h of HOUSES) things.push({ y: h.y + h.h, draw: () => drawHouse(c, h, R.x, R.y, 0) });
    for (const f of FENCES) things.push({ y: f.y + f.h, draw: () => drawFence(c, f, R.x, R.y) });
    things.push({ y: KABYTSIA.y, draw: () => drawKabytsia(c, KABYTSIA.x - R.x, KABYTSIA.y - R.y, 0, KABYTSIA.x) });
    for (const d of DECOR) if (inRegion(d.x, d.y)) things.push({ y: d.y, draw: () => (d.kind === "sunflower" ? drawSunflower : d.kind === "mallow" ? drawMallow : drawKovyla)(c, d.x - R.x, d.y - R.y, 0, d.seed) });
    things.sort((a, b) => a.y - b.y).forEach((t) => t.draw());
    // cut into tiles, as a big world would be streamed
    const T = 840;
    for (let ty = 0; ty < R.h; ty += T / 2) for (let tx = 0; tx < R.w; tx += T) {
      save(`bg_${tx}_${ty}.png`, cv, { x: tx * S, y: ty * S, w: Math.min(T, R.w - tx) * S, h: Math.min(T / 2, R.h - ty) * S });
    }
  }
  // 2. the overlays: each building alone, transparent around it, drawn
  //    over anyone standing behind its front edge
  const overlays: unknown[] = [];
  const overlay = (name: string, bx: number, by: number, bw: number, bh: number, baseY: number, draw: (c: CanvasRenderingContext2D) => void) => {
    const [cv, c] = canvas(bw, bh);
    draw(c);
    const tb = trim(cv);
    if (!tb) return;
    save(`ov_${name}.png`, cv, tb);
    overlays.push({ name, x: bx + tb.x / S, y: by + tb.y / S, baseY });
  };
  for (const id of DEMO_HOUSES) {
    const r = HOUSE_RECTS[id];
    const bx = r.x - 120, by = r.y - 220;
    overlay(id, bx, by, r.w + 240, r.h + 240, r.y + r.h, (c) => drawBuilding(c, id, bx, by));
  }
  HOUSES.forEach((h, i) => {
    const bx = h.x - 60, by = h.y - 140;
    overlay(`forge${i}`, bx, by, h.w + 120, h.h + 170, h.y + h.h, (c) => drawHouse(c, h, bx, by, 0));
  });
  {
    const bx = WELL.x - 80, by = WELL.y - 160;
    overlay("well", bx, by, WELL.w + 200, WELL.h + 190, WELL.y + WELL.h, (c) => drawWell(c, bx, by, 0));
  }
  // 3. tree sprites: one per kind and variant, scaled per tree in Godot
  const treeKeys = new Map<string, { x: number; y: number; kind: (typeof TREES)[number]["kind"] }>();
  const treeList = trees.map((t) => {
    const key = `${t.kind}${Math.floor(hash2(t.x, t.y) * 5)}`;
    if (!treeKeys.has(key)) treeKeys.set(key, t);
    return { x: t.x, y: t.y, s: t.s, key };
  });
  for (const [key, t] of treeKeys) {
    const [cv, c] = canvas(200, 190);
    drawTreeSprite(c, { ...t, s: 1 }, 100, 180, 0);
    save(`tree_${key}.png`, cv);
  }
  // 4. people: walking frames (8) and standing, facing right (Godot flips)
  const people: Record<string, Partial<FolkOpts>> = {
    kobzar: { style: "player", tunic: "#efe3c8", hair: "#5d3a1a" },
    myroslav: { style: "elder", tunic: "#9a2a24", hair: "#cfc8bb", who: "myroslav" },
    vesna: { style: "herbalist", tunic: "#4c6b35", hair: "#5d3a1a" },
  };
  for (const [name, o] of Object.entries(people)) {
    for (let i = 0; i <= 8; i++) {
      const [cv, c] = canvas(64, 84);
      const walking = i < 8;
      drawFolk(c, 32, 76, { tunic: "#fff", hair: "#000", style: "player", ...o, moving: walking, phase: walking ? (i / 8) * Math.PI * 2 : 0, face: 1, t: 0 } as FolkOpts);
      save(`${name}_${walking ? `walk${i}` : "idle"}.png`, cv);
    }
  }
  // the kobzar playing on his log, a few frames of the strum
  for (let i = 0; i < 6; i++) {
    const [cv, c] = canvas(80, 100);
    drawFolk(c, 40, 88, { ...(people.kobzar as FolkOpts), moving: false, phase: 0, face: 1, t: i * 160, pose: "play" });
    save(`kobzar_play${i}.png`, cv);
  }
  // 5. the data Godot needs to place and collide
  const solids = SOLID.filter((s) => s.x < R.x + R.w && s.x + s.w > R.x && s.y < R.y + R.h && s.y + s.h > R.y);
  return {
    region: R, scale: S,
    solids,
    pond: pondShore(6, 48),
    overlays, trees: treeList,
    fire: { x: FIRE.x + FIRE.w / 2, y: FIRE.y + FIRE.h / 2 },
    houses: DEMO_HOUSES.map((id) => ({ id, ...HOUSE_RECTS[id] })),
    start: { x: 840, y: 1240 },
    npcs: [{ name: "myroslav", x: 760, y: 520 }, { name: "vesna", x: 1236, y: 626 }],
  };
}

(window as unknown as { __bake: Promise<unknown> }).__bake = bake().then((data) => ({ data, files }));
