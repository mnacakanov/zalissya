import { flagCount, flagHas } from "./flags";

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
};

export type SectionId = "story" | "viy" | "life" | "lysa";
export const SECTION_TITLES: Record<SectionId, string> = {
  story: "Story",
  viy: "Viy's night",
  life: "Village life",
  lysa: "Lysa Hora",
};

type Derived = ReturnType<typeof derive>;

type QuestDef = {
  id: string;
  section: SectionId;
  title: string;
  visible?: (d: Derived) => boolean;
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
    id: "meet", section: "story", title: "Meet the villagers",
    done: (d) => d.metVillagers >= 3,
    detail: (d) => `Talk to Myroslav, Vesna and Radek · ${d.metVillagers}/3`,
    objective: (d) => `Meet the villagers · ${d.metVillagers}/3`,
  },
  {
    id: "herbs", section: "story", title: "Herbs for Vesna",
    done: (d) => d.v.herbs >= 5,
    detail: (d) => `Gather herbs in the clearing · ${Math.min(d.v.herbs, 5)}/5`,
    objective: (d) => `Gather herbs for Vesna · ${Math.min(d.v.herbs, 5)}/5`,
  },
  {
    id: "spirits", section: "story", title: "Seek the spirits",
    done: (d) => d.metSpirits >= 2,
    detail: (d) => `Find the Domovyk and the Lisovyk · ${d.metSpirits}/2`,
    objective: (d) => `Seek the spirits · Domovyk & Lisovyk ${d.metSpirits}/2`,
  },
  {
    id: "dark", section: "story", title: "Stranger things stir",
    done: (d) => d.metDark >= 2,
    detail: (d) => `Meet the Chort and the Bolotianyk · ${d.metDark}/2`,
    objective: (d) => `Stranger things stir · Chort & Bolotianyk ${d.metDark}/2`,
  },
  {
    id: "viy", section: "story", title: "Look upon Viy",
    done: (d) => d.metViy,
    detail: () => "Approach Viy in the north-east hollow — look, but do not wake him",
    objective: () => "Viy sleeps in the north-east hollow — go and see him",
  },

  // --- Viy's night
  {
    id: "oldway", section: "viy", title: "The old way",
    visible: (d) => d.metViy,
    done: (d) => d.chalk,
    detail: (d) => (d.chalk ? "Myroslav gave you the blessed chalk, and the old way with it" : "Ask Myroslav how Zalissya once kept Viy asleep"),
    objective: () => "Viy stirs in his sleep — ask Myroslav about the old way",
  },
  {
    id: "wreath", section: "viy", title: "Vesna's wreath",
    visible: (d) => d.chalk,
    done: (d) => flagHas(d.f, "wreath"),
    detail: (d) => (flagHas(d.f, "wreath") ? "A wreath of polyn and zvirobiy — Viy's gaze takes half" : "Optional · Vesna can weave a wreath against his eyes: 3 herbs, and WIS 2"),
    objective: () => "Ask Vesna for a wreath against Viy's eyes · 3 herbs",
  },
  {
    id: "ironward", section: "viy", title: "Radek's iron ward",
    visible: (d) => d.chalk,
    done: (d) => flagHas(d.f, "ironward"),
    detail: (d) => (flagHas(d.f, "ironward") ? "Iron nails for the chalk — the first three spirits burn" : "Optional · bring Radek one forged piece from his anvil"),
    objective: () => "Bring Radek a forged piece for an iron ward",
  },
  {
    id: "vigil", section: "viy", title: "The vigil",
    visible: (d) => d.chalk,
    done: (d) => d.sealed,
    detail: (d) =>
      d.sealed
        ? "You held the circle until cockcrow. Viy sleeps under the hollow, for good"
        : `At night (21:00–04:00) draw the chalk circle at Viy's hollow and hold until the rooster crows${d.vigilsBroken ? ` · tried ${d.vigilsBroken}×` : ""}`,
    objective: (d) =>
      d.v.night
        ? "Night has fallen — draw the chalk circle at Viy's hollow"
        : "When night falls (21:00), keep Viy's vigil — or sleep till dusk in the Domovyk's bed",
  },

  // --- Village life
  {
    id: "domovyk", section: "life", title: "Bread for the Domovyk",
    done: (d) => flagHas(d.f, "stone"),
    detail: (d) =>
      flagHas(d.f, "stone")
        ? "Bread left, thanks received — his warm stone is yours"
        : flagHas(d.f, "offering")
          ? "The crust is eaten. See what waits by his door"
          : flagHas(d.f, "bread")
            ? "Leave the crust by the pich, inside his hut"
            : "Take the crust by the campfire and leave it by the Domovyk's pich",
    objective: (d) => (flagHas(d.f, "offering") ? "Something glints by the Domovyk's pich — go and see" : "Leave the campfire crust for the Domovyk — step inside his hut, by the pich"),
  },
  {
    id: "forge", section: "life", title: "Light Radek's forge",
    done: (d) => flagHas(d.f, "horseshoe"),
    detail: (d) => (flagHas(d.f, "horseshoe") ? "The forge is lit, and the horseshoe is yours" : d.iron >= 3 ? "Bring the bog iron to Radek at the forge" : `Dig bog iron in the pond mud · ${d.iron}/3`),
    objective: (d) => (d.iron >= 3 ? "Bring the bog iron to Radek at the forge" : `Dig bog iron in the pond mud for Radek · ${d.iron}/3`),
  },
  {
    id: "soul", section: "life", title: "The Chort's bargain",
    visible: (d) => d.soulSold,
    done: (d) => flagHas(d.f, "soulback"),
    detail: (d) => (flagHas(d.f, "soulback") ? "Bought back — soul, shadow and all" : `Catch fish for the Chort to buy your soul back · ${Math.min(d.fish, d.v.soulPrice)}/${d.v.soulPrice}`),
    objective: (d) => `Buy your soul back: catch fish for the Chort · ${Math.min(d.fish, d.v.soulPrice)}/${d.v.soulPrice}`,
  },
  {
    id: "fishing", section: "life", title: "First catch",
    done: (d) => d.fishTotal >= 1,
    detail: (d) => (d.fishTotal > 0 ? `Lifetime catch · ${d.fishTotal} fish` : "Cast from the pond's west shore and wait for the bite"),
    objective: () => "Try fishing from the pond's west shore",
  },
  {
    id: "cooking", section: "life", title: "Cook karas soup",
    done: (d) => d.cooked >= 1,
    detail: () => "At the campfire pot · 1 fish + 1 herb",
    objective: () => "Cook karas soup at the campfire pot · 1 fish + 1 herb",
  },
  {
    id: "smithing", section: "life", title: "Work the forge",
    done: (d) => d.smithed >= 1,
    detail: (d) => (flagHas(d.f, "horseshoe") ? "Work the anvil at Radek's lit forge" : "Needs Radek's forge lit first"),
    objective: () => "Work Radek's forge — stand at the anvil and hammer",
  },
  {
    id: "alchemy", section: "life", title: "Brew a tonic",
    done: (d) => d.brewed >= 1,
    detail: () => "At Vesna's drying rack, by the north-east hut · 2 herbs",
    objective: () => "Brew a tonic at Vesna's drying rack, by the north-east hut · 2 herbs",
  },

  // --- Lysa Hora
  {
    id: "lysa-visit", section: "lysa", title: "Climb to Lysa Hora",
    done: (d) => d.visitedLysa,
    detail: () => "Follow the east trail out of the clearing",
    objective: () => "Lysa Hora stirs — follow the east trail out of the clearing to the Chort's sabbath",
  },
  {
    id: "lysa-sabbath", section: "lysa", title: "The sabbath",
    done: (d) => flagHas(d.f, "moonstone"),
    detail: (d) =>
      flagHas(d.f, "moonstone")
        ? "Beelzebub's blessing received — the Moonstone is yours"
        : flagHas(d.f, "lysaDanced")
          ? "Ask Beelzebub for his blessing"
          : flagHas(d.f, "lysaOffering")
            ? "Join the dance, south of the bonfire"
            : d.lysaFlowers >= 3
              ? "Lay your nichnyky on the offering stone"
              : `Gather nichnyky on the slopes · ${d.lysaFlowers}/3`,
    objective: (d) =>
      flagHas(d.f, "moonstone")
        ? "Blessed by Beelzebub 🌙 — the west trail leads back down to Zalissya"
        : flagHas(d.f, "lysaDanced")
          ? "Ask Beelzebub for his blessing — the great seat, north of the fire"
          : flagHas(d.f, "lysaOffering")
            ? "Join the dance — step into the ring south of the bonfire"
            : d.lysaFlowers >= 3
              ? "Lay your nichnyky on the offering stone, north of the bonfire"
              : `Gather nichnyky on the slopes for the offering · ${d.lysaFlowers}/3`,
  },
];

// The order the HUD walks the threads in. Optional preparations (wreath,
// iron ward) are listed in the log but never become the objective.
const PRIORITY = [
  "meet", "herbs", "spirits", "dark", "lysa-visit", "viy", "soul", "oldway",
  "domovyk", "forge", "fishing", "cooking", "smithing", "alchemy", "vigil", "lysa-sabbath",
];

export function questLog(v: QuestView): QuestLog {
  const d = derive(v);
  const byId = new Map(QUESTS.map((q) => [q.id, q]));
  const shown = (q: QuestDef) => q.visible?.(d) ?? true;
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
      ? "Inside the Domovyk's hut — the pich is its warm heart. The door is south."
      : v.area === "hut1"
        ? "Inside Vesna's hut — mind the cauldron. The door is south."
        : active
          ? active.objective(d)
          : d.sealed
            ? "Zalissya is home now. The fire is warm, and Viy sleeps under the earth"
            : "Zalissya is home now. The fire is warm, and Viy still sleeps";

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
  };
}
