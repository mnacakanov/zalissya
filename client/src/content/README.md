# Content: locales

`locales/en.json` and `locales/uk.json` hold **every player-facing string** in the game, as flat `key → text` tables. **Ukrainian is the default language**; English is the reference table, and its keys define the type `TextKey`.

## Editing text

- Change text freely, but keep every `{placeholder}`. The game fills them in, e.g. `"Улов: {caught}!"`.
- Each key must exist in **both** files with the same placeholders. Run `bun run test` in `pages/`; `i18n.test.ts` checks this.
- The key tells you where a string lives:
  - `line.<character>.N`: scripted lines (`dialogue/lines.ts`);
  - `topic.<character>.<topic>…`: conversation topics (`dialogue/topics.ts`);
  - `viy.…`: Viy's night (`dialogue/viyNight.ts`);
  - `quest.…`: the quest log (`systems/quests.ts`);
  - `char.…` / `item.…` / `stat.…`: names and descriptions;
  - `ui.…`: HUD, prompts, toasts and buttons (`App.tsx`).
- Prefer phrasings that need no grammatical agreement with a parameter. Ukrainian cases and plurals do not fit English templates; `"Улов: {caught}!"` works where `"Спіймано {caught}!"` would need the accusative.

## Naming

- **English** follows the transliteration rules in `CLAUDE.md`: Zalissya, Myroslav, Viy, Kropyva, Zvirobiy; skills and huts in English; Radek is Polish.
- **Ukrainian** uses the real words: Залісся, Мирослав, Вій, Кропива, Звіробій, знахарка, піч, нечисть. Radek is Радек.
- `pron` (the pronunciation hint after a name) is for English readers only and is empty in Ukrainian.

## Known gap

The player is addressed in the masculine in Ukrainian (ти підписав, ти танцював). A player-gender choice would need a small `{g:він|вона}` syntax in `t()` and gendered variants of those lines.
