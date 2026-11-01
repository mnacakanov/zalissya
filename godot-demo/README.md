# Zalissya in Godot

The Godot game, on its way to replacing the 2D one (see
[`GAME_PLAN.md`](GAME_PLAN.md); the folder keeps its old name, `godot-demo/`,
because CI, the Pages path and the docs point at it). Live at `https://mnacakanov.github.io/zalissya/godot-demo/`.

## Zalissya's maidan, the main scene

`maidan.tscn` / `maidan.gd`, built from `zalissya/maidan.json`, in the
chosen style (Pillars-lite). See [`zalissya/README.md`](zalissya/README.md):
the coordinates, the data file, the art it needs and how to work on it in
parallel.

## The style

The owner chose **Pillars-lite** (2026-10-31): the Pillars of Eternity camera
angle with the art drawn in `ART_STYLE.md`'s ink and watercolour, lit by a
normal-mapped sun by day and lamps at night. The style test that compared it
with Drova and BG2 / IWD, and the older technical khutir demo, have been
removed (Kateryna, 2026-11-01); they are in the git history before this note.

- **The art** lives in `styles/pillars/`. `layout.json` places each piece in
  its own pixels from the PNG's bottom-centre anchor: the hut's ground corners
  `[left, front, right]` and `scale`, the interior's own corners (fitted onto
  the exterior), and `metre` (sprite px per metre), so people stand at real
  heights.
- **Normals.** Run `tools/normals.py` over the PNGs whenever they change.
- **Debug.** F3 shows the footprints, the walls and the solids, and a line
  with fps and where you stand in metres. With `?edit` in the address the
  developer's row is shown too ("Контури", "День / ніч", zoom), N turns day
  and night, and "Редагувати" opens the level editor.

## Icon

The PWA icon is a Cossack drawn with canvas in the new art direction
(`ART_STYLE.md`: sepia ink with hatching, watercolour washes, aged paper).
Its source is `tools/icon.html`, and this writes `icons/icon_512/180/144.png`:

```bash
NODE_PATH=$(npm root -g) node godot-demo/tools/icon.cjs kozak godot-demo/icons
```

## Build

CI does this on every push to `main` that touches `godot-demo/`
(`.github/workflows/godot.yml`), and publishes the result to
`docs/godot-demo/`. By hand:


1. Get Godot 4.7.2 and its web export templates. Only
   `web_nothreads_release.zip` is needed, in
   `~/.local/share/godot/export_templates/4.7.2.stable/`.
2. Import and export, from `godot-demo/`:

   ```bash
   godot --headless --path . --import
   ```

   ```bash
   godot --headless --path . --export-release "Web" build/index.html
   ```

3. Replace `docs/godot-demo/` with `build/index.*`.

The web export is **single-threaded** (`variant/thread_support=false`), so
it needs none of the cross-origin isolation headers GitHub Pages cannot
send. It uses the Compatibility (WebGL 2) renderer.

## Sizes (4.7.2, this demo)

| File | Raw | Gzip |
|---|---|---|
| `index.wasm` (the engine, the same for any game) | 39.5 MB | 10.1 MB |
| `index.pck` (all the art and code, lossy WebP textures) | 0.9 MB | |
| `index.js` | 0.28 MB | |

## Result (owner's test, Oct 2026)

On the owner's device: 100+ fps, a fast first load, and the second load
came entirely from the PWA cache. The spike passes: Godot's single-threaded
web export is good enough as the everyday "open with one tap and test"
build, while Godot also gives the real targets (Steam Deck, mobile native).
