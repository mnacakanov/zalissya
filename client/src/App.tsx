import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { SafeAreaTopScrim } from "@hatch/space-sdk/client";
import { api } from "./api";

// ---------------------------------------------------------------------------
// Zalissya — a Ukrainian village clearing. Top-down pixel-art game on canvas.
// All names use Ukrainian romanization (the system S.T.A.L.K.E.R. 2 uses:
// Chornobyl, not Chernobyl) — г→h, х→kh, ч→ch, ш→sh, щ→shch, ц→ts, ж→zh,
// ю→yu, я→ya, є→ye, ї→yi, и→y.
// Movement: hold-to-move direction pad (bottom-left), WASD / arrows on
// desktop. NOT a drag joystick: on the user's phone a downward drag is
// claimed by the host's pull-to-refresh before the page can use it, and two
// generations of page-level locks (overscroll-behavior, touch-action,
// non-passive touchmove prevention, scroller snapping) did not stop it —
// a stationary hold produces no refresh gesture at all.
// Skills grow by doing: gathering any herb raises Herbalism.
// Naming rule: villages, people, spirits/monsters and herbs keep Ukrainian
// names (Zalissya, Myroslav, Lisovyk; herbs: Kropyva, Polyn, Kalendula,
// Zvirobij, Derevij); skill names stay English (Herbalism).
// Spirits are real presences, not just dialogue mentions: the Domovyk keeps
// to the hut by the pich, the Lisovyk walks the pine edge, a Chort (Чорт)
// lounges by the old millstone offering to buy your soul (a nod to the
// devil host of Dakhno's Cossacks cartoons and their mill sabbath), the
// Bolotianyk (болотяник) rises from the pond shallows, and Vij (Вій) —
// the game's big boss — sleeps in a hollow at the north-east forest edge,
// eyelids hanging to the ground. He is approachable and ominous, but the
// boss fight itself is not built yet: nobody wakes him. For now.
// Houses are called huts in English (user direction — no "khata").
// Non-combat village life (this build): fishing at the pond with a
// bite-timing minigame (Fishing skill grows by catching), a crust of bread
// by the campfire that the Domovyk is waiting for (offer it at his hut's
// pich for a keepsake), the Chort's bargain as a REAL choice — sign and he
// takes your shadow, then buy your soul back with fish — a wishing well,
// bog iron in the pond mud for Radek's cold forge, chickens that scatter,
// and a satchel of keepsakes in the HUD. Quest state lives in save "flags"
// (plain names, plus "name=n" counters like "fish=3").
// Stats & skills (this build): the classic six stats — STR, DEX, CON,
// INT, WIS, CHA — all start at 1, KCD-style: a stat's base IS the level
// of the skill that feeds it (Smithing→STR, Fishing→DEX, Cooking→CON,
// Alchemy→INT, Herbalism→WIS; CHA grows as you meet people). Skills grow
// only by doing. Keepsakes and tonics add bonuses on top, and the totals
// bite back into the world: DEX widens the fishing bite window, CON is
// walking pace, WIS finds double herbs, INT brews double tonics, and a
// silver tongue (CHA ≥ 4) talks the Chort's soul price down from 3 fish
// to 2. New work: cook karas soup at the campfire (1 fish + 1 herb),
// work Radek's lit forge, and brew tonics at Vesna's drying rack by the
// north-east hut (2 herbs). Spendable stocks live in flags too:
// "herbStock=n" herbs in hand, "fish=n" fish in hand, "fishTotal=n"
// lifetime catch (drives Fishing level), "cooked=n"/"meals=n",
// "smithed=n"/"forged=n", "brewed=n"/"potions=n".
// Stat-influenced activities (this build): the totals now GATE and
// SHAPE the work itself. Carry capacity is 6 + 2×STR total (weights:
// bog iron 3, forged piece 2, fish 1, herb 1, nichnyky 0) — a full
// satchel blocks pickups with a toast naming the weight and your STR,
// and iron for Radek is hauled in your arms (it counts toward the load
// once dug, but the dig itself is checked against your satchel load so
// the forge quest can never soft-lock). Alchemy has tiers: at INT ≥ 3
// the rack offers a recipe choice and Vesna's strong tonic unlocks
// (3 herbs; INT +2, WIS +2 drunk — "strongPotions=n" / "strongtonic").
// Honest stat checks with visible failures that consume nothing: the
// deepest bog-iron lump takes a STR check (certain at STR 3, a gamble
// below), Zvirobij will not be known until WIS 2, the well's lucky
// pebble answers a CHA-scaled roll, and DEX tilts the catch table
// toward pike and perch and away from the boot.
// Lysa Hora (this build): a second area — the Bald Mountain — reached by
// walking the east trail out of the clearing (and back the same way).
// A bare, rocky, moonlit summit where the Chort hosts a sabbath: witches
// dance around a great bonfire, Beelzebub presides, broomsticks lean on
// the standing stones. A non-combat chain lives there: gather nichnyky
// (night-blooms) on the slopes → lay them on the offering stone → join
// the dance → receive the Moonstone keepsake (WIS +1, CHA +1). The save
// now carries the current area alongside x/y, so a reload restores the
// player on whichever side of the trail they left.
// Branching dialogue (this build): conversations are topic-driven.
// Talking opens a short greeting (full introduction first time, brief
// welcome after), then a menu of questions the player picks in any
// order — answers are 1–3 lines, state-aware because they are dealt
// out of the same linesFor/linesForLysa scripts by subject, and asked
// topics stay available, marked ✓. The scripted beats stay scripted:
// Vij's narration, the well, the brew bench, the Chort's bargain (now
// a topic whose answer ends in the Sign / Keep my soul choice), the
// soul buy-back, and Beelzebub's blessing (a topic after the dance).
// Hut interiors (this build): two of the village huts have insides now —
// "hut0", the Domovyk's north-west hut (his pich lives there, and the
// bread offering + his gift of thanks happen at the pich INSIDE now),
// and "hut1", Vesna's south-east hut — the one she actually stands
// beside, by her garden (bed, work table, a cauldron corner, herb
// bundles overhead). The forge hut and the north-east hut stay
// facades — no prompt, no entry. Entering is walking into the
// door (the Lysa trail pattern) or the Step inside prompt at the door;
// leaving is walking out of the interior's south door or its prompt.
// Each interior is its own small area with its own spawn just inside
// the door, and the save's area round-trips it like Lysa Hora — the
// area column is plain text, so hut0/hut1 needed only the action
// enum widened, no migration. World geometry is interior-sized, so
// the camera follows the same clamp math with nothing special-cased.
// Slim HUD + quest log (this build): the always-on overlay had grown
// to duplicate the Character sheet (skill levels, stat totals,
// carrying, keepsakes), so it now shows only what a player needs at
// a glance — where they are, the current objective, and two urgent
// warnings (soulless, over the carry limit). Everything else lives
// in the Character sheet. The single-line objective also hid the
// parallel threads (the Domovyk's bread, Radek's forge, the Lysa
// sabbath…), so a Quests menu joins Character in the same sheet:
// every thread with its progress, the current step marked, grouped
// as Story / Village life / Lysa Hora. Quest state is derived from
// the same flags and counters as everything else — no new storage.
// ---------------------------------------------------------------------------

const WORLD_W = 1680;
const WORLD_H = 1260;
const PLAYER_SPEED = 175;
const PLAYER_R = 13;
const SPAWN = { x: 840, y: 760 };

type AreaId = "village" | "lysa" | "hut0" | "hut1";
const LYSA_W = 1280;
const LYSA_H = 920;
const LYSA_SPAWN = { x: 92, y: 470 }; // west trailhead, arriving from Zalissya
const VILLAGE_RETURN = { x: 1618, y: 452 }; // east edge of the clearing
// Hut interiors: one shared room size, entered from the village doors.
// hut0 is the Domovyk's north-west hut (door front at village 384,314);
// hut1 is Vesna's south-east hut (door front at village 1285,796) —
// the hut she stands beside outdoors, by her garden. (Her drying
// rack stays up by the north-east hut; the hut itself is hers.)
const HUT_W = 820;
const HUT_H = 600;
const HUT_SPAWN = { x: 410, y: 462 }; // just inside the interior door
const HUT_DOOR_IN = { x: 410, y: 478 }; // the interior door mat (exit prompt)
const VILLAGE_FROM_HUT0 = { x: 384, y: 352 }; // back out, at the NW hut's door
const VILLAGE_FROM_HUT1 = { x: 1285, y: 824 }; // back out, at the SE hut's door
function isHutArea(area: AreaId): boolean {
  return area === "hut0" || area === "hut1";
}
// The village trail out: the east edge, between the two trail-marker pines.
const TRAIL_Y_MIN = 380;
const TRAIL_Y_MAX = 530;
function worldSize(area: AreaId): { w: number; h: number } {
  if (area === "lysa") return { w: LYSA_W, h: LYSA_H };
  if (isHutArea(area)) return { w: HUT_W, h: HUT_H };
  return { w: WORLD_W, h: WORLD_H };
}

type Rect = { x: number; y: number; w: number; h: number };

