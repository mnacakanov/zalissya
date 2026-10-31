import { HOUSE_RECTS, type HouseId, OTAMAN_DOORS, OTAMAN_WALLS } from "../data/houses";
import { PLACES, type ResidentId, type Spot } from "../data/schedules";

// --- The khutir's day ---------------------------------------------------------------
// Where each resident should be, and doing what, at a minute of a day. Pure:
// App walks them there (through doors, never through walls) and draws the
// pose. Minutes are after midnight (systems/time.ts).
//   night     — everyone sleeps in their own bed (or its like)
//   morning   — up and at work: the otaman judges on the maidan, Vesna at her
//               rack or garden, Radek at the forge, Odarka at the counter
//   midday    — a rest on a bench
//   evening   — the khutir gathers round the fire on the maidan; Vesna and
//               Radek bathe in the pond first; the korchma fills up
//   some nights, after the khutir sleeps:
//     Okhrim walks to Lysa Hora to play cards with the Chort (as Gogol's
//       Cossacks did, and lost), every third night
//     Vesna goes up the slopes for nichnyky every fourth night, and will
//       not say why

export type Pose = "stand" | "sit" | "sleep" | "bathe";
export type Activity = "sleep" | "work" | "rest" | "gather" | "bathe" | "lysa" | "fields";
export type Plan = { at: Spot; pose: Pose; act: Activity };

const H = (h: number, m = 0) => h * 60 + m;
const between = (m: number, from: number, to: number) => (from <= to ? m >= from && m < to : m >= from || m < to);

export function okhrimLysaNight(day: number): boolean {
  return day % 3 === 1;
}
export function vesnaLysaNight(day: number): boolean {
  return day % 4 === 2;
}

export function planFor(id: ResidentId, minute: number, day: number): Plan {
  const m = ((minute % 1440) + 1440) % 1440;
  // the night belongs to the evening before it: 01:00 on day 5 is day 4's night
  const nightOf = m < H(6) ? day - 1 : day;
  switch (id) {
    case "myroslav": {
      const P = PLACES.myroslav;
      if (between(m, H(22), H(6))) return { at: P.bed, pose: "sleep", act: "sleep" };
      if (m < H(8)) return { at: P.porch, pose: "stand", act: "work" };
      if (m < H(13)) return { at: P.work, pose: "stand", act: "work" };
      if (m < H(15)) return { at: P.rest, pose: "sit", act: "rest" };
      if (m < H(18)) return { at: P.fields, pose: "stand", act: "fields" };
      return { at: P.evening, pose: "sit", act: "gather" };
    }
    case "vesna": {
      const P = PLACES.vesna;
      if (vesnaLysaNight(nightOf) && between(m, H(23, 30), H(2, 30))) return { at: P.lysa, pose: "stand", act: "lysa" };
      if (between(m, H(22, 30), H(6))) return { at: P.bed, pose: "sleep", act: "sleep" };
      if (m < H(9)) return { at: P.garden, pose: "stand", act: "work" };
      if (m < H(13)) return { at: P.work, pose: "stand", act: "work" };
      if (m < H(15)) return { at: P.rest, pose: "sit", act: "rest" };
      if (m < H(18)) return { at: P.garden, pose: "stand", act: "work" };
      if (m < H(19)) return { at: P.bathe, pose: "bathe", act: "bathe" };
      return { at: P.evening, pose: "sit", act: "gather" };
    }
    case "radek": {
      const P = PLACES.radek;
      if (between(m, H(22), H(6))) return { at: P.bed, pose: "sleep", act: "sleep" };
      if (m < H(12)) return { at: P.work, pose: "stand", act: "work" };
      if (m < H(13)) return { at: P.rest, pose: "sit", act: "rest" };
      if (m < H(19)) return { at: P.work, pose: "stand", act: "work" };
      if (m < H(19, 40)) return { at: P.bathe, pose: "bathe", act: "bathe" };
      return { at: P.evening, pose: "sit", act: "gather" };
    }
    case "odarka": {
      const P = PLACES.odarka;
      // the korchma keeps late hours
      if (between(m, H(1), H(7))) return { at: P.bed, pose: "sleep", act: "sleep" };
      if (m >= H(14) && m < H(15)) return { at: P.rest, pose: "sit", act: "rest" };
      return { at: P.work, pose: "stand", act: "work" };
    }
    case "okhrim": {
      const P = PLACES.okhrim;
      if (okhrimLysaNight(nightOf) && between(m, H(23), H(3))) return { at: P.lysa, pose: "sit", act: "lysa" };
      if (between(m, H(3), H(10))) return { at: P.bed, pose: "sleep", act: "sleep" };
      if (m >= H(15) && m < H(16)) return { at: P.rest, pose: "sit", act: "rest" };
      return { at: P.work, pose: "sit", act: "work" };
    }
  }
}

