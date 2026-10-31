# ART_STYLE.md: Zalissya's new art direction, and how to generate it

This is the single source of truth for Zalissya's **new, AI-generated art**. Our image agent is **Muse**. Any developer, on any device, should be able to produce an asset that matches the rest by following this file.

- **Goal:** a hand-drawn look in the spirit of **Baldur's Gate 2** and **Pillars of Eternity**: a fixed, high, angled RPG camera over a painted world. It is a **new direction**, built from scratch; it does **not** follow the current game's procedural drawing, its camera or its sizes.
- **First milestone: the demo scene.** Did Prokip's khatka and its forest clearing (who he is: `CHARACTERS.md`). **The hut is the first reference**: once it is right, everything else is matched to it.
- **Agents:** read §1 (the machine-readable spec) and §3 (the prompts). Build every prompt as `STYLE BLOCK + ASSET BLOCK`, attach the references in §2, and check the result against §6 before accepting it.
- **Humans:** read it once top to bottom. Add what you learn to §7.
- **Characters** must match `CHARACTERS.md` (age, look, voice). The world's rules (Ukrainian, Cossack, Gogol, no Russian elements) are in `CLAUDE.md` and `CONTENT_GUIDE.md`.

---

## 1. Spec (machine-readable)

```yaml
style:
  name: ink-and-watercolour storybook
  medium: dark sepia-brown ink linework with fine hatching and cross-hatching, over soft, slightly blotchy transparent watercolour washes, subtle paper grain on the subject
  feels_like: a 19th-century folk-tale book plate or an old field-guide illustration, seen through the camera of Baldur's Gate 2 / Pillars of Eternity
  mood: calm, aged, a little melancholic, warm but muted; Gogol's village comedy by day, folk-tale dread at night (night is added later as lighting)
  not: [pixel art, 3D render, photo, glossy digital painting, anime, chibi, cartoon flat colour, cel shading, neon or saturated colour]
setting:
  place: a Cossack khutir (farmstead settlement) and its forests, on the edge of the steppe
  era: 18th-century Left-Bank Ukraine, the Hetmanate
  source_world: Gogol, "Evenings on a Farm near Dikanka" and "Viy"
  culture: strictly Ukrainian (whitewashed clay khaty, thatch, wattle fences, embroidered linen, Cossack dress, Ukrainian folk belief)
  never: [Russian elements, onion domes, tsarist trappings, Viking, medieval Western-European castles or armour, generic fantasy]
palette:                     # hexes are targets; keep everything in this family
  ink: "#2A2218"
  foliage_deep: "#3E5A38"
  foliage_mid: "#5F7D4A"
  foliage_pale_olive: "#8E9A68"
  bark_light: "#8A7F5C"
  bark_dark: "#5E5640"
  sunlight_gold: "#E8B85C"   # the ONLY warm accent: dappled highlights, sunlit moss
  whitewash_aged: "#EFE6D2"  # never pure white
  whitewash_damp: grey-green and blue-grey washes over cream
  thatch_light: "#B39A62"
  thatch_dark: "#7D6A40"
  thatch_weathered: grey-gold and grey-brown straw; darker in the deep layers, greyer on the shaded side
  moss_on_thatch: only scattered patches, at most about one fifth of a roof, mainly on the shaded slope, the lower eaves and by the ridge; a thatched roof reads as STRAW, never as a green roof
  timber_weathered: grey-olive to brown
  cossack_red_muted: "#A8362C"
  sharovary_blue_muted: "#2E4A7E"
  rule: desaturated and earthy; bright colour only where people put it (embroidery, rushnyky, painted chests, flowers, icons), and even that like old dyed cloth
light:
  source: one soft sun from the upper left of the image
  lit_side: golden dapples, warmer
  shaded_side: lower right, cooler and deeper, denser hatching
  time_of_day: none baked in (night and dusk are added as lighting later)
  cast_shadow: none painted on the ground (shadows are added in the scene)
camera:                      # the Baldur's Gate 2 / Pillars of Eternity camera
  type: classic isometric RPG view, fixed for every asset
  pitch: looking down at about 40 degrees from horizontal
  yaw: turned 45 degrees, so buildings and furniture show a CORNER toward the viewer
  visible: the top (roof, table tops, ground) AND two vertical faces, one facing lower left and one facing lower right
  projection: orthographic; parallel edges stay parallel, no vanishing points, no foreshortening of far parts
  verticals: stay exactly vertical
  orientation_rule: for every building, the DOOR wall is the LEFT face (facing lower left); the right face is the side (end) wall
output:
  background: fully transparent PNG with alpha
  background_fallback: flat pure "#00FF00" (chroma green), to be keyed out
  background_never: white (it can't be separated from whitewash), any scenery, any ground beyond the object's own footing
  subject: exactly one, nothing cropped, small margin all round
  forbidden: [text, lettering, watermark, signature, border, frame, oval shadow]
  canvas: 2048x2048 for buildings, 1024x1024 for trees and props, 2048x1024 for character sheets
scale:                       # real-world sizes; keep them consistent across assets
  adult_man: 1.75 m tall; a door is a little taller than him (about 1.9 m)
  prokip_khatka: about 7 m long (door wall) by 5 m deep; walls about 2.2 m high; steep hipped thatch adds about 3 m
  oak_old: crown about 14 m across, about 16 m tall
  birch: about 14 m tall, crown about 6 m across
  spruce: about 20 m tall, about 6 m across at the base
```

