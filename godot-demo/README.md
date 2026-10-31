# Godot demo

A technical demo, not the game. It checks whether Zalissya can move its
rendering to Godot and still run from GitHub Pages, with BG2-style
graphics. Live at `https://mnacakanov.github.io/zalissya/godot-demo/`.

## What it shows

- **Painted background in tiles.** For the demo the "painting" is baked
  from the current procedural khutir.
- **Overlays.** Each building is drawn again on its own and sorted at its
  front edge, so whoever walks behind it is hidden by it (BG2's wall
  polygons, done with the art itself).
- **Sprites sorted by their feet.** Trees and people: the kobzar has 8
  walk frames, idle and play; Myroslav and Vesna potter about.
- **Collision.** The game's own rectangles (`SOLID`) plus the pond's shore
  polygon.
- **Light by the hour.** A `CanvasModulate` grade, and `PointLight2D` lamps
  for the fire and the windows at night (T / Y / the Time button).
- **Input.** Keyboard, gamepad, and a floating touch stick.
- **The old save.** It reads `localStorage['zalissya-save-v1']` (same
  origin as the web game) through `JavaScriptBridge`, and starts there if
  that spot is free.
- **An app on the home screen (PWA).** Open the link in Safari or Chrome
  on a phone and choose "Add to Home Screen" (Android: "Install app").
  The game then opens full screen with one tap. The engine is cached
  after the first run, and every new export updates itself (the service
  worker's cache name changes with each build).
- **HUD.** fps (with the low of the last 2 s), the load time, the GPU, and
  the save it found.

## Build

1. Get Godot 4.7.2 and its web export templates. Only
   `web_nothreads_release.zip` is needed, in
   `~/.local/share/godot/export_templates/4.7.2.stable/`.
2. Bake the art, from `pages/`:

   ```bash
   bun build ../godot-demo/tools/bake-entry.ts --outfile /tmp/bake/bake.js --target browser --format iife
   ```

   ```bash
   NODE_PATH=$(npm root -g) node ../godot-demo/tools/bake.cjs /tmp/bake/bake.js ../godot-demo/art
   ```

3. Import and export, from `godot-demo/`:

   ```bash
   godot --headless --path . --import
   ```

   ```bash
   godot --headless --path . --export-release "Web" build/index.html
   ```

4. Replace `docs/godot-demo/` with `build/index.*`.

The web export is **single-threaded** (`variant/thread_support=false`), so
it needs none of the cross-origin isolation headers GitHub Pages cannot
send. It uses the Compatibility (WebGL 2) renderer.

## Sizes (4.7.2, this demo)

| File | Raw | Gzip |
|---|---|---|
| `index.wasm` (the engine, the same for any game) | 39.5 MB | 10.1 MB |
| `index.pck` (all the art and code, lossy WebP textures) | 0.9 MB | |
| `index.js` | 0.28 MB | |
