import { t, type TextKey } from "../i18n";
import { flagHas } from "../systems/flags";
import { type ProkipStage } from "../systems/vorozhbyt";
import { type DialogueTopic, type TopicSet } from "./topics";

// Did Prokip's conversations (systems/vorozhbyt.ts), and the lines his
// thread adds to Vesna and Odarka. Prokip's errand topic changes with the
// stage; asking it hands over the next step ("prokipNext" in applyGrant).
// His voice: grumbling, insulting with love, calls the kobzar «шмаркачу»
// (snot-nose), and never once admits he is glad you came.

const L = (...keys: string[]) => keys.map((k) => t(k as TextKey));
const topic = (id: string, base: string, lines: string[], grant?: DialogueTopic["grant"]): DialogueTopic => ({
  id, label: t(`${base}.label` as TextKey), question: t(`${base}.question` as TextKey), lines, ...(grant ? { grant } : {}),
});
const seq = (base: string, n: number) => L(...Array.from({ length: n }, (_, i) => `${base}.${i}`));

function errand(stage: ProkipStage, flags: ReadonlySet<string>): DialogueTopic[] {
  switch (stage) {
    case "offerSieve": return [topic("errand", "prokip.t.sieve", seq("prokip.sieve", 2), "prokipNext")];
    case "sieve": return [topic("errand", "prokip.t.sieveWait", seq("prokip.sieveWait", 1))];
    case "sieveBack": return [topic("errand", "prokip.t.sieveBack", seq("prokip.sieveBack", 3), "prokipNext")];
    case "offerMessage": return [topic("errand", "prokip.t.message", seq("prokip.message", 2), "prokipNext")];
    case "message": return [topic("errand", "prokip.t.messageWait", seq("prokip.messageWait", 1))];
    case "answer": return [topic("errand", "prokip.t.answer", seq("prokip.answer", 5), "prokipNext")];
    case "offerPerelesnyk": return [topic("errand", "prokip.t.perelesnyk", seq("prokip.perelesnyk", 4), "prokipNext")];
    case "perelesnyk": return flagHas(flags, "perelesnykSpared")
      ? [topic("errand", "prokip.t.spared", seq("prokip.spared", 2))]
      : [topic("errand", "prokip.t.perelesnykWait", seq("prokip.perelesnykWait", 1))];
    case "reward": return [topic("errand", "prokip.t.reward", seq("prokip.reward", 6), "prokipNext")];
    case "done": return [topic("errand", "prokip.t.after", seq("prokip.after", 1))];
    default: return [];
  }
}

export function prokipTopicSet(stage: ProkipStage, flags: ReadonlySet<string>, firstMeeting: boolean): TopicSet {
  return {
    intro: firstMeeting ? seq("prokip.intro", 2) : L(stage === "done" ? "prokip.again.friend" : "prokip.again"),
    topics: [
      topic("who", "prokip.t.who", seq("prokip.who", 2)),
      topic("forest", "prokip.t.forest", seq("prokip.forest", 2)),
      ...errand(stage, flags),
      ...(flagHas(flags, "vesnaDone") ? [topic("vesna", "prokip.t.vesna", seq("prokip.vesna", 2))] : []),
    ],
  };
}

// Vesna knows where he lives, and what he is.
export function vesnaProkipTopics(stage: ProkipStage): DialogueTopic[] {
  return [
    topic("prokip", "prokip.vesna.t.who", seq("prokip.vesna.who", 2)),
    ...(stage === "message" ? [topic("prokipMsg", "prokip.vesna.t.msg", seq("prokip.vesna.msg", 3), "vesnaAnswer")] : []),
  ];
}

// Odarka: pale while the perelesnyk still comes, and after it is gone,
// grieving like a person again.
export function odarkaProkipTopics(flags: ReadonlySet<string>): DialogueTopic[] {
  if (flagHas(flags, "perelesnykGone")) return [topic("stepan", "prokip.odarka.t.after", seq("prokip.odarka.after", 3))];
  if (flagHas(flags, "perelesnykQuest")) return [topic("stepan", "prokip.odarka.t.nights", seq("prokip.odarka.nights", 2))];
  return [];
}

// The perelesnyk at the korchma door: the scene, then what you did.
export const PERELESNYK_SCENE = (): string[] => seq("perelesnyk.scene", 3);
export const PERELESNYK_DRIVEN = (): string[] => seq("perelesnyk.driven", 3);
export const PERELESNYK_SPARED = (): string[] => seq("perelesnyk.spared", 2);