---

## 2. Reference images (attach to every Muse request)

| File | Approved for | Notes |
|---|---|---|
| `art/reference/prokip-hut-iso.png` | **APPROVED: the scene's reference for camera, scale, orientation, buildings and colour.** Attach to every request, together with the oak. | Isometric camera, corner toward the viewer, door wall on the left with the door centred, end-wall window, horse skull, transparent. Thatch reads as weathered straw (warm gold in the sun, grey-brown in shade) with only a few moss patches: the model for every thatched roof. |
| `art/accepted/trees/oak.png` | **ACCEPTED game asset: the oak** (owner decision), with transparent background and cleared crown holes. | Drawn side-on, an exception: the owner prefers it to Muse's isometric redraw. Use it for style and scale only; new trees (birch, spruce) use the isometric camera like the hut. |
| `art/accepted/trees/birch.png` | **ACCEPTED for now: the birch** (owner decision), transparent, gaps cleared. | Side-on like the oak, not the isometric camera (Muse struggles with the angle). A placeholder until an isometric birch works out. |
| `art/accepted/trees/spruce.png` | **ACCEPTED for now: the spruce** (owner decision), transparent, gaps cleared. | Side-on like the oak and birch; a placeholder until an isometric spruce works out. |
| `art/accepted/trees/oak-2.png`, `oak-3.png`, `birch-2.png`, `birch-3.png`, `spruce-2.png`, `spruce-3.png` | **ACCEPTED variants** for variety: a younger upright oak, an old twisted hollow oak, a tall straight birch, a leaning weeping birch, a tall slim spruce, an old crooked spruce heavy with cones. | Side-on like the others; gaps and stray specks cleared. |
| `art/reference/oak.webp` | **Style, colour, mood: the master reference.** Attach to every request. | Approved for the look only. Its view is side-on and it has a background and an oval shadow; the game version must follow §1 (camera, transparent). |
| `art/reference/prokip-hut-v2.png` | **Building materials and details**: thatch, moss, damp whitewash, timber, herbs, raven, ink. Attach to building requests. | **Wrong camera** (front-on, near eye level): never use it for the view. Also a white background and a horned skull (must be a horse skull). |
| `art/reference/prokip-hut.webp` | Earlier draft of the same; same materials. | Same problems as v2, plus an off-centre door. |

`prokip-hut-iso.png` is **the** reference for camera, scale and every building; every new asset is checked against it side by side.

---

## 3. Prompts

Every prompt is the **style block** (identical every time) followed by **one asset block**. Attach the references from §2. Paste §3.4 into Muse's negative prompt, or append it as "Avoid: …".

### 3.1 Style block (copy exactly)

```
Hand-drawn game art for a classic isometric RPG in the spirit of Baldur's Gate 2 and Pillars of Eternity, drawn in a vintage storybook ink-and-watercolour style matching the attached reference oak: confident dark sepia-brown ink linework (near #2A2218) with fine hatching and cross-hatching in the shadows, over soft, slightly blotchy transparent watercolour washes, with a subtle paper-grain texture on the subject. Calm, aged, a little melancholic, warm but muted, like a 19th-century folk-tale book plate.
Colour: desaturated and earthy. Sage and moss greens (#3E5A38, #5F7D4A, #8E9A68), olive-taupe wood and bark (#8A7F5C to #5E5640). Sunlight is the only warm accent: dappled honey-gold highlights (#E8B85C). Whitewash is an aged cream (#EFE6D2), never pure white; thatch is dusty straw (#B39A62 to #7D6A40); reds (#A8362C) and blues (#2E4A7E) muted like old dyed cloth. Nothing saturated or neon.
Camera: the fixed isometric camera of Baldur's Gate 2 and Pillars of Eternity: looking down at about 40 degrees and turned 45 degrees, so the object shows a corner toward the viewer, its top, and two sides (one facing lower left, one facing lower right). Orthographic: parallel edges stay parallel, verticals stay vertical, no vanishing points.
Light: one soft sun from the upper left; golden dapples on the lit surfaces, the lower-right faces cooler and darker with denser hatching. No time-of-day tint.
Setting: a Cossack khutir in 18th-century Left-Bank Ukraine (the Hetmanate), the world of Gogol's "Evenings on a Farm near Dikanka" and "Viy". Strictly Ukrainian material culture.
Output: exactly one isolated subject, nothing cropped, on a fully transparent background (if transparency is impossible: flat pure #00FF00, never white). No ground around it, no cast shadow, no text, no watermark, no frame.
```

