# CONTENT_GUIDE.md: adding to Zalissya

This is the hands-on guide for adding content: people, places, buildings, songs, quests, text and drawings. `CLAUDE.md` has the rules and the layout; this file shows how to work inside them, so that new work looks, sounds and plays like the rest of the game. Read both before your first change.

---

## 1. Start here

1. **Read** `CLAUDE.md` (rules, layout, commands), this file, and the last few paragraphs of `DESIGN.md` (what changed recently and why).
2. **Set up**:

   ```bash
   cd pages && bun install
   ```

3. **Find the nearest existing example and copy its shape.** Almost everything has a precedent. A new walk-in building follows `mlyn` (the windmill). A new person follows Odarka. A new song follows `zhentsi`. A new hideout follows `duplo`.
4. **Work in the loop**: change → `bun run typecheck` → `bun run test` → `bun run build` → look at it in a browser (§8) → add a paragraph to `DESIGN.md` → commit.
5. **Write Ukrainian first**, then English. Every player-facing string goes in both `client/src/content/locales/uk.json` and `en.json`.

---

## 2. The world and its tone

**Where and when.** A Cossack **khutir** (a farmstead settlement) called Zalissya, "beyond the forest", on the edge of the steppe, in the Hetmanate era of Gogol's *Вечори на хуторі біля Диканьки* and *Вій*. The Sich is a real place people ride off to and sometimes don't come back from. Chumaky (salt-and-fish carters) pass along the road. Devils are real, vain, and fond of old mills.

**Who you are.** A wandering **kobzar**: a blind-singer tradition, here a young minstrel with a kobza. He is male in Ukrainian («ти прийшов»). People call him «кобзарю», «співаче», «синку». His power is songs, not weapons.

**The tone is Gogol's.** Earthy, cheeky village comedy (the Chort is a dandy, the otaman's dog has opinions, Radek swears in Polish) that turns, after dark and near Viy, into real dread. Both halves matter. A scene that is only funny or only grim is half a scene.

**Grown-up themes are welcome**: grief, fear of strangers, the cost of rules, debt, faith. **Dilemmas have no free right answer.** Every choice costs something, doing nothing is also a choice, and nobody is simply a villain. The chumak caravan (`systems/chumaky.ts`, `dialogue/chumaky.ts`) is the model.

**Fighting is rare and folkloric.** There is one fight, Viy's vigil: warding with chalk, iron and song. Don't add combat without the owner's say-so.

### Do

- **Cossack material culture.** Otaman, pernach (the mace of office), sabres, a musket on the wall, the korohva (banner), horses, the lyulka (pipe), horilka, kulish (millet stew), varenyky, the hopak, dumy.
- **Village life.** The khata (whitewashed, thatched), the pich (the great clay stove), the pokut (holy corner), rushnyky (embroidered towels), skrynia (painted chest), tyn (wattle fence), the well with a crane (zhuravel), sunflowers, mallows, storks.
- **Ukrainian folk belief.**
  - Domovyk (house spirit behind the pich)
  - Lisovyk (forest)
  - Chort (devil)
  - Bolotianyk (bog)
  - Viy
  - witches and warlocks (vidmy, vidmaky) on Lysa Hora
  - rusalky and the drowned girls of the May night
  - will-o'-the-wisps
  - the kupala fern

### Don't

- No generic "Slavic fantasy": no Russian words or tsarist trappings, and no Viking or medieval-European kit.
- No firearms gameplay, no XP, no classes.
- No song lyrics, ever. Songs are named by title only, because they are real folk songs.
- No villains for the sake of it. The Chort has a business, Viy has a hunger, Beelzebub keeps his word.

### Words to reach for

