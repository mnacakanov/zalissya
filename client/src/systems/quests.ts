import { flagCount, flagHas } from "./flags";
import { knowsSong } from "./songs";
import { ostapState } from "./chumaky";
import { tobaccoStage } from "./tobacco";
import { logsChopped, pustkaStage, reedsCut, REEDS_NEEDED, WOOD_NEEDED } from "./pustka";
import { prokipStage, type ProkipStage, vesnaCanForgive } from "./vorozhbyt";
import { t, type TextKey } from "../i18n";

// --- Quests ------------------------------------------------------------------
// Every thread the game tracks, as data. Each quest derives its progress
// from the same save state as everything else (people met, herbs, flags
// and counters) — there is no separate quest storage. The HUD objective
// line and the Quests tab both come from here, so they can never
// disagree:
//   · the ACTIVE quest is the first unfinished one in PRIORITY order
//     (on Lysa Hora the sabbath wins while you stand on the mountain;
//     at night, a prepared keeper is pointed at Viy's vigil);
//   · the OBJECTIVE is the active quest's one-line instruction, unless
//     you stand inside a hut, which says where the door is.
//   · SECRET quests (the small things of khutir life: meeting people and
//     spirits, the Domovyk's bread, the first fish, the first kulish…) are
//     not written down until you have done them, the way the Serpent's
//     Cave is never written down at all. People in the khutir tell you of
//     them; the log only remembers what you found ("found", for a toast).
// To add a quest: add a QuestDef below, put its id in PRIORITY, and give
// it a section. Keep details short — they are read on a phone.

export type QuestView = {
  area: "village" | "lysa" | "hut0" | "hut1";
  talked: readonly string[];
  herbs: number;
  flags: ReadonlySet<string>;
  // Chort's current price for a soul, in fish (from stats)
  soulPrice: number;
  // is it night now (21:00 – 04:00)?
  night: boolean;
  // is it evening (18:00 – 23:30), when the khutir gathers at the fire?
  evening: boolean;
};

export type SectionId = "story" | "chumaky" | "viy" | "life" | "lysa";
export const SECTION_TITLES: Record<SectionId, string> = {
  story: t("quest.section.story"),
  chumaky: t("quest.section.chumaky"),
  viy: t("quest.SECTION_TITLES.viy.0"),
  life: t("quest.SECTION_TITLES.life.0"),
  lysa: t("quest.SECTION_TITLES.lysa.0"),
};

type Derived = ReturnType<typeof derive>;

const omelkoHomeText = (d: Derived): string => {
  const stage = pustkaStage(d.f);
  if (stage === "work") return t("quest.omelkoHome.work", { logs: logsChopped(d.f), wood: WOOD_NEEDED, reeds: reedsCut(d.f), reedsNeed: REEDS_NEEDED });
  return t(`quest.omelkoHome.${stage === "locked" || stage === "ask" ? "permission" : stage}` as TextKey);
};

const prokipOf = (d: Derived): ProkipStage =>
  prokipStage({ flags: d.f, met: d.v.talked.includes("prokip"), heard: d.v.talked.includes("vesna") });
const PROKIP_TEXT: Record<ProkipStage, TextKey> = {
  unheard: "quest.prokip.find", find: "quest.prokip.find",
  offerSieve: "quest.prokip.talk", sieve: "quest.prokip.sieve", sieveBack: "quest.prokip.sieveBack",
  offerMessage: "quest.prokip.talk", message: "quest.prokip.message", answer: "quest.prokip.answer",
  offerPerelesnyk: "quest.prokip.talk", perelesnyk: "quest.prokip.perelesnyk", reward: "quest.prokip.reward",
  done: "quest.prokip.done",
};

type QuestDef = {
  id: string;
  section: SectionId;
  title: string;
  visible?: (d: Derived) => boolean;
  // not in the log, nor ever the objective, until done (see above)
  secret?: true;
  done: (d: Derived) => boolean;
  detail: (d: Derived) => string;
  objective: (d: Derived) => string;
};

export type QuestItem = { id: string; title: string; detail: string; done: boolean; active: boolean };
export type QuestLog = {
  sections: Array<{ id: SectionId; title: string; quests: QuestItem[] }>;
  activeId: string | null;
  objective: string;
  done: number;
  total: number;
  // the secret quests already found, for the "found" toast
  found: Array<{ id: string; title: string }>;
};

const VILLAGERS = ["myroslav", "vesna", "radek"];

