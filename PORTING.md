# Porting Zalissya (native mobile, Steam Deck)

The game is TypeScript and `<canvas>` with a thin React UI. Three routes to native, cheapest first:

| Route | Platforms | What is reused | Effort |
|---|---|---|---|
| **1. Wrap the web build** | Steam Deck and desktop: Tauri or Electron. iOS and Android: Capacitor. | Everything | Small |
| **2. Wrap, then replace the UI layer** | Same as 1 | Everything except the React HUD | Medium |
| **3. Rewrite in an engine** (Godot, Unity, Defold) | Any | Content (locales), design data, rules as a spec | Large |

**Recommendation: route 1.** `pages/dist/index.html` is already one self-contained file with no server. A wrapper loads it, so the game ships unchanged. Steam Deck runs Linux; a Tauri or Electron build is an ordinary Steam game, and Proton is not needed.

## What is already port-ready

- **Saves** go through `SaveAdapter` (`client/src/save/types.ts`). A native build adds `save/file.ts`, which writes JSON to the app's data folder, and points `api.ts` at it through a new `platform/target.native.ts`, the same way Pages swaps in `target.pages.ts`.
- **Settings** (language, control scheme) go through `platform/prefs.ts`. Swap it for the wrapper's settings store if `localStorage` is not wanted.
- **Text** lives in `client/src/content/locales/{uk,en}.json`: flat key → string tables, plain JSON. An engine rewrite can load them unchanged.
- **Input:**
  - keyboard (WASD/arrows, E/Space, Shift/L);
  - touch press-and-hold buttons;
  - the floating joystick on Pages;
  - **gamepad** via the standard mapping (`input/gamepad.ts`), which covers the Steam Deck's built-in controls.

  None of it depends on drags or the mouse.
- **Rules and systems** in `client/src/systems/` (time, the vigil, quests, stats, skills, carry, flags) are pure TypeScript with no DOM, and they have tests. They run anywhere JS runs, and they serve as an exact spec for a rewrite.
- **Resolution:** the canvas follows the window and the device pixel ratio. The HUD is laid out for phone portrait and works at the Deck's 1280×800 landscape.

## Still to do for a polished native release

1. **Pull the remaining game logic out of `App.tsx` into `systems/`.** The interaction rules (`doInteract`, fishing, brewing) are still React-component code, so route 2 means moving them first.
2. **A `target.native.ts`** with a file save adapter, plus a wrapper project: `src-tauri/`, or `capacitor.config.ts` with `ios/` and `android/`.
3. **Controller glyphs:** show Ⓐ/Ⓑ on prompts when `body[data-input="pad"]`.
4. **Settings screen:** language (the picker already exists), text size, a 30/60 fps cap.
5. **Steam:** a Steamworks app id, store art, and Steam Cloud pointed at the save file.
6. **Audio:** none yet. Add it through one small `audio/` module so a port can swap the backend.

## Rules that keep the content reusable

- No player-facing text in code: always `t("key")`. Add keys to **both** locale files; the `i18n` test enforces this.
- Game state stays plain data: the save shape plus flags. Never store React or DOM objects in it.
- New systems go in `systems/` as pure functions, with tests.
- Data such as positions, recipes and quest definitions stays declarative, so it can move to JSON later without logic changes.
