import { CART, GRAVE } from "../data/chumaky";
import { CAVE_HILL, DOMOVYK_HOME, doorOf, HOUSE_RECTS, mapPosition, PICH_SPOT } from "../data/houses";
import { BOLOTO, BOLOTO_POOLS, BRIDGES, FIELDS, GARDENS, HEMP_SPOT, RIVER_HALF, riverY, TOBACCO_SPOTS } from "../data/land";
import { LYSA_ORIGIN, LYSA_WORLD } from "../data/lysa";
import { BREW_SPOT, COOK_SPOT, FISH_SPOT, FORGE_SPOT, IRON_SPOTS } from "../data/items";
import { HOUSES, KURHAN, KURHAN_STEPPE, POND, pondShore, TREES, WELL, WINDMILL } from "../data/village";
import { t, type TextKey } from "../i18n";
import { chumakyPresent } from "../systems/chumaky";
import { flagCount, flagHas } from "../systems/flags";
import { tobaccoStage } from "../systems/tobacco";
import { LYSA_H, LYSA_W, VILLAGE_W, WORLD_H, WORLD_W } from "../world/areas";

// --- The map -----------------------------------------------------------------
// A hand-drawn map of the whole world on parchment: the khutir, its gardens
// and fields, the river and bridges, the forests, the steppe and Lysa Hora.
// It marks where the kobzar stands, and a gold star on where the current
// quest wants him. Drawn on demand into the map overlay's canvas.

export type MapView = { zoom: "world" | "near"; player: { x: number; y: number } };

// Did Prokip's thread (systems/vorozhbyt.ts): from the flags alone.
function prokipTarget(flags: ReadonlySet<string>): { x: number; y: number } | null {
  if (flagHas(flags, "zviryna")) return null;
  if (flagHas(flags, "perelesnykQuest") && !flagHas(flags, "perelesnykGone")) return doorOf("korchma");
  if (flagHas(flags, "prokipMessage") && !flagHas(flags, "vesnaAnswer") && !flagHas(flags, "vesnaTold")) return doorOf("hut1");
  if (flagHas(flags, "resheto") && !flagHas(flags, "reshetoTried")) return { x: WELL.x + WELL.w / 2, y: WELL.y + WELL.h / 2 };
  return doorOf("prokip");
}

// Where the active quest (systems/quests.ts) points, if anywhere on the map.
export function questTarget(activeId: string | null, flags: ReadonlySet<string>): { x: number; y: number } | null {
  switch (activeId) {
    case "meet": case "evening": case "oldway": return { x: 840, y: 560 };
    case "spirits": return DOMOVYK_HOME;
    case "dark": return { x: 545, y: 1052 };
    case "viy": case "vigil": return { x: 1420, y: 300 };
    case "chumaky": return chumakyPresent(flags) ? CART : null;
    case "domovyk": return PICH_SPOT;
    case "forge": return flagCount(flags, "iron") >= 3 ? FORGE_SPOT : IRON_SPOTS[0] ?? null;
    case "soul": case "fishing": return FISH_SPOT;
    case "cooking": return COOK_SPOT;
    case "smithing": return FORGE_SPOT;
    case "alchemy": return BREW_SPOT;
    case "lysa-visit": case "lysa-sabbath": return LYSA_WORLD.summit;
    case "prokip": return prokipTarget(flags);
    case "tobacco": {
      const st = tobaccoStage(flags);
      if (st === "gather") return flagHas(flags, "hempFibre") || flagCount(flags, "tobaccoLeaves") < 3 ? TOBACCO_SPOTS[1] ?? null : HEMP_SPOT;
      if (st === "hang" || st === "drying") return BREW_SPOT;
      if (st === "ready") return { x: 760, y: 520 };
      return null;
    }
  }
  return null;
}

const CROP_COL: Record<string, string> = {
  buckwheat: "#d9b8b4", barley: "#d8b964", oats: "#c8c88e", hemp: "#6f8f4c", tobacco: "#9cb86a",
};

