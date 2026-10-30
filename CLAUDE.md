# CLAUDE.md — Zalissya

Read this before you change anything. It is the shared context for every Claude session and every human collaborator.

## What this is

Zalissya is a 2D top-down pixel-art RPG set in a Ukrainian folklore village. Everything is drawn procedurally on a `<canvas>` with React around it. There are no image assets. **One client codebase** (`client/src`) ships to two targets:

| Target | Where it runs | Save layer | Movement controls |
|---|---|---|---|
| **Muse** (the original) | Muse fullstack web app (`space.json`, built by the Muse SDK) | `client/src/save/muse.ts` → server actions in `server/src/actions.ts` → Muse-hosted SQLite through drizzle | Hold-to-move D-pad, plus WASD/arrows |
| **GitHub Pages** | Static site, built by `pages/build.ts` and deployed by `.github/workflows/pages.yml` | `client/src/save/local.ts` → `localStorage` key `zalissya-save-v1` | D-pad, or a floating joystick (Pad/Stick toggle, remembered under `zalissya-controls`) |

The two builds differ in **one module**: `client/src/platform/target.ts` is the Muse version and `target.pages.ts` is the Pages version. `pages/build.ts` swaps one for the other at bundle time. Both must export the same names.

## Layout

```
client/src/
  App.tsx            the game component: state, the frame loop, interaction, HUD and sheets
  main.tsx           React root (QueryClient from platform/target)
  api.ts             THE storage boundary: `save` (the platform's SaveAdapter)
  i18n/              t(key, params), the language (Ukrainian by default), LANGS
  content/locales/   uk.json / en.json — EVERY player-facing string (see content/README.md)
  platform/          target.ts (Muse) / target.pages.ts (Pages): save adapter, QueryClient, scrim, JOYSTICK_ALLOWED; prefs.ts (per-device settings)
  save/              types.ts (SaveData, SaveAdapter, areas, limits), muse.ts, local.ts
  world/             areas.ts (sizes, spawns, trail), geometry.ts (Rect, clamp, collision, hash2)
  data/              village / lysa / huts layouts, items (herbs, spots, catch), characters (+ charPos)
  dialogue/          lines.ts (per-character scripts), topics.ts (topic menus), viyNight.ts (Viy's night storyline)
  systems/           flags, skills, stats, carry, time (day/night), viyFight (the vigil), quests (quest log) + *.test.ts
  render/            canvas drawing: village, spirits, lysa, huts, viyFight (vigil and night), shapes
  input/             PadButton (D-pad cell), Joystick (Pages only), gamepad.ts (controllers, Steam Deck)
  ui/                types.ts (Prompt, Dialogue…), LanguagePicker.tsx
server/src/          Muse server actions and drizzle schema (one save slot)
drizzle/             migrations (numbered; never edit an old one)
pages/               Pages tooling: package.json, build.ts, tsconfig + type shims for the Muse SDK
docs/index.html      the OLD hand-made Pages build. Retire it once the Actions deploy is live.
DESIGN.md            the design record: how each build changed the game
PORTING.md           the plan for native mobile / Steam Deck builds
```

## Commands

The Muse build only runs inside Muse; it needs `@hatch/space-sdk` from `/opt/hatch`. Everywhere else, work from `pages/`:

```bash
cd pages && bun install
```

```bash
bun run typecheck
```

```bash
bun run test
```

```bash
bun run build
```

```bash
bun run dev
```

- `bun run typecheck` checks all of `client/src`, including the Muse files, against shims.
- `bun run test` runs the `client/src/**/*.test.ts` files.
- `bun run build` writes `pages/dist/index.html`: one self-contained file.
- `bun run dev` rebuilds on change and serves on http://localhost:5173.

Inside Muse: `bun run typecheck` and `bun run build` from the repo root.

## How state works

- The save is `{x, y, area, talked[], herbs, flags[]}`. Nearly all game state lives in **flags**: plain names (`"bread"`, `"chalk"`, `"viySealed"`) and counters (`"fish=3"`, `"day=2"`, `"clock=1290"`). Use `flagHas`, `flagCount` and `bumpCount`. Limits: 250 flags, 80 talked.
- Stats are **derived**, never stored (`systems/stats.ts`). Quest progress is derived too (`systems/quests.ts`).
- The clock (`systems/time.ts`) lives in the counters `day=` and `clock=` (minutes after midnight). A day is about 10 real minutes. Time stops during dialogue, sheets, dancing and the vigil. `wellfed`, `tonic` and `strongtonic` end at dawn.
- Load-time migrations live in `App.tsx`'s load effect (id renames such as `vij` → `viy`, and counters that older saves lack). Add new ones there.

## Recipes

- **New quest:** add a `QuestDef` in `systems/quests.ts`, put its id in `PRIORITY`, and add a test in `quests.test.ts`.
- **New text:** add the key to `content/locales/en.json` **and** `uk.json`, then use `t("your.key")`.
- **New conversation topic:** add it in `dialogue/topics.ts`, or in a story module like `dialogue/viyNight.ts` that is appended in `App.tsx`. A topic with `grant` hands over an item through `applyGrant`.
- **New interactable:** add a `Prompt` kind (`ui/types.ts`), detect it in the frame loop's "nearest interactable" block, handle it in `doInteract`, and give it a label in `promptLabel`.
- **New area:** add it to `AreaId` (`world/areas.ts`) **and** `SAVE_AREAS` (`save/types.ts`) **and** `areaEnum` in `server/src/actions.ts`. The column is plain text, so no migration is needed.
- **Pure logic goes in `systems/`, with tests.** Keep `App.tsx` as wiring.

