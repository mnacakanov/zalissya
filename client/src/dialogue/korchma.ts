import { t, type TextKey } from "../i18n";
import { flagHas } from "../systems/flags";
import { SUPPER_PRICE } from "../systems/korchma";
import { knowsSong } from "../systems/songs";
import { type DialogueTopic, type TopicSet } from "./topics";

// Conversations in the korchma (data/korchma.ts): Odarka behind the
// shynkvas, Okhrim at the long table. Odarka sells supper for fish and
// teaches «Ти ж мене підманула» (she knows it from life); Okhrim teaches
// «Їхав козак за Дунай», the song his kurin rode out to, and is the one
// person on the steppe who will tell you plainly about looking at Viy.

const topic = (id: string, base: string, lines: string[], grant?: DialogueTopic["grant"]): DialogueTopic => ({
  id,
  label: t(`${base}.label` as TextKey),
  question: t(`${base}.question` as TextKey),
  lines,
  ...(grant ? { grant } : {}),
});
const L = (...keys: string[]) => keys.map((k) => t(k as TextKey));

export function korchmaTopicSet(npcId: string, flags: ReadonlySet<string>, fish: number, firstMeeting: boolean): TopicSet | null {
  if (npcId === "odarka") {
    const canPay = fish >= SUPPER_PRICE;
    return {
      intro: L(firstMeeting ? "korchma.odarka.intro" : "korchma.odarka.again"),
      topics: [
        topic("who", "korchma.odarka.t.who", L("korchma.odarka.who.0", "korchma.odarka.who.1")),
        canPay
          ? topic("supper", "korchma.odarka.t.supper", L("korchma.odarka.supper.0"), "supper")
          : topic("supper", "korchma.odarka.t.supper", [t("korchma.odarka.supperPoor", { price: SUPPER_PRICE })]),
        topic("news", "korchma.odarka.t.news", [
          t(flagHas(flags, "viySealed") ? "korchma.odarka.news.viySealed" : "korchma.odarka.news.viy"),
          t("korchma.odarka.news.road"),
        ]),
        topic("okhrim", "korchma.odarka.t.okhrim", L("korchma.odarka.okhrim.0", "korchma.odarka.okhrim.1")),
        ...(knowsSong(flags, "pidmanula") ? [] : [topic("song", "korchma.odarka.t.song", L("korchma.odarka.song.0", "korchma.odarka.song.1"), "pidmanula")]),
      ],
    };
  }
  if (npcId === "okhrim") {
    return {
      intro: L(firstMeeting ? "korchma.okhrim.intro" : "korchma.okhrim.again"),
      topics: [
        topic("sich", "korchma.okhrim.t.sich", L("korchma.okhrim.sich.0", "korchma.okhrim.sich.1")),
        topic("kurin", "korchma.okhrim.t.kurin", L("korchma.okhrim.kurin.0", "korchma.okhrim.kurin.1")),
        flagHas(flags, "viySealed")
          ? topic("viy", "korchma.okhrim.t.viySealed", L("korchma.okhrim.viySealed.0"))
          : topic("viy", "korchma.okhrim.t.viy", L("korchma.okhrim.viy.0", "korchma.okhrim.viy.1")),
        topic("debt", "korchma.okhrim.t.debt", L("korchma.okhrim.debt.0")),
        ...(knowsSong(flags, "dunai") ? [] : [topic("song", "korchma.okhrim.t.song", L("korchma.okhrim.song.0", "korchma.okhrim.song.1"), "dunai")]),
      ],
    };
  }
  return null;
}
