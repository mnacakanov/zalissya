import { type Npc } from "../data/characters";
import { BREW_SPOT } from "../data/items";
import { linesFor, linesForLysa } from "./lines";
import { flagCount, flagHas } from "../systems/flags";

// --- Branching dialogue: topics ---------------------------------------------
// Conversations are topic-driven now, not linear scripts. Talking to
// someone opens with a short greeting — the full introduction the first
// time, a brief welcome after — then a menu of questions the PLAYER
// picks, in any order, re-askable, until they tap Farewell. Asked
// topics stay in the menu, marked ✓. Answers run 1–3 lines and are
// built from the world state at the moment of asking (herbs, flags,
// fish, the soul price, INT), because they are dealt out of the very
// same linesFor / linesForLysa scripts — those state branches ARE the
// answers, sorted by subject instead of recited in a fixed order.
// Scripted beats stay scripted: Viy is narration, not conversation;
// the Chort's bargain is a topic whose answer ends in the Sign / Keep
// my soul choice; Beelzebub's blessing is a topic that hands over to
// the blessing script. Asking costs nothing and changes nothing by
// itself — CHA still grows by MEETING people, once each, as before.

export type DialogueTopic = {
  id: string;
  label: string;
  question: string;
  lines: string[];
  action?: "bargain" | "blessing";
  // Asking hands this item over (Viy's night preparations — see viyNight.ts).
  grant?: "chalk" | "wreath" | "ironward";
};

export type TopicSet = { intro: string[]; topics: DialogueTopic[] };

export function pickLines(lines: string[], ...idx: number[]): string[] {
  return idx
    .map((i) => lines[i])
    .filter((s): s is string => typeof s === "string" && s.length > 0);
}

