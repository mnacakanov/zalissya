import { flagHas } from "./flags";
import { isNight } from "./time";

// --- Did Prokip, the vorozhbyt -------------------------------------------------
// An old sorcerer-healer lives alone in the south-east forest, past the
// chumak road's bridge (data/houses.ts PROKIP_ROOM). He is grumpy, he makes
// a fool of the kobzar (gently), and by the end the kobzar likes him.
// His thread, in order:
//   1. «Вода в решеті» — he sends you to fetch water from the khutir's well
//      in a sieve. You go. It runs out. He laughs: forty years he has
//      handed that sieve to everyone, and you are the first who went.
//   2. «Привіт від Прокопа» — carry a message to Vesna: "Prokip says you
//      were wrong." Her answer, and what it was about (fifty years ago, a
//      Kupala night, rain), is the joke and the heart of him.
//   3. «Перелесник» — the serious one. A fiery serpent flies to the
//      korchma at night in the shape of Odarka's Stepan, who rode to the
//      Sich seven years ago. He gives you blessed poppy seed: scatter it on
//      the threshold and sing, and it goes. Or let her have her night;
//      it drinks her a little more, and you can come back.
//   4. The reward: he spits in your ear, and you understand the animals.
// All of it is flags; the stage is derived, never stored.

export type ProkipStage =
  | "unheard"          // nobody has mentioned him yet
  | "find"             // Vesna has: go and find him
  | "offerSieve"       // met; he has an errand
  | "sieve"            // carrying water in a sieve
  | "sieveBack"        // it ran out; tell him
  | "offerMessage"     // the real errand
  | "message"          // take his words to Vesna
  | "answer"           // take hers back
  | "offerPerelesnyk"  // now, seriously
  | "perelesnyk"       // at night, at the korchma
  | "reward"           // it is gone; go back to him
  | "done";            // you hear the animals

export type ProkipView = { flags: ReadonlySet<string>; met: boolean; heard: boolean };

export function prokipStage(v: ProkipView): ProkipStage {
  const f = v.flags;
  if (flagHas(f, "zviryna")) return "done";
  if (flagHas(f, "perelesnykGone")) return "reward";
  if (flagHas(f, "perelesnykQuest")) return "perelesnyk";
  if (flagHas(f, "vesnaDone")) return "offerPerelesnyk";
  if (flagHas(f, "vesnaAnswer")) return "answer";
  if (flagHas(f, "prokipMessage")) return "message";
  if (flagHas(f, "reshetoDone")) return "offerMessage";
  if (flagHas(f, "reshetoTried")) return "sieveBack";
  if (flagHas(f, "resheto")) return "sieve";
  if (v.met) return "offerSieve";
  return v.heard ? "find" : "unheard";
}

// What asking Prokip's errand topic sets, by stage (null: nothing to give).
export function prokipNext(stage: ProkipStage): string | null {
  switch (stage) {
    case "offerSieve": return "resheto";
    case "sieveBack": return "reshetoDone";
    case "offerMessage": return "prokipMessage";
    case "answer": return "vesnaDone";
    case "offerPerelesnyk": return "perelesnykQuest";
    case "reward": return "zviryna";
    default: return null;
  }
}

// The perelesnyk flies to the korchma every night until it is driven off,
// quest or no quest (before the quest it is only a falling star the
// horse stares at). It can be met only once Prokip has explained it.
export function perelesnykFlies(flags: ReadonlySet<string>, minute: number): boolean {
  return !flagHas(flags, "perelesnykGone") && isNight(minute);
}
export function perelesnykMeetable(flags: ReadonlySet<string>, minute: number): boolean {
  return flagHas(flags, "perelesnykQuest") && perelesnykFlies(flags, minute);
}
