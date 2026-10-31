import { carpentryLevel, craftLevel, fishLevel, herbLevel } from "./skills";
import { t } from "../i18n";

// --- Stats ------------------------------------------------------------------
// The six classic stats, all starting at 1 (KCD2-style: no dump stats, no
// points to assign — a stat grows because its skill grows). A stat's BASE
// is derived, never stored, so old saves get honest values for free:
//   STR = Smithing level + Carpentry level − 1    DEX = Fishing level     CON = Cooking level
//   INT = Alchemy level     WIS = Herbalism level   CHA = Music level
// Keepsakes, food and tonics add BONUSES on top; the TOTAL is what the
// world feels (bite window, walking pace, double finds, the Chort's price).
export type StatKey = "str" | "dex" | "con" | "int" | "wis" | "cha";
export const STAT_DEFS: Array<{ key: StatKey; abbr: string; name: string; feeds: string; effect: string }> = [
  { key: "str", abbr: t("stat.STAT_DEFS.abbr.0"), name: t("stat.STAT_DEFS.name.0"), feeds: t("stat.STAT_DEFS.feeds.0"), effect: t("stat.STAT_DEFS.effect.0") },
  { key: "dex", abbr: t("stat.STAT_DEFS.abbr.1"), name: t("stat.STAT_DEFS.name.1"), feeds: t("stat.STAT_DEFS.feeds.1"), effect: t("stat.STAT_DEFS.effect.1") },
  { key: "con", abbr: t("stat.STAT_DEFS.abbr.2"), name: t("stat.STAT_DEFS.name.2"), feeds: t("stat.STAT_DEFS.feeds.2"), effect: t("stat.STAT_DEFS.effect.2") },
  { key: "int", abbr: t("stat.STAT_DEFS.abbr.3"), name: t("stat.STAT_DEFS.name.3"), feeds: t("stat.STAT_DEFS.feeds.3"), effect: t("stat.STAT_DEFS.effect.3") },
  { key: "wis", abbr: t("stat.STAT_DEFS.abbr.4"), name: t("stat.STAT_DEFS.name.4"), feeds: t("stat.STAT_DEFS.feeds.4"), effect: t("stat.STAT_DEFS.effect.4") },
  { key: "cha", abbr: t("stat.STAT_DEFS.abbr.5"), name: t("stat.STAT_DEFS.name.5"), feeds: t("stat.STAT_DEFS.feeds.5"), effect: t("stat.STAT_DEFS.effect.5") },
];

export type StatLine = { base: number; bonus: number; total: number; bonusWhy: string[] };

export function computeStats(input: {
  herbs: number; fishTotal: number; cooked: number; smithed: number; brewed: number;
  played: number; carpentry?: number; flags: ReadonlySet<string>;
}): Record<StatKey, StatLine> {
  const base: Record<StatKey, number> = {
    str: craftLevel(input.smithed) + carpentryLevel(input.carpentry ?? 0) - 1,
    dex: fishLevel(input.fishTotal),
    con: craftLevel(input.cooked),
    int: craftLevel(input.brewed),
    wis: herbLevel(input.herbs),
    cha: craftLevel(input.played),
  };
  const bonus: Record<StatKey, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
  const why: Record<StatKey, string[]> = { str: [], dex: [], con: [], int: [], wis: [], cha: [] };
  const give = (k: StatKey, n: number, label: string) => { bonus[k] += n; why[k].push(`${label} ${n > 0 ? "+" : ""}${n}`); };
  if (input.flags.has("horseshoe")) give("str", 1, t("stat.computeStats.0"));
  if (input.flags.has("pebble")) give("dex", 1, t("stat.computeStats.1"));
  if (input.flags.has("stone")) give("con", 1, t("stat.computeStats.2"));
  if (input.flags.has("wellfed")) give("con", 1, t("stat.computeStats.3"));
  if (input.flags.has("rested")) give("con", 1, t("stat.rested"));
  // a swim in the pond: washed and fresh, better company (until dawn)
  if (input.flags.has("bathed")) give("cha", 1, t("stat.bathed"));
  if (input.flags.has("tonic")) { give("int", 1, t("stat.computeStats.4")); give("wis", 1, t("stat.computeStats.5")); }
  if (input.flags.has("strongtonic")) { give("int", 2, t("stat.computeStats.6")); give("wis", 2, t("stat.computeStats.7")); }
  if (input.flags.has("gold")) give("cha", 2, t("stat.computeStats.8"));
  if (input.flags.has("moonstone")) { give("wis", 1, t("stat.computeStats.9")); give("cha", 1, t("stat.computeStats.10")); }
  if (input.flags.has("viySealed")) { give("wis", 1, t("stat.computeStats.11")); give("cha", 1, t("stat.computeStats.12")); }
  const soulLost = input.flags.has("soulsold") && !input.flags.has("soulback");
  if (soulLost) give("wis", -1, t("stat.soulless"));
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