export function topicsForVillage(
  npc: Npc,
  herbs: number,
  flags: ReadonlySet<string>,
  fish: number,
  price: number,
  intTotal: number,
  firstMeeting: boolean,
): TopicSet | null {
  const L = linesFor(npc, herbs, flags, fish, price, intTotal);
  switch (npc.id) {
    case "myroslav":
      return {
        intro: firstMeeting
          ? pickLines(L, 0)
          : ["Back again, traveller? Zalissya keeps, mostly. Ask what you will."],
        topics: [
          { id: "forest", label: "The forest & the Lisovyk", question: "What walks in the forest?", lines: pickLines(L, 1) },
          { id: "domovyk", label: "The Domovyk & the bread", question: "Tell me of the house spirit.", lines: pickLines(L, 2, 3) },
          { id: "viy", label: "Viy", question: "Who is Viy?", lines: pickLines(L, 4) },
          { id: "radek", label: "Radek the smith", question: "Who is the smith?", lines: pickLines(L, 5) },
          { id: "dark", label: "The Chort & the pond", question: "What should I fear here?", lines: pickLines(L, 6) },
          { id: "lysa", label: "Lysa Hora", question: "What is Lysa Hora?", lines: pickLines(L, 7) },
          { id: "growth", label: "How a person grows here", question: "How does one become someone in Zalissya?", lines: pickLines(L, 8) },
        ],
      };
    case "vesna": {
      const strongLine =
        intTotal >= 3
          ? "And the deep work is open to you: my strong tonic — three herbs, and drunk it sharpens mind AND eye twice as deep as the common brew (INT +2, WIS +2). Your INT has reached 3, znakharka. The rack will offer it."
          : `One secret I keep for a readier mind: my strong tonic — three herbs, worth INT +2 and WIS +2 to whoever drinks it. It unlocks at INT 3; yours stands at ${intTotal}. Keep brewing the common tonic — the rack remembers every batch.`;
      return {
        intro: firstMeeting
          ? pickLines(L, 0)
          : [herbs >= 5
              ? "Your basket smells of the whole meadow. Ask, znakharka — I keep few secrets from keen hands."
              : "Gentle hands. What would you know?"],
        topics: [
          { id: "herbs", label: "The five herbs", question: "Teach me the herbs.", lines: pickLines(L, 1) },
          {
            id: "zvirobiy", label: "Zvirobiy, the shy herb", question: "Why does zvirobiy hide from me?",
            lines: herbs >= 5
              ? ["Zvirobiy hides from no one in this village now — your eye knows it, stem and yellow star. Wisdom opened that door, and doors opened by doing stay open."]
              : pickLines(L, 2),
          },
          {
            id: "cooking", label: "Cooking at the campfire", question: "What can I cook?",
            lines: herbs >= 5
              ? pickLines(L, 2)
              : ["At the campfire hangs a pot, and it is not decoration: one pond fish and one herb from your satchel makes a proper karas soup. That is Cooking — and a fed traveller walks brisker. Eat it from your Character sheet."],
          },
          {
            id: "alchemy", label: "Alchemy & the strong tonic", question: "Teach me alchemy.",
            lines: herbs >= 5
              ? pickLines(L, 2, 3)
              : ["By the north-east hut stands my drying rack: two herbs, worked patiently, become a tonic — that is Alchemy. Drink one and the world goes clear for a while.", strongLine],
          },
          {
            id: "pond", label: "The pond & fishing", question: "What of the pond?",
            lines: herbs >= 5
              ? pickLines(L, 4)
              : ["When the herbs rest, try the pond shore, west bank. A patient line catches more than karas — it catches quiet. And quiet is a remedy too. Mind the Bolotianyk, though: it is his water first."],
          },
          {
            id: "errand", label: "What you ask of me", question: "What do you need?",
            lines: herbs >= 5
              ? ["Nothing today, keen one. The forest has accepted you — now Zalissya asks only that you keep being what you do."]
              : pickLines(L, 3),
          },
        ],
      };
    }
    case "radek": {
      const home =
        "My home is a village many days' road from here, far to the west. I came with the spring to lend them my hammer — and the road home can wait until the work is done.";
      const lit = flagHas(flags, "horseshoe");
      return {
        intro: firstMeeting
          ? pickLines(L, 0)
          : [lit ? "Mind the sparks, traveller. Ask away." : "Aye? Mind the anvil — she bites. Ask."],
        topics: lit
          ? [
              { id: "forge", label: "The lit forge", question: "How does the forge fare?", lines: pickLines(L, 0) },
              { id: "horseshoe", label: "The horseshoe you gave me", question: "Why a horseshoe?", lines: pickLines(L, 1) },
              { id: "smithing", label: "Learning smithing", question: "Teach me the anvil.", lines: pickLines(L, 2) },
              { id: "home", label: "Your home in the west", question: "Where are you from, Radek?", lines: [home] },
            ]
          : [
              { id: "home", label: "Your home in the west", question: "Where are you from, Radek?", lines: pickLines(L, 1) },
              { id: "iron", label: "Bog iron for the forge", question: "What does your forge need?", lines: pickLines(L, 2) },
              { id: "lisovyk", label: "Iron & the Lisovyk", question: "Can iron settle the Lisovyk?", lines: pickLines(L, 3) },
              { id: "viy", label: "Viy & iron", question: "Would iron serve against Viy?", lines: pickLines(L, 4) },
            ],
      };
    }
    case "domovyk": {
      const thanked = flagHas(flags, "stone");
      const fed = flagHas(flags, "offering");
      return {
        intro: firstMeeting
          ? pickLines(L, 0)
          : [thanked ? "Hmph. You again. …Sit a moment, then. Ask — quietly." : "Soft feet, new one. Ask, then — quietly."],
        topics: [
          {
            id: "bread", label: "The bread", question: "What do you want of me?",
            lines: thanked ? pickLines(L, 0) : fed ? pickLines(L, 0, 1) : pickLines(L, 1, 2),
          },
          {
            id: "hearth", label: thanked ? "The warm stone" : "Your hut & the pich", question: thanked ? "Tell me of the stone." : "Tell me of this hut.",
            lines: thanked
              ? pickLines(L, 1, 2)
              : fed
                ? ["A hundred winters I have kept this hut: the pich warm, the bread risen, the mice polite. It is not grand work. It is the work that lets all other work happen."]
                : pickLines(L, 0),
          },
          {
            id: "lisovyk", label: "The Lisovyk", question: "What of the forest spirit?",
            lines: thanked || fed
              ? ["The Lisovyk thinks himself grand out there with his pines. Let him. Empires fall; a warm hearth does not."]
              : pickLines(L, 3),
          },
          {
            id: "viy", label: "Viy", question: "What of Viy?",
            lines: thanked || fed
              ? ["…You smell of the north-east path. You have been near Viy. Do not go clattering about up there, little landlord. If those eyelids ever lift, no pich in Zalissya will keep out the cold that follows."]
              : pickLines(L, 4),
          },
        ],
      };
    }
    case "lisovyk":
      return {
        intro: firstMeeting
          ? pickLines(L, 0)
          : ["You again, two-legs. You walk softer than most. Ask."],
        topics: [
          { id: "rules", label: "The forest's rules", question: "What are your rules?", lines: pickLines(L, 1) },
          { id: "vesna", label: "Vesna's eye", question: "What of Vesna?", lines: pickLines(L, 2) },
          { id: "viy", label: "Viy", question: "What of Viy?", lines: pickLines(L, 3) },
          { id: "domovyk", label: "The Domovyk", question: "What of the house spirit?", lines: ["The Domovyk? A crumb-god in a warm box, fed on crusts and courtesy. Let him keep his pich — I keep the world that grows the wood for it. We do not quarrel. Much."] },
          { id: "lost", label: "Getting lost", question: "What happens to the lost?", lines: ["The lost are mine also — I said it when we met, and it is no threat. Walk out greedy or loud, and the paths turn, and turn, and you greet your own footprints until dark. Walk soft, take only what is given, and the pines lean apart like polite neighbours."] },
        ],
      };
    case "chort": {
      if (flagHas(flags, "soulback")) {
        return {
          intro: firstMeeting
            ? pickLines(L, 0)
            : ["My favourite customer returns! Ask away — no pens in sight. Promise."],
          topics: [
            { id: "settled", label: "Our bargain, settled", question: "No hard feelings?", lines: pickLines(L, 0, 1) },
            { id: "lysa", label: "Lysa Hora & the sabbath", question: "Tell me of the sabbath.", lines: pickLines(L, 2) },
            { id: "mill", label: "The old mill sabbaths", question: "What happened at the old mill?", lines: ["In the old days we kept a fine sabbath up at the old mill — fiddles, dancing, the whole host, and Beelzebub himself presiding! Weddings we crashed by the dozen. A Cossack's soul is a vintage thing, my friend. These nights we keep it grander on Lysa Hora — but I keep a soft spot for a millstone."] },
          ],
        };
      }
      if (flagHas(flags, "soulsold")) {
        return {
          intro: firstMeeting
            ? pickLines(L, 0)
            : ["My shadowless friend returns! Ask — everything is negotiable. Almost everything."],
          topics: [
            { id: "soul", label: "My soul — the price", question: "What will my soul cost me?", lines: pickLines(L, 2) },
            { id: "gold", label: "The gold & my shadow", question: "Was the bargain fair?", lines: pickLines(L, 0) },
            { id: "lysa", label: "Lysa Hora", question: "Tell me of the mountain.", lines: pickLines(L, 1) },
          ],
        };
      }
      return {
        intro: firstMeeting
          ? pickLines(L, 0)
          : ["Psst. Back again, traveller? Ask — I know things. Some of them are even true."],
        topics: [
          { id: "who", label: "Who are you?", question: "What are you, exactly?", lines: pickLines(L, 0) },
          { id: "mill", label: "The mill & the sabbath", question: "What is this sabbath you speak of?", lines: pickLines(L, 1) },
          { id: "viy", label: "Viy", question: "What do devils fear?", lines: ["Viy? …Even I lower my voice, traveller. A devil deals in souls; Viy deals in endings. If those lids ever lift, my whole sabbath dances attendance — from very, very far away."] },
          // The bargain is offered ONCE: a soul kept is a soul kept, and
          // the pen stays away afterwards (the old script suppressed the
          // Sign choice in this state too). In its place, his reaction.
          ...(flagHas(flags, "soulkept")
            ? [{
                id: "refused", label: "Your bargain — refused", question: "Any regrets, devil?",
                lines: ["Regrets? ME? Hah! You refused like a starosta, traveller — I told you, the last one who refused me became one. The offer stands closed, and a devil keeps his word: no pen, no pitch. But when Viy stirs and you need a friend with a pitchfork — you know where the millstone is. My prices only go UP."],
              }]
            : [{ id: "bargain", label: "Your bargain ✒", question: "What are you offering?", lines: pickLines(L, 2), action: "bargain" as const }]),
        ],
      };
    }
    case "bolotianyk":
      return {
        intro: firstMeeting
          ? pickLines(L, 0)
          : ["The eyes rise again from the pond scum. “Dry one. Ask, then. The pond has time.”"],
        topics: [
          { id: "bells", label: "The drowned bells", question: "What bells ring under the pond?", lines: pickLines(L, 1) },
          { id: "water", label: "What grows in your water", question: "May I take what grows here?", lines: pickLines(L, 2) },
          {
            id: "fishing", label: "Fishing your pond", question: "Do you mind my line?",
            lines: fish > 0
              ? pickLines(L, 3)
              : ["“You have not troubled my water with a line yet, dry one. Fish if you must — from the west shore, politely, and take only what the pond gives up. What it keeps, it keeps.”"],
          },
          { id: "old", label: "Viy & the old things", question: "What is oldest here?", lines: pickLines(L, fish > 0 ? 4 : 3) },
        ],
      };
    default:
      // Viy (and anyone unforeseen) keeps the scripted narration.
      return null;
  }
}

