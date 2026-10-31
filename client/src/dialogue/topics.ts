import { type Npc } from "../data/characters";
import { type SongId } from "../systems/songs";
import { BREW_SPOT } from "../data/items";
import { linesFor, linesForLysa } from "./lines";
import { flagCount, flagHas } from "../systems/flags";
import { t } from "../i18n";

// --- Branching dialogue: topics ---------------------------------------------
// Conversations are topic-driven now, not linear scripts. Talking to
// someone opens with a short greeting — the full introduction the first
// time, a brief welcome after — then a menu of questions the PLAYER
// picks, in any order, re-askable, until they tap Farewell. Asked
// topics stay in the menu, marked ✓. Answers run 1–3 lines and are
// built from the world state at the moment of asking (herbs, flags,
// fish, the soul price, INT), because they are dealt out of the very
// same linesFor / linesForLysa scripts — those state branches ARE the
// answers, sorted by subject instead of recited in a fixed order.
// Scripted beats stay scripted: Viy is narration, not conversation;
// the Chort's bargain is a topic whose answer ends in the Sign / Keep
// my soul choice; Beelzebub's blessing is a topic that hands over to
// the blessing script. Asking costs nothing and changes nothing by
// itself — CHA still grows by MEETING people, once each, as before.

// What asking a topic can hand over (App.applyGrant): Viy's night items,
// the chumak choices, or a song (any SongId).
export type GrantId = "chalk" | "wreath" | "ironward" | "persuade" | "treatOstap" | "vesnaTonic" | "tobaccoQuest" | "giveTobacco" | "chumakMap" | "buyMap" | "supper" | "sellHorseshoes" | SongId;

export type DialogueTopic = {
  id: string;
  label: string;
  question: string;
  lines: string[];
  action?: "bargain" | "blessing";
  // Asking hands this item over (Viy's night preparations — see viyNight.ts).
  grant?: GrantId;
};

export type TopicSet = { intro: string[]; topics: DialogueTopic[] };

export function pickLines(lines: string[], ...idx: number[]): string[] {
  return idx
    .map((i) => lines[i])
    .filter((s): s is string => typeof s === "string" && s.length > 0);
}

