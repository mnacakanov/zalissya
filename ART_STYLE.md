# ART_STYLE.md: how Zalissya's art looks, and how to generate it

This is the single source of truth for the game's **AI-generated art**. Our image agent is **Muse**. Any developer, on any device, should be able to produce an asset that matches the rest by following this file.

- **Agents:** read §1 (the machine-readable spec) and §3 (the prompt templates). Build every prompt as `STYLE BLOCK + ASSET BLOCK`, attach the reference images in §2, and check the result against §6 before accepting it.
- **Humans:** read it top to bottom once. Add what you learn to §7.
- **Status:** this is the new art direction. The game is still drawn procedurally (`render/`, described in `CONTENT_GUIDE.md` §4). Generated assets will replace those drawings piece by piece once the image pipeline exists (§5). Until then, accepted art is collected in `art/`.
- **Who is who:** every character must match `CHARACTERS.md` (age, look, voice). The world's rules are in `CLAUDE.md` and `CONTENT_GUIDE.md`.

---

## 1. Spec (machine-readable)

```yaml
style:
  name: ink-and-watercolour storybook
  medium: dark sepia-brown ink linework with fine hatching and cross-hatching, over soft, slightly blotchy transparent watercolour washes, subtle paper grain on the subject
  feels_like: a 19th-century folk-tale book plate or an old field-guide illustration brought to life
  mood: calm, aged, a little melancholic, warm but muted; Gogol's village comedy by day, folk-tale dread at night (the game adds the night)
  not: [pixel art, 3D render, photo, glossy digital painting, anime, chibi, cartoon flat colour, cel shading, neon or saturated colour]
setting:
  place: a Cossack khutir (farmstead settlement) on the edge of the steppe
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
  moss_on_thatch: sage green with gold patches
  timber_weathered: grey-olive to brown
  cossack_red_muted: "#A8362C"
  sharovary_blue_muted: "#2E4A7E"
  rule: desaturated and earthy; bright colour only where people put it (embroidery, rushnyky, painted chests, flowers, icons), and even that like old dyed cloth
light:
  source: one soft sun from the upper left
  lit_side: golden dapples, warmer
  shaded_side: right side, cooler and deeper, denser hatching
  time_of_day: none baked in (the game grades dusk and night itself)
  cast_shadow: never painted (the game draws a soft shadow under each object)
camera:
  view: top-down three-quarter, about 45 degrees from above
  projection: orthographic, no perspective distortion, no vanishing points
  uprights: rise straight up the image from their base point
  buildings: front (south) wall straight on; a good part of the roof's top surface visible; side walls not shown in perspective
  ground: seen from above
output:
  background: fully transparent PNG with alpha
  background_fallback: flat pure "#00FF00" (chroma green), to be keyed out
  background_never: white (it cannot be separated from whitewash), any scenery, any ground under the subject
  subject: exactly one, centred, nothing cropped, small margin all round
  forbidden: [text, lettering, watermark, signature, border, frame, oval shadow, ground plane]
  resolution: 4x game scale (see scale table)
scale:                       # game world px; generate at 4x
  person_height: 50           # feet to crown, about 5.2 heads tall
  tree_sprite: [170, 160]     # width, height; trunk foot at y=150
  huts:
    standard_khata: [320, 210]
    otaman_khata: [380, 200]
    korchma: [350, 210]
    pustka: [210, 176]
    prokip_khatka: [220, 170]
    kaplytsia: [140, 124]
    windmill: [150, 130]
  door_rule: walk-in buildings have their door exactly centred in the front wall
```

---

## 2. Reference images (attach to every Muse request)

| File | Approved for | Notes |
|---|---|---|
| `art/reference/oak.webp` | **Style, colour, mood: the master reference.** Attach to every request. | Composition is fine, but as a game asset it needs re-exporting without the sage background and the oval shadow. |
| `art/reference/prokip-hut.webp` | **Style for buildings** (thatch, moss, damp whitewash, wood, ink). Attach to building requests. | Composition **not** approved: white background, horned skull (must be a horse skull), door off-centre, eye-level camera with the side wall in perspective. Use it for the look, never for the layout. |
| `art/reference/prokip-hut-v2.png` | **Best building so far**: style, centred door, symmetrical windows, nearly straight-on front wall. | Still to fix: white background, horned skull, camera near eye level (needs about 45° from above, more roof top, the footprint reading 22 wide by 17 deep). |

New approved assets go in `art/reference/` too, with a row here saying what each is approved for.

---

## 3. Prompt templates

Every prompt is the **style block** (identical every time) followed by **one asset block**. In Muse, attach the reference images from §2 to the same request. If Muse has a negative-prompt field, paste §3.3 there; if not, append it as "Avoid: …".

### 3.1 Style block (copy exactly)