function derive(v: QuestView) {
  const f = v.flags;
  const fish = flagCount(f, "fish");
  return {
    v,
    f,
    fish,
    fishTotal: Math.max(flagCount(f, "fishTotal"), fish),
    cooked: flagCount(f, "cooked"),
    smithed: flagCount(f, "smithed"),
    brewed: flagCount(f, "brewed"),
    iron: flagCount(f, "iron"),
    lysaFlowers: flagCount(f, "lysaFlower"),
    metVillagers: v.talked.filter((id) => VILLAGERS.includes(id)).length,
    metSpirits: v.talked.filter((id) => id === "domovyk" || id === "lisovyk").length,
    metDark: v.talked.filter((id) => id === "chort" || id === "bolotianyk").length,
    metViy: v.talked.includes("viy"),
    soulSold: flagHas(f, "soulsold"),
    soulLost: flagHas(f, "soulsold") && !flagHas(f, "soulback"),
    visitedLysa: v.area === "lysa" || flagHas(f, "visitedLysa"),
    chalk: flagHas(f, "chalk"),
    sealed: flagHas(f, "viySealed"),
    vigilsBroken: flagCount(f, "vigilBroken"),
  };
}

const QUESTS: QuestDef[] = [
  // --- Story
  {
    id: "meet", section: "story", title: t("quest.meet.title.0"),
    secret: true,
    done: (d) => d.metVillagers >= 3,
    detail: (d) => t("quest.meet.0", { metVillagers: d.metVillagers }),
    objective: (d) => t("quest.meet.1", { metVillagers: d.metVillagers }),
  },
  {
    id: "chumaky", section: "chumaky", title: t("quest.chumaky.title"),
    visible: (d) => flagCount(d.f, "chumakyArrivedDay") > 0,
    done: (d) => ostapState(d.f) !== "sick",
    detail: (d) => {
      const st = ostapState(d.f);
      if (st === "sick") return t("quest.chumaky.sick");
      if (st === "dead") return t("quest.chumaky.died");
      return flagHas(d.f, "defiedOtaman") ? t("quest.chumaky.defied") : t("quest.chumaky.relented");
    },
    objective: () => t("quest.chumaky.objective"),
  },
  {
    id: "tobacco", section: "life", title: t("quest.tobacco.title"),
    visible: (d) => tobaccoStage(d.f) !== "none",
    done: (d) => tobaccoStage(d.f) === "done",
    detail: (d) => t(`quest.tobacco.${tobaccoStage(d.f)}` as TextKey, { leaves: Math.min(3, flagCount(d.f, "tobaccoLeaves")) }),
    objective: (d) => t(`quest.tobacco.${tobaccoStage(d.f)}` as TextKey, { leaves: Math.min(3, flagCount(d.f, "tobaccoLeaves")) }),
  },
  {
    // Did Prokip, the vorozhbyt (systems/vorozhbyt.ts): heard of from Vesna
    id: "prokip", section: "life", title: t("quest.prokip.title"),
    visible: (d) => prokipOf(d) !== "unheard",
    done: (d) => prokipOf(d) === "done",
    detail: (d) => t(PROKIP_TEXT[prokipOf(d)]),
    objective: (d) => t(PROKIP_TEXT[prokipOf(d)]),
  },
  {
    // "A roof for Omelko" (systems/pustka.ts): opens once Stepan's shape has stopped coming
    id: "omelko-home", section: "life", title: t("quest.omelkoHome.title"),
    visible: (d) => ["permission", "work", "ready", "done"].includes(pustkaStage(d.f)),
    done: (d) => pustkaStage(d.f) === "done",
    detail: (d) => omelkoHomeText(d),
    objective: (d) => omelkoHomeText(d),
  },
  {
    // Vesna, cross after the question about the rain (systems/vorozhbyt.ts)
    id: "vesna-sorry", section: "life", title: t("quest.vesnaSorry.title"),
    visible: (d) => flagHas(d.f, "vesnaTold"),
    done: (d) => flagHas(d.f, "vesnaForgiven"),
    detail: (d) => t(flagHas(d.f, "vesnaForgiven") ? "quest.vesnaSorry.done" : vesnaCanForgive(d.f) ? "quest.vesnaSorry.sorry" : "quest.vesnaSorry.why"),
    objective: (d) => t(vesnaCanForgive(d.f) ? "quest.vesnaSorry.sorry" : "quest.vesnaSorry.why"),
  },
  {
    id: "evening", section: "story", title: t("quest.evening.title"),
    secret: true,
    done: (d) => flagCount(d.f, "played") >= 1,
    detail: (d) => (flagCount(d.f, "played") >= 1 ? t("quest.evening.done", { played: flagCount(d.f, "played") }) : t("quest.evening.detail")),
    objective: (d) => (d.v.evening ? t("quest.evening.now") : t("quest.evening.wait")),
  },
  {
    id: "herbs", section: "story", title: t("quest.herbs.title.0"),
    secret: true,
    done: (d) => d.v.herbs >= 5,
    detail: (d) => t("quest.herbs.0", { min: Math.min(d.v.herbs, 5) }),
    objective: (d) => t("quest.herbs.1", { min: Math.min(d.v.herbs, 5) }),
  },
  {
    id: "spirits", section: "story", title: t("quest.spirits.title.0"),
    secret: true,
    done: (d) => d.metSpirits >= 2,
    detail: (d) => t("quest.spirits.0", { metSpirits: d.metSpirits }),
    objective: (d) => t("quest.spirits.1", { metSpirits: d.metSpirits }),
  },
  {
    id: "dark", section: "story", title: t("quest.dark.title.0"),
    secret: true,
    done: (d) => d.metDark >= 2,
    detail: (d) => t("quest.dark.0", { metDark: d.metDark }),
    objective: (d) => t("quest.dark.1", { metDark: d.metDark }),
  },
  {
    id: "viy", section: "story", title: t("quest.viy.title.0"),
    // the otaman tells you of Viy when you first sit with him
    visible: (d) => d.v.talked.includes("myroslav") || d.metViy,
    done: (d) => d.metViy,
    detail: () => t("quest.viy.0"),
    objective: () => t("quest.viy.1"),
  },

  // --- Viy's night
  {
    id: "oldway", section: "viy", title: t("quest.oldway.title.0"),
    visible: (d) => d.metViy,
    done: (d) => d.chalk,
    detail: (d) => (d.chalk ? t("quest.oldway.0") : t("quest.oldway.1")),
    objective: () => t("quest.oldway.2"),
  },
  {
    id: "wreath", section: "viy", title: t("quest.wreath.title.0"),
    visible: (d) => d.chalk,
    done: (d) => flagHas(d.f, "wreath"),
    detail: (d) => (flagHas(d.f, "wreath") ? t("quest.wreath.0") : t("quest.wreath.1")),
    objective: () => t("quest.wreath.2"),
  },
  {
    id: "ironward", section: "viy", title: t("quest.ironward.title.0"),
    visible: (d) => d.chalk,
    done: (d) => flagHas(d.f, "ironward"),
    detail: (d) => (flagHas(d.f, "ironward") ? t("quest.ironward.0") : t("quest.ironward.1")),
    objective: () => t("quest.ironward.2"),
  },
  {
    id: "vigil", section: "viy", title: t("quest.vigil.title.0"),
    visible: (d) => d.chalk,
    done: (d) => d.sealed,
    detail: (d) =>
      d.sealed
        ? t("quest.vigil.0")
        : t("quest.vigil.1") + (d.vigilsBroken ? t("quest.vigil.2", { vigilsBroken: d.vigilsBroken }) : ""),
    objective: (d) =>
      d.v.night
        ? t("quest.vigil.3")
        : t("quest.vigil.4"),
  },

  // --- Village life
  {
    id: "domovyk", section: "life", title: t("quest.domovyk.title.0"),
    secret: true,
    done: (d) => flagHas(d.f, "stone"),
    detail: (d) =>
      flagHas(d.f, "stone")
        ? t("quest.domovyk.0")
        : flagHas(d.f, "offering")
          ? t("quest.domovyk.1")
          : flagHas(d.f, "bread")
            ? t("quest.domovyk.2")
            : t("quest.domovyk.3"),
    objective: (d) => (flagHas(d.f, "offering") ? t("quest.domovyk.4") : t("quest.domovyk.5")),
  },
  {
    id: "forge", section: "life", title: t("quest.forge.title.0"),
    secret: true,
    done: (d) => flagHas(d.f, "horseshoe"),
    detail: (d) => (flagHas(d.f, "horseshoe") ? t("quest.forge.0") : d.iron >= 3 ? t("quest.forge.1") : t("quest.forge.2", { iron: d.iron })),
    objective: (d) => (d.iron >= 3 ? t("quest.forge.3") : t("quest.forge.4", { iron: d.iron })),
  },
  {
    id: "soul", section: "life", title: t("quest.soul.title.0"),
    visible: (d) => d.soulSold,
    done: (d) => flagHas(d.f, "soulback"),
    detail: (d) => (flagHas(d.f, "soulback") ? t("quest.soul.0") : t("quest.soul.1", { min: Math.min(d.fish, d.v.soulPrice), soulPrice: d.v.soulPrice })),
    objective: (d) => t("quest.soul.2", { min: Math.min(d.fish, d.v.soulPrice), soulPrice: d.v.soulPrice }),
  },
  {
    id: "fishing", section: "life", title: t("quest.fishing.title.0"),
    secret: true,
    done: (d) => d.fishTotal >= 1,
    detail: (d) => (d.fishTotal > 0 ? t("quest.fishing.0", { fishTotal: d.fishTotal }) : t("quest.fishing.1")),
    objective: () => t("quest.fishing.2"),
  },
  {
    id: "cooking", section: "life", title: t("quest.cooking.title.0"),
    secret: true,
    done: (d) => d.cooked >= 1,
    detail: () => t("quest.cooking.0"),
    objective: () => t("quest.cooking.1"),
  },
  {
    id: "smithing", section: "life", title: t("quest.smithing.title.0"),
    secret: true,
    done: (d) => d.smithed >= 1,
    detail: (d) => (flagHas(d.f, "horseshoe") ? t("quest.smithing.0") : t("quest.smithing.1")),
    objective: () => t("quest.smithing.2"),
  },
  {
    id: "alchemy", section: "life", title: t("quest.alchemy.title.0"),
    secret: true,
    done: (d) => d.brewed >= 1,
    detail: () => t("quest.alchemy.0"),
    objective: () => t("quest.alchemy.1"),
  },

  // --- Lysa Hora
  {
    id: "lysa-visit", section: "lysa", title: t("quest.lysa-visit.title.0"),
    secret: true,
    done: (d) => d.visitedLysa,
    detail: () => t("quest.lysa-visit.0"),
    objective: () => t("quest.lysa-visit.1"),
  },
  {
    id: "lysa-sabbath", section: "lysa", title: t("quest.lysa-sabbath.title.0"),
    // written down once you have climbed the mountain and seen it
    visible: (d) => d.visitedLysa,
    done: (d) => flagHas(d.f, "moonstone"),
    detail: (d) =>
      flagHas(d.f, "moonstone")
        ? t("quest.lysa-sabbath.0")
        : flagHas(d.f, "lysaDanced")
          ? t("quest.lysa-sabbath.1")
          : flagHas(d.f, "lysaOffering")
            ? knowsSong(d.f, "hopak") ? t("quest.lysa-sabbath.2") : t("quest.lysa-sabbath.hopak")
            : d.lysaFlowers >= 3
              ? t("quest.lysa-sabbath.3")
              : t("quest.lysa-sabbath.4", { lysaFlowers: d.lysaFlowers }),
    objective: (d) =>
      flagHas(d.f, "moonstone")
        ? t("quest.lysa-sabbath.5")
        : flagHas(d.f, "lysaDanced")
          ? t("quest.lysa-sabbath.6")
          : flagHas(d.f, "lysaOffering")
            ? knowsSong(d.f, "hopak") ? t("quest.lysa-sabbath.7") : t("quest.lysa-sabbath.hopak")
            : d.lysaFlowers >= 3
              ? t("quest.lysa-sabbath.8")
              : t("quest.lysa-sabbath.9", { lysaFlowers: d.lysaFlowers }),
  },
];