export function drawWorldMap(c: CanvasRenderingContext2D, w: number, h: number, view: MapView, flags: ReadonlySet<string>, target: { x: number; y: number } | null, now: number): void {
  // world → canvas transform (underground, the kobzar is shown at the cave's mouth)
  const pl = mapPosition(view.player);
  const span = view.zoom === "world" ? { w: WORLD_W, h: WORLD_H } : { w: 1500, h: 1500 * (h / w) };
  const s = Math.min(w / span.w, h / span.h);
  const ox = view.zoom === "world" ? (w - WORLD_W * s) / 2 : w / 2 - pl.x * s;
  const oy = view.zoom === "world" ? (h - WORLD_H * s) / 2 : h / 2 - pl.y * s;
  const X = (x: number) => ox + x * s;
  const Y = (y: number) => oy + y * s;

  // parchment
  c.fillStyle = "#e9dcbc";
  c.fillRect(0, 0, w, h);
  c.save();
  c.beginPath(); c.rect(X(0), Y(0), WORLD_W * s, WORLD_H * s); c.clip();
  // land: grass west, steppe east
  const g = c.createLinearGradient(X(0), 0, X(WORLD_W), 0);
  g.addColorStop(0, "#b9cf8f");
  g.addColorStop(VILLAGE_W / WORLD_W, "#bfd092");
  g.addColorStop(0.62, "#dcd6a0");
  g.addColorStop(1, "#d2cba0");
  c.fillStyle = g;
  c.fillRect(X(0), Y(0), WORLD_W * s, WORLD_H * s);
  // forests: soft dark-green blobs under every tree
  c.fillStyle = "rgba(62,110,58,0.55)";
  for (const tr of TREES) {
    c.beginPath(); c.arc(X(tr.x), Y(tr.y - 20), Math.max(1.6, 34 * s), 0, Math.PI * 2); c.fill();
  }
  // fields and gardens
  for (const f of FIELDS) {
    c.fillStyle = CROP_COL[f.crop] ?? "#c8b080";
    c.fillRect(X(f.x), Y(f.y), f.w * s, f.h * s);
    c.strokeStyle = "rgba(90,60,30,0.35)"; c.lineWidth = 1;
    c.strokeRect(X(f.x), Y(f.y), f.w * s, f.h * s);
  }
  c.fillStyle = "#8a6a48";
  for (const gd of GARDENS) c.fillRect(X(gd.x), Y(gd.y), gd.w * s, gd.h * s);
  // roads
  c.strokeStyle = "#b38f58"; c.lineCap = "round";
  c.lineWidth = Math.max(2, 60 * s);
  c.beginPath(); c.moveTo(X(0), Y(646)); c.lineTo(X(VILLAGE_W), Y(646)); c.stroke();
  c.beginPath(); c.moveTo(X(840), Y(330)); c.lineTo(X(840), Y(WORLD_H)); c.stroke();
  c.beginPath(); c.moveTo(X(1500), Y(646)); c.lineTo(X(1500), Y(456)); c.lineTo(X(VILLAGE_W), Y(456)); c.stroke();
  c.lineWidth = Math.max(1.6, 40 * s);
  c.beginPath(); c.moveTo(X(VILLAGE_W - 80), Y(456));
  c.bezierCurveTo(X(2000), Y(330), X(2350), Y(760), X(LYSA_WORLD.trailhead.x), Y(LYSA_WORLD.trailhead.y)); c.stroke();
  c.beginPath(); c.moveTo(X(VILLAGE_W - 60), Y(646));
  c.bezierCurveTo(X(1950), Y(660), X(2250), Y(900), X(2250), Y(1300)); c.lineTo(X(2250), Y(WORLD_H)); c.stroke();
  // pond and river
  c.fillStyle = "#6f9fb3";
  c.beginPath(); pondShore(0, 36).forEach((q, i) => (i ? c.lineTo(X(q.x), Y(q.y)) : c.moveTo(X(q.x), Y(q.y)))); c.closePath(); c.fill();
  c.beginPath();
  for (let x = 0; x <= WORLD_W; x += 40) c.lineTo(X(x), Y(riverY(x) - RIVER_HALF));
  for (let x = WORLD_W; x >= 0; x -= 40) c.lineTo(X(x), Y(riverY(x) + RIVER_HALF));
  c.closePath(); c.fill();
  // the boloto in the south-west forest: dark pools in the mire
  c.fillStyle = "#5a5a34";
  c.beginPath(); c.ellipse(X(BOLOTO.x), Y(BOLOTO.y), BOLOTO.rx * 0.8 * s, BOLOTO.ry * 0.8 * s, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#2e4036";
  for (const bp of BOLOTO_POOLS) { c.beginPath(); c.ellipse(X(bp.x), Y(bp.y), bp.rx * s, bp.ry * s, 0, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = "#7a5a38";
  for (const b of BRIDGES) c.fillRect(X(b.x - b.w / 2), Y(riverY(b.x) - RIVER_HALF - 12), b.w * s, (RIVER_HALF * 2 + 24) * s);
  // Lysa Hora
  c.fillStyle = "#6d6a80";
  c.beginPath(); c.ellipse(X(LYSA_ORIGIN.x + LYSA_W / 2), Y(LYSA_ORIGIN.y + LYSA_H / 2), (LYSA_W / 2) * s, (LYSA_H / 2) * s, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#e7853a";
  c.beginPath(); c.arc(X(LYSA_WORLD.summit.x), Y(LYSA_WORLD.summit.y), Math.max(2, 26 * s), 0, Math.PI * 2); c.fill();
  // khaty, windmill, kurhany
  for (const ho of [...HOUSES, ...Object.entries(HOUSE_RECTS).filter(([id]) => !["duplo", "kurhan", "pechera", "zmiieva", "lazna"].includes(id)).map(([, r]) => ({ ...r, y: r.y + 30, h: r.h - 30 }))]) {
    c.fillStyle = "#f6f1e6"; c.fillRect(X(ho.x), Y(ho.y + 20), ho.w * s, (ho.h - 20) * s);
    c.fillStyle = "#a8854a"; c.fillRect(X(ho.x - 8), Y(ho.y - 10), (ho.w + 16) * s, 34 * s);
  }
  const glyph = (x: number, y: number, ch: string) => {
    c.font = `${Math.max(10, 60 * s)}px Georgia, serif`;
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillStyle = "#4a3826"; c.fillText(ch, X(x), Y(y));
  };
  glyph(WINDMILL.x, WINDMILL.y - 40, "✣");
  glyph(KURHAN.x, KURHAN.y - 10, "▲");
  glyph(KURHAN_STEPPE.x, KURHAN_STEPPE.y - 10, "▲");
  if (chumakyPresent(flags)) glyph(CART.x, CART.y, "⛟");
  if (flagHas(flags, "ostapDied")) glyph(GRAVE.x, GRAVE.y - 8, "✝");
  if (!flagHas(flags, "viySealed")) glyph(1420, 260, "◉");
  // the Serpent's Cave once the kobzar has heard of it, and the old tunnel once he knows of it
  if (flagHas(flags, "caveHeard")) glyph(CAVE_HILL.x + CAVE_HILL.w / 2, CAVE_HILL.y + 90, "∩");
  if (flagHas(flags, "lazKnown")) {
    const kp = HOUSE_RECTS.kaplytsia;
    c.save();
    c.setLineDash([7, 6]); c.lineCap = "butt"; c.lineWidth = 2; c.strokeStyle = "rgba(90,58,30,0.75)";
    // (the tunnel itself lies in the underground band; the map only hints at its way)
    c.beginPath(); c.moveTo(X(CAVE_HILL.x + 10), Y(CAVE_HILL.y + 80));
    c.bezierCurveTo(X(CAVE_HILL.x - 250), Y(CAVE_HILL.y - 700), X(kp.x + 200), Y(kp.y + 900), X(kp.x + 70), Y(kp.y + 100));
    c.stroke();
    c.restore();
  }
  c.restore();

  // labels
  const label = (key: string, x: number, y: number, size = 13, col = "#3a2a1c") => {
    c.font = `italic 700 ${size}px Georgia, serif`;
    c.textAlign = "center"; c.textBaseline = "middle";
    // light lettering gets a dark halo, dark lettering a parchment one
    const light = parseInt(col.slice(1, 3), 16) > 160;
    c.lineWidth = 3.4; c.strokeStyle = light ? "rgba(30,28,40,0.75)" : "rgba(240,230,205,0.85)";
    c.strokeText(t(key as TextKey), X(x), Y(y));
    c.fillStyle = col; c.fillText(t(key as TextKey), X(x), Y(y));
  };
  label("map.khutir", 840, 420, 15);
  label("map.steppe", 2150, 760, 13, "#6a5a30");
  label("map.lysa", LYSA_ORIGIN.x + LYSA_W / 2, LYSA_ORIGIN.y + 120, 14, "#f0ecff");
  label("map.river", 3300, riverY(3300), 12, "#24485a");
  label("map.forest", 800, 2050, 13, "#e9f2dc");
  label("map.forest", 3640, 2200, 13, "#e9f2dc");
  label("map.prokip", HOUSE_RECTS.prokip.x + HOUSE_RECTS.prokip.w / 2, HOUSE_RECTS.prokip.y - 18, 11, "#f2f6e8");
  label("map.fields", 700, 1462, 11);
  label("map.hemp", 1460, 1462, 11, "#f2f6e8");
  label("map.tobacco", 2080, 1930, 11);
  label("map.pond", POND.x, POND.y, 10, "#e9f4f8");
  if (flagHas(flags, "caveHeard")) label("map.cave", CAVE_HILL.x + CAVE_HILL.w / 2, CAVE_HILL.y + 52, 11);
  label("map.boloto", BOLOTO.x, BOLOTO.y - BOLOTO.ry - 10, 11, "#e9f2dc");
  label("map.korchma", HOUSE_RECTS.korchma.x + HOUSE_RECTS.korchma.w / 2, HOUSE_RECTS.korchma.y - 30, 11);

  // the quest's goal: a pulsing gold star
  if (target) {
    const pulse = 1 + Math.sin(now * 0.006) * 0.15;
    c.font = `${Math.round(22 * pulse)}px Georgia, serif`;
    c.textAlign = "center"; c.textBaseline = "middle";
    c.lineWidth = 3; c.strokeStyle = "#5a3a12";
    c.strokeText("★", X(target.x), Y(target.y));
    c.fillStyle = "#f2c416"; c.fillText("★", X(target.x), Y(target.y));
  }
  // the kobzar
  const px = X(pl.x);
  const py = Y(pl.y);
  c.fillStyle = "rgba(200,40,30,0.25)";
  c.beginPath(); c.arc(px, py, 10 + Math.sin(now * 0.008) * 3, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#c8281e";
  c.beginPath(); c.arc(px, py, 5, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#fff"; c.lineWidth = 1.6; c.stroke();
}