## Rules (do not break these)

0. **No player-facing text in code.** Every string a player can see or hear (labels, toasts, dialogue, aria-labels, canvas name tags) goes in `client/src/content/locales/` and is read with `t("key", params)`. Add each key to **both** `en.json` and `uk.json`; the i18n test fails otherwise. Ukrainian is the default language. Don't build sentences from fragments or put English grammar in code (plural "s", capitalising): write whole sentences with `{placeholders}`. Keep the game portable: `PORTING.md`.

1. **Naming.** In the **English** locale, use Ukrainian transliteration, S.T.A.L.K.E.R. 2 style (Zalissya, not Zalesye), for **villages, people, spirits/monsters, and herbs**. The Ukrainian locale uses the real words (Залісся, Мирослав, Вій), and Radek is Радек. Examples: Myroslav, Vesna, Domovyk, Lisovyk, Chort, Bolotianyk, Viy, Kropyva, Polyn, Kalendula, Zvirobiy, Dereviy, nechyst.
   - Use English for **skill names** (Herbalism, Fishing, Cooking, Smithing, Alchemy), **common buildings** ("huts", never "khaty"), and everyday items (chalk, wreath).
   - **Radek stays Polish.** He is a Polish smith visiting from afar.
   - The mapping: г→h, х→kh, ч→ch, ш→sh, щ→shch, ц→ts, ж→zh, ю→yu, я→ya, є→ye, ї→yi, и→y, й→y. The healer is a **znakharka** (one word).
2. **Controls.** Every action must work by keyboard, by touch buttons, and by gamepad (`input/gamepad.ts`: A interact, B back, LB/RB look away, Start/Back for the sheets). The Muse version gets **no drag or joystick controls**: Muse's pull-to-refresh steals downward drags. Muse uses press-and-hold buttons and the keyboard only. The joystick exists only behind `JOYSTICK_ALLOWED` (true only in `target.pages.ts`). New controls, such as the vigil's Look away and Ward, must be press or hold buttons.
3. **Never commit `app.db` or any save data.** That includes exported saves, localStorage dumps, `.db` and `.sqlite` files. `.gitignore` covers them, so don't weaken it.
4. **Keep the save backward compatible.** Old saves must keep loading. Prefer new flags over schema changes. A server schema change needs a new numbered migration in `drizzle/` plus a `_journal.json` entry. Never edit an existing migration.
5. **Fighting is folkloric and rare.** Viy's vigil (`systems/viyFight.ts`) is the game's one fight: warding, not weapons. Losing costs the night, never items or progress. Add further combat only as a deliberate, owner-approved feature.
6. Skills grow by doing, KCD-style. There is no XP pool and there are no classes. The six stats are derived from skill levels plus item bonuses, and all start at 1.
7. Don't put model names or personal data in commits, code or docs.

## Workflow

- `main` is always playable, and every push to it deploys to Pages. Never push to `main` directly. Work on a branch and open a PR.
- Branch names: `feat/<thing>`, `fix/<thing>`, `content/<thing>`, `refactor/<thing>`. Claude sessions use the `claude/...` branch they are given.
- Keep each PR small and to one topic. CI (typecheck, tests, Pages build) must be green before you merge. Squash-merge.
- Before you open a PR, smoke-test the Pages build in a browser: walk, talk, gather, save, reload. When you touch time or the vigil, try a night as well.
- Match the surrounding code style: TypeScript strict, `noUncheckedIndexedAccess`, flavour-text comments that explain *why*, and Ukrainian names with a pronunciation guide (`pron`).
- Add a paragraph to `DESIGN.md` when a change alters how the game plays.

## Game at a glance

- **Areas**:
  - `village`: Zalissya, 1680×1260
  - `lysa`: Lysa Hora, reached by the east trail
  - `hut0`: the Domovyk's hut, with the pich and the bed you sleep in
  - `hut1`: Vesna's hut
- **Characters**: Myroslav (starosta), Vesna (znakharka), Radek (smith).
  - Spirits: Domovyk, Lisovyk, Chort, Bolotianyk, and Viy, the boss, sealed by the vigil.
  - On Lysa Hora: Beelzebub, the witches Solokha and Motrya, and the dancers.
- **Systems**:
  - topic-based dialogue, 5 skills, 6 derived stats, carry weight (6 + 2×STR)
  - fishing bite minigame, cooking, smithing, two alchemy tiers
  - stat checks, keepsakes, the Chort's soul bargain, the wishing well
  - day/night with sleeping, Viy's vigil
  - data-driven quest log, autosave every 2.5 s when anything changed
- **Story spine**: meet the village → herbs → spirits → the dark ones → Lysa Hora → look upon Viy → Viy's night. Myroslav's chalk is required. Vesna's wreath and Radek's iron ward are optional. Then the vigil until cockcrow.
