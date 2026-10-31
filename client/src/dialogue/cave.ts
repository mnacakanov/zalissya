import { t, type TextKey } from "../i18n";
import { flagHas } from "../systems/flags";
import { knowsSong } from "../systems/songs";
import { type DialogueTopic, type TopicSet } from "./topics";

// Conversations in the Serpent's Cave and the tunnel (data/cave.ts):
//   Onufriy — the hermit at the mouth, gentle and dry; he points at the sad song
//   Omelko  — the blind kobzar; teaches the duma of Marusia Bohuslavka
//   Zmiy    — the serpent; awake he asks, asleep he mumbles; the hoard is his dowry
//   Vohnyk  — a little flame who forgets everything, himself included
//   Sydir   — a chumak turned smuggler, mid-tunnel; teaches «Ой не ходи, Грицю»
// Myroslav and Okhrim carry the rumours that put the cave and the tunnel on
// the kobzar's map (grants caveRumor / lazRumor, applied in App).

const topic = (id: string, base: string, lines: string[], grant?: DialogueTopic["grant"], action?: DialogueTopic["action"]): DialogueTopic => ({
  id,
  label: t(`${base}.label` as TextKey),
  question: t(`${base}.question` as TextKey),
  lines,
  ...(grant ? { grant } : {}),
  ...(action ? { action } : {}),
});
const L = (...keys: string[]) => keys.map((k) => t(k as TextKey));

export function caveTopicSet(npcId: string, flags: ReadonlySet<string>, firstMeeting: boolean): TopicSet | null {
  const lulled = flagHas(flags, "zmiyLulled");
  const through = flagHas(flags, "lazOpen");
  if (npcId === "onufriy") {
    return {
      intro: L(firstMeeting ? "cave.onufriy.intro" : "cave.onufriy.again"),
      topics: [
        topic("who", "cave.onufriy.t.who", L("cave.onufriy.who.0", "cave.onufriy.who.1")),
        topic("candle", "cave.onufriy.t.candle", L("cave.onufriy.candle.0", "cave.onufriy.candle.1")),
        topic("zmiy", "cave.onufriy.t.zmiy", lulled ? L("cave.onufriy.zmiy.lulled.0", "cave.onufriy.zmiy.lulled.1") : L("cave.onufriy.zmiy.0", "cave.onufriy.zmiy.1")),
        topic("omelko", "cave.onufriy.t.omelko", L("cave.onufriy.omelko.0", "cave.onufriy.omelko.1")),
        topic("tunnel", "cave.onufriy.t.tunnel", lulled || through ? L("cave.onufriy.tunnel.open.0", "cave.onufriy.tunnel.open.1") : L("cave.onufriy.tunnel.0", "cave.onufriy.tunnel.1")),
      ],
    };
  }
  if (npcId === "omelko") {
    const knows = knowsSong(flags, "marusia");
    return {
      intro: L(firstMeeting ? "cave.omelko.intro" : "cave.omelko.again"),
      topics: [
        topic("who", "cave.omelko.t.who", L("cave.omelko.who.0", "cave.omelko.who.1")),
        topic("eyes", "cave.omelko.t.eyes", L("cave.omelko.eyes.0", "cave.omelko.eyes.1")),
        knows
          ? topic("sing", "cave.omelko.t.singAgain", lulled ? L("cave.omelko.singAgain.lulled") : L("cave.omelko.singAgain.0", "cave.omelko.singAgain.1"))
          : topic("marusia", "cave.omelko.t.marusia", L("cave.omelko.marusia.0", "cave.omelko.marusia.1"), "marusia"),
        topic("zmiy", "cave.omelko.t.zmiy", L("cave.omelko.zmiy.0", "cave.omelko.zmiy.1")),
        topic("kobza", "cave.omelko.t.kobza", L("cave.omelko.kobza.0", "cave.omelko.kobza.1")),
      ],
    };
  }
  if (npcId === "zmiy") {
    if (lulled) {
      const hoardLeft = !flagHas(flags, "zmiyHoard");
      return {
        intro: L("cave.zmiy.sleepIntro"),
        topics: [
          topic("dream", "cave.zmiy.t.dream", L("cave.zmiy.dream.0", "cave.zmiy.dream.1")),
          topic("hoard", "cave.zmiy.t.hoardSleep", hoardLeft ? L("cave.zmiy.hoardSleep.0", "cave.zmiy.hoardSleep.1") : L("cave.zmiy.hoardTaken")),
        ],
      };
    }
    return {
      intro: L(firstMeeting ? "cave.zmiy.intro" : "cave.zmiy.again"),
      topics: [
        topic("who", "cave.zmiy.t.who", L("cave.zmiy.who.0", "cave.zmiy.who.1")),
        topic("bride", "cave.zmiy.t.bride", L("cave.zmiy.bride.0", "cave.zmiy.bride.1", "cave.zmiy.bride.2")),
        topic("hoard", "cave.zmiy.t.hoard", L("cave.zmiy.hoard.0", "cave.zmiy.hoard.1")),
        // asking opens the song choice: the lines are what he says before it
        topic("sing", "cave.zmiy.t.sing", L("cave.zmiy.sing.0", "cave.zmiy.sing.1"), undefined, "sing"),
      ],
    };
  }
  if (npcId === "vohnyk") {
    return {
      intro: L(firstMeeting ? "cave.vohnyk.intro" : "cave.vohnyk.again"),
      topics: [
        topic("who", "cave.vohnyk.t.who", L("cave.vohnyk.who.0", "cave.vohnyk.who.1")),
        topic("name", "cave.vohnyk.t.name", L("cave.vohnyk.name.0", "cave.vohnyk.name.1")),
        topic("pool", "cave.vohnyk.t.pool", L("cave.vohnyk.pool.0", "cave.vohnyk.pool.1")),
        topic("lure", "cave.vohnyk.t.lure", L("cave.vohnyk.lure.0", "cave.vohnyk.lure.1")),
      ],
    };
  }
  if (npcId === "sydir") {
    return {
      intro: L(firstMeeting ? "cave.sydir.intro" : "cave.sydir.again"),
      topics: [
        topic("who", "cave.sydir.t.who", L("cave.sydir.who.0", "cave.sydir.who.1")),
        topic("tunnel", "cave.sydir.t.tunnel", L("cave.sydir.tunnel.0", "cave.sydir.tunnel.1", "cave.sydir.tunnel.2")),
        topic("bones", "cave.sydir.t.bones", L("cave.sydir.bones.0", "cave.sydir.bones.1")),
        topic("goods", "cave.sydir.t.goods", L("cave.sydir.goods.0", "cave.sydir.goods.1")),
        ...(knowsSong(flags, "hrytsiu") ? [] : [topic("song", "cave.sydir.t.song", L("cave.sydir.song.0", "cave.sydir.song.1"), "hrytsiu")]),
      ],
    };
  }
  return null;
}

// Rumours the village carries (appended to the topics of Myroslav and Okhrim).
export function caveRumorTopics(npcId: string, flags: ReadonlySet<string>): DialogueTopic[] {
  if (npcId === "myroslav" && !flagHas(flags, "caveHeard")) {
    return [topic("cave", "cave.rumor.myroslav", L("cave.rumor.myroslav.0", "cave.rumor.myroslav.1"), "caveRumor")];
  }
  if (npcId === "okhrim" && !flagHas(flags, "lazKnown")) {
    return [topic("laz", "cave.rumor.okhrim", L("cave.rumor.okhrim.0", "cave.rumor.okhrim.1"), "lazRumor")];
  }
  return [];
}

