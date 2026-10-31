import { describe, expect, test } from "bun:test";
import { t } from "../i18n";
import { questLog, type QuestView } from "./quests";

const view = (over: Partial<QuestView> = {}): QuestView => ({
  area: "village", talked: [], herbs: 0, flags: new Set(), soulPrice: 3, night: false, evening: false, ...over,
});
const everyone = ["myroslav", "vesna", "radek", "domovyk", "lisovyk", "chort", "bolotianyk"];

describe("quest log", () => {
  test("a new game starts by meeting the villagers", () => {
    const q = questLog(view());
    expect(q.activeId).toBe("meet");
    expect(q.objective).toBe(t("quest.meet.1", { metVillagers: 0 }));
    expect(q.sections.map((s) => s.id)).toEqual(["story", "life", "lysa"]);
  });

  test("Viy's night opens after looking upon him, and starts with the old way", () => {
    const q = questLog(view({ talked: [...everyone, "viy"], herbs: 5, flags: new Set(["visitedLysa", "played=1"]) }));
    expect(q.activeId).toBe("oldway");
    expect(q.sections.find((s) => s.id === "viy")?.quests.map((x) => x.id)).toEqual(["oldway"]);
  });

  test("with the chalk in hand, night points the keeper to the vigil", () => {
    const flags = new Set(["visitedLysa", "chalk", "played=1"]);
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
    expect(questLog(view({ area: "hut1" })).objective).toBe(t("quest.objective.1"));
  });
});

describe("Did Prokip in the quest log", () => {
  test("hidden until Vesna mentions him, then a side thread that never jumps the story", () => {
    expect(questLog(view()).sections.flatMap((s) => s.quests.map((q) => q.id))).not.toContain("prokip");
    const q = questLog(view({ talked: ["vesna"] }));
    expect(q.sections.find((s) => s.id === "life")?.quests.map((x) => x.id)).toContain("prokip");
    expect(q.activeId).toBe("meet");
  });
  test("its line follows the errand", () => {
    const life = (flags: string[]) => questLog(view({ talked: ["vesna", "prokip"], flags: new Set(flags) })).sections.find((s) => s.id === "life")?.quests.find((x) => x.id === "prokip");
    expect(life(["resheto"])?.detail).toBe(t("quest.prokip.sieve"));
    expect(life(["resheto", "reshetoTried", "reshetoDone", "prokipMessage"])?.detail).toBe(t("quest.prokip.message"));
    expect(life(["zviryna"])?.done).toBe(true);
  });
});
