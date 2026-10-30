import { type DialogueTopic } from "./topics";
import { flagCount, flagHas } from "../systems/flags";

// --- Viy's night: the story that closes the first act ----------------------
// After you have looked upon Viy, he begins to stir. Myroslav remembers the
// old way — a ring of blessed chalk, eyes turned away when he calls for his
// lids, and a whole night held until the rooster crows (the shape of
// Gogol's tale, minus the poor seminarian's ending). Vesna and Radek can
// each make the night easier; the spirits all have an opinion. These
// topics are appended to the village conversations from App.tsx; a topic
// with `grant` hands over an item the moment it is asked (the lines are
// written for the state that will be true once it is given).

export type VigilGrant = "chalk" | "wreath" | "ironward";

export type VigilContext = {
  flags: ReadonlySet<string>;
  talked: ReadonlySet<string>;
  wis: number;
  herbStock: number;
};

// Requirements, shared by the topic text and by App.tsx when it grants.
export const WREATH_HERBS = 3;
export const WREATH_WIS = 2;

export function canWeaveWreath(c: VigilContext): boolean {
  return c.herbStock >= WREATH_HERBS && c.wis >= WREATH_WIS;
}

export function canForgeWard(c: VigilContext): boolean {
  return flagCount(c.flags, "forged") >= 1;
}

export function vigilTopics(npcId: string, c: VigilContext): DialogueTopic[] {
  const f = c.flags;
  const seen = c.talked.has("viy");
  const chalk = flagHas(f, "chalk");
  const sealed = flagHas(f, "viySealed");
  const broken = flagCount(f, "vigilBroken");
  if (!seen) return [];

  switch (npcId) {
    case "myroslav":
      if (sealed) {
        return [{
          id: "vigil-after", label: "The night you kept ✦", question: "Is it truly over?",
          lines: [
            "Over? The rooster crowed, the lids fell, and the hollow is only a hollow now — grass, stones, a ring of chalk the rain has not dared to wash. My grandfather's grandfather would have stood you a whole barrel for this, traveller.",
            "I have no barrel. I have a village that sleeps easy. Stay as long as you like — you are no guest in Zalissya any more.",
          ],
        }];
      }
      if (!chalk) {
        return [{
          id: "oldway", label: "Viy stirs — the old way", question: "Viy stirs in his sleep. How did Zalissya keep him down before?",
          grant: "chalk",
          lines: [
            "You saw the seam of red under his lid. So did my grandfather's grandfather, once. He said Viy stirs every few lifetimes, and someone must sit up with him through one whole night, or he wakes for good.",
            "The old way is this. Draw a ring of blessed chalk by his hollow, after dark. Stand inside it until the rooster crows. The nechyst, the unclean host, will crawl at the chalk, and you drive them back with the old words.",
            "And when he roars for his servants to LIFT HIS EYELIDS, look away. Whatever you hear, look away. Those who meet Viy's eyes do not come home.",
            "Here, the chalk. It has sat in the church chest for eighty years, waiting. Vesna knows a wreath that dulls his gaze, and Radek's iron burns the unclean. Ask them. Then pick your night.",
          ],
        }];
      }
      return [{
        id: "vigil", label: "The vigil", question: "Tell me the old way again.",
        lines: [
          "After dark (from nine in the evening until four) draw the chalk ring at his hollow. Ward the host back from the chalk. When the lids rise, LOOK AWAY, and keep looking away while the gaze is open. Hold until the rooster crows.",
          broken > 0
            ? `You have tried ${broken === 1 ? "once" : `${broken} times`} and come back on your own feet. That is more than most. Eat well, rest, and go again. A steadier heart (Constitution) holds more fear.`
            : "Eat before you go. A full belly holds more fear than an empty one, my grandmother said, and she buried three husbands and no regrets.",
        ],
      }];

    case "vesna": {
      if (sealed) {
        return [{
          id: "vigil-after", label: "After the vigil", question: "Did the wreath help?",
          lines: ["It helped, but you held. A wreath only dulls what you are brave enough to turn away from. The meadow feels lighter since that night, and so does my sleep."],
        }];
      }
      if (!chalk || flagHas(f, "wreath")) return [];
      const ok = canWeaveWreath(c);
      return [{
        id: "wreath", label: "A wreath against his eyes", question: "Myroslav says you know a wreath against Viy's gaze.",
        ...(ok ? { grant: "wreath" as const } : {}),
        lines: ok
          ? [
              "I do. Polyn for bitterness, which the unclean hate, zvirobiy for the sun it keeps in its petals, and a sprig of dereviy to bind them. Give me three herbs from your satchel.",
              "There. Wear it low over your brow. When the lids rise, his gaze will catch in the leaves before it catches you: it takes half the harm. Half, znakharka. Still look away.",
            ]
          : [
              "I do: polyn, zvirobiy and dereviy, woven tight. It catches half of Viy's gaze before it reaches you.",
              c.wis < WREATH_WIS
                ? `But you must know zvirobiy to pick it rightly, and your eye is not there yet (WIS ${c.wis}, it takes ${WREATH_WIS}). Gather the other herbs; the eye grows with the gathering.`
                : `Bring me ${WREATH_HERBS} herbs in your satchel; you have ${c.herbStock}. The glowing patches provide.`,
            ],
      }];
    }

    case "radek": {
      if (sealed) {
        return [{
          id: "vigil-after", label: "After the vigil", question: "Did the iron sing?",
          lines: ["Sang? It SCREAMED, I hear, the moment the first of them touched it. Good iron, that. Good arm that hammered it, too. In my village they would carve your name over the smithy door. Here, I will settle for a horseshoe with your initial."],
        }];
      }
      if (!chalk || flagHas(f, "ironward")) return [];
      const ok = canForgeWard(c);
      return [{
        id: "ironward", label: "Iron for the vigil", question: "Can iron help against Viy's host?",
        ...(ok ? { grant: "ironward" as const } : {}),
        lines: ok
          ? [
              "Can it? Unclean things cannot abide cold iron. Give me one of the pieces you forged here. I will draw it into nails, three of them, and you drive them into the chalk.",
              "There. The first three of that host to touch your ring will burn like straw. After that it is your words and your nerve, friend.",
            ]
          : flagHas(f, "horseshoe")
            ? ["It can. Bring me one piece you have forged yourself, from my anvil, and I will draw it into nails for your chalk ring. Work the forge, then come back."]
            : ["It can, but my forge is cold. Bring me the bog iron from the pond mud first, and when the fire is lit, forge me a piece with your own arm."],
      }];
    }

    case "domovyk":
      return sealed
        ? [{ id: "vigil-after", label: "After the vigil", question: "Did you hear the rooster, little landlord?", lines: ["Hear him? I fed him a crust that morning myself! Oh, the whole hut sighed when he crowed. You can sleep in my bed as long as you like, keeper. I will even stop hiding your boots. Mostly."] }]
        : chalk
          ? [{ id: "vigil", label: "The vigil", question: "Any advice for the night?", lines: ["Sleep first. My bed is yours: lie down, and if you ask nicely I will wake you at dusk. And look AWAY, keeper. I have seen what looking does. I do not want to sweep it up."] }]
          : [];

    case "lisovyk":
      return sealed
        ? [{ id: "vigil-after", label: "After the vigil", question: "The forest is quieter.", lines: ["Quieter? The forest is LISTENING. It has not heard that hollow empty in a hundred winters. The birds sing there now. I may let the paths go straight for you, keeper. Now and then."] }]
        : chalk
          ? [{ id: "vigil", label: "The vigil", question: "Will the forest help me?", lines: ["The forest helps no one; it watches. But I will tell you a forest thing: the host comes from every side at once, and the wise one lets them come close and drives them all back together. Waste no words on one shadow."] }]
          : [];

    case "chort":
      return sealed
        ? [{ id: "vigil-after", label: "After the vigil", question: "Were you watching?", lines: ["Watching? I had a SEAT. Front row, on the millstone. Oh, the screaming of that nechyst on Radek's iron, music! And when the rooster went off… well. Let us say I left early. Business reasons. You owe me nothing. That is a first."] }]
        : chalk
          ? [{ id: "vigil", label: "The vigil", question: "Will you help with Viy?", lines: ["Help? I am a devil, not a starosta! …But I will give you this for free, which hurts me: the lids rise SLOWLY. You have time to drive back the host while they are rising, then turn away at the last moment. Do not tell anyone I was useful."] }]
          : [];

    case "bolotianyk":
      return sealed
        ? [{ id: "vigil-after", label: "After the vigil", question: "Did the pond feel it?", lines: ["“The pond felt him SINK, dry one. Deep, past my bells, past the bottom of everything. He will not come up through my water. I have never been glad of a guest before.”"] }]
        : chalk
          ? [{ id: "vigil", label: "The vigil", question: "What do you know of Viy's host?", lines: ["“While the lids are rising, the host still crawls. When the lids are OPEN, even the host holds still: they fear what is under there too. Count on that, dry one. And bring the iron. They hate iron.”"] }]
          : [];
  }
  return [];
}

