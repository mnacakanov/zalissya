import { UNIT_WEIGHT } from "./carry";
import { flagCount, flagHas } from "./flags";
import { PURSE } from "./trade";

// --- The satchel as a list ---------------------------------------------------
// The Character sheet's Satchel tab is an embroidered list (owner pick, out of
// four mockups): rows in four groups, each with what it is, what it weighs and,
// for food and tonics, a button. This module only decides WHICH rows exist and
// what each is worth; names live in the locales and the drawing in App.tsx.
// Rows with none in hand are left out, so the list never gives away a thing
// the kobzar has not met yet (a strong tonic, say).

export type SatchelGroupId = "food" | "gather" | "iron" | "purse";
export type SatchelItemId = "meals" | "potions" | "strongPotions" | "fish" | "herbStock" | "lysaFlower" | "iron" | "forged" | typeof PURSE;
export type SatchelAction = "eat" | "tonic" | "strong";

export type SatchelRow = {
  id: SatchelItemId;
  count: number;
  unit: number; // weight of one
  weight: number; // weight of all of them
  action?: SatchelAction;
};
export type SatchelGroup = { id: SatchelGroupId; rows: SatchelRow[] };

const LAYOUT: Array<{ group: SatchelGroupId; id: SatchelItemId; unit: number; action?: SatchelAction }> = [
  { group: "food", id: "meals", unit: 0, action: "eat" },
  { group: "food", id: "potions", unit: 0, action: "tonic" },
  { group: "food", id: "strongPotions", unit: 0, action: "strong" },
  { group: "gather", id: "fish", unit: UNIT_WEIGHT.fish },
  { group: "gather", id: "herbStock", unit: UNIT_WEIGHT.herbStock },
  { group: "gather", id: "lysaFlower", unit: 0 },
  { group: "iron", id: "iron", unit: UNIT_WEIGHT.iron },
  { group: "iron", id: "forged", unit: UNIT_WEIGHT.forged },
  { group: "purse", id: PURSE, unit: 0 },
];

export function satchelGroups(flags: ReadonlySet<string>): SatchelGroup[] {
  const out: SatchelGroup[] = [];
  for (const l of LAYOUT) {
    // Bog iron already handed to Radek is no longer on your back
    // (carriedWeight does the same), so it leaves the list too.
    const count = l.id === "iron" && flagHas(flags, "horseshoe") ? 0 : flagCount(flags, l.id);
    if (count < 1) continue;
    let g = out.find((x) => x.id === l.group);
    if (!g) out.push((g = { id: l.group, rows: [] }));
    g.rows.push({ id: l.id, count, unit: l.unit, weight: l.unit * count, ...(l.action ? { action: l.action } : {}) });
  }
  return out;
}
