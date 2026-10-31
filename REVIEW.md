# REVIEW.md: the periodic review sweep

Repeatable audit of the repo. Run it periodically (suggest: every ~10 commits or before a milestone). A review chat reports findings; a dev session fixes them. Fixed items are listed in the report as fixed. **Known open issues are never crossed out** (see below).

Companion files: `tools/review_sweep.py` (mechanical checks, run first) and the past reports `review-YYYY-MM-DD.md`, which are kept in the Claude Project "zalissya" (diff against the latest to see what is new, fixed, or regressed). `client/src/i18n/keys.test.ts` and `client/src/save/limits.test.ts` now enforce two of the checks in CI.

## Known open issues (never cross these out)

These are real defects the owner has chosen to leave for now. Keep them in every report as **KNOWN / OPEN** until they are fixed, and add a line when a new feature makes one worse.

- **Unlimited gold.** The smith case in `doInteract` (`App.tsx`) forges a horseshoe checking only the keepsake flag, carry weight and a 7 s cooldown; no iron is ever consumed (`bumpCount("iron", ...)` is never called with a negative), and iron spots stay available. `systems/trade.ts` buys every `forged` at 1 chervinets, so income is about 1 coin per 7 s forever. `HOARD_COINS = 12` and `POUCH_COINS = 3` in `systems/cave.ts` are therefore about 84 s and 20 s of anvil work, and the Serpent's dowry choice has no stake. It becomes worse the moment anything is sold or bought for chervintsi. Fix options: an iron cost per horseshoe, a lower price, or a daily sales cap, before adding any gold sink.

## Known deferred (decided, not defects)

- **Model-name trailers in old history.** 24 of the 80 commits up to `55d463f` carry a model name in a `Co-Authored-By` trailer, against rule 7. History on `main` is public and is not rewritten. Check that new commits are clean (`tools/review_sweep.py`, section 7; fetch with `--depth=80` first).
- **`App.tsx` size.** About 3500 lines, with `doInteract` around 670. Only the duplicated performance block was extracted (`recordPerformance` in `systems/songs.ts`). Splitting the rest is a refactor of its own.
- **`as TextKey` casts** (about 30) remain. `keys.test.ts` now fails CI if a literal key is missing or dead, which replaces the compiler's check for literal keys; dynamic keys still need a look when added.
- **Opaque key names.** About 80 `ui.misc.N` keys and about 500 keys ending `.0` sit beside named keys. Renaming touches every file; do it per area, not in one commit.
- **Template-era names.** The `space.json` slug, root `package.json` name and `client/index.html` were renamed to `zalissya` (the Muse project was told in the same step; it is a separate copy and only picks this up when you sync it). Still open: unused root dependencies (`recharts`, `zod` outside the server) and `packageManager` (bun 1.3.10 vs 1.4.4 in CI) need the owner's word, since the Muse platform may rely on them.
- **Repeated numbers: decided (owner, 2026-10-31).** Varied on purpose: Stepan and Odarka 7 years; Taras and the empty pustka 5; Domovyk a hundred winters, Lisovyk three hundred, Zmiy two hundred; Omelko fifty years on the fairs, Sydir thirty-five, Hnat thirty, Prokip forty. Keep the numbers different when adding characters (see the fact table). Okhrim's kurin no longer names Khotyn ("in the old wars"): the game fixes no year, so do not add named battles or dates.
- **Sunflowers** stay as yard decoration (owner decision, 2026-10-31), though they are a little late for the Hetmanate era. Solokha's seeds were changed to pumpkin seeds. Do not re-report the plants.

## 0. Ground rules

- **Read first:** `CLAUDE.md`, `CHARACTERS.md`, `CONTENT_GUIDE.md`, the Project docs `world-context.md` and `bug-hunt-handoff.md`, the latest `review-*.md`, and the two sections below.
- **Verify before reporting.** Every script hit is a lead. Open the file, read the lines, and confirm. Two false positives happened on the first sweep (see section 6); a wrong finding costs the dev session real time.
- **Cite `file:line`**, quote the exact text for content findings, and say how you checked ("grep shows 0 other uses", "read lines 1383-1397").
- **Don't relitigate owner decisions** (section 5). Flag a *conflict between* decisions or between docs and code; never propose reversing one.
- **Run it all:** `cd pages && bun install && bun run typecheck && bun run test` (CI uses Bun 1.4.4). Typecheck and tests passing is the baseline, not the finding.
- Shallow clone is fine: `GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 ...`, then `git fetch --depth=80 origin main` for commit-hygiene checks.

## 1. Mechanical sweep

```bash
python3 -I tools/review_sweep.py .
```