// Viy himself, by state. Before the chalk he is narration only; with the
// chalk in hand the vigil begins from the prompt at his hollow (App.tsx).
export function viyNarration(f: ReadonlySet<string>, night: boolean): string[] | null {
  if (flagHas(f, "viySealed")) return null;
  if (flagHas(f, "chalk") && !night) {
    return [
      "In daylight the hollow only breathes. The servants doze against their forks. Nothing will happen here until dark. The chalk waits in your pocket. Come back after nine in the evening, or rest in the Domovyk's bed until dusk.",
    ];
  }
  if (!flagHas(f, "chalk") && night) {
    return [
      "By night the hollow breathes louder. The servants are awake, leaning on their forks, whispering at the lids. The red seam under one of them is wider than before.",
      "This is not a thing to face with empty hands. Myroslav is old enough to remember what Zalissya used to do. Ask him.",
    ];
  }
  return null;
}

export const VIGIL_INTRO_LINES: string[] = [
  "You kneel and draw the chalk ring, one unbroken line around you. The servants stop whispering. Somewhere in the dark something laughs, then many somethings.",
  "Remember. WARD drives back every spirit near the chalk. When Viy roars for his lids, the lids rise slowly; turn away before they open, and hold LOOK AWAY until they fall. Hold until the rooster crows.",
];

export const VIGIL_WON_LINES: string[] = [
  "Far off in Zalissya the rooster crows. Once. Twice. The host shrieks and scatters like ash in wind.",
  "The servants drop their forks. Viy's lids fall closed with a sound like a door slamming under the earth. Then the hollow sinks: boulder-head, lids, servants and all, down past the roots. The grass closes over it.",
  "Dawn comes up pink over the pines. You are still inside the chalk. You never looked. ✦",
];

export const VIGIL_BROKEN_LINES: string[] = [
  "Your nerve breaks. You are out of the circle and running before you know it. Branches, the fence, the Domovyk's door…",
  "You wake in his bed at morning, boots off and a blanket tucked to your chin. The chalk is still in your pocket. Viy still sleeps, and the night can be tried again.",
];
