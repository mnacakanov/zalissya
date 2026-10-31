import { t } from "../i18n";
import { flagCount, flagHas } from "../systems/flags";
import { type DialogueTopic } from "./topics";
import { L } from "./helpers";

// Radek's horseshoe trade (systems/trade.ts), appended to his topic menu
// once his forge is lit. With horseshoes in the satchel the topic sells
// them all (`grant`); without, he says what he pays.

export function tradeTopics(npcId: string, flags: ReadonlySet<string>): DialogueTopic[] {
  if (npcId !== "radek" || !flagHas(flags, "horseshoe")) return [];
  const label = t("trade.radek.t.label");
  const question = t("trade.radek.t.question");
  return flagCount(flags, "forged") > 0
    ? [{ id: "sell", label, question, lines: L("trade.radek.sell.0", "trade.radek.sell.1"), grant: "sellHorseshoes" }]
    : [{ id: "sell", label, question, lines: L("trade.radek.none.0") }];
}