### 3.2 The first reference: Did Prokip's khatka (canvas 2048×2048)

```
A small, old, lonely Ukrainian khata deep in a forest, home of a grumpy old village sorcerer (vorozhbyt), seen from the isometric camera described above with its south-west corner toward the viewer.
Shape: a single-storey rectangular house about 7 m long and 5 m deep, walls about 2.2 m high, under a thick, steep, hipped thatched roof about 3 m high that overhangs the walls all round. The LONG wall with the door is the left face (facing lower left); the SHORT end wall is the right face (facing lower right). The roof's top surface is clearly visible from above and takes up about half of the drawing.
Walls: clay walls whitewashed long ago, now aged cream gone grey-green and blue-grey with damp, cracked and flaking at the corners, a darker damp band along the bottom. A low clay ledge (pryzba) runs along the foot of both visible walls.
Door wall (left face): a low, weathered plank door with iron hinges in the middle of the wall, a little taller than a man; one small four-pane window with a thick wooden frame on each side of the door, placed symmetrically. Bundles of drying herbs (green, olive, faded yellow) hang from the eave along this wall.
End wall (right face): one small four-pane window in the middle.
Roof: sagging old thatch of weathered rye straw in layered tiers: dusty straw-gold and grey-brown (#B39A62 to #7D6A40), warm golden straw on the sunlit upper-left slopes, greyer and darker on the shaded right slope. Moss only in a few scattered patches (about one fifth of the roof at most), on the shaded slope, along the lower eaves and by the ridge. It must read as a straw roof, not a green one. Ragged eaves with a few rafter ends showing. A small square clay chimney near the ridge with a thin curl of smoke. A black raven sits on the ridge, looking toward the viewer.
Beside the door, at the left end of the door wall: a horse skull (long, narrow, hornless, a horse's not a cow's) on a weathered wooden stake, a folk charm against evil.
Scale: a man standing by the door would reach just below the top of the door frame.
Mood: cosy and a little spooky; old, neglected, lived in.
Output: transparent background, no ground around the house beyond the pryzba, no cast shadow.
```

### 3.3 Templates for the rest of the scene

Write each asset block in plain sentences: **what it is**, **its parts from base to top**, **where each detail sits** (left face, right face, top), **real size**, and **orientation** (door wall = left face).

**Building, exterior** (2048×2048): use §3.2 as the model: shape and real size, which face has the door (the left face), each face's details, the roof, extra details, scale, mood.

**Building, interior** (2048×2048; same camera, same footprint as the exterior):
```
Interior of [building] at the same isometric camera, roof and the two near walls removed (only their low stubs remain), so we look into the room from above: the two far walls standing, with their inner faces visible. Floor: [material]. [Corner by the door]: the pich (clay stove) with its mouth facing the room. Along the far walls: [furniture]. In the middle: [objects]. Mood: [few words]. Nothing outside the walls.
```
Traditional khata layout: the pich in a corner by the door; the pokut (holy corner with icon and rushnyk) diagonal from it, with the table under it; lavy (benches) along the walls; the pil (sleeping platform) between the pich and the back wall; the skrynia (painted chest) by the pil; the mysnyk (dish shelf) by the door.

**Tree** (1024×1024; trunk foot at the bottom centre). New trees use the scene's **isometric camera** (owner decision), like the hut; the style block stays as it is:
```
A single [species, age] tree seen from the same isometric camera as the attached hut (looking down at about 40 degrees): the top of the crown is clearly visible as well as its side, and the trunk shows below the crown, foreshortened, upright. [trunk and roots], [crown: shape, density, colours], golden dapples on the upper-left of the crown, the lower-right of the crown cooler and darker. Real size: [height, crown width]. The trunk's foot is at the bottom centre of the image.
```

**Prop** (1024×1024; base at the bottom centre): `A single [object] as used on a Cossack khutir, seen from the isometric camera with a corner toward the viewer: [material, condition, details], real size [ ].`

