import { describe, expect, test } from "bun:test";
import { OMELKO_HOME, CHOP_SPOT, REED_SPOTS, STACK_SPOT, THATCH_SPOT } from "../data/pustka";
import { houseAt, houseSolids, HOUSE_RECTS } from "../data/houses";
import { SOLID } from "../data/village";
import { caveTopicSet } from "../dialogue/cave";
import { pustkaTopics } from "../dialogue/pustka";
import { PLAYER_R } from "../world/areas";
import { circleRectCollide } from "../world/geometry";
import { flagCount } from "./flags";
import { carpentryLevel } from "./skills";
import { computeStats } from "./stats";
import { chopLog, cutReed, logsChopped, omelkoAtHome, pustkaEnterKey, pustkaStage, reedsCut, REEDS_NEEDED, stackWood, thatchRoof, burnLogs, WOOD_NEEDED, workTargets } from "./pustka";

const open = () => new Set<string>(["perelesnykGone"]);
const permitted = () => new Set<string>(["perelesnykGone", "omelkoHome", "pustkaLeave"]);

describe("the way in", () => {
  test("nothing starts until the perelesnyk is driven off", () => {
    expect(pustkaStage(new Set())).toBe("locked");
    expect(pustkaStage(new Set(["perelesnykSpared", "omelkoHome", "pustkaLeave"]))).toBe("locked");
    expect(pustkaStage(open())).toBe("ask");
    // he wants a home from the very first meeting; only the work waits for the perelesnyk
    expect(caveTopicSet("omelko", new Set(), true)?.intro.length).toBe(2);
    expect(caveTopicSet("omelko", new Set(), false)?.topics.find((x) => x.id === "home")?.grant).toBe("omelkoHome");
    expect(caveTopicSet("omelko", open(), false)?.topics.map((x) => x.id)).toContain("home");
  });
  test("the empty khata hints at what it could be, once it may be", () => {
    expect(pustkaEnterKey(pustkaStage(new Set()))).toBe("ui.enterHut.pustka");
    expect(pustkaEnterKey(pustkaStage(open()))).toBe("ui.enterHut.pustkaHint");
    expect(pustkaEnterKey(pustkaStage(new Set([...open(), "omelkoHome", "pustkaLeave"])))).toBe("ui.enterHut.pustkaWork");
    expect(pustkaEnterKey(pustkaStage(new Set([...open(), "omelkoMoved"])))).toBe("ui.enterHut.pustkaHome");
  });
  test("Omelko asks, Myroslav gives leave, only in that order", () => {
    expect(pustkaStage(open())).toBe("ask");
    expect(pustkaTopics("myroslav", open())).toHaveLength(0);
    const asked = new Set([...open(), "omelkoHome"]);
    expect(pustkaStage(asked)).toBe("permission");
    const t = pustkaTopics("myroslav", asked)[0];
    expect(t?.grant).toBe("pustkaLeave");
  });
});

describe("the work", () => {
  test("the stove wants six logs, the roof four bundles of reeds", () => {
    const f = permitted();
    for (let i = 0; i < WOOD_NEEDED + 2; i++) chopLog(f);
    expect(logsChopped(f)).toBe(WOOD_NEEDED);
    expect(flagCount(f, "carpentry")).toBe(WOOD_NEEDED); // the pile holds six: further swings do nothing
    expect(thatchRoof(f)).toBeNull(); // no reeds yet
    for (let i = 0; i < REEDS_NEEDED; i++) expect(cutReed(f, i)).not.toBeNull();
    expect(cutReed(f, 0)).toBeNull(); // each clump once
    expect(reedsCut(f)).toBe(REEDS_NEEDED);
  });
  test("the roof, then the pich, then Omelko may be told", () => {
    const f = permitted();
    expect(stackWood(f)).toBeNull();
    for (let i = 0; i < WOOD_NEEDED; i++) chopLog(f);
    for (let i = 0; i < REEDS_NEEDED; i++) cutReed(f, i);
    expect(pustkaStage(f)).toBe("work");
    expect(thatchRoof(f)).not.toBeNull();
    expect(pustkaStage(f)).toBe("work");
    expect(stackWood(f)).not.toBeNull();
    expect(pustkaStage(f)).toBe("ready");
    expect(caveTopicSet("omelko", f, false)?.topics.find((x) => x.id === "move")?.grant).toBe("omelkoMove");
    f.add("omelkoMoved");
    expect(pustkaStage(f)).toBe("done");
    expect(omelkoAtHome(f)).toBe(true);
  });
  test("a tenant at home is no longer in the cave's talk of draughts, and the khutir thanks you", () => {
    const f = new Set([...permitted(), "pustkaRoof", "pustkaFire", "omelkoMoved"]);
    expect(caveTopicSet("omelko", f, false)?.topics.map((x) => x.id)).not.toContain("tunnel");
    for (const who of ["myroslav", "vesna", "radek", "odarka", "okhrim"]) expect(pustkaTopics(who, f)).toHaveLength(1);
    expect(pustkaTopics("myroslav", permitted())).toHaveLength(1); // while the work is on: a reminder, not thanks
    expect(pustkaTopics("vesna", permitted())).toHaveLength(0);
  });
});

