// --- Languages -------------------------------------------------------------
// Every player-facing string lives in content/locales/<lang>.json — flat
// key → text tables, plain JSON so any future port (native mobile, Steam
// Deck, another engine) can load the same files. Code refers to text only
// by key: t("ui.continue"), t("ui.caught", { fish }) with {fish} in the
// text. English is the reference table (its keys define TextKey);
// Ukrainian is the default language. Both tables must have the same keys
// and the same {placeholders} — i18n.test.ts checks.
//
// The language is chosen once, at startup (module-level content such as
// character names is resolved when modules load). Switching language
// stores the preference and reloads; see setLanguage().
//
// Naming per language: English uses the transliteration rules in
// CLAUDE.md (Zalissya, Myroslav, Viy); Ukrainian simply uses the real
// words (Залісся, Мирослав, Вій), and Radek is Радек.

import en from "../content/locales/en.json";
import uk from "../content/locales/uk.json";
import { readPref, writePref } from "../platform/prefs";

export type Lang = "uk" | "en";
export const LANGS: readonly Lang[] = ["uk", "en"];
export const DEFAULT_LANG: Lang = "uk";
export const LANG_NAMES: Record<Lang, string> = { uk: "Українська", en: "English" };

export type TextKey = keyof typeof en;
export type Params = Record<string, string | number>;

const TABLES: Record<Lang, Record<string, string>> = { en, uk };
const PREF_KEY = "zalissya-lang";

function initialLang(): Lang {
  const stored = readPref(PREF_KEY);
  return stored === "en" || stored === "uk" ? stored : DEFAULT_LANG;
}

let current: Lang = initialLang();

export function lang(): Lang {
  return current;
}

// For tests and tools; the game itself switches with setLanguage().
export function setLangForTests(l: Lang): void {
  current = l;
}

export function t(key: TextKey, params?: Params): string {
  const raw = TABLES[current][key] ?? TABLES.en[key] ?? key;
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m));
}

// Persist the choice; the caller reloads (after saving) so every module
// re-reads its text in the new language.
export function setLanguage(l: Lang): void {
  writePref(PREF_KEY, l);
}