export function topicsForVillage(
  npc: Npc,
  herbs: number,
  flags: ReadonlySet<string>,
  fish: number,
  price: number,
  intTotal: number,
  firstMeeting: boolean,
): TopicSet | null {
  const L = linesFor(npc, herbs, flags, fish, price, intTotal);
  switch (npc.id) {
    case "myroslav":
      return {
        intro: firstMeeting
          ? pickLines(L, 0)
          : [t("topic.myroslav.0")],
        topics: [
          { id: "forest", label: t("topic.myroslav.forest.label.0"), question: t("topic.myroslav.forest.question.0"), lines: pickLines(L, 1) },
          { id: "domovyk", label: t("topic.myroslav.domovyk.label.0"), question: t("topic.myroslav.domovyk.question.0"), lines: pickLines(L, 2, 3) },
          { id: "viy", label: t("topic.myroslav.viy.label.0"), question: t("topic.myroslav.viy.question.0"), lines: pickLines(L, 4) },
          { id: "radek", label: t("topic.myroslav.radek.label.0"), question: t("topic.myroslav.radek.question.0"), lines: pickLines(L, 5) },
          { id: "dark", label: t("topic.myroslav.dark.label.0"), question: t("topic.myroslav.dark.question.0"), lines: pickLines(L, 6) },
          { id: "lysa", label: t("topic.myroslav.lysa.label.0"), question: t("topic.myroslav.lysa.question.0"), lines: pickLines(L, 7) },
          { id: "growth", label: t("topic.myroslav.growth.label.0"), question: t("topic.myroslav.growth.question.0"), lines: pickLines(L, 8) },
        ],
      };
    case "vesna": {
      const strongLine =
        intTotal >= 3
          ? t("topic.vesna.0")
          : t("topic.vesna.1", { intTotal });
      return {
        intro: firstMeeting
          ? pickLines(L, 0)
          : [herbs >= 5
              ? t("topic.vesna.2")
              : t("topic.vesna.3")],
        topics: [
          { id: "herbs", label: t("topic.vesna.herbs.label.0"), question: t("topic.vesna.herbs.question.0"), lines: pickLines(L, 1) },
          {
            id: "zvirobiy", label: t("topic.vesna.zvirobiy.label.0"), question: t("topic.vesna.zvirobiy.question.0"),
            lines: herbs >= 5
              ? [t("topic.vesna.zvirobiy.0")]
              : pickLines(L, 2),
          },
          {
            id: "cooking", label: t("topic.vesna.cooking.label.0"), question: t("topic.vesna.cooking.question.0"),
            lines: herbs >= 5
              ? pickLines(L, 2)
              : [t("topic.vesna.cooking.0")],
          },
          {
            id: "alchemy", label: t("topic.vesna.alchemy.label.0"), question: t("topic.vesna.alchemy.question.0"),
            lines: herbs >= 5
              ? pickLines(L, 2, 3)
              : [t("topic.vesna.alchemy.0"), strongLine],
          },
          {
            id: "pond", label: t("topic.vesna.pond.label.0"), question: t("topic.vesna.pond.question.0"),
            lines: herbs >= 5
              ? pickLines(L, 4)
              : [t("topic.vesna.pond.0")],
          },
          {
            id: "errand", label: t("topic.vesna.errand.label.0"), question: t("topic.vesna.errand.question.0"),
            lines: herbs >= 5
              ? [t("topic.vesna.errand.0")]
              : pickLines(L, 3),
          },
        ],
      };
    }
    case "radek": {
      const home =
        t("topic.radek.0");
      const lit = flagHas(flags, "horseshoe");
      return {
        intro: firstMeeting
          ? pickLines(L, 0)
          : [lit ? t("topic.radek.1") : t("topic.radek.2")],
        topics: lit
          ? [
              { id: "forge", label: t("topic.radek.forge.label.0"), question: t("topic.radek.forge.question.0"), lines: pickLines(L, 0) },
              { id: "horseshoe", label: t("topic.radek.horseshoe.label.0"), question: t("topic.radek.horseshoe.question.0"), lines: pickLines(L, 1) },
              { id: "smithing", label: t("topic.radek.smithing.label.0"), question: t("topic.radek.smithing.question.0"), lines: pickLines(L, 2) },
              { id: "home", label: t("topic.radek.home.label.0"), question: t("topic.radek.home.question.0"), lines: [home] },
            ]
          : [
              { id: "home", label: t("topic.radek.home.label.1"), question: t("topic.radek.home.question.1"), lines: pickLines(L, 1) },
              { id: "iron", label: t("topic.radek.iron.label.0"), question: t("topic.radek.iron.question.0"), lines: pickLines(L, 2) },
              { id: "lisovyk", label: t("topic.radek.lisovyk.label.0"), question: t("topic.radek.lisovyk.question.0"), lines: pickLines(L, 3) },
              { id: "viy", label: t("topic.radek.viy.label.0"), question: t("topic.radek.viy.question.0"), lines: pickLines(L, 4) },
            ],
      };
    }
    case "domovyk": {
      const thanked = flagHas(flags, "stone");
      const fed = flagHas(flags, "offering");
      return {
        intro: firstMeeting
          ? pickLines(L, 0)
          : [thanked ? t("topic.domovyk.0") : t("topic.domovyk.1")],
        topics: [
          {
            id: "bread", label: t("topic.domovyk.bread.label.0"), question: t("topic.domovyk.bread.question.0"),
            lines: thanked ? pickLines(L, 0) : fed ? pickLines(L, 0, 1) : pickLines(L, 1, 2),
          },
          {
            id: "hearth", label: thanked ? t("topic.domovyk.hearth.0") : t("topic.domovyk.hearth.1"), question: thanked ? t("topic.domovyk.hearth.2") : t("topic.domovyk.hearth.3"),
            lines: thanked
              ? pickLines(L, 1, 2)
              : fed
                ? [t("topic.domovyk.hearth.4")]
                : pickLines(L, 0),
          },
          {
            id: "lisovyk", label: t("topic.domovyk.lisovyk.label.0"), question: t("topic.domovyk.lisovyk.question.0"),
            lines: thanked || fed
              ? [t("topic.domovyk.lisovyk.0")]
              : pickLines(L, 3),
          },
          {
            id: "viy", label: t("topic.domovyk.viy.label.0"), question: t("topic.domovyk.viy.question.0"),
            lines: thanked || fed
              ? [t("topic.domovyk.viy.0")]
              : pickLines(L, 4),
          },
        ],
      };
    }
    case "lisovyk":
      return {
        intro: firstMeeting
          ? pickLines(L, 0)
          : [t("topic.lisovyk.0")],
        topics: [
          { id: "rules", label: t("topic.lisovyk.rules.label.0"), question: t("topic.lisovyk.rules.question.0"), lines: pickLines(L, 1) },
          { id: "vesna", label: t("topic.lisovyk.vesna.label.0"), question: t("topic.lisovyk.vesna.question.0"), lines: pickLines(L, 2) },
          { id: "viy", label: t("topic.lisovyk.viy.label.0"), question: t("topic.lisovyk.viy.question.0"), lines: pickLines(L, 3) },
          { id: "domovyk", label: t("topic.lisovyk.domovyk.label.0"), question: t("topic.lisovyk.domovyk.question.0"), lines: [t("topic.lisovyk.domovyk.0")] },
          { id: "lost", label: t("topic.lisovyk.lost.label.0"), question: t("topic.lisovyk.lost.question.0"), lines: [t("topic.lisovyk.lost.0")] },
        ],
      };
    case "chort": {
      if (flagHas(flags, "soulback")) {
        return {
          intro: firstMeeting
            ? pickLines(L, 0)
            : [t("topic.chort.0")],
          topics: [
            { id: "settled", label: t("topic.chort.settled.label.0"), question: t("topic.chort.settled.question.0"), lines: pickLines(L, 0, 1) },
            { id: "lysa", label: t("topic.chort.lysa.label.0"), question: t("topic.chort.lysa.question.0"), lines: pickLines(L, 2) },
            { id: "mill", label: t("topic.chort.mill.label.0"), question: t("topic.chort.mill.question.0"), lines: [t("topic.chort.mill.0")] },
          ],
        };
      }
      if (flagHas(flags, "soulsold")) {
        return {
          intro: firstMeeting
            ? pickLines(L, 0)
            : [t("topic.chort.1")],
          topics: [
            { id: "soul", label: t("topic.chort.soul.label.0"), question: t("topic.chort.soul.question.0"), lines: pickLines(L, 2) },
            { id: "gold", label: t("topic.chort.gold.label.0"), question: t("topic.chort.gold.question.0"), lines: pickLines(L, 0) },
            { id: "lysa", label: t("topic.chort.lysa.label.1"), question: t("topic.chort.lysa.question.1"), lines: pickLines(L, 1) },
          ],
        };
      }
      return {
        intro: firstMeeting
          ? pickLines(L, 0)
          : [t("topic.chort.2")],
        topics: [
          { id: "who", label: t("topic.chort.who.label.0"), question: t("topic.chort.who.question.0"), lines: pickLines(L, 0) },
          { id: "mill", label: t("topic.chort.mill.label.1"), question: t("topic.chort.mill.question.1"), lines: pickLines(L, 1) },
          { id: "viy", label: t("topic.chort.viy.label.0"), question: t("topic.chort.viy.question.0"), lines: [t("topic.chort.viy.0")] },
          // The bargain is offered ONCE: a soul kept is a soul kept, and
          // the pen stays away afterwards (the old script suppressed the
          // Sign choice in this state too). In its place, his reaction.
          ...(flagHas(flags, "soulkept")
            ? [{
                id: "refused", label: t("topic.chort.refused.label.0"), question: t("topic.chort.refused.question.0"),
                lines: [t("topic.chort.refused.0")],
              }]
            : [{ id: "bargain", label: t("topic.chort.bargain.label.0"), question: t("topic.chort.bargain.question.0"), lines: pickLines(L, 2), action: "bargain" as const }]),
        ],
      };
    }
    case "bolotianyk":
      return {
        intro: firstMeeting
          ? pickLines(L, 0)
          : [t("topic.bolotianyk.0")],
        topics: [
          { id: "bells", label: t("topic.bolotianyk.bells.label.0"), question: t("topic.bolotianyk.bells.question.0"), lines: pickLines(L, 1) },
          { id: "water", label: t("topic.bolotianyk.water.label.0"), question: t("topic.bolotianyk.water.question.0"), lines: pickLines(L, 2) },
          {
            id: "fishing", label: t("topic.bolotianyk.fishing.label.0"), question: t("topic.bolotianyk.fishing.question.0"),
            lines: fish > 0
              ? pickLines(L, 3)
              : [t("topic.bolotianyk.fishing.0")],
          },
          { id: "old", label: t("topic.bolotianyk.old.label.0"), question: t("topic.bolotianyk.old.question.0"), lines: pickLines(L, fish > 0 ? 4 : 3) },
        ],
      };
    default:
      // Viy (and anyone unforeseen) keeps the scripted narration.
      return null;
  }
}

