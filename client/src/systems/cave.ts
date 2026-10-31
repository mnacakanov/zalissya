import { BAT_CIRCLE, BAT_ROOSTS, NEWT_AREA, NEWT_HOMES, RAT_HOMES, ZMIY_COIL_WORLD } from "../data/cave";
import { clamp, hash2, type Rect } from "../world/geometry";
import { flagHas } from "./flags";
import { reception, SONGS, type Mood, type SongId } from "./songs";
import { addChervintsi } from "./trade";

// --- The Serpent's Cave and its tunnel (data/cave.ts) ---------------------------------
// Pure rules, so they can be tested without a canvas. Everything the cave
// remembers is a flag; none of it is stored twice.

// --- the serpent ---------------------------------------------------------------------
// The Zmiy is old and sad (he carried off a bride who never loved him, and
// she died in his cave), and a kobzar reads the room as he reads any other:
//   a sad song     → it is exactly his mood: he weeps, sleeps, draws his coil back
//   a neutral song → he listens, one eye open, and is not moved
//   a happy song   → he wakes, and the whole cave knows it (the bats go up)
// Nothing is lost by a wrong song: he settles again and the kobzar may try another.
export const ZMIY_MOOD: Mood = "sad";
export type Lull = "lulled" | "listens" | "wakes";

export function lullResult(song: SongId): Lull {
  const rec = reception(ZMIY_MOOD, SONGS[song].mood);
  return rec === "match" ? "lulled" : rec === "fine" ? "listens" : "wakes";
}

export const zmiyLulled = (flags: ReadonlySet<string>): boolean => flagHas(flags, "zmiyLulled");
export const lazKnown = (flags: ReadonlySet<string>): boolean => flagHas(flags, "lazKnown");
// the crack in the lair's wall shows once the serpent sleeps — or once the
// kobzar has been through it (from the tunnel's side, behind the coil)
export const crackShown = (flags: ReadonlySet<string>): boolean => flagHas(flags, "zmiyLulled") || flagHas(flags, "lazOpen");

// While the serpent is awake his coil lies across the passage into the lair
// (data/houses.ts ZMIY_COIL). Added to the frame's solids by App.
export function caveSolids(flags: ReadonlySet<string>): Rect[] {
  return zmiyLulled(flags) ? [] : [ZMIY_COIL_WORLD];
}

// --- coins ----------------------------------------------------------------------------
// The serpent's hoard is the dowry he took with the bride, and the sentry's
// pouch is what a man carried to the end of a tunnel. Weightless, once each.
export const HOARD_COINS = 12;
export const POUCH_COINS = 3;

export function takeHoard(flags: Set<string>): number {
  if (!zmiyLulled(flags) || flagHas(flags, "zmiyHoard")) return 0;
  flags.add("zmiyHoard");
  addChervintsi(flags, HOARD_COINS);
  return HOARD_COINS;
}
export function takePouch(flags: Set<string>): number {
  if (flagHas(flags, "sentryPouch")) return 0;
  flags.add("sentryPouch");
  addChervintsi(flags, POUCH_COINS);
  return POUCH_COINS;
}

// --- the ways through -----------------------------------------------------------------
//   crack        — the cave's back wall → the tunnel's west end
//   tunnelWest   — the tunnel's west end → the cave, behind the coil
//   tunnelEast   — the ladder at the tunnel's east end → under the kaplytsia
//   chapelHatch  — the hatch under the kaplytsia's rug → the tunnel's east end
export type LazSpot = "crack" | "tunnelWest" | "tunnelEast" | "chapelHatch";
export type Arrival = "tunnelWest" | "cave" | "chapel" | "tunnelEast";

export const LAZ_TO: Record<LazSpot, Arrival> = {
  crack: "tunnelWest",
  tunnelWest: "cave",
  tunnelEast: "chapel",
  chapelHatch: "tunnelEast",
};

export function lazAvailable(spot: LazSpot, flags: ReadonlySet<string>): boolean {
  switch (spot) {
    case "crack": return crackShown(flags);
    case "tunnelWest": case "tunnelEast": return true;
    // you can only lift the rug if you know there is something under it
    case "chapelHatch": return lazKnown(flags) || flagHas(flags, "lazChapel") || flagHas(flags, "lazOpen");
  }
}

// What passing through teaches the kobzar (and the world): the cave's end
// of the way is "lazOpen", the chapel's end "lazChapel" (the rug lies folded
// back once the hatch has been used).
const PASS_FLAG: Record<LazSpot, "lazOpen" | "lazChapel"> = {
  crack: "lazOpen", tunnelWest: "lazOpen", tunnelEast: "lazChapel", chapelHatch: "lazChapel",
};
export function passFlags(spot: LazSpot): string[] {
  return ["lazKnown", PASS_FLAG[spot]];
}
// First time through this end of the tunnel?
export function firstPass(spot: LazSpot, flags: ReadonlySet<string>): boolean {
  return !flagHas(flags, PASS_FLAG[spot]);
}

