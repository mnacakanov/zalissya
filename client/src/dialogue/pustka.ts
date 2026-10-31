import { pustkaStage } from "../systems/pustka";
import { type DialogueTopic } from "./topics";
import { L, topic } from "./helpers";

// "A roof for Omelko" (systems/pustka.ts), the khutir's part:
//   Myroslav — the empty khata is the khutir's, and he gives it for the work
//   everyone — once Omelko has moved in, a word of thanks in their own voice
// (Omelko's own lines are in dialogue/cave.ts, beside the rest of his talk.)

const PRAISE = new Set(["myroslav", "vesna", "radek", "odarka", "okhrim"]);

export function pustkaTopics(npcId: string, flags: ReadonlySet<string>): DialogueTopic[] {
  const stage = pustkaStage(flags);
  if (npcId === "myroslav") {
    if (stage === "permission") return [topic("pustka", "pustka.myroslav.ask", L("pustka.myroslav.ask.0", "pustka.myroslav.ask.1"), "pustkaLeave")];
    if (stage === "work" || stage === "ready") return [topic("pustka", "pustka.myroslav.ask", L("pustka.myroslav.work.0", "pustka.myroslav.work.1"))];
  }
  if (stage === "done" && PRAISE.has(npcId)) {
    return [topic("pustkaPraise", `pustka.praise.${npcId}`, L(`pustka.praise.${npcId}.0`, `pustka.praise.${npcId}.1`))];
  }
  return [];
}
