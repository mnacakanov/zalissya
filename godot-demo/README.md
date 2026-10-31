# Godot demo

A technical demo, not the game. It checks whether Zalissya can move its
rendering to Godot and still run from GitHub Pages, with BG2-style
graphics. Live at `https://mnacakanov.github.io/zalissya/godot-demo/`.

## The style test (issue #2), the main scene

`styles.tscn` / `styles.gd`: one small scene, Did Prokip's walkable hut,
the kobzar, Prokip, a cow, a bench and a horod. It is built in three render
styles, switchable at runtime: the buttons at the top, keys 1–3, or LB/RB on
a gamepad.

| Style | Camera | Rendering |
|---|---|---|
| **Drova** | top-down ¾ | `NEAREST` texture filter and pixel-snapped transforms, a coarse dark ground |
| **Pillars-lite** | isometric | colour plates with normal maps (`<name>_n.png`, from `tools/normals.py`), a `DirectionalLight2D` sun by day, lamps that rake the relief at night |
| **BG2 / IWD** | isometric | painted plates, the light baked in, a tint and lamp glows at night |

- **The walkable hut.** The hut's footprint (`styles/<style>/layout.json`,
  in sprite pixels from the PNG's bottom-centre anchor, times `scale`)
  makes the walls, with a gap at the door.
  - Step inside and the exterior fades out over the interior plate, in
    place. Prokip, inside by his pich, is only seen from inside.
  - The lamps in the hut light only while you are in it.
  - The hut sorts against the kobzar at the front edge of its footprint
    under his feet: BG2's wall polygons, done in code.
- **Talking.** Talk to Prokip with E, A or the "Говорити" button.
- **Day and night.** N, Y or the button.
- **Debug.** F3 or "Контури" shows the footprint, the walls and the solids.
- **The art.** Drop it into `styles/<style>/` under the names in `FILES`
  (`hut_exterior.png`, `hut_interior.png`, `kobzar.png`, `npc_prokip.png`,
  `cow.png`, `bench.png`, `horod.png`, …).
  - Anything missing falls back to a placeholder. The BG2 and
    Pillars-lite hut borrows `art/reference/prokip-hut-iso.png`; the Drova
    hut is the baked khata from the old demo; the people use the old
    frames.
  - Run `tools/normals.py` over the Pillars-lite PNGs whenever they change.
- **The old khutir demo** is one button away ("Старе демо" / "Стилі").

## The khutir demo: what it shows

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

## Result (owner's test, Oct 2026)

On the owner's device: 100+ fps, a fast first load, and the second load
came entirely from the PWA cache. The spike passes: Godot's single-threaded
web export is good enough as the everyday "open with one tap and test"
build, while Godot also gives the real targets (Steam Deck, mobile native).
