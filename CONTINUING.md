# CONTINUING.md

How to carry on the work: (A) from the Claude mobile app, (B) back into your Muse app, (C) with collaborators. Do the one-time GitHub setup at the bottom first.

---

## A. Continuing from the Claude mobile app

1. Open the Claude app → **Code** (Claude Code on the web). Start a new session on `mnacakanov/zalissya`.
2. In your first message, say what you want and add: *"Read CLAUDE.md first."* It holds the layout, the commands, and the naming, controls and save rules.
3. The session works on its own `claude/...` branch and pushes there, never to `main`. It can run `bun run typecheck`, `bun run test` and `bun run build` in `pages/`, and it can play the build in a headless browser to check its work.
4. When the change is ready, ask: *"Open a PR."* Then, in the GitHub app or on the PR page:
   - wait for the **Pages** check (typecheck, tests, build) to go green;
   - **Squash and merge**. Pages redeploys from `main` within a minute or two;
   - if something broke, revert the PR from its page. `main` must stay playable.
5. Prompts worth repeating when relevant:
   - "No joystick or drag controls in the Muse build."
   - "Ukrainian transliteration for names, English for skills, buildings and items; Radek stays Polish."
   - "Keep old saves loading; put new state in flags."
   - "Don't commit app.db or save data."
6. If a session says it can't push (a GitHub 403), reconnect GitHub at https://claude.ai/connect-github. Make sure the Claude GitHub App is installed on the repo with write access.

## B. Bringing the reworked code back into Muse

Muse runs the project from its root: `space.json`, `package.json`, `client/`, `server/`, `drizzle/`. Those paths and the `@hatch/space-sdk` dependency are unchanged. The Muse build uses `client/src/platform/target.ts`, which means server-action saves, the safe-area scrim, and **no joystick**.

1. **Pick the commit.** Use the latest `main` that has deployed to Pages and that you have played.
2. **Get the files into the Muse space**, by whichever route your Muse app offers:
   - If Muse can import or sync from GitHub, point it at `mnacakanov/zalissya`, branch `main`.
   - Otherwise, ask the Muse agent to replace the project's files with the repo's files at that commit:

     ```text
     client/ server/ drizzle/ package.json tsconfig.base.json bunfig.toml space.json DESIGN.md
     ```

   - Copy all of `client/src`, including the new `platform/`, `save/`, `world/`, `data/`, `dialogue/`, `systems/`, `render/`, `input/` and `ui/` folders. `App.tsx` imports from them.
   - **Leave out** `pages/`, `.github/` and `docs/`. They are GitHub-only, and Muse ignores them anyway.
   - **Never** overwrite or delete Muse's `app.db`. That is where your save lives.
3. **Check, in Muse:** run `bun run typecheck`, then `bun run build`. This rework added no migrations: the clock and the vigil live in save flags. If a later change adds files in `drizzle/`, Muse applies them on deploy.
4. **Play-test in Muse:**
   - your old save loads in the right area, and the clock starts at 08:00 on day 1;
   - the D-pad works, and there is **no** Pad/Stick toggle;
   - progress persists after a reload;
   - talk to Myroslav once you have looked upon Viy: the chalk topic appears.
5. If something breaks, put the previous commit's files back the same way. `app.db` was never touched, so nothing is lost.

If you change the game **inside Muse**, bring it back to GitHub too (Muse's GitHub upload, or copy the changed files into a branch and open a PR). Otherwise the two copies drift.

## C. Collaborators

1. Get collaborator access (repo owner: Settings → Collaborators), or fork the repo.
2. Install [Bun](https://bun.sh) 1.3+. Then run these from `pages/`:

```bash
cd pages && bun install
```

```bash
bun run dev
```

```bash
bun run typecheck
```

```bash
bun run test
```

   `bun run dev` plays the game at http://localhost:5173 and rebuilds on save. Run the typecheck and the tests before every PR.

3. Branch from `main` (`feat/...`, `fix/...`, `content/...`, `refactor/...`). Open a PR into `main`. CI must pass, and branch protection asks for one review. Squash-merge.
4. Read `CLAUDE.md` before your first PR: the layout, the recipes, and especially the naming and controls rules.

## One-time GitHub setup (repo owner)

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.** This replaces "deploy from branch /docs". The first deploy runs on the next push to `main`, or start it from **Actions → Pages → Run workflow**.
2. Once the Actions-deployed site works, delete `docs/index.html` in a small PR. It is the old hand-made build.
3. **Settings → Rules → Rulesets** (or Branches → add a rule) for `main`:
   - require a pull request with 1 approval;
   - require the **Pages / build** status check;
   - block force pushes and deletions.

   If you work alone from your phone, set required approvals to 0 so you can merge your own PRs.
4. **Settings → Collaborators**: invite people.
