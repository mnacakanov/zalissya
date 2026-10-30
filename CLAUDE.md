# CLAUDE.md — Zalissya

Read this before you change anything. It is the shared context for every Claude session and every human collaborator.

## What this is

Zalissya is a 2D top-down pixel-art RPG set in a Ukrainian folklore village. Everything is drawn procedurally on a `<canvas>` with React around it. There are no image assets. It ships in two ways:

| Target | Where it runs | Save layer | Movement controls |
|---|---|---|---|
| **Muse** (the original) | Muse fullstack web app (`space.json`) | Server actions (`server/src/actions.ts`) backed by a Muse-hosted SQLite db through drizzle | Hold-to-move D-pad, plus WASD/arrows |
| **GitHub Pages** | Static site | `localStorage` key `zalissya-save-v1` | D-pad, plus an optional floating joystick ("Pad / Stick" toggle, stored in `localStorage` as `zalissya-controls`) |

## Current state of the repo (before the rework)

- `client/src/App.tsx` (~5,300 lines) is the whole game: data, dialogue, systems, canvas drawing, input, HUD, and the Character and Quests sheets.
- `client/src/api.ts` is the typed RPC client for the Muse server actions (`getSave`, `saveProgress`, `resetSave`).
- `server/src/actions.ts` and `server/src/schema.ts` hold the single save slot (`game_saves`, id 1). `drizzle/` holds its migrations.
- `docs/index.html` is the GitHub Pages build. It is **one pre-bundled, minified file** that was built inside a separate Muse space (`zalissya-shareable`), and **its source is not in this repo**. Its game code matches `App.tsx`. Its differences are a localStorage adapter in place of `api`, a stub for `SafeAreaTopScrim`, the Pad/Stick joystick toggle, a "hosting notes" panel, and a different `<title>`. Pages serves it from `main` → `/docs`, set up by hand in repo Settings; no workflow builds it.
- The Muse build depends on `@hatch/space-sdk` from `file:/opt/hatch/...`, which exists only inside Muse. `bun install`, `bun run typecheck` and `bun run build` **do not work** outside Muse until the planned split is done.

## Target architecture (the rework; proposed, follow it once approved)

- **One shared client codebase.** The two targets differ only in a swappable save adapter behind `client/src/api.ts` (and a tiny platform shim for Muse-only UI such as `SafeAreaTopScrim`).
  - `client/src/save/types.ts` defines the `SaveAdapter` interface (`load`, `save`, `reset`) and the save shape.
  - `client/src/save/muse.ts` wraps the server actions. `client/src/save/local.ts` wraps localStorage.
  - The adapter is picked at build time. Game code imports only from `./api`, never from `@hatch/space-sdk` or `localStorage` directly.
- **Modules instead of one App.tsx**:
  - `data/`: world layout, NPCs, herbs, items, constants
  - `world/`: areas, collision, transitions
  - `dialogue/`: topic scripts per character
  - `systems/`: stats, skills, carry, fishing, crafting, quests, flags
  - `render/`: canvas drawing per area and entity
  - `input/`: keyboard, D-pad, joystick
  - `ui/`: HUD, sheets, dialogue box
  - `App.tsx`: wiring only
- **Builds**: the root `package.json` and `client/build.mjs` stay Muse-compatible. The Pages build has its own tooling (for example `pages/package.json` with an alias that maps the SDK to a shim) so it installs and builds in GitHub Actions without `/opt/hatch`.
- **Deploy**: a GitHub Actions workflow builds Pages on every push to `main` and deploys it with `actions/deploy-pages`. Once that works, `docs/index.html` is retired.

## Rules (do not break these)

1. **Naming.** Use Ukrainian transliteration, S.T.A.L.K.E.R. 2 style (Zalissya, not Zalesye), for **villages, people, spirits/monsters, and herbs**. Examples: Myroslav, Vesna, Domovyk, Lisovyk, Chort, Bolotianyk, Kropyva, Polyn, Kalendula.
   - Use English for **skill names** (Herbalism, Fishing, Cooking, Smithing, Alchemy) and **common buildings**: "huts", never "khaty".
   - **Radek stays Polish.** He is a Polish smith visiting from afar.
   - The mapping (also in `DESIGN.md`): г→h, х→kh, ч→ch, ш→sh, щ→shch, ц→ts, ж→zh, ю→yu, я→ya, є→ye, ї→yi, и→y, й→y.
   - й is written **y**: Viy, Zvirobiy, Dereviy (owner decision). The healer is a **znakharka** (one word). Old saves that say `vij` are mapped to `viy` on load.
2. **Controls.** The Muse version gets **no drag or joystick controls**. Muse's pull-to-refresh steals downward drags, and page-level locks did not stop it. Muse uses the hold-to-move D-pad and the keyboard only. A joystick may exist and be tested **on the Pages version only**, behind the platform or build switch.
3. **Never commit `app.db` or any save data.** That includes exported saves, localStorage dumps and `.db` files. `.gitignore` covers `app.db`, so don't weaken it.
4. **Keep the save backward compatible.** Existing Muse saves (`x, y, area, talked, herbs, flags`, with flags as plain names plus `name=n` counters) must keep loading. Any server schema change needs a new numbered migration in `drizzle/` plus a `_journal.json` entry. Never edit an existing migration.
5. **Non-combat first** is the original design. Viy is approachable, but no combat exists yet. Add combat only as a deliberate, approved feature.
6. Skills grow by doing, KCD-style. There is no XP pool and there are no classes. The six stats are derived from skill levels plus item bonuses, and all start at 1.
7. Don't put model names or personal data in commits, code or docs.

## Workflow

- `main` is always playable and auto-deploys to Pages once the workflow exists. Never push to `main` directly. Work on a branch and open a PR.
- Branch names: `feat/<thing>`, `fix/<thing>`, `content/<thing>`, `refactor/<thing>`. Claude sessions use the `claude/...` branch they are given.
- Keep each PR small and to one topic. PR CI (once added) runs the typecheck and the Pages build, and it must be green before you merge. Squash-merge.
- Before you open a PR: run the typecheck and the Pages build locally (see `CONTINUING.md`), and smoke-test in a browser: walk, talk, gather, save, reload.
- Match the surrounding code style: TypeScript strict, `noUncheckedIndexedAccess`, flavour-text comments that explain *why*, and Ukrainian names with a pronunciation guide (`pron`).

## Game at a glance (for orientation)

- **Areas**: `village` (Zalissya, 1680×1260), `lysa` (Lysa Hora, reached by the east trail), `hut0` (the Domovyk's hut), `hut1` (Vesna's hut).
- **Characters**: Myroslav (starosta), Vesna (znakharka), Radek (smith). Spirits: Domovyk, Lisovyk, Chort, Bolotianyk, and Viy (the sleeping boss). On Lysa Hora: Beelzebub, the witches Solokha and Motrya, and the dancers.
- **Systems**: topic-based dialogue, 5 skills, 6 derived stats, carry weight (6 + 2×STR), a fishing bite minigame, cooking, smithing, two alchemy tiers, stat checks, keepsakes, the Chort's soul bargain, a wishing well, chickens, quest log, autosave every 2.5 s when dirty.
