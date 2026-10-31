// Herbalism thresholds: level n starts at THRESH[n-1] herbs gathered
// (any kind counts — kropyva, polyn, kalendula, zvirobiy, dereviy).
export const THRESH = [0, 3, 7, 12, 18, 25, 34];
export function herbLevel(herbs: number): number {
  let lvl = 1;
  for (let i = 0; i < THRESH.length; i++) {
    if (herbs >= (THRESH[i] ?? 0)) lvl = i + 1;
  }
  return lvl;
}

// Fishing thresholds: level n starts at FISH_THRESH[n-1] fish caught.
export const FISH_THRESH = [0, 2, 5, 9, 14, 20];
export function fishLevel(fish: number): number {
  let lvl = 1;
  for (let i = 0; i < FISH_THRESH.length; i++) {
    if (fish >= (FISH_THRESH[i] ?? 0)) lvl = i + 1;
  }
  return lvl;
}

// Cooking / Smithing / Alchemy share the fishing threshold shape: level n
// starts at THRESH[n-1] lifetime acts (meals cooked, pieces forged,
// tonics brewed). Skill names stay English, per the naming rule.
export const CRAFT_THRESH = [0, 2, 5, 9, 14, 20];
export function craftLevel(done: number): number {
  let lvl = 1;
  for (let i = 0; i < CRAFT_THRESH.length; i++) {
    if (done >= (CRAFT_THRESH[i] ?? 0)) lvl = i + 1;
  }
  return lvl;
}

// Carpentry: chopping, thatching and the other honest work of a khutir's
// roofs and stoves. Level n starts at CARPENTRY_THRESH[n-1] acts; it feeds
// STR beside Smithing (systems/stats.ts).
export const CARPENTRY_THRESH = [0, 5, 12, 22, 36];
export function carpentryLevel(done: number): number {
  let lvl = 1;
  for (let i = 0; i < CARPENTRY_THRESH.length; i++) {
    if (done >= (CARPENTRY_THRESH[i] ?? 0)) lvl = i + 1;
  }
  return lvl;
}
