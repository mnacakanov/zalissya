import { t } from "../i18n";
import { flagHas } from "../systems/flags";
import { type DialogueTopic } from "./topics";

// The map is a thing you get, not a menu you have (ui/MapOverlay.tsx):
//   · Hnat gives his chumak map when Ostap lives (dialogue/chumaky.ts);
//   · the Chort sells his own for MAP_PRICE fish — fish being, as everyone
//     knows, the devil's currency. He trades by the millstone and on the
//     mountain alike.
export const MAP_PRICE = 3;

export function mapTopics(npcId: string, flags: ReadonlySet<string>, fish: number): DialogueTopic[] {
  if (npcId !== "chort" || flagHas(flags, "map")) return [];
  const can = fish >= MAP_PRICE;
  return [{
    id: "buy-map",
    label: t("map.chort.label"),
    question: t("map.chort.question"),
    lines: can ? [t("map.chort.buy.0"), t("map.chort.buy.1")] : [t("map.chort.poor.0", { fish, price: MAP_PRICE })],
    ...(can ? { grant: "buyMap" as const } : {}),
  }];
}
