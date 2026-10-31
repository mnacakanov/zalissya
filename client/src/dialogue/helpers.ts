import { t, type TextKey } from "../i18n";
import type { DialogueTopic } from "./topics";

// Shared by the story modules in this folder (cave, chumaky, korchma, pustka,
// tobacco, trade, vorozhbyt). They used to carry a private copy each.

// Several locale keys → their texts, in order. This is the one place a plain
// string becomes a TextKey for static key lists; the key-existence test
// (i18n/keys.test.ts) is what keeps those lists honest.
export const L = (...keys: string[]): string[] => keys.map((k) => t(k as TextKey));

// A topic whose menu label and question are `<base>.label` / `<base>.question`.
export const topic = (
  id: string,
  base: string,
  lines: string[],
  grant?: DialogueTopic["grant"],
  action?: DialogueTopic["action"],
): DialogueTopic => ({
  id,
  label: t(`${base}.label` as TextKey),
  question: t(`${base}.question` as TextKey),
  lines,
  ...(grant ? { grant } : {}),
  ...(action ? { action } : {}),
});