// The order the HUD walks the threads in. Optional preparations (wreath,
// iron ward) are listed in the log but never become the objective.
// (Secret quests are listed too, but never become the objective.)
const PRIORITY = [
  "chumaky", "meet", "herbs", "evening", "spirits", "dark", "lysa-visit", "viy", "soul", "oldway", "vigil", "tobacco",
  "domovyk", "forge", "fishing", "cooking", "smithing", "alchemy", "prokip", "omelko-home", "vesna-sorry", "lysa-sabbath",
];

export function questLog(v: QuestView): QuestLog {
  const d = derive(v);
  const byId = new Map(QUESTS.map((q) => [q.id, q]));
  const shown = (q: QuestDef) => (q.visible?.(d) ?? true) && (!q.secret || q.done(d));
  const open = (id: string) => {
    const q = byId.get(id);
    return q != null && shown(q) && !q.done(d);
  };

  let activeId: string | null = null;
  if (v.area === "lysa" && open("lysa-sabbath")) activeId = "lysa-sabbath";
  else if (v.night && v.area === "village" && open("vigil") && !open("soul")) activeId = "vigil";
  else activeId = PRIORITY.find(open) ?? null;

  const active = activeId ? byId.get(activeId) : undefined;
  const objective =
    v.area === "hut0"
      ? t("quest.objective.0")
      : v.area === "hut1"
        ? t("quest.objective.1")
        : active
          ? active.objective(d)
          : d.sealed
            ? t("quest.objective.2")
            : t("quest.objective.3");

  const visible = QUESTS.filter(shown);
  const sections = (Object.keys(SECTION_TITLES) as SectionId[])
    .map((id) => ({
      id,
      title: SECTION_TITLES[id],
      quests: visible
        .filter((q) => q.section === id)
        .map((q) => ({ id: q.id, title: q.title, detail: q.detail(d), done: q.done(d), active: q.id === activeId })),
    }))
    .filter((s) => s.quests.length > 0);

  return {
    sections,
    activeId,
    objective,
    done: visible.filter((q) => q.done(d)).length,
    total: visible.length,
    found: visible.filter((q) => q.secret).map((q) => ({ id: q.id, title: q.title })),
  };
}
