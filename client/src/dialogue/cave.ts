import { t, type TextKey } from "../i18n";
import { flagHas } from "../systems/flags";
import { omelkoAtHome, pustkaStage } from "../systems/pustka";
import { knowsSong } from "../systems/songs";
import { type DialogueTopic, type TopicSet } from "./topics";

// Conversations in the Serpent's Cave and the tunnel (data/cave.ts):
//   Omelko  — the blind kobzar; teaches the duma of Marusia Bohuslavka, hears the draught
//   Zmiy    — the serpent; awake he asks, asleep he mumbles; the hoard is his dowry.
//             Flags zmiyKnown / zmiyGirl: what the kobzar has been told (the girl's
//             topic and Omelko's talk of the Zmiy wait until he has heard of them)
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
  if (npcId === "omelko") {
    const knows = knowsSong(flags, "marusia");
    const home = omelkoAtHome(flags);
    const stage = pustkaStage(flags);
    return {
      intro: L(home ? (firstMeeting ? "cave.omelko.homeIntro" : "cave.omelko.homeAgain") : firstMeeting ? "cave.omelko.intro" : "cave.omelko.again"),
      topics: [
        topic("who", "cave.omelko.t.who", L("cave.omelko.who.0", "cave.omelko.who.1")),
        home
          ? topic("eyes", "cave.omelko.t.homeLife", L("cave.omelko.homeLife.0", "cave.omelko.homeLife.1"))
          : topic("eyes", "cave.omelko.t.eyes", L("cave.omelko.eyes.0", "cave.omelko.eyes.1")),
        knows
          ? topic("sing", "cave.omelko.t.singAgain", lulled && !home ? L("cave.omelko.singAgain.lulled") : L("cave.omelko.singAgain.0", "cave.omelko.singAgain.1"))
          : topic("marusia", "cave.omelko.t.marusia", L("cave.omelko.marusia.0", "cave.omelko.marusia.1"), "marusia"),
        // he only talks of the Zmiy to someone who knows there is one
        ...(flagHas(flags, "zmiyKnown") ? [topic("zmiy", "cave.omelko.t.zmiy", L("cave.omelko.zmiy.0", "cave.omelko.zmiy.1"))] : []),
        // the draught from behind the serpent: he hears it, and he hears who passes
        ...(home ? [] : [topic("tunnel", "cave.omelko.t.tunnel", lulled || through ? L("cave.omelko.tunnel.open.0", "cave.omelko.tunnel.open.1") : L("cave.omelko.tunnel.0", "cave.omelko.tunnel.1"))]),
        topic("kobza", "cave.omelko.t.kobza", L("cave.omelko.kobza.0", "cave.omelko.kobza.1")),
        // "A roof for Omelko" (systems/pustka.ts): it opens once Stepan's shape has stopped coming
        ...(stage === "ask" ? [topic("home", "cave.omelko.t.home", L("cave.omelko.home.0", "cave.omelko.home.1"), "omelkoHome")] : []),
        ...(stage === "permission" || stage === "work" ? [topic("home", "cave.omelko.t.home", L("cave.omelko.homeWait.0", "cave.omelko.homeWait.1"))] : []),
        ...(stage === "ready" ? [topic("move", "cave.omelko.t.move", L("cave.omelko.move.0", "cave.omelko.move.1"), "omelkoMove")] : []),
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
        // nobody has told the kobzar about the girl until the dowry has
        topic("hoard", "cave.zmiy.t.hoard", L("cave.zmiy.hoard.0", "cave.zmiy.hoard.1"), "zmiyGirl"),
        ...(flagHas(flags, "zmiyGirl") ? [topic("bride", "cave.zmiy.t.bride", L("cave.zmiy.bride.0", "cave.zmiy.bride.1", "cave.zmiy.bride.2"))] : []),
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

