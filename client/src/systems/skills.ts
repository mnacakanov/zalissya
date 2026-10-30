// Herbalism thresholds: level n starts at THRESH[n-1] herbs gathered
// (any kind counts — kropyva, polyn, kalendula, zvirobij, derevij).
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