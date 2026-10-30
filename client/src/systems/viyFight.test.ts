import { describe, expect, test } from "bun:test";
import { type FightInput, type FightState, startFight, stepFight, VIGIL_SECONDS, wardReach } from "./viyFight";

const DT = 1 / 30;

function run(s: FightState, policy: (s: FightState) => FightInput): FightState {
  for (let i = 0; i < (VIGIL_SECONDS + 5) / DT && !s.outcome; i++) stepFight(s, DT, policy(s));
  return s;
}

// A careful keeper: wards while the lids are still rising, covers their
// eyes at the last moment and keeps them covered while the gaze is open.
const careful = (s: FightState): FightInput => {
  const lookAway = s.gaze === "open" || (s.gaze === "rising" && s.gazePhaseEnd - s.t < 0.3);
  const near = s.spirits.some((sp) => sp.dist < wardReach(s.prep.wis) - 10);
  return { lookAway, ward: !lookAway && near && s.t >= s.wardReadyAt };
};

describe("Viy's vigil", () => {
  const base = { con: 1, wis: 1, dex: 1, wreath: false, ironWard: false };

  test("doing nothing breaks your nerve before cockcrow", () => {
    const s = run(startFight(base, 7), () => ({ lookAway: false, ward: false }));
    expect(s.outcome).toBe("broken");
    expect(s.t).toBeLessThan(VIGIL_SECONDS);
  });

  test("a careful keeper with no preparations still makes it to cockcrow", () => {
    for (const seed of [1, 2, 3, 42, 99]) {
      const s = run(startFight(base, seed), careful);
      expect(s.outcome).toBe("won");
    }
  });

  test("meeting Viy's eyes costs 4 nerve, 2 with Vesna's wreath", () => {
    const hits = (wreath: boolean) => {
      const s = startFight({ ...base, con: 5, wreath }, 3);
      const events = [];
      for (let i = 0; i < 20 / DT; i++) events.push(...stepFight(s, DT, { lookAway: false, ward: true }));
      return events.find((e) => e.kind === "gazeHit");
    };
    expect(hits(false)).toEqual({ kind: "gazeHit", damage: 4 });
    expect(hits(true)).toEqual({ kind: "gazeHit", damage: 2 });
  });

  test("Radek's iron ward burns the first three spirits to touch the chalk", () => {
    const s = startFight({ ...base, con: 5, ironWard: true }, 5);
    const touches = [];
    for (let i = 0; i < 40 / DT && touches.length < 4; i++) {
      for (const e of stepFight(s, DT, { lookAway: true, ward: false })) if (e.kind === "touch") touches.push(e.burned);
    }
    expect(touches.slice(0, 4)).toEqual([true, true, true, false]);
  });

  test("you cannot ward with your eyes covered", () => {
    const s = startFight(base, 1);
    const ev = stepFight(s, DT, { lookAway: true, ward: true });
    expect(ev.some((e) => e.kind === "ward")).toBe(false);
  });
});