// --- bats ---------------------------------------------------------------------------------
// Bats hang along the back wall. Come near and they go up in a flock and circle
// the cavern a few seconds before settling again; a startled serpent sends them
// up too. They ease toward wherever they are going, so lifting off and coming
// home need no special case.
export type Bat = { hx: number; hy: number; x: number; y: number; hang: boolean; ang: number; rad: number; spin: number; until: number; seed: number };
export type Crawler = {
  kind: "newt" | "rat";
  x: number; y: number; hx: number; hy: number;
  area: Rect;
  tx: number; ty: number; wait: number;
  face: 1 | -1; moving: boolean; phase: number; seed: number; tick: number;
};
export type CaveLife = { bats: Bat[]; crawlers: Crawler[]; batsQuietUntil: number };

const BAT_NEAR = 150;
const BAT_QUIET_MS = 16000;

export function makeCaveLife(): CaveLife {
  const bats: Bat[] = BAT_ROOSTS.map((r, i) => ({
    hx: r.x, hy: r.y, x: r.x, y: r.y, hang: true, ang: hash2(i, 5) * 6.28,
    rad: 60 + hash2(i, 9) * 150, spin: (hash2(i, 13) > 0.5 ? 1 : -1) * (0.9 + hash2(i, 17) * 0.8), until: 0, seed: i,
  }));
  const mk = (kind: "newt" | "rat", h: { x: number; y: number }, area: Rect, seed: number): Crawler => ({
    kind, x: h.x, y: h.y, hx: h.x, hy: h.y, area, tx: h.x, ty: h.y, wait: 0.5 + hash2(seed, 3) * 2,
    face: 1, moving: false, phase: 0, seed, tick: 0,
  });
  const crawlers: Crawler[] = [
    ...NEWT_HOMES.map((h, i) => mk("newt", h, NEWT_AREA, 100 + i)),
    ...RAT_HOMES.map((h, i) => mk("rat", h, h.area, 200 + i)),
  ];
  return { bats, crawlers, batsQuietUntil: 0 };
}

export function startleBats(life: CaveLife, now: number): void {
  for (const b of life.bats) {
    b.hang = false;
    b.until = now + 4500 + hash2(b.seed, 21) * 3500;
  }
  life.batsQuietUntil = now + BAT_QUIET_MS;
}

const SCARE: Record<Crawler["kind"], { r: number; flee: number; wander: number }> = {
  newt: { r: 70, flee: 62, wander: 15 },
  rat: { r: 96, flee: 120, wander: 30 },
};

export function stepCaveLife(life: CaveLife, dt: number, now: number, player: { x: number; y: number }): void {
  // bats
  const near = life.bats.some((b) => b.hang && Math.hypot(b.hx - player.x, b.hy - player.y) < BAT_NEAR);
  if (near && now >= life.batsQuietUntil) startleBats(life, now);
  for (const b of life.bats) {
    if (!b.hang && now >= b.until) {
      // time to go home: fly to the roost, hang once there
      if (Math.hypot(b.hx - b.x, b.hy - b.y) < 4) { b.hang = true; b.x = b.hx; b.y = b.hy; continue; }
    }
    let tx = b.hx;
    let ty = b.hy;
    if (!b.hang && now < b.until) {
      b.ang += b.spin * dt;
      tx = BAT_CIRCLE.x + Math.cos(b.ang) * b.rad;
      ty = BAT_CIRCLE.y + Math.sin(b.ang * 1.3) * b.rad * 0.42;
    }
    if (!b.hang) {
      const k = Math.min(1, dt * 2.6);
      b.x += (tx - b.x) * k;
      b.y += (ty - b.y) * k;
    }
  }
  // salamanders and rats
  for (const c of life.crawlers) {
    const sc = SCARE[c.kind];
    const dx = c.x - player.x;
    const dy = c.y - player.y;
    const d = Math.hypot(dx, dy);
    let vx = 0;
    let vy = 0;
    if (d < sc.r && d > 0.01) {
      vx = (dx / d) * sc.flee;
      vy = (dy / d) * sc.flee;
      c.wait = 0.4;
      c.tx = c.x; c.ty = c.y;
    } else if (c.wait > 0) {
      c.wait -= dt;
      if (c.wait <= 0) {
        c.tick++;
        c.tx = clamp(c.hx + (hash2(c.seed, c.tick * 1.7) - 0.5) * 90, c.area.x, c.area.x + c.area.w);
        c.ty = clamp(c.hy + (hash2(c.tick * 2.3, c.seed) - 0.5) * 60, c.area.y, c.area.y + c.area.h);
      }
    } else {
      const ex = c.tx - c.x;
      const ey = c.ty - c.y;
      const ed = Math.hypot(ex, ey);
      if (ed < 3) c.wait = 1.2 + hash2(c.seed, c.tick * 3.1) * 3;
      else { vx = (ex / ed) * sc.wander; vy = (ey / ed) * sc.wander; }
    }
    c.moving = Math.abs(vx) + Math.abs(vy) > 0.5;
    if (c.moving) {
      c.x = clamp(c.x + vx * dt, c.area.x, c.area.x + c.area.w);
      c.y = clamp(c.y + vy * dt, c.area.y, c.area.y + c.area.h);
      if (Math.abs(vx) > 0.5) c.face = vx > 0 ? 1 : -1;
      c.phase += dt * (c.kind === "rat" ? 18 : 7);
    }
  }
}
