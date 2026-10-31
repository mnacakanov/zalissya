import { tobaccoStage } from "../systems/tobacco";
import { type DialogueTopic } from "./topics";
import { L, topic } from "./helpers";

// Conversations for «Люлька отамана» (systems/tobacco.ts), appended to the
// khutir's topic menus. `grant` starts the quest / hands the tobacco over.

export function tobaccoTopics(npcId: string, flags: ReadonlySet<string>): DialogueTopic[] {
  const stage = tobaccoStage(flags);
  switch (npcId) {
    case "myroslav":
      if (stage === "none") return [topic("lyulka", "tobacco.otaman.t.ask", L("tobacco.otaman.ask.0", "tobacco.otaman.ask.1", "tobacco.otaman.ask.2"), "tobaccoQuest")];
      if (stage === "ready") return [topic("lyulka", "tobacco.otaman.t.give", L("tobacco.otaman.give.0", "tobacco.otaman.give.1", "tobacco.otaman.give.2"), "giveTobacco")];
      if (stage === "done") return [topic("lyulka", "tobacco.otaman.t.after", L("tobacco.otaman.after.0"))];
      return [topic("lyulka", "tobacco.otaman.t.wait", L(stage === "drying" ? "tobacco.otaman.wait.drying" : "tobacco.otaman.wait.0"))];
    case "vesna":
      return stage === "gather" || stage === "hang" ? [topic("tobacco", "tobacco.vesna.t", L("tobacco.vesna.0", "tobacco.vesna.1"))] : [];
    case "radek":
      return stage === "gather" ? [topic("tobacco", "tobacco.radek.t", L("tobacco.radek.0"))] : [];
    case "chort":
      return stage !== "none" && stage !== "done" ? [topic("tobacco", "tobacco.chort.t", L("tobacco.chort.0", "tobacco.chort.1"))] : [];
  }
  return [];
}
