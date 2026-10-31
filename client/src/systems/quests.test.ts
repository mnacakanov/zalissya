import { describe, expect, test } from "bun:test";
import { t } from "../i18n";
import { questLog, type QuestView } from "./quests";

const view = (over: Partial<QuestView> = {}): QuestView => ({
  area: "village", talked: [], herbs: 0, flags: new Set(), soulPrice: 3, night: false, evening: false, ...over,
});
const everyone = ["myroslav", "vesna", "radek", "domovyk", "lisovyk", "chort", "bolotianyk"];

describe("quest log", () => {
  test("a new game writes nothing down: the khutir tells you the rest", () => {
    const q = questLog(view());
    expect(q.activeId).toBeNull();
    expect(q.objective).toBe(t("quest.objective.3"));
    expect(q.sections.map((s) => s.id)).toEqual([]);
  });

  test("the otaman tells of Viy: then the story has its objective", () => {
    const q = questLog(view({ talked: ["myroslav"] }));
    expect(q.activeId).toBe("viy");
    expect(q.objective).toBe(t("quest.viy.1"));
  });

  test("secret quests appear only once done, as found", () => {
    const ids = (flags: string[], talked: string[] = []) =>
      questLog(view({ talked, flags: new Set(flags) })).sections.flatMap((s) => s.quests.map((x) => x.id));
    expect(ids([])).not.toContain("domovyk");
    expect(ids(["stone"])).toContain("domovyk");
    expect(ids([], ["myroslav", "vesna"])).not.toContain("meet");
    const met = questLog(view({ talked: ["myroslav", "vesna", "radek"], flags: new Set(["fishTotal=1"]) }));
    expect(met.found.map((x) => x.id).sort()).toEqual(["fishing", "meet"]);
    // a secret is never the objective
    expect(questLog(view({ talked: ["vesna"] })).activeId).not.toBe("meet");
  });

  test("Viy's night opens after looking upon him, and starts with the old way", () => {
    const q = questLog(view({ talked: [...everyone, "viy"], herbs: 5, flags: new Set(["visitedLysa", "played=1"]) }));
    expect(q.activeId).toBe("oldway");
    expect(q.sections.find((s) => s.id === "viy")?.quests.map((x) => x.id)).toEqual(["oldway"]);
  });

  test("with the chalk in hand, the vigil is the objective, and a sold soul comes first", () => {
    const flags = new Set(["visitedLysa", "chalk", "played=1"]);
    const base = { talked: [...everyone, "viy"], herbs: 5, flags };
    expect(questLog(view(base)).activeId).toBe("vigil");
    expect(questLog(view({ ...base, night: true })).activeId).toBe("vigil");
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
    const q = questLog(view({ talked: ["vesna", "myroslav"] }));
    expect(q.sections.find((s) => s.id === "life")?.quests.map((x) => x.id)).toContain("prokip");
    expect(q.activeId).toBe("viy");
  });
  test("its line follows the errand", () => {
    const life = (flags: string[]) => questLog(view({ talked: ["vesna", "prokip"], flags: new Set(flags) })).sections.find((s) => s.id === "life")?.quests.find((x) => x.id === "prokip");
    expect(life(["resheto"])?.detail).toBe(t("quest.prokip.sieve"));
    expect(life(["resheto", "reshetoTried", "reshetoDone", "prokipMessage"])?.detail).toBe(t("quest.prokip.message"));
    expect(life(["zviryna"])?.done).toBe(true);
  });
});