export function topicsForLysa(npc: Npc, flags: ReadonlySet<string>, firstMeeting: boolean): TopicSet | null {
  const L = linesForLysa(npc, flags);
  const flowers = flagCount(flags, "lysaFlower");
  const offered = flagHas(flags, "lysaOffering");
  const danced = flagHas(flags, "lysaDanced");
  const blessed = flagHas(flags, "moonstone");
  switch (npc.id) {
    case "beelzebub": {
      const viyTopic: DialogueTopic = {
        id: "viy", label: "Viy", question: "What does the mountain fear?",
        lines: ["“VIY. YES. EVEN THE MOUNTAIN HAS A NEIGHBOUR IT DOES NOT VISIT. HIS LIDS HANG TO THE GROUND, AND UNDER THEM — AN ENDING. LET HIM SLEEP, LITTLE MORTAL. SOME GUESTS EVEN I WILL NOT RECEIVE.”"],
      };
      const courtTopic: DialogueTopic = {
        id: "court", label: "Your court", question: "Who gathers here?",
        lines: ["“MY COURT: WITCHES WHO OUTLIVED THEIR VILLAGES, DEVILS WHO OUTGREW THEIR MILLS, AND ONE MORTAL WHO CAME POLITE. THE FIRE IS OLDER THAN ZALISSYA. THE DANCING IS OLDER THAN THE FIRE.”"],
      };
      if (blessed) {
        return {
          intro: firstMeeting ? pickLines(L, 0) : ["“THE MOUNTAIN'S GUEST RETURNS. ASK, LITTLE MORTAL.”"],
          topics: [
            { id: "moonstone", label: "The Moonstone", question: "What did you give me?", lines: pickLines(L, 0) },
            { id: "leaving", label: "Going down the mountain", question: "May I go in peace?", lines: pickLines(L, 1) },
            viyTopic,
            courtTopic,
          ],
        };
      }
      if (danced) {
        return {
          intro: firstMeeting ? pickLines(L, 0) : ["“YOU DANCED, LITTLE MORTAL. THERE IS A BLESSING WITH YOUR NAME SCRATCHED ON IT. ASK, AND IT IS YOURS.”"],
          topics: [
            { id: "blessing", label: "Receive the blessing ✦", question: "I offered, and I danced. I have come for the blessing.", lines: [], action: "blessing" },
            { id: "rules", label: "The mountain's rules", question: "What are the rules here?", lines: ["“THE OFFERING IS LAID. THE DANCE IS DANCED. WHAT REMAINS IS MINE TO GIVE. THOSE WERE ALWAYS THE RULES, AND EVEN I OBEY THEM.”"] },
            viyTopic,
            courtTopic,
          ],
        };
      }
      if (offered) {
        return {
          intro: firstMeeting ? pickLines(L, 0) : ["“THE STONE REMEMBERS YOUR FLOWERS. ASK, LITTLE MORTAL.”"],
          topics: [
            { id: "dance", label: "The dance", question: "What must I do now?", lines: pickLines(L, 0, 1) },
            { id: "offering", label: "The offering", question: "Was my offering worthy?", lines: ["“IT WAS LAID TRUE, AND THE STONE REMEMBERS. NOW SHOW THE MOUNTAIN YOUR FEET, LITTLE MORTAL.”"] },
            viyTopic,
            courtTopic,
          ],
        };
      }
      return {
        intro: firstMeeting ? pickLines(L, 0) : ["“ASK, LITTLE MORTAL. THE MOUNTAIN ANSWERS WHAT IT CHOOSES.”"],
        topics: [
          { id: "rules", label: "The rules & the nichnyky", question: "What does the mountain ask of a guest?", lines: pickLines(L, 1, 2) },
          { id: "who", label: "Who are you?", question: "Who presides here?", lines: pickLines(L, 0) },
          viyTopic,
          courtTopic,
        ],
      };
    }
    case "chort": {
      const base = linesForLysa(npc, new Set<string>());
      const rules: DialogueTopic = { id: "rules", label: "House rules", question: "What are the house rules?", lines: pickLines(base, 1) };
      const bigChair: DialogueTopic = {
        id: "beelzebub", label: "Beelzebub", question: "What is he like?",
        lines: ["The big chair? Beelzebub is the sabbath the way the starosta is the village — except his beard is older, his memory is longer, and his blessings are REAL. When you have danced, go and collect yours."],
      };
      if (blessed) {
        return {
          intro: firstMeeting ? pickLines(L, 0) : ["My guest returns! Ask — house rules still apply: no signatures, all gossip."],
          topics: [
            { id: "blessing", label: "Beelzebub's blessing", question: "Did he really bless me?", lines: pickLines(L, 0) },
            { id: "telling", label: "Telling Zalissya", question: "What do I tell the village?", lines: pickLines(L, 1) },
            rules,
          ],
        };
      }
      if (danced) {
        return {
          intro: firstMeeting ? pickLines(L, 0) : ["My guest returns! Ask — house rules still apply: no signatures, all gossip."],
          topics: [
            { id: "dance", label: "The dance", question: "How did I dance?", lines: pickLines(L, 0) },
            bigChair,
            rules,
          ],
        };
      }
      if (offered) {
        return {
          intro: firstMeeting ? pickLines(L, 0) : ["My guest returns! Ask — house rules still apply: no signatures, all gossip."],
          topics: [
            { id: "dance", label: "The dance", question: "What now?", lines: pickLines(L, 0) },
            bigChair,
            rules,
          ],
        };
      }
      if (flowers >= 3) {
        return {
          intro: firstMeeting ? pickLines(L, 0) : ["My guest returns! Ask — house rules still apply: no signatures, all gossip."],
          topics: [
            { id: "offering", label: "The offering stone", question: "What do I do with the nichnyky?", lines: pickLines(L, 0) },
            { id: "dance", label: "The dance", question: "Tell me of the dance.", lines: ["The dance comes after the offering, traveller — ring south of the fire, keep the turn, do not count the steps. Even I cannot waltz a guest's place for them. I checked. Twice. There were incidents."] },
            rules,
          ],
        };
      }
      return {
        intro: firstMeeting ? pickLines(L, 0) : ["My guest returns! Ask — house rules still apply: no signatures, all gossip."],
        topics: [
          { id: "welcome", label: "This place", question: "What is this place?", lines: pickLines(L, 0) },
          rules,
          { id: "nosign", label: "No signatures?", question: "No bargains tonight?", lines: pickLines(L, 2) },
        ],
      };
    }
    case "solokha": {
      return {
        intro: firstMeeting
          ? pickLines(L, 0)
          : ["Back again, ditko? Ask — a witch's ears are her fortune."],
        topics: [
          {
            id: "vesna", label: "Vesna — your sister?", question: "You know Vesna?",
            lines: blessed
              ? pickLines(L, 0)
              : ["“Vesna? My little sister keeps the village's bodies — broth, bandages, babies. I keep its secrets. Between us, Zalissya is entirely kept. Do not tell her I said 'little'.”"],
          },
          {
            id: "offering", label: "The offering", question: "How does the offering go?",
            lines: blessed || danced
              ? ["Laid true and danced after, ditko — the mountain could not ask more of a guest. It will remember you kindly, which for a mountain is a great deal of remembering."]
              : offered
                ? pickLines(L, 0)
                : flowers >= 3
                  ? pickLines(L, 0)
                  : pickLines(L, 1),
          },
          {
            id: "dance", label: "The dance", question: "Tell me of the dance.",
            lines: blessed
              ? ["You kept the turn like you were born in the ring, ditko. The witches still talk about your feet — witches' praise, which is rarer than their curses and twice as binding."]
              : danced
                ? pickLines(L, 0)
                : offered
                  ? pickLines(L, 0)
                  : pickLines(L, 2),
          },
          { id: "cooking", label: "Cooking on the mountain", question: "Are you really the mountain's best cook?", lines: ["“The best cook on this mountain, whatever the devils say with their mouths full. My secret? Never cook for anyone you would not also curse. It concentrates the seasoning.”"] },
        ],
      };
    }
    case "motrya": {
      const base = linesForLysa(npc, new Set<string>());
      const nichLines = pickLines(base, 1);
      if (flowers > 0 && flowers < 3) {
        nichLines.push(`“${flowers} already in your hand, I see — the mountain counts those too. ${3 - flowers} more, ditko.”`);
      }
      return {
        intro: firstMeeting
          ? pickLines(L, 0)
          : ["Motrya looks up from her braiding. “Ask, ditko. The blooms keep.”"],
        topics: [
          { id: "nichnyky", label: "Where nichnyky hide", question: "Where do the night-blooms grow?", lines: nichLines },
          {
            id: "offering", label: "The offering stone", question: "Tell me of the offering stone.",
            lines: offered
              ? pickLines(L, 0)
              : ["“The offering stone stands north of the fire. Three nichnyky, laid gentle, and the mountain leans closer — I have felt it through my shoes, every sabbath of my life.”"],
          },
          {
            id: "dance", label: "The dance", question: "How does one dance here?",
            lines: danced || offered
              ? pickLines(L, 0)
              : ["“South of the fire, ditko, and do not think about your feet. Feet hate being thought about. First the offering, though — the ring keeps no step for the empty-handed.”"],
          },
          {
            id: "moonstone", label: "The Moonstone", question: "What is the Moonstone?",
            lines: blessed
              ? pickLines(L, 0)
              : ["“When the big chair blesses a guest, it is with a moonstone — cold as well-water, kind as moonlight. Offer, dance, and ask him, ditko. In that order; mountains are particular about order.”"],
          },
        ],
      };
    }
    default:
      return null;
  }
}

