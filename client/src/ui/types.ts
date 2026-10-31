import { type Npc } from "../data/characters";
import { type DialogueTopic } from "../dialogue/topics";
import { type LazSpot } from "../systems/cave";

// --- Component ---------------------------------------------------------------

export type Prompt =
  | { kind: "talk"; npc: Npc }
  | { kind: "enter"; hut: 0 | 1 }
  | { kind: "exit" }
  | { kind: "gather"; idx: number }
  | { kind: "cast" }
  | { kind: "reel" }
  | { kind: "crust" }
  | { kind: "offer" }
  | { kind: "gift" }
  | { kind: "iron"; idx: number }
  | { kind: "wish" }
  | { kind: "cook" }
  | { kind: "smith" }
  | { kind: "brew" }
  | { kind: "bloom"; idx: number }
  | { kind: "offering" }
  | { kind: "dance" }
  | { kind: "blessing" }
  | { kind: "sleep" }
  | { kind: "play" }
  | { kind: "playKorchma" }
  | { kind: "pustkaChest" }
  | { kind: "petDog" }
  | { kind: "grave" }
  | { kind: "tobacco"; idx: number }
  | { kind: "hemp" }
  | { kind: "hangTobacco" }
  | { kind: "vigil" }
  | { kind: "sieve" }
  | { kind: "perelesnyk" }
  | { kind: "animal"; idx: number }
  | { kind: "laz"; spot: LazSpot }
  | { kind: "hoard" }
  | { kind: "pouch" }
  | null;

export function promptKeyOf(p: Prompt): string {
  if (p == null) return "";
  switch (p.kind) {
    case "talk": return `t:${p.npc.id}`;
    case "enter": return `enter:${p.hut}`;
    case "exit": return "exit";
    case "gather": return `g:${p.idx}`;
    case "iron": return `i:${p.idx}`;
    case "bloom": return `b:${p.idx}`;
    case "tobacco": return `tb:${p.idx}`;
    case "animal": return `an:${p.idx}`;
    case "laz": return `laz:${p.spot}`;
    default: return p.kind;
  }
}

// A conversation in progress. Two shapes share the slot:
//  · Linear: `lines` is a fixed script chosen when it opens (Viy's
//    narration, the well, the Chort's post-choice scripts, the brew
//    bench). The Chort's old bargain pages set `choiceAt` — at that
//    page the Next button is replaced by Sign / Walk away buttons;
//    the alchemy bench reuses the slot with choiceKind "brew".
//  · Topics: `topics` is set — `lines` is just the greeting, after
//    which `view` becomes "menu" and the player picks questions.
//    Picking one sets view "topic" and pages that topic's lines, then
//    returns to the menu. `asked` holds the topic ids already asked
//    (shown ✓, still re-askable). A topic with action "bargain" ends
//    its answer in the Sign / Keep my soul choice; action "blessing"
//    hands over to Beelzebub's blessing script instead of paging.
export type Dialogue = {
  npc: Npc;
  lines: string[];
  line: number;
  choiceAt?: number;
  choiceKind?: "chort" | "brew" | "options";
  // choiceKind "options": a list of buttons at the choice page, answered
  // by App's pickOption(optionsTag, option id).
  options?: DialogueOption[];
  optionsTag?: "sleep" | "play" | "playKorchma" | "perelesnyk" | "playZmiy";
  topics?: DialogueTopic[];
  asked?: string[];
  view?: "lines" | "menu" | "topic";
  topic?: DialogueTopic;
  topicLine?: number;
};

export type DialogueOption = { id: string; label: string; aria: string };

export type BrewRecipe = "base" | "strong";