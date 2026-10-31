// --- Viy's vigil: the first fight -------------------------------------------
// Not swords — Gogol's way. You stand inside a chalk circle by Viy's hollow
// through one night. The nechyst (нечисть, the unclean host) crawls in from
// the dark toward the chalk; WARD — the kobzar singing his duma — drives
// back every spirit near the ring (Gogol's Khoma Brut read prayers; a
// kobzar sings).
// Every so often Viy roars for his servants to lift his eyelids — the lids
// rise slowly (the warning), then his gaze opens. Whoever LOOKS at Viy is
// lost: hold LOOK AWAY while the gaze is open. But while your eyes are
// covered you cannot ward. (The host bows while the gaze is open, but it
// crawls on while the lids are still rising.) Hold your nerve
// until the rooster crows and the night is won.
//
// Stats and preparations shape it:
//   CON → Nerve (6 + 2×CON)           CHA (Music) → how far the duma carries
//   DEX → how quickly you ward again  chalk circle → required to begin
//   Vesna's wreath  → the gaze takes half as much nerve
//   Radek's iron ward → the first 3 spirits to touch the chalk burn away
//
// This module is pure (seeded randomness, no DOM) so it can be tested;
// App.tsx feeds it input each frame and draws the state.

export const VIGIL_SECONDS = 80;
export const CIRCLE_R = 64;
export const SPAWN_R = 300;

export type FightPrep = { con: number; cha: number; dex: number; wreath: boolean; ironWard: boolean; lyulka?: boolean };
export type FightInput = { lookAway: boolean; ward: boolean };

export type Spirit = { id: number; angle: number; dist: number; speed: number; wobble: number };

export type GazePhase = "closed" | "rising" | "open";

export type FightState = {
  t: number;
  nerve: number;
  maxNerve: number;
  spirits: Spirit[];
  nextSpawnAt: number;
  nextId: number;
  gaze: GazePhase;
  gazePhaseEnd: number;
  nextGazeAt: number;
  gazeHurt: boolean;
  wardReadyAt: number;
  wardFlashUntil: number;
  ironCharges: number;
  outcome: "won" | "broken" | null;
  seed: number;
  prep: FightPrep;
};

export type FightEvent =
  | { kind: "spawn" }
  | { kind: "ward"; repelled: number }
  | { kind: "wardCooling" }
  | { kind: "touch"; burned: boolean }
  | { kind: "gazeWarning" }
  | { kind: "gazeOpen" }
  | { kind: "gazeHit"; damage: number }
  | { kind: "gazeAvoided" }
  | { kind: "won" }
  | { kind: "broken" };

const GAZE_RISE = 2.4;
const GAZE_OPEN = 1.7;