export function topicsForLysa(npc: Npc, flags: ReadonlySet<string>, firstMeeting: boolean): TopicSet | null {
  const L = linesForLysa(npc, flags);
  const flowers = flagCount(flags, "lysaFlower");
  const offered = flagHas(flags, "lysaOffering");
  const danced = flagHas(flags, "lysaDanced");
  const blessed = flagHas(flags, "moonstone");
  switch (npc.id) {
    case "beelzebub": {
      const viyTopic: DialogueTopic = {
        id: "viy", label: t("topic.beelzebub.viy.label.0"), question: t("topic.beelzebub.viy.question.0"),
        lines: [t("topic.beelzebub.viy.0")],
      };
      const courtTopic: DialogueTopic = {
        id: "court", label: t("topic.beelzebub.court.label.0"), question: t("topic.beelzebub.court.question.0"),
        lines: [t("topic.beelzebub.court.0")],
      };
      if (blessed) {
        return {
          intro: firstMeeting ? pickLines(L, 0) : [t("topic.beelzebub.0")],
          topics: [
            { id: "moonstone", label: t("topic.beelzebub.moonstone.label.0"), question: t("topic.beelzebub.moonstone.question.0"), lines: pickLines(L, 0) },
            { id: "leaving", label: t("topic.beelzebub.leaving.label.0"), question: t("topic.beelzebub.leaving.question.0"), lines: pickLines(L, 1) },
            viyTopic,
            courtTopic,
          ],
        };
      }
      if (danced) {
        return {
          intro: firstMeeting ? pickLines(L, 0) : [t("topic.beelzebub.1")],
          topics: [
            { id: "blessing", label: t("topic.beelzebub.blessing.label.0"), question: t("topic.beelzebub.blessing.question.0"), lines: [], action: "blessing" },
            { id: "rules", label: t("topic.beelzebub.rules.label.0"), question: t("topic.beelzebub.rules.question.0"), lines: [t("topic.beelzebub.rules.0")] },
            viyTopic,
            courtTopic,
          ],
        };
      }
      if (offered) {
        return {
          intro: firstMeeting ? pickLines(L, 0) : [t("topic.beelzebub.2")],
          topics: [
            { id: "dance", label: t("topic.beelzebub.dance.label.0"), question: t("topic.beelzebub.dance.question.0"), lines: pickLines(L, 0, 1) },
            { id: "offering", label: t("topic.beelzebub.offering.label.0"), question: t("topic.beelzebub.offering.question.0"), lines: [t("topic.beelzebub.offering.0")] },
            viyTopic,
            courtTopic,
          ],
        };
      }
      return {
        intro: firstMeeting ? pickLines(L, 0) : [t("topic.beelzebub.3")],
        topics: [
          { id: "rules", label: t("topic.beelzebub.rules.label.1"), question: t("topic.beelzebub.rules.question.1"), lines: pickLines(L, 1, 2) },
          { id: "who", label: t("topic.beelzebub.who.label.0"), question: t("topic.beelzebub.who.question.0"), lines: pickLines(L, 0) },
          viyTopic,
          courtTopic,
        ],
      };
    }
    case "chort": {
      const base = linesForLysa(npc, new Set<string>());
      const rules: DialogueTopic = { id: "rules", label: t("topic.chort.rules.label.0"), question: t("topic.chort.rules.question.0"), lines: pickLines(base, 1) };
      const bigChair: DialogueTopic = {
        id: "beelzebub", label: t("topic.chort.beelzebub.label.0"), question: t("topic.chort.beelzebub.question.0"),
        lines: [t("topic.chort.beelzebub.0")],
      };
      if (blessed) {
        return {
          intro: firstMeeting ? pickLines(L, 0) : [t("topic.chort.3")],
          topics: [
            { id: "blessing", label: t("topic.chort.blessing.label.0"), question: t("topic.chort.blessing.question.0"), lines: pickLines(L, 0) },
            { id: "telling", label: t("topic.chort.telling.label.0"), question: t("topic.chort.telling.question.0"), lines: pickLines(L, 1) },
            rules,
          ],
        };
      }
      if (danced) {
        return {
          intro: firstMeeting ? pickLines(L, 0) : [t("topic.chort.4")],
          topics: [
            { id: "dance", label: t("topic.chort.dance.label.0"), question: t("topic.chort.dance.question.0"), lines: pickLines(L, 0) },
            bigChair,
            rules,
          ],
        };
      }
      if (offered) {
        return {
          intro: firstMeeting ? pickLines(L, 0) : [t("topic.chort.5")],
          topics: [
            { id: "dance", label: t("topic.chort.dance.label.1"), question: t("topic.chort.dance.question.1"), lines: pickLines(L, 0) },
            bigChair,
            rules,
          ],
        };
      }
      if (flowers >= 3) {
        return {
          intro: firstMeeting ? pickLines(L, 0) : [t("topic.chort.6")],
          topics: [
            { id: "offering", label: t("topic.chort.offering.label.0"), question: t("topic.chort.offering.question.0"), lines: pickLines(L, 0) },
            { id: "dance", label: t("topic.chort.dance.label.2"), question: t("topic.chort.dance.question.2"), lines: [t("topic.chort.dance.0")] },
            rules,
          ],
        };
      }
      return {
        intro: firstMeeting ? pickLines(L, 0) : [t("topic.chort.7")],
        topics: [
          { id: "welcome", label: t("topic.chort.welcome.label.0"), question: t("topic.chort.welcome.question.0"), lines: pickLines(L, 0) },
          rules,
          { id: "nosign", label: t("topic.chort.nosign.label.0"), question: t("topic.chort.nosign.question.0"), lines: pickLines(L, 2) },
        ],
      };
    }
    case "solokha": {
      return {
        intro: firstMeeting
          ? pickLines(L, 0)
          : [t("topic.solokha.0")],
        topics: [
          {
            id: "vesna", label: t("topic.solokha.vesna.label.0"), question: t("topic.solokha.vesna.question.0"),
            lines: blessed
              ? pickLines(L, 0)
              : [t("topic.solokha.vesna.0")],
          },
          {
            id: "offering", label: t("topic.solokha.offering.label.0"), question: t("topic.solokha.offering.question.0"),
            lines: blessed || danced
              ? [t("topic.solokha.offering.0")]
              : offered
                ? pickLines(L, 0)
                : flowers >= 3
                  ? pickLines(L, 0)
                  : pickLines(L, 1),
          },
          {
            id: "dance", label: t("topic.solokha.dance.label.0"), question: t("topic.solokha.dance.question.0"),
            lines: blessed
              ? [t("topic.solokha.dance.0")]
              : danced
                ? pickLines(L, 0)
                : offered
                  ? pickLines(L, 0)
                  : pickLines(L, 2),
          },
          { id: "cooking", label: t("topic.solokha.cooking.label.0"), question: t("topic.solokha.cooking.question.0"), lines: [t("topic.solokha.cooking.0")] },
        ],
      };
    }
    case "motrya": {
      const base = linesForLysa(npc, new Set<string>());
      const nichLines = pickLines(base, 1);
      if (flowers > 0 && flowers < 3) {
        nichLines.push(t("topic.motrya.0", { flowers, n: 3 - flowers }));
      }
      return {
        intro: firstMeeting
          ? pickLines(L, 0)
          : [t("topic.motrya.1")],
        topics: [
          { id: "nichnyky", label: t("topic.motrya.nichnyky.label.0"), question: t("topic.motrya.nichnyky.question.0"), lines: nichLines },
          {
            id: "offering", label: t("topic.motrya.offering.label.0"), question: t("topic.motrya.offering.question.0"),
            lines: offered
              ? pickLines(L, 0)
              : [t("topic.motrya.offering.0")],
          },
          {
            id: "dance", label: t("topic.motrya.dance.label.0"), question: t("topic.motrya.dance.question.0"),
            lines: danced || offered
              ? pickLines(L, 0)
              : [t("topic.motrya.dance.0")],
          },
          {
            id: "moonstone", label: t("topic.motrya.moonstone.label.0"), question: t("topic.motrya.moonstone.question.0"),
            lines: blessed
              ? pickLines(L, 0)
              : [t("topic.motrya.moonstone.0")],
          },
        ],
      };
    }
    default:
      return null;
  }
}