| Ukrainian | English locale | What it is |
|---|---|---|
| хутір | khutir | a farmstead settlement; Zalissya is one |
| майдан | maidan | the village square, where the fire is |
| каплиця | the chapel | the small log chapel on the maidan |
| хата | hut (never "khata" in English UI text) | a peasant house |
| світлиця, сіни | svitlytsia, siny | the clean front room, the passage |
| піч, покуть, скриня, лава | pich, pokut, skrynia, lava | stove, holy corner, chest, bench |
| корчма, шинкарка | korchma, shynkarka | the inn, the woman who keeps it |
| вітряк | the windmill | a post mill |
| курган, кам'яна баба | kurhan, stone baba | a steppe burial mound, the idol on top |
| отаман, старшина | otaman | the Cossack leader of the khutir |
| чумаки | chumaky | carters who haul salt from the Crimea |
| кобза, кобзар, дума | kobza, kobzar, duma | the lute, its player, an epic song |
| жупан, шаровари, свита, бриль | zhupan, sharovary, svyta, brryl | coat, wide trousers, peasant coat, straw hat |
| оселедець, люлька | oseledets, lyulka | the Cossack scalp-lock, the pipe |
| плахта, вінок, керсетка | plakhta, vinok, kersetka | wrap skirt, flower crown, bodice |
| нечисть | nechyst | the unclean host, all the devilry together |

Transliteration rules and the English/Ukrainian split are in `CLAUDE.md` (Rule 1). In short:

- People, places, spirits and herbs are **transliterated** in English (Myroslav, Lysa Hora, Bolotianyk, Zvirobiy).
- Skills, common buildings and everyday items are **English** (Herbalism, huts, chalk).
- Radek stays Polish.

---

## 3. Writing

