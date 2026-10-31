// --- The khutir's animals ------------------------------------------------------
// Pure wandering logic for the animals that live round the khutir (drawn by
// render/animals.ts). Each keeps to its home ground:
//   dog    — the otaman's yard dog: trots up to the kobzar when he is near,
//            sits by him, goes home when he leaves; sleeps at night
//   goose  — geese on and around the pond: they wander, and scatter
//            (hissing, one assumes) when someone strides into them
//   cow    — grazes slowly on the pasture by the windmill
//   horse  — tied at the korchma's rail: shifts its weight, little more
// Chickens keep their own older logic in App.

export type CritterKind = "dog" | "goose" | "cow" | "horse";

export type Critter = {
  kind: CritterKind;
  x: number; y: number;
  home: { x: number; y: number; r: number };
  tx: number; ty: number;
  wait: number;
  face: 1 | -1;
  moving: boolean;
  phase: number;
  sitting: boolean;
};

const SPEED: Record<CritterKind, number> = { dog: 120, goose: 34, cow: 12, horse: 6 };

function make(kind: CritterKind, x: number, y: number, r: number): Critter {
  return { kind, x, y, home: { x, y, r }, tx: x, ty: y, wait: 0, face: 1, moving: false, phase: 0, sitting: false };
}

export function makeCritters(): Critter[] {
  return [
    make("dog", 1060, 360, 90),
    make("goose", 1240, 980, 80), make("goose", 1290, 1000, 80), make("goose", 1360, 990, 80), make("goose", 1400, 1015, 80),
    make("cow", 300, 860, 70),
    make("horse", 2214, 1206, 10),
  ];
}

export type CritterWorld = {
  player: { x: number; y: number };
  night: boolean;
  rnd: () => number;
};

export function stepCritter(c: Critter, dt: number, w: CritterWorld): void {
  c.phase += dt;
  const pdx = c.x - w.player.x;
  const pdy = c.y - w.player.y;
  const pd = Math.hypot(pdx, pdy);
  c.sitting = false;
  if (c.kind === "dog") {
    if (w.night) { c.moving = false; c.sitting = true; return; } // asleep by the porch
    const fromHome = Math.hypot(w.player.x - c.home.x, w.player.y - c.home.y);
    if (fromHome < 220 && pd < 180) {
      // come and sit at the kobzar's heel, a little to one side
      c.tx = w.player.x + (pdx >= 0 ? 26 : -26);
      c.ty = w.player.y + 6;
      c.wait = 0;
    } else if (c.wait <= 0 && Math.hypot(c.tx - c.home.x, c.ty - c.home.y) > c.home.r) {
      c.tx = c.home.x; c.ty = c.home.y;
    }
  }
  if (c.kind === "goose" && pd < 56 && pd > 0.01) {
    // a stranger in the flock: scatter
    c.x += (pdx / pd) * 80 * dt;
    c.y += (pdy / pd) * 80 * dt;
    c.tx = c.x; c.ty = c.y;
    c.face = pdx >= 0 ? 1 : -1;
    c.moving = true;
    clampHome(c);
    return;
  }
  if (c.wait > 0) {
    c.wait -= dt;
    c.moving = false;
    c.sitting = c.kind === "dog";
    return;
  }
  const dx = c.tx - c.x;
  const dy = c.ty - c.y;
  const d = Math.hypot(dx, dy);
  if (d < 3) {
    c.moving = false;
    c.sitting = c.kind === "dog";
    if (c.kind === "dog" && pd < 40) return; // sitting by the kobzar
    c.wait = (c.kind === "cow" ? 3 : c.kind === "horse" ? 4 : 1.2) + w.rnd() * 3;
    const a = w.rnd() * Math.PI * 2;
    const r = w.rnd() * c.home.r;
    c.tx = c.home.x + Math.cos(a) * r;
    c.ty = c.home.y + Math.sin(a) * r * 0.6;
    return;
  }
  const step = Math.min(d, SPEED[c.kind] * dt);
  c.x += (dx / d) * step;
  c.y += (dy / d) * step;
  if (Math.abs(dx) > 0.5) c.face = dx > 0 ? 1 : -1;
  c.moving = true;
  if (c.kind !== "dog") clampHome(c);
}

function clampHome(c: Critter): void {
  const dx = c.x - c.home.x;
  const dy = c.y - c.home.y;
  const d = Math.hypot(dx, dy);
  const max = c.home.r * 1.2;
  if (d > max) { c.x = c.home.x + (dx / d) * max; c.y = c.home.y + (dy / d) * max; }
}
