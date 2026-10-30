import { t, type TextKey } from "../i18n";
import { chumakyPresent, ostapState, PERSUADE_CHA } from "../systems/chumaky";
import { flagHas } from "../systems/flags";
import { knowsSong } from "../systems/songs";
import { type DialogueTopic, type TopicSet } from "./topics";

// Conversations around the chumak caravan (systems/chumaky.ts). Gnat and
// Ostap have their own topic sets; the khutir's people get extra topics
// appended to theirs. A topic's `grant` is applied by App's applyGrant the
// moment it is asked — the lines are written for what will then be true.

export type ChumakContext = { flags: ReadonlySet<string>; cha: number; potions: number };

const topic = (id: string, base: string, lines: string[], grant?: DialogueTopic["grant"]): DialogueTopic => ({
  id,
  label: t(`${base}.label` as TextKey),
  question: t(`${base}.question` as TextKey),
  lines,
  ...(grant ? { grant } : {}),
});
const L = (...keys: string[]) => keys.map((k) => t(k as TextKey));

export function chumakTopicSet(npcId: string, c: ChumakContext, firstMeeting: boolean): TopicSet | null {
  const state = ostapState(c.flags);
  if (npcId === "gnat") {
    if (state === "sick") {
      return {
        intro: L(firstMeeting ? "chumak.gnat.intro" : "chumak.gnat.again"),
        topics: [
          topic("ostap", "chumak.gnat.t.ostap", L("chumak.gnat.ostap.0", "chumak.gnat.ostap.1")),
          topic("why", "chumak.gnat.t.why", L("chumak.gnat.why.0", "chumak.gnat.why.1")),
          topic("road", "chumak.gnat.t.road", L("chumak.gnat.road.0", "chumak.gnat.road.1")),
        ],
      };
    }
    if (state === "healed") {
      return {
        intro: L("chumak.gnat.healedIntro"),
        topics: [
          topic("thanks", "chumak.gnat.t.thanks", L("chumak.gnat.thanks.0", "chumak.gnat.thanks.1")),
          ...(flagHas(c.flags, "map") && !flagHas(c.flags, "mapChort") ? [] : [topic("map", "chumak.gnat.t.map", L("chumak.gnat.map.0", "chumak.gnat.map.1"), "chumakMap")]),
          ...(knowsSong(c.flags, "polechko") ? [] : [topic("polechko", "chumak.gnat.t.polechko", L("chumak.gnat.polechko.0", "chumak.gnat.polechko.1"), "polechko")]),
          topic("road", "chumak.gnat.t.road", L("chumak.gnat.road.0", "chumak.gnat.road.1")),
        ],
      };
    }
    return {
      intro: L("chumak.gnat.deadIntro"),
      topics: [
        topic("grief", "chumak.gnat.t.grief", L("chumak.gnat.grief.0", "chumak.gnat.grief.1")),
        ...(knowsSong(c.flags, "polechko") ? [] : [topic("polechko", "chumak.gnat.t.polechkoDead", L("chumak.gnat.polechkoDead.0", "chumak.gnat.polechkoDead.1"), "polechko")]),
        ...(knowsSong(c.flags, "voly") ? [] : [topic("voly", "chumak.gnat.t.voly", L("chumak.gnat.voly.0"), "voly")]),
      ],
    };
  }
  if (npcId === "ostap") {
    if (state === "sick") {
      return {
        intro: L("chumak.ostap.sickIntro"),
        topics: [
          ...(c.potions > 0
            ? [topic("tonic", "chumak.ostap.t.tonic", L("chumak.ostap.tonic.0", "chumak.ostap.tonic.1"), "treatOstap")]
            : [topic("help", "chumak.ostap.t.help", L("chumak.ostap.help.0"))]),
          topic("home", "chumak.ostap.t.home", L("chumak.ostap.home.0")),
        ],
      };
    }
    return {
      intro: L("chumak.ostap.wellIntro"),
      topics: [
        ...(knowsSong(c.flags, "voly") ? [] : [topic("voly", "chumak.ostap.t.voly", L("chumak.ostap.voly.0", "chumak.ostap.voly.1"), "voly")]),
        topic("otaman", "chumak.ostap.t.otaman", L(flagHas(c.flags, "defiedOtaman") ? "chumak.ostap.otaman.defied" : "chumak.ostap.otaman.relented")),
      ],
    };
  }
  return null;
}

// Extra topics for the khutir's people while (and after) the caravan is here.
export function chumakTopicsFor(npcId: string, c: ChumakContext): DialogueTopic[] {
  const arrived = chumakyPresent(c.flags) || flagHas(c.flags, "chumakyGone");
  if (!arrived) return [];
  const state = ostapState(c.flags);
  switch (npcId) {
    case "myroslav":
      if (state === "sick") {
        return c.cha >= PERSUADE_CHA
          ? [topic("chumaky", "chumak.otaman.t.ask", L("chumak.otaman.yes.0", "chumak.otaman.yes.1", "chumak.otaman.yes.2"), "persuade")]
          : [topic("chumaky", "chumak.otaman.t.ask", L("chumak.otaman.no.0", "chumak.otaman.no.1", "chumak.otaman.no.2"))];
      }
      return [topic("chumaky-after", "chumak.otaman.t.after", L(
        state === "dead" ? "chumak.otaman.after.died" : flagHas(c.flags, "defiedOtaman") ? "chumak.otaman.after.defied" : "chumak.otaman.after.relented",
        state === "dead" ? "chumak.otaman.after.died2" : flagHas(c.flags, "defiedOtaman") ? "chumak.otaman.after.defied2" : "chumak.otaman.after.relented2",
      ))];
    case "vesna":
      if (state === "sick") {
        const gives = c.potions === 0 && !flagHas(c.flags, "vesnaGaveTonic");
        return [topic("chumaky", "chumak.vesna.t.ask", L("chumak.vesna.sick.0", gives ? "chumak.vesna.sick.give" : "chumak.vesna.sick.1"), gives ? "vesnaTonic" : undefined)];
      }
      return [topic("chumaky-after", "chumak.vesna.t.after", L(state === "dead" ? "chumak.vesna.after.died" : "chumak.vesna.after.healed"))];
    case "radek":
      return [topic("chumaky", "chumak.radek.t", L(state === "dead" ? "chumak.radek.dead" : "chumak.radek.0"))];
    case "chort":
      return state === "sick" ? [topic("chumaky", "chumak.chort.t", L("chumak.chort.0", "chumak.chort.1"))] : [];
    case "domovyk":
      return state === "dead" ? [topic("chumaky", "chumak.domovyk.t", L("chumak.domovyk.dead"))] : [];
  }
  return [];
}
