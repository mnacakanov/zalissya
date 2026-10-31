import { describe, expect, test } from "bun:test";
import { perelesnykFlies, perelesnykMeetable, prokipNext, prokipStage, vesnaAngry, vesnaCanForgive, type ProkipView } from "./vorozhbyt";

const v = (flags: string[], met = true, heard = true): ProkipView => ({ flags: new Set(flags), met, heard });

describe("Did Prokip's thread", () => {
  test("before and on meeting him", () => {
    expect(prokipStage(v([], false, false))).toBe("unheard");
    expect(prokipStage(v([], false, true))).toBe("find");
    expect(prokipStage(v([]))).toBe("offerSieve");
  });
  test("walking the whole thread with his errand topic", () => {
    const flags = new Set<string>();
    const step = (extra?: string) => {
      if (extra) flags.add(extra);
      const s = prokipStage({ flags, met: true, heard: true });
      const next = prokipNext(s);
      if (next) flags.add(next);
      return s;
    };
    expect(step()).toBe("offerSieve");
    expect(prokipStage({ flags, met: true, heard: true })).toBe("sieve");
    expect(prokipNext("sieve")).toBeNull();
    expect(step("reshetoTried")).toBe("sieveBack");
    expect(step()).toBe("offerMessage");
    expect(prokipStage({ flags, met: true, heard: true })).toBe("message");
    expect(step("vesnaTold")).toBe("answer");
    expect(step()).toBe("offerPerelesnyk");
    expect(prokipStage({ flags, met: true, heard: true })).toBe("perelesnyk");
    expect(step("perelesnykGone")).toBe("reward");
    expect(prokipStage({ flags, met: true, heard: true })).toBe("done");
    expect(flags.has("zviryna")).toBe(true);
  });
  test("Vesna stays cross until you apologize, which you can do once Prokip has laughed", () => {
    expect(vesnaAngry(new Set(["prokipMessage"]))).toBe(false);
    expect(vesnaAngry(new Set(["vesnaTold"]))).toBe(true);
    expect(vesnaCanForgive(new Set(["vesnaTold"]))).toBe(false);
    expect(vesnaCanForgive(new Set(["vesnaTold", "vesnaDone"]))).toBe(true);
    expect(vesnaAngry(new Set(["vesnaTold", "vesnaDone", "vesnaForgiven"]))).toBe(false);
    // the quest goes on whether or not you have made it up with her
    expect(prokipStage(v(["vesnaTold", "vesnaDone"]))).toBe("offerPerelesnyk");
    // a save from before carried her answer back without making her cross
    expect(prokipStage(v(["vesnaAnswer"]))).toBe("answer");
    expect(vesnaAngry(new Set(["vesnaAnswer"]))).toBe(false);
  });
  test("sparing Odarka's visitor does not finish the quest", () => {
    expect(prokipStage(v(["perelesnykQuest", "perelesnykSpared"]))).toBe("perelesnyk");
  });
  test("the perelesnyk flies at night until driven off, and is met only on the quest", () => {
    expect(perelesnykFlies(new Set(), 22 * 60)).toBe(true);
    expect(perelesnykFlies(new Set(), 12 * 60)).toBe(false);
    expect(perelesnykMeetable(new Set(), 22 * 60)).toBe(false);
    expect(perelesnykMeetable(new Set(["perelesnykQuest"]), 22 * 60)).toBe(true);
    expect(perelesnykFlies(new Set(["perelesnykGone"]), 22 * 60)).toBe(false);
  });
});