- **Ukrainian first, then translate.** Write the line the way a person on the khutir would say it, then render it in English with the same rhythm. Don't write English and translate it back.
- **Short and punchy.** One to three sentences a line. Prefer a concrete image («очі, як утоплена колода») to an explanation.
- **Voices.** (Each character's age, look and ties are in `CHARACTERS.md`; check it before writing about anyone.)
  - **Myroslav, the otaman:** gruff and fatherly, an old Sich man; orders that are really care.
  - **Vesna, the znakharka:** dry and warm, practical, sees through everyone.
  - **Radek, the smith:** a Pole who ran from his lord. Swears in Polish («пся крев», «Jezus Maria», «a nie…»), mixed into his Ukrainian.
  - **Odarka, the shynkarka:** sharp-tongued, counts everything.
  - **Okhrim, the old Zaporozhian:** tall tales, real scars.
  - **The Chort:** a vain, chatty dandy, a merchant of souls, offended by bad manners.
  - **The Bolotianyk:** slow and cold, speaks in «…», calls the kobzar "dry-foot" («сухоногий»).
  - **The Domovyk:** grumbling, small, house-proud.
  - **Beelzebub:** CAPITALS, ceremonious, keeps his word.
  - **Did Prokip, the vorozhbyt:** grumbling, insults with love, calls the kobzar «шмаркачу» (snot-nose), never admits he is glad you came.
  - **Witches and warlocks:** playful menace.
- **Narration** (italic-feel lines between quotes) is in the present tense, second person: «Очерет розступається.»
- **Whole sentences with placeholders.** Write `"Улов: {caught}!"`, never fragments glued together in code. Avoid phrasings that need a case or plural to agree with a number (`client/src/content/README.md` explains why).
- **Every string goes in both locales**, keyed by where it lives. `line.<who>.N` and `topic.<who>.<topic>.label.0`, `.question.0` and `.0` are dialogue. `ui.…` is the HUD, prompts and toasts. `quest.…` is the quest log. `map.…` is map labels. `char.<who>.name.0`, `.pron.0` and `.role.0` name a character.
- **`pron`** is an English pronunciation hint (`bo-lo-TYAH-nyk`). It is empty in `uk.json`.
- **Emoji** are used sparingly in prompt labels and house names (`"⛪ Каплиця"`, `"Скупатися 🌊"`), never in dialogue.

---

## 4. The art style

The owner chose **smooth, painted, storybook** art, not pixel art. Everything is drawn with Canvas 2D calls; there are no image files.

**The look in one sentence:** soft painted shapes with a light-to-dark gradient across them, a thin warm-black ink outline, a soft contact shadow underneath, and colour only where people would put it.

- **View.** Top-down three-quarter. Ground things are seen from above. Standing things (people, houses, trees) rise up the screen from their base point and are depth-sorted by their base `y` (the `drawables` list in `App.tsx`).
- **Ink.** `rgba(34,22,14,0.85)` (or near it), line width about 0.8–1.2. It outlines figures and furniture, not ground marks.
- **Shading.** A linear gradient across the shape, from lit on the left (west) to about 0.72 darkness on the right. In `render/people.ts`, `paint()` and `darken()` do this for clothing.
- **Shadows.** A soft ellipse under the base, about `rgba(30,50,20,0.28)` on grass and `rgba(30,20,10,0.28)` indoors. Trees use the shared shadow blob (`drawTreeShadows`).
- **Palette.**

  | Use | Colours |
  |---|---|
  | whitewash | `#f4ecdc` / `#faf6ec` |
  | thatch | warm straw browns |
  | timber | `#8a6440` → `#5a3a20` |
  | pine logs | `#d4a868` / `#c8995a` |
  | Cossack red | `#b0302a` / `#c8402e` |
  | gold trim | `#d9a441` |
  | sharovary blue | `#2c4a8a` |
  | grass | `#5e8a3c` |
  | water | `#3a6a80` → `#8fc3d4` |
  | night lamplight | `255,170–210,80–120` |

  Bright colour is for embroidery, rushnyky, painted chests, flowers and icons. Everything else is earthy.
- **People** are about five heads tall, in costume by `FolkStyle` (`render/people.ts`). Poses are walking, `sit`, `sleep`, `dance` and `bathe`. A new kind of person is a new costume in `costumeFor()`, not a new drawing routine.
- **Spirits and animals** have their own routines (`render/spirits.ts`, `render/animals.ts`) in the same style: gradient fills, ink outline, shadow.
- **Light and time of day are applied for you.** `render/light.ts` grades the whole frame (dawn, day, dusk, night) and paints darkness with holes where light falls. Don't tint your own drawing for the time of day. To make something glow at night (a window, a fire, a lampadka, will-o'-the-wisps), add a light to `drawDark`, or to `windowLights` for a building.
- **Walk-in buildings fade.** The exterior is drawn with `c.globalAlpha = alpha`, and the alpha drops to 0 when the kobzar steps inside. Anything that should stay faintly visible overhead (the windmill's sails, the chapel's dome) is drawn with `0.3 + 0.7 * alpha`. The interior is drawn at world scale in the same footprint (`render/khataInterior.ts`).
- **Keep the frame cheap** (`CLAUDE.md`, Workflow).
  - Paint static things once. The ground and fields go into baked tiles through `drawLand` and `bakeDetail` in `render/village.ts`; trees are sprites.
  - Draw only what moves each frame, and cull anything off screen.
  - Take animation phases from the world position (`x + CAM.x`, or the object's world `x`), never from the screen, or things shimmer as you walk.
  - No per-frame loops of hundreds of strokes or gradients.

---

## 5. Recipes

Each recipe lists every place that needs touching. Search the codebase for the nearest example's id (for example `mlyn`) and you will find all of them.

### A new person (a human NPC)

1. `data/characters.ts`: an `Npc` entry (`id`, start `x`/`y`, `tunic`, `hair`, `style`). If they are a new kind of person, add a `FolkStyle` and a costume in `render/people.ts` `costumeFor()`.
2. Locales: `char.<id>.name.0`, `char.<id>.pron.0` (English hint, empty in Ukrainian), `char.<id>.role.0`.
3. Dialogue: scripted lines in `dialogue/lines.ts` (`line.<id>.N`) and topics in `dialogue/topics.ts`, or in a story module of their own, like `dialogue/korchma.ts`, that `App.tsx` appends.
4. If they live in the khutir, give them a **day**: a bed (every resident has one), a place of work, a bench, an evening at the fire. Add the spots to `PLACES` in `data/schedules.ts`, the plan to `planFor()` in `systems/schedules.ts`, and run `bun run test` (`schedules.test.ts` walks every resident through a whole day and fails if one gets stuck).
5. In `App.tsx`, check the name-tag height (`tagLift`) if they sit, lie or are unusually tall.
6. A paragraph in `DESIGN.md`.

### A new spirit or creature of the night

Same as a person, but the drawing goes in `render/spirits.ts` (`drawX(c, x, y, t)`), dispatched by `style` where `App.tsx` draws characters. Decide when they are about: by night only, like the sabbath (`systems/sabbath.ts`), and where they are by day (`data/hideouts.ts`). Spirits on Lysa Hora go in `LYSA_CHARS` (`data/characters.ts`).

### A new walk-in building

This is the preferred way to add a place. The owner wants places you walk into, not new areas.

1. `data/houses.ts`:
   - add the id to `HouseId` and a footprint to `HOUSE_RECTS`; the door is always in the middle of the south wall, `DOOR_GAP` 46 wide;
   - add a `<NAME>_ROOM` const of furniture rects in footprint coordinates, and add it to `furniture()`;
   - walls come from `houseSolids()` automatically.
2. Exterior: `drawX(c, x, y, w, h, t, alpha)` in `render/khutir.ts`, added to the exterior dispatch in `App.tsx` (search `drawMlyn(`).
3. Interior: `drawXInterior` in `render/khataInterior.ts`, added to the dispatch at the top of `drawKhataInterior`. Copy `drawMlynInterior`'s structure: floor, walls with the door gap, the back wall's inner face, then the furniture.
4. `App.tsx`: add the id to `roofAlphaRef`, `HOUSE_ENTER` (the toast on entering) and `HOUSE_LABEL` (the HUD place name).
5. `render/light.ts`: add a `windowLights` case (return `[]` if nothing is lit). The `switch` is exhaustive, so typecheck tells you.
6. `render/map.ts`: shown on the map unless filtered out (hideouts are filtered).
7. Locales: `ui.enterHut.<id>` (two or three sentences, what you see and smell) and `ui.hut.<id>` (emoji + name).
8. Check that the footprint doesn't sit on paths people walk. `schedules.test.ts` will tell you if a resident can no longer get somewhere. Trees and yard plants clear themselves out of `HOUSE_RECTS`.

### A new outdoor place (a field, a bog, a ruin, a grove)

1. The data goes in `data/land.ts` (south of the khutir) or `data/village.ts` (in it): its position, shape, and any "is this point in it" test.
2. The static ground goes in the baked layer (`drawLand` in `render/land.ts`); the living parts (water rings, swaying reeds, smoke) go in a per-frame function with an on-screen check.
3. Solid things go in `SOLID`. Water and other no-walk ground go in the movement check in `App.tsx`, next to `inRiver`.
4. Clear trees out of it (`FOREST_TREES` in `data/land.ts` and `TREES` in `data/village.ts` both have filters).
5. A road or footpath to it in `roads()` (`render/village.ts`), a label in `render/map.ts` (`map.<id>` in the locales), and a night light if it glows.

### A new song

1. `systems/songs.ts`: add the id to `SongId` and to `SONGS` with its mood (`happy` / `neutral` / `sad`). The repertoire needs more happy and neutral songs than sad ones.
2. Locales: `song.name.<id>` with the real title in Ukrainian and a translated title in English. **No lyrics.**
3. Someone teaches it: a topic with `grant: "<id>"` in `dialogue/songTopics.ts` (or `chumaky.ts`, `viyNight.ts`). The teacher should fit the song: Cossack marching songs from the otaman, love songs from the korchma, dumy from old men.
4. Update the comment at the top of `songs.ts` and `songTopics.ts` that lists who teaches what.

### A new conversation topic, item or story beat

- **Topic:** a `DialogueTopic` (`id`, `label`, `question`, `lines`, optional `grant`), gated on flags so it appears once it makes sense and goes away once it's done.
- **Items and state are flags** (`systems/flags.ts`): a plain name (`"map"`, `"dovhyiLetter"`) or a counter (`"fish=3"`). Hand items over with `grant`, which is handled in `applyGrant` in `App.tsx`. A buff that should wear off at dawn goes in `UNTIL_DAWN_FLAGS` (`systems/time.ts`), with its stat bonus in `systems/stats.ts`.
- **Never store derived things.** Stats and quest progress are computed from flags.
- **Quest:** a `QuestDef` in `systems/quests.ts`, its id in `PRIORITY`, a test in `quests.test.ts`, and a map star in `questTarget()` (`render/map.ts`). Most small things should be **secret** (`secret: true`): not written in the log until done, then shown with a "found" toast. Let people hint at them in dialogue instead. Only the story spine and real side threads (the chumaky, Prokip, the pipe) are written down in advance; the Serpent's Cave has no entry at all.

### A new interactable (something you press A / E / tap on)

Add a `Prompt` kind in `ui/types.ts`. Offer it in the "nearest interactable" block of `App.tsx`'s frame loop (the `spot(cond, x, y, reach, make)` helper). Handle it in `doInteract`, and label it in the prompt-label chain (`ui.promptLabel.<kind>`). It then works by keyboard, touch and gamepad automatically. Don't add drag controls (Rule 2).

### A new animal

Behaviour goes in `systems/critters.ts`: a home, a speed, where it sleeps at night, plus a test. Drawing goes in `render/animals.ts`. Animals sleep at night too.

---

## 6. The world map, in brief

- **One open world**, 3980×2300.
- **The khutir** is at x 0–1680: a horseshoe of houses round the maidan, open to the south, with the chapel and the fire in the middle.
- **East** is the steppe and the chumak road. Lysa Hora is at the far east end (`LYSA_ORIGIN`).
- **South** are the gardens, the strip fields, the river (two bridges) and the forests, with the tobacco field by the chumak road.
- **Viy's hollow** is north-east of the khutir.
- **Coordinates:** `x` grows east and `y` grows south. A building's `y + h` is its front (south) edge and its door.
- **Free ground:** before you place something, check what is near it: `HOUSE_RECTS`, `SOLID`, `PLACES`, `BENCHES`, `HERB_SPOTS`, `IRON_SPOTS`, and the roads in `roads()`. Grep for nearby numbers.

---

## 7. Saves and compatibility

- Old saves must keep loading. Prefer new flags to anything else.
- A save position that ends up inside something solid after your change is moved to the spawn point on load (`App.tsx` load effect). That is acceptable for small moves. For a whole building, think about where people were standing.
- Id renames and new counters get a migration in the load effect.

---

## 8. Checking your work

Run from `pages/`:

```bash
./node_modules/.bin/tsc --noEmit -p tsconfig.json
```

```bash
bun run test
```

```bash
bun run build
```

Then **look at it**. The build is one file, `pages/dist/index.html`. Playwright and Chromium are preinstalled in Claude sessions. To jump straight to a place and time, seed a save and press Continue:

```js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1000, height: 760 } })).newPage();
  await p.addInitScript(s => localStorage.setItem('zalissya-save-v1', s), JSON.stringify({
    exists: true, x: 840, y: 560, area: 'village', talked: [], herbs: 0,
    flags: ['day=1', 'clock=600'],   // clock = minutes after midnight; 1320 is 22:00
  }));
  await p.goto('file://' + process.argv[2]);
  await p.getByRole('button', { name: 'Продовжити' }).click();
  await p.waitForTimeout(1200);
  await p.screenshot({ path: 'shot.png' });
  await b.close();
})();
```

Run it with:

```bash
NODE_PATH=$(npm root -g) node shot.cjs $PWD/dist/index.html
```

Keep scripts and screenshots out of the repo. Check:

- by day and at night;
- outside and inside, for buildings;
- that nothing you added stands in a wall, a road or the water;
- that the frame stays smooth.

Then follow the Workflow section of `CLAUDE.md` to merge. Claude sessions fast-forward `main` once every check passes, and CI publishes the Pages build.

---

## 9. Owner decisions so far (don't relitigate)

- **Art:**
  - painted, not pixel;
  - people in the storybook style;
  - roads and the maidan are muddy, uneven and worn, never geometric.
- **World:**
  - one open world;
  - walk-in buildings and places you walk to rather than new areas;
  - the khutir in a horseshoe round the maidan, after the Sich layout, but with no palisade or gate.
- **Life:**
  - residents keep schedules: home at night, work by day, benches, the evening fire, bathing;
  - the sabbath is held only at night;
  - witches and warlocks hide by day in real, walk-in hiding places.
- **Play:**
  - the kobza is the core mechanic;
  - one folkloric fight;
  - KCD-style skills grown by doing;
  - six derived stats.
- **Controls:**
  - the floating joystick is Pages-only;
  - Muse gets hold-buttons and the keyboard;
  - everything works on a gamepad.