// Small deterministic PRNG (mulberry32) — the vigil plays out the same
// for the same seed, which keeps the tests honest.
function rand(s: FightState): number {
  s.seed = (s.seed + 0x6d2b79f5) | 0;
  let t = s.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function maxNerveFor(con: number): number {
  return 6 + 2 * Math.max(1, con);
}

export function wardReach(cha: number): number {
  return CIRCLE_R + 70 + 14 * (Math.max(1, cha) - 1);
}

export function wardCooldown(dex: number): number {
  return Math.max(0.7, 1.6 - 0.15 * (Math.max(1, dex) - 1));
}

// The otaman's pipe: a smoke before the vigil steadies the hand.
export const LYULKA_NERVE = 2;

export function startFight(prep: FightPrep, seed = 1): FightState {
  // the otaman's pipe (systems/tobacco.ts): a smoke steadies the hand
  const maxNerve = maxNerveFor(prep.con) + (prep.lyulka ? LYULKA_NERVE : 0);
  return {
    t: 0,
    nerve: maxNerve,
    maxNerve,
    spirits: [],
    nextSpawnAt: 1.5,
    nextId: 1,
    gaze: "closed",
    gazePhaseEnd: 0,
    nextGazeAt: 11,
    gazeHurt: false,
    wardReadyAt: 0,
    wardFlashUntil: 0,
    ironCharges: prep.ironWard ? 3 : 0,
    outcome: null,
    seed,
    prep,
  };
}

// Spawn interval tightens as the night deepens: 3.0 s → 1.4 s.
function spawnGap(t: number): number {
  return Math.max(1.4, 3 - t / 45);
}

export function stepFight(s: FightState, dt: number, input: FightInput): FightEvent[] {
  const ev: FightEvent[] = [];
  if (s.outcome) return ev;
  s.t += dt;

  // --- the host crawls in
  if (s.t >= s.nextSpawnAt) {
    const crowd = s.t > 50 && rand(s) < 0.35 ? 2 : 1;
    for (let i = 0; i < crowd; i++) {
      s.spirits.push({
        id: s.nextId++,
        angle: rand(s) * Math.PI * 2,
        dist: SPAWN_R + rand(s) * 40,
        speed: 34 + rand(s) * 22 + s.t * 0.18,
        wobble: rand(s) * Math.PI * 2,
      });
    }
    s.nextSpawnAt = s.t + spawnGap(s.t) * (0.75 + rand(s) * 0.5);
    ev.push({ kind: "spawn" });
  }
  // While the lids are up, even the host bows and holds still.
  if (s.gaze !== "open") for (const sp of s.spirits) sp.dist -= sp.speed * dt;
  const touching = s.spirits.filter((sp) => sp.dist <= CIRCLE_R);
  if (touching.length) {
    s.spirits = s.spirits.filter((sp) => sp.dist > CIRCLE_R);
    for (let i = 0; i < touching.length; i++) {
      if (s.ironCharges > 0) {
        s.ironCharges -= 1;
        ev.push({ kind: "touch", burned: true });
      } else {
        s.nerve -= 1;
        ev.push({ kind: "touch", burned: false });
      }
    }
  }

  // --- warding (not while your eyes are covered)
  if (input.ward && !input.lookAway) {
    if (s.t >= s.wardReadyAt) {
      const reach = wardReach(s.prep.cha);
      const before = s.spirits.length;
      s.spirits = s.spirits.filter((sp) => sp.dist > reach);
      s.wardReadyAt = s.t + wardCooldown(s.prep.dex);
      s.wardFlashUntil = s.t + 0.35;
      ev.push({ kind: "ward", repelled: before - s.spirits.length });
    } else {
      ev.push({ kind: "wardCooling" });
    }
  }

  // --- Viy's gaze: closed → rising (warning) → open → closed
  if (s.gaze === "closed" && s.t >= s.nextGazeAt && s.t < VIGIL_SECONDS - GAZE_RISE - GAZE_OPEN) {
    s.gaze = "rising";
    s.gazePhaseEnd = s.t + GAZE_RISE;
    ev.push({ kind: "gazeWarning" });
  } else if (s.gaze === "rising" && s.t >= s.gazePhaseEnd) {
    s.gaze = "open";
    s.gazePhaseEnd = s.t + GAZE_OPEN;
    s.gazeHurt = false;
    ev.push({ kind: "gazeOpen" });
  } else if (s.gaze === "open") {
    if (!input.lookAway && !s.gazeHurt) {
      // Meeting his eyes even for a moment costs dearly — once per gaze.
      const damage = s.prep.wreath ? 2 : 4;
      s.nerve -= damage;
      s.gazeHurt = true;
      ev.push({ kind: "gazeHit", damage });
    }
    if (s.t >= s.gazePhaseEnd) {
      if (!s.gazeHurt) ev.push({ kind: "gazeAvoided" });
      s.gaze = "closed";
      s.nextGazeAt = s.t + 9 + rand(s) * 6;
    }
  }

  if (s.nerve <= 0) {
    s.nerve = 0;
    s.outcome = "broken";
    ev.push({ kind: "broken" });
  } else if (s.t >= VIGIL_SECONDS) {
    s.outcome = "won";
    s.spirits = [];
    s.gaze = "closed";
    ev.push({ kind: "won" });
  }
  return ev;
}
