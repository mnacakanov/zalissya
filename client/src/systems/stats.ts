import { craftLevel, fishLevel, herbLevel } from "./skills";

// --- Stats ------------------------------------------------------------------
// The six classic stats, all starting at 1 (KCD2-style: no dump stats, no
// points to assign — a stat grows because its skill grows). A stat's BASE
// is derived, never stored, so old saves get honest values for free:
//   STR = Smithing level    DEX = Fishing level     CON = Cooking level
//   INT = Alchemy level     WIS = Herbalism level   CHA = 1 + ⌊met/2⌋
// Keepsakes, food and tonics add BONUSES on top; the TOTAL is what the
// world feels (bite window, walking pace, double finds, the Chort's price).
export type StatKey = "str" | "dex" | "con" | "int" | "wis" | "cha";
export const STAT_DEFS: Array<{ key: StatKey; abbr: string; name: string; feeds: string; effect: string }> = [
  { key: "str", abbr: "STR", name: "Strength", feeds: "Smithing", effect: "Carry limit 6 + 2×STR · masterwork chance · pries the deepest bog iron" },
  { key: "dex", abbr: "DEX", name: "Dexterity", feeds: "Fishing", effect: "Longer window to reel in a bite · luck tilts toward better fish" },
  { key: "con", abbr: "CON", name: "Constitution", feeds: "Cooking", effect: "Brisker walking pace" },
  { key: "int", abbr: "INT", name: "Intelligence", feeds: "Alchemy", effect: "Chance to brew a double tonic · at INT 3, Vesna's strong tonic unlocks" },
  { key: "wis", abbr: "WIS", name: "Wisdom", feeds: "Herbalism", effect: "Keen eye: chance of a double herb · at WIS 2, you know Zvirobiy" },
  { key: "cha", abbr: "CHA", name: "Charisma", feeds: "Meeting people", effect: "At CHA 4+, the Chort's soul price drops to 2 fish · the well listens to a warm tongue" },
];

export type StatLine = { base: number; bonus: number; total: number; bonusWhy: string[] };

export function computeStats(input: {
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
export function soulPrice(stats: Record<StatKey, StatLine>): number {
  return stats.cha.total >= 4 ? 2 : 3;
}