Sections it prints: locale parity and placeholders; keys referenced-but-missing / defined-but-unused; text in code (rule 0); "khata" in English (owner rule: "huts"); same-named helpers and identical bodies; counter-rewrite sites; dead exports; leftovers (TODO, console, `any`, eslint-disable, `as TextKey`); App.tsx size; `isHutArea` branches; model names in files and commit trailers (rule 7).

Compare numbers with the last report. **New** hits, or counts that went **up**, are the findings. Unchanged known items are listed as "still open", not re-explained.

## 2. Code review (typical Claude-authored-code problems)

Look for these, in this order. The script covers the first three partly.

1. **Reimplemented shared code.** Before accepting any local helper, check whether `world/geometry.ts` (`clamp`, `hash2`), `systems/flags.ts` (all counter code), `dialogue/helpers.ts` (`L`, `topic`), `render/shapes.ts` (`darken`, `paint`, `makeInk`) or an existing module already has it. Known pattern: each new feature file copies `L()`, `topic()`, `ink()`, `paint()`, a counter bump.
2. **Copy-paste between sibling handlers** (e.g. `performAtFire` vs `performAtKorchma`; any two `perform*`/`apply*` blocks). Diff them by eye.
3. **Dead code after refactors.** The hut-maps removal left constants, `isHutArea` branches, an empty `if`/un-indented `else`. After any "X is no longer Y" commit, grep for every old name.
4. **Unsound casts.** `as TextKey` turns a typo into raw key text on screen. Check any *new* dynamic key has all variants in both locales.
5. **Docs claim vs code.** `CLAUDE.md` names helpers/files/constants: grep each exists where stated (e.g. it once named `bumpCount` as a shared helper when it was only a closure in `App.tsx`).
6. **Mutation after sync.** In `App.tsx`, flags changed *after* `syncFlags()`/`bumpCount()` leave `hudFlags` stale. Check new code that edits `flagsRef.current` directly.
7. **Save safety (rule 4).** New state uses new flags only; no renamed/removed flags without a load-time migration; flag count headroom against `SAVE_LIMITS.flags` (250: Pages `slice`s silently, Muse rejects the save); never save data committed.
8. **Frame cost** (CLAUDE.md "keep the frame cheap"): new per-frame loops of strokes/gradients; animation phase from screen position. A draw function that takes a screen x must not derive a phase from it: off screen it is hugely negative, `(… + x*k) % 1` goes negative, and a radius or alpha built from it can throw (the kabytsia did, on every frame on Lysa Hora; guarded by `render/offscreen.test.ts`). Pass the world x instead.
9. **Both targets:** `target.ts` and `target.pages.ts` export the same names; controls work by keyboard, touch and gamepad (rule 2).
10. **Tests:** new pure logic in `systems/` has a test; list logic added to `App.tsx` that should have been in `systems/`.
11. **Look at what changed:** `git log --stat <last-sweep-sha>..HEAD`. Spend the most time on the newest code; it has had the least review.

## 3. Content and story review

Read the English locale by area (`line.*`, `topic.*`, `korchma.*`, `chumak.*`, `cave.*`, `pustka.*`, `prokip.*`, `viy.*`, `trade.*`, `perelesnyk.*`, `animal.*`, `schedule.*`, `hide.*`), with `CHARACTERS.md` open. Also spot-read Ukrainian for the same lines (the language of record).

Check:
- **Numbers and ages agree** across every line that states them (fact table below). Search each number (`seven`, `forty`, `hundred`, names of years) after any new content.
- **Voice rules:** Vesna never says «синку»; «шмаркач» is Prokip's; Radek swears in Polish; Beelzebub in CAPITALS; Bolotianyk speaks in «…».
- **Tie claims** appear in `CHARACTERS.md` (a relationship stated in dialogue but missing there is a finding, e.g. Solokha calls Vesna "little sister").
- **Dangling promises:** a character promises something no code delivers (e.g. "a horseshoe with your initial").
- **Era:** Hetmanate, Cossack. Flag anachronisms (sunflower seeds, tea), real-event dates that pin the timeline (Khotyn), non-era coins (only chervinets; if added: taliar, zlotyi, hrish, shelyah). No Russian words or sources. No generic "Slavic fantasy".
- **Repetition:** the same beat or number reused (seven years, a hundred winters, forty) reads as copy-paste unless meant as an echo.
- **Season and calendar:** the world is early summer (Kupala still ahead, "no tobacco since spring"). Pokrova (October) may only be backstory.
- **Locale naming:** English uses transliteration and "huts" (never "khata"/"khaty"); skills in English.

### Fact table (update when content changes)