**Character turnaround** (2048×1024):
```
Character turnaround sheet for an isometric RPG, one character, five views in a row seen from the same camera height (looking down at about 40 degrees): facing down-left, down, down-right, right, up-right (the remaining three directions are mirrored later). Same scale, same neutral standing pose with arms slightly away from the body, for 2D skeletal animation. [Name, age, role from CHARACTERS.md]. Face: [ ]. Hair: [ ]. Clothing top to bottom: [ ]. Carries: [ ]. About 7 heads tall, storybook-realistic, not chibi. Transparent background.
```

**Ground** (2048×2048, seamless): `A seamless tileable texture of [ground] seen from the same isometric camera, in the same ink-and-watercolour style: [materials, small details]. Even lighting, no objects, no shadows, tiles seamlessly on all four sides.`

### 3.4 Negative prompt (always)

```
background, white background, scenery, cast shadow, oval shadow, front view, side view, eye-level view, top-down flat plan, vanishing point, perspective distortion, horns on a horse skull, text, lettering, watermark, signature, frame, border, pixel art, 3D render, photo, photorealistic, glossy digital painting, anime, chibi, cartoon flat colour, cel shading, saturated colours, neon, Russian onion domes, tsarist, medieval European castle, knight armour, Viking, generic fantasy
```

---

## 4. Working with Muse

1. **One asset per request.** Style block + asset block, references attached, negative prompt.
2. **Give the canvas size** in the request.
3. **Iterate with numbered corrections**, the most important first: "Same image, keep everything else, fix: 1) … 2) …". Muse tends to keep a white background and a horned skull through a round; put those first and repeat them in the negative prompt.
4. **Transparency:** if Muse can't, flat pure #00FF00; never accept white.
   - Muse removes the outer background but often leaves **holes inside the subject** (gaps between branches, between a stake and a wall) as opaque white. Don't fight it in the prompt: run `python3 tools/art_clear_white.py IN.png OUT.png` (clears pure-white patches of 400+ px and un-mixes the white from their edges). For trees, where nothing is legitimately white, add `--min-area 40`. Trees with fine, see-through foliage (the birch) need `--min-area 6 --white 232` to catch the small greyish flecks; check the bark survives. Check the result on a dark background before accepting it.
5. **The hut is approved** (`art/reference/prokip-hut-iso.png`): attach it to every request as the camera and scale reference, together with the oak for style.
6. **Characters:** turnaround first, then a parts sheet from the approved turnaround (head, torso, upper arms, forearms, hands, thighs, lower legs, feet, held items, each separate with rounded joint ends).
7. **Record lessons** in §7.

---

## 5. Files and naming

```
art/
  reference/   approved references (listed in §2), committed
  accepted/    accepted assets: art/accepted/<category>/<id>.png
               categories: buildings, interiors, trees, props, characters, parts, ground, spirits
               id: the name used in the game where one exists (prokip, oak, birch, pine, ...)
  source/      optional: raw generations and alternatives
```

PNG with alpha, sRGB, at the generated size. A short `<id>.md` beside an asset is welcome for its anchor point (where it touches the ground) and quirks. Wiring the art into the game is a separate step, not covered here.

---

## 6. Acceptance checklist

- [ ] Style matches `art/reference/oak.webp`: ink with hatching, watercolour washes, paper grain.
- [ ] Palette muted and earthy; gold only as sunlight; whitewash cream, not white; thatch reads as straw, moss only in patches.
- [ ] Camera: isometric, about 40° down, corner toward the viewer, top and two sides visible, orthographic, verticals vertical.
- [ ] Trees: the isometric camera like the hut (crown top visible, trunk foreshortened); the side-on oak is the one exception.
- [ ] Buildings: the door wall is the left face.
- [ ] Light from the upper left; no time-of-day tint.
- [ ] Transparent background (or clean #00FF00); no cast shadow; no text; nothing cropped.
- [ ] Real-world scale consistent with §1 and with the approved hut.
- [ ] Ukrainian and Cossack; nothing Russian, Western-European or generic fantasy.
- [ ] Characters match `CHARACTERS.md`.

---

## 7. Rules learned from review (one line per mistake)

- A horse skull is long, narrow and hornless; Muse draws horns unless told twice.
- Never a white background: whitewash can't be separated from it.
- Muse defaults to a front-on, near-eye-level view of buildings; spell out the isometric camera (corner toward the viewer, roof top visible, two faces) every time.
- Muse adds an oval ground shadow unless told not to.
- The horned skull survived two correction rounds and was fixed only when it was correction no. 1, worded "NO horns at all, nothing on top of the head". Lead with the most stubborn fix.
- When asked to match the oak's colour, Muse swung warmer and yellower than the oak; ask for "cool sage green like the oak" rather than just "greener".
- Never ask to make a whole asset "greener": Muse turned the thatched roof into a green roof. Green belongs to foliage and moss patches; thatch is straw (grey-gold, grey-brown).
