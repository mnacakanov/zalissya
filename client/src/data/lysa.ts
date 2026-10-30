import { hash2, type Rect } from "../world/geometry";

// --- Lysa Hora layout -------------------------------------------------------
// The Bald Mountain: a bare rocky dome (no forest, no grass to speak of)
// under a crescent moon. The summit holds a ring of standing stones, a
// great sabbath bonfire, an offering stone, and Beelzebub's seat.
export const LYSA_SUMMIT = { x: 660, y: 400 };
export const LYSA_FIRE: Rect = { x: 626, y: 374, w: 68, h: 50 };
export const LYSA_OFFER_SPOT = { x: 660, y: 268 }; // the offering stone, north of the fire
export const LYSA_DANCE_SPOT = { x: 660, y: 492 }; // south of the fire, inside the ring
export const LYSA_THRONE: Rect = { x: 612, y: 148, w: 96, h: 44 };
export const LYSA_RING_R = 148; // standing-stone ring radius (x), squashed in y

export const LYSA_STONES: Array<{ x: number; y: number; h: number }> = [];
for (let i = 0; i < 11; i++) {
  const a = (i / 11) * Math.PI * 2 + 0.3;
  const sx = LYSA_SUMMIT.x + Math.cos(a) * LYSA_RING_R;
  const sy = LYSA_SUMMIT.y + Math.sin(a) * LYSA_RING_R * 0.68;
  // Leave a gap in the ring at the west (trail) and south (dance) sides.
  if (Math.abs(sx - (LYSA_SUMMIT.x - LYSA_RING_R)) < 30) continue;
  LYSA_STONES.push({ x: sx, y: sy, h: 26 + hash2(i, 733) * 16 });
}

export const LYSA_SOLID: Rect[] = [
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
export const LYSA_FLOWER_SPOTS: Array<{ x: number; y: number }> = [
  { x: 380, y: 330 }, { x: 520, y: 560 }, { x: 830, y: 580 },
  { x: 950, y: 240 }, { x: 300, y: 700 }, { x: 1080, y: 430 },
];