```
Hand-drawn game illustration in a vintage storybook ink-and-watercolour style, matching the attached reference oak: confident dark sepia-brown ink linework (near #2A2218) with fine hatching and cross-hatching in the shadows, laid over soft, slightly blotchy transparent watercolour washes, with a subtle paper-grain texture on the subject itself. It feels like a 19th-century folk-tale book plate or an old field-guide illustration brought to life: calm, aged, a little melancholic, warm but muted.
Colour: a desaturated, earthy palette. Sage and moss greens for foliage (deep #3E5A38, mid #5F7D4A, pale olive #8E9A68), olive-taupe for wood and bark (#8A7F5C to #5E5640). Sunlight is the only warm accent: dappled honey-gold highlights (#E8B85C) where the light hits. Whitewash is an aged cream (#EFE6D2), never pure white; thatch is dusty straw (#B39A62 to #7D6A40); reds (Cossack red #A8362C) and blues (#2E4A7E) are muted, like old dyed cloth. Nothing saturated or neon; everything looks painted on the same paper.
Light: one soft sun from the upper left, golden dapples on the lit side; the shaded right side cools into deeper colour and denser hatching. No time-of-day tint.
Setting: a Cossack khutir in 18th-century Left-Bank Ukraine (the Hetmanate), the world of Gogol's "Evenings on a Farm near Dikanka" and "Viy". Strictly Ukrainian material culture: whitewashed clay khaty with thatched roofs, wattle fences, embroidered linen, Cossack dress.
Camera: top-down three-quarter view, about 45° from above, orthographic, no perspective distortion; upright objects rise straight up from their base. Buildings show their front wall straight on and much of the roof's top surface; side walls are not shown in perspective.
Output: exactly one isolated subject, centred, nothing cropped, on a fully transparent background (if transparency is impossible: flat pure #00FF00, never white). No ground, no grass under it, no cast or oval shadow, no text, no watermark, no frame.
```

### 3.2 Asset blocks

Write the asset block in plain sentences: **what it is**, **its parts from base to top**, **where each detail sits** (left/right/centre, front/back), **size and proportion**, and the **anchor point** (where it touches the ground). Templates by category:

**Building, exterior** (canvas 1024×1024; building ≈85% of the width):
```
[Name]: a [size, age, condition] Ukrainian [khata / building type], [who lives there and their character in a few words]. Footprint proportion [W] wide by [D] deep. Front (south) wall facing the viewer straight on: [door: material, EXACTLY centred], [windows: how many, placed symmetrically either side of the door], [wall: whitewash state]. Roof: [thatch / shingle, shape, condition, moss], [chimney]. Details: [left of door …], [right of door …], [on the roof …], [under the eaves …]. A low clay ledge (pryzba) along the foot of the front wall.
```

**Building, interior** (canvas 1024 wide, height = 1024 × D/W; the same footprint as the exterior):
```
Interior of [name] seen from above at the same three-quarter angle, roof removed: a [one-room / two-room] plan inside the walls of the exterior. Wall tops around the edge, with a gap for the door in the middle of the bottom (south) wall. Floor: [material]. Top-left corner: [usually the pich, the clay stove, with its mouth facing the room]. Back (top) wall: [furniture]. [Left / right / centre]: [furniture, objects on it]. Mood: [few words]. The room's own floor is part of the asset; nothing outside the walls.
```
The traditional khata layout (`data/houses.ts`): the pich in a corner by the door, the pokut (holy corner with icon and rushnyk) diagonal from it, the table under the pokut, lavy (benches) along the walls, the pil (sleeping platform) between the pich and the back wall, the skrynia (painted chest) by the pil, the mysnyk (dish shelf) by the door.

**Tree** (canvas 1024×1024; trunk foot at the bottom centre, about 60 px above the bottom edge; crown 600–700 px wide):
```
A single [species, age] tree: [trunk: shape, bark], [crown: shape, density, leaf colour from the palette], sunlit golden dapples on the upper-left of the crown. The trunk's foot is at the bottom centre of the image.
```

**Prop** (canvas 512×512 or 1024×1024; foot at the bottom centre):
```
A single [object] as used on a Cossack khutir: [material], [condition], [details]. Seen at the three-quarter angle, its base at the bottom centre of the image.
```

**Character turnaround** (canvas 2048×1024; four figures ≈800 px tall each, so about 4× of 50 px × 4 head room; same scale):
```
Character turnaround sheet of one character, four views in a row, evenly spaced: front, three-quarter front, side (profile facing right), back. Same character, same scale, same neutral standing pose with arms slightly away from the body (A-pose), so the parts can be rigged for 2D skeletal animation. [Name, age, role from CHARACTERS.md]. Face: [features]. Hair: [ …]. Clothing, top to bottom: [ …]. Carries: [ …]. Proportions about five heads tall, storybook-realistic, not chibi.
```

**Character parts sheet** (canvas 2048×2048; for skeletal animation, after the turnaround is approved):
```
Parts sheet of [name] from the approved turnaround, front three-quarter view, each body part drawn separately and spread out with space between them on a transparent background: head (with hair and beard), torso with clothing, upper arm left, upper arm right, forearm left, forearm right, hand left, hand right, thigh left, thigh right, lower leg left, lower leg right, foot left, foot right, [held item]. Each part complete and slightly overlapping at the joints (rounded ends), same scale as the turnaround, same lighting.
```