| Fact | Where | Source of truth |
|---|---|---|
| Odarka about 30; Stepan rode to the Sich 7 years ago, "back by Pokrova" | korchma.odarka.*, prokip.perelesnyk.1, perelesnyk.* | CHARACTERS.md |
| Taras Dovhyi gone 5 Pokrovas; pustka empty 5 years | pustka.* | CHARACTERS.md |
| Myroslav was 7 when the caravan came; "nine houses of forty"; "forty souls" now | chumak.otaman.* | CHARACTERS.md |
| Okhrim: kurin of 140, alone returned; chalk debt "three winters"; counts to 140 each evening | korchma.okhrim.*, korchma.odarka.okhrim.0, schedule.woken.okhrim | CHARACTERS.md |
| Chumaky arrive at dawn of day 2; Ostap dies at the next dawn if unresolved; caravan leaves a dawn after resolution | systems/chumaky.ts | code |
| Clock: start 08:00, dawn 06:00, dusk 20:00, night 21:00-04:00, sabbath 20:30-04:00, evening songs 18:00-23:30 | systems/time.ts, sabbath.ts, songs.ts | code |
| Years of road/work: Hnat 30, Sydir 35, Omelko 50, Prokip's sieve 40 | chumak.gnat.*, cave.*, prokip.* | n/a (check for contradictions) |
| Ages of the old ones: Domovyk 100 winters, Lisovyk 300, Zmiy 200 (also Omelko's "two hundred years he heard flattery") | line.domovyk.0, viy.lisovyk.*, cave.zmiy.*, cave.omelko.singAgain.1 | n/a |

### Browser pass (do not skip: the typecheck cannot see render errors)

Build with `cd pages && bun run build`, then drive `pages/dist/index.html` with Playwright (preinstalled in the Claude Code workspace) and fail on any `pageerror` or console error. Seed `localStorage["zalissya-save-v1"]` with `{exists:true,x,y,area,talked:[],herbs:0,flags:[...]}` to start in each place, press the Continue button, hold `d` for half a second, and take a screenshot. Cover at least: the maidan by day, the maidan at night (`"day=2","clock=1320"`), Lysa Hora in the sabbath (`area:"lysa"`, `x:3500,y:1000`, `"clock=1290"`), and an old `hut0` / `hut1` save. The first sweep missed a crash on Lysa Hora until this pass ran.

## 4. Design and economy interactions

For every new feature ask: *what does it interact with that already exists?* Examples of what this catches: a sell loop with no input cost vs a one-time risky reward; a topic that sells the item another quest needs (iron ward); a counter that can reach 0 and linger as `name=0`. Also check: can the new state soft-lock (carry weight, a one-shot flag lost), does autosave pick it up (`dirtyRef`), and does the quest log derive it.

## 5. Owner decisions: do not relitigate

Painted art, not pixel. Cossack/Hetmanate, never generic Slavic; no Viking or medieval-European kit; no firearms gameplay, XP, or classes. No Russian language or sources. Gold coin is the chervinets (weightless counter). Fighting only in Viy's vigil. Places you walk into, not new areas. Vesna is young and unmarried. Songs by title only, never lyrics. Pages pushes go straight to `main` after typecheck, tests, build and a browser smoke test. Planned ideas, not defects: NPCs of the old gods, the tavern bill quest, Gwent-style minigame, "nothing sells for chervintsi yet".

## 6. False positives seen (don't report these)

- Key regexes must allow hyphens in segments (`quest.lysa-sabbath.0`); omitting it flagged 30 live keys as unused.
- `ui.caught` "missing" is only a comment in `i18n/index.ts`.
- Ukrainian люди, просто, уже, говорить, сказала, хороший are valid Ukrainian, not Russianisms. Only ы э ё ъ are reliable markers.
- `LANG_NAMES` endonyms are the one allowed Cyrillic in code.
- DESIGN.md is a chronological record: older paragraphs (e.g. Bolotianyk "in the pond") are superseded by later ones; only flag if the *newest* statement is wrong. README/CLAUDE.md are living docs and must be current.
- Exports used only in their own file are export noise, not dead code (low priority).

## 7. Report format

Save as `review-YYYY-MM-DD.md` in the Claude Project. Header: commit sha reviewed, test/typecheck result, script counts. Then findings grouped **High / Medium / Low**, each with: one-line title, `file:line`, evidence, why it matters, suggested fix (one line). **High** = player-visible bug, save/data loss risk, or a rule violation that compounds. **Medium** = duplication, dead code, design interaction, doc/code contradiction. **Low** = style, flavour, nits. End with "Still open from last sweep" and "Fixed since last sweep". Chat summary: top items only, brief.