// --- Walking there -----------------------------------------------------------------
// Residents walk in straight lines out of doors, but never through a wall:
// leaving a khata they make for its door, and so entering one. In the
// otaman's khata, built through the siny, they pass the partition doors too.

export type Walker = { x: number; y: number; moving: boolean; face: number; phase: number };

function insideDoor(id: HouseId): Spot {
  const r = HOUSE_RECTS[id];
  return { x: r.x + r.w / 2, y: r.y + r.h - 30 };
}
function outsideDoor(id: HouseId): Spot {
  const r = HOUSE_RECTS[id];
  return { x: r.x + r.w / 2, y: r.y + r.h + 22 };
}
// the otaman's rooms: 0 west (the khata), 1 the siny, 2 east (the svitlytsia)
function otamanRoom(p: Spot): number {
  const lx = p.x - HOUSE_RECTS.otaman.x;
  return lx < OTAMAN_WALLS.west ? 0 : lx < OTAMAN_WALLS.east + OTAMAN_WALLS.w ? 1 : 2;
}
const ROOM_X = [80, 190, 300];

// which khata's whole footprint (walls and doorstep included) holds a point
function footprintAt(p: Spot): HouseId | null {
  for (const id of Object.keys(HOUSE_RECTS) as HouseId[]) {
    const r = HOUSE_RECTS[id];
    if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return id;
  }
  return null;
}

export function nextWaypoint(from: Spot, to: Spot): Spot {
  const fh = footprintAt(from);
  const th = footprintAt(to);
  // moving between the otaman's rooms (or out of one, to the siny first)
  if (fh === "otaman") {
    const want = th === "otaman" ? otamanRoom(to) : 1;
    const here = otamanRoom(from);
    if (here !== want) {
      const doorY = HOUSE_RECTS.otaman.y + OTAMAN_DOORS.y + OTAMAN_DOORS.h / 2;
      const ox = HOUSE_RECTS.otaman.x;
      if (Math.abs(from.y - doorY) > 6) return { x: ox + (ROOM_X[here] ?? 190), y: doorY };
      return { x: ox + (ROOM_X[want] ?? 190), y: doorY };
    }
  }
  if (fh && fh !== th) {
    // to the door from inside; once in line with it, straight out
    const inD = insideDoor(fh);
    const lined = Math.abs(from.x - inD.x) < 8 && from.y >= inD.y - 3;
    return lined ? outsideDoor(fh) : inD;
  }
  if (th && fh !== th) {
    // to the step outside; once in line with the door, straight in
    const outD = outsideDoor(th);
    const lined = Math.abs(from.x - outD.x) < 8 && from.y <= outD.y + 3;
    return lined ? insideDoor(th) : outD;
  }
  // out of doors: if a khata stands in the way, go round by its corners
  return aroundHouses(from, to);
}

const PAD = 18;
function segHitsRect(a: Spot, b: Spot, r: { x: number; y: number; w: number; h: number }): boolean {
  // sample the segment; plenty for houses this size
  const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 8);
  for (let i = 1; i < n; i++) {
    const x = a.x + ((b.x - a.x) * i) / n;
    const y = a.y + ((b.y - a.y) * i) / n;
    if (x > r.x - 2 && x < r.x + r.w + 2 && y > r.y - 2 && y < r.y + r.h + 2) return true;
  }
  return false;
}
function aroundHouses(from: Spot, to: Spot): Spot {
  for (const id of Object.keys(HOUSE_RECTS) as HouseId[]) {
    const r = HOUSE_RECTS[id];
    if (!segHitsRect(from, to, r)) continue;
    const corners: Spot[] = [
      { x: r.x - PAD, y: r.y - PAD }, { x: r.x + r.w + PAD, y: r.y - PAD },
      { x: r.x - PAD, y: r.y + r.h + PAD }, { x: r.x + r.w + PAD, y: r.y + r.h + PAD },
    ];
    let best: Spot = to;
    let bestCost = Infinity;
    for (const k of corners) {
      if (Math.hypot(k.x - from.x, k.y - from.y) < 3) continue;
      if (segHitsRect(from, k, r)) continue;
      const cost = Math.hypot(k.x - from.x, k.y - from.y) + Math.hypot(to.x - k.x, to.y - k.y);
      if (cost < bestCost) { bestCost = cost; best = k; }
    }
    return best;
  }
  return to;
}

// One frame's walk toward the target; true once there.
export function walkToward(w: Walker, target: Spot, dt: number, speed = 62): boolean {
  const wp = nextWaypoint(w, target);
  const dx = wp.x - w.x;
  const dy = wp.y - w.y;
  const d = Math.hypot(dx, dy);
  if (d < 1.5 && wp === target) { w.moving = false; return true; }
  const step = Math.min(d, speed * dt);
  if (d > 0.01) { w.x += (dx / d) * step; w.y += (dy / d) * step; }
  if (Math.abs(dx) > 0.5) w.face = dx > 0 ? 1 : -1;
  w.moving = true;
  w.phase += dt * 9;
  return false;
}