export const LYSA_BLESSING_LINES: string[] = [
  t("topic.LYSA_BLESSING_LINES.0"),
  t("topic.LYSA_BLESSING_LINES.1"),
  t("topic.LYSA_BLESSING_LINES.2"),
];

// The Chort's bargain is a real choice, made mid-dialogue at the signature
// line. These are the scripts that play out after each answer.
export const CHORT_SIGNED_LINES: string[] = [
  t("topic.CHORT_SIGNED_LINES.0"),
  t("topic.CHORT_SIGNED_LINES.1"),
];
export const CHORT_REFUSED_LINES: string[] = [
  t("topic.CHORT_REFUSED_LINES.0"),
];
export const CHORT_TRADE_LINES: string[] = [
  t("topic.CHORT_TRADE_LINES.0"),
  t("topic.CHORT_TRADE_LINES.1"),
];

// The well is not a person, but it answers wishes with dialogue anyway.
export const WELL_NPC: Npc = {
  id: "well", name: t("topic.well.name.0"), pron: "", role: t("topic.well.role.0"),
  x: 840, y: 496, tunic: "#5d6b72", hair: "#8d8b85", style: "elder",
};

// Vesna's drying rack is not a person either, but at INT 3+ it has a
// menu: the recipe choice is made through the dialogue choice buttons.
export const BREW_BENCH_NPC: Npc = {
  id: "brewbench", name: t("topic.brewbench.name.0"), pron: "", role: t("topic.brewbench.role.0"),
  x: BREW_SPOT.x, y: BREW_SPOT.y, tunic: "#4c6b35", hair: "#5d3a1a", style: "herbalist",
};

export const BREW_CHOICE_LINES: string[] = [
  t("topic.BREW_CHOICE_LINES.0"),
];