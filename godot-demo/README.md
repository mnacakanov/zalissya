# Godot demo

A technical demo, not the game. It checks whether Zalissya can move its
rendering to Godot and still run from GitHub Pages, with BG2-style
graphics. Live at `https://mnacakanov.github.io/zalissya/godot-demo/`.

## Zalissya's maidan, the main scene

`maidan.tscn` / `maidan.gd`, built from `zalissya/maidan.json`, in the
chosen style (Pillars-lite). See [`zalissya/README.md`](zalissya/README.md):
the coordinates, the data file, the art it needs and how to work on it in
parallel.

## The style test (issue #2)

`styles.tscn` / `styles.gd`: one small scene, Did Prokip's walkable hut,
the kobzar, Prokip, a cow, a bench and a horod. It is built in three render
styles, switchable at runtime: the buttons at the top, keys 1–3, or LB/RB on
a gamepad.

| Style | Camera | Rendering |
|---|---|---|
| **Drova** | top-down ¾ | `NEAREST` texture filter and pixel-snapped transforms, a coarse dark ground |
| **Pillars-lite** | isometric | colour plates with normal maps (`<name>_n.png`, from `tools/normals.py`), a `DirectionalLight2D` sun by day, lamps that rake the relief at night |
| **BG2 / IWD** | isometric | painted plates, the light baked in, a tint and lamp glows at night |

**The owner's choice: Pillars-lite** (2026-10-31): the Pillars camera
angle with the art drawn in `ART_STYLE.md`'s ink and watercolour (Harry's
redrawn hut, 765e7b3), lit by the normal-mapped sun and lamps. The other two
styles stay in the demo for reference.

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
- **The art** is Harry's sets (issue #2) in `styles/<style>/`.
  `layout.json` places each piece in its own pixels from the PNG's
  bottom-centre anchor:
  - the exterior's ground corners `[left, front, right]` and `scale`;
  - the interior's own corners, so it is fitted onto the exterior by an
    affine transform (the interiors were drawn at slightly different
    angles and sizes);
  - the pich, Prokip's spot and the furniture solids;
  - `metre` (sprite px per metre, from the door), so people, the cow and
    the bench stand at real heights.
- **Drova's interior** came glued to the horod; it is cut into
  `derived_room.png` and `derived_horod.png`, with
  `hut_interior_bed.png` placed in the room.
- **The kobzar's walk** plays whatever the style's art gives:
  - `kobzar_walk.png`, 4 rows (down, up, left, right) × 6 frames, Drova's
    pixel-art way;
  - `kobzar_walk_front_0..7.png` and `kobzar_walk_back_0..7.png`, mirrored
    for the left-hand directions;
  - `kobzar_parts/front|back/` (head, torso, upper and lower arms and legs,
    near and far, kobza, optional pelvis): a cut-out rig (`_build_rig`), the
    limbs swinging from joints found by proportion, mirrored for the left.
    Only with `"rig": true` in the layout: the first parts set (Request 3)
    was judged broken by the owner, so BG2 and Pillars-lite wait for frame
    sheets;
  - with none of these, the standing `kobzar.png` bobs along.
- **Pixel art.** `"pixel": true` in a layout draws every sprite at one whole
  density (`scale`), so texels stay square.
- **Pillars-lite normals.** Run `tools/normals.py` over the Pillars-lite
  PNGs whenever they change.
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
  worker's cache name changes with each build). CI runs
  `tools/patch_sw.py` over Godot's worker so it fills a new build's cache
  past the browser's HTTP cache: Pages lets that keep a file 10 minutes,
  and without the patch a build opened soon after the previous one kept
  the old `index.pck` for good.
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
