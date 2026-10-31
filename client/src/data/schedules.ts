import { HOUSE_RECTS, KORCHMA_ROOM, OTAMAN_ROOM, ROOM, toWorld } from "./houses";
import { BREW_SPOT } from "./items";
import { LYSA_WORLD } from "./lysa";
import { FIRE, GARDEN, POND } from "./village";

// --- Where the khutir's people go through the day (systems/schedules.ts) -------
// Every resident has a bed or its like, a place of work, a bench to rest on,
// a place round the fire in the evening; some bathe in the pond, and a couple
// have business on Lysa Hora on certain nights that is better not asked about.
//   Myroslav — the pil in his own khata; judges on the maidan by the chapel
//   Vesna    — the pil in her khata; works at her drying rack and herb garden
//   Radek    — a straw bed by the forge (he is a guest here, and a Pole)
//   Odarka   — the top of the korchma's pich, the warmest bed on the steppe
//   Okhrim   — the korchma's bench, which he has paid for in chalk

export type Spot = { x: number; y: number };

// benches about the khutir, to rest on by day (drawn as yard things)
export const BENCHES: Spot[] = [
  { x: 690, y: 500 }, // the maidan, west of the chapel
  { x: 1040, y: 578 }, // the maidan, east by the well
  { x: 352, y: 444 }, // before the Domovyk's khata
  { x: 214, y: 596 }, // by the forge
  { x: 1240, y: 934 }, // the pond's north shore
  { x: 1906, y: 1240 }, // before the korchma
];

// Radek's straw bed, beside the forge
export const STRAW_BED: Spot = { x: 436, y: 548 };

const fireAt = (dx: number, dy: number): Spot => ({ x: FIRE.x + FIRE.w / 2 + dx, y: FIRE.y + FIRE.h / 2 + dy });
const inPond = (dx: number, dy: number): Spot => ({ x: POND.x + dx, y: POND.y + dy });
const bench = (i: number): Spot => BENCHES[i] ?? { x: 840, y: 700 };

export const PLACES = {
  myroslav: {
    bed: toWorld("otaman", { x: OTAMAN_ROOM.pil.x + 30, y: OTAMAN_ROOM.pil.y + 30 }),
    porch: { x: HOUSE_RECTS.otaman.x + HOUSE_RECTS.otaman.w / 2 + 40, y: HOUSE_RECTS.otaman.y + HOUSE_RECTS.otaman.h + 18 },
    work: { x: 760, y: 520 },
    rest: bench(0),
    fields: { x: 600, y: 1300 },
    evening: fireAt(-52, -6),
  },
  vesna: {
    bed: toWorld("hut1", { x: ROOM.pil.x + 40, y: ROOM.pil.y + 30 }),
    garden: { x: GARDEN.x + GARDEN.w / 2, y: GARDEN.y - 18 },
    work: { x: BREW_SPOT.x + 34, y: BREW_SPOT.y + 12 },
    rest: bench(1),
    bathe: inPond(-36, -26),
    evening: fireAt(52, -6),
    lysa: { x: (LYSA_WORLD.flowers[0]?.x ?? 3080) + 20, y: (LYSA_WORLD.flowers[0]?.y ?? 500) + 14 },
  },
  radek: {
    bed: STRAW_BED,
    work: { x: 372, y: 596 },
    rest: bench(3),
    bathe: inPond(40, -14),
    evening: fireAt(88, 32), // a bit apart, east of the kobzar's log
  },
  odarka: {
    bed: toWorld("korchma", { x: KORCHMA_ROOM.pich.x + 34, y: KORCHMA_ROOM.pich.y + 26 }),
    work: toWorld("korchma", { x: 232, y: 64 }),
    rest: bench(5),
  },
  okhrim: {
    bed: toWorld("korchma", { x: KORCHMA_ROOM.benchWs.x + 48, y: KORCHMA_ROOM.benchWs.y + 6 }),
    work: toWorld("korchma", { x: 108, y: 110 }),
    rest: bench(5),
    // by the Chort on the summit, cards in hand
    lysa: { x: LYSA_WORLD.summit.x + 86, y: LYSA_WORLD.summit.y - 64 },
  },
} as const;

export type ResidentId = keyof typeof PLACES;
export const RESIDENTS = Object.keys(PLACES) as ResidentId[];
