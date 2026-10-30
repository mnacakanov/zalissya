import { LYSA_SUMMIT } from "./lysa";

// --- People -----------------------------------------------------------------

export type Npc = {
  id: string;
  name: string;
  pron: string;
  role: string;
  x: number;
  y: number;
  tunic: string;
  hair: string;
  style: "elder" | "herbalist" | "smith" | "domovyk" | "lisovyk" | "viy" | "chort" | "bolotianyk" | "witch" | "beelzebub" | "dancer";
};

export const NPCS: Npc[] = [
  { id: "myroslav", name: "Myroslav", pron: "my-ro-SLAHV", role: "Starosta · village elder", x: 760, y: 520, tunic: "#7a4a2b", hair: "#cfc8bb", style: "elder" },
  { id: "vesna", name: "Vesna", pron: "VEHS-nah", role: "Znakharka · healer", x: 1196, y: 824, tunic: "#a83c32", hair: "#5d3a1a", style: "herbalist" },
  { id: "radek", name: "Radek", pron: "RAH-dek", role: "Blacksmith · a guest from afar", x: 340, y: 806, tunic: "#4c4a48", hair: "#2e2018", style: "smith" },
];

// The spirits — present in the world, approachable, talkable. Positions here
// are home anchors; charPos() adds each spirit's slow wander on top.
export const SPIRITS: Npc[] = [
  { id: "domovyk", name: "Domovyk", pron: "do-mo-VYK", role: "House spirit · keeper of the pich", x: 430, y: 352, tunic: "#6e5136", hair: "#8a6f4d", style: "domovyk" },
  { id: "lisovyk", name: "Lisovyk", pron: "lee-so-VYK", role: "Forest spirit · lord of the pines", x: 1010, y: 196, tunic: "#33502e", hair: "#4c6b35", style: "lisovyk" },
  { id: "chort", name: "Chort", pron: "chort", role: "Чорт · devil and trickster — mind your soul", x: 545, y: 1052, tunic: "#7e2430", hair: "#2b2320", style: "chort" },
  { id: "bolotianyk", name: "Bolotianyk", pron: "bo-lo-TYAH-nyk", role: "Swamp demon · the pond's dark keeper", x: 1182, y: 992, tunic: "#3d5548", hair: "#5d7050", style: "bolotianyk" },
  { id: "viy", name: "Viy", pron: "veey", role: "Вій · the Big Boss — asleep, for now", x: 1420, y: 268, tunic: "#3a3444", hair: "#55506a", style: "viy" },
];

export const ALL_CHARS: Npc[] = [...NPCS, ...SPIRITS];
export const VILLAGER_IDS = new Set(NPCS.map((n) => n.id));

// The hut residents, indoors: the same people (same ids, so meeting
// them inside counts the same as outside), anchored in their rooms.
// The Domovyk keeps by his pich; Vesna keeps by her work table. They
// are home when you step in — a house spirit never leaves his house,
// and the znakharka is in for the evening.
export const DOMOVYK_IN: Npc = {
  id: "domovyk", name: "Domovyk", pron: "do-mo-VYK", role: "House spirit · keeper of the pich",
  x: 330, y: 165, tunic: "#6e5136", hair: "#8a6f4d", style: "domovyk",
};
export const VESNA_IN: Npc = {
  id: "vesna", name: "Vesna", pron: "VEHS-nah", role: "Znakharka · healer",
  x: 250, y: 320, tunic: "#a83c32", hair: "#5d3a1a", style: "herbalist",
};

// --- Lysa Hora people -------------------------------------------------------
// The sabbath host. The Chort here is the same devil as by the millstone
// (same id, so meeting him in either place counts once) — but on the
// mountain he is working, and his script is the sabbath script.
export const LYSA_CHARS: Npc[] = [
  { id: "beelzebub", name: "Beelzebub", pron: "be-EL-ze-bub", role: "Host of the sabbath · lord of Lysa Hora", x: 660, y: 220, tunic: "#3a2438", hair: "#1c1420", style: "beelzebub" },
  { id: "chort", name: "Chort", pron: "chort", role: "Чорт · master of ceremonies tonight", x: 770, y: 330, tunic: "#7e2430", hair: "#2b2320", style: "chort" },
  { id: "solokha", name: "Solokha", pron: "so-lo-KHA", role: "Vidma · witch of Dikanka way", x: 545, y: 330, tunic: "#4a2c5a", hair: "#c8c2b8", style: "witch" },
  { id: "motrya", name: "Motrya", pron: "MO-trya", role: "Vidma · keeper of the night-blooms", x: 520, y: 480, tunic: "#2c4a5a", hair: "#3a2a1a", style: "witch" },
];

// The dancing witches — presences, not conversations. They circle the
// bonfire all night; charPos() walks them round it.
export const LYSA_DANCERS: Npc[] = [0, 1, 2, 3].map((i) => ({
  id: `dancer${i}`,
  name: "Dancing witch",
  pron: "",
  role: "Of the sabbath",
  x: LYSA_SUMMIT.x,
  y: LYSA_SUMMIT.y,
  tunic: ["#5a2c44", "#2c3a5a", "#5a442c", "#3a5a2c"][i] ?? "#444",
  hair: ["#d8d2c4", "#2e2018", "#8a4a2a", "#555"][i] ?? "#333",
  style: "dancer" as const,
}));

// Where a character actually is at time `now`: villagers stand still, the
// Domovyk shuffles by his hut, the Lisovyk drifts along the pine edge.
// Viy does not move. Viy will never move. That is rather the point.
export function charPos(ch: Npc, now: number): { x: number; y: number } {
  if (ch.id === "domovyk") {
    return {
      x: ch.x + Math.sin(now * 0.00031) * 22,
      y: ch.y + Math.cos(now * 0.00043) * 6,
    };
  }
  if (ch.id === "lisovyk") {
    return {
      x: ch.x + Math.sin(now * 0.00011) * 155,
      y: ch.y + Math.sin(now * 0.00023) * 13,
    };
  }
  if (ch.id === "chort") {
    // The Chort paces by the old millstone like a merchant who has
    // nowhere better to be — which, for a devil, is suspicious.
    return {
      x: ch.x + Math.sin(now * 0.00019) * 72,
      y: ch.y + Math.cos(now * 0.00029) * 8,
    };
  }
  if (ch.id === "bolotianyk") {
    // He does not walk. He rises and settles in the pond shallows.
    return { x: ch.x, y: ch.y + Math.sin(now * 0.0009) * 4 };
  }
  if (ch.style === "dancer") {
    // The sabbath dance: a slow ring around the bonfire, never hurrying,
    // never stopping. Each witch keeps her own quarter of the circle.
    const idx = Number(ch.id.replace("dancer", "")) || 0;
    const a = now * 0.00042 + (idx * Math.PI) / 2;
    return {
      x: LYSA_SUMMIT.x + Math.cos(a) * 92,
      y: LYSA_SUMMIT.y + Math.sin(a) * 62,
    };
  }
  if (ch.id === "solokha") {
    return { x: ch.x + Math.sin(now * 0.00021) * 16, y: ch.y + Math.cos(now * 0.00033) * 5 };
  }
  return { x: ch.x, y: ch.y };
}