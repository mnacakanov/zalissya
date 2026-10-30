# CONTINUING.md

How to carry on the work: (A) from the Claude mobile app, (B) back into your Muse app, (C) with collaborators.

> Some steps depend on the rework plan (shared client, swappable save adapter, Pages workflow). Those are marked **(after rework)**. Until then the repo is in its original state, described in `CLAUDE.md`.

---

## A. Continuing from the Claude mobile app

1. Open the Claude app → **Code** (Claude Code on the web). Start a new session on the `mnacakanov/zalissya` repository.
2. In your first message, say what you want and remind the session: *"Read CLAUDE.md first."* It holds the naming, controls and save rules.
3. The session works on its own `claude/...` branch and pushes there. It never pushes to `main`.
4. When the change is ready, ask: *"Open a PR."* Review it in the GitHub mobile app or the PR page:
   - Check the CI result **(after rework)**. It runs the typecheck plus the Pages build.
   - Merge with **Squash and merge**. Pages redeploys from `main` automatically **(after rework)**.
5. To play-test before merging, ask the session to build the Pages version and run a quick browser smoke test. Or merge and play the live Pages link. `main` should always stay playable, so revert the PR if something breaks.
6. Small rules to repeat in a prompt when relevant:
   - "No joystick or drag controls in the Muse build."
   - "Ukrainian transliteration for names, English for skills and huts, Radek stays Polish."
   - "Don't commit app.db or save data."

## B. Bringing the reworked code back into Muse

Muse runs the project from its root: `space.json`, `package.json`, `client/`, `server/`, `drizzle/`. The rework keeps those paths and the `@hatch/space-sdk` dependency unchanged so that Muse can build them as before.

1. **Pick the commit.** Use the latest `main` once its Pages deploy is green and you have played it.
2. **Get the files into the Muse space.** Use whichever route your Muse app offers:
   - If Muse can sync or import from GitHub, point it at `mnacakanov/zalissya`, branch `main`.
   - Otherwise, ask the Muse agent to replace the project files with the repo's files at that commit. Copy these: `client/`, `server/`, `drizzle/`, `package.json`, `tsconfig*.json`, `bunfig.toml`, `space.json`.
   - **Do not** copy `pages/`, `.github/` or `docs/` into Muse. They are for GitHub only and are harmless if left out.
   - **Never** overwrite or delete Muse's `app.db`. That is where your save lives.
3. **Muse must use the Muse save adapter (after rework).** The default (Muse) build in `client/build.mjs` selects `client/src/save/muse.ts`. Check that nothing sets the Pages target there.
4. **Migrations.** If the rework added files in `drizzle/` (new numbered `.sql` files plus `meta/_journal.json`), Muse applies them on deploy. Existing saves must still load (see the save rule in `CLAUDE.md`).
5. **Build and check in Muse:** `bun run typecheck` then `bun run build`. Open the app and check four things:
   - your old save loads in the right area
   - the D-pad works
   - no joystick toggle is visible
   - progress persists after a reload
6. If something breaks, roll back to the previous commit in the same way. Your `app.db` was untouched, so nothing is lost.

## C. Collaborators

1. Get collaborator access to the repo, or fork it.
2. Branch from `main`: `feat/...`, `fix/...`, `content/...`, `refactor/...`.
3. Local setup for the Pages build **(after rework)**. These run from `pages/` so they don't need the Muse SDK:

```bash
cd pages && bun install
```

```bash
bun run typecheck
```

```bash
bun run dev
```

4. Open a PR into `main`. CI must pass and one review is needed (see branch protection). Squash-merge.
5. Read `CLAUDE.md` before your first PR, especially the naming rules.

## One-time GitHub setup (repo owner, after rework)

- **Settings → Pages → Build and deployment → Source: GitHub Actions.** This replaces "deploy from branch /docs".
- **Settings → Branches → add a rule for `main`.** Turn on: require a pull request, require status checks (CI), block force pushes.
- **Settings → Collaborators**: invite people.
