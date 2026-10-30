import { describe, expect, test } from "bun:test";
import { questLog, type QuestView } from "./quests";

const view = (over: Partial<QuestView> = {}): QuestView => ({
  area: "village", talked: [], herbs: 0, flags: new Set(), soulPrice: 3, night: false, ...over,
});
const everyone = ["myroslav", "vesna", "radek", "domovyk", "lisovyk", "chort", "bolotianyk"];

describe("quest log", () => {
  test("a new game starts by meeting the villagers", () => {
    const q = questLog(view());
    expect(q.activeId).toBe("meet");
    expect(q.objective).toBe("Meet the villagers · 0/3");
    expect(q.sections.map((s) => s.id)).toEqual(["story", "life", "lysa"]);
  });

  test("Viy's night opens after looking upon him, and starts with the old way", () => {
    const q = questLog(view({ talked: [...everyone, "viy"], herbs: 5, flags: new Set(["visitedLysa"]) }));
    expect(q.activeId).toBe("oldway");
    expect(q.sections.find((s) => s.id === "viy")?.quests.map((x) => x.id)).toEqual(["oldway"]);
  });

  test("with the chalk in hand, night points the keeper to the vigil", () => {
    const flags = new Set(["visitedLysa", "chalk"]);
    const base = { talked: [...everyone, "viy"], herbs: 5, flags };
    expect(questLog(view(base)).activeId).toBe("domovyk");
    expect(questLog(view({ ...base, night: true })).activeId).toBe("vigil");
    // …but never from inside a hut, and never over a sold soul
    expect(questLog(view({ ...base, night: true, area: "hut0" })).activeId).toBe("domovyk");
    const sold = new Set([...flags, "soulsold"]);
    expect(questLog(view({ ...base, flags: sold, night: true })).activeId).toBe("soul");
  });

  test("the sabbath wins while standing on Lysa Hora", () => {
    expect(questLog(view({ area: "lysa" })).activeId).toBe("lysa-sabbath");
  });

  test("hut interiors name the door", () => {
    expect(questLog(view({ area: "hut1" })).objective).toContain("Vesna's hut");
  });
});