function hash2(x: number, y: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function circleRectCollide(cx: number, cy: number, r: number, b: Rect): boolean {
  const nx = clamp(cx, b.x, b.x + b.w);
  const ny = clamp(cy, b.y, b.y + b.h);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

// --- World layout -----------------------------------------------------------

const HOUSES: Array<Rect & { kind: "hut" | "forge" }> = [
  { x: 300, y: 210, w: 168, h: 104, kind: "hut" },
  { x: 1140, y: 190, w: 168, h: 104, kind: "hut" },
  { x: 1210, y: 700, w: 150, h: 96, kind: "hut" },
  { x: 250, y: 690, w: 156, h: 92, kind: "forge" },
];

const WELL: Rect = { x: 806, y: 470, w: 68, h: 52 };
const FIRE: Rect = { x: 806, y: 596, w: 68, h: 44 };
const POND = { x: 1330, y: 1010, rx: 165, ry: 92 };
const GARDEN: Rect = { x: 1150, y: 850, w: 150, h: 96 };

type TreeKind = "pine" | "birch" | "oak";
const TREES: Array<{ x: number; y: number; kind: TreeKind; s: number }> = [];
{
  // Forest ring around the clearing plus a few shade trees inside.
  const ring: Array<[number, number]> = [
    [90, 120], [220, 80], [380, 70], [560, 60], [760, 66], [960, 60], [1150, 70],
    [1330, 80], [1500, 110], [1590, 260], [1600, 460], [1590, 660], [1560, 860],
    [1470, 1080], [1240, 1160], [1010, 1180], [790, 1170], [570, 1180], [350, 1160],
    [150, 1090], [70, 900], [60, 690], [66, 480], [80, 300],
    [620, 150], [1010, 140], [700, 1080], [480, 980], [180, 560], [1480, 420],
    [980, 330], [560, 420], [90, 760], [1520, 620],
  ];
  const kinds: TreeKind[] = ["pine", "birch", "oak"];
  ring.forEach(([x, y], i) => {
    TREES.push({ x, y, kind: kinds[i % 3] ?? "pine", s: 0.9 + hash2(x, y) * 0.45 });
  });
}

const FENCES: Rect[] = [
  { x: GARDEN.x - 8, y: GARDEN.y - 10, w: GARDEN.w + 16, h: 10 },
  { x: GARDEN.x - 8, y: GARDEN.y + GARDEN.h, w: GARDEN.w + 16, h: 10 },
  { x: GARDEN.x - 8, y: GARDEN.y - 10, w: 10, h: GARDEN.h + 20 },
  { x: 560, y: 250, w: 120, h: 10 },
  { x: 960, y: 250, w: 120, h: 10 },
];

const SOLID: Rect[] = [
  ...HOUSES.map((h) => ({ x: h.x, y: h.y + 26, w: h.w, h: h.h - 26 })),
  WELL,
  FIRE,
  // Vij's bulk — the boss sleeps in the north-east hollow; you cannot walk
  // through him (and you would not want to).
  { x: 1352, y: 196, w: 136, h: 84 },
  ...TREES.map((t) => ({ x: t.x - 10, y: t.y - 8, w: 20, h: 14 })),
  ...FENCES,
];

// --- Lysa Hora layout -------------------------------------------------------
// The Bald Mountain: a bare rocky dome (no forest, no grass to speak of)
// under a crescent moon. The summit holds a ring of standing stones, a
// great sabbath bonfire, an offering stone, and Beelzebub's seat.
const LYSA_SUMMIT = { x: 660, y: 400 };
const LYSA_FIRE: Rect = { x: 626, y: 374, w: 68, h: 50 };
const LYSA_OFFER_SPOT = { x: 660, y: 268 }; // the offering stone, north of the fire
const LYSA_DANCE_SPOT = { x: 660, y: 492 }; // south of the fire, inside the ring
const LYSA_THRONE: Rect = { x: 612, y: 148, w: 96, h: 44 };
const LYSA_RING_R = 148; // standing-stone ring radius (x), squashed in y

const LYSA_STONES: Array<{ x: number; y: number; h: number }> = [];
for (let i = 0; i < 11; i++) {
  const a = (i / 11) * Math.PI * 2 + 0.3;
  const sx = LYSA_SUMMIT.x + Math.cos(a) * LYSA_RING_R;
  const sy = LYSA_SUMMIT.y + Math.sin(a) * LYSA_RING_R * 0.68;
  // Leave a gap in the ring at the west (trail) and south (dance) sides.
  if (Math.abs(sx - (LYSA_SUMMIT.x - LYSA_RING_R)) < 30) continue;
  LYSA_STONES.push({ x: sx, y: sy, h: 26 + hash2(i, 733) * 16 });
}

const LYSA_SOLID: Rect[] = [
  LYSA_FIRE,
  LYSA_THRONE,
  { x: LYSA_OFFER_SPOT.x - 20, y: LYSA_OFFER_SPOT.y - 8, w: 40, h: 20 },
  ...LYSA_STONES.map((s) => ({ x: s.x - 7, y: s.y - 10, w: 14, h: 14 })),
  // Scattered summit boulders — the mountain is bald, not smooth.
  { x: 300, y: 250, w: 34, h: 20 }, { x: 980, y: 300, w: 40, h: 22 },
  { x: 420, y: 640, w: 30, h: 18 }, { x: 900, y: 660, w: 36, h: 20 },
  { x: 1080, y: 520, w: 28, h: 18 }, { x: 210, y: 560, w: 26, h: 16 },
];

// Nichnyky — night-blooms that open only on the bald summit. Gathering
// three is the offering the sabbath asks for (they are flowers, not the
// village herbs, and do not feed Herbalism).
const LYSA_FLOWER_SPOTS: Array<{ x: number; y: number }> = [
  { x: 380, y: 330 }, { x: 520, y: 560 }, { x: 830, y: 580 },
  { x: 950, y: 240 }, { x: 300, y: 700 }, { x: 1080, y: 430 },
];

// --- Hut interior layout ----------------------------------------------------
// One room shape for both enterable huts: log walls 30 thick around a
// plank floor, the door a gap in the south wall centred on x=410 (the
// gap is wide enough for the player's collision circle to pass, and
// walking out of it — y past the room's south edge — exits to the
// village, Lysa-trail style). Furniture differs per hut: the Domovyk's
// hut0 is built around the pich (the great clay stove, NW) with a
// woodpile, a table, and a bed; Vesna's hut1 has her bed, a work table,
// a cauldron hearth in the NE corner, and her herb shelf on the north
// wall. Only hut0 and hut1 exist — the forge and the north-east hut
// have no doors that open.
const HUT_WALLS: Rect[] = [
  { x: 70, y: 64, w: 680, h: 30 }, // north
  { x: 70, y: 64, w: 30, h: 472 }, // west
  { x: 720, y: 64, w: 30, h: 472 }, // east
  { x: 70, y: 506, w: 302, h: 30 }, // south, west of the door gap
  { x: 448, y: 506, w: 302, h: 30 }, // south, east of the door gap
];
const HUT0_SOLID: Rect[] = [
  ...HUT_WALLS,
  { x: 110, y: 94, w: 150, h: 96 }, // the pich
  { x: 110, y: 210, w: 64, h: 36 }, // the woodpile
  { x: 345, y: 280, w: 130, h: 60 }, // the table
  { x: 560, y: 94, w: 150, h: 70 }, // the bed
];
const HUT1_SOLID: Rect[] = [
  ...HUT_WALLS,
  { x: 110, y: 94, w: 150, h: 70 }, // Vesna's bed
  { x: 600, y: 94, w: 80, h: 80 }, // the cauldron hearth
  { x: 330, y: 270, w: 130, h: 60 }, // her work table
  { x: 300, y: 94, w: 240, h: 18 }, // the herb shelf
];
function hutSolids(area: AreaId): Rect[] {
  return area === "hut1" ? HUT1_SOLID : HUT0_SOLID;
}

// Gatherable herbs — all keep their Ukrainian names; gathering any of them
// counts toward the Herbalism skill. Each kind has its own colours so the
// patches read differently in the grass.
type HerbKind = "kropyva" | "polyn" | "kalendula" | "zvirobij" | "derevij";

type HerbDef = {
  name: string;
  pron: string;
  gloss: string;
  glow: string; // rgba prefix "r,g,b" for the patch halo
  flower: string;
  flowerCore: string;
  leaf: string;
};

const HERBS: Record<HerbKind, HerbDef> = {
  kropyva: { name: "Kropyva", pron: "kro-py-VAH", gloss: "nettle", glow: "120,220,110", flower: "#b9e39a", flowerCore: "#eaf7d0", leaf: "#3f7a2e" },
  polyn: { name: "Polyn", pron: "po-LYN", gloss: "wormwood", glow: "200,205,190", flower: "#d8dcc8", flowerCore: "#f2f2e2", leaf: "#7d8a72" },
  kalendula: { name: "Kalendula", pron: "ka-len-DOO-lah", gloss: "calendula", glow: "255,150,50", flower: "#f28c1e", flowerCore: "#ffd76a", leaf: "#4c7a2e" },
  zvirobij: { name: "Zvirobij", pron: "zvee-ro-BEEY", gloss: "St. John's wort", glow: "255,205,70", flower: "#f2c416", flowerCore: "#ffe89a", leaf: "#4c7a2e" },
  derevij: { name: "Derevij", pron: "deh-reh-VEEY", gloss: "yarrow", glow: "245,242,230", flower: "#f5f2e6", flowerCore: "#e8c96a", leaf: "#557d3a" },
};

// --- Village life spots (non-combat interactivity) --------------------------

// The fishing shore: stand on the pond's west bank, cast toward the water.
const FISH_SPOT = { x: 1150, y: 1040 };
const BOBBER = { x: 1235, y: 1022 };
// A crust of bread waits by the campfire for whoever thinks of the Domovyk.
const CRUST_SPOT = { x: 772, y: 660 };
// The pich inside the Domovyk's hut — where offerings go, now that the
// hut has an inside. Stand south of the stove, inside hut0.
const PICH_IN_SPOT = { x: 185, y: 226 };
// The cooking fire's south side — stand here to work the pot that now
// hangs over the campfire. Soup wants 1 fish + 1 herb from the satchel.
const COOK_SPOT = { x: 840, y: 672 };
// Radek's anvil, inside the forge — workable once the forge is lit
// (the "horseshoe" flag). Hammering has a short cooldown between pieces.
const FORGE_SPOT = { x: 330, y: 764 };
// Vesna's herb drying rack, south of the north-east hut — her alchemy
// bench. A tonic wants 2 herbs from the satchel.
const BREW_SPOT = { x: 1224, y: 340 };
// Lumps of bog iron glinting in the pond mud — Radek's forge needs iron.
const IRON_SPOTS: Array<{ x: number; y: number }> = [
  { x: 1150, y: 928 },
  { x: 1492, y: 1092 },
  { x: 1300, y: 1142 },
];

// What the pond gives up. Karas (карась, crucian carp) keeps its Ukrainian
// name like the herbs do; the rest of the catch is plain village fare.
const FISH_CATCH: Array<{ name: string; w: number }> = [
  { name: "a karas", w: 34 },
  { name: "a plump perch", w: 24 },
  { name: "a roach", w: 20 },
  { name: "a little tench", w: 12 },
  { name: "an old boot (the pond gives back)", w: 6 },
  { name: "a grand old pike!", w: 4 },
];

const WISH_LINES: string[] = [
  "You drop a pebble in. It falls a long, long time. Somewhere far below, something turns over in its sleep — and settles. The water gives back nothing but your own face, a little paler.",
  "The pebble sinks. For a moment the well smells of rain that has not fallen yet. They say the well keeps every wish it is ever given, stacked like coins.",
  "Plip. A ring spreads on the black water below. In the ring, just for a heartbeat, the stars are wrong — too many, and too close. Then it is only a well again.",
  "You wish quietly, the way the old ones teach: not for gold, not for glory — those wishes curdle. The rope creaks, approving.",
  "Down in the dark, something small and silver turns once — a fish where no fish should live. The znak harky say a well-fish means the wish was heard.",
];

const HERB_SPOTS: Array<{ x: number; y: number; kind: HerbKind }> = [
  { x: 520, y: 560, kind: "kropyva" }, { x: 1080, y: 520, kind: "polyn" },
  { x: 700, y: 980, kind: "kalendula" }, { x: 1240, y: 900, kind: "zvirobij" },
  { x: 420, y: 880, kind: "derevij" }, { x: 980, y: 760, kind: "kropyva" },
  { x: 620, y: 340, kind: "polyn" }, { x: 900, y: 900, kind: "kalendula" },
  { x: 350, y: 420, kind: "zvirobij" }, { x: 1380, y: 620, kind: "derevij" },
];

// --- People -----------------------------------------------------------------

type Npc = {
  id: string;
  name: string;
  pron: string;
  role: string;
  x: number;
  y: number;
  tunic: string;
  hair: string;
  style: "elder" | "herbalist" | "smith" | "domovyk" | "lisovyk" | "vij" | "chort" | "bolotianyk" | "witch" | "beelzebub" | "dancer";
};

const NPCS: Npc[] = [
  { id: "myroslav", name: "Myroslav", pron: "my-ro-SLAHV", role: "Starosta · village elder", x: 760, y: 520, tunic: "#7a4a2b", hair: "#cfc8bb", style: "elder" },
  { id: "vesna", name: "Vesna", pron: "VEHS-nah", role: "Znakharka · healer", x: 1196, y: 824, tunic: "#a83c32", hair: "#5d3a1a", style: "herbalist" },
  { id: "radek", name: "Radek", pron: "RAH-dek", role: "Blacksmith · a guest from afar", x: 340, y: 806, tunic: "#4c4a48", hair: "#2e2018", style: "smith" },
];

// The spirits — present in the world, approachable, talkable. Positions here
// are home anchors; charPos() adds each spirit's slow wander on top.
const SPIRITS: Npc[] = [
  { id: "domovyk", name: "Domovyk", pron: "do-mo-VYK", role: "House spirit · keeper of the pich", x: 430, y: 352, tunic: "#6e5136", hair: "#8a6f4d", style: "domovyk" },
  { id: "lisovyk", name: "Lisovyk", pron: "lee-so-VYK", role: "Forest spirit · lord of the pines", x: 1010, y: 196, tunic: "#33502e", hair: "#4c6b35", style: "lisovyk" },
  { id: "chort", name: "Chort", pron: "chort", role: "Чорт · devil and trickster — mind your soul", x: 545, y: 1052, tunic: "#7e2430", hair: "#2b2320", style: "chort" },
  { id: "bolotianyk", name: "Bolotianyk", pron: "bo-lo-TYAH-nyk", role: "Swamp demon · the pond's dark keeper", x: 1182, y: 992, tunic: "#3d5548", hair: "#5d7050", style: "bolotianyk" },
  { id: "vij", name: "Vij", pron: "veey", role: "Вій · the Big Boss — asleep, for now", x: 1420, y: 268, tunic: "#3a3444", hair: "#55506a", style: "vij" },
];

const ALL_CHARS: Npc[] = [...NPCS, ...SPIRITS];
const VILLAGER_IDS = new Set(NPCS.map((n) => n.id));

// The hut residents, indoors: the same people (same ids, so meeting
// them inside counts the same as outside), anchored in their rooms.
// The Domovyk keeps by his pich; Vesna keeps by her work table. They
// are home when you step in — a house spirit never leaves his house,
// and the znak harka is in for the evening.
const DOMOVYK_IN: Npc = {
  id: "domovyk", name: "Domovyk", pron: "do-mo-VYK", role: "House spirit · keeper of the pich",
  x: 330, y: 165, tunic: "#6e5136", hair: "#8a6f4d", style: "domovyk",
};
const VESNA_IN: Npc = {
  id: "vesna", name: "Vesna", pron: "VEHS-nah", role: "Znakharka · healer",
  x: 250, y: 320, tunic: "#a83c32", hair: "#5d3a1a", style: "herbalist",
};

// --- Lysa Hora people -------------------------------------------------------
// The sabbath host. The Chort here is the same devil as by the millstone
// (same id, so meeting him in either place counts once) — but on the
// mountain he is working, and his script is the sabbath script.
const LYSA_CHARS: Npc[] = [
  { id: "beelzebub", name: "Beelzebub", pron: "be-EL-ze-bub", role: "Host of the sabbath · lord of Lysa Hora", x: 660, y: 220, tunic: "#3a2438", hair: "#1c1420", style: "beelzebub" },
  { id: "chort", name: "Chort", pron: "chort", role: "Чорт · master of ceremonies tonight", x: 770, y: 330, tunic: "#7e2430", hair: "#2b2320", style: "chort" },
  { id: "solokha", name: "Solokha", pron: "so-lo-KHA", role: "Vidma · witch of Dikanka way", x: 545, y: 330, tunic: "#4a2c5a", hair: "#c8c2b8", style: "witch" },
  { id: "motrya", name: "Motrya", pron: "MO-trya", role: "Vidma · keeper of the night-blooms", x: 520, y: 480, tunic: "#2c4a5a", hair: "#3a2a1a", style: "witch" },
];

// The dancing witches — presences, not conversations. They circle the
// bonfire all night; charPos() walks them round it.
const LYSA_DANCERS: Npc[] = [0, 1, 2, 3].map((i) => ({
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
// Vij does not move. Vij will never move. That is rather the point.
function charPos(ch: Npc, now: number): { x: number; y: number } {
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

// Story flags + counters live in the save as plain strings: a flag is
// present or not, and a counter is stored as "name=n" (e.g. "fish=3").
function flagHas(flags: ReadonlySet<string>, name: string): boolean {
  return flags.has(name);
}
function flagCount(flags: ReadonlySet<string>, name: string): number {
  for (const f of flags) {
    if (f.startsWith(`${name}=`)) {
      const n = Number(f.slice(name.length + 1));
      return Number.isFinite(n) ? n : 0;
    }
  }
  return 0;
}

// Dialogue scripts are chosen when a conversation opens, from the world
// state at that moment (herbs gathered, flags, fish) — so a script can
// branch on what the player has done: the Domovyk before and after his
// crust of bread, Radek before and after the bog iron, the Chort before
// and after you sign away your soul.
function linesFor(npc: Npc, herbs: number, flags: ReadonlySet<string>, fish: number, price = 3, intTotal = 1): string[] {
  switch (npc.id) {
    case "myroslav":
      return [
        "Well now — a new face in Zalissya. I am Myroslav, starosta of this village. You are welcome at our fire.",
        "Mind the forest edge, traveller. The Lisovyk walks among the pines, and he does not love strangers who take without asking.",
        "And be kind to the Domovyk in your hut — leave him bread by the pich, and he will keep your hearth warm through the winter.",
        "You will find him by the north hut most days, fussing over the woodpile. Do not thank him aloud — house spirits hate fuss. There is a crust by the campfire, if you have a mind to leave it for him.",
        "And one thing more, traveller, and hear me well: far off in the north-east hollow sleeps Vij — Вій — the biggest and worst of the old things. His eyelids hang down to the very ground. Look upon him if you must. Do NOT wake him.",
        "Radek at the forge is a guest among us — a Pole from a village many days' road from here. Treat him kindly; a traveller under your roof is a gift.",
        "Two more warnings, and then I will let you be. A Chort has taken to lounging by the old millstone south of the clearing — all bargains and grins. Whatever he offers, traveller, your soul is not spare change. And keep out of the pond reeds: the Bolotianyk has drowned better swimmers than you.",
        "East of here a trail climbs out of the clearing to Lysa Hora — the Bald Mountain, bare as a skull. On sabbath nights the devils and vidmy gather there around a great fire, and the Chort plays host. It is not forbidden ground, traveller — but go polite, go with empty hands for no one, and do not eat what you are offered. Much.",
        "One last thing, and it is the truest thing I know: in Zalissya a person becomes what they do. Gather, and your eye sharpens. Fish, and your hands quicken. Cook, smith, brew — the work makes the worker. Keep an eye on your Character — it is all written there, plain as a tally stick.",
      ];
    case "vesna":
      return herbs >= 5
        ? [
            "Look at your basket — kropyva, polyn, kalendula, zvirobij, derevij! Your eye has grown keen, just as I promised.",
            "Herbalism is not taught, it is gathered — one plant, one walk, one season at a time. You understand now.",
            "Two crafts wait for hands like yours now. At the campfire hangs a pot: one pond fish and one herb from your satchel makes a proper karas soup — that is Cooking, and a fed traveller walks brisker. And by the north-east hut stands my drying rack: two herbs, worked patiently, become a tonic — that is Alchemy. Drink one and the world goes clear for a while.",
            ...(intTotal >= 3
              ? ["And look at you — bright as bottled morning. Your INT has reached 3, so the deep work is open to you now: at my rack you may choose Vesna's strong tonic — three herbs, and drunk it sharpens mind AND eye twice as deep as the common brew (INT +2, WIS +2). Some knowledge only trusts a ready mind, traveller. Yours is ready."]
              : [`One secret I keep for a readier mind: my strong tonic — a deeper draught, three herbs, worth INT +2 and WIS +2 to whoever drinks it. It unlocks at INT 3, and no sooner; a green mind would only waste good polyn. Your INT stands at ${intTotal} today. Keep brewing the common tonic — every batch teaches, and the rack remembers.`]),
            ...(fish > 0
              ? ["And the pond provides too, I see. Your satchel holds the makings of soup already, znak harka that you are becoming."]
              : ["When the herbs rest, try the pond shore, west bank. A patient line catches more than karas — it catches quiet. And quiet is a remedy too."]),
          ]
        : [
            "You have gentle hands. I am Vesna — I tend the sick of Zalissya, and the horod both.",
            "See the glowing patches among the grass? Kropyva the nettle, bitter polyn, kalendula like little suns, zvirobij, and derevij. Gather any of them for me — every herb teaches your eye.",
            "One caution, gentle hands: the yellow zvirobij hides from a green eye. Until your Wisdom reaches 2 it will not let itself be known or gathered — learn the other herbs first, and in time it will open to you.",
            "Bring me five herbs in all, and I will know the forest has accepted you.",
          ];
    case "radek": {
      const iron = flagCount(flags, "iron");
      if (flagHas(flags, "horseshoe")) {
        return [
          "The forge sings again, thanks to your bog iron. Feel that heat? THAT is a kuznya.",
          "That horseshoe I gave you — carry it, and not for luck alone: iron in the pocket puts strength in the arm. You will feel it. That is Smithing's first lesson, and it is free.",
          "The anvil is yours to learn on now, traveller. Stand to it and work the forge — piece by piece, your Smithing grows, and with it your Strength. A strong arm now and then turns out a masterwork. When Vij's day comes, we will be glad of both.",
        ];
      }
      if (iron >= 3) {
        return [
          "What is that weight in your arms — bog iron! Three good lumps, marsh-born and heavy. Traveller, you have just lit my forge.",
          "Here — the first thing off the anvil is yours: a horseshoe, still warm. Carry it for luck. Iron remembers who fed the fire.",
          "Now the kuznya stands ready. When the day comes that Vij stirs, traveller, there will be iron enough in Zalissya. See that you are here for it.",
        ];
      }
      return [
        "Radek. I shoe the horses and mend the ploughs of Zalissya — though I am only a guest here. Mind the anvil — she bites.",
        "My home is a village many days' road from here, far to the west. I came with the spring to lend them my hammer — and the road home can wait until the work is done.",
        ...(iron > 0
          ? [`Bog iron! You found a lump in the pond mud — good eye. ${3 - iron} more like that and this forge roars again.`]
          : ["My kuznya stands cold until I get good iron from the marsh. Bog iron sleeps in the pond mud, traveller — dark lumps that glint where the shore is soft. Three good lumps would light my fire."]),
        "If the Lisovyk troubles you, come to me. Iron has a way of settling arguments with the old things of the wood — in my country, and here too.",
        "And if it is Vij you are asking after — aye, I have heard the tales. Lids so heavy they must be forked up by his servants. They say iron sings against such things. When that day comes, traveller, my forge had better be hot.",
      ];
    }
    case "domovyk":
      if (flagHas(flags, "stone")) {
        return [
          "Hmph. You again. …The bread was good. Crust crisp, salt enough. A hundred winters I have kept this hut, and kindness still surprises the pich out of me.",
          "The stone I left you — keep it by your bed. It will be warm on the coldest night of the year. That is not a promise. That is a Domovyk, and we are better than promises.",
          "Sleep well in Zalissya, little landlord. Your hearth is watched. Your soup is minded. Your mice — polite.",
        ];
      }
      if (flagHas(flags, "offering")) {
        return [
          "…You came back. The crust is gone, did you notice? Behind the pich, nothing but crumbs and a warm smell. I said nothing. House spirits do NOT say thank you.",
          "But check the doorstep of this hut when you leave, new one. Sometimes gratitude… falls out of our pockets. By accident. Mind you do not trip on it.",
        ];
      }
      return [
        "Hush, hush — soft feet by my hut. …Oh. It is the new one. I am Domovyk. I keep this house: the pich warm, the bread risen, the mice polite.",
        "You left no bread yet. Hmm. New ones never do, the first night. Behind the pich, a crust, a little salt — that is all I ask, and I ask it every winter for a hundred years.",
        "There is a crust by the village campfire, if your hands are empty and your heart is not. Bring it to my pich — the north hut, mind — and leave it quiet.",
        "The Lisovyk thinks himself grand out there with his pines. Let him. Empires fall; a warm hearth does not.",
        "…You smell of the north-east path. You have been near Vij. Do not go clattering about up there, little landlord. If those eyelids ever lift, no pich in Zalissya will keep out the cold that follows.",
      ];
    case "lisovyk":
      return [
        "Stop there, two-legs. …You walk softly for one of the hut folk. I am Lisovyk. These pines are mine; the paths through them are mine; the lost are mine also.",
        "Take your herbs — kropyva, polyn, the little suns — the forest gives to hands that ask. But take greedily, and the paths will turn, and turn, and you will greet your own footprints until dark.",
        "Vesna's eye is on you. That is a good eye to be under. Mind it stays so.",
        "You have seen him, then — Vij, in his hollow. Even I walk wide of that place, and I am the forest. Sleep is the only chain that holds him, traveller. See that you never file at it.",
      ];
    case "chort": {
      if (flagHas(flags, "soulback")) {
        return [
          "My favourite customer! Soul returned, gold kept, shadow reattached — you drive a harder bargain than half the sabbath host, and THEY have horns.",
          "No hard feelings, traveller. A deal is a deal. …Though between us? I shall miss your shadow. It danced beautifully.",
          "Speaking of dancing — you should see it dance on Lysa Hora. The Bald Mountain, east trail out of the clearing, bare rock and a great fire. Sabbath nights I host up there: witches, fiddles, Beelzebub himself presiding. Come as my guest. Guests who bring an offering and join the dance leave with more than they came with — that is a promise, not a bargain. Mostly.",
        ];
      }
      if (flagHas(flags, "soulsold")) {
        return [
          "Ahh, my shadowless friend. Notice anything missing at noon? Look down. NOTHING. Beautiful, is it not? The gold, though — the gold is real. Spend it somewhere warm.",
          "And when you tire of the village's little fires — Lysa Hora, traveller. The Bald Mountain, by the east trail. Sabbath nights the whole host dances there, and a guest of mine is a guest of Beelzebub. Shadow or no shadow.",
          ...(fish >= price
            ? [`Hm? What is that smell — pond water and karas? ${price === 2 ? "TWO" : "THREE"} fish, I count, without counting. …You know the price of a soul, traveller. Shall we settle accounts?`]
            : [`If you miss the little thing, I am not unreasonable: ${price} pond fish buys your soul back.${price === 2 ? " Two, not three — that tongue of yours could talk a saint into a sabbath, and I am only a devil." : ""} Devils love fish. Do not ask why. NOBODY knows why.`]),
        ];
      }
      return [
        "Psst. Psst! Over here, by the millstone. …What? A devil can't enjoy a sunny day? I am Chort, traveller — merchant, musician, and modest collector of… signatures.",
        "In the old days we kept a fine sabbath up at the old mill — fiddles, dancing, the whole host! These nights we keep it grander: on Lysa Hora, the Bald Mountain — east trail out of the clearing, bare rock, a fire you can see from Zalissya. And SUCH weddings we used to crash. A Cossack's soul is a vintage thing, my friend. But business is business, and today I am buying.",
        "So — a bargain, just between us. Your soul: slightly used, one careful owner. In exchange? Gold that never runs out. A horse that never tires. Vesna's heart, Radek's hammer, Myroslav's beard — name it! Sign here. And here. And in blood, here — kidding! Ink is fine. Mostly.",
      ];
    }
    case "bolotianyk":
      return [
        "The reeds part. Two eyes rise out of the pond scum, then a head like a drowned log, green-grey and streaming. Bolotianyk looks at you the way deep water looks at a stone.",
        "“Little dry one… my pond. My mud. My bells — the church bells that sank here before your village had a name. I ring them, sometimes, for the ones who waded too far.”",
        "“The znak harka takes my polyn and leaves me be. Wise. You — take your herbs from the grass, dry one. What grows in MY water is not for your basket.”",
        ...(fish > 0
          ? ["“And yet you fish my pond, dry one, and I allow it. Your line is polite. Your shadow… hmm. Your shadow smells of the millstone devil lately. Curious.” Bolotianyk's eyes sink a little, watching."]
          : []),
        "“And tell the hut folk: Bolotianyk is patient. The pond was here before Zalissya. The pond — and what sleeps in the hollow — will be here after. Everything sinks to us, in the end.” The eyes slide back under, and the ripples close like nothing happened.",
      ];
    case "vij":
      return [
        "The hollow is wrong-quiet. No birds. No insects. Only a sound like a mountain breathing — slow, wet, patient.",
        "He is enormous. A head like a boulder, grey as old ash, and eyelids — eyelids that hang from his brow all the way down to the earth, veined and heavy as wet sailcloth. Two withered servants lean on the forks that would lift them. They do not look at you. They look at the lids.",
        "Under one lid, something shifts. A seam of dull red light opens — just a seam — and every hair on your body stands. The servants freeze. The breathing stops.",
        "…The seam closes. The breathing resumes. Whatever Vij dreams of, it is not you. Not yet. You back away very, very quietly, and the birds only start again when the village fire is in sight.",
      ];
    default:
      return ["…"];
  }
}

// Lysa Hora scripts — chosen the same way as village ones, from the state
// of the sabbath chain: nichnyky gathered (counter "lysaFlower"), the
// offering laid ("lysaOffering"), the dance danced ("lysaDanced"), and
// the blessing received ("moonstone").
function linesForLysa(npc: Npc, flags: ReadonlySet<string>): string[] {
  const flowers = flagCount(flags, "lysaFlower");
  const offered = flagHas(flags, "lysaOffering");
  const danced = flagHas(flags, "lysaDanced");
  const blessed = flagHas(flags, "moonstone");
  switch (npc.id) {
    case "beelzebub":
      if (blessed) {
        return [
          "The great figure on the stone seat inclines his horned head — a small, terrible courtesy. “The mountain remembers its guests, little mortal. The stone at your heart remembers too. Go down warm.”",
          "Below, the witches are still dancing. They will be dancing, one way or another, long after Zalissya is a story grandmothers tell. You walk down the trail with moonlight on your shoulders like a cloak someone lent you — and does not want back yet.",
        ];
      }
      if (danced) {
        return [
          "Beelzebub rises — slowly, the way weather rises. The fiddles falter. Every devil on the summit turns to look at you, and the fire leans in to listen.",
          "“YOU BROUGHT THE MOUNTAIN ITS FLOWERS. YOU DANCED ITS DANCE. THE SABBATH DOES NOT LET SUCH A GUEST GO DOWN EMPTY.” He opens one vast hand. In it, small as a coin and bright as the moon's edge: a moonstone, cold and kind.",
          "“TAKE IT. NOT A BARGAIN — A BLESSING. THERE IS A DIFFERENCE, AND TONIGHT YOU HAVE EARNED THE DIFFERENCE.” Somewhere below the summit, very faintly, a church bell that does not exist rings once — and the Bolotianyk answers it.",
        ];
      }
      if (offered) {
        return [
          "From his seat of black stone, Beelzebub regards you over the fire. His voice is not loud. It does not need to be; the mountain carries it the way it carries thunder.",
          "“THE OFFERING IS LAID. GOOD. NOW — THE DANCE, LITTLE MORTAL. A GUEST WHO ONLY WATCHES IS ONLY HALF A GUEST. STEP INTO THE RING, SOUTH OF THE FIRE, AND KEEP THE TURN.” One clawed hand gestures at the circling witches, almost — almost — kindly.",
        ];
      }
      return [
        "You approach the stone seat at the summit's north edge, and the sabbath goes quiet around you — fiddles trailing off, witches pausing mid-turn, a hundred small devils suddenly very interested in their hooves.",
        "Beelzebub is older than the mountain's baldness and dressed like the best funeral you have ever imagined. “A MORTAL. ON MY MOUNTAIN. WITHOUT AN OFFERING.” He says it the way a starosta notes a missing fence-post: not angry — recording.",
        "“THE RULES ARE OLD, LITTLE MORTAL, AND EVEN I OBEY THEM. NICHNYKY GROW ON THESE SLOPES — NIGHT-BLOOMS, PALE AS BONE. BRING THREE TO THE OFFERING STONE. THEN WE SHALL SEE WHAT YOU ARE.”",
      ];
    case "chort":
      if (blessed) {
        return [
          "You came, you offered, you danced, and Beelzebub HIMSELF blessed you. Do you know what that does to my reputation? NOTHING. It was already magnificent.",
          "Wear the moonstone well, traveller. And if anyone in Zalissya asks where you got it — a devil's guest-price. Let them chew on that.",
        ];
      }
      if (danced) {
        return [
          "You DANCED! Did everyone see? The mortal danced and the mountain did not even crack! Now — up to the big chair with you. Beelzebub has a blessing with your name scratched on it, and he scratches DEEP.",
        ];
      }
      if (offered) {
        return [
          "The offering is laid and the stone is HAPPY — stones are never happy, that is how good it was. Now the dance, traveller! South of the fire, into the ring, keep the turn. Even I cannot waltz a guest's place for them — I checked. Twice. There were… incidents.",
        ];
      }
      if (flowers >= 3) {
        return [
          "Nichnyky! Three pale beauties, and not a petal bruised — you handle night-flowers like a vidma born. The offering stone waits, north of the fire. Lay them down gentle. The mountain notices gentle.",
        ];
      }
      return [
        "MY GUEST ARRIVES! Welcome to Lysa Hora, traveller — the Bald Mountain, my office, my ballroom, my cathedral! Beelzebub presides, the vidmy dance, and the fire — the fire is older than your village and twice as honest.",
        "House rules, and they are Beelzebub's, so they are carved deeper than stone: a guest brings the mountain an offering. Nichnyky — night-blooms — open on these slopes, pale little moons in the rock. Gather three, lay them on the offering stone north of the fire, and the sabbath is yours. Dance with us after, and who knows what blessings fall off the big chair.",
        "And no signatures tonight! Sabbath rules. Even I keep ONE night a week honest. …Mostly.",
      ];
    case "solokha":
      if (blessed) {
        return [
          "Solokha curtseys — a witch's curtsey, which involves more of the sky than seems necessary. “Blessed by the big one himself. Walk down proud, ditko. And if Vesna asks after me — tell her the mountain keeps her sister well.”",
          "She presses nothing into your hand, asks for nothing. From a witch of Lysa Hora, that is the rarest gift of all.",
        ];
      }
      if (danced) {
        return [
          "You dance like a mortal who intends to survive it — clever feet! Up with you to Beelzebub now, before the fire burns lower. A blessing given at high fire is a blessing that keeps.",
        ];
      }
      if (offered) {
        return [
          "The stone took your flowers kindly — I felt it through my shoes. Now dance, ditko. The ring is south of the fire. Do not count the steps; counting is how mortals fall out of the music.",
        ];
      }
      if (flowers >= 3) {
        return [
          "Three nichnyky, and picked at the bloom's first breath — Vesna taught you well, whoever you are. The offering stone, north of the fire. Lay them down and bow to no one; the mountain is not a priest. It is a host.",
        ];
      }
      return [
        "Well — a face from under the roofs! I am Solokha, vidma, widow, and the best cook on this mountain, whatever the devils say with their mouths full. You climb well for a lowlander.",
        "You want the sabbath's welcome? Then do it properly, ditko. Nichnyky — night-blooms — open on the bare slopes, pale as little moons. Three of them on the offering stone, north of the fire. That is the mountain's price, and it is fairer than any devil's.",
        "And afterwards — dance. A guest who will not dance is a guest the mountain forgets. And you do not want to be forgotten by a mountain. It has a long memory and no manners at all.",
      ];
    case "motrya":
      if (blessed) {
        return [
          "Motrya touches two fingers to the moonstone's light and smiles with all her teeth. “It suits you. Moonlight usually does, on the ones the mountain chooses. Come back when it fades, ditko — mountains renew.”",
        ];
      }
      if (danced) {
        return [
          "Motrya is still turning in the ring's echo, humming. “You kept the turn. The big chair noticed. Go and be blessed, dancer — I shall keep your place warm in the circle.”",
        ];
      }
      if (offered) {
        return [
          "Motrya nods at the offering stone, where your nichnyky glow faintly. “Laid true. Now the dance — south of the fire, ditko, and do not think about your feet. Feet hate being thought about.”",
        ];
      }
      return [
        "A small witch with a voice like a nightjar looks up from braiding night-blooms into her hair. “Motrya. I keep the nichnyky of Lysa Hora — which is to say, I know where they hide and I am not too proud to say.”",
        "“The slopes, ditko. Where the rock is baldest and the moonlight pools — that is where they open. Three for the offering stone. Pick them gentle: a night-bloom bruised is a promise bruised, and this mountain counts promises.”",
        ...(flowers > 0 && flowers < 3 ? [`“${flowers} already in your hand, I see — the mountain counts those too. ${3 - flowers} more, ditko.”`] : []),
      ];
    default:
      return ["…"];
  }
}

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
// Scripted beats stay scripted: Vij is narration, not conversation;
// the Chort's bargain is a topic whose answer ends in the Sign / Keep
// my soul choice; Beelzebub's blessing is a topic that hands over to
// the blessing script. Asking costs nothing and changes nothing by
// itself — CHA still grows by MEETING people, once each, as before.

type DialogueTopic = {
  id: string;
  label: string;
  question: string;
  lines: string[];
  action?: "bargain" | "blessing";
};

type TopicSet = { intro: string[]; topics: DialogueTopic[] };

function pickLines(lines: string[], ...idx: number[]): string[] {
  return idx
    .map((i) => lines[i])
    .filter((s): s is string => typeof s === "string" && s.length > 0);
}

function topicsForVillage(
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
          { id: "vij", label: "Vij", question: "Who is Vij?", lines: pickLines(L, 4) },
          { id: "radek", label: "Radek the smith", question: "Who is the smith?", lines: pickLines(L, 5) },
          { id: "dark", label: "The Chort & the pond", question: "What should I fear here?", lines: pickLines(L, 6) },
          { id: "lysa", label: "Lysa Hora", question: "What is Lysa Hora?", lines: pickLines(L, 7) },
          { id: "growth", label: "How a person grows here", question: "How does one become someone in Zalissya?", lines: pickLines(L, 8) },
        ],
      };
    case "vesna": {
      const strongLine =
        intTotal >= 3
          ? "And the deep work is open to you: my strong tonic — three herbs, and drunk it sharpens mind AND eye twice as deep as the common brew (INT +2, WIS +2). Your INT has reached 3, znak harka. The rack will offer it."
          : `One secret I keep for a readier mind: my strong tonic — three herbs, worth INT +2 and WIS +2 to whoever drinks it. It unlocks at INT 3; yours stands at ${intTotal}. Keep brewing the common tonic — the rack remembers every batch.`;
      return {
        intro: firstMeeting
          ? pickLines(L, 0)
          : [herbs >= 5
              ? "Your basket smells of the whole meadow. Ask, znak harka — I keep few secrets from keen hands."
              : "Gentle hands. What would you know?"],
        topics: [
          { id: "herbs", label: "The five herbs", question: "Teach me the herbs.", lines: pickLines(L, 1) },
          {
            id: "zvirobij", label: "Zvirobij, the shy herb", question: "Why does zvirobij hide from me?",
            lines: herbs >= 5
              ? ["Zvirobij hides from no one in this village now — your eye knows it, stem and yellow star. Wisdom opened that door, and doors opened by doing stay open."]
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
              { id: "vij", label: "Vij & iron", question: "Would iron serve against Vij?", lines: pickLines(L, 4) },
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
            id: "vij", label: "Vij", question: "What of Vij?",
            lines: thanked || fed
              ? ["…You smell of the north-east path. You have been near Vij. Do not go clattering about up there, little landlord. If those eyelids ever lift, no pich in Zalissya will keep out the cold that follows."]
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
          { id: "vij", label: "Vij", question: "What of Vij?", lines: pickLines(L, 3) },
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
          { id: "vij", label: "Vij", question: "What do devils fear?", lines: ["Vij? …Even I lower my voice, traveller. A devil deals in souls; Vij deals in endings. If those lids ever lift, my whole sabbath dances attendance — from very, very far away."] },
          // The bargain is offered ONCE: a soul kept is a soul kept, and
          // the pen stays away afterwards (the old script suppressed the
          // Sign choice in this state too). In its place, his reaction.
          ...(flagHas(flags, "soulkept")
            ? [{
                id: "refused", label: "Your bargain — refused", question: "Any regrets, devil?",
                lines: ["Regrets? ME? Hah! You refused like a starosta, traveller — I told you, the last one who refused me became one. The offer stands closed, and a devil keeps his word: no pen, no pitch. But when Vij stirs and you need a friend with a pitchfork — you know where the millstone is. My prices only go UP."],
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
          { id: "old", label: "Vij & the old things", question: "What is oldest here?", lines: pickLines(L, fish > 0 ? 4 : 3) },
        ],
      };
    default:
      // Vij (and anyone unforeseen) keeps the scripted narration.
      return null;
  }
}

function topicsForLysa(npc: Npc, flags: ReadonlySet<string>, firstMeeting: boolean): TopicSet | null {
  const L = linesForLysa(npc, flags);
  const flowers = flagCount(flags, "lysaFlower");
  const offered = flagHas(flags, "lysaOffering");
  const danced = flagHas(flags, "lysaDanced");
  const blessed = flagHas(flags, "moonstone");
  switch (npc.id) {
    case "beelzebub": {
      const vijTopic: DialogueTopic = {
        id: "vij", label: "Vij", question: "What does the mountain fear?",
        lines: ["“VIJ. YES. EVEN THE MOUNTAIN HAS A NEIGHBOUR IT DOES NOT VISIT. HIS LIDS HANG TO THE GROUND, AND UNDER THEM — AN ENDING. LET HIM SLEEP, LITTLE MORTAL. SOME GUESTS EVEN I WILL NOT RECEIVE.”"],
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
            vijTopic,
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
            vijTopic,
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
            vijTopic,
            courtTopic,
          ],
        };
      }
      return {
        intro: firstMeeting ? pickLines(L, 0) : ["“ASK, LITTLE MORTAL. THE MOUNTAIN ANSWERS WHAT IT CHOOSES.”"],
        topics: [
          { id: "rules", label: "The rules & the nichnyky", question: "What does the mountain ask of a guest?", lines: pickLines(L, 1, 2) },
          { id: "who", label: "Who are you?", question: "Who presides here?", lines: pickLines(L, 0) },
          vijTopic,
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

const LYSA_BLESSING_LINES: string[] = [
  "The moonstone settles into your palm, cold as well-water and twice as clear. Somewhere inside it, a crescent turns — slowly, patiently — to face you.",
  "Around the bonfire the witches raise their arms, the devils stamp their hooves, and Beelzebub himself inclines his horned head. The sabbath has a new story to tell about a mortal who came polite, offered fairly, and danced.",
  "You wear Lysa Hora's blessing now. The night road down to Zalissya will be shorter than the road up. It always is, for the blessed — that is rather the point of blessings.",
];

// The Chort's bargain is a real choice, made mid-dialogue at the signature
// line. These are the scripts that play out after each answer.
const CHORT_SIGNED_LINES: string[] = [
  "Signed! SIGNED! Oh, traveller — you have made a devil's whole century. Here: your gold. Feel how it never gets lighter? That is the good stuff. That is the SABBATH stuff.",
  "And no take-backs… well. One take-back, because I LIKE you: pond fish buys your soul back any time — the price is in your Character sheet, under Charisma. Devils and fish, traveller. Do not ask. Now — notice anything missing when you walk in the sun? Look down. Heh. HEH.",
];
const CHORT_REFUSED_LINES: string[] = [
  "…No? NO? Hah! Hahaha! Oh, I LIKE you. The last one who refused me became a starosta; the one before — a very surprised frog. Keep your soul then, traveller. But when Vij stirs and you need a friend with a pitchfork — you know where the millstone is. My prices only go UP.",
];
const CHORT_TRADE_LINES: string[] = [
  "Pond fish, still shining. …A deal is a deal, traveller. Here — one soul, slightly haunted, returns to its owner. And keep the gold. A devil's gold spends the same, and I am not a CHEAT.",
  "There. Feel that? Warmth. Weight. A shadow pooling at your feet like it never left. Pleasure doing business. Tell NO ONE I went soft.",
];

// The well is not a person, but it answers wishes with dialogue anyway.
const WELL_NPC: Npc = {
  id: "well", name: "The Old Well", pron: "", role: "Drop a pebble, make a wish",
  x: 840, y: 496, tunic: "#5d6b72", hair: "#8d8b85", style: "elder",
};

// Vesna's drying rack is not a person either, but at INT 3+ it has a
// menu: the recipe choice is made through the dialogue choice buttons.
const BREW_BENCH_NPC: Npc = {
  id: "brewbench", name: "Vesna's drying rack", pron: "", role: "Alchemy bench · choose a brew",
  x: BREW_SPOT.x, y: BREW_SPOT.y, tunic: "#4c6b35", hair: "#5d3a1a", style: "herbalist",
};

const BREW_CHOICE_LINES: string[] = [
  "The rack smells of polyn and sun, and the little cauldron is already warm. Two brews are within your craft: the common tonic (2 herbs — bright and clarifying), and Vesna's strong tonic (3 herbs — the deep draught she teaches only at INT 3; drunk, it is worth INT +2 and WIS +2). The cauldron waits. Which do you work?",
];

// Herbalism thresholds: level n starts at THRESH[n-1] herbs gathered
// (any kind counts — kropyva, polyn, kalendula, zvirobij, derevij).
const THRESH = [0, 3, 7, 12, 18, 25, 34];
function herbLevel(herbs: number): number {
  let lvl = 1;
  for (let i = 0; i < THRESH.length; i++) {
    if (herbs >= (THRESH[i] ?? 0)) lvl = i + 1;
  }
  return lvl;
}

// Fishing thresholds: level n starts at FISH_THRESH[n-1] fish caught.
const FISH_THRESH = [0, 2, 5, 9, 14, 20];
function fishLevel(fish: number): number {
  let lvl = 1;
  for (let i = 0; i < FISH_THRESH.length; i++) {
    if (fish >= (FISH_THRESH[i] ?? 0)) lvl = i + 1;
  }
  return lvl;
}

// Cooking / Smithing / Alchemy share the fishing threshold shape: level n
// starts at THRESH[n-1] lifetime acts (meals cooked, pieces forged,
// tonics brewed). Skill names stay English, per the naming rule.
const CRAFT_THRESH = [0, 2, 5, 9, 14, 20];
function craftLevel(done: number): number {
  let lvl = 1;
  for (let i = 0; i < CRAFT_THRESH.length; i++) {
    if (done >= (CRAFT_THRESH[i] ?? 0)) lvl = i + 1;
  }
  return lvl;
}

// --- Stats ------------------------------------------------------------------
// The six classic stats, all starting at 1 (KCD2-style: no dump stats, no
// points to assign — a stat grows because its skill grows). A stat's BASE
// is derived, never stored, so old saves get honest values for free:
//   STR = Smithing level    DEX = Fishing level     CON = Cooking level
//   INT = Alchemy level     WIS = Herbalism level   CHA = 1 + ⌊met/2⌋
// Keepsakes, food and tonics add BONUSES on top; the TOTAL is what the
// world feels (bite window, walking pace, double finds, the Chort's price).
type StatKey = "str" | "dex" | "con" | "int" | "wis" | "cha";
const STAT_DEFS: Array<{ key: StatKey; abbr: string; name: string; feeds: string; effect: string }> = [
  { key: "str", abbr: "STR", name: "Strength", feeds: "Smithing", effect: "Carry limit 6 + 2×STR · masterwork chance · pries the deepest bog iron" },
  { key: "dex", abbr: "DEX", name: "Dexterity", feeds: "Fishing", effect: "Longer window to reel in a bite · luck tilts toward better fish" },
  { key: "con", abbr: "CON", name: "Constitution", feeds: "Cooking", effect: "Brisker walking pace" },
  { key: "int", abbr: "INT", name: "Intelligence", feeds: "Alchemy", effect: "Chance to brew a double tonic · at INT 3, Vesna's strong tonic unlocks" },
  { key: "wis", abbr: "WIS", name: "Wisdom", feeds: "Herbalism", effect: "Keen eye: chance of a double herb · at WIS 2, you know Zvirobij" },
  { key: "cha", abbr: "CHA", name: "Charisma", feeds: "Meeting people", effect: "At CHA 4+, the Chort's soul price drops to 2 fish · the well listens to a warm tongue" },
];

type StatLine = { base: number; bonus: number; total: number; bonusWhy: string[] };

function computeStats(input: {
  herbs: number; fishTotal: number; cooked: number; smithed: number; brewed: number;
  met: number; flags: ReadonlySet<string>;
}): Record<StatKey, StatLine> {
  const base: Record<StatKey, number> = {
    str: craftLevel(input.smithed),
    dex: fishLevel(input.fishTotal),
    con: craftLevel(input.cooked),
    int: craftLevel(input.brewed),
    wis: herbLevel(input.herbs),
    cha: 1 + Math.floor(input.met / 2),
  };
  const bonus: Record<StatKey, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
  const why: Record<StatKey, string[]> = { str: [], dex: [], con: [], int: [], wis: [], cha: [] };
  const give = (k: StatKey, n: number, label: string) => { bonus[k] += n; why[k].push(`${label} ${n > 0 ? "+" : ""}${n}`); };
  if (input.flags.has("horseshoe")) give("str", 1, "Radek's horseshoe");
  if (input.flags.has("pebble")) give("dex", 1, "Lucky pebble");
  if (input.flags.has("stone")) give("con", 1, "Domovyk's warm stone");
  if (input.flags.has("wellfed")) give("con", 1, "Well fed");
  if (input.flags.has("tonic")) { give("int", 1, "Tonic clarity"); give("wis", 1, "Tonic clarity"); }
  if (input.flags.has("strongtonic")) { give("int", 2, "Vesna's strong tonic"); give("wis", 2, "Vesna's strong tonic"); }
  if (input.flags.has("gold")) give("cha", 2, "Devil's gold");
  if (input.flags.has("moonstone")) { give("wis", 1, "Moonstone of Lysa Hora"); give("cha", 1, "Moonstone of Lysa Hora"); }
  const soulLost = input.flags.has("soulsold") && !input.flags.has("soulback");
  if (soulLost) give("wis", -1, "Soulless");
  const out = {} as Record<StatKey, StatLine>;
  (Object.keys(base) as StatKey[]).forEach((k) => {
    out[k] = { base: base[k], bonus: bonus[k], total: Math.max(1, base[k] + bonus[k]), bonusWhy: why[k] };
  });
  return out;
}

// What the Chort charges to give a soul back, in fish. A silver tongue
// (CHA total 4 or more) talks him down from 3 to 2.
function soulPrice(stats: Record<StatKey, StatLine>): number {
  return stats.cha.total >= 4 ? 2 : 3;
}

// --- Carry capacity ---------------------------------------------------------
// What you can haul is set by Strength: cap = 6 + 2×STR total. Weights:
// a lump of bog iron 3, a forged piece 2, a fish 1, an herb 1, a nichnyk
// 0 (moon-flowers weigh nothing — the mountain insists). Soup, tonics
// and keepsakes ride in pockets and pouches and are not on the table.
// Iron already handed to Radek (the "horseshoe" flag) is his problem
// now, not your back's. Ending up OVER the cap (a STR bonus lapsing, or
// three hauled lumps at a low STR) never deletes anything — it only
// blocks new pickups until the load is back under the limit.
function carryCap(stats: Record<StatKey, StatLine>): number {
  return 6 + 2 * stats.str.total;
}
function carriedWeight(flags: ReadonlySet<string>): number {
  const iron = flags.has("horseshoe") ? 0 : flagCount(flags, "iron");
  return (
    flagCount(flags, "fish") * 1 +
    flagCount(flags, "herbStock") * 1 +
    iron * 3 +
    flagCount(flags, "forged") * 2
  );
}
// The load WITHOUT hauled iron — what the satchel itself holds. Digging
// iron is checked against this (plus the new lump): you haul lumps in
// your arms, one trip at a time, so the forge quest can never deadlock
// on its own weight — but a satchel stuffed with fish still leaves you
// no way to haul, and once dug, iron counts toward carriedWeight()
// like everything else until Radek takes it off your hands.
function satchelWeight(flags: ReadonlySet<string>): number {
  return flagCount(flags, "fish") * 1 + flagCount(flags, "herbStock") * 1 + flagCount(flags, "forged") * 2;
}

// --- Drawing helpers --------------------------------------------------------

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function drawGround(c: CanvasRenderingContext2D, camX: number, camY: number, vw: number, vh: number, t: number) {
  const cell = 34;
  const x0 = Math.max(0, Math.floor(camX / cell) - 1);
  const y0 = Math.max(0, Math.floor(camY / cell) - 1);
  const x1 = Math.min(Math.ceil(WORLD_W / cell), Math.ceil((camX + vw) / cell) + 1);
  const y1 = Math.min(Math.ceil(WORLD_H / cell), Math.ceil((camY + vh) / cell) + 1);
  const shades = ["#6da344", "#6aa141", "#6ea646", "#68a03f"];
  for (let gy = y0; gy < y1; gy++) {
    for (let gx = x0; gx < x1; gx++) {
      const h = hash2(gx, gy);
      c.fillStyle = shades[Math.floor(h * shades.length)] ?? shades[0]!;
      c.fillRect(gx * cell - camX, gy * cell - camY, cell + 1, cell + 1);
      // grass blades
      c.strokeStyle = "rgba(46,84,28,0.35)";
      c.lineWidth = 1.4;
      const bx = gx * cell - camX;
      const by = gy * cell - camY;
      for (let b = 0; b < 3; b++) {
        const px = bx + hash2(gx * 7 + b, gy * 3) * cell;
        const py = by + hash2(gx * 5, gy * 9 + b) * cell;
        const sway = Math.sin(t * 0.0016 + px * 0.05 + py * 0.03) * 1.6;
        c.beginPath();
        c.moveTo(px, py);
        c.lineTo(px + sway, py - 5 - hash2(b, gx) * 3);
        c.stroke();
      }
      // wildflowers
      if (h > 0.9) {
        const fx = bx + 6 + hash2(gx, gy * 13) * 22;
        const fy = by + 6 + hash2(gx * 11, gy) * 22;
        const cols = ["#f5efdc", "#f2c14e", "#d96a5a", "#b48ad6"];
        const col = cols[Math.floor(hash2(gy, gx) * cols.length)] ?? "#fff";
        c.strokeStyle = "#4c7a2e";
        c.beginPath();
        c.moveTo(fx, fy + 4);
        c.lineTo(fx, fy);
        c.stroke();
        c.fillStyle = col;
        c.beginPath();
        c.arc(fx, fy - 1, 2.4, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#e8a020";
        c.fillRect(fx - 0.7, fy - 1.7, 1.4, 1.4);
      }
    }
  }

  // Dirt paths — a cross through the clearing.
  c.fillStyle = "#c8a568";
  rr(c, 0 - camX, 600 - camY, WORLD_W, 92, 40); c.fill();
  rr(c, 768 - camX, 120 - camY, 144, 900, 60); c.fill();
  c.fillStyle = "rgba(160,124,72,0.5)";
  for (let i = 0; i < 260; i++) {
    const onH = hash2(i, 77) > 0.35;
    const px = onH ? hash2(i, 1) * WORLD_W : 768 + hash2(i, 2) * 144;
    const py = onH ? 600 + hash2(i, 3) * 92 : 120 + hash2(i, 4) * 900;
    if (px < camX - 10 || px > camX + vw + 10 || py < camY - 10 || py > camY + vh + 10) continue;
    c.beginPath();
    c.arc(px - camX, py - camY, 1.6 + hash2(i, 5) * 2.6, 0, Math.PI * 2);
    c.fill();
  }

  // The Lysa Hora trail — a narrower spur leaving the clearing eastward,
  // climbing (in spirit) to the Bald Mountain. Two cairns mark the edge
  // where the village lets go of you.
  c.fillStyle = "#b99c62";
  rr(c, 1120 - camX, 416 - camY, WORLD_W - 1120, 72, 30); c.fill();
  for (const cy of [404, 502]) {
    const cx = WORLD_W - 26 - camX;
    const cyy = cy - camY;
    c.fillStyle = "#8d8b85";
    c.beginPath(); c.ellipse(cx, cyy + 8, 11, 5, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(cx, cyy + 2, 8, 4.4, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(cx, cyy - 3, 5, 3.4, 0, 0, Math.PI * 2); c.fill();
  }

  // Central clearing — worn pale earth around the fire.
  const grad = c.createRadialGradient(840 - camX, 640 - camY, 20, 840 - camX, 640 - camY, 210);
  grad.addColorStop(0, "rgba(216,182,120,0.55)");
  grad.addColorStop(1, "rgba(216,182,120,0)");
  c.fillStyle = grad;
  c.fillRect(840 - 210 - camX, 640 - 210 - camY, 420, 420);

  // Pond
  const px = POND.x - camX;
  const py = POND.y - camY;
  c.fillStyle = "#3f7089";
  c.beginPath(); c.ellipse(px, py, POND.rx + 8, POND.ry + 7, 0, 0, Math.PI * 2); c.fill();
  const pg = c.createRadialGradient(px - 30, py - 18, 12, px, py, POND.rx);
  pg.addColorStop(0, "#8fc3d4");
  pg.addColorStop(1, "#55879e");
  c.fillStyle = pg;
  c.beginPath(); c.ellipse(px, py, POND.rx, POND.ry, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(255,255,255,0.5)";
  c.lineWidth = 1.6;
  for (let i = 0; i < 5; i++) {
    const sx = px - 90 + hash2(i, 31) * 180;
    const sy = py - 40 + hash2(i, 47) * 80;
    const off = Math.sin(t * 0.002 + i * 1.7) * 4;
    c.beginPath();
    c.moveTo(sx + off, sy);
    c.lineTo(sx + off + 14, sy);
    c.stroke();
  }
  // lily pads
  c.fillStyle = "#4d8a3d";
  for (const [lx, ly] of [[-52, 16], [38, -26], [84, 22]] as const) {
    c.beginPath(); c.ellipse(px + lx, py + ly, 13, 8, 0.4, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = "#e88bb0";
  c.beginPath(); c.arc(px + 38, py - 28, 3.4, 0, Math.PI * 2); c.fill();
  // reeds + cattails at the near edge
  for (let i = 0; i < 9; i++) {
    const rx = px - 130 + i * 30 + hash2(i, 91) * 10;
    const ry = py + POND.ry - 6 + hash2(i, 93) * 12;
    c.strokeStyle = "#3e6b2a";
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx - 3, ry - 26); c.stroke();
    c.fillStyle = "#6e4a26";
    c.fillRect(rx - 4.4, ry - 30, 3, 11);
  }

  // Vij's hollow — a blighted circle at the north-east forest edge where
  // nothing green grows and the grass will not take.
  {
    const hx = 1420 - camX;
    const hy = 262 - camY;
    const hg = c.createRadialGradient(hx, hy, 12, hx, hy, 148);
    hg.addColorStop(0, "rgba(52,46,58,0.88)");
    hg.addColorStop(0.62, "rgba(66,60,66,0.6)");
    hg.addColorStop(1, "rgba(66,60,66,0)");
    c.fillStyle = hg;
    c.fillRect(hx - 148, hy - 148, 296, 296);
    // cracked dead earth
    c.strokeStyle = "rgba(24,20,30,0.55)";
    c.lineWidth = 1.4;
    for (let i = 0; i < 9; i++) {
      const a = hash2(i, 511) * Math.PI * 2;
      const r0 = 16 + hash2(i, 513) * 22;
      const r1 = r0 + 26 + hash2(i, 517) * 42;
      c.beginPath();
      c.moveTo(hx + Math.cos(a) * r0, hy + Math.sin(a) * r0 * 0.72);
      c.lineTo(hx + Math.cos(a + 0.24) * r1, hy + Math.sin(a + 0.24) * r1 * 0.72);
      c.stroke();
    }
    // a ring of old standing stones, leaning like bad teeth
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.4;
      const sx = hx + Math.cos(a) * 128;
      const sy = hy + Math.sin(a) * 88;
      const sh = 20 + hash2(i, 521) * 13;
      c.fillStyle = "#6d6a72";
      rr(c, sx - 5.5, sy - sh, 11, sh, 3); c.fill();
      c.fillStyle = "rgba(255,255,255,0.14)";
      rr(c, sx - 5.5, sy - sh, 4.4, sh, 2); c.fill();
    }
    // dead snags — bare branches over the hollow
    c.strokeStyle = "#3c3630";
    c.lineWidth = 3;
    for (const [dx, dy] of [[-104, -52], [112, -38]] as const) {
      c.beginPath(); c.moveTo(hx + dx, hy + dy + 26); c.lineTo(hx + dx + 3, hy + dy - 14); c.stroke();
      c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(hx + dx + 3, hy + dy - 6); c.lineTo(hx + dx - 11, hy + dy - 18); c.stroke();
      c.beginPath(); c.moveTo(hx + dx + 3, hy + dy - 10); c.lineTo(hx + dx + 15, hy + dy - 22); c.stroke();
      c.lineWidth = 3;
    }
  }

  // The old millstone — all that is left of a mill that stood south of the
  // clearing before anyone can remember. Devils are fond of old mills.
  {
    const mx = 545 - camX;
    const my = 1082 - camY;
    c.fillStyle = "rgba(30,50,20,0.25)";
    c.beginPath(); c.ellipse(mx, my + 6, 44, 12, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#8d8b85";
    c.beginPath(); c.ellipse(mx, my, 34, 13, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#74726c";
    c.beginPath(); c.ellipse(mx, my - 1, 27, 9.6, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#4c4438";
    c.beginPath(); c.ellipse(mx, my - 1, 6, 2.6, 0, 0, Math.PI * 2); c.fill();
    // a fallen, rotting mill beam beside it
    c.fillStyle = "#6e4a26";
    rr(c, mx - 96, my + 12, 56, 9, 3); c.fill();
    c.fillStyle = "#5d3d20";
    rr(c, mx - 96, my + 17, 56, 4, 2); c.fill();
  }

  // Vesna's horod (garden) soil rows
  c.fillStyle = "#6e4c2a";
  rr(c, GARDEN.x - camX, GARDEN.y - camY, GARDEN.w, GARDEN.h, 6); c.fill();
  c.fillStyle = "#7d5831";
  for (let r = 0; r < 4; r++) c.fillRect(GARDEN.x + 8 - camX, GARDEN.y + 12 + r * 22 - camY, GARDEN.w - 16, 9);
  for (let r = 0; r < 4; r++) {
    for (let s = 0; s < 7; s++) {
      const sx = GARDEN.x + 18 + s * 19 - camX;
      const sy = GARDEN.y + 16 + r * 22 - camY;
      c.fillStyle = "#5da244";
      c.beginPath(); c.arc(sx, sy, 4.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#79bd58";
      c.beginPath(); c.arc(sx - 1.4, sy - 1.4, 2.4, 0, Math.PI * 2); c.fill();
    }
  }
}

function drawTree(c: CanvasRenderingContext2D, tr: { x: number; y: number; kind: TreeKind; s: number }, camX: number, camY: number, t: number) {
  const x = tr.x - camX;
  const y = tr.y - camY;
  const s = tr.s;
  const sway = Math.sin(t * 0.0012 + tr.x * 0.11) * 1.4;
  c.fillStyle = "rgba(30,50,20,0.25)";
  c.beginPath(); c.ellipse(x, y + 4, 26 * s, 8 * s, 0, 0, Math.PI * 2); c.fill();
  if (tr.kind === "pine") {
    c.fillStyle = "#6e4a26";
    c.fillRect(x - 3.4 * s, y - 20 * s, 6.8 * s, 22 * s);
    const layers: Array<[number, number, string]> = [
      [46, 30, "#2c5a30"], [38, 52, "#336636"], [29, 74, "#3d733c"],
    ];
    layers.forEach(([w, top, col], i) => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(x + sway * (i + 1) * 0.4, y - (top + 26) * s);
      c.lineTo(x - w * s, y - top * s + 14 * s);
      c.lineTo(x + w * s, y - top * s + 14 * s);
      c.closePath(); c.fill();
      c.fillStyle = "rgba(120,180,90,0.35)";
      c.beginPath();
      c.moveTo(x + sway * (i + 1) * 0.4, y - (top + 26) * s);
      c.lineTo(x + 2 * s, y - top * s + 12 * s);
      c.lineTo(x + w * 0.55 * s, y - top * s + 13 * s);
      c.closePath(); c.fill();
    });
  } else if (tr.kind === "birch") {
    c.fillStyle = "#e9e4d6";
    c.fillRect(x - 3 * s, y - 34 * s, 6 * s, 36 * s);
    c.fillStyle = "#3a3a3a";
    c.fillRect(x - 3 * s, y - 26 * s, 6 * s, 2.2);
    c.fillRect(x - 1 * s, y - 15 * s, 4 * s, 2);
    const blobs: Array<[number, number, number, string]> = [
      [0, -62, 27, "#79ac49"], [-20, -48, 19, "#6da344"], [20, -50, 20, "#86ba57"], [0, -44, 22, "#71a846"],
    ];
    for (const [bx, by, br, col] of blobs) {
      c.fillStyle = col;
      c.beginPath(); c.arc(x + bx * s + sway, y + by * s, br * s, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = "rgba(190,225,140,0.5)";
    c.beginPath(); c.arc(x - 8 * s + sway, y - 62 * s, 9 * s, 0, Math.PI * 2); c.fill();
  } else {
    c.fillStyle = "#5d3d20";
    c.fillRect(x - 5 * s, y - 30 * s, 10 * s, 32 * s);
    c.fillRect(x - 14 * s, y - 44 * s, 6 * s, 18 * s);
    c.fillRect(x + 9 * s, y - 46 * s, 6 * s, 20 * s);
    const blobs: Array<[number, number, number, string]> = [
      [0, -78, 34, "#4f7d33"], [-30, -58, 25, "#598a39"], [30, -60, 26, "#679c3e"],
      [-12, -44, 24, "#5f943a"], [16, -42, 22, "#74ab4b"], [0, -96, 22, "#5f943a"],
    ];
    for (const [bx, by, br, col] of blobs) {
      c.fillStyle = col;
      c.beginPath(); c.arc(x + bx * s + sway, y + by * s, br * s, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = "rgba(200,230,150,0.4)";
    c.beginPath(); c.arc(x - 14 * s + sway, y - 82 * s, 11 * s, 0, Math.PI * 2); c.fill();
    // apples
    c.fillStyle = "#c8452c";
    for (const [ax, ay] of [[-22, -52], [14, -70], [26, -44]] as const) {
      c.beginPath(); c.arc(x + ax * s + sway, y + ay * s, 2.6 * s, 0, Math.PI * 2); c.fill();
    }
  }
}

function drawHouse(c: CanvasRenderingContext2D, h: Rect & { kind: string }, camX: number, camY: number, t: number) {
  const x = h.x - camX;
  const y = h.y - camY;
  c.fillStyle = "rgba(30,50,20,0.28)";
  c.beginPath(); c.ellipse(x + h.w / 2, y + h.h + 8, h.w * 0.58, 13, 0, 0, Math.PI * 2); c.fill();

  if (h.kind === "forge") {
    // open smithy: posts, roof, anvil, barrel, fire glow
    c.fillStyle = "#7a4a24";
    c.fillRect(x + 8, y + 26, 9, h.h - 26);
    c.fillRect(x + h.w - 17, y + 26, 9, h.h - 26);
    c.fillStyle = "#8a5a33";
    c.beginPath();
    c.moveTo(x - 8, y + 30); c.lineTo(x + h.w / 2, y - 16); c.lineTo(x + h.w + 8, y + 30);
    c.closePath(); c.fill();
    c.strokeStyle = "rgba(90,58,26,0.6)";
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.moveTo(x + 6 + i * (h.w / 5), y + 26 - i * 1.5);
      c.lineTo(x + 20 + i * (h.w / 5), y - 8);
      c.stroke();
    }
    const fg = c.createRadialGradient(x + h.w * 0.68, y + h.h - 14, 4, x + h.w * 0.68, y + h.h - 14, 46);
    fg.addColorStop(0, "rgba(255,170,60,0.75)");
    fg.addColorStop(1, "rgba(255,170,60,0)");
    c.fillStyle = fg;
    c.fillRect(x + h.w * 0.68 - 46, y + h.h - 60, 92, 92);
    c.fillStyle = "#3c3c40";
    rr(c, x + h.w * 0.6, y + h.h - 26, 34, 12, 3); c.fill();
    c.fillRect(x + h.w * 0.6 + 12, y + h.h - 14, 10, 10);
    c.fillStyle = "#8a5a33";
    rr(c, x + 22, y + h.h - 34, 26, 32, 5); c.fill();
    c.strokeStyle = "#5d3d20";
    c.beginPath(); c.moveTo(x + 22, y + h.h - 22); c.lineTo(x + 48, y + h.h - 22); c.stroke();
    const fl = 5 + Math.sin(t * 0.02) * 1.6;
    c.fillStyle = "#ff9c2e";
    c.beginPath(); c.ellipse(x + h.w * 0.68 + 8, y + h.h - 30, 5, fl + 4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#ffd76a";
    c.beginPath(); c.ellipse(x + h.w * 0.68 + 8, y + h.h - 28, 2.6, fl, 0, 0, Math.PI * 2); c.fill();
    return;
  }

  // Log walls
  c.fillStyle = "#8a5a33";
  rr(c, x, y + 22, h.w, h.h - 22, 3); c.fill();
  c.strokeStyle = "rgba(70,42,18,0.55)";
  c.lineWidth = 1.6;
  for (let ly = y + 34; ly < y + h.h - 4; ly += 11) {
    c.beginPath(); c.moveTo(x + 3, ly); c.lineTo(x + h.w - 3, ly); c.stroke();
  }
  c.fillStyle = "#6e4525";
  c.fillRect(x - 2, y + 22, 7, h.h - 22);
  c.fillRect(x + h.w - 5, y + 22, 7, h.h - 22);
  // Thatch roof with layered strokes
  c.fillStyle = "#a87f42";
  c.beginPath();
  c.moveTo(x - 13, y + 30); c.lineTo(x + h.w / 2, y - 34); c.lineTo(x + h.w + 13, y + 30);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(122,88,36,0.65)";
  c.lineWidth = 2;
  for (let i = -5; i <= 5; i++) {
    c.beginPath();
    c.moveTo(x + h.w / 2 + i * 4, y - 30);
    c.lineTo(x + h.w / 2 + i * (h.w / 9.4), y + 27);
    c.stroke();
  }
  c.fillStyle = "#8a6530";
  c.beginPath();
  c.moveTo(x - 13, y + 30); c.lineTo(x + h.w + 13, y + 30); c.lineTo(x + h.w + 6, y + 38); c.lineTo(x - 6, y + 38);
  c.closePath(); c.fill();
  // Carved fascia — white/red triangle trim, a Ukrainian touch
  for (let i = 0; i < Math.floor(h.w / 13); i++) {
    c.fillStyle = i % 2 === 0 ? "#f3e9d2" : "#b03a2e";
    const tx = x + 4 + i * 13;
    c.beginPath();
    c.moveTo(tx, y + 39); c.lineTo(tx + 6, y + 47); c.lineTo(tx + 12, y + 39);
    c.closePath(); c.fill();
  }
  // Ridge beam + chimney with smoke
  c.fillStyle = "#5d3d20";
  c.fillRect(x + h.w / 2 - 26, y - 38, 52, 6);
  c.fillStyle = "#7d7a74";
  c.fillRect(x + h.w * 0.68, y - 30, 15, 24);
  c.fillStyle = "#5c5a56";
  c.fillRect(x + h.w * 0.68 - 2, y - 33, 19, 5);
  for (let i = 0; i < 3; i++) {
    const ph = (t * 0.00016 + i / 3 + hash2(h.x, i)) % 1;
    c.fillStyle = `rgba(240,238,232,${0.5 * (1 - ph)})`;
    c.beginPath();
    c.arc(x + h.w * 0.68 + 8 + ph * 16 + Math.sin(ph * 6 + h.x) * 3, y - 38 - ph * 44, 4 + ph * 8, 0, Math.PI * 2);
    c.fill();
  }
  // Door + glowing window + flower box
  c.fillStyle = "#5d3d20";
  rr(c, x + h.w / 2 - 13, y + h.h - 44, 26, 44, 3); c.fill();
  c.fillStyle = "#d9a441";
  c.fillRect(x + h.w / 2 + 6, y + h.h - 24, 3.4, 3.4);
  c.fillStyle = "#ffd97a";
  rr(c, x + 20, y + 48, 26, 24, 2); c.fill();
  c.strokeStyle = "#5d3d20";
  c.lineWidth = 2.4;
  c.strokeRect(x + 20, y + 48, 26, 24);
  c.beginPath(); c.moveTo(x + 33, y + 48); c.lineTo(x + 33, y + 72); c.stroke();
  c.beginPath(); c.moveTo(x + 20, y + 60); c.lineTo(x + 46, y + 60); c.stroke();
  c.fillStyle = "#7a4a24";
  c.fillRect(x + 17, y + 73, 32, 6);
  c.fillStyle = "#d94f3d";
  for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(x + 22 + i * 8, y + 72, 2.6, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = "#4c7a2e";
  for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(x + 24 + i * 8, y + 75, 2.4, 0, Math.PI * 2); c.fill(); }
}

function drawWell(c: CanvasRenderingContext2D, camX: number, camY: number) {
  const x = WELL.x - camX;
  const y = WELL.y - camY;
  c.fillStyle = "rgba(30,50,20,0.25)";
  c.beginPath(); c.ellipse(x + 34, y + 52, 42, 10, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#8d8b85";
  rr(c, x + 4, y + 26, 60, 26, 5); c.fill();
  c.fillStyle = "#74726c";
  c.fillRect(x + 4, y + 34, 60, 3);
  c.fillRect(x + 4, y + 44, 60, 3);
  c.fillStyle = "#2c3844";
  c.beginPath(); c.ellipse(x + 34, y + 28, 25, 6, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#6e4525";
  c.fillRect(x + 2, y - 8, 6, 40);
  c.fillRect(x + 60, y - 8, 6, 40);
  c.fillStyle = "#a87f42";
  c.beginPath();
  c.moveTo(x - 6, y - 4); c.lineTo(x + 34, y - 30); c.lineTo(x + 74, y - 4);
  c.closePath(); c.fill();
  c.strokeStyle = "#5d3d20";
  c.lineWidth = 3;
  c.beginPath(); c.moveTo(x + 6, y - 8); c.lineTo(x + 62, y - 8); c.stroke();
  c.strokeStyle = "#c9b18a";
  c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(x + 34, y - 8); c.lineTo(x + 34, y + 12); c.stroke();
  c.fillStyle = "#7a4a24";
  rr(c, x + 27, y + 12, 14, 12, 2); c.fill();
}

function drawFire(c: CanvasRenderingContext2D, camX: number, camY: number, t: number) {
  const x = FIRE.x - camX + 34;
  const y = FIRE.y - camY + 26;
  const glow = c.createRadialGradient(x, y - 6, 6, x, y - 6, 90);
  glow.addColorStop(0, "rgba(255,166,60,0.4)");
  glow.addColorStop(1, "rgba(255,166,60,0)");
  c.fillStyle = glow;
  c.fillRect(x - 90, y - 96, 180, 180);
  c.fillStyle = "#8d8b85";
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    c.beginPath(); c.ellipse(x + Math.cos(a) * 24, y + Math.sin(a) * 9, 5.4, 4, a, 0, Math.PI * 2); c.fill();
  }
  c.strokeStyle = "#6e4525";
  c.lineWidth = 5;
  c.beginPath(); c.moveTo(x - 15, y + 4); c.lineTo(x + 13, y - 3); c.stroke();
  c.beginPath(); c.moveTo(x + 15, y + 4); c.lineTo(x - 13, y - 3); c.stroke();
  const fl = Math.sin(t * 0.016) * 2.4 + Math.sin(t * 0.043) * 1.4;
  c.fillStyle = "#ff8b2e";
  c.beginPath(); c.ellipse(x, y - 10, 8.6, 13 + fl, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#ffb02e";
  c.beginPath(); c.ellipse(x, y - 8, 5.6, 9 + fl * 0.7, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#ffe89a";
  c.beginPath(); c.ellipse(x, y - 5, 2.8, 5 + fl * 0.4, 0, 0, Math.PI * 2); c.fill();
  // log benches
  c.fillStyle = "#7a4a24";
  rr(c, x - 74, y - 4, 34, 9, 4); c.fill();
  rr(c, x + 40, y - 4, 34, 9, 4); c.fill();
  // The cooking pot: an iron tripod and a hanging kettle over the flames —
  // karas soup has a home now (Cooking skill, 1 fish + 1 herb).
  c.strokeStyle = "#3c3630";
  c.lineWidth = 2.4;
  c.beginPath(); c.moveTo(x - 17, y + 7); c.lineTo(x, y - 27); c.stroke();
  c.beginPath(); c.moveTo(x + 17, y + 7); c.lineTo(x, y - 27); c.stroke();
  c.beginPath(); c.moveTo(x, y - 27); c.lineTo(x, y - 19); c.stroke();
  c.fillStyle = "#2e2a26";
  c.beginPath(); c.ellipse(x, y - 13, 11.5, 8, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#6e7a3a";
  c.beginPath(); c.ellipse(x, y - 16.4, 9.4, 3.6, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#f28c1e";
  c.beginPath(); c.arc(x - 3.4, y - 16.8, 1.7, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#f5f2e6";
  c.beginPath(); c.arc(x + 3.8, y - 16.2, 1.5, 0, Math.PI * 2); c.fill();
  // a wisp of soup steam
  const st = (t * 0.0004) % 1;
  c.fillStyle = `rgba(240,238,232,${0.4 * (1 - st)})`;
  c.beginPath(); c.arc(x + Math.sin(st * 5) * 2.4, y - 22 - st * 15, 2.4 + st * 3.4, 0, Math.PI * 2); c.fill();
}

// Vesna's alchemy bench: a drying rack hung with herb bundles over a
// little copper cauldron, south of the north-east hut (BREW_SPOT).
function drawBrewBench(c: CanvasRenderingContext2D, camX: number, camY: number, t: number) {
  const x = BREW_SPOT.x - camX;
  const y = BREW_SPOT.y - camY;
  c.fillStyle = "rgba(30,50,20,0.25)";
  c.beginPath(); c.ellipse(x, y + 8, 34, 8, 0, 0, Math.PI * 2); c.fill();
  // rack posts + crossbar
  c.fillStyle = "#6e4525";
  c.fillRect(x - 26, y - 34, 4.6, 42);
  c.fillRect(x + 22, y - 34, 4.6, 42);
  c.fillRect(x - 29, y - 36, 58, 4.4);
  // hanging herb bundles — a colour for every kind on the znak harka's shelf
  const bundleCols = ["#3f7a2e", "#8a9678", "#f28c1e", "#f2c416", "#e8e2cc"];
  bundleCols.forEach((col, i) => {
    const bx = x - 21 + i * 11;
    const sway = Math.sin(t * 0.002 + i * 1.7) * 1.2;
    c.strokeStyle = "#c9b18a";
    c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(bx, y - 32); c.lineTo(bx + sway, y - 24); c.stroke();
    c.fillStyle = col;
    c.beginPath(); c.ellipse(bx + sway, y - 19, 3.6, 5.6, sway * 0.06, 0, Math.PI * 2); c.fill();
  });
  // the cauldron, gently at work
  c.fillStyle = "#4a3b2c";
  c.beginPath(); c.ellipse(x + 1, y + 3, 12.5, 8.6, 0, 0, Math.PI * 2); c.fill();
  const bub = 0.5 + Math.sin(t * 0.006) * 0.3;
  c.fillStyle = `rgba(140,220,150,${bub})`;
  c.beginPath(); c.ellipse(x + 1, y - 0.6, 9.6, 3.8, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "rgba(210,250,215,0.9)";
  const bph = (t * 0.05) % 9;
  c.beginPath(); c.arc(x - 3 + (bph % 3) * 3, y - 3 - bph * 0.7, 1.4, 0, Math.PI * 2); c.fill();
  // a stoppered bottle, ready for a tonic
  c.fillStyle = "#7fb069";
  rr(c, x + 19, y - 3, 5.4, 9, 2); c.fill();
  c.fillStyle = "#c9a86a";
  c.fillRect(x + 20.4, y - 6, 2.6, 3);
}

// The crust of bread waiting by the campfire for a kind traveller.
function drawCrust(c: CanvasRenderingContext2D, camX: number, camY: number, t: number) {
  const x = CRUST_SPOT.x - camX;
  const y = CRUST_SPOT.y - camY;
  const pulse = 0.5 + Math.sin(t * 0.004) * 0.22;
  const g = c.createRadialGradient(x, y, 2, x, y, 24);
  g.addColorStop(0, `rgba(255,214,130,${pulse * 0.55})`);
  g.addColorStop(1, "rgba(255,214,130,0)");
  c.fillStyle = g;
  c.fillRect(x - 24, y - 24, 48, 48);
  // a folded cloth, and the crust on it
  c.fillStyle = "#efe3c8";
  c.beginPath(); c.ellipse(x, y + 3, 13, 5, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#c98d45";
  c.beginPath(); c.ellipse(x, y, 8.6, 5.6, -0.15, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#a86f2e";
  c.beginPath(); c.ellipse(x - 1, y - 1.4, 6.4, 3.8, -0.15, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#8a5a24";
  c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(x - 4, y - 2.6); c.lineTo(x + 2, y - 1.2); c.stroke();
  // a pinch of salt beside it — the Domovyk is particular
  c.fillStyle = "#ffffff";
  c.beginPath(); c.arc(x + 9, y + 2, 1.7, 0, Math.PI * 2); c.fill();
}

// Fishing: a rod leaning over the shore, the line, and the bobber. While a
// fish bites, the bobber dunks and rings spread — that is the moment to
// reel in. Drawn in world space (world coords minus camera).
function drawFishing(
  c: CanvasRenderingContext2D,
  px: number, py: number,
  camX: number, camY: number, t: number,
  phase: "wait" | "bite",
) {
  const sx = px - camX;
  const sy = py - camY;
  const bx = BOBBER.x - camX;
  const bobDip = phase === "bite" ? Math.abs(Math.sin(t * 0.03)) * 3.4 : Math.sin(t * 0.003) * 1.1;
  const by = BOBBER.y - camY + bobDip;
  // the rod, angled from the player's hands over the water
  c.strokeStyle = "#7a5a30";
  c.lineWidth = 2.4;
  c.beginPath(); c.moveTo(sx + 6, sy - 22); c.lineTo(sx + 44, sy - 44); c.stroke();
  // the line, sagging a little
  c.strokeStyle = "rgba(240,240,230,0.75)";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(sx + 44, sy - 44);
  c.quadraticCurveTo((sx + 44 + bx) / 2, Math.min(sy - 44, by) - 12 + Math.abs(bx - sx) * 0.04, bx, by - 3);
  c.stroke();
  // ripples around the bobber — frantic while biting
  const rings = phase === "bite" ? 3 : 2;
  for (let i = 0; i < rings; i++) {
    const rp = ((t * (phase === "bite" ? 0.06 : 0.02) + i * 7) % 14);
    c.strokeStyle = `rgba(230,245,250,${0.5 * (1 - rp / 14)})`;
    c.lineWidth = 1.2;
    c.beginPath(); c.ellipse(bx, by + 2, 4 + rp, (4 + rp) * 0.36, 0, 0, Math.PI * 2); c.stroke();
  }
  // the bobber: red over white, the village way
  c.fillStyle = "#f3e9d2";
  c.beginPath(); c.ellipse(bx, by, 3.4, 4.4, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#c23b2a";
  c.beginPath(); c.ellipse(bx, by - 1.8, 3.4, 2.6, 0, Math.PI, 2 * Math.PI); c.fill();
  if (phase === "bite") {
    // splashes
    c.fillStyle = "rgba(225,242,250,0.9)";
    for (let i = 0; i < 4; i++) {
      const a = hash2(i, Math.floor(t / 90)) * Math.PI * 2;
      c.fillRect(bx + Math.cos(a) * 6, by - 3 - hash2(i, 3) * 4, 1.7, 1.7);
    }
  }
}

function drawFence(c: CanvasRenderingContext2D, f: Rect, camX: number, camY: number) {
  const x = f.x - camX;
  const y = f.y - camY;
  c.fillStyle = "#9a7448";
  if (f.w >= f.h) {
    c.fillRect(x, y + 2, f.w, 3.4);
    c.fillRect(x, y + 7, f.w, 3.4);
    for (let px = x + 2; px < x + f.w; px += 22) c.fillRect(px, y - 2, 5, 15);
  } else {
    c.fillRect(x + 2, y, 3.4, f.h);
    c.fillRect(x + 7, y, 3.4, f.h);
    for (let py = y + 2; py < y + f.h; py += 22) c.fillRect(x - 2, py, 15, 5);
  }
}

function drawHerbPatch(c: CanvasRenderingContext2D, sx: number, sy: number, camX: number, camY: number, t: number, available: boolean, herb: HerbDef) {
  const x = sx - camX;
  const y = sy - camY;
  if (!available) {
    c.fillStyle = "#548636";
    for (let i = 0; i < 4; i++) {
      c.beginPath(); c.arc(x - 8 + i * 5.4, y + (i % 2) * 3, 3.4, 0, Math.PI * 2); c.fill();
    }
    return;
  }
  const pulse = 0.55 + Math.sin(t * 0.004 + sx) * 0.25;
  const g = c.createRadialGradient(x, y, 2, x, y, 30);
  g.addColorStop(0, `rgba(${herb.glow},${pulse * 0.5})`);
  g.addColorStop(1, `rgba(${herb.glow},0)`);
  c.fillStyle = g;
  c.fillRect(x - 30, y - 30, 60, 60);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + hash2(sx, i) * 0.6;
    const lx = x + Math.cos(a) * 10;
    const ly = y + Math.sin(a) * 5;
    c.strokeStyle = herb.leaf;
    c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(lx, ly + 5); c.quadraticCurveTo(lx + 2, ly, lx + 3, ly - 6); c.stroke();
    c.fillStyle = herb.flower;
    c.beginPath(); c.arc(lx + 3, ly - 7, 3, 0, Math.PI * 2); c.fill();
    c.fillStyle = herb.flowerCore;
    c.beginPath(); c.arc(lx + 3, ly - 7, 1.3, 0, Math.PI * 2); c.fill();
  }
  const sp = (t * 0.03 + sx) % 14;
  c.fillStyle = "rgba(255,240,180,0.9)";
  c.fillRect(x + Math.sin(t * 0.003 + sx) * 12, y - 10 - sp, 1.8, 1.8);
}

function drawPerson(
  c: CanvasRenderingContext2D,
  x: number, y: number,
  opts: { tunic: string; hair: string; style: "player" | "elder" | "herbalist" | "smith"; moving: boolean; phase: number; face: number; t: number; shadow?: boolean },
) {
  const bob = opts.moving ? Math.abs(Math.sin(opts.phase)) * 2.2 : Math.sin(opts.t * 0.002 + x * 0.13) * 0.7;
  const top = y - 40 + bob * 0.4;
  // shadow === false: the Chort has it. It is a bargain, not a bug.
  if (opts.shadow !== false) {
    c.fillStyle = "rgba(30,50,20,0.3)";
    c.beginPath(); c.ellipse(x, y + 3, 13, 4.6, 0, 0, Math.PI * 2); c.fill();
  }
  const swing = opts.moving ? Math.sin(opts.phase) * 3.4 : 0;
  // legs + boots
  c.fillStyle = "#4c3a28";
  c.fillRect(x - 7, top + 27 + (swing > 0 ? -swing * 0.4 : 0), 5.6, 9);
  c.fillRect(x + 1.6, top + 27 + (swing < 0 ? swing * 0.4 : 0), 5.6, 9);
  c.fillStyle = "#2c2015";
  c.fillRect(x - 7.6, top + 34.4 + (swing > 0 ? -swing * 0.4 : 0), 7, 3.4);
  c.fillRect(x + 1.2, top + 34.4 + (swing < 0 ? swing * 0.4 : 0), 7, 3.4);
  // arms
  c.fillStyle = opts.tunic;
  c.fillRect(x - 12.4, top + 12 - swing * 0.5, 4.6, 13);
  c.fillRect(x + 7.8, top + 12 + swing * 0.5, 4.6, 13);
  c.fillStyle = "#e8b88a";
  c.fillRect(x - 12.4, top + 24 - swing * 0.5, 4.6, 3.6);
  c.fillRect(x + 7.8, top + 24 + swing * 0.5, 4.6, 3.6);
  // tunic body
  c.fillStyle = opts.tunic;
  rr(c, x - 9, top + 9, 18, 20, 3); c.fill();
  if (opts.style === "player" || opts.style === "herbalist") {
    // embroidered chest — white base with red pattern for the player
    if (opts.style === "player") {
      c.fillStyle = "#efe3c8";
      rr(c, x - 9, top + 9, 18, 20, 3); c.fill();
      c.fillStyle = "#b03a2e";
      for (let i = 0; i < 3; i++) c.fillRect(x - 1.2, top + 12 + i * 5, 2.4, 2.4);
      c.fillRect(x - 5, top + 14.4, 2, 2);
      c.fillRect(x + 3, top + 14.4, 2, 2);
      c.fillRect(x - 5, top + 24.4, 2, 2);
      c.fillRect(x + 3, top + 24.4, 2, 2);
    } else {
      c.fillStyle = "#f3e9d2";
      c.fillRect(x - 9, top + 20, 18, 3);
      c.fillStyle = "#e8b13c";
      for (let i = 0; i < 4; i++) c.fillRect(x - 7 + i * 4.4, top + 21, 2, 1.6);
    }
  }
  if (opts.style === "smith") {
    c.fillStyle = "#33302c";
    rr(c, x - 7, top + 13, 14, 15, 2); c.fill();
  }
  // belt
  c.fillStyle = "#5d3d20";
  c.fillRect(x - 9, top + 25, 18, 3.4);
  c.fillStyle = "#d9a441";
  c.fillRect(x - 1.8, top + 25.4, 3.6, 2.6);
  // head
  c.fillStyle = "#e8b88a";
  rr(c, x - 7, top - 5, 14, 14, 4); c.fill();
  c.fillStyle = "#2e2018";
  const fx = clamp(opts.face, -1.6, 1.6);
  c.fillRect(x - 3.6 + fx, top + 2.4, 2, 2.6);
  c.fillRect(x + 1.8 + fx, top + 2.4, 2, 2.6);
  if (opts.style === "elder") {
    c.fillStyle = opts.hair;
    rr(c, x - 7.6, top - 6.4, 15.2, 6, 3); c.fill();
    c.fillStyle = "#cfc8bb";
    rr(c, x - 5.4, top + 5, 10.8, 7.6, 3); c.fill(); // beard
  } else if (opts.style === "herbalist") {
    c.fillStyle = opts.hair;
    rr(c, x - 8, top - 6.4, 16, 7, 3); c.fill();
    c.fillRect(x - 8.6, top, 4.4, 15);
    c.fillRect(x + 4.2, top, 4.4, 15);
    // flower wreath
    const wc = ["#d94f3d", "#f2c14e", "#f5efdc", "#d96a5a"];
    for (let i = 0; i < 5; i++) {
      c.fillStyle = wc[i % wc.length] ?? "#fff";
      c.beginPath(); c.arc(x - 6 + i * 3, top - 5.4, 1.7, 0, Math.PI * 2); c.fill();
    }
  } else if (opts.style === "player") {
    c.fillStyle = opts.hair;
    rr(c, x - 7.4, top - 6.2, 14.8, 6.4, 3); c.fill();
    c.fillStyle = "#b03a2e"; // headband
    c.fillRect(x - 7.4, top - 1.6, 14.8, 2.4);
  } else {
    c.fillStyle = opts.hair;
    rr(c, x - 7.4, top - 6.2, 14.8, 5.6, 3); c.fill();
  }
}

function drawChicken(c: CanvasRenderingContext2D, x: number, y: number, peck: number, camX: number, camY: number) {
  const sx = x - camX;
  const sy = y - camY;
  c.fillStyle = "rgba(30,50,20,0.22)";
  c.beginPath(); c.ellipse(sx, sy + 3, 8, 2.8, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#f5efdc";
  c.beginPath(); c.ellipse(sx, sy - 3, 8.4, 6, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(sx - 7, sy - 8, 4.4, 2.6, -0.7, 0, Math.PI * 2); c.fill();
  const hy = sy - 8 + peck * 4;
  c.beginPath(); c.arc(sx + 7.4, hy, 3.8, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#d94f3d";
  c.beginPath(); c.arc(sx + 7.4, hy - 3.8, 1.8, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#e8a020";
  c.beginPath();
  c.moveTo(sx + 10.8, hy); c.lineTo(sx + 13.6, hy + 1.4); c.lineTo(sx + 10.8, hy + 2.6);
  c.closePath(); c.fill();
  c.fillStyle = "#2e2018";
  c.fillRect(sx + 7.8, hy - 1, 1.4, 1.4);
}

// --- Spirit drawing ---------------------------------------------------------
// x, y are the ground point (feet / waterline), already camera-shifted.

function drawDomovyk(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const bob = Math.sin(t * 0.0024 + x * 0.2) * 1.1;
  const top = y - 30 + bob;
  c.fillStyle = "rgba(30,50,20,0.3)";
  c.beginPath(); c.ellipse(x, y + 2, 12, 3.8, 0, 0, Math.PI * 2); c.fill();
  // shaggy fur body — a small walking haystack of a spirit
  c.fillStyle = "#6e5136";
  c.beginPath(); c.ellipse(x, top + 17, 11.5, 13, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#5d432c";
  c.lineWidth = 1.4;
  for (let i = -2; i <= 2; i++) {
    c.beginPath(); c.moveTo(x + i * 4.4, top + 8); c.lineTo(x + i * 4.8, top + 27); c.stroke();
  }
  // great grey-brown beard
  c.fillStyle = "#a08b6d";
  c.beginPath(); c.ellipse(x, top + 14, 7.6, 9, 0, 0, Math.PI * 2); c.fill();
  // face peeking out of the hair
  c.fillStyle = "#e8b88a";
  c.beginPath(); c.ellipse(x, top + 6.4, 5.6, 4.8, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#2e2018";
  c.fillRect(x - 3.4, top + 5.6, 1.9, 2.3);
  c.fillRect(x + 1.6, top + 5.6, 1.9, 2.3);
  c.fillStyle = "#c98a5a";
  c.beginPath(); c.arc(x, top + 8.6, 1.5, 0, Math.PI * 2); c.fill();
  // a tiny wooden spoon, tucked in like a sceptre — he takes the pich seriously
  c.strokeStyle = "#c9a86a";
  c.lineWidth = 2;
  c.beginPath(); c.moveTo(x + 9, top + 16); c.lineTo(x + 13.4, top + 7); c.stroke();
  c.fillStyle = "#c9a86a";
  c.beginPath(); c.ellipse(x + 14, top + 5.8, 2.6, 3.4, 0.5, 0, Math.PI * 2); c.fill();
}

function drawLisovyk(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const sway = Math.sin(t * 0.0016 + x * 0.07) * 1.6;
  c.fillStyle = "rgba(20,40,16,0.35)";
  c.beginPath(); c.ellipse(x, y + 3, 17, 5, 0, 0, Math.PI * 2); c.fill();
  // long moss-cloak, tree-tall
  c.fillStyle = "#33502e";
  c.beginPath();
  c.moveTo(x + sway, y - 84);
  c.lineTo(x - 16, y + 1);
  c.lineTo(x + 16, y + 1);
  c.closePath(); c.fill();
  c.fillStyle = "#3d5c34";
  c.beginPath();
  c.moveTo(x + sway, y - 84);
  c.lineTo(x - 6, y + 1);
  c.lineTo(x + 8, y + 1);
  c.closePath(); c.fill();
  // cloak ragged hem + moss patches
  c.fillStyle = "#557d3a";
  for (const [px, py, pr] of [[-8, -26, 4.6], [6, -44, 3.8], [-3, -12, 3.2]] as const) {
    c.beginPath(); c.arc(x + px + sway * 0.5, y + py, pr, 0, Math.PI * 2); c.fill();
  }
  // bark-brown arms, one holding a gnarled staff
  c.strokeStyle = "#4c3a26";
  c.lineWidth = 4.4;
  c.beginPath(); c.moveTo(x - 9 + sway, y - 62); c.lineTo(x - 16, y - 30); c.stroke();
  c.beginPath(); c.moveTo(x + 9 + sway, y - 62); c.lineTo(x + 15, y - 38); c.stroke();
  c.strokeStyle = "#5d4630";
  c.lineWidth = 3.4;
  c.beginPath(); c.moveTo(x + 17, y + 2); c.lineTo(x + 15, y - 62); c.stroke();
  c.beginPath(); c.moveTo(x + 15, y - 62); c.lineTo(x + 22, y - 70); c.stroke();
  // head: aged face, long moss beard, branching antlers
  c.fillStyle = "#c9a678";
  c.beginPath(); c.ellipse(x + sway, y - 88, 8.4, 9.4, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#6f8152";
  c.beginPath(); c.ellipse(x + sway, y - 78, 6.4, 8.6, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#6e5638";
  c.lineWidth = 2.6;
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(x + sway + s * 5, y - 95);
    c.quadraticCurveTo(x + sway + s * 15, y - 104, x + sway + s * 19, y - 116);
    c.stroke();
    c.lineWidth = 1.9;
    c.beginPath();
    c.moveTo(x + sway + s * 12, y - 101);
    c.lineTo(x + sway + s * 17, y - 108);
    c.stroke();
    c.lineWidth = 2.6;
  }
  // amber eyes that do not blink
  const glow = 0.72 + Math.sin(t * 0.003 + x) * 0.22;
  c.fillStyle = `rgba(255,178,44,${glow})`;
  c.fillRect(x + sway - 4.6, y - 90.4, 2.8, 2.8);
  c.fillRect(x + sway + 1.9, y - 90.4, 2.8, 2.8);
}

function drawChort(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const hop = Math.abs(Math.sin(t * 0.004 + x * 0.1)) * 1.6;
  const top = y - 40 - hop;
  c.fillStyle = "rgba(30,20,20,0.3)";
  c.beginPath(); c.ellipse(x, y + 2, 11, 3.6, 0, 0, Math.PI * 2); c.fill();
  // curling tail with an arrow tip, wagging like a dog at a market stall
  const wag = Math.sin(t * 0.006 + x) * 4;
  c.strokeStyle = "#40232a";
  c.lineWidth = 2.6;
  c.beginPath();
  c.moveTo(x + 6, top + 30);
  c.quadraticCurveTo(x + 16, top + 32, x + 15 + wag, top + 18);
  c.stroke();
  c.fillStyle = "#40232a";
  c.beginPath();
  c.moveTo(x + 15 + wag, top + 12);
  c.lineTo(x + 11.4 + wag, top + 19);
  c.lineTo(x + 18.6 + wag, top + 19);
  c.closePath(); c.fill();
  // little hooves and legs
  c.fillStyle = "#40232a";
  c.fillRect(x - 6.4, top + 30, 4.6, 8);
  c.fillRect(x + 2, top + 30, 4.6, 8);
  c.fillStyle = "#241a1c";
  c.fillRect(x - 7.4, top + 37, 6.2, 3);
  c.fillRect(x + 1.6, top + 37, 6.2, 3);
  // red waistcoat, because a devil doing business dresses for it
  c.fillStyle = "#7e2430";
  rr(c, x - 8, top + 11, 16, 21, 3); c.fill();
  c.fillStyle = "#d9a441";
  c.fillRect(x - 0.8, top + 15, 1.6, 2.2);
  c.fillRect(x - 0.8, top + 20, 1.6, 2.2);
  c.fillRect(x - 0.8, top + 25, 1.6, 2.2);
  // arms — one doffing an invisible hat, endlessly polite
  c.strokeStyle = "#40232a";
  c.lineWidth = 3.6;
  c.beginPath(); c.moveTo(x - 7.4, top + 14); c.lineTo(x - 12.4, top + 24); c.stroke();
  c.beginPath(); c.moveTo(x + 7.4, top + 14); c.lineTo(x + 12.6, top + 9 + Math.sin(t * 0.003) * 1.6); c.stroke();
  // head: dark, sly, horned
  c.fillStyle = "#503038";
  c.beginPath(); c.ellipse(x, top + 4, 7.6, 7.8, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#e7ddc4";
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(x + s * 4.6, top - 1.6);
    c.quadraticCurveTo(x + s * 8.6, top - 6.4, x + s * 7.8, top - 11);
    c.quadraticCurveTo(x + s * 4.8, top - 7, x + s * 3.2, top - 3.4);
    c.closePath(); c.fill();
  }
  // a salesman's grin and one raised brow
  c.fillStyle = "#ffd76a";
  c.fillRect(x - 4.2, top + 2.4, 2.4, 2.4);
  c.fillRect(x + 1.9, top + 2.4, 2.4, 2.4);
  c.strokeStyle = "#f3e9d2";
  c.lineWidth = 1.4;
  c.beginPath(); c.arc(x, top + 6.4, 3.8, 0.25, Math.PI - 0.25); c.stroke();
  // pitchfork planted beside him, polished like a shop sign
  c.strokeStyle = "#8a8d90";
  c.lineWidth = 1.8;
  c.beginPath(); c.moveTo(x - 17, top + 40); c.lineTo(x - 17, top + 8); c.stroke();
  c.beginPath(); c.moveTo(x - 20.4, top + 14); c.lineTo(x - 20.4, top + 8); c.lineTo(x - 17, top + 11); c.lineTo(x - 13.6, top + 8); c.lineTo(x - 13.6, top + 14); c.stroke();
}

function drawBolotianyk(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  // murk ring where he breaks the pond's surface
  c.fillStyle = "rgba(52,74,52,0.5)";
  c.beginPath(); c.ellipse(x, y + 14, 34, 10, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(220,235,205,0.4)";
  c.lineWidth = 1.4;
  const rip = (t * 0.02) % 16;
  c.beginPath(); c.ellipse(x, y + 14, 20 + rip, 6 + rip * 0.32, 0, 0, Math.PI * 2); c.stroke();
  const rise = Math.sin(t * 0.0009) * 3;
  const top = y - 26 + rise;
  // bloated swamp body, half-sunk
  c.fillStyle = "#46584a";
  c.beginPath(); c.ellipse(x, top + 22, 17, 15, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#57695a";
  c.beginPath(); c.ellipse(x - 4, top + 16, 10, 9, 0, 0, Math.PI * 2); c.fill();
  // dripping arms trailing pondweed
  c.strokeStyle = "#3d5040";
  c.lineWidth = 5;
  c.beginPath(); c.moveTo(x - 14, top + 18); c.quadraticCurveTo(x - 21, top + 28, x - 18, top + 38); c.stroke();
  c.beginPath(); c.moveTo(x + 14, top + 18); c.quadraticCurveTo(x + 21, top + 28, x + 18, top + 38); c.stroke();
  c.strokeStyle = "#5d7050";
  c.lineWidth = 1.8;
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(x + s * 18, top + 36); c.lineTo(x + s * 19, top + 44); c.stroke();
  }
  // broad drowned-log head with eyes on top, like a frog that knows things
  c.fillStyle = "#4c5f4e";
  c.beginPath(); c.ellipse(x, top + 4, 13.4, 8.6, 0, 0, Math.PI * 2); c.fill();
  for (const s of [-1, 1]) {
    c.fillStyle = "#4c5f4e";
    c.beginPath(); c.arc(x + s * 6.8, top - 4.6, 4, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#e8e3b0";
    c.beginPath(); c.arc(x + s * 6.8, top - 4.8, 2.7, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#141c14";
    c.fillRect(x + s * 6.8 - 0.7, top - 7, 1.4, 4.2);
  }
  // wide, patient mouth
  c.strokeStyle = "#2c3a2e";
  c.lineWidth = 1.8;
  c.beginPath(); c.arc(x, top + 5, 8, 0.35, Math.PI - 0.35); c.stroke();
  // reeds and a lily caught on his crown
  c.strokeStyle = "#3e6b2a";
  c.lineWidth = 2;
  for (const [dx, len] of [[-9, 15], [-4, 19], [3, 13]] as const) {
    c.beginPath(); c.moveTo(x + dx, top - 2); c.lineTo(x + dx - 1.6, top - 2 - len); c.stroke();
  }
  c.fillStyle = "#4d8a3d";
  c.beginPath(); c.ellipse(x + 9, top - 3, 5.4, 3.2, 0.4, 0, Math.PI * 2); c.fill();
  // drips
  c.fillStyle = "rgba(200,225,235,0.75)";
  const drip = (t * 0.045) % 13;
  c.fillRect(x - 17.4, top + 36 + drip, 1.6, 3);
  c.fillRect(x + 16.2, top + 34 + ((t * 0.045 + 6) % 13), 1.6, 3);
}

function drawVij(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  // Vij: a giant ash-grey head planted in the hollow, servants and all.
  // x, y is the ground point at his chin; he is ~150px wide, ~170 tall.
  c.fillStyle = "rgba(12,8,18,0.5)";
  c.beginPath(); c.ellipse(x, y + 8, 96, 20, 0, 0, Math.PI * 2); c.fill();
  const breathe = Math.sin(t * 0.0009) * 2.2; // the mountain, breathing
  const hy = y - 74 + breathe;
  // withered servants leaning on the eyelid forks, motionless
  for (const s of [-1, 1]) {
    const sx = x + s * 96;
    c.fillStyle = "#241f2c";
    c.beginPath(); c.ellipse(sx, y - 34, 9, 24, s * 0.12, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#3a3444";
    c.beginPath(); c.arc(sx, y - 60, 6.4, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#6d6a72";
    c.lineWidth = 2.6;
    c.beginPath(); c.moveTo(sx, y - 6); c.lineTo(x + s * 44, hy - 24); c.stroke();
    c.lineWidth = 1.7;
    c.beginPath(); c.moveTo(x + s * 44, hy - 24); c.lineTo(x + s * 38, hy - 33); c.stroke();
    c.beginPath(); c.moveTo(x + s * 44, hy - 24); c.lineTo(x + s * 50, hy - 33); c.stroke();
  }
  // the great head
  const hg = c.createRadialGradient(x - 26, hy - 44, 18, x, hy, 96);
  hg.addColorStop(0, "#8d877e");
  hg.addColorStop(1, "#5f5a52");
  c.fillStyle = hg;
  c.beginPath(); c.ellipse(x, hy, 72, 66, 0, 0, Math.PI * 2); c.fill();
  // cracked, veined skin
  c.strokeStyle = "rgba(52,46,40,0.5)";
  c.lineWidth = 1.3;
  for (let i = 0; i < 6; i++) {
    const a = hash2(i, 601) * Math.PI * 2;
    c.beginPath();
    c.moveTo(x + Math.cos(a) * 46, hy + Math.sin(a) * 40 - 18);
    c.lineTo(x + Math.cos(a + 0.5) * 66, hy + Math.sin(a + 0.5) * 58 - 14);
    c.stroke();
  }
  // brow ridge like a cliff
  c.fillStyle = "#6d675e";
  c.beginPath(); c.ellipse(x, hy - 34, 62, 15, 0, 0, Math.PI * 2); c.fill();
  // THE EYELIDS — hanging from the brow all the way to the ground, the
  // whole horror of him. Every so often one seam twitches open a crack.
  const seamCycle = t % 11000;
  const seam = seamCycle > 9200 && seamCycle < 10300
    ? Math.sin(((seamCycle - 9200) / 1100) * Math.PI) * 5
    : 0;
  for (const s of [-1, 1]) {
    const lx = x + s * 31;
    const lg = c.createLinearGradient(lx, hy - 30, lx, y + 4);
    lg.addColorStop(0, "#7b7568");
    lg.addColorStop(1, "#57524a");
    c.fillStyle = lg;
    c.beginPath();
    c.moveTo(lx - 29, hy - 32);
    c.quadraticCurveTo(lx, hy - 40, lx + 29, hy - 32);
    c.quadraticCurveTo(lx + 26, y - 6, lx + 17, y + 3);
    c.quadraticCurveTo(lx, y + 8, lx - 17, y + 3);
    c.quadraticCurveTo(lx - 26, y - 6, lx - 29, hy - 32);
    c.closePath(); c.fill();
    // lid veins and seam
    c.strokeStyle = "rgba(64,44,48,0.65)";
    c.lineWidth = 1.5;
    for (let v = -1; v <= 1; v++) {
      c.beginPath();
      c.moveTo(lx + v * 11, hy - 30);
      c.quadraticCurveTo(lx + v * 13, hy + 6, lx + v * 8, y - 1);
      c.stroke();
    }
    c.strokeStyle = "rgba(30,22,20,0.85)";
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(lx - 22, y + 1);
    c.quadraticCurveTo(lx, y + 6, lx + 22, y + 1);
    c.stroke();
    if (seam > 0.4) {
      // a slit of dull red light under the lid — he is dreaming, or listening
      c.fillStyle = `rgba(255,64,32,${0.35 + seam * 0.09})`;
      c.beginPath(); c.ellipse(lx, y + 1 - seam * 0.4, 15, seam * 0.55, 0, 0, Math.PI * 2); c.fill();
    }
  }
  // nose and a mouth that has not spoken in an age
  c.fillStyle = "#655f56";
  c.beginPath(); c.ellipse(x, hy + 16, 13, 19, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "rgba(40,34,30,0.7)";
  c.beginPath(); c.ellipse(x - 5.4, hy + 30, 2.6, 3.6, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(x + 5.4, hy + 30, 2.6, 3.6, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(34,28,26,0.8)";
  c.lineWidth = 2.6;
  c.beginPath();
  c.moveTo(x - 21, y - 8);
  c.quadraticCurveTo(x, y - 3 + breathe * 0.4, x + 21, y - 8);
  c.stroke();
  // sparse hairs like dead grass on the crown
  c.strokeStyle = "#494540";
  c.lineWidth = 1.6;
  for (let i = 0; i < 7; i++) {
    const hx = x - 30 + i * 10 + hash2(i, 607) * 5;
    c.beginPath(); c.moveTo(hx, hy - 60); c.lineTo(hx + (hash2(i, 611) - 0.5) * 7, hy - 72 - hash2(i, 613) * 6); c.stroke();
  }
}

// --- Lysa Hora drawing ------------------------------------------------------
// The summit is drawn at night: blue-rock ground, a huge crescent moon
// riding over the north edge, the sabbath bonfire, broomsticks and a
// cauldron by the stones, and witch silhouettes in the firelight.

function drawLysaGround(c: CanvasRenderingContext2D, camX: number, camY: number, vw: number, vh: number, t: number, offered: boolean) {
  // Night rock — layered blue-grey cells, no green anywhere. The mountain
  // is BALD: that is the whole point of Lysa Hora.
  const cell = 34;
  const x0 = Math.max(0, Math.floor(camX / cell) - 1);
  const y0 = Math.max(0, Math.floor(camY / cell) - 1);
  const x1 = Math.min(Math.ceil(LYSA_W / cell), Math.ceil((camX + vw) / cell) + 1);
  const y1 = Math.min(Math.ceil(LYSA_H / cell), Math.ceil((camY + vh) / cell) + 1);
  const shades = ["#4a4a58", "#474754", "#4d4d5c", "#434350"];
  for (let gy = y0; gy < y1; gy++) {
    for (let gx = x0; gx < x1; gx++) {
      const h = hash2(gx * 3, gy * 7);
      c.fillStyle = shades[Math.floor(h * shades.length)] ?? shades[0]!;
      c.fillRect(gx * cell - camX, gy * cell - camY, cell + 1, cell + 1);
      // rock cracks + pale lichen, never grass
      if (h > 0.72) {
        c.strokeStyle = "rgba(20,20,30,0.4)";
        c.lineWidth = 1.2;
        const bx = gx * cell - camX;
        const by = gy * cell - camY;
        c.beginPath();
        c.moveTo(bx + h * 20, by + 6);
        c.lineTo(bx + h * 26, by + 18);
        c.lineTo(bx + h * 14, by + 27);
        c.stroke();
      }
      if (h < 0.12) {
        c.fillStyle = "rgba(168,178,160,0.35)";
        c.beginPath();
        c.arc(gx * cell - camX + 10 + h * 90, gy * cell - camY + 12, 3.4, 0, Math.PI * 2);
        c.fill();
      }
    }
  }
  // The dome's crown — paler, worn rock around the summit circle.
  const dg = c.createRadialGradient(LYSA_SUMMIT.x - camX, LYSA_SUMMIT.y - camY, 30, LYSA_SUMMIT.x - camX, LYSA_SUMMIT.y - camY, 300);
  dg.addColorStop(0, "rgba(196,192,178,0.28)");
  dg.addColorStop(1, "rgba(196,192,178,0)");
  c.fillStyle = dg;
  c.fillRect(LYSA_SUMMIT.x - 300 - camX, LYSA_SUMMIT.y - 300 - camY, 600, 600);
  // The trail in from the west trailhead, switchbacking to the summit.
  c.strokeStyle = "#6b6252";
  c.lineWidth = 44;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(-10 - camX, 470 - camY);
  c.quadraticCurveTo(280 - camX, 520 - camY, 430 - camX, 452 - camY);
  c.quadraticCurveTo(540 - camX, 404 - camY, LYSA_SUMMIT.x - 120 - camX, LYSA_SUMMIT.y - camY);
  c.stroke();
  c.strokeStyle = "rgba(40,36,30,0.35)";
  c.lineWidth = 1.6;
  for (let i = 0; i < 46; i++) {
    const px = hash2(i, 801) * LYSA_W;
    const py = 380 + hash2(i, 803) * 190;
    if (px < camX - 8 || px > camX + vw + 8 || py < camY - 8 || py > camY + vh + 8) continue;
    c.beginPath(); c.arc(px - camX, py - camY, 1.6 + hash2(i, 805) * 2, 0, Math.PI * 2); c.stroke();
  }
  // Dead snags — the only "trees" the mountain allows, long burnt.
  c.strokeStyle = "#26222c";
  for (const [dx, dy] of [[240, 180], [1080, 700], [150, 760], [1150, 160]] as const) {
    const sx = dx - camX;
    const sy = dy - camY;
    c.lineWidth = 4;
    c.beginPath(); c.moveTo(sx, sy + 20); c.lineTo(sx + 3, sy - 22); c.stroke();
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(sx + 3, sy - 10); c.lineTo(sx - 12, sy - 24); c.stroke();
    c.beginPath(); c.moveTo(sx + 3, sy - 16); c.lineTo(sx + 16, sy - 28); c.stroke();
  }
  // The great crescent moon, low over the north edge — drawn in world
  // space so it hangs over the summit like a lamp.
  {
    const mx = 880 - camX;
    const my = 66 - camY;
    const mg = c.createRadialGradient(mx, my, 8, mx, my, 120);
    mg.addColorStop(0, "rgba(220,228,255,0.34)");
    mg.addColorStop(1, "rgba(220,228,255,0)");
    c.fillStyle = mg;
    c.fillRect(mx - 120, my - 120, 240, 240);
    c.fillStyle = "#e9edda";
    c.beginPath(); c.arc(mx, my, 34, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#33333f";
    c.beginPath(); c.arc(mx + 15, my - 7, 29, 0, Math.PI * 2); c.fill();
    // stars
    c.fillStyle = "rgba(240,244,255,0.85)";
    for (let i = 0; i < 40; i++) {
      const sx = hash2(i, 811) * LYSA_W - camX;
      const sy = hash2(i, 813) * 190 - camY;
      const tw = 0.5 + Math.sin(t * 0.002 + i * 1.9) * 0.4;
      c.globalAlpha = Math.max(0.15, tw);
      c.fillRect(sx, sy, 2, 2);
    }
    c.globalAlpha = 1;
  }
  // Standing stones of the ritual ring
  for (const s of LYSA_STONES) {
    const sx = s.x - camX;
    const sy = s.y - camY;
    c.fillStyle = "rgba(10,10,16,0.4)";
    c.beginPath(); c.ellipse(sx, sy + 4, 13, 4.6, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#5c5c68";
    rr(c, sx - 7, sy - s.h, 14, s.h + 6, 3); c.fill();
    c.fillStyle = "rgba(220,226,255,0.16)";
    rr(c, sx - 7, sy - s.h, 5.4, s.h + 6, 2); c.fill();
    // a carved crescent on every third stone
    if (Math.floor(s.x) % 3 === 0) {
      c.strokeStyle = "rgba(233,237,218,0.55)";
      c.lineWidth = 1.4;
      c.beginPath(); c.arc(sx, sy - s.h / 2, 4, 0.6, Math.PI * 1.7); c.stroke();
    }
  }
  // Beelzebub's seat — a throne of black stone at the summit's north edge
  {
    const tx = LYSA_THRONE.x - camX;
    const ty = LYSA_THRONE.y - camY;
    c.fillStyle = "rgba(8,8,14,0.45)";
    c.beginPath(); c.ellipse(tx + 48, ty + 48, 62, 13, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#2c2833";
    rr(c, tx + 14, ty - 26, 68, 62, 5); c.fill();
    c.fillStyle = "#38333f";
    rr(c, tx + 14, ty - 26, 68, 14, 5); c.fill();
    c.fillStyle = "#211e28";
    rr(c, tx, ty + 22, 96, 22, 4); c.fill();
    c.fillStyle = "#e9edda";
    c.beginPath(); c.arc(tx + 48, ty - 12, 4.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#33333f";
    c.beginPath(); c.arc(tx + 50.4, ty - 13.4, 3.8, 0, Math.PI * 2); c.fill();
  }
  // The offering stone — a flat altar slab north of the fire. Once the
  // nichnyky are laid, they glow on it for the rest of the night (and
  // every night after).
  {
    const ox = LYSA_OFFER_SPOT.x - camX;
    const oy = LYSA_OFFER_SPOT.y - camY;
    c.fillStyle = "rgba(10,10,16,0.4)";
    c.beginPath(); c.ellipse(ox, oy + 10, 30, 8, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#6a6a76";
    c.beginPath(); c.ellipse(ox, oy + 2, 27, 10, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#7d7d8a";
    c.beginPath(); c.ellipse(ox, oy, 23, 8, 0, 0, Math.PI * 2); c.fill();
    if (offered) {
      const pulse = 0.6 + Math.sin(t * 0.004) * 0.25;
      const og = c.createRadialGradient(ox, oy - 2, 2, ox, oy - 2, 30);
      og.addColorStop(0, `rgba(220,230,255,${pulse * 0.65})`);
      og.addColorStop(1, "rgba(220,230,255,0)");
      c.fillStyle = og;
      c.fillRect(ox - 30, oy - 32, 60, 60);
      c.fillStyle = "#eef0dc";
      for (const [fx, fy] of [[-11, -1], [0, -4], [11, -1]] as const) {
        c.beginPath(); c.arc(ox + fx, oy + fy, 3.4, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#c9d4f2";
        c.beginPath(); c.arc(ox + fx, oy + fy, 1.5, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#eef0dc";
      }
    }
  }
  // Broomsticks leaning on a stone + a cauldron by the ring's south side —
  // the witches' parked transport and the night 's supper.
  {
    const bx = 838 - camX;
    const by = 512 - camY;
    c.strokeStyle = "#7a5a30";
    c.lineWidth = 3;
    for (const lean of [-8, 0, 8]) {
      c.beginPath(); c.moveTo(bx + lean, by + 16); c.lineTo(bx + lean * 0.4, by - 22); c.stroke();
      c.strokeStyle = "#a8894a";
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(bx + lean * 0.4, by - 22); c.lineTo(bx + lean * 0.4 - 4, by - 31); c.stroke();
      c.beginPath(); c.moveTo(bx + lean * 0.4, by - 22); c.lineTo(bx + lean * 0.4 + 4, by - 31); c.stroke();
      c.strokeStyle = "#7a5a30";
      c.lineWidth = 3;
    }
    const cx2 = 486 - camX;
    const cy2 = 522 - camY;
    c.fillStyle = "#23202a";
    c.beginPath(); c.ellipse(cx2, cy2, 15, 11, 0, 0, Math.PI * 2); c.fill();
    const bub = 0.5 + Math.sin(t * 0.005) * 0.3;
    c.fillStyle = `rgba(178,132,220,${bub})`;
    c.beginPath(); c.ellipse(cx2, cy2 - 3, 11.6, 4.4, 0, 0, Math.PI * 2); c.fill();
  }
}

function drawLysaFire(c: CanvasRenderingContext2D, camX: number, camY: number, t: number) {
  // The sabbath bonfire — the village campfire's wicked older brother.
  const x = LYSA_SUMMIT.x - camX;
  const y = LYSA_SUMMIT.y - camY + 14;
  const glow = c.createRadialGradient(x, y - 10, 10, x, y - 10, 190);
  glow.addColorStop(0, "rgba(255,150,50,0.5)");
  glow.addColorStop(0.55, "rgba(160,70,140,0.16)");
  glow.addColorStop(1, "rgba(120,40,120,0)");
  c.fillStyle = glow;
  c.fillRect(x - 190, y - 200, 380, 380);
  c.fillStyle = "#55555f";
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    c.beginPath(); c.ellipse(x + Math.cos(a) * 40, y + Math.sin(a) * 14, 7, 5, a, 0, Math.PI * 2); c.fill();
  }
  c.strokeStyle = "#4a3423";
  c.lineWidth = 7;
  c.beginPath(); c.moveTo(x - 24, y + 6); c.lineTo(x + 20, y - 6); c.stroke();
  c.beginPath(); c.moveTo(x + 24, y + 6); c.lineTo(x - 20, y - 6); c.stroke();
  const fl = Math.sin(t * 0.014) * 4 + Math.sin(t * 0.037) * 2.4;
  c.fillStyle = "#ff7b2e";
  c.beginPath(); c.ellipse(x, y - 22, 15, 26 + fl, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#ffa02e";
  c.beginPath(); c.ellipse(x, y - 17, 10, 18 + fl * 0.7, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#ffe89a";
  c.beginPath(); c.ellipse(x, y - 11, 5, 10 + fl * 0.4, 0, 0, Math.PI * 2); c.fill();
  // sparks — violet as well as gold, because it is that kind of fire
  for (let i = 0; i < 7; i++) {
    const sp = (t * 0.03 + i * 131) % 46;
    c.fillStyle = i % 3 === 0 ? "rgba(196,150,255,0.9)" : "rgba(255,196,110,0.9)";
    c.fillRect(x + Math.sin(t * 0.004 + i * 2.4) * (8 + sp * 0.4), y - 26 - sp, 2.2, 2.2);
  }
}

function drawWitch(c: CanvasRenderingContext2D, x: number, y: number, tunic: string, hair: string, t: number, dancing: boolean) {
  const bob = dancing ? Math.abs(Math.sin(t * 0.006 + x * 0.2)) * 3 : Math.sin(t * 0.002 + x * 0.13) * 0.8;
  const top = y - 42 + bob * 0.4;
  c.fillStyle = "rgba(8,8,14,0.4)";
  c.beginPath(); c.ellipse(x, y + 3, 13, 4.4, 0, 0, Math.PI * 2); c.fill();
  // long skirt + bodice
  c.fillStyle = tunic;
  c.beginPath();
  c.moveTo(x, top + 10);
  c.lineTo(x - 11, top + 38);
  c.lineTo(x + 11, top + 38);
  c.closePath(); c.fill();
  rr(c, x - 7.4, top + 9, 14.8, 12, 3); c.fill();
  // arms — raised when dancing
  c.strokeStyle = tunic;
  c.lineWidth = 4;
  c.beginPath();
  if (dancing) {
    c.moveTo(x - 6, top + 12); c.lineTo(x - 13, top + 2 + Math.sin(t * 0.006 + x) * 2);
    c.moveTo(x + 6, top + 12); c.lineTo(x + 13, top + 4 + Math.cos(t * 0.006 + x) * 2);
  } else {
    c.moveTo(x - 6, top + 12); c.lineTo(x - 11, top + 24);
    c.moveTo(x + 6, top + 12); c.lineTo(x + 11, top + 24);
  }
  c.stroke();
  // head + tall pointed hat, the honest silhouette of a vidma
  c.fillStyle = "#e8b88a";
  c.beginPath(); c.ellipse(x, top + 3, 6.4, 6.8, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = hair;
  c.fillRect(x - 7.4, top + 4, 3.4, 10);
  c.fillRect(x + 4, top + 4, 3.4, 10);
  c.fillStyle = "#241f2c";
  c.beginPath(); c.ellipse(x, top - 2.6, 10.4, 2.6, 0, 0, Math.PI * 2); c.fill();
  c.beginPath();
  c.moveTo(x - 5.4, top - 3);
  c.quadraticCurveTo(x + 3, top - 24, x + 8.6, top - 27);
  c.quadraticCurveTo(x + 2, top - 12, x + 5, top - 3);
  c.closePath(); c.fill();
}

function drawBeelzebub(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  // Beelzebub presiding: broad, horned, seated — roughly twice a mortal's
  // width, with ember eyes and a grin he keeps for guests.
  const breathe = Math.sin(t * 0.0011) * 1.6;
  const top = y - 66 + breathe;
  c.fillStyle = "rgba(6,6,10,0.5)";
  c.beginPath(); c.ellipse(x, y + 4, 34, 8, 0, 0, Math.PI * 2); c.fill();
  // vast dark robe
  c.fillStyle = "#2c2130";
  c.beginPath();
  c.moveTo(x, top + 8);
  c.lineTo(x - 26, y + 2);
  c.lineTo(x + 26, y + 2);
  c.closePath(); c.fill();
  c.fillStyle = "#3a2a3e";
  c.beginPath();
  c.moveTo(x, top + 8);
  c.lineTo(x - 10, y + 2);
  c.lineTo(x + 12, y + 2);
  c.closePath(); c.fill();
  // clawed hands resting on the throne arms
  c.fillStyle = "#4c3542";
  c.beginPath(); c.ellipse(x - 24, top + 40, 6, 8, 0.3, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(x + 24, top + 40, 6, 8, -0.3, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#d8d2c4";
  c.lineWidth = 1.4;
  for (const s of [-1, 1]) {
    for (let f = -1; f <= 1; f++) {
      c.beginPath();
      c.moveTo(x + s * 24 + f * 2.6, top + 46);
      c.lineTo(x + s * 24 + f * 3.4, top + 51);
      c.stroke();
    }
  }
  // head: heavy brow, great curved horns, ember eyes
  c.fillStyle = "#503040";
  c.beginPath(); c.ellipse(x, top + 2, 13, 12, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#e7ddc4";
  c.lineWidth = 3.4;
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(x + s * 8, top - 6);
    c.quadraticCurveTo(x + s * 22, top - 12, x + s * 20, top - 26);
    c.stroke();
  }
  const glowE = 0.7 + Math.sin(t * 0.0026) * 0.25;
  c.fillStyle = `rgba(255,120,40,${glowE})`;
  c.fillRect(x - 6.4, top + 0.4, 3.6, 3);
  c.fillRect(x + 2.8, top + 0.4, 3.6, 3);
  // a grin of filed gold teeth, kept for guests
  c.strokeStyle = "#e8c96a";
  c.lineWidth = 1.6;
  c.beginPath(); c.arc(x, top + 6, 6.4, 0.3, Math.PI - 0.3); c.stroke();
  // beard of smoke-grey hair
  c.fillStyle = "#6a6472";
  c.beginPath(); c.ellipse(x, top + 13, 7.4, 7, 0, 0, Math.PI * 2); c.fill();
}

function drawLysaFlower(c: CanvasRenderingContext2D, sx: number, sy: number, camX: number, camY: number, t: number, available: boolean) {
  const x = sx - camX;
  const y = sy - camY;
  if (!available) {
    c.fillStyle = "#5a5a48";
    for (let i = 0; i < 3; i++) {
      c.beginPath(); c.arc(x - 5 + i * 5, y + (i % 2) * 2, 2.6, 0, Math.PI * 2); c.fill();
    }
    return;
  }
  const pulse = 0.55 + Math.sin(t * 0.004 + sx) * 0.25;
  const g = c.createRadialGradient(x, y, 2, x, y, 28);
  g.addColorStop(0, `rgba(205,218,255,${pulse * 0.6})`);
  g.addColorStop(1, "rgba(205,218,255,0)");
  c.fillStyle = g;
  c.fillRect(x - 28, y - 28, 56, 56);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + hash2(sx, i) * 0.7;
    const lx = x + Math.cos(a) * 8;
    const ly = y + Math.sin(a) * 4;
    c.strokeStyle = "#6a7256";
    c.lineWidth = 1.7;
    c.beginPath(); c.moveTo(lx, ly + 5); c.quadraticCurveTo(lx + 2, ly, lx + 3, ly - 6); c.stroke();
    // a pale bell of a flower, open to the moon
    c.fillStyle = "#eef0dc";
    c.beginPath(); c.ellipse(lx + 3, ly - 8, 3.4, 4.2, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#b9c6ee";
    c.beginPath(); c.arc(lx + 3, ly - 8, 1.6, 0, Math.PI * 2); c.fill();
  }
}

// --- Hut interiors ----------------------------------------------------------
// Inside a hut: lamplight, plank floor, log walls, and the furniture
// that makes the room whose it is. hut 0 is the Domovyk's (the pich is
// the warm heart of it); hut 1 is Vesna's (bed, work table, cauldron
// corner, herb shelf). Drawn in world space like everything else; the
// dark surround swallows whatever of the 820×600 room the camera does
// not cover, so the hut reads as a lit room in the night of the page.
function drawHutInterior(
  c: CanvasRenderingContext2D,
  camX: number, camY: number, t: number,
  hut: 0 | 1,
  flags: ReadonlySet<string>,
) {
  // the dark beyond the walls
  c.fillStyle = "#120c07";
  c.fillRect(-camX - 240, -camY - 240, HUT_W + 480, HUT_H + 480);
  const fx = 70 - camX;
  const fy = 64 - camY;
  const fw = 680;
  const fh = 472;
  // plank floor
  c.fillStyle = "#8a6238";
  c.fillRect(fx, fy, fw, fh);
  c.fillStyle = "#835c33";
  for (let py = fy + 26; py < fy + fh; py += 52) c.fillRect(fx, py, fw, 24);
  c.strokeStyle = "rgba(70,42,18,0.5)";
  c.lineWidth = 1.4;
  for (let py = fy + 26; py < fy + fh; py += 26) {
    c.beginPath(); c.moveTo(fx, py); c.lineTo(fx + fw, py); c.stroke();
  }
  // a woven runner from the door to the room's heart
  c.fillStyle = "#a83c32";
  c.fillRect(410 - 17 - camX, 330 - camY, 34, 176);
  c.fillStyle = "#c8a568";
  c.fillRect(410 - 17 - camX, 330 - camY, 5, 176);
  c.fillRect(410 + 12 - camX, 330 - camY, 5, 176);
  // a round braided rug in the middle of the floor
  c.fillStyle = "#b03a2e";
  c.beginPath(); c.ellipse(410 - camX, 400 - camY, 92, 44, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#c8a568";
  c.beginPath(); c.ellipse(410 - camX, 400 - camY, 66, 30, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#7a4a2b";
  c.beginPath(); c.ellipse(410 - camX, 400 - camY, 38, 17, 0, 0, Math.PI * 2); c.fill();

  // log walls — bands with log seams, a pale top face catching the lamp
  const wall = (r: Rect) => {
    const x = r.x - camX;
    const y = r.y - camY;
    c.fillStyle = "#6e4525";
    c.fillRect(x, y, r.w, r.h);
    c.strokeStyle = "rgba(46,28,10,0.6)";
    c.lineWidth = 1.4;
    if (r.w >= r.h) {
      for (let ly = y + 10; ly < y + r.h; ly += 10) {
        c.beginPath(); c.moveTo(x, ly); c.lineTo(x + r.w, ly); c.stroke();
      }
    } else {
      for (let lx = x + 10; lx < x + r.w; lx += 10) {
        c.beginPath(); c.moveTo(lx, y); c.lineTo(lx, y + r.h); c.stroke();
      }
    }
    c.fillStyle = "rgba(255,214,140,0.14)";
    if (r.w >= r.h) c.fillRect(x, y, r.w, 4);
    else c.fillRect(x, y, 4, r.h);
  };
  for (const r of HUT_WALLS) wall(r);
  // the door: pale daylight on the step, and the door itself swung open
  c.fillStyle = "#d9c491";
  c.fillRect(384 - camX, 506 - camY, 52, 30);
  c.fillStyle = "rgba(255,240,200,0.35)";
  c.beginPath();
  c.moveTo(388 - camX, 506 - camY);
  c.lineTo(432 - camX, 506 - camY);
  c.lineTo(424 - camX, 452 - camY);
  c.lineTo(396 - camX, 452 - camY);
  c.closePath(); c.fill();
  c.fillStyle = "#5d3d20";
  rr(c, 440 - camX, 470 - camY, 10, 62, 3); c.fill();
  // a window in the north wall, lamplit from inside, dark pines beyond
  {
    const wx = 560 - camX;
    const wy = 66 - camY;
    c.fillStyle = "#2c3844";
    rr(c, wx, wy, 52, 26, 2); c.fill();
    c.fillStyle = "#ffd97a";
    c.beginPath(); c.arc(wx + 38, wy + 8, 4.6, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#5d3d20";
    c.lineWidth = 2.4;
    c.strokeRect(wx, wy, 52, 26);
    c.beginPath(); c.moveTo(wx + 26, wy); c.lineTo(wx + 26, wy + 26); c.stroke();
  }
  // a hanging oil lamp over the room's middle — the light source
  {
    const lx = 410 - camX;
    const ly = 210 - camY;
    const lg = c.createRadialGradient(lx, ly, 8, lx, ly, 210);
    lg.addColorStop(0, "rgba(255,190,90,0.34)");
    lg.addColorStop(1, "rgba(255,190,90,0)");
    c.fillStyle = lg;
    c.fillRect(lx - 210, ly - 210, 420, 420);
    c.strokeStyle = "#3c3630";
    c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(lx, 94 - camY); c.lineTo(lx, ly - 8); c.stroke();
    c.fillStyle = "#3c3630";
    c.beginPath(); c.ellipse(lx, ly, 7, 5, 0, 0, Math.PI * 2); c.fill();
    const fl = 3.6 + Math.sin(t * 0.02) * 0.9;
    c.fillStyle = "#ffb02e";
    c.beginPath(); c.ellipse(lx, ly - 3, 2.8, fl + 2, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#ffe89a";
    c.beginPath(); c.ellipse(lx, ly - 2, 1.4, fl, 0, 0, Math.PI * 2); c.fill();
  }

  // shared furniture: a bed (frame, blanket, pillow) and a table (top,
  // cloth, candle) — the two huts dress them differently.
  const bed = (bx: number, by: number, blanket: string) => {
    const x = bx - camX;
    const y = by - camY;
    c.fillStyle = "rgba(20,12,4,0.3)";
    c.beginPath(); c.ellipse(x + 75, y + 74, 82, 9, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#6e4525";
    rr(c, x, y, 150, 70, 4); c.fill();
    c.fillStyle = "#efe3c8";
    rr(c, x + 6, y + 6, 138, 58, 3); c.fill();
    c.fillStyle = blanket;
    rr(c, x + 44, y + 6, 100, 58, 3); c.fill();
    c.fillStyle = "rgba(255,255,255,0.16)";
    rr(c, x + 44, y + 6, 100, 12, 3); c.fill();
    c.fillStyle = "#f7efdb";
    rr(c, x + 10, y + 12, 30, 46, 5); c.fill();
  };
  const table = (tx: number, ty: number, dress: (x: number, y: number) => void) => {
    const x = tx - camX;
    const y = ty - camY;
    c.fillStyle = "rgba(20,12,4,0.3)";
    c.beginPath(); c.ellipse(x + 65, y + 64, 74, 8, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#7a4a24";
    rr(c, x, y, 130, 60, 4); c.fill();
    c.fillStyle = "#efe3c8";
    rr(c, x + 14, y + 8, 102, 44, 3); c.fill();
    c.fillStyle = "#b03a2e";
    for (let i = 0; i < 6; i++) c.fillRect(x + 20 + i * 16, y + 12, 3, 3);
    dress(x, y);
    // benches either side
    c.fillStyle = "#6e4525";
    rr(c, x + 8, y - 14, 114, 9, 3); c.fill();
    rr(c, x + 8, y + 65, 114, 9, 3); c.fill();
  };

  if (hut === 0) {
    // THE PICH — the great clay stove, the Domovyk's whole world:
    // a broad clay body against the north wall, its mouth breathing
    // fire, a kettle on top, and the sleeping bench (lezhanka) along
    // its warm side, where the house spirit naps between duties.
    const px = 110 - camX;
    const py = 94 - camY;
    const pg = c.createRadialGradient(px + 75, py + 78, 6, px + 75, py + 78, 120);
    pg.addColorStop(0, "rgba(255,166,60,0.4)");
    pg.addColorStop(1, "rgba(255,166,60,0)");
    c.fillStyle = pg;
    c.fillRect(px - 45, py - 42, 240, 240);
    c.fillStyle = "#8d7c62";
    c.fillRect(px + 55, py - 30, 40, 32); // chimney into the wall
    c.fillStyle = "#b3a58c";
    rr(c, px, py, 150, 96, 10); c.fill();
    c.fillStyle = "#c2b498";
    rr(c, px, py, 150, 26, 10); c.fill();
    // the fire mouth — an arch of dark, breathing orange
    c.fillStyle = "#241610";
    c.beginPath();
    c.moveTo(px + 48, py + 96);
    c.lineTo(px + 48, py + 62);
    c.quadraticCurveTo(px + 75, py + 34, px + 102, py + 62);
    c.lineTo(px + 102, py + 96);
    c.closePath(); c.fill();
    const fl = 5 + Math.sin(t * 0.017) * 1.8 + Math.sin(t * 0.041) * 1.1;
    c.fillStyle = "#ff8b2e";
    c.beginPath(); c.ellipse(px + 75, py + 88, 15, fl + 5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#ffd76a";
    c.beginPath(); c.ellipse(px + 75, py + 90, 8, fl, 0, 0, Math.PI * 2); c.fill();
    // glowing coals below the arch
    c.fillStyle = "#ff6a2e";
    for (const [cx, cy] of [[62, 92], [76, 94], [88, 91]] as const) {
      c.beginPath(); c.arc(px + cx, py + cy, 2.6, 0, Math.PI * 2); c.fill();
    }
    // a kettle and two clay pots on top
    c.fillStyle = "#2e2a26";
    c.beginPath(); c.ellipse(px + 34, py + 14, 11, 7.4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#a85f38";
    c.beginPath(); c.ellipse(px + 116, py + 15, 8, 6, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(px + 130, py + 16, 6, 4.6, 0, 0, Math.PI * 2); c.fill();
    // the lezhanka — the warm sleeping bench along the pich's side,
    // with a folded blanket: the Domovyk's throne and bed in one
    c.fillStyle = "#9a8663";
    rr(c, px + 4, py + 100, 142, 20, 4); c.fill();
    c.fillStyle = "#7a4a6e";
    rr(c, px + 88, py + 102, 52, 16, 3); c.fill();
    c.fillStyle = "#efe3c8";
    rr(c, px + 10, py + 103, 26, 14, 3); c.fill();
    // the woodpile, stacked round logs by the stove
    {
      const wx = 110 - camX;
      const wy = 210 - camY;
      c.fillStyle = "#6e4525";
      for (let row = 0; row < 3; row++) {
        for (let i = 0; i < 4 - (row === 2 ? 1 : 0); i++) {
          const lx = wx + 8 + i * 15 + row * 6;
          const ly = wy + 28 - row * 10;
          c.beginPath(); c.arc(lx, ly, 6.4, 0, Math.PI * 2); c.fill();
          c.fillStyle = "#c9a86a";
          c.beginPath(); c.arc(lx, ly, 4, 0, Math.PI * 2); c.fill();
          c.fillStyle = "#6e4525";
        }
      }
    }
    bed(560, 94, "#8a4a3a");
    table(345, 280, (x, y) => {
      // a bowl, a heel of bread, and the spirit's own tiny cup
      c.fillStyle = "#5d6b72";
      c.beginPath(); c.ellipse(x + 36, y + 30, 10, 6, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#c98d45";
      c.beginPath(); c.ellipse(x + 66, y + 32, 9, 5.6, -0.15, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#a85f38";
      c.beginPath(); c.ellipse(x + 92, y + 28, 5, 4, 0, 0, Math.PI * 2); c.fill();
      // the offering, once left, sits by the pich in spirit — here a
      // crumb trail by the table leg says someone small has feasted
      if (flagHas(flags, "offering")) {
        c.fillStyle = "#e8c98a";
        for (const [cx, cy] of [[58, 52], [64, 55], [70, 52]] as const) {
          c.beginPath(); c.arc(x + cx, y + cy, 1.5, 0, Math.PI * 2); c.fill();
        }
      }
    });
    // a broom by the door — no hut of the Domovyk's lacks one
    c.strokeStyle = "#7a5a30";
    c.lineWidth = 3;
    c.beginPath(); c.moveTo(486 - camX, 520 - camY); c.lineTo(478 - camX, 466 - camY); c.stroke();
    c.fillStyle = "#c9a86a";
    c.beginPath();
    c.moveTo(478 - camX, 466 - camY);
    c.lineTo(470 - camX, 448 - camY);
    c.lineTo(486 - camX, 448 - camY);
    c.closePath(); c.fill();
  } else {
    bed(110, 94, "#4c6b35");
    // the herb shelf along the north wall — bundles for every kind,
    // drawn as the drying rack outdoors is, because it is the same shelf
    {
      const sx = 300 - camX;
      const sy = 94 - camY;
      c.fillStyle = "#6e4525";
      c.fillRect(sx, sy, 240, 7);
      c.fillRect(sx, sy + 15, 240, 4);
      const bundleCols = ["#3f7a2e", "#8a9678", "#f28c1e", "#f2c416", "#e8e2cc", "#3f7a2e", "#f2c416"];
      bundleCols.forEach((col, i) => {
        const bx = sx + 18 + i * 32;
        const sway = Math.sin(t * 0.002 + i * 1.7) * 1.1;
        c.strokeStyle = "#c9b18a";
        c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(bx, sy + 19); c.lineTo(bx + sway, sy + 27); c.stroke();
        c.fillStyle = col;
        c.beginPath(); c.ellipse(bx + sway, sy + 33, 4.4, 6.8, sway * 0.06, 0, Math.PI * 2); c.fill();
      });
      // stoppered bottles along the shelf board
      const bottleCols = ["#7fb069", "#c98d45", "#7a9ab0", "#b06a8a"];
      bottleCols.forEach((col, i) => {
        const bx = sx + 30 + i * 52;
        c.fillStyle = col;
        rr(c, bx, sy - 12, 7, 12, 2); c.fill();
        c.fillStyle = "#c9a86a";
        c.fillRect(bx + 2, sy - 15, 3, 3);
      });
    }
    // the cauldron corner — a stone hearth in the NE, something green
    // at a gentle bubble, steam curling: Vesna's indoor alchemy
    {
      const cx = 600 - camX;
      const cy = 94 - camY;
      const cg = c.createRadialGradient(cx + 40, cy + 52, 6, cx + 40, cy + 52, 96);
      cg.addColorStop(0, "rgba(255,150,60,0.32)");
      cg.addColorStop(1, "rgba(255,150,60,0)");
      c.fillStyle = cg;
      c.fillRect(cx - 56, cy - 44, 192, 192);
      c.fillStyle = "#74726c";
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        c.beginPath(); c.ellipse(cx + 40 + Math.cos(a) * 30, cy + 52 + Math.sin(a) * 20, 7, 5.4, a, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = "#2e2a26";
      c.beginPath(); c.ellipse(cx + 40, cy + 46, 27, 21, 0, 0, Math.PI * 2); c.fill();
      const bub = 0.5 + Math.sin(t * 0.006) * 0.3;
      c.fillStyle = `rgba(140,220,150,${bub})`;
      c.beginPath(); c.ellipse(cx + 40, cy + 38, 21, 8.4, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "rgba(210,250,215,0.9)";
      const bph = (t * 0.05) % 9;
      c.beginPath(); c.arc(cx + 32 + (bph % 3) * 6, cy + 34 - bph * 0.7, 1.8, 0, Math.PI * 2); c.fill();
      const fl = 4 + Math.sin(t * 0.019) * 1.4;
      c.fillStyle = "#ff8b2e";
      c.beginPath(); c.ellipse(cx + 40, cy + 66, 9, fl + 3, 0, 0, Math.PI * 2); c.fill();
      const st = (t * 0.0004) % 1;
      c.fillStyle = `rgba(240,238,232,${0.4 * (1 - st)})`;
      c.beginPath(); c.arc(cx + 40 + Math.sin(st * 5) * 3, cy + 26 - st * 18, 3 + st * 4, 0, Math.PI * 2); c.fill();
    }
    table(330, 270, (x, y) => {
      // a mortar and pestle, loose herbs, and a notebook of recipes
      c.fillStyle = "#5d6b72";
      c.beginPath(); c.ellipse(x + 34, y + 30, 9, 6, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#8d8b85";
      c.lineWidth = 2.6;
      c.beginPath(); c.moveTo(x + 30, y + 26); c.lineTo(x + 40, y + 18); c.stroke();
      c.fillStyle = "#3f7a2e";
      for (const [hx, hy] of [[58, 26], [66, 33], [74, 25]] as const) {
        c.beginPath(); c.arc(x + hx, y + hy, 2.8, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = "#f7efdb";
      rr(c, x + 88, y + 16, 22, 28, 2); c.fill();
      c.strokeStyle = "#a3805a";
      c.lineWidth = 1;
      for (let ly = y + 22; ly < y + 40; ly += 5) {
        c.beginPath(); c.moveTo(x + 92, ly); c.lineTo(x + 106, ly); c.stroke();
      }
    });
    // a cat asleep by the cauldron's warmth — every znak harka has one
    {
      const cx = 556 - camX;
      const cy = 196 - camY;
      const br = Math.sin(t * 0.0016) * 0.8;
      c.fillStyle = "rgba(20,12,4,0.3)";
      c.beginPath(); c.ellipse(cx, cy + 4, 17, 4.6, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#4c4438";
      c.beginPath(); c.ellipse(cx, cy, 15 + br, 8.6, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(cx + 12, cy - 3, 6.4, 0, Math.PI * 2); c.fill();
      c.beginPath();
      c.moveTo(cx + 8, cy - 8); c.lineTo(cx + 10, cy - 12); c.lineTo(cx + 13, cy - 8);
      c.closePath(); c.fill();
      c.beginPath();
      c.moveTo(cx + 14, cy - 8); c.lineTo(cx + 17, cy - 12); c.lineTo(cx + 18, cy - 7);
      c.closePath(); c.fill();
      c.strokeStyle = "#4c4438";
      c.lineWidth = 3;
      c.beginPath(); c.moveTo(cx - 13, cy + 2); c.quadraticCurveTo(cx - 20, cy - 4, cx - 16, cy - 9); c.stroke();
    }
  }
}

// --- Component ---------------------------------------------------------------

type Prompt =
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
  | null;

function promptKeyOf(p: Prompt): string {
  if (p == null) return "";
  switch (p.kind) {
    case "talk": return `t:${p.npc.id}`;
    case "enter": return `enter:${p.hut}`;
    case "exit": return "exit";
    case "gather": return `g:${p.idx}`;
    case "iron": return `i:${p.idx}`;
    case "bloom": return `b:${p.idx}`;
    default: return p.kind;
  }
}

// A conversation in progress. Two shapes share the slot:
//  · Linear: `lines` is a fixed script chosen when it opens (Vij's
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
type Dialogue = {
  npc: Npc;
  lines: string[];
  line: number;
  choiceAt?: number;
  choiceKind?: "chort" | "brew";
  topics?: DialogueTopic[];
  asked?: string[];
  view?: "lines" | "menu" | "topic";
  topic?: DialogueTopic;
  topicLine?: number;
};

type BrewRecipe = "base" | "strong";

// One cell of the hold-to-move pad. A real <button> so it has an
// accessible name; press-and-hold is driven by pointer events, and the
// click default is suppressed so a hold never also "taps" anything.
// Cardinal cells hold one direction; the four CORNER cells hold the
// two directions they sit between, so a thumb landing between two
// arrows — the natural way to ask for a diagonal on a cross pad —
// walks diagonally instead of hitting dead space. The arrow is one
// up-triangle path rotated to point where the cell walks.
const PAD_ARROW_UP = "M12 5l7 9H5z";

function PadButton(props: {
  dirs: string[];
  label: string;
  rotate: number;
  corner?: boolean;
  pressed: boolean;
  onDown: (dirs: string[]) => (e: React.PointerEvent) => void;
  onUp: (dirs: string[]) => () => void;
}) {
  const release = props.onUp(props.dirs);
  return (
    <button
      type="button"
      aria-label={props.label}
      aria-pressed={props.pressed}
      onPointerDown={props.onDown(props.dirs)}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => e.preventDefault()}
      className={`flex h-14 w-14 items-center justify-center rounded-2xl border shadow-lg backdrop-blur-[2px] ${
        props.pressed
          ? "border-[#f3e9d2] bg-[#d99a2b]/85"
          : props.corner
            ? "border-[#f3e9d2]/30 bg-[#1c1409]/40"
            : "border-[#f3e9d2]/45 bg-[#1c1409]/55"
      }`}
      style={{ touchAction: "none", WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none" }}
    >
      <svg width={props.corner ? 20 : 26} height={props.corner ? 20 : 26} viewBox="0 0 24 24" aria-hidden="true">
        <g transform={`rotate(${props.rotate} 12 12)`}>
          <path d={PAD_ARROW_UP} fill="#f3e9d2" fillOpacity={props.corner ? 0.75 : 1} />
        </g>
      </svg>
    </button>
  );
}

export function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const playerRef = useRef({ x: SPAWN.x, y: SPAWN.y, face: 0, moving: false, phase: 0 });
  // Which area the player is in — mirrored into hudArea for the HUD and
  // carried in the save, so a reload restores the right side of the trail.
  const areaRef = useRef<AreaId>("village");
  const keysRef = useRef<Set<string>>(new Set());
  // Hold-to-move pad directions currently held ("up" | "down" | "left" | "right").
  // Movement is press-and-hold, never a drag: a downward drag on this phone
  // gets claimed by the host's pull-to-refresh no matter what the page sets,
  // so walking must not require a dragging gesture at all.
  const padRef = useRef<Set<string>>(new Set());
  const patchesRef = useRef(HERB_SPOTS.map((s) => ({ ...s, available: true, respawnAt: 0 })));
  // Nichnyky patches on Lysa Hora — gathered for the offering, and they
  // stay gathered (the mountain counts promises, and flowers).
  const lysaPatchesRef = useRef(LYSA_FLOWER_SPOTS.map((s) => ({ ...s, taken: false })));
  // While dancing at the sabbath, walking is replaced by the dance for a
  // few seconds (timestamp until which the player figure dances in place).
  const danceUntilRef = useRef(0);
  // Set when Beelzebub's blessing dialogue opens; the Moonstone lands in
  // the satchel as the conversation closes, as the script narrates.
  const blessingPendingRef = useRef(false);
  const talkedRef = useRef<Set<string>>(new Set());
  const herbsRef = useRef(0);
  const chickensRef = useRef(
    [0, 1, 2].map((i) => ({
      x: 700 + i * 130, y: 700 + (i % 2) * 60,
      tx: 700 + i * 130, ty: 700, wait: 0, phase: hash2(i, 7) * 6,
    })),
  );
  const promptRef = useRef<Prompt>(null);
  const dialogueRef = useRef<Dialogue | null>(null);
  const dirtyRef = useRef(false);
  const loadedRef = useRef(false);
  // Story flags + counters ("bread", "fish=3", "iron=1", …) — the state of
  // every non-combat system. Mirrored into hudFlags for rendering.
  const flagsRef = useRef<Set<string>>(new Set());
  // Fishing: null when not fishing; phase "wait" until a bite, then "bite"
  // for a short window — tap Reel in during it or the fish is gone.
  const fishingRef = useRef<{ phase: "wait" | "bite"; biteAt: number; biteEnd: number } | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  // Smithing cooldown: the anvil (and the arm) need a breath between pieces.
  const smithReadyRef = useRef(0);
  // Character sheet open? The render loop reads the ref to freeze walking.
  const panelRef = useRef(false);

  const [started, setStarted] = useState(false);
  const [hudArea, setHudArea] = useState<AreaId>("village");
  const [prompt, setPrompt] = useState<Prompt>(null);
  const [dialogue, setDialogue] = useState<Dialogue | null>(null);
  const [hudTalked, setHudTalked] = useState<string[]>([]);
  const [hudHerbs, setHudHerbs] = useState(0);
  const [hudFlags, setHudFlags] = useState<ReadonlySet<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [padPressed, setPadPressed] = useState<ReadonlySet<string>>(new Set());
  const [confirmReset, setConfirmReset] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<"stats" | "skills" | "quests">("stats");

  // Defense in depth against pull-to-refresh / page scroll. The game is
  // full-screen and never scrolls. The scroll container is NOT the
  // document: the SDK wraps the app in [data-generated-space-root]
  // (position:fixed, overflow:auto) with a .hatch-space-root child taller
  // than the viewport. Lock overscroll + touch handling on every ancestor
  // up the chain — as inline styles, so they beat the SDK stylesheet no
  // matter the cascade order — and swallow touchmove with a non-passive
  // listener so no touch gesture becomes a scroll. NOTE: on the user's
  // phone these locks alone did NOT stop the host claiming a downward
  // drag as pull-to-refresh (verified twice), which is why movement is
  // hold-to-move buttons rather than a drag joystick; these stay so that
  // incidental touches elsewhere never scroll or refresh either.
  useEffect(() => {
    type SavedStyle = { el: HTMLElement; props: Record<string, string> };
    const saved: SavedStyle[] = [];
    const lock = (el: HTMLElement | null, props: Record<string, string>) => {
      if (!el) return;
      const prevProps: Record<string, string> = {};
      for (const key of Object.keys(props)) {
        prevProps[key] = el.style.getPropertyValue(key);
        el.style.setProperty(key, props[key] ?? "", "important");
      }
      saved.push({ el, props: prevProps });
    };
    const lockProps = {
      "overscroll-behavior": "none",
      "touch-action": "none",
      overflow: "hidden",
    };
    lock(document.documentElement, lockProps);
    lock(document.body, { ...lockProps, position: "fixed", inset: "0", width: "100%" });
    lock(document.querySelector<HTMLElement>("[data-generated-space-root]"), lockProps);
    lock(document.querySelector<HTMLElement>(".hatch-space-root"), {
      ...lockProps,
      "min-height": "100%",
      height: "100%",
      "max-height": "100%",
    });
    // If anything still manages to scroll the SDK container, snap it back
    // so it can never rest at a scrolled offset or hand off a chain.
    const scroller = document.querySelector<HTMLElement>("[data-generated-space-root]");
    const snapBack = () => {
      if (scroller && (scroller.scrollTop !== 0 || scroller.scrollLeft !== 0)) {
        scroller.scrollTop = 0;
        scroller.scrollLeft = 0;
      }
    };
    scroller?.addEventListener("scroll", snapBack, { passive: true });
    const swallowTouchMove = (e: TouchEvent) => {
      // The Character sheet is a real scroll container on small phones —
      // touches that start inside it scroll the sheet, not the host page.
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("[data-scroll-ok]")) return;
      e.preventDefault();
    };
    document.addEventListener("touchmove", swallowTouchMove, { passive: false });
    return () => {
      document.removeEventListener("touchmove", swallowTouchMove);
      scroller?.removeEventListener("scroll", snapBack);
      for (const { el, props } of saved) {
        for (const [key, value] of Object.entries(props)) {
          if (value) el.style.setProperty(key, value);
          else el.style.removeProperty(key);
        }
      }
    };
  }, []);

  const saveQuery = useQuery({ queryKey: ["game-save"], queryFn: () => api.getSave({}) });
  const saveMut = useMutation({ mutationFn: (v: { x: number; y: number; area: AreaId; talked: string[]; herbs: number; flags: string[] }) => api.saveProgress(v) });
  const resetMut = useMutation({ mutationFn: () => api.resetSave({}) });

  // --- feedback + flags ------------------------------------------------------
  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimerRef.current != null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3400);
  };
  const syncFlags = () => {
    setHudFlags(new Set(flagsRef.current));
    dirtyRef.current = true;
  };
  const setFlag = (name: string) => {
    if (flagsRef.current.has(name)) return;
    flagsRef.current.add(name);
    syncFlags();
  };
  const bumpCount = (name: string, by: number): number => {
    const next = flagCount(flagsRef.current, name) + by;
    for (const f of [...flagsRef.current]) {
      if (f.startsWith(`${name}=`)) flagsRef.current.delete(f);
    }
    flagsRef.current.add(`${name}=${next}`);
    syncFlags();
    return next;
  };
  const openDialogue = (npc: Npc, lines: string[], choiceAt?: number, choiceKind?: "chort" | "brew") => {
    const d: Dialogue = {
      npc, lines, line: 0,
      ...(choiceAt != null ? { choiceAt } : {}),
      ...(choiceKind != null ? { choiceKind } : {}),
    };
    dialogueRef.current = d;
    setDialogue(d);
  };
  // A topic conversation: greeting pages first, then the question menu.
  const openTopicDialogue = (npc: Npc, intro: string[], topics: DialogueTopic[]) => {
    const d: Dialogue = { npc, lines: intro, line: 0, topics, asked: [], view: "lines", topicLine: 0 };
    dialogueRef.current = d;
    setDialogue(d);
  };
  const endDialogue = () => {
    dialogueRef.current = null;
    setDialogue(null);
  };
  // Stepping through a hut door — the interior twin of the Lysa trail
  // transition: swap the area, land just inside (or just outside) the
  // door, and let the autosave carry the new area like any other.
  const enterHut = (hut: 0 | 1) => {
    const dest: AreaId = hut === 0 ? "hut0" : "hut1";
    areaRef.current = dest;
    setHudArea(dest);
    playerRef.current.x = HUT_SPAWN.x;
    playerRef.current.y = HUT_SPAWN.y;
    fishingRef.current = null;
    promptRef.current = null;
    setPrompt(null);
    dirtyRef.current = true;
    showToast(
      hut === 0
        ? "You duck into the Domovyk's hut — pich-warm, smelling of bread and woodsmoke."
        : "You duck into Vesna's hut — herbs overhead, and something green breathing in the cauldron.",
    );
  };
  const exitHut = () => {
    const door = areaRef.current === "hut1" ? VILLAGE_FROM_HUT1 : VILLAGE_FROM_HUT0;
    areaRef.current = "village";
    setHudArea("village");
    playerRef.current.x = door.x;
    playerRef.current.y = door.y;
    promptRef.current = null;
    setPrompt(null);
    dirtyRef.current = true;
    showToast("Back out into the clearing's daylight.");
  };
  // Picking a question from the menu. The blessing topic never pages —
  // it hands straight over to Beelzebub's blessing script, and the
  // Moonstone lands when that script closes (blessingPendingRef).
  const selectTopic = (topic: DialogueTopic) => {
    const dlg = dialogueRef.current;
    if (!dlg || !dlg.topics) return;
    if (topic.action === "blessing") {
      blessingPendingRef.current = true;
      openDialogue(dlg.npc, [...linesForLysa(dlg.npc, flagsRef.current), ...LYSA_BLESSING_LINES]);
      return;
    }
    const asked = dlg.asked?.includes(topic.id) ? dlg.asked : [...(dlg.asked ?? []), topic.id];
    const next: Dialogue = { ...dlg, view: "topic", topic, topicLine: 0, asked };
    dialogueRef.current = next;
    setDialogue(next);
  };

  // Load the save once.
  useEffect(() => {
    if (!saveQuery.data || loadedRef.current) return;
    loadedRef.current = true;
    const s = saveQuery.data;
    if (s.exists) {
      const area: AreaId = s.area === "lysa" ? "lysa" : s.area === "hut0" ? "hut0" : s.area === "hut1" ? "hut1" : "village";
      areaRef.current = area;
      setHudArea(area);
      const ws = worldSize(area);
      playerRef.current.x = clamp(s.x, 30, ws.w - 30);
      playerRef.current.y = clamp(s.y, 60, ws.h - 20);
      // Map pre-rename save ids to their current forms.
      const idMap: Record<string, string> = { miroslav: "myroslav", bohdan: "radek" };
      const mappedTalked = s.talked.map((id) => idMap[id] ?? id);
      talkedRef.current = new Set(mappedTalked);
      herbsRef.current = s.herbs;
      flagsRef.current = new Set(s.flags);
      // Stats/skills migration for older saves: spendable herb stock
      // starts as everything ever gathered (nothing was spendable
      // before), and lifetime fish starts as the fish on hand (the old
      // single counter was both). Derived stats need no migration at
      // all — they are computed from skill levels and people met.
      let migrated = false;
      const loadedFlags = flagsRef.current;
      const hasCounter = (name: string) => [...loadedFlags].some((f) => f.startsWith(`${name}=`));
      if (!hasCounter("herbStock")) {
        loadedFlags.add(`herbStock=${s.herbs}`);
        migrated = true;
      }
      if (!hasCounter("fishTotal")) {
        loadedFlags.add(`fishTotal=${flagCount(loadedFlags, "fish")}`);
        migrated = true;
      }
      if (migrated) dirtyRef.current = true;
      // Nichnyky already picked on Lysa Hora stay picked.
      lysaPatchesRef.current.forEach((pt, i) => {
        pt.taken = loadedFlags.has(`lysaFlowerSpot${i}`);
      });
      if (area === "lysa" && !loadedFlags.has("visitedLysa")) {
        loadedFlags.add("visitedLysa");
        dirtyRef.current = true;
      }
      setHudTalked(mappedTalked);
      setHudHerbs(s.herbs);
      setHudFlags(new Set(flagsRef.current));
    }
  }, [saveQuery.data]);

  // Periodic autosave when dirty.
  useEffect(() => {
    if (!started) return;
    const iv = window.setInterval(() => {
      if (!dirtyRef.current) return;
      dirtyRef.current = false;
      saveMut.mutate({
        x: Math.round(playerRef.current.x),
        y: Math.round(playerRef.current.y),
        area: areaRef.current,
        talked: [...talkedRef.current],
        herbs: herbsRef.current,
        flags: [...flagsRef.current],
      });
    }, 2500);
    return () => window.clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  // The Chort's bargain: a real choice at the signature line. Signing is
  // instant and has visible teeth — your shadow is gone from the grass
  // until you buy your soul back with 3 fish.
  const chortChoice = (sign: boolean) => {
    const dlg = dialogueRef.current;
    if (!dlg || dlg.npc.id !== "chort") return;
    if (sign) {
      setFlag("soulsold");
      setFlag("gold");
      openDialogue(dlg.npc, CHORT_SIGNED_LINES);
      showToast("You signed. The gold is heavy — and where did your shadow go?");
    } else {
      setFlag("soulkept");
      openDialogue(dlg.npc, CHORT_REFUSED_LINES);
    }
  };

  // Stats from live refs — used by the game loop (pace, bite window) and
  // by interactions (prices, double finds). The HUD/panel use the same
  // computeStats() over the mirrored state, so the numbers never disagree.
  const liveStats = () =>
    computeStats({
      herbs: herbsRef.current,
      fishTotal: flagCount(flagsRef.current, "fishTotal"),
      cooked: flagCount(flagsRef.current, "cooked"),
      smithed: flagCount(flagsRef.current, "smithed"),
      brewed: flagCount(flagsRef.current, "brewed"),
      met: talkedRef.current.size,
      flags: flagsRef.current,
    });

  // Eating and drinking happen from the Character sheet's satchel.
  const eatMeal = () => {
    if (flagCount(flagsRef.current, "meals") < 1) return;
    bumpCount("meals", -1);
    setFlag("wellfed");
    showToast("Hot karas soup, herbs and all. You feel sturdier — CON +1 while well fed.");
  };
  const drinkTonic = () => {
    if (flagCount(flagsRef.current, "potions") < 1) return;
    bumpCount("potions", -1);
    setFlag("tonic");
    showToast("Bitter, bright, clarifying. INT +1 and WIS +1 while the tonic lasts.");
  };
  const drinkStrongTonic = () => {
    if (flagCount(flagsRef.current, "strongPotions") < 1) return;
    bumpCount("strongPotions", -1);
    setFlag("strongtonic");
    showToast("Dark, deep, twice as clarifying — Vesna's strong tonic. INT +2 and WIS +2 while it lasts.");
  };

  // The honest "no" of the carry system: name the load, the limit, and
  // the stat that sets it. Nothing is consumed when this fires.
  const carryBlockedToast = (addWeight: number) => {
    const st = liveStats();
    showToast(
      `Too heavy — you are carrying ${carriedWeight(flagsRef.current)}/${carryCap(st)}, and that needs ${addWeight} more room. Your STR ${st.str.total} sets the limit; smithing raises it. Put something down first — cook, brew, eat, or hand the iron to Radek.`,
    );
  };

  // Brewing, both tiers. The base tonic (2 herbs) is open from the
  // start; Vesna's strong tonic (3 herbs) is gated at INT total 3 and
  // chosen at the bench — performBrew itself trusts the gate was
  // checked by the caller (the brew prompt only offers the choice when
  // INT ≥ 3, and Vesna's dialogue says plainly that it is locked below).
  const performBrew = (recipe: BrewRecipe) => {
    const cost = recipe === "strong" ? 3 : 2;
    const herbsIn = flagCount(flagsRef.current, "herbStock");
    if (herbsIn < cost) {
      showToast(
        recipe === "strong"
          ? `Vesna's strong tonic wants 3 herbs — you have ${herbsIn}. The glowing patches provide.`
          : `The cauldron wants 2 herbs from your satchel — you have ${herbsIn}. The glowing patches provide.`,
      );
      return;
    }
    bumpCount("herbStock", -cost);
    const before = flagCount(flagsRef.current, "brewed");
    const brewed = bumpCount("brewed", 1);
    if (recipe === "strong") bumpCount("strongPotions", 1);
    else bumpCount("potions", 1);
    // A bright mind coaxes a second bottle out of the same batch.
    const intNow = liveStats().int.total;
    const double = hash2(Math.floor(performance.now()), 73) < (intNow - 1) * 0.1;
    if (double) {
      if (recipe === "strong") bumpCount("strongPotions", 1);
      else bumpCount("potions", 1);
    }
    const stock = flagCount(flagsRef.current, recipe === "strong" ? "strongPotions" : "potions");
    showToast(
      craftLevel(brewed) > craftLevel(before)
        ? recipe === "strong"
          ? `The strong tonic settles, dark as well-water at dusk! Alchemy Lv ${craftLevel(brewed)} — INT is now ${liveStats().int.total}. Drink it from your Character sheet.`
          : `The tonic clears, bright as bottled morning! Alchemy Lv ${craftLevel(brewed)} — INT is now ${liveStats().int.total}. Drink it from your Character sheet.`
        : double
          ? recipe === "strong"
            ? `Two bottles of the strong brew from one batch — a bright mind wastes nothing (INT ${intNow}). · Alchemy Lv ${craftLevel(brewed)}`
            : `Two bottles from one batch — a bright mind wastes nothing (INT ${intNow}). · Alchemy Lv ${craftLevel(brewed)}`
          : recipe === "strong"
            ? `Vesna's strong tonic, dark and deep. · Alchemy Lv ${craftLevel(brewed)} · ${stock} in satchel`
            : `A tonic, bitter and bright. · Alchemy Lv ${craftLevel(brewed)} · ${stock} in satchel`,
    );
  };

  // The bench's recipe choice, made through the dialogue buttons.
  const brewChoice = (recipe: BrewRecipe | null) => {
    const dlg = dialogueRef.current;
    if (!dlg || dlg.choiceKind !== "brew") return;
    dialogueRef.current = null;
    setDialogue(null);
    if (recipe != null) performBrew(recipe);
  };

  const doInteract = () => {
    const dlg = dialogueRef.current;
    if (dlg) {
      // Topic conversations: the menu is driven by its buttons, answers
      // page with Next, and the last answer page returns to the menu.
      if (dlg.topics) {
        if (dlg.view === "menu") return;
        if (dlg.view === "topic" && dlg.topic) {
          const t = dlg.topic;
          const tl = dlg.topicLine ?? 0;
          // The bargain topic ends in a choice, not a page turn.
          if (t.action === "bargain" && tl >= t.lines.length - 1) return;
          if (tl + 1 < t.lines.length) {
            const next = { ...dlg, topicLine: tl + 1 };
            dialogueRef.current = next;
            setDialogue(next);
          } else {
            const next: Dialogue = { ...dlg, view: "menu", topic: undefined, topicLine: 0 };
            dialogueRef.current = next;
            setDialogue(next);
          }
          return;
        }
        // Greeting pages: at the end, the questions open up.
        if (dlg.line + 1 < dlg.lines.length) {
          const next = { ...dlg, line: dlg.line + 1 };
          dialogueRef.current = next;
          setDialogue(next);
        } else {
          const next: Dialogue = { ...dlg, view: "menu" };
          dialogueRef.current = next;
          setDialogue(next);
        }
        return;
      }
      // At the bargain page the only way onward is the choice itself.
      if (dlg.choiceAt != null && dlg.line === dlg.choiceAt) return;
      if (dlg.line + 1 < dlg.lines.length) {
        const next = { ...dlg, line: dlg.line + 1 };
        dialogueRef.current = next;
        setDialogue(next);
      } else {
        dialogueRef.current = null;
        setDialogue(null);
        if (blessingPendingRef.current) {
          blessingPendingRef.current = false;
          setFlag("moonstone");
          showToast("The Moonstone of Lysa Hora is yours — WIS +1, CHA +1 while you carry it. 🌙");
        }
      }
      return;
    }
    // Reeling in answers the fishing bite directly, before any prompt.
    const fishing = fishingRef.current;
    if (fishing && fishing.phase === "bite") {
      fishingRef.current = null;
      const now = performance.now();
      // Dexterity tilts the catch itself, not just the window: deft
      // hands meet better fish — the pike and perch grow likelier with
      // every DEX point, and the pond's old boot grows shy.
      const dexNow = liveStats().dex;
      const table = FISH_CATCH.map((f) => {
        let w = f.w;
        if (f.name.includes("pike")) w += (dexNow.total - 1) * 3;
        else if (f.name.includes("perch")) w += (dexNow.total - 1);
        else if (f.name.includes("boot")) w = Math.max(1, w - (dexNow.total - 1) * 1.5);
        return { name: f.name, w };
      });
      const totalW = table.reduce((s, f) => s + f.w, 0);
      const roll = hash2(Math.floor(now), Math.floor(playerRef.current.x)) * totalW;
      let acc = 0;
      let caught = table[0]?.name ?? "a karas";
      for (const f of table) {
        acc += f.w;
        if (roll < acc) { caught = f.name; break; }
      }
      if (caught.includes("boot")) {
        showToast("You caught an old boot. The pond gives back what the village throws in.");
      } else if (carriedWeight(flagsRef.current) + 1 > carryCap(liveStats())) {
        // A fish is 1 of weight, and a full satchel holds no fish: it
        // slips back into the pond, uncounted and uneaten.
        showToast(
          `${caught[0]?.toUpperCase() ?? "A"}${caught.slice(1)} — in your hands, and gone again! No room: carrying ${carriedWeight(flagsRef.current)}/${carryCap(liveStats())}, and a fish weighs 1. Your STR ${liveStats().str.total} sets the limit.`,
        );
      } else {
        bumpCount("fish", 1);
        const total = bumpCount("fishTotal", 1);
        showToast(
          fishLevel(total) > fishLevel(total - 1)
            ? `Caught ${caught}! Fishing Lv ${fishLevel(total)} — DEX is now ${dexNow.total}. The bite window widens.`
            : `Caught ${caught}! · Fishing Lv ${fishLevel(total)} (${total} caught)`,
        );
      }
      return;
    }
    const p = promptRef.current;
    if (!p) return;
    switch (p.kind) {
      case "enter":
        enterHut(p.hut);
        return;
      case "exit":
        exitHut();
        return;
      case "talk": {
        const firstMeeting = !talkedRef.current.has(p.npc.id);
        if (firstMeeting) {
          talkedRef.current.add(p.npc.id);
          setHudTalked([...talkedRef.current]);
          dirtyRef.current = true;
        }
        const flags = flagsRef.current;
        const fish = flagCount(flags, "fish");
        const statsNow = liveStats();
        const price = soulPrice(statsNow);
        // The soul buy-back happens the moment you bring him enough fish
        // — 3, or 2 if your Charisma has talked him down (CHA 4+).
        if (p.npc.id === "chort" && flagHas(flags, "soulsold") && !flagHas(flags, "soulback") && fish >= price) {
          bumpCount("fish", -price);
          setFlag("soulback");
          openDialogue(p.npc, CHORT_TRADE_LINES);
          showToast("Your soul — and your shadow — are yours again.");
          return;
        }
        // Handing Radek his third lump of bog iron lights the forge.
        if (p.npc.id === "radek" && flagCount(flags, "iron") >= 3 && !flagHas(flags, "horseshoe")) {
          setFlag("horseshoe");
          showToast("Radek presses a warm horseshoe into your hand — STR +1 while you carry it.");
        }
        // On Lysa Hora everyone speaks the sabbath script — including the
        // Chort, who does no soul-business on the mountain (sabbath rules).
        // Conversations there are topic menus too; Beelzebub's blessing
        // is reached through his "Receive the blessing" topic.
        if (areaRef.current === "lysa") {
          const tsetL = topicsForLysa(p.npc, flags, firstMeeting);
          if (tsetL) {
            openTopicDialogue(p.npc, tsetL.intro, tsetL.topics);
          } else {
            openDialogue(p.npc, linesForLysa(p.npc, flags));
          }
          return;
        }
        // Vij keeps his scripted narration — he is not a conversation.
        // Everyone else in the village answers questions now.
        if (p.npc.id !== "vij") {
          const tset = topicsForVillage(p.npc, herbsRef.current, flags, fish, price, statsNow.int.total, firstMeeting);
          if (tset) {
            openTopicDialogue(p.npc, tset.intro, tset.topics);
            return;
          }
        }
        openDialogue(p.npc, linesFor(p.npc, herbsRef.current, flags, fish, price, statsNow.int.total));
        return;
      }
      case "gather": {
        const patch = patchesRef.current[p.idx];
        if (patch && patch.available) {
          const def = HERBS[patch.kind];
          // Zvirobij is WIS-gated knowledge, not just a plant: below
          // WIS 2 the eye slides off it, the patch stays untouched,
          // and the failure says exactly what was checked.
          const wisNow = liveStats().wis.total;
          if (patch.kind === "zvirobij" && wisNow < 2) {
            showToast(`You reach for the Zvirobij — and hesitate. You do not truly know this herb yet: WIS check failed (your WIS ${wisNow}, it takes 2). Gather the other herbs first; Vesna's eye will teach yours. The patch stays, unpicked.`);
            return;
          }
          // An herb is 1 of weight; a full satchel picks nothing.
          if (carriedWeight(flagsRef.current) + 1 > carryCap(liveStats())) {
            carryBlockedToast(1);
            return;
          }
          patch.available = false;
          patch.respawnAt = performance.now() + 26000;
          const before = herbsRef.current;
          herbsRef.current += 1;
          setHudHerbs(herbsRef.current);
          dirtyRef.current = true;
          bumpCount("herbStock", 1);
          // A wise eye spots the second stem hiding under the first —
          // if there is room in the satchel to carry it.
          const wis = liveStats().wis.total;
          const keen =
            hash2(Math.floor(performance.now()), patch.x) < (wis - 1) * 0.08 &&
            carriedWeight(flagsRef.current) + 1 <= carryCap(liveStats());
          if (keen) bumpCount("herbStock", 1);
          showToast(
            herbLevel(herbsRef.current) > herbLevel(before)
              ? `${def.name} gathered. Herbalism Lv ${herbLevel(herbsRef.current)} — WIS is now ${wis}.`
              : keen
                ? `${def.name} — and a second stem hiding beneath it! Keen eye (WIS ${wis}).`
                : `${def.name} gathered · Herbalism Lv ${herbLevel(herbsRef.current)} · ${flagCount(flagsRef.current, "herbStock")} in satchel`,
          );
        }
        return;
      }
      case "cast": {
        const now = performance.now();
        fishingRef.current = { phase: "wait", biteAt: now + 2200 + hash2(Math.floor(now), 17) * 3800, biteEnd: 0 };
        showToast("Cast… now wait for the bobber to dip.");
        return;
      }
      case "reel":
        // Prompt exists but the bite window already closed — a late tap.
        return;
      case "crust":
        setFlag("bread");
        showToast("You take the crust — and the pinch of salt. For the Domovyk.");
        return;
      case "offer":
        flagsRef.current.delete("bread");
        setFlag("offering");
        syncFlags();
        showToast("You leave the crust behind the pich, quiet as you can. Something in the hut sighs — happily.");
        return;
      case "gift":
        setFlag("stone");
        showToast("A smooth river stone, warm as fresh bread. The Domovyk's thanks — CON +1 while you keep it.");
        return;
      case "iron": {
        // A lump is 3 of weight, hauled in the arms: the dig is checked
        // against your satchel load (fish, herbs, forged pieces), so a
        // stuffed satchel leaves you no way to haul — but the quest's
        // own lumps can always be carried to Radek, one load at a time.
        const stIron = liveStats();
        if (satchelWeight(flagsRef.current) + 3 > carryCap(stIron)) {
          showToast(`No way to haul a lump — your satchel load is ${satchelWeight(flagsRef.current)}/${carryCap(stIron)} before iron, and a lump of bog iron weighs 3. Your STR ${stIron.str.total} sets the limit. Cook, brew or eat something down first.`);
          return;
        }
        // The third lump (the southern, deepest one) is bedded deep in
        // the mud: an honest STR check. STR 3 forces it free every
        // time; below that it is a gamble that improves with STR, and
        // a failed pull consumes nothing — the lump stays for another
        // heave.
        if (p.idx === 2) {
          const str = stIron.str.total;
          const chance = str >= 3 ? 1 : 0.35 + (str - 1) * 0.25;
          if (hash2(Math.floor(performance.now()), 97) >= chance) {
            showToast(`You heave — the deepest lump does not budge, bedded in black mud. STR check failed (your STR ${str}: it takes STR 3 to force it free, or luck on another heave). Nothing lost — try again.`);
            return;
          }
        }
        setFlag(`ironspot${p.idx}`);
        const n = bumpCount("iron", 1);
        showToast(
          n >= 3
            ? "Bog iron — that's three lumps! Your arms are full: haul them to Radek at the forge."
            : p.idx === 2
              ? `With a sucking pop, the deepest lump comes FREE! Bog iron (${n}/3 for Radek).`
              : `Bog iron! A heavy, rust-dark lump (${n}/3 for Radek).`,
        );
        return;
      }
      case "wish": {
        const lineIdx = Math.floor(hash2(Math.floor(performance.now() / 1000), 41) * WISH_LINES.length);
        openDialogue(WELL_NPC, [WISH_LINES[lineIdx] ?? WISH_LINES[0]!]);
        // The well's lucky pebble answers a CHA check: the warmer the
        // tongue that wishes, the likelier the well gives something
        // back. A miss costs nothing but the wish itself, and says so.
        if (!flagHas(flagsRef.current, "pebble")) {
          const cha = liveStats().cha.total;
          const chance = 0.18 + (cha - 1) * 0.07;
          if (hash2(Math.floor(performance.now() / 997), 43) < chance) {
            setFlag("pebble");
            showToast("Something glints on the well's rim — a lucky pebble. The well liked your wishing (CHA check passed). It puts spring in your hands (DEX +1).");
          } else {
            showToast(`The well gives back only your face — no pebble this time. CHA check missed (your CHA ${cha}); the well favours a warmer tongue. Meet more of Zalissya and wish again.`);
          }
        }
        return;
      }
      case "cook": {
        // Karas soup, the znak harka way: one pond fish, one herb,
        // the pot over the campfire. Cooking level IS your Constitution.
        const fishIn = flagCount(flagsRef.current, "fish");
        const herbsIn = flagCount(flagsRef.current, "herbStock");
        if (fishIn < 1 || herbsIn < 1) {
          showToast(
            fishIn < 1 && herbsIn < 1
              ? "The pot wants 1 fish and 1 herb from your satchel. The pond is west, the herbs glow in the grass."
              : fishIn < 1
                ? "The pot wants a fish — cast a line from the pond's west shore first."
                : "The pot wants an herb — gather any glowing patch first (Kropyva, Polyn, Kalendula, Zvirobij, Derevij).",
          );
          return;
        }
        bumpCount("fish", -1);
        bumpCount("herbStock", -1);
        const before = flagCount(flagsRef.current, "cooked");
        const cooked = bumpCount("cooked", 1);
        bumpCount("meals", 1);
        showToast(
          craftLevel(cooked) > craftLevel(before)
            ? `Karas soup! Cooking Lv ${craftLevel(cooked)} — CON is now ${liveStats().con.total}. Eat it from your Character sheet.`
            : `Karas soup, rich and steaming. · Cooking Lv ${craftLevel(cooked)} · ${flagCount(flagsRef.current, "meals")} meal(s) in satchel`,
        );
        return;
      }
      case "smith": {
        if (!flagHas(flagsRef.current, "horseshoe")) {
          showToast("The forge is cold. It needs bog iron from the pond mud — three lumps for Radek — before anyone can work it.");
          return;
        }
        const nowS = performance.now();
        if (nowS < smithReadyRef.current) {
          showToast("The iron needs a moment in the heat — and so does your arm. A breath, then hammer again.");
          return;
        }
        // A forged piece is 2 of weight, and the anvil only works for
        // someone who can carry the result — checked before the hammer
        // lifts, so a blocked swing costs no cooldown.
        if (carriedWeight(flagsRef.current) + 2 > carryCap(liveStats())) {
          carryBlockedToast(2);
          return;
        }
        smithReadyRef.current = nowS + 7000;
        const before = flagCount(flagsRef.current, "smithed");
        const smithed = bumpCount("smithed", 1);
        bumpCount("forged", 1);
        // A strong arm now and then turns out a masterwork: a second,
        // finer piece off the same heat — if your back can take it.
        const str = liveStats().str.total;
        const master =
          hash2(Math.floor(nowS), 71) < (str - 1) * 0.1 &&
          carriedWeight(flagsRef.current) + 2 <= carryCap(liveStats());
        if (master) bumpCount("forged", 1);
        showToast(
          craftLevel(smithed) > craftLevel(before)
            ? `The hammer rings true! Smithing Lv ${craftLevel(smithed)} — STR is now ${liveStats().str.total}.`
            : master
              ? `A masterwork! Two fine pieces off one heat (STR ${str}). · Smithing Lv ${craftLevel(smithed)}`
              : `Clang… clang… a sound piece of ironwork. · Smithing Lv ${craftLevel(smithed)} · ${flagCount(flagsRef.current, "forged")} forged in satchel`,
        );
        return;
      }
      case "brew": {
        // Vesna's drying rack. Alchemy level IS your Intelligence, and
        // Intelligence tiers the bench: below INT 3 only the common
        // tonic (2 herbs) is known; at INT 3+ the bench offers a real
        // recipe choice, and Vesna's strong tonic (3 herbs) unlocks.
        const herbsIn = flagCount(flagsRef.current, "herbStock");
        if (herbsIn < 2) {
          showToast(`The cauldron wants 2 herbs from your satchel — you have ${herbsIn}. The glowing patches provide.`);
          return;
        }
        if (liveStats().int.total >= 3) {
          openDialogue(BREW_BENCH_NPC, BREW_CHOICE_LINES, 0, "brew");
          return;
        }
        performBrew("base");
        return;
      }
      case "bloom": {
        // Nichnyky weigh 0 — moon-flowers, the mountain insists — so
        // the carry cap never blocks them, by design of the brief's
        // own weight table.
        const patch = lysaPatchesRef.current[p.idx];
        if (patch && !patch.taken) {
          patch.taken = true;
          setFlag(`lysaFlowerSpot${p.idx}`);
          const n = bumpCount("lysaFlower", 1);
          showToast(
            n >= 3
              ? "Nichnyk gathered — that's three. Lay them on the offering stone, north of the bonfire."
              : `Nichnyk gathered · night-blooms ${n}/3 for the offering`,
          );
        }
        return;
      }
      case "offering": {
        const have = flagCount(flagsRef.current, "lysaFlower");
        if (have < 3) {
          showToast(`The offering stone wants 3 nichnyky — night-blooms from the slopes. You carry ${have}. Motrya knows where they hide.`);
          return;
        }
        bumpCount("lysaFlower", -3);
        setFlag("lysaOffering");
        showToast("You lay the nichnyky on the cold stone. One by one, they open — and the whole ring of standing stones seems to lean closer.");
        return;
      }
      case "dance": {
        if (!flagHas(flagsRef.current, "lysaOffering")) {
          showToast("The witches shake their heads — no dance before the offering. Three nichnyky on the stone, north of the fire, first.");
          return;
        }
        danceUntilRef.current = performance.now() + 5000;
        setFlag("lysaDanced");
        showToast("You step into the ring and keep the turn — the witches whoop, the devils stamp, and the fire dances with you. Now: Beelzebub is waiting.");
        return;
      }
      case "blessing":
        // Granted through Beelzebub's dialogue; the prompt spot only
        // exists to draw the eye to his seat.
        return;
    }
  };
  const interactRef = useRef(doInteract);
  interactRef.current = doInteract;

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
      if (k === "e" || k === " ") {
        if (!e.repeat) interactRef.current();
        return;
      }
      keysRef.current.add(k);
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Main loop
  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    let raf = 0;
    let last = performance.now();
    let promptKey = "";

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vw = rect.width;
      const vh = rect.height;

      const p = playerRef.current;
      // --- movement input
      let mx = 0;
      let my = 0;
      const keys = keysRef.current;
      if (keys.has("w") || keys.has("arrowup")) my -= 1;
      if (keys.has("s") || keys.has("arrowdown")) my += 1;
      if (keys.has("a") || keys.has("arrowleft")) mx -= 1;
      if (keys.has("d") || keys.has("arrowright")) mx += 1;
      const pad = padRef.current;
      if (pad.has("up")) my -= 1;
      if (pad.has("down")) my += 1;
      if (pad.has("left")) mx -= 1;
      if (pad.has("right")) mx += 1;
      const len = Math.hypot(mx, my);
      const area = areaRef.current;
      const ws = worldSize(area);
      const solids = area === "lysa" ? LYSA_SOLID : isHutArea(area) ? hutSolids(area) : SOLID;
      const dancing = area === "lysa" && now < danceUntilRef.current;
      const frozen = dialogueRef.current != null || panelRef.current || dancing;
      p.moving = len > 0.01 && !frozen;
      // Walking off abandons the cast — the line comes in empty.
      if (p.moving && fishingRef.current) fishingRef.current = null;
      if (p.moving) {
        const nx = mx / (len > 1 ? len : 1);
        const ny = my / (len > 1 ? len : 1);
        p.face = nx;
        p.phase += dt * 11;
        // Constitution is walking pace: a fed, seasoned traveller covers
        // ground brisker than a newcomer living on air (+4 per CON).
        const speed = PLAYER_SPEED + (liveStats().con.total - 1) * 4;
        const stepX = nx * speed * dt * Math.min(1, len);
        const stepY = ny * speed * dt * Math.min(1, len);
        // axis-separated collision
        let tx = clamp(p.x + stepX, PLAYER_R + 4, ws.w - PLAYER_R - 4);
        if (!solids.some((b) => circleRectCollide(tx, p.y - 6, PLAYER_R, b)) && (area !== "village" || !inPond(tx, p.y))) p.x = tx;
        let ty = clamp(p.y + stepY, 46, ws.h - 10);
        if (!solids.some((b) => circleRectCollide(p.x, ty - 6, PLAYER_R, b)) && (area !== "village" || !inPond(p.x, ty))) p.y = ty;
        dirtyRef.current = true;
      }

      // --- area transitions: walk off the trail's end, arrive on the
      // other side. The village's east edge (between the cairns, on the
      // spur path) climbs to Lysa Hora; the summit's west trailhead
      // walks back down to Zalissya.
      if (!dialogueRef.current && !panelRef.current) {
        if (area === "village" && p.x >= WORLD_W - PLAYER_R - 6 && p.y >= TRAIL_Y_MIN && p.y <= TRAIL_Y_MAX) {
          areaRef.current = "lysa";
          setHudArea("lysa");
          p.x = LYSA_SPAWN.x;
          p.y = LYSA_SPAWN.y;
          fishingRef.current = null;
          promptRef.current = null;
          setPrompt(null);
          promptKey = "";
          if (!flagHas(flagsRef.current, "visitedLysa")) {
            setFlag("visitedLysa");
            showToast("The trail climbs… and climbs… and the trees give up. Lysa Hora. The Bald Mountain. Something is dancing around a fire up there.");
          } else {
            showToast("Lysa Hora — the sabbath is still going.");
          }
          dirtyRef.current = true;
        } else if (area === "lysa" && p.x <= PLAYER_R + 6 && p.y >= 400 && p.y <= 560) {
          areaRef.current = "village";
          setHudArea("village");
          p.x = VILLAGE_RETURN.x;
          p.y = VILLAGE_RETURN.y;
          promptRef.current = null;
          setPrompt(null);
          promptKey = "";
          showToast("Down the trail, back under the trees — Zalissya, and honest daylight.");
          dirtyRef.current = true;
        } else if (area === "village" && my < 0 && Math.abs(p.x - 384) < 34 && p.y >= 316 && p.y <= 342) {
          // Walking up into the Domovyk's hut door (north-west hut).
          enterHut(0);
        } else if (area === "village" && my < 0 && Math.abs(p.x - 1285) < 34 && p.y >= 798 && p.y <= 822) {
          // Walking up into Vesna's hut door (south-east hut — the one
          // she stands beside, by her garden).
          enterHut(1);
        } else if (isHutArea(area) && p.y >= HUT_H - 70) {
          // Out of the interior's south door — only the door gap in
          // the south wall lets the player reach this far down.
          exitHut();
        }
      }

      // --- herb respawn
      for (const patch of patchesRef.current) {
        if (!patch.available && now > patch.respawnAt) patch.available = true;
      }

      // --- fishing: the bite window opens, then closes
      const fishing = fishingRef.current;
      if (fishing) {
        if (fishing.phase === "wait" && now >= fishing.biteAt) {
          fishing.phase = "bite";
          // Dexterity is reaction: every point past the first buys
          // another 120ms to answer the bite.
          fishing.biteEnd = now + 1100 + (liveStats().dex.total - 1) * 120;
        } else if (fishing.phase === "bite" && now > fishing.biteEnd) {
          fishingRef.current = null;
          setToast("It slipped away… the bobber settles. Cast again when ready.");
        }
      }

      // --- chickens wander (village only — there are no chickens on the
      // Bald Mountain; the witches ate them, probably)
      for (const ch of area === "village" ? chickensRef.current : []) {
        ch.phase += dt;
        if (ch.wait > 0) {
          ch.wait -= dt;
        } else {
          // Chickens are not fools: stride too close and they scatter.
          const pdx = ch.x - p.x;
          const pdy = ch.y - p.y;
          const pd = Math.hypot(pdx, pdy);
          if (pd < 52 && pd > 0.01) {
            ch.x += (pdx / pd) * 95 * dt;
            ch.y += (pdy / pd) * 95 * dt;
            ch.tx = ch.x;
            ch.ty = ch.y;
            continue;
          }
          const dx = ch.tx - ch.x;
          const dy = ch.ty - ch.y;
          const d = Math.hypot(dx, dy);
          if (d < 4) {
            ch.wait = 1 + hash2(now * 0.001, ch.x) * 2.4;
            ch.tx = clamp(ch.x + (hash2(ch.y, now * 0.01) - 0.5) * 190, 620, 1060);
            ch.ty = clamp(ch.y + (hash2(ch.x, now * 0.01) - 0.5) * 130, 620, 860);
          } else {
            ch.x += (dx / d) * 26 * dt;
            ch.y += (dy / d) * 26 * dt;
          }
        }
      }

      // --- nearest interactable
      const flagsNow = flagsRef.current;
      let nextPrompt: Prompt = null;
      let best = 64;
      if (area === "lysa") {
        // Lysa Hora interactables: the sabbath host, the night-blooms,
        // the offering stone, and the dance ring.
        for (const npc of LYSA_CHARS) {
          const pos = charPos(npc, now);
          const d = Math.hypot(pos.x - p.x, pos.y - p.y);
          const reach = npc.id === "beelzebub" ? 96 : 64;
          if (d < reach && d - reach < best - 64) { best = d - reach + 64; nextPrompt = { kind: "talk", npc }; }
        }
        lysaPatchesRef.current.forEach((patch, idx) => {
          if (patch.taken) return;
          const d = Math.hypot(patch.x - p.x, patch.y - p.y);
          if (d < 50 && d < best + 14) nextPrompt = { kind: "bloom", idx };
        });
        const lspot = (x: number, y: number, reach: number, make: () => Prompt) => {
          const d = Math.hypot(x - p.x, y - p.y);
          if (d < reach && d <= best + 14) { best = d; nextPrompt = make(); }
        };
        if (!flagHas(flagsNow, "lysaOffering")) {
          lspot(LYSA_OFFER_SPOT.x, LYSA_OFFER_SPOT.y, 62, () => ({ kind: "offering" }));
        }
        if (flagHas(flagsNow, "lysaOffering") && !flagHas(flagsNow, "lysaDanced")) {
          lspot(LYSA_DANCE_SPOT.x, LYSA_DANCE_SPOT.y, 66, () => ({ kind: "dance" }));
        }
      } else if (isHutArea(area)) {
        // Inside a hut: the resident, the pich offering spots (the
        // Domovyk's hut only — the bread offering and his gift live
        // indoors now), and the door back out.
        const resident = area === "hut1" ? VESNA_IN : DOMOVYK_IN;
        const rpos = charPos(resident, now);
        const rd = Math.hypot(rpos.x - p.x, rpos.y - p.y);
        if (rd < 64) { best = rd; nextPrompt = { kind: "talk", npc: resident }; }
        const hspot = (cond: boolean, x: number, y: number, reach: number, make: () => Prompt) => {
          if (!cond) return;
          const d = Math.hypot(x - p.x, y - p.y);
          if (d < reach && d <= best + 14) { best = d; nextPrompt = make(); }
        };
        if (area === "hut0") {
          hspot(flagHas(flagsNow, "bread"), PICH_IN_SPOT.x, PICH_IN_SPOT.y, 58, () => ({ kind: "offer" }));
          hspot(flagHas(flagsNow, "offering") && !flagHas(flagsNow, "stone"), PICH_IN_SPOT.x, PICH_IN_SPOT.y + 14, 58, () => ({ kind: "gift" }));
        }
        hspot(true, HUT_DOOR_IN.x, HUT_DOOR_IN.y, 50, () => ({ kind: "exit" }));
      } else if (fishingRef.current?.phase === "bite") {
        nextPrompt = { kind: "reel" };
      } else {
        for (const npc of ALL_CHARS) {
          const pos = charPos(npc, now);
          const d = Math.hypot(pos.x - p.x, pos.y - p.y);
          // Vij is enormous and the Bolotianyk sits out in the pond, so both
          // can be addressed from further off than a person.
          const reach = npc.id === "vij" ? 158 : npc.id === "bolotianyk" ? 92 : 64;
          if (d < reach && d - reach < best - 64) { best = d - reach + 64; nextPrompt = { kind: "talk", npc }; }
        }
        patchesRef.current.forEach((patch, idx) => {
          if (!patch.available) return;
          const d = Math.hypot(patch.x - p.x, patch.y - p.y);
          if (d < 50 && d < best + 14) nextPrompt = { kind: "gather", idx };
        });
        // Village-life spots compete on plain distance from here on.
        const spot = (cond: boolean, x: number, y: number, reach: number, make: () => Prompt) => {
          if (!cond) return;
          const d = Math.hypot(x - p.x, y - p.y);
          if (d < reach && d <= best + 14) { best = d; nextPrompt = make(); }
        };
        spot(!fishingRef.current, FISH_SPOT.x, FISH_SPOT.y, 62, () => ({ kind: "cast" }));
        spot(!flagHas(flagsNow, "bread") && !flagHas(flagsNow, "offering"), CRUST_SPOT.x, CRUST_SPOT.y, 56, () => ({ kind: "crust" }));
        // The two enterable hut doors: stepping up to one offers entry
        // (and walking into it enters directly — see the transitions).
        // The bread offering itself is made indoors now, at the pich.
        spot(true, 384, 336, 46, () => ({ kind: "enter", hut: 0 as const }));
        spot(true, 1285, 810, 46, () => ({ kind: "enter", hut: 1 as const }));
        spot(true, WELL.x + WELL.w / 2, WELL.y + WELL.h / 2, 66, () => ({ kind: "wish" }));
        spot(true, COOK_SPOT.x, COOK_SPOT.y, 60, () => ({ kind: "cook" }));
        spot(true, FORGE_SPOT.x, FORGE_SPOT.y, 60, () => ({ kind: "smith" }));
        spot(true, BREW_SPOT.x, BREW_SPOT.y, 60, () => ({ kind: "brew" }));
        IRON_SPOTS.forEach((s, idx) => {
          spot(!flagHas(flagsNow, `ironspot${idx}`) && !flagHas(flagsNow, "horseshoe"), s.x, s.y, 52, () => ({ kind: "iron", idx }));
        });
      }
      const key = promptKeyOf(nextPrompt);
      if (key !== promptKey) {
        promptKey = key;
        promptRef.current = nextPrompt;
        setPrompt(nextPrompt);
      }

      // --- camera
      const camX = clamp(p.x - vw / 2, 0, Math.max(0, ws.w - vw));
      const camY = clamp(p.y - vh / 2, 0, Math.max(0, ws.h - vh));

      // --- render
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2d.clearRect(0, 0, vw, vh);
      if (area === "lysa") {
        drawLysaGround(ctx2d, camX, camY, vw, vh, now, flagHas(flagsNow, "lysaOffering"));
        drawLysaFire(ctx2d, camX, camY, now);
        lysaPatchesRef.current.forEach((patch) => drawLysaFlower(ctx2d, patch.x, patch.y, camX, camY, now, !patch.taken));
      } else if (isHutArea(area)) {
        drawHutInterior(ctx2d, camX, camY, now, area === "hut1" ? 1 : 0, flagsNow);
      } else {
      drawGround(ctx2d, camX, camY, vw, vh, now);
      drawWell(ctx2d, camX, camY);
      drawFire(ctx2d, camX, camY, now);
      drawBrewBench(ctx2d, camX, camY, now);
      if (!flagHas(flagsNow, "bread") && !flagHas(flagsNow, "offering")) {
        drawCrust(ctx2d, camX, camY, now);
      }
      // bog iron glints in the pond mud, until dug
      IRON_SPOTS.forEach((s, idx) => {
        if (flagHas(flagsNow, `ironspot${idx}`) || flagHas(flagsNow, "horseshoe")) return;
        const ix = s.x - camX;
        const iy = s.y - camY;
        ctx2d.fillStyle = "#4a3423";
        ctx2d.beginPath(); ctx2d.ellipse(ix, iy, 10, 5.4, 0.3, 0, Math.PI * 2); ctx2d.fill();
        ctx2d.fillStyle = "#6e4a2a";
        ctx2d.beginPath(); ctx2d.ellipse(ix - 2, iy - 1.4, 6, 3.2, 0.3, 0, Math.PI * 2); ctx2d.fill();
        const glint = 0.4 + Math.sin(now * 0.005 + idx * 2.2) * 0.3;
        ctx2d.fillStyle = `rgba(255,196,110,${glint})`;
        ctx2d.fillRect(ix + 2, iy - 4, 2.2, 2.2);
      });
      patchesRef.current.forEach((patch) => drawHerbPatch(ctx2d, patch.x, patch.y, camX, camY, now, patch.available, HERBS[patch.kind]));
      for (const f of FENCES) drawFence(ctx2d, f, camX, camY);
      }

      type Drawable = { y: number; draw: () => void };
      const drawables: Drawable[] = [];
      if (area === "village") {
      for (const h of HOUSES) {
        drawables.push({ y: h.y + h.h, draw: () => drawHouse(ctx2d, h, camX, camY, now) });
      }
      for (const tr of TREES) {
        if (tr.x < camX - 90 || tr.x > camX + vw + 90 || tr.y < camY - 130 || tr.y > camY + vh + 40) continue;
        drawables.push({ y: tr.y, draw: () => drawTree(ctx2d, tr, camX, camY, now) });
      }
      }
      for (const npc of area === "lysa" ? [...LYSA_CHARS, ...LYSA_DANCERS] : area === "hut0" ? [DOMOVYK_IN] : area === "hut1" ? [VESNA_IN] : ALL_CHARS) {
        const pos = charPos(npc, now);
        drawables.push({
          y: pos.y,
          draw: () => {
            const sx = pos.x - camX;
            const sy = pos.y - camY;
            if (npc.style === "domovyk") drawDomovyk(ctx2d, sx, sy, now);
            else if (npc.style === "lisovyk") drawLisovyk(ctx2d, sx, sy, now);
            else if (npc.style === "chort") drawChort(ctx2d, sx, sy, now);
            else if (npc.style === "bolotianyk") drawBolotianyk(ctx2d, sx, sy, now);
            else if (npc.style === "vij") drawVij(ctx2d, sx, sy, now);
            else if (npc.style === "beelzebub") drawBeelzebub(ctx2d, sx, sy, now);
            else if (npc.style === "witch") drawWitch(ctx2d, sx, sy, npc.tunic, npc.hair, now, false);
            else if (npc.style === "dancer") drawWitch(ctx2d, sx, sy, npc.tunic, npc.hair, now, true);
            else {
              drawPerson(ctx2d, sx, sy, {
                tunic: npc.tunic, hair: npc.hair, style: npc.style,
                moving: false, phase: 0, face: clamp(p.x - pos.x, -1, 1) * 0.7, t: now,
              });
            }
          },
        });
        // name tag — each kind floats at its own height (Vij's is a warning)
        const tagLift = npc.id === "vij" ? 168 : npc.style === "beelzebub" ? 96 : npc.style === "witch" ? 64 : npc.style === "lisovyk" ? 122 : npc.style === "domovyk" ? 48 : npc.style === "bolotianyk" ? 58 : 66;
        const tagText = npc.id === "vij" ? "Вій · Vij" : npc.name;
        if (npc.style !== "dancer") drawables.push({
          y: pos.y + 1,
          draw: () => {
            ctx2d.font = npc.id === "vij" ? "700 13px Georgia, serif" : "600 11px Georgia, serif";
            ctx2d.textAlign = "center";
            const wText = ctx2d.measureText(tagText).width + 16;
            ctx2d.fillStyle = npc.id === "vij" ? "rgba(38,10,14,0.72)" : "rgba(28,24,16,0.55)";
            rr(ctx2d, pos.x - camX - wText / 2, pos.y - camY - tagLift, wText, npc.id === "vij" ? 20 : 16, 8);
            ctx2d.fill();
            ctx2d.fillStyle = npc.id === "vij" ? "#f0b9a6" : "#f3e9d2";
            ctx2d.fillText(tagText, pos.x - camX, pos.y - camY - tagLift + (npc.id === "vij" ? 14.5 : 12));
          },
        });
      }
      for (const ch of area === "village" ? chickensRef.current : []) {
        drawables.push({
          y: ch.y,
          draw: () => drawChicken(ctx2d, ch.x, ch.y, ch.wait > 0.4 && ch.wait < 1 ? Math.sin((1 - ch.wait) * 9) * 0.5 + 0.5 : 0, camX, camY),
        });
      }
      drawables.push({
        y: p.y,
        draw: () => drawPerson(ctx2d, p.x - camX, p.y - camY, {
          tunic: "#efe3c8", hair: "#5d3a1a", style: "player",
          moving: p.moving || dancing, phase: dancing ? now * 0.018 : p.phase, face: p.face, t: now,
          // Sold your soul to the Chort? Then the sun casts no shadow
          // for you — until you buy it back with three fish.
          shadow: !(flagHas(flagsNow, "soulsold") && !flagHas(flagsNow, "soulback")),
        }),
      });
      if (fishingRef.current) {
        const fphase = fishingRef.current.phase;
        drawables.push({
          y: BOBBER.y + 2,
          draw: () => drawFishing(ctx2d, p.x, p.y, camX, camY, now, fphase),
        });
      }
      drawables.sort((a, b) => a.y - b.y);
      for (const d of drawables) d.draw();

      // drifting pollen / seeds in the light (outdoors only — the huts
      // have dust motes enough of their own in the lamplight)
      ctx2d.fillStyle = "rgba(255,244,200,0.55)";
      for (let i = 0; i < (isHutArea(area) ? 0 : 22); i++) {
        const px = ((hash2(i, 3) * WORLD_W + now * 0.012 * (0.6 + hash2(i, 4))) % WORLD_W) - camX;
        const py = ((hash2(i, 8) * WORLD_H + Math.sin(now * 0.001 + i * 2.1) * 16) % WORLD_H) - camY;
        if (px < -4 || px > vw + 4 || py < -4 || py > vh + 4) continue;
        ctx2d.beginPath();
        ctx2d.arc(px, py, 1.3 + hash2(i, 9) * 1.2, 0, Math.PI * 2);
        ctx2d.fill();
      }

      // vignette — warm for the village day, cold moonlit blue on Lysa Hora
      if (area === "lysa") {
        ctx2d.fillStyle = "rgba(16,18,48,0.18)";
        ctx2d.fillRect(0, 0, vw, vh);
      }
      const vg = ctx2d.createRadialGradient(vw / 2, vh * 0.42, Math.min(vw, vh) * 0.36, vw / 2, vh * 0.5, Math.max(vw, vh) * 0.78);
      vg.addColorStop(0, "rgba(60,30,0,0)");
      vg.addColorStop(1, area === "lysa" ? "rgba(6,6,24,0.42)" : "rgba(43,26,4,0.28)");
      ctx2d.fillStyle = vg;
      ctx2d.fillRect(0, 0, vw, vh);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [started]);

  function inPond(x: number, y: number): boolean {
    const dx = (x - POND.x) / (POND.rx + 6);
    const dy = (y - POND.y) / (POND.ry + 6);
    return dx * dx + dy * dy < 1;
  }

  // --- hold-to-move pad ------------------------------------------------------
  // Each direction is a plain button: press and hold to walk, release to
  // stop. Two buttons can be held at once for diagonal movement (each
  // captures its own pointer, so multi-touch works). There is deliberately
  // NO drag-based control: on the user's phone a downward drag is claimed
  // by the host's pull-to-refresh before the page can use it, whatever the
  // page sets — a stationary hold produces no scroll/refresh gesture at all.
  const padDown = (dirs: string[]) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    dirs.forEach((d) => padRef.current.add(d));
    setPadPressed(new Set(padRef.current));
  };
  const padUp = (dirs: string[]) => () => {
    let changed = false;
    dirs.forEach((d) => { if (padRef.current.delete(d)) changed = true; });
    if (!changed) return;
    setPadPressed(new Set(padRef.current));
  };
  // If the window loses focus mid-hold, drop all held directions so the
  // player never walks on unattended.
  useEffect(() => {
    const clear = () => {
      padRef.current.clear();
      setPadPressed(new Set());
    };
    window.addEventListener("blur", clear);
    return () => window.removeEventListener("blur", clear);
  }, []);

  const onReset = () => {
    resetMut.mutate(undefined, {
      onSuccess: () => {
        talkedRef.current = new Set();
        herbsRef.current = 0;
        flagsRef.current = new Set();
        areaRef.current = "village";
        setHudArea("village");
        lysaPatchesRef.current.forEach((pt) => { pt.taken = false; });
        danceUntilRef.current = 0;
        blessingPendingRef.current = false;
        fishingRef.current = null;
        smithReadyRef.current = 0;
        panelRef.current = false;
        setPanelOpen(false);
        playerRef.current = { x: SPAWN.x, y: SPAWN.y, face: 0, moving: false, phase: 0 };
        patchesRef.current.forEach((pt) => { pt.available = true; });
        setHudTalked([]);
        setHudHerbs(0);
        setHudFlags(new Set());
        setToast(null);
        setConfirmReset(false);
        dialogueRef.current = null;
        setDialogue(null);
      },
    });
  };

  const lvl = herbLevel(hudHerbs);
  const fish = flagCount(hudFlags, "fish");
  const fishTotal = Math.max(flagCount(hudFlags, "fishTotal"), fish);
  const fishLvl = fishLevel(fishTotal);
  const herbStock = flagCount(hudFlags, "herbStock");
  const cooked = flagCount(hudFlags, "cooked");
  const meals = flagCount(hudFlags, "meals");
  const smithed = flagCount(hudFlags, "smithed");
  const forged = flagCount(hudFlags, "forged");
  const brewed = flagCount(hudFlags, "brewed");
  const potions = flagCount(hudFlags, "potions");
  const strongPotions = flagCount(hudFlags, "strongPotions");
  const cookLvl = craftLevel(cooked);
  const smithLvl = craftLevel(smithed);
  const alchemyLvl = craftLevel(brewed);
  const stats = computeStats({
    herbs: hudHerbs, fishTotal, cooked, smithed, brewed,
    met: hudTalked.length, flags: hudFlags,
  });
  const price = soulPrice(stats);
  const carried = carriedWeight(hudFlags);
  const cap = carryCap(stats);
  const iron = flagCount(hudFlags, "iron");
  const haulingIron = !flagHas(hudFlags, "horseshoe") && iron > 0;
  const metVillagers = hudTalked.filter((id) => VILLAGER_IDS.has(id)).length;
  const metSpirits = hudTalked.filter((id) => id === "domovyk" || id === "lisovyk").length;
  const metDark = hudTalked.filter((id) => id === "chort" || id === "bolotianyk").length;
  const metVij = hudTalked.includes("vij");
  const soulLost = flagHas(hudFlags, "soulsold") && !flagHas(hudFlags, "soulback");
  const lysaFlowers = flagCount(hudFlags, "lysaFlower");
  const visitedLysa = hudArea === "lysa" || flagHas(hudFlags, "visitedLysa");
  const lysaObjective =
    hudArea !== "lysa"
      ? null
      : flagHas(hudFlags, "moonstone")
        ? "Blessed by Beelzebub 🌙 — the west trail leads back down to Zalissya"
        : flagHas(hudFlags, "lysaDanced")
          ? "Ask Beelzebub for his blessing — the great seat, north of the fire"
          : flagHas(hudFlags, "lysaOffering")
            ? "Join the dance — step into the ring south of the bonfire"
            : lysaFlowers >= 3
              ? "Lay your nichnyky on the offering stone, north of the bonfire"
              : `Gather nichnyky on the slopes for the offering · ${lysaFlowers}/3`;
  const hutObjective =
    hudArea === "hut0"
      ? "Inside the Domovyk's hut — the pich is its warm heart. The door is south."
      : hudArea === "hut1"
        ? "Inside Vesna's hut — mind the cauldron. The door is south."
        : null;
  const objective = hutObjective ?? lysaObjective ??
    (metVillagers < 3
      ? `Meet the villagers · ${metVillagers}/3`
      : hudHerbs < 5
        ? `Gather herbs for Vesna · ${Math.min(hudHerbs, 5)}/5`
        : metSpirits < 2
          ? `Seek the spirits · Domovyk & Lisovyk ${metSpirits}/2`
          : metDark < 2
            ? `Stranger things stir · Chort & Bolotianyk ${metDark}/2`
            : !visitedLysa
              ? "Lysa Hora stirs — follow the east trail out of the clearing to the Chort's sabbath"
              : !metVij
              ? "Vij sleeps in the north-east hollow — go and see him"
              : soulLost
                ? `Buy your soul back: catch fish for the Chort · ${Math.min(fish, price)}/${price}`
                : !flagHas(hudFlags, "offering")
                  ? "Leave the campfire crust for the Domovyk — step inside his hut, by the pich"
                  : iron < 3
                    ? `Dig bog iron in the pond mud for Radek · ${iron}/3`
                    : !flagHas(hudFlags, "horseshoe")
                      ? "Bring the bog iron to Radek at the forge"
                      : fishTotal < 1
                        ? "Try fishing from the pond's west shore"
                        : cooked < 1
                          ? "Cook karas soup at the campfire pot · 1 fish + 1 herb"
                          : smithed < 1
                            ? "Work Radek's forge — stand at the anvil and hammer"
                            : brewed < 1
                              ? "Brew a tonic at Vesna's drying rack, by the north-east hut · 2 herbs"
                              : "Zalissya is home now. The fire is warm, and Vij still sleeps");
  const promptHerb =
    prompt?.kind === "gather" ? HERBS[HERB_SPOTS[prompt.idx]?.kind ?? "kropyva"] : null;
  const promptLabel = !prompt
    ? ""
    : prompt.kind === "talk"
      ? prompt.npc.id === "vij" ? "Approach · Vij" : `Talk · ${prompt.npc.name}`
      : prompt.kind === "enter"
        ? "Step inside 🚪"
        : prompt.kind === "exit"
          ? "Step outside"
          : prompt.kind === "gather"
        ? `Gather ${promptHerb?.name ?? "herb"} 🌿`
        : prompt.kind === "cast"
          ? "Cast a line 🎣"
          : prompt.kind === "reel"
            ? "REEL IN! 🎣"
            : prompt.kind === "crust"
              ? "Take the crust 🍞"
              : prompt.kind === "offer"
                ? "Leave the crust by the pich"
                : prompt.kind === "gift"
                  ? "Something glints by the door…"
                  : prompt.kind === "iron"
                    ? "Dig bog iron"
                    : prompt.kind === "cook"
                      ? "Cook karas soup 🍲"
                      : prompt.kind === "smith"
                        ? "Work the forge 🔨"
                        : prompt.kind === "brew"
                          ? stats.int.total >= 3 ? "Brew — choose a recipe ⚗" : "Brew a tonic ⚗"
                          : prompt.kind === "bloom"
                            ? "Gather nichnyk 🌙"
                            : prompt.kind === "offering"
                              ? "Lay the offering 🌙"
                              : prompt.kind === "dance"
                                ? "Join the dance 💃"
                                : "Make a wish ✨";
  const promptAria = !prompt
    ? ""
    : prompt.kind === "talk"
      ? prompt.npc.id === "vij" ? "Approach Vij — carefully" : `Talk to ${prompt.npc.name}`
      : promptLabel.replace(/\s*[🎣🍞✨🍲🔨⚗🌙💃🚪]\s*/g, " ").trim();
  const keepsakes: string[] = [
    ...(flagHas(hudFlags, "moonstone") ? ["🌙 Moonstone (WIS +1, CHA +1)"] : []),
    ...(flagHas(hudFlags, "gold") ? ["🪙 Devil's gold (CHA +2)"] : []),
    ...(flagHas(hudFlags, "stone") ? ["🪨 Warm stone (CON +1)"] : []),
    ...(flagHas(hudFlags, "horseshoe") ? ["✦ Horseshoe (STR +1)"] : []),
    ...(flagHas(hudFlags, "pebble") ? ["✨ Lucky pebble (DEX +1)"] : []),
    ...(flagHas(hudFlags, "bread") ? ["🍞 Domovyk's crust"] : []),
  ];
  // Skill rows for the Character sheet: name, level, lifetime count, and
  // what the next level wants.
  const skillRows: Array<{ name: string; level: number; done: number; next: number | null; stat: string }> = [
    { name: "Herbalism", level: lvl, done: hudHerbs, next: THRESH[lvl] ?? null, stat: "WIS" },
    { name: "Fishing", level: fishLvl, done: fishTotal, next: FISH_THRESH[fishLvl] ?? null, stat: "DEX" },
    { name: "Cooking", level: cookLvl, done: cooked, next: CRAFT_THRESH[cookLvl] ?? null, stat: "CON" },
    { name: "Smithing", level: smithLvl, done: smithed, next: CRAFT_THRESH[smithLvl] ?? null, stat: "STR" },
    { name: "Alchemy", level: alchemyLvl, done: brewed, next: CRAFT_THRESH[alchemyLvl] ?? null, stat: "INT" },
  ];
  // --- Quest log ------------------------------------------------------------
  // Every thread the game is tracking, derived from the same flags and
  // counters the objective line reads — the HUD shows only the single
  // current step, so the full list lives here. "active" mirrors the
  // objective chain's priority (on Lysa Hora, the sabbath chain wins).
  type QuestItem = { id: string; title: string; detail: string; done: boolean };
  type QuestStatus = "done" | "active" | "todo";
  const lysaChainDone = flagHas(hudFlags, "moonstone");
  const activeQuestId: string | null =
    hudArea === "lysa" && !lysaChainDone
      ? "lysa-sabbath"
      : metVillagers < 3
        ? "meet"
        : hudHerbs < 5
          ? "herbs"
          : metSpirits < 2
            ? "spirits"
            : metDark < 2
              ? "dark"
              : !visitedLysa
                ? "lysa-visit"
                : !metVij
                  ? "vij"
                  : soulLost
                    ? "soul"
                    : !flagHas(hudFlags, "offering")
                      ? "domovyk"
                      : iron < 3
                        ? "forge"
                        : !flagHas(hudFlags, "horseshoe")
                          ? "forge"
                          : fishTotal < 1
                            ? "fishing"
                            : cooked < 1
                              ? "cooking"
                              : smithed < 1
                                ? "smithing"
                                : brewed < 1
                                  ? "alchemy"
                                  : !lysaChainDone
                                    ? "lysa-sabbath"
                                    : null;
  const soulQuest: QuestItem[] = flagHas(hudFlags, "soulsold")
    ? [{
        id: "soul",
        title: "The Chort's bargain",
        detail: flagHas(hudFlags, "soulback")
          ? "Bought back — soul, shadow and all"
          : `Catch fish for the Chort to buy your soul back · ${Math.min(fish, price)}/${price}`,
        done: flagHas(hudFlags, "soulback"),
      }]
    : [];
  const questSections: Array<{ title: string; quests: QuestItem[] }> = [
    {
      title: "Story",
      quests: [
        { id: "meet", title: "Meet the villagers", detail: `Talk to Myroslav, Vesna and Radek · ${metVillagers}/3`, done: metVillagers >= 3 },
        { id: "herbs", title: "Herbs for Vesna", detail: `Gather herbs in the clearing · ${Math.min(hudHerbs, 5)}/5`, done: hudHerbs >= 5 },
        { id: "spirits", title: "Seek the spirits", detail: `Find the Domovyk and the Lisovyk · ${metSpirits}/2`, done: metSpirits >= 2 },
        { id: "dark", title: "Stranger things stir", detail: `Meet the Chort and the Bolotianyk · ${metDark}/2`, done: metDark >= 2 },
        { id: "vij", title: "Look upon Vij", detail: "Approach Vij in the north-east hollow — look, but do not wake him", done: metVij },
      ],
    },
    {
      title: "Village life",
      quests: [
        {
          id: "domovyk",
          title: "Bread for the Domovyk",
          detail: flagHas(hudFlags, "stone")
            ? "Bread left, thanks received — his warm stone is yours"
            : flagHas(hudFlags, "offering")
              ? "The crust is eaten. See what waits by his door"
              : flagHas(hudFlags, "bread")
                ? "Leave the crust by the pich, inside his hut"
                : "Take the crust by the campfire and leave it by the Domovyk's pich",
          done: flagHas(hudFlags, "stone"),
        },
        {
          id: "forge",
          title: "Light Radek's forge",
          detail: flagHas(hudFlags, "horseshoe")
            ? "The forge is lit, and the horseshoe is yours"
            : iron >= 3
              ? "Bring the bog iron to Radek at the forge"
              : `Dig bog iron in the pond mud · ${iron}/3`,
          done: flagHas(hudFlags, "horseshoe"),
        },
        ...soulQuest,
        { id: "fishing", title: "First catch", detail: fishTotal > 0 ? `Lifetime catch · ${fishTotal} fish` : "Cast from the pond's west shore and wait for the bite", done: fishTotal >= 1 },
        { id: "cooking", title: "Cook karas soup", detail: "At the campfire pot · 1 fish + 1 herb", done: cooked >= 1 },
        { id: "smithing", title: "Work the forge", detail: flagHas(hudFlags, "horseshoe") ? "Work the anvil at Radek's lit forge" : "Needs Radek's forge lit first", done: smithed >= 1 },
        { id: "alchemy", title: "Brew a tonic", detail: "At Vesna's drying rack, by the north-east hut · 2 herbs", done: brewed >= 1 },
      ],
    },
    {
      title: "Lysa Hora",
      quests: [
        { id: "lysa-visit", title: "Climb to Lysa Hora", detail: "Follow the east trail out of the clearing", done: visitedLysa },
        {
          id: "lysa-sabbath",
          title: "The sabbath",
          detail: lysaChainDone
            ? "Beelzebub's blessing received — the Moonstone is yours"
            : flagHas(hudFlags, "lysaDanced")
              ? "Ask Beelzebub for his blessing"
              : flagHas(hudFlags, "lysaOffering")
                ? "Join the dance, south of the bonfire"
                : lysaFlowers >= 3
                  ? "Lay your nichnyky on the offering stone"
                  : `Gather nichnyky on the slopes · ${lysaFlowers}/3`,
          done: lysaChainDone,
        },
      ],
    },
  ];
  const allQuests = questSections.flatMap((s) => s.quests);
  const questsDone = allQuests.filter((q) => q.done).length;
  const questStatus = (q: QuestItem): QuestStatus =>
    q.done ? "done" : q.id === activeQuestId ? "active" : "todo";

  const openPanel = (tab: "stats" | "skills" | "quests") => {
    setPanelTab(tab);
    panelRef.current = true;
    setPanelOpen(true);
  };
  const closePanel = () => {
    panelRef.current = false;
    setPanelOpen(false);
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#1e3a24] select-none" style={{ touchAction: "none", overscrollBehavior: "none" }}>
      <SafeAreaTopScrim backgroundColor="rgba(30,58,36,0)" />
      <div
        ref={wrapRef}
        className="absolute inset-0"
        style={{ touchAction: "none", overscrollBehavior: "none" }}
      >
        <canvas ref={canvasRef} className="block" style={{ touchAction: "none" }} aria-label="Zalissya village clearing — game view" />
        {/* warm sunlight wash in the village; cold moonwash on Lysa Hora */}
        <div className="pointer-events-none absolute inset-0" style={{ background: hudArea === "lysa" ? "linear-gradient(160deg, rgba(140,160,255,0.13) 0%, rgba(140,160,255,0) 50%)" : isHutArea(hudArea) ? "linear-gradient(165deg, rgba(255,170,80,0.15) 0%, rgba(255,170,80,0) 55%)" : "linear-gradient(135deg, rgba(255,196,86,0.14) 0%, rgba(255,196,86,0) 45%)" }} />
      </div>

      {!started && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-[#16281a]/72 p-5"
          style={{ touchAction: "none", overscrollBehavior: "none" }}
        >
          <div className="w-full max-w-xs rounded-2xl border border-[#d9c491]/50 bg-[#f3e9d2] p-6 text-center shadow-2xl">
            <h1 className="font-serif text-3xl font-bold text-[#33241a]">Zalissya</h1>
            <p className="mt-2 text-sm text-[#5d4630]">A Ukrainian folk tale</p>
            <button
              type="button"
              aria-label={saveQuery.data?.exists ? "Continue" : "Enter the village"}
              onClick={() => setStarted(true)}
              className="mt-5 w-full rounded-xl bg-[#7a4a2b] px-4 py-3 font-serif text-base font-bold text-[#f3e9d2] shadow active:bg-[#5d3a1f]"
            >
              {saveQuery.data?.exists ? "Continue" : "Enter the village"}
            </button>
          </div>
        </div>
      )}

      {started && (
        <>
          {/* HUD — deliberately slim: where you are, the one current
              objective, and urgent warnings only. Skill levels, stat
              totals, carrying and keepsakes all live in the Character
              sheet; the full thread list lives in Quests. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 px-3 pt-safe">
            <div className="mt-2 max-w-[250px] rounded-xl bg-[#1c1409]/62 px-3 py-2 text-[#f3e9d2] backdrop-blur-[2px]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#cbb27a]">
                {hudArea === "lysa" ? "🌙 Lysa Hora · the Bald Mountain" : hudArea === "hut0" ? "🏠 Inside · the Domovyk's hut" : hudArea === "hut1" ? "🏠 Inside · Vesna's hut" : "Zalissya"}
              </p>
              <p className="font-serif text-[13px] font-bold leading-tight">
                {objective}
              </p>
              {soulLost && (
                <p className="mt-0.5 text-[11px] font-semibold text-[#f0a696]">
                  ☠ No shadow — the Chort has your soul ({price} fish buys it back)
                </p>
              )}
              {carried > cap && (
                <p className="mt-0.5 text-[11px] font-semibold text-[#f0a696]">
                  🎒 Over-full ({carried}/{cap}) — no new pickups until the load lightens
                </p>
              )}
            </div>
            <div className="pointer-events-auto mt-2 flex flex-col items-end gap-1.5">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  aria-label="Open character sheet — stats, skills and satchel"
                  onClick={() => openPanel("stats")}
                  className="rounded-lg bg-[#7a4a2b]/85 px-3 py-2 text-xs font-bold text-[#f3e9d2] shadow backdrop-blur-[2px]"
                >
                  Character
                </button>
                <button
                  type="button"
                  aria-label={`Open quest log — ${questsDone} of ${allQuests.length} quests done`}
                  onClick={() => openPanel("quests")}
                  className="rounded-lg bg-[#7a4a2b]/85 px-3 py-2 text-xs font-bold text-[#f3e9d2] shadow backdrop-blur-[2px]"
                >
                  Quests
                </button>
              </div>
              {confirmReset ? (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    aria-label="Confirm new game"
                    onClick={onReset}
                    className="rounded-lg bg-[#a83c32] px-3 py-2 text-xs font-bold text-white shadow"
                  >
                    Start over
                  </button>
                  <button
                    type="button"
                    aria-label="Cancel new game"
                    onClick={() => setConfirmReset(false)}
                    className="rounded-lg bg-[#1c1409]/70 px-3 py-2 text-xs font-bold text-[#f3e9d2] shadow"
                  >
                    Keep playing
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  aria-label="Start a new game"
                  onClick={() => setConfirmReset(true)}
                  className="rounded-lg bg-[#1c1409]/55 px-3 py-2 text-xs font-semibold text-[#f3e9d2] backdrop-blur-[2px]"
                >
                  New game
                </button>
              )}
            </div>
          </div>

          {/* Hold-to-move pad — cross / D-pad layout.
              Press and hold a direction to walk. Diagonals work two
              ways: hold two adjacent arrows at once (each button
              captures its own pointer, so multi-touch works), or hold
              a corner cell — the spots between the arrows are real
              buttons that hold both neighbouring directions, so a
              thumb landing between arrows walks diagonally instead of
              hitting dead space. No dragging anywhere: a downward drag
              is what the phone's pull-to-refresh steals. */}
          {!dialogue && !panelOpen && (
            <div
              className="absolute bottom-5 left-4 z-10"
              style={{ touchAction: "none" }}
              role="group"
              aria-label="Movement controls"
            >
              {/* Plus-shaped backdrop so the cross reads as one control */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="absolute h-full w-[62px] rounded-full bg-[#1c1409]/35" />
                <div className="absolute h-[62px] w-full rounded-full bg-[#1c1409]/35" />
              </div>
              <div className="relative grid grid-cols-3 grid-rows-3 gap-1">
                <PadButton dirs={["up", "left"]} label="Walk up and left" rotate={-45} corner pressed={padPressed.has("up") && padPressed.has("left")} onDown={padDown} onUp={padUp} />
                <PadButton dirs={["up"]} label="Walk up" rotate={0} pressed={padPressed.has("up")} onDown={padDown} onUp={padUp} />
                <PadButton dirs={["up", "right"]} label="Walk up and right" rotate={45} corner pressed={padPressed.has("up") && padPressed.has("right")} onDown={padDown} onUp={padUp} />
                <PadButton dirs={["left"]} label="Walk left" rotate={-90} pressed={padPressed.has("left")} onDown={padDown} onUp={padUp} />
                <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center">
                  <span className={`h-3 w-3 rounded-full border transition-colors ${padPressed.size > 0 ? "border-[#f3e9d2]/80 bg-[#d99a2b]/70" : "border-[#f3e9d2]/30 bg-[#1c1409]/40"}`} />
                </span>
                <PadButton dirs={["right"]} label="Walk right" rotate={90} pressed={padPressed.has("right")} onDown={padDown} onUp={padUp} />
                <PadButton dirs={["down", "left"]} label="Walk down and left" rotate={-135} corner pressed={padPressed.has("down") && padPressed.has("left")} onDown={padDown} onUp={padUp} />
                <PadButton dirs={["down"]} label="Walk down" rotate={180} pressed={padPressed.has("down")} onDown={padDown} onUp={padUp} />
                <PadButton dirs={["down", "right"]} label="Walk down and right" rotate={135} corner pressed={padPressed.has("down") && padPressed.has("right")} onDown={padDown} onUp={padUp} />
              </div>
              {padPressed.size === 2 && (
                <p className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tracking-wide text-[#f3e9d2] [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
                  Diagonal
                </p>
              )}
            </div>
          )}

          {/* Toast — catches, keepsakes, and consequences */}
          {toast && (
            <div className="pointer-events-none absolute inset-x-0 top-24 z-20 flex justify-center px-4">
              <p className="max-w-md rounded-xl bg-[#1c1409]/82 px-4 py-2.5 text-center font-serif text-sm font-semibold text-[#f3e9d2] shadow-xl backdrop-blur-[2px]">
                {toast}
              </p>
            </div>
          )}

          {/* Interact button */}
          {!dialogue && !panelOpen && prompt && (
            <button
              type="button"
              aria-label={promptAria}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => interactRef.current()}
              className={`absolute bottom-8 right-5 z-10 rounded-full px-6 py-4 font-serif text-base font-bold shadow-xl ${
                prompt.kind === "reel"
                  ? "animate-pulse bg-[#c23b2a] text-[#f3e9d2] active:bg-[#962c1f]"
                  : "bg-[#d99a2b] text-[#33241a] active:bg-[#b57e1f]"
              }`}
            >
              {promptLabel}
            </button>
          )}
          {!dialogue && !panelOpen && !prompt && (
            <p className="pointer-events-none absolute bottom-6 right-5 z-10 max-w-[38%] text-right text-[11px] leading-snug text-[#f3e9d2]/85 [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
              Hold a direction to walk · WASD works too
            </p>
          )}

          {/* Dialogue */}
          {dialogue && (
            <div className="absolute inset-x-0 bottom-0 z-20 p-3 pb-safe">
              <div className="mx-auto max-w-xl rounded-2xl border border-[#d9c491]/60 bg-[#f3e9d2] p-4 shadow-2xl">
                <p className="font-serif text-sm font-bold text-[#7a4a2b]">
                  {dialogue.npc.name}{" "}
                  <span className="font-normal italic text-[#a3805a]">({dialogue.npc.pron})</span>{" "}
                  <span className="font-normal text-[#a3805a]">· {dialogue.npc.role}</span>
                </p>
                {dialogue.view === "topic" && dialogue.topic && (
                  <p className="mt-1 text-[13px] italic text-[#a3805a]">
                    You ask — “{dialogue.topic.question}”
                  </p>
                )}
                <p className="mt-1.5 min-h-12 text-[15px] leading-relaxed text-[#33241a]">
                  {dialogue.view === "topic" && dialogue.topic
                    ? dialogue.topic.lines[dialogue.topicLine ?? 0]
                    : dialogue.view === "menu"
                      ? "Ask what you will."
                      : dialogue.lines[dialogue.line]}
                </p>
                {dialogue.view === "menu" && dialogue.topics ? (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {dialogue.topics.map((t) => {
                      const asked = dialogue.asked?.includes(t.id) ?? false;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          aria-label={`Ask ${dialogue.npc.name} about ${t.label}`}
                          onClick={() => selectTopic(t)}
                          className={`rounded-lg px-3.5 py-2 text-left font-serif text-sm font-bold ${
                            asked
                              ? "bg-[#e9dcbc] text-[#8a7350]"
                              : "bg-[#e2d3ae] text-[#5d4630] active:bg-[#d3c096]"
                          }`}
                        >
                          {asked ? "✓ " : ""}{t.label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      aria-label="End conversation"
                      onClick={endDialogue}
                      className="mt-1 rounded-lg bg-[#7a4a2b] px-3.5 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d3a1f]"
                    >
                      Farewell
                    </button>
                  </div>
                ) : dialogue.view === "topic" && dialogue.topic ? (
                  dialogue.topic.action === "bargain" && (dialogue.topicLine ?? 0) >= dialogue.topic.lines.length - 1 ? (
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] italic text-[#a3805a]">He is holding out a pen…</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          aria-label="Sign the Chort's bargain"
                          onClick={() => chortChoice(true)}
                          className="rounded-lg bg-[#7e2430] px-4 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d1a23]"
                        >
                          Sign it ✒
                        </button>
                        <button
                          type="button"
                          aria-label="Refuse the Chort's bargain"
                          onClick={() => chortChoice(false)}
                          className="rounded-lg bg-[#7a4a2b] px-4 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d3a1f]"
                        >
                          Keep my soul
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-[#a3805a]">
                        {(dialogue.topicLine ?? 0) + 1} / {dialogue.topic.lines.length}
                      </span>
                      <button
                        type="button"
                        aria-label={(dialogue.topicLine ?? 0) + 1 < dialogue.topic.lines.length ? "Next line" : "Back to questions"}
                        onClick={() => interactRef.current()}
                        className="rounded-lg bg-[#7a4a2b] px-4 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d3a1f]"
                      >
                        {(dialogue.topicLine ?? 0) + 1 < dialogue.topic.lines.length ? "Next" : "Back to questions"}
                      </button>
                    </div>
                  )
                ) : dialogue.choiceAt != null && dialogue.line === dialogue.choiceAt ? (
                  dialogue.choiceKind === "brew" ? (
                    <div className="mt-2">
                      <span className="text-[11px] italic text-[#a3805a]">The cauldron bubbles, waiting…</span>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          aria-label="Brew a tonic — two herbs"
                          onClick={() => brewChoice("base")}
                          className="rounded-lg bg-[#4c6b35] px-3.5 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#3a5427]"
                        >
                          Tonic · 2 herbs ⚗
                        </button>
                        <button
                          type="button"
                          aria-label="Brew Vesna's strong tonic — three herbs"
                          onClick={() => brewChoice("strong")}
                          className="rounded-lg bg-[#5a3a6e] px-3.5 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#462d56]"
                        >
                          Strong tonic · 3 herbs ✦
                        </button>
                        <button
                          type="button"
                          aria-label="Step away from the bench"
                          onClick={() => brewChoice(null)}
                          className="rounded-lg bg-[#e2d3ae] px-3.5 py-2 font-serif text-sm font-bold text-[#5d4630] active:bg-[#d3c096]"
                        >
                          Not now
                        </button>
                      </div>
                    </div>
                  ) : (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] italic text-[#a3805a]">He is holding out a pen…</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        aria-label="Sign the Chort's bargain"
                        onClick={() => chortChoice(true)}
                        className="rounded-lg bg-[#7e2430] px-4 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d1a23]"
                      >
                        Sign it ✒
                      </button>
                      <button
                        type="button"
                        aria-label="Refuse the Chort's bargain"
                        onClick={() => chortChoice(false)}
                        className="rounded-lg bg-[#7a4a2b] px-4 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d3a1f]"
                      >
                        Keep my soul
                      </button>
                    </div>
                  </div>
                  )
                ) : (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-[#a3805a]">
                      {dialogue.line + 1} / {dialogue.lines.length}
                    </span>
                    <button
                      type="button"
                      aria-label={
                        dialogue.line + 1 < dialogue.lines.length
                          ? "Next line"
                          : dialogue.topics
                            ? "See questions"
                            : "End conversation"
                      }
                      onClick={() => interactRef.current()}
                      className="rounded-lg bg-[#7a4a2b] px-4 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d3a1f]"
                    >
                      {dialogue.line + 1 < dialogue.lines.length
                        ? "Next"
                        : dialogue.topics
                          ? "Ask a question…"
                          : "Farewell"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Character sheet — stats, skills, satchel, and the quest
              log (third tab, also opened directly by the Quests button).
              Stats start at 1
              and grow only by doing (KCD-style): each stat's base is its
              skill's level, keepsakes and tonics add the bonuses, and the
              totals change how the world plays. Tabbed so the whole sheet
              fits a phone screen; the scroll container is a fallback for
              very small screens (data-scroll-ok exempts it from the
              page-wide touch lock). */}
          {panelOpen && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#16281a]/60 p-4">
              <div
                data-scroll-ok
                className="max-h-[88dvh] w-full max-w-sm overflow-y-auto rounded-2xl border border-[#d9c491]/60 bg-[#f3e9d2] p-4 shadow-2xl"
                style={{ touchAction: "pan-y" }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-lg font-bold text-[#33241a]">{panelTab === "quests" ? "Quests" : "Character"}</h2>
                  <button
                    type="button"
                    aria-label={panelTab === "quests" ? "Close quest log" : "Close character sheet"}
                    onClick={closePanel}
                    className="rounded-lg bg-[#7a4a2b] px-3 py-1.5 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d3a1f]"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-2.5 flex gap-1.5" role="tablist" aria-label="Character sheet sections">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={panelTab === "stats"}
                    aria-label="Show stats"
                    onClick={() => setPanelTab("stats")}
                    className={`rounded-lg px-3.5 py-1.5 font-serif text-sm font-bold ${panelTab === "stats" ? "bg-[#7a4a2b] text-[#f3e9d2]" : "bg-[#e2d3ae] text-[#5d4630]"}`}
                  >
                    Stats
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={panelTab === "skills"}
                    aria-label="Show skills"
                    onClick={() => setPanelTab("skills")}
                    className={`rounded-lg px-3.5 py-1.5 font-serif text-sm font-bold ${panelTab === "skills" ? "bg-[#7a4a2b] text-[#f3e9d2]" : "bg-[#e2d3ae] text-[#5d4630]"}`}
                  >
                    Skills
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={panelTab === "quests"}
                    aria-label="Show quests"
                    onClick={() => setPanelTab("quests")}
                    className={`rounded-lg px-3.5 py-1.5 font-serif text-sm font-bold ${panelTab === "quests" ? "bg-[#7a4a2b] text-[#f3e9d2]" : "bg-[#e2d3ae] text-[#5d4630]"}`}
                  >
                    Quests
                  </button>
                </div>

                {panelTab === "quests" ? (
                  <div className="mt-3">
                    <p className="text-[12px] italic leading-snug text-[#7a6248]">
                      {questsDone} of {allQuests.length} done. The step marked <span className="font-bold not-italic text-[#7a4a2b]">Now</span> is
                      where the story stands — the rest wait their turn, and nothing is lost by wandering.
                    </p>
                    {questSections.map((section) => (
                      <div key={section.title} className="mt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a3805a]">{section.title}</p>
                        {section.quests.map((q) => {
                          const st = questStatus(q);
                          return (
                            <div key={q.id} className="flex items-start gap-2 border-b border-[#d9c491]/50 py-2 last:border-0">
                              <span
                                aria-hidden="true"
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                                  st === "done"
                                    ? "bg-[#7a9a3c] text-[#f3e9d2]"
                                    : st === "active"
                                      ? "bg-[#d99a2b] text-[#33241a]"
                                      : "bg-[#e2d3ae] text-[#a3805a]"
                                }`}
                              >
                                {st === "done" ? "✓" : st === "active" ? "▶" : "○"}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className={`text-sm font-bold ${st === "todo" ? "text-[#8a7350]" : "text-[#33241a]"}`}>
                                  {q.title}
                                  {st === "active" && (
                                    <span className="ml-2 rounded-full bg-[#d99a2b] px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-[#33241a]">Now</span>
                                  )}
                                  {st === "done" && (
                                    <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-wide text-[#7a9a3c]">Done</span>
                                  )}
                                </p>
                                <p className="mt-0.5 text-[12px] leading-snug text-[#7a6248]">{q.detail}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ) : panelTab === "stats" ? (
                  <div className="mt-3">
                    {STAT_DEFS.map((d) => {
                      const s = stats[d.key];
                      return (
                        <div key={d.key} className="flex items-baseline justify-between gap-2 border-b border-[#d9c491]/50 py-1.5 last:border-0">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#33241a]">
                              {d.abbr} · {d.name}{" "}
                              <span className="font-normal text-[#a3805a]">from {d.feeds}</span>
                            </p>
                            <p className="text-[11px] leading-snug text-[#7a6248]">
                              {d.effect}
                              {s.bonusWhy.length > 0 ? ` · ${s.bonusWhy.join(", ")}` : ""}
                            </p>
                          </div>
                          <p className="shrink-0 font-serif text-xl font-bold text-[#7a4a2b]">
                            {s.total}
                            {s.bonus !== 0 && (
                              <span className="ml-1 align-middle text-[11px] font-semibold text-[#a3805a]">
                                ({s.base}{s.bonus > 0 ? `+${s.bonus}` : s.bonus})
                              </span>
                            )}
                          </p>
                        </div>
                      );
                    })}
                    <p className="mt-2 text-[11px] italic leading-snug text-[#7a6248]">
                      No points to spend and no dump stats — in Zalissya you become what you do.
                      The Chort currently prices your soul at {price} fish.
                    </p>
                  </div>
                ) : (
                  <div className="mt-3">
                    {skillRows.map((r) => (
                      <div key={r.name} className="border-b border-[#d9c491]/50 py-1.5 last:border-0">
                        <div className="flex items-baseline justify-between">
                          <p className="text-sm font-bold text-[#33241a]">
                            {r.name} <span className="font-normal text-[#a3805a]">feeds {r.stat}</span>
                          </p>
                          <p className="font-serif text-base font-bold text-[#7a4a2b]">Lv {r.level}</p>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#e2d3ae]" aria-hidden="true">
                          <div
                            className="h-full rounded-full bg-[#7a9a3c]"
                            style={{ width: `${r.next != null ? Math.min(100, (r.done / r.next) * 100) : 100}%` }}
                          />
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#7a6248]">
                          {r.next != null ? `${r.done} done · ${r.next} for Lv ${r.level + 1}` : `${r.done} done · master`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {panelTab !== "quests" && (
                <div className="mt-3 rounded-xl bg-[#e9dcbc] p-3">
                  <p className="font-serif text-sm font-bold text-[#33241a]">Satchel</p>
                  <p className="mt-0.5 text-[12px] leading-snug text-[#5d4630]">
                    🌿 {herbStock} herbs · 🎣 {fish} fish
                    {lysaFlowers > 0 ? ` · 🌙 ${lysaFlowers} nichnyky` : ""}
                    {meals > 0 ? ` · 🍲 ${meals} soup` : ""}
                    {potions > 0 ? ` · ⚗ ${potions} tonic${potions > 1 ? "s" : ""}` : ""}
                    {strongPotions > 0 ? ` · ⚗✦ ${strongPotions} strong tonic${strongPotions > 1 ? "s" : ""}` : ""}
                    {forged > 0 ? ` · 🔨 ${forged} forged` : ""}
                  </p>
                  <p className={`mt-0.5 text-[12px] leading-snug ${carried > cap ? "font-semibold text-[#a83226]" : "text-[#5d4630]"}`}>
                    🎒 Carrying {carried} / {cap} — your STR {stats.str.total} sets the limit.
                    Weights: fish 1 · herb 1 · forged piece 2 · bog iron 3 · nichnyky 0.
                    {haulingIron ? ` You are hauling ${iron} lump${iron > 1 ? "s" : ""} of bog iron for Radek.` : ""}
                    {carried > cap ? " Over the limit: nothing new can be picked up until the load lightens — nothing you hold is lost." : ""}
                  </p>
                  {keepsakes.length > 0 && (
                    <p className="mt-0.5 text-[12px] leading-snug text-[#5d4630]">{keepsakes.join(" · ")}</p>
                  )}
                  {(flagHas(hudFlags, "wellfed") || flagHas(hudFlags, "tonic") || flagHas(hudFlags, "strongtonic")) && (
                    <p className="mt-0.5 text-[12px] font-semibold text-[#7a4a2b]">
                      Active: {[
                        flagHas(hudFlags, "wellfed") ? "Well fed (CON +1)" : null,
                        flagHas(hudFlags, "tonic") ? "Tonic clarity (INT +1, WIS +1)" : null,
                        flagHas(hudFlags, "strongtonic") ? "Strong tonic (INT +2, WIS +2)" : null,
                      ].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      aria-label="Eat a meal of karas soup"
                      disabled={meals < 1}
                      onClick={eatMeal}
                      className="rounded-lg bg-[#7a4a2b] px-3 py-2 font-serif text-sm font-bold text-[#f3e9d2] disabled:opacity-40"
                    >
                      Eat soup 🍲
                    </button>
                    <button
                      type="button"
                      aria-label="Drink an alchemy tonic"
                      disabled={potions < 1}
                      onClick={drinkTonic}
                      className="rounded-lg bg-[#4c6b35] px-3 py-2 font-serif text-sm font-bold text-[#f3e9d2] disabled:opacity-40"
                    >
                      Drink tonic ⚗
                    </button>
                    <button
                      type="button"
                      aria-label="Drink Vesna's strong tonic"
                      disabled={strongPotions < 1}
                      onClick={drinkStrongTonic}
                      className="rounded-lg bg-[#5a3a6e] px-3 py-2 font-serif text-sm font-bold text-[#f3e9d2] disabled:opacity-40"
                    >
                      Drink strong tonic ✦
                    </button>
                  </div>
                </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