**Ground tile** (canvas 1024×1024; the only asset that IS a surface):
```
A seamless tileable texture of [ground type] seen from directly above, in the same ink-and-watercolour style: [materials, small details]. Even lighting, no objects, no shadows, no strong features that would repeat visibly; it must tile seamlessly on all four sides.
```

**Spirit or creature**: as a character or prop, plus one line on how it is uncanny ("eyes like two coals", "bark for skin"). Keep it in the same palette; glows (fire, lamplight, will-o'-the-wisps) are painted as soft warm washes, and the game adds the night lighting.

### 3.3 Negative prompt (always)

```
background, white background, scenery, ground, grass under the object, oval shadow, cast shadow, side wall in perspective, vanishing point, text, lettering, watermark, signature, frame, border, pixel art, 3D render, photo, photorealistic, glossy digital painting, anime, chibi, cartoon flat colour, cel shading, saturated colours, neon, Russian onion domes, tsarist, medieval European castle, knight armour, Viking, generic fantasy
```

---

## 4. Working with Muse

1. **One asset per request.** Paste the style block, then the asset block, attach the references from §2, add the negative prompt.
2. **Ask for the exact canvas size** in the asset block ("1024×1024 canvas"). If Muse picks its own size, the aspect ratio must still match.
3. **Iterate with corrections, not new prompts.** Send the image back with a short list: "Same image, same style, with these corrections: …". Name each fix concretely (what, where, how). Keep everything else ("same details").
4. **Transparency:** if the result has a background, ask again for transparent; if Muse can't, ask for flat pure #00FF00 and we key it out. Never accept white.
5. **Consistency across a set:** once one asset in a category is approved, attach it as an extra reference for the rest of that category (all huts, all trees, all residents).
6. **Characters:** turnaround first, then the parts sheet from the approved turnaround. Never generate a character's parts without an approved turnaround.
7. **Record what you learn** in §7 (a rule per mistake), so the next request avoids it.

---

## 5. Files and naming

```
art/
  reference/   approved references (listed in §2), committed
  accepted/    accepted game assets, committed, one PNG per asset:
               art/accepted/<category>/<id>.png
               categories: buildings, interiors, trees, props, characters, parts, ground, spirits
               id: the game's own id where one exists (e.g. prokip, hut0, korchma, oak, birch, pine, myroslav)
  source/      optional: raw generations and alternatives, not used by the game
```

- PNG with alpha, sRGB, at the generated 4× size; the build will downscale.
- A short `art/accepted/<category>/<id>.md` beside an asset is welcome when it has an anchor point or quirks (for example "trunk foot at 512, 964").
- **The runtime pipeline does not exist yet.** The game ships with no image files today: the Pages build is one self-contained HTML file, and the Muse build has not been checked for image hosting. Wiring images in (loading, atlases, anchor points, a WebGL renderer such as PixiJS for many large sprites, skeletal animation for characters) is separate work; until then, assets wait in `art/accepted/`.

---

## 6. Acceptance checklist (check every asset before committing it)

- [ ] Ink linework with hatching, watercolour washes, paper grain: matches `art/reference/oak.webp` side by side.
- [ ] Palette: muted and earthy; gold only as sunlight; nothing saturated; whitewash cream, not white.
- [ ] Light from the upper left; no time-of-day tint.
- [ ] Camera: about 45° from above, orthographic; buildings' front wall straight on, no side wall in perspective.
- [ ] Transparent background (or clean #00FF00), no ground, no shadow, no text, no frame, nothing cropped.
- [ ] Anchor point where the spec says (trees and props: base at the bottom centre; buildings: door exactly centred in the front wall).
- [ ] Proportions match the scale table (footprint W:D for buildings; about 5 heads for people).
- [ ] Culture: Ukrainian and Cossack, nothing Russian, Western-European or generic fantasy.
- [ ] Characters: age, look and clothing as in `CHARACTERS.md`.

---

## 7. Rules learned from review (add one line per mistake)

- Doors of walk-in buildings are always exactly centred in the front wall: the game's door gap is in the middle.
- A horse skull is long, narrow and hornless (the folk charm on a stake is a horse's, not a cow's or goat's).
- Never a white background: whitewash can't be separated from it.
- Front walls straight on; no two-point perspective, no visible side wall.
- Muse adds a background and an oval ground shadow unless told twice; keep both "no background" in the style block and "background, oval shadow" in the negative prompt.
- Muse kept the white background and the horned skull through a correction round: put such fixes FIRST in the correction list and repeat them in the negative prompt ("white background, horns").
- Muse drifts to eye level for buildings: say "camera about 45° from above, we look down onto the roof; the roof's top surface fills most of the image" explicitly.