export const LYSA_BLESSING_LINES: string[] = [
  "The moonstone settles into your palm, cold as well-water and twice as clear. Somewhere inside it, a crescent turns — slowly, patiently — to face you.",
  "Around the bonfire the witches raise their arms, the devils stamp their hooves, and Beelzebub himself inclines his horned head. The sabbath has a new story to tell about a mortal who came polite, offered fairly, and danced.",
  "You wear Lysa Hora's blessing now. The night road down to Zalissya will be shorter than the road up. It always is, for the blessed — that is rather the point of blessings.",
];

// The Chort's bargain is a real choice, made mid-dialogue at the signature
// line. These are the scripts that play out after each answer.
export const CHORT_SIGNED_LINES: string[] = [
  "Signed! SIGNED! Oh, traveller — you have made a devil's whole century. Here: your gold. Feel how it never gets lighter? That is the good stuff. That is the SABBATH stuff.",
  "And no take-backs… well. One take-back, because I LIKE you: pond fish buys your soul back any time — the price is in your Character sheet, under Charisma. Devils and fish, traveller. Do not ask. Now — notice anything missing when you walk in the sun? Look down. Heh. HEH.",
];
export const CHORT_REFUSED_LINES: string[] = [
  "…No? NO? Hah! Hahaha! Oh, I LIKE you. The last one who refused me became a starosta; the one before — a very surprised frog. Keep your soul then, traveller. But when Viy stirs and you need a friend with a pitchfork — you know where the millstone is. My prices only go UP.",
];
export const CHORT_TRADE_LINES: string[] = [
  "Pond fish, still shining. …A deal is a deal, traveller. Here — one soul, slightly haunted, returns to its owner. And keep the gold. A devil's gold spends the same, and I am not a CHEAT.",
  "There. Feel that? Warmth. Weight. A shadow pooling at your feet like it never left. Pleasure doing business. Tell NO ONE I went soft.",
];

// The well is not a person, but it answers wishes with dialogue anyway.
export const WELL_NPC: Npc = {
  id: "well", name: "The Old Well", pron: "", role: "Drop a pebble, make a wish",
  x: 840, y: 496, tunic: "#5d6b72", hair: "#8d8b85", style: "elder",
};

// Vesna's drying rack is not a person either, but at INT 3+ it has a
// menu: the recipe choice is made through the dialogue choice buttons.
export const BREW_BENCH_NPC: Npc = {
  id: "brewbench", name: "Vesna's drying rack", pron: "", role: "Alchemy bench · choose a brew",
  x: BREW_SPOT.x, y: BREW_SPOT.y, tunic: "#4c6b35", hair: "#5d3a1a", style: "herbalist",
};

export const BREW_CHOICE_LINES: string[] = [
  "The rack smells of polyn and sun, and the little cauldron is already warm. Two brews are within your craft: the common tonic (2 herbs — bright and clarifying), and Vesna's strong tonic (3 herbs — the deep draught she teaches only at INT 3; drunk, it is worth INT +2 and WIS +2). The cauldron waits. Which do you work?",
];