describe("the pile burns down overnight", () => {
  const H = 60;
  const lit = () => {
    const f = permitted();
    for (let i = 0; i < WOOD_NEEDED; i++) chopLog(f);
    for (let i = 0; i < REEDS_NEEDED; i++) cutReed(f, i);
    thatchRoof(f); stackWood(f);
    return f;
  };
  test("the pile holds six, and the block can be worked again once it is burnt", () => {
    const f = lit();
    expect(chopLog(f)).toBeNull();
    burnLogs(f, 12 * H, 14 * H); // by day nothing burns
    expect(logsChopped(f)).toBe(6);
    burnLogs(f, 20 * H, 22 * H + 5); // the marks at 21:00 and 22:00
    expect(logsChopped(f)).toBe(4);
    expect(chopLog(f)).not.toBeNull();
  });
  test("one log an hour from 21:00, none left by the morning", () => {
    const f = lit();
    expect(burnLogs(f, 20 * H, 27 * H)).toBe(6); // 20:00 → 03:00
    expect(logsChopped(f)).toBe(0);
    expect(chopLog(f)).not.toBeNull(); // a fresh day, a fresh pile
  });
  test("a long sleep counts the same, and a pile cut late is cleared at dawn", () => {
    const f = lit();
    expect(burnLogs(f, 20 * H, 30 * H)).toBe(6); // slept through to 06:00
    const g = lit();
    expect(burnLogs(g, 27 * H + 30, 31 * H)).toBe(6); // started at 03:30: only dawn clears it
    expect(logsChopped(g)).toBe(0);
  });
  test("nothing burns until the pich is lit", () => {
    const f = permitted();
    for (let i = 0; i < WOOD_NEEDED; i++) chopLog(f);
    expect(burnLogs(f, 20 * H, 30 * H)).toBe(0);
    expect(logsChopped(f)).toBe(6);
  });
});

describe("the glint on the work", () => {
  const kinds = (f: Set<string>) => workTargets(f).map((w) => w.kind + ("idx" in w ? w.idx : "")).join(",");
  test("nothing glints before leave is given, or once it is over", () => {
    expect(workTargets(open())).toEqual([]);
    const f = permitted();
    for (let i = 0; i < WOOD_NEEDED; i++) chopLog(f);
    for (let i = 0; i < REEDS_NEEDED; i++) cutReed(f, i);
    thatchRoof(f); stackWood(f);
    expect(workTargets(f)).toEqual([]);
  });
  test("it marks the next job, and only the jobs still to do", () => {
    const f = permitted();
    expect(kinds(f)).toBe("chop,reed0,reed1,reed2,reed3");
    for (let i = 0; i < WOOD_NEEDED; i++) chopLog(f);
    cutReed(f, 1);
    expect(kinds(f)).toBe("reed0,reed2,reed3,stack"); // the logs are in, so the pich can be laid at any time
    for (const i of [0, 2, 3]) cutReed(f, i);
    expect(kinds(f)).toBe("thatch,stack");
    thatchRoof(f);
    expect(kinds(f)).toBe("stack");
  });
});

describe("the skill", () => {
  test("Carpentry grows by doing and feeds Strength beside Smithing", () => {
    expect(carpentryLevel(0)).toBe(1);
    expect(carpentryLevel(5)).toBe(2);
    expect(carpentryLevel(12)).toBe(3);
    const base = { herbs: 0, fishTotal: 0, cooked: 0, smithed: 0, brewed: 0, played: 0, flags: new Set<string>() };
    expect(computeStats(base).str.base).toBe(1);
    expect(computeStats({ ...base, carpentry: 12 }).str.base).toBe(3);
    expect(computeStats({ ...base, carpentry: 12, smithed: 2 }).str.base).toBe(4);
    // old saves have no Carpentry at all
    expect(computeStats({ ...base, smithed: 2 }).str.base).toBe(2);
  });
  test("the whole khata's work earns a few levels, not a mountain of them", () => {
    const f = permitted();
    for (let i = 0; i < WOOD_NEEDED; i++) chopLog(f);
    for (let i = 0; i < REEDS_NEEDED; i++) cutReed(f, i);
    thatchRoof(f); stackWood(f);
    expect(carpentryLevel(flagCount(f, "carpentry"))).toBe(3);
  });
});

describe("the places", () => {
  const free = (p: { x: number; y: number }) => !SOLID.some((b) => circleRectCollide(p.x, p.y - 6, PLAYER_R, b));
  test("every spot of work can be stood on", () => {
    for (const s of [CHOP_SPOT, THATCH_SPOT, STACK_SPOT, ...REED_SPOTS]) expect(free(s)).toBe(true);
  });
  test("the block and the ladder are outdoors, the pich is indoors", () => {
    expect(houseAt(CHOP_SPOT.x, CHOP_SPOT.y)).toBeNull();
    expect(houseAt(THATCH_SPOT.x, THATCH_SPOT.y)).toBeNull();
    expect(houseAt(STACK_SPOT.x, STACK_SPOT.y)).toBe("pustka");
  });
  test("Omelko's bench is inside the khata and he can be reached from the room", () => {
    expect(houseAt(OMELKO_HOME.x, OMELKO_HOME.y)).toBe("pustka");
    const r = HOUSE_RECTS.pustka;
    const door = { x: r.x + r.w / 2, y: r.y + r.h - 24 };
    expect(Math.hypot(door.x - OMELKO_HOME.x, door.y - OMELKO_HOME.y)).toBeLessThan(150);
    expect(houseSolids("pustka").length).toBeGreaterThan(0);
  });
});
