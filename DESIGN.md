# Design notes

How the game grew, one build at a time. This was the header comment of the original single-file `App.tsx`, and it is kept here as the design record. Add a paragraph when a build changes how the game works.

Zalissya — a Ukrainian village clearing. Top-down pixel-art game on canvas. All names use Ukrainian romanization (the system S.T.A.L.K.E.R. 2 uses: Chornobyl, not Chernobyl) — г→h, х→kh, ч→ch, ш→sh, щ→shch, ц→ts, ж→zh, ю→yu, я→ya, є→ye, ї→yi, и→y, й→y.

## Movement

Hold-to-move direction pad (bottom-left), WASD / arrows on desktop. NOT a drag joystick: on the user's phone a downward drag is claimed by the host's pull-to-refresh before the page can use it, and two generations of page-level locks (overscroll-behavior, touch-action, non-passive touchmove prevention, scroller snapping) did not stop it — a stationary hold produces no refresh gesture at all.

## Skills grow by doing

Gathering any herb raises Herbalism.

## Naming rule

Villages, people, spirits/monsters and herbs keep Ukrainian names (Zalissya, Myroslav, Lisovyk; herbs: Kropyva, Polyn, Kalendula, Zvirobiy, Dereviy); skill names stay English (Herbalism).

Spirits are real presences, not just dialogue mentions: the Domovyk keeps to the hut by the pich, the Lisovyk walks the pine edge, a Chort (Чорт) lounges by the old millstone offering to buy your soul (a nod to the devil host of Dakhno's Cossacks cartoons and their mill sabbath), the Bolotianyk (болотяник) rises from the pond shallows, and Viy (Вій) — the game's big boss — sleeps in a hollow at the north-east forest edge, eyelids hanging to the ground. He is approachable and ominous, but the boss fight itself is not built yet: nobody wakes him. For now.

Houses are called huts in English (user direction — no "khata").

## Non-combat village life

Fishing at the pond with a bite-timing minigame (Fishing skill grows by catching), a crust of bread by the campfire that the Domovyk is waiting for (offer it at his hut's pich for a keepsake), the Chort's bargain as a REAL choice — sign and he takes your shadow, then buy your soul back with fish — a wishing well, bog iron in the pond mud for Radek's cold forge, chickens that scatter, and a satchel of keepsakes in the HUD. Quest state lives in save "flags" (plain names, plus "name=n" counters like "fish=3").

## Stats & skills

The classic six stats — STR, DEX, CON, INT, WIS, CHA — all start at 1, KCD-style: a stat's base IS the level of the skill that feeds it (Smithing→STR, Fishing→DEX, Cooking→CON, Alchemy→INT, Herbalism→WIS; CHA grows as you meet people). Skills grow only by doing. Keepsakes and tonics add bonuses on top, and the totals bite back into the world: DEX widens the fishing bite window, CON is walking pace, WIS finds double herbs, INT brews double tonics, and a silver tongue (CHA ≥ 4) talks the Chort's soul price down from 3 fish to 2. New work: cook karas soup at the campfire (1 fish + 1 herb), work Radek's lit forge, and brew tonics at Vesna's drying rack by the north-east hut (2 herbs). Spendable stocks live in flags too: "herbStock=n" herbs in hand, "fish=n" fish in hand, "fishTotal=n" lifetime catch (drives Fishing level), "cooked=n"/"meals=n", "smithed=n"/"forged=n", "brewed=n"/"potions=n".

## Stat-influenced activities

The totals now GATE and SHAPE the work itself. Carry capacity is 6 + 2×STR total (weights: bog iron 3, forged piece 2, fish 1, herb 1, nichnyky 0) — a full satchel blocks pickups with a toast naming the weight and your STR, and iron for Radek is hauled in your arms (it counts toward the load once dug, but the dig itself is checked against your satchel load so the forge quest can never soft-lock). Alchemy has tiers: at INT ≥ 3 the rack offers a recipe choice and Vesna's strong tonic unlocks (3 herbs; INT +2, WIS +2 drunk — "strongPotions=n" / "strongtonic"). Honest stat checks with visible failures that consume nothing: the deepest bog-iron lump takes a STR check (certain at STR 3, a gamble below), Zvirobiy will not be known until WIS 2, the well's lucky pebble answers a CHA-scaled roll, and DEX tilts the catch table toward pike and perch and away from the boot.

## Lysa Hora

A second area — the Bald Mountain — reached by walking the east trail out of the clearing (and back the same way). A bare, rocky, moonlit summit where the Chort hosts a sabbath: witches dance around a great bonfire, Beelzebub presides, broomsticks lean on the standing stones. A non-combat chain lives there: gather nichnyky (night-blooms) on the slopes → lay them on the offering stone → join the dance → receive the Moonstone keepsake (WIS +1, CHA +1). The save now carries the current area alongside x/y, so a reload restores the player on whichever side of the trail they left.

## Branching dialogue

Conversations are topic-driven. Talking opens a short greeting (full introduction first time, brief welcome after), then a menu of questions the player picks in any order — answers are 1–3 lines, state-aware because they are dealt out of the same linesFor/linesForLysa scripts by subject, and asked topics stay available, marked ✓. The scripted beats stay scripted: Viy's narration, the well, the brew bench, the Chort's bargain (now a topic whose answer ends in the Sign / Keep my soul choice), the soul buy-back, and Beelzebub's blessing (a topic after the dance).

## Hut interiors

Two of the village huts have insides now — "hut0", the Domovyk's north-west hut (his pich lives there, and the bread offering + his gift of thanks happen at the pich INSIDE now), and "hut1", Vesna's south-east hut — the one she actually stands beside, by her garden (bed, work table, a cauldron corner, herb bundles overhead). The forge hut and the north-east hut stay facades — no prompt, no entry. Entering is walking into the door (the Lysa trail pattern) or the Step inside prompt at the door; leaving is walking out of the interior's south door or its prompt. Each interior is its own small area with its own spawn just inside the door, and the save's area round-trips it like Lysa Hora — the area column is plain text, so hut0/hut1 needed only the action enum widened, no migration. World geometry is interior-sized, so the camera follows the same clamp math with nothing special-cased.

## Slim HUD + quest log

The always-on overlay had grown to duplicate the Character sheet (skill levels, stat totals, carrying, keepsakes), so it now shows only what a player needs at a glance — where they are, the current objective, and two urgent warnings (soulless, over the carry limit). Everything else lives in the Character sheet. The single-line objective also hid the parallel threads (the Domovyk's bread, Radek's forge, the Lysa sabbath…), so a Quests menu joins Character in the same sheet: every thread with its progress, the current step marked, grouped as Story / Village life / Lysa Hora. Quest state is derived from the same flags and counters as everything else — no new storage.
## One codebase, two homes

The client was split out of the single `App.tsx` into modules (world, data, dialogue, systems, render, input, ui). The Muse and GitHub Pages builds now share it. They differ only in `platform/target.ts` vs `target.pages.ts`: which save adapter `api.ts` hands the game (server actions or localStorage), whether the safe-area scrim exists, and whether the floating joystick is allowed (Pages only, since Muse's pull-to-refresh steals drags). Spelling settled on й→y: Viy, Zvirobiy, Dereviy. The healer is a znakharka. Saves that recorded `vij` load as `viy`.

## Day and night

Zalissya keeps time. A day passes in about ten real minutes of walking about, and the clock stops while you talk, read the sheet, dance, or keep the vigil. It is saved as the counters `day=n` and `clock=m`; old saves start at 08:00 on day 1.
- **Until dawn:** meals and tonics finally mean "while it lasts". They end at the next dawn.
- **Night:** the open village darkens to blue-black around the campfire's glow. Lysa Hora was always night, and the huts are lamp-lit.
- **Sleep:** the Domovyk's bed (`hut0`, north-east corner) sleeps you until morning, or rests you until nightfall.

## Viy's night

The big boss is faced Gogol's way, not with weapons.
- **The chalk:** after you have looked upon Viy, Myroslav remembers the old way and hands over blessed chalk. With it, after dark (21:00–04:00), approaching Viy offers to draw the chalk circle.
- **The vigil:** it lasts 80 seconds of play. The nechyst crawls in from every side, and WARD (a tap) drives back every spirit within reach of the ring. Every 9–15 seconds Viy roars for his servants to lift his eyelids. The lids rise slowly while the host keeps crawling. When they open, the host bows and holds still, and anyone not holding LOOK AWAY loses 4 nerve. Hold until the rooster crows.
- **Stats:** CON sets Nerve (6 + 2×CON), WIS how far a ward reaches, DEX how soon you can ward again.
- **Preparations** (both optional):
  - Vesna's wreath (3 herbs, WIS 2) halves the gaze.
  - Radek's iron ward (one forged piece) burns the first three spirits to touch the chalk.
- **Winning** seals Viy under the earth (`viySealed`): the hollow empties, everyone has something to say about it, and you become Keeper of the vigil (WIS +1, CHA +1).
- **Breaking** costs only the night: you wake in the Domovyk's bed at seven, with everything you carried, and can try again.

## Quests as data

The quest log and the HUD objective used to be two hand-kept if-chains that could drift apart. `systems/quests.ts` now lists every quest once: its section, title, done-test, detail and objective, all derived from the save. A priority list picks the active one. On Lysa Hora the sabbath comes first; at night, with the chalk in hand, the vigil does.

## Two languages, ready to port

All player-facing text moved out of code into `content/locales/uk.json` and `en.json`: about 820 strings, read with `t()`. **Ukrainian is the default.** In Ukrainian the names are simply the real words (Залісся, Мирослав, Вій, знахарка, нечисть); in English they keep the transliteration rules. The language is picked on the title screen or in the Character sheet; switching saves and reloads, because text is resolved at startup. Logic that leaned on English text, such as fish names deciding the catch, now uses ids. Templates were rewritten so that no grammar lives in code.

With native mobile and Steam Deck ports in mind (`PORTING.md`), controllers now work through the browser Gamepad API:
- the stick or d-pad walks;
- A interacts, B goes back;
- the shoulder buttons are LOOK AWAY in the vigil;
- in dialogues and sheets the d-pad moves a visible focus.

The touch controls hide while a pad is in use.

## Feedback round 1

- **Controls:** on the web (Pages) build the cross pad is gone. A floating joystick appears wherever the thumb lands and follows the drag. Muse keeps its D-pad, because Muse's pull-to-refresh steals drags.
- **Ukrainian proofreading:**
  - villagers are «селяни», not «хатні»;
  - the Domovyk says «господарику», and the Bolotianyk's "dry one" is «сухоногий»;
  - Vesna addresses the player as «знахарю»;
  - the sheet is «Персонаж», with «Характеристики» for the stats;
  - Nerve is «Мужність»;
  - Viy roars Gogol's own words: «Підніміть мені повіки: не бачу!»

## The Cossack pivot: a kobzar on the khutir

The setting moved from a generic Slavic village to a **Cossack khutir** in Gogol's Ukraine, and the player became a **wandering kobzar**. All the content was rewritten, Ukrainian first, in Gogol's tone: short, cheeky, colloquial lines that turn genuinely frightening around Viy. English is now the translation.
- **People:** Myroslav is the khutir's otaman, an old Zaporozhian. Radek is a Pole who fled his lord, which makes for jokes and friction. Karas soup became kulish, and the forge turns out horseshoes.

**The kobza** is the new core mechanic (`systems/songs.ts`, `dialogue/songTopics.ts`):
- **Songs:** you start knowing the *Duma of Cossack Holota*. Vesna teaches a lullaby, the Chort or Motrya teach the hopak, and the otaman gives the *Duma of the Black Sea storm* with the chalk.
- **Evenings** (18:00–23:30): play for the khutir at the campfire, once an evening. The listeners pay in kulish, and **Music** grows. Music is a sixth skill, and its level is now your **Charisma** (meeting people no longer raises CHA).
- **The lullaby:** sung in the Domovyk's hut, it makes you wake rested, with CON +1 until the next dawn.
- **The hopak:** Lysa Hora's sabbath dances only to it. You play, the witches dance.
- **The vigil:** WARD became **Duma**. The kobzar sings through Viy's night, and his Charisma decides how far the duma carries.

## Chumaky, a dilemma, and songs for every mood

**The song catalog** grows to eight real folk songs, referenced by title only:
- happy: the hopak, «Ой на горі та й женці жнуть» (from the otaman), «Розпрягайте, хлопці, коней» (from Radek);
- neutral: the duma of Holota, the lullaby, «Ой ви, воли мої половії»;
- sad: «Ой полечко, поле», the storm duma.

**Every evening has a mood too:**
- **Sad:** mourning after a death, a wake every fifth day.
- **Happy:** a betrothal every third day, or a feast with the chumaky.
- **Neutral:** an ordinary night.

The kobzar reads the room:
- a matching song gives Music +2 and a bowl of kulish;
- a neutral song or a neutral evening gives Music +1 and kulish;
- a happy song at a wake, or a sad one at a feast, gets frowns and no kulish.

**The chumak caravan** is the first real moral dilemma (`systems/chumaky.ts`). On day 2 a salt caravan camps on the east road, and young Ostap is dying of marsh fever. The otaman, who buried his mother in a plague that a chumak caravan brought when he was seven, bars the road and forbids Vesna to go. You have until dawn:
- **Persuade the otaman.** This needs CHA 3, the khutir's trust earned by playing for it. Vesna goes openly, Ostap lives, and the otaman asks forgiveness.
- **Defy the otaman.** Take Ostap a tonic, brewed yourself or slipped to you by Vesna. Ostap lives; the otaman knows, and says you were right — "don't get used to it".
- **Do nothing, or not in time.** Ostap dies at dawn, the chumaky bury him by the road and sing «Ой полечко, поле», and the khutir mourns. The otaman lives with "forty saved from something that wasn't there, and one lost".

Every outcome teaches songs: Ostap himself, or Hnat at the grave. The grave stays as a place to play. Radek, once kept outside a khutir's fence himself, and the Chort ("people are their own devils") each see it their own way.

## The khutir looks Cossack

The northern log cabins became **Ukrainian khaty**: whitewashed clay walls, hipped thatch with thick rounded eaves, small blue-framed windows with painted flowers, and an ochre призьба (clay bench) along the wall (`render/khutir.ts`).
- **New details:**
  - **Around the khaty:** the well is a **журавель** (crane well), fences are woven **тин** with clay pots on the stakes, cherry trees stand by the khaty, and sunflowers and mallows grow along the yards.
  - **Around the edges:** willows lean over the pond, and silver feather grass (ковила) grows on the steppe side.
- **New landmarks:** a **windmill** on the rise by the Chort's old millstone, and a **kurhan with a stone idol** where the khutir gives way to the steppe.
- **Layout:** a trodden **maidan** around the fire and the well, cart ruts on the chumak road east, and **the otaman's own khata** facing the maidan.

Every door, quest spot and NPC kept its position.

## One world: walking to Lysa Hora

Lysa Hora is no longer a separate map you teleport to. The world is now 3980×1260: the khutir, then a wide **steppe** east of it, then the Bald Mountain at the far end, which you walk to.
- **The steppe:** the grass dries to gold-green, feather grass waves everywhere, and lone oaks and a second kurhan stand along the way. The trail winds north-east to the mountain, and the chumak road bends south toward Crimea.
- **The mountain:** it keeps its own bald moonlit rock (drawn in its local coordinates and feathered into the grass at its foot). The air thickens with a cold blue wash over the last stretch.
- **Regions:** `village` and `lysa` are now regions of one world, and the HUD and the sabbath's rules switch as you cross. Old saves on the mountain are moved onto it.
- **The Chort** keeps two addresses: the millstone by day, the sabbath by night.

Hut interiors stay separate rooms.

## Fields, a river, forests — and tobacco for the otaman

The world grows south to 3980×2300 (`data/land.ts`, `render/land.ts`).
- **Городи:** kitchen gardens by the last fences, with rows of cabbage, beets, cucumbers, carrots, radish, onion and garlic.
- **Fields:** strip fields of **buckwheat** (white-pink), **barley** (golden ears with awns), **oats** and **hemp**, and another buckwheat field on the steppe. You can walk through them.
- **The river:** it crosses the whole map, with reeds and two plank bridges, one on the khutir's road and one on the chumak road. It can't be waded.
- **Forests:** a large one beyond the river to the south-west, and another below Lysa Hora.

**«Люлька отамана»** (`systems/tobacco.ts`): the otaman has had a pipe and no tobacco since spring.
- The old tobacco field across the river was planted by Taras the Long, who went to the Sich and never came back. Folk say the devil tends it, since tobacco is the devil's herb, and the Chort happily agrees.
- Pick three leaves, strip hemp fibre to tie them, and hang the bundle on Vesna's rack. It dries at the next dawn.
- The otaman smokes Taras's tobacco in long silence and gives you his old Sich pipe, worth +2 Nerve at Viy's vigil.

## The map

The world is big now, so there is a **map** (`ui/MapOverlay.tsx`, `render/map.ts`). Open it with the **Мапа** button in the HUD, the **M** key, or **Y** on a gamepad; the world pauses while it is open.
- **What it shows:** a hand-drawn parchment view of the whole world. It has the khutir's khaty, the gardens and fields, the roads, the pond and river with its bridges, and the forests. It also shows the steppe with its kurhany, Lysa Hora, and the tobacco and hemp fields, plus the chumak cart or the grave when they're there.
- **Markers:** a red marker shows where you stand, and a gold **★** shows where your current quest leads (`questTarget`).
- **Zoom:** «Увесь світ» shows everything, and «Довкола мене» shows a closer view around you.

**The map is a thing you earn** (`dialogue/mapTopics.ts`). There is no Map button until you own one.
- **Hnat's gift:** if Ostap lives, Hnat hands over his **chumak map**, drawn over thirty years on the road.
- **The Chort's sale:** the Chort sells his **devil's map** (it smells of sulphur) for **3 fish**, by the millstone or on the mountain. He won't take his own gold back.

Without a map, M and the Y button only say where one can be had.

## Walking into the khaty

The two khaty with insides, the Domovyk's and Vesna's, are no longer separate rooms you teleport into.
- **Bigger and in the world:** they are now nearly twice the size and stand in the world (`data/houses.ts`). Their walls have a real door in the middle of the front wall.
- **The roof lifts:** walk through the door and the roof fades away to show the room, with the same pich, bed, table, rug and cauldron as before, scaled into the footprint. Walk out and it settles back.
- **Lamplight:** at night the room keeps a warm glow.
- **Residents:** the Domovyk now really lives inside, by his pich.
- **Rearranged:** Vesna's garden, a herb patch, the kurhan and the yard flowers moved to make room, and the pond shifted south so there's space outside Vesna's door.
- **Unchanged:** the bed, the bread offering and the Domovyk's gift work where they always did, inside.

The otaman's khata and the north-east hut are still closed façades.

## Inside a khata

The rooms used to be the old separate-area interiors shrunk into the new footprints, so a log cabin with a plank floor sat inside a whitewashed Cossack khata. Now each room is drawn at world scale and laid out the way a Ukrainian khata was:

- **Walls and floor:** whitewashed walls with a painted blue band and little flowers on the back wall, and a clay floor (dolivka) with a woven runner from the door.
- **Pich:** a painted pich in the corner by the door, with its mouth open to the room, a fire inside and an ukhvat leaning against it.
- **Pokut:** diagonal from the pich, an icon under a rushnyk with a lampadka, and the table under them with a cloth and a kahanets.
- **Lavy:** benches along the walls.
- **Pil:** the plank sleeping platform, with a lizhnyk and pillows.
- **Mysnyk:** a dish shelf by the door.

The Domovyk's khata also has a painted skrynia, a sabre and lyulka on the wall, a palianytsia on the table and a broom by the door. The Domovyk sits in the nook between the pil and the pich, and his crust and gift lie on the pripichok in front of the pich's mouth.

Vesna's khata has herbs drying on a pole under the ceiling, a stand of tinctures, her mortar and book of cures, a pot of something green bubbling in the pich, and a cat asleep on top of it.

Furniture has collision at world scale. Only the sleep, offering and talk spots moved: they are spaced so each prompt can be reached on its own.

## The otaman's khata

The third khata on the maidan was a closed façade the same size as the others. Now it is Myroslav's house, you can walk into it, and it is meant to look unlike any other house on the khutir:

- **Outside:** it is longer, and the whitewash is tinted blue. It has a shingled (gont) roof instead of thatch, a brick chimney, red shutters on four windows, and a carved porch over a green double door. A crimson korohva with a gold cross stands by the porch.
- **Layout:** the house is built "through the siny". The front door opens into a clay-floored passage with a ladder to the loft, a barrel and a saddle on a peg. Doors lead off it left and right.
- **Left room:** the working khata, with the pich (borshch in its mouth, a palianytsia cooling on top), the pil, a bench and a bread trough with dough rising under a cloth.
- **Right room:** the svitlytsia, the clean room where the otaman receives people. It has a plank floor, a kylym, sabres, pistols and a musket on a red cloth, and a red skrynia with his kuntush on the lid. His table holds the pernach, papers, an inkwell and a brass candlestick, with a carved chair at its head.

Two herb spots that ended up inside the walls moved out into the yards.

## The korchma

Past the khutir, where the chumak road turns south toward the river, there is now a korchma. Like the khaty, you walk into it.

- **Outside:** it is a long log house rather than a clay one, with a shaggy dark thatch and small lamplit windows. The door stands open with warm light spilling out, and a vykha (a sheaf of straw on a pole) hangs over it. There are barrels, a bench and a hitching rail.
- **Inside:** one smoky hall. The shynkvas runs across the back, with barrels and shelves of mugs behind it. Okhrim's three winters of debt are chalked on its front. There are two long tables with benches, the pich by the door, a cellar hatch and a dog asleep.
- **Odarka**, the shynkarka, keeps it. Her husband rode to the Sich seven years ago. She sells supper (a meal) for one fish, passes on news from the road, and teaches «Ти ж мене підманула».
- **Okhrim** is the last of his kurin. He drinks on credit and Odarka never collects, because she hopes someone out there is feeding her Stepan the same way. He talks about the Sich and about the friend who looked at Viy, and teaches «Їхав козак за Дунай».
- **Playing:** in the evening you can play here instead of at the campfire. You still play only once an evening, so it is a choice. The korchma has moods of its own: merry most nights, maudlin every fourth night, quiet when the khutir mourns, and roaring when the chumaky feast. On the same night the two rooms often want different songs. Odarka pays in varenyky.

## The khutir in a horseshoe

The owner sent a photo of the reconstructed Zaporozhian Sich: houses ringed round a square with a wooden church in the middle. Zalissya is a khutir, not the Sich, so it gets that plan without the palisade and the gate.

- **The maidan** stays the heart of the khutir, with the fire where the kobzar plays. A small log kaplytsia with one onion dome and a gold cross now stands at its head, and the crane well has moved to its east side.
- **The ring:** the houses stand in a horseshoe round the maidan, open to the south: the otaman's khata at the head (its porch and korohva looking down on the chapel), the Domovyk's khata north-west, the forge west on the road, the north-east hut, and Vesna's khata on the east side over the road.
- **Why it opens south:** the camera looks from the south, so every door is on a south wall. The open side faces the road down to the fields, the pond and the river.
- **What moved:**
  - The chumak camp is now south-east of the road.
  - The Lysa Hora trail leaves the east road past Vesna's door.
  - Radek, Vesna and the Lisovyk moved with their places.
- **Old saves:** a save standing where a wall or the chapel now is starts again on the road south of the fire.

## The pustka

The last closed façade, the little hut on the north-east of the ring, is now a place you can walk into. It is the pustka, the empty khata of Taras Dovhyi, the Cossack who planted the old tobacco field, rode to the Sich and never came back.

- **Outside:** it is the khutir's khata gone to seed. The whitewash is grey and flaking, the windows are boarded, the door hangs ajar, there is a hole in the thatch, weeds grow along the pryzba and no smoke comes from the chimney. It stands closest of all the houses to Viy's hollow.
- **Inside:** dust and blown-in leaves, cobwebs in the corners, a cold, cracked pich, a sagging pil, a bench on its side and a shaft of light through the roof. The icon has been turned to face the wall.
- **His skrynia:** an empty scabbard, a pouch with no tobacco, and his letter, which leaves the tobacco to the otaman and asks that the hut be left to wait.

While doing this I found that the korchma had no walls to bump into. Every walk-in house now gets its walls and furniture from one list.

## Ground and light

The owner chose to keep the smooth, painted look of the new khaty for the whole game, and the visuals pass started with the two things every screenshot shares.

- **Ground:** the grass used to be a grid of flat 34 px tiles that read as a checkerboard. The whole world's ground is now baked once into a small texture and stretched smoothly over the screen each frame (`render/village.ts`):
  - soft noise patches of green that dry into steppe gold eastward;
  - every road, the maidan, the trail, the korchma's track, and a footpath from every door, worn in with a feathered edge.
- **Grass detail:** tufts of blades, clover and wildflowers are drawn crisp on top. They sit on a jittered grid so nothing tiles, and they stay off the dirt.
- **Light** (`render/light.ts`):
  - The hour has a colour: pink-gold at dawn, a warm golden hour before dusk, violet as the sun goes.
  - Mist lies on the river and the pond at dawn and late at night.
  - Night is a dark layer with holes where light falls: the fire, every lit window (with a pool of light on the ground under it), the korchma's open door, the chapel lamp, and the room the kobzar is in. Then the warm colour of those lights is added back.
  - The pustka stays dark.

## People in the storybook style

The owner was shown three styles for people side by side (refined, realistic, storybook) and chose storybook. Every human figure is now drawn by `render/people.ts`:

- **Proportions:** about five heads tall (50 px, up from 40), painted with soft side shading and a thin ink outline, so they match the khaty.
- **Costumes:** each figure wears the costume of who they are:
  - the kobzar: an embroidered shirt, a brown svytka, sharovary, a straw brryl and the kobza on his back;
  - the otaman: a red zhupan with gold trim, the oseledets, grey moustaches and his smoking lyulka;
  - the chumaky: tarred svytky and straw hats;
  - Radek: a leather apron and his Polish cap;
  - Vesna: plakhta, kersetka, a vinok with ribbons that flutter, and a braid;
  - Odarka: a married woman's kerchief and a white apron;
  - Okhrim: the oseledets and moustaches to his chest.
- **Walking:** legs step, arms swing against them and the body bobs. Faces turn toward the kobzar.
- **Spirits:** they keep their own drawings.

## Worn roads

The owner wanted the roads and the maidan less geometric, with mud, holes and uneven shapes. All of it is in `render/village.ts`.

- **Roads:** every road and footpath is a centreline sampled every few pixels. The road meanders off its line and swells and pinches along it, so no edge is ever straight.
- **The maidan:** a ragged trodden blob instead of an ellipse, dustier in the middle and wet and churned round the well.
- **On the dirt:** laid out once and drawn crisp every frame:
  - puddles, with the sky glinting on them;
  - potholes, with a sunlit lip;
  - patches of wet mud and pebbles;
  - two cart ruts with pale ridges, following the meander of every road the carts use.

The owner said the roads still looked too even and pointed at Drova's ground as the reference: there you read a road by its texture, not its outline. So the ground is now painted per 2 px texel into 256 px tiles, baked as the camera reaches them (two a frame while walking, so nothing stalls).

- **Earth:** dark, mottled brown, with damp hollows and grit.
- **Grass:** deep, uneven greens with sunny patches, drying to gold on the steppe.
- **The edge between them:** torn by noise at two scales, so grass reaches into the road in clumps and bare earth bites into the grass.
- **Crisp detail:** ruts, puddles, potholes and blades are recoloured to sit on the darker earth.

## Creatures in the storybook style

The spirits and the animals now match the people: painted side light, a thin ink outline, faces that read at a glance.

- **Domovyk:** a little shaggy grandad in bast shoes, beard to the floor, his wooden spoon held like a sceptre.
- **Chort:** Gogol's "in front, a German exactly": a black tailcoat over a red waistcoat with a starched collar, a pig's snout, curled horns, goat legs with hooves, a tufted tail, and a polished pitchfork.
- **Lisovyk:** tree-tall, with a bark face, a moss beard, branching antlers, a ragged moss cloak and a staff still in leaf.
- **Bolotianyk:** a frog-faced old man risen to the chest from the pond, draped in weed, a lily on his crown.
- **Viy:** after Gogol: an iron face, dented and rusted. His body is clad in black earth, root-arms grip the ground, the eyelids hang to the ground, and the withered servants hold the forks.
- **The witches and the dancers:** drawn as people (`render/people.ts`, style `witch`) with loose hair and a crooked pointed hat. The dancers dance with their arms up.
- **Others:**
  - Beelzebub sits on a black throne in a crimson-lined robe.
  - Ostap lies on a curly sheepskin.
  - The steppe oxen wear the yoke.
  - The hens are speckled.

## Tree shadows, and animations anchored in the world

- **Shadows:** after Drova, trees cast big, soft, lumpy shadows on the ground, in a pass of their own under everything that stands (`drawTreeShadows`).
  - They follow the sun: long to the west in the morning, short at noon, long to the east in the evening, faint at night.
  - Every trunk sits in a small dark pool where it meets the ground.
  - Leafy crowns got a darker underside and a soft ink edge.
- **Animation fix:** the owner noticed the trees swayed slowly while the kobzar was far and far too fast as he came near.
  - The cause: several animations (willow fronds, cherry sway and even the cherries' positions, spirits' bobbing, people's idle sway, the Lysa dancers, crops) took their phase from the screen position, so the camera scrolling changed their speed.
  - The fix: the frame sets `CAM` (`render/shapes.ts`), and those drawings now take their phase from the world position, `x + CAM.x`.

## Trees in the storybook style

The owner asked to fix the trees and to bring them into the style of the rest of the game. Every tree is now drawn in `render/trees.ts`.

- **Crowns:** each crown is a mass of lobes, painted by one light from the upper left. It has a soft ink outline round the whole shape, leaf clusters picked out in darker strokes, and sunlit dabs on the lit side.
- **Trunks:** tapered, with bark lines and a root flare.
- **Oak vs apple:** the "oaks" were apple trees with red apples, all through the forest. They are real oaks now: a gnarled trunk with crooked limbs and a broad lobed crown of deep green. Apple trees are a kind of their own, planted only in the khaty's orchards.
- **The other kinds:**
  - birch: a slim, slightly leaning white trunk with black marks, a light crown and drooping twigs;
  - spruce: ragged tiers, outlined, with needles along the edges;
  - cherry: small and dense with red berries;
  - willow: a leaning trunk and a curtain of fronds.
- **No shifting:** shapes and sway are seeded by the tree's world position, so nothing shifts as the camera moves.

## Keeping the frame cheap

The owner noticed the game slowed down by the river and in the forest. Profiling showed almost all of the time went to painting the canvas, not to game logic. Thousands of grass strokes, crop plants in the fields, and dozens of paths and gradients per tree were drawn again every frame.

- **Trees:** each kind is painted once in five variants into sprites at the screen's density, then stamped, scaled and skewed from the foot for the sway.
- **Shadows:** every shadow is a stamp of one soft blob.
- **Grass and fields:** the grass tufts, clover, flowers, fields and gardens are baked into transparent 256 px detail tiles over the ground. The most recent 40 are kept, and one tile ahead of the walk is painted on a quiet frame.
- **Vignette:** painted once per screen size.

**Result:** in a software-rendered test browser, walking through the forest by the river went from about 12 to about 22 frames a second, and the worst hitch from about 145 ms to about 65 ms.

**Cost:** the grass and crops no longer sway (the trees still do).

## The river, anchored

The owner saw the river's reeds move as the kobzar walked beside them, and the waves move unnaturally. Both were tied to the camera, not the river:

- the reeds stood on a grid that started at the camera's edge, so they jumped as it scrolled;
- the current's streaks were placed within the camera's window;
- the water's colour bands took their height from the middle of the screen.

Now the reeds stand on a grid of the world and sway slowly. The current is small ripples born on the water, drifting downstream a few dozen pixels while they fade in and out. The shallows are lighter bands drawn along the banks themselves, with a glint on the far bank.

## A living khutir

The khutir now has more life in it than the three hens.

- **Animals** (`systems/critters.ts`, with tests; drawn in `render/animals.ts`):
  - **The otaman's yard dog** trots up to the kobzar when he comes near its yard and sits at his heel. It goes home when he leaves and sleeps by the porch at night. It can be petted ("Погладити пса"), and it has opinions about kobzars.
  - **Geese** wander round the pond and swim in it, and scatter from someone striding into the flock.
  - **A red-and-white cow** grazes on the pasture by the windmill.
  - **A bay horse** is tied at the korchma's rail.
- **The sky:** a stork stands in its nest on a tall pole by the chapel, clattering its bill now and then. Every so often another stork crosses the sky, its shadow sliding over the ground.
- **Small life:** by day, butterflies flutter round the flowers. At night, fireflies glow over the grass and bats circle the pustka and Viy's hollow.
- **Yard things:** washing on a line by the Domovyk's khata, log beehives by the herb garden, haystacks at the field edge, and a hay cart by the forge.
- **Cheap to draw:** everything is anchored to the world and drawn only when on screen.

## Lysa Hora, painted into the world

The mountain was still in the old style: a checkerboard of blue-grey tiles clipped to an oval, a smooth pale trail, standing stones like posts, and stick-figure snags. It was nearly black at night.

- **Rock:** the rock is now part of the world's ground (`render/village.ts`, `mountainAt`): mottled grey-violet stone with lichen and grit, worn pale on the bald crown round the summit.
- **The foot:** it is torn into the dry steppe by noise instead of cut by an oval, and the grass gives out where the rock begins.
- **Detail tiles:** cracks, scree and boulders are baked into them.
- **Trail:** the trail up is one of the world's worn roads, switchbacking to the summit.
- **On the summit:**
  - the standing stones are rough, leaning menhirs with lichen and carved crescents;
  - the dead snags are gnarled, forked and reaching;
  - the crescent moon is shaded.
- **At night:** the sabbath bonfire and the offering stone are light sources, and the moon throws a pale wash over the crown, so the sabbath reads in the dark. The cold wash over the last stretch of steppe is lighter by day and nearly gone at night, where the darkness does that work.

## The khutir keeps a day

The residents now live by the clock (`systems/schedules.ts`, with tests; places in `data/schedules.ts`).

- **Beds:** everyone has a bed of their own, or its like:
  - the otaman on the pil in his khata's west room;
  - Vesna on the pil in hers;
  - Radek on a straw bed by the forge (he is a guest, and a Pole);
  - Odarka on top of the korchma's pich;
  - Okhrim on the korchma's bench he has paid for in chalk.
- **The day:**
  - **Work:** the otaman judges on the maidan, Vesna is at her rack or her herb garden, Radek at the forge, Odarka at the counter.
  - **Midday:** a rest on one of the new benches (on the maidan, before the Domovyk's khata, by the forge, on the pond shore, before the korchma).
  - **Evening:** the khutir gathers round the fire, Vesna and Radek bathing in the pond first.
  - **Night:** home to bed.
- **Lysa Hora:** on some nights, after the khutir sleeps, Okhrim walks up to play cards with the Chort, as Gogol's Cossacks did, every third night. Vesna goes up the slopes for nichnyky every fourth night and will not say why. Met there, each has a line for the kobzar.
- **Walking:** they walk out of doors in straight lines but never through a wall. They make for a khata's door to leave or enter it, pass the partition doors in the otaman's khata, and go round any khata standing in the way. When neither they nor where they are bound is on screen, they are simply there, so sleep and time skips never strand them.
- **Poses:** walking, standing, sitting, sleeping under a blanket, bathing to the chest.
- **Waking sleepers:** a sleeper can be woken. They grumble, then talk as usual, so no story step is ever locked behind the night.
- **Animals:** they keep nights too. The cow goes to her new shed and lies down, the geese settle on the pond's north shore, the hens sit in a row by their new hen-house, and the dog sleeps by the porch.

## The sabbath keeps its hours, and not only witches keep it

The owner pointed out that a sabbath is an evening thing, and that warlocks belong there as well as witches.

- **Hours:** Lysa Hora's sabbath now gathers at dusk and breaks up before the cocks crow, 20:30–04:00 (`systems/sabbath.ts`, tested).
- **The summit by day:** it is empty: cold ash, a black ring of stones, a last thread of smoke, a forgotten broom. The offering, the hopak and Beelzebub's blessing wait for the sabbath.
- **Day hiding places** (`data/hideouts.ts`), each findable, each with a line or two:
  - Solokha sits on the windmill's step by day, "a widow like any widow";
  - Motrya sleeps in the hollow of an old oak in a clearing of the south forest;
  - Opanas, a new warlock in a tall black sheepskin kuchma with a goat's beard, sits in a pit dug under the steppe kurhan's stone baba;
  - Beelzebub snores in a cave on the mountain's north-east slope: you can look in, feel the warm sulphur breath, and back away;
  - the Chort keeps his old day-place by the millstone.
- **Warlocks:** besides Opanas, half the sabbath dancers are warlocks, dancing with their arms up beside the witches.

## Into the windmill

Solokha said she hides in the mill, but the windmill had no inside, so she stood on its step. The windmill is now a walk-in building like the khaty (`HOUSE_RECTS.mlyn`, `MLYN_ROOM`):

- **Outside:** a post mill of weathered boards on its trestle legs, with a little ladder up to the door, a steep board gable and the sails turning on it.
- **Inside:** the walls and roof lift away and the sails grow faint overhead. There are the millstones in their wooden case under the hopper, with flour spilling out, the great cog-wheel turning on the back wall, a grain bin heaped with grain, slumped sacks of flour, a ladder to the loft, and flour dust turning in the shaft of light from the little window.
- **Solokha** sits out the day on a flour sack inside.
- **Nearby:** the cow's pasture moved a little west to make room, and a herb patch that the new walls covered moved beside it.

## Every hiding place is a place

After the windmill, the owner asked that all the sabbath's day hiding places be real, down to the hollow in the tree. Each is now a walk-in building like the khaty (`data/houses.ts`): what stands over the room fades away when the kobzar steps in.

- **The hollow oak** (`duplo`) stands in a clearing of the south forest: a vast trunk with spreading roots under a heavy crown, and the hollow is the door. Inside is a tiny round room on the oak's own rings, with Motrya's nest of moss and feathers, her little cauldron bubbling violet, herbs and frog legs drying on a root, mushrooms, and an owl that blinks.
- **The steppe kurhan** (`kurhan`) is a grassy mound with its stone baba on top and a timbered entrance. It moved a little off the Lysa Hora trail so it blocks nobody's way. Underneath is a cold earthen chamber with roots and timber props, an old grave-slab carved with a sun and two candles burning on it, a goat's skull, and Opanas's straw bed with a spare kuchma on a peg of root.
- **Beelzebub's cave** (`pechera`) is a rock outcrop on Lysa Hora's slope, its mouth breathing warm yellow air while he is home. Inside, stalactites drip, a sulphur pool glows, there is a hoard of tribute (and somebody's boot), and he sleeps by day on a stone bed heaped with black fleeces. He can be woken, briefly: "Come when it's dark."
- **Footpaths:** each place got its footpath like every door. The old look-into-the-cave prompt is gone, since you simply walk in.

**The kaplytsia is walk-in.** The little log chapel at the head of the maidan is now a building like the khaty: a bigger footprint (140×124) between the otaman's porch and the fire, its door facing the fire. Inside it is small and close: the iconostas across the back, red and gold, the holy doors shut, the lampadka burning before them; the analoy with the book left open, the kanun of thin candles for the dead, a bench by each wall, a censer smoking on its hook. The logs and the roof fade when the kobzar steps in; the dome and its cross stay overhead, faintly, like the windmill's sails. At night its two windows glow. The residents' walking learned to go round a house standing between them and a door (Myroslav no longer walks into the chapel on his way home), and not to dither between two corners of the same house.

## Bug hunt: things that remember and things that wait

- **Questions keep their ✓.** A topic you have asked stays marked the next time you talk to that person, not only until Farewell (`systems/askedTopics.ts`). Each person gets one flag (`asked:<npc>:…`) so the 250-flag budget holds; entries hash the topic's id with its label, because some ids are another question in another state (Radek's "home" before and after the forge). Switching language clears the marks.
- **The bed only offers "until nightfall" while nightfall is ahead.** After 21:10 (and until 04:00) the nap slept 23 to 24 hours straight through the night; now only "until morning" is offered then.
- **Dawn news waits its turn.** The chumaky or tobacco news used to replace the waking line and swallow "the kulish and tonics have worn off"; now it shows after it. The Domovyk's "rested" line follows the waking line the same way.
- **Controls:** keys are read by their place, not their letter, so WASD, E and M work on a Ukrainian layout. Nothing walks on after the window loses focus, E/Space do nothing behind the sheet or the map, and the map and the sheet never stack. Start waits until the save is read, so a quick tap can't start a fresh game over it.

## Radek pays in gold

Horseshoes piled up: the iron ward takes one, and at 2 weight each the rest soon filled the satchel and blocked every herb and fish. Now Radek buys them, once his forge is lit, through a new topic, "Horseshoes for gold": every horseshoe in the satchel for a **chervinets** (червінець), the gold ducat a Cossack meant by "gold" (`systems/trade.ts`, `dialogue/trade.ts`). Chervintsi ride in the purse, not the satchel: they weigh nothing, so gold can never soft-lock the game the way the horseshoes did. The Character sheet shows the purse. Nothing sells for gold yet; that is the next thing to build. Coin names follow the era: chervinets for gold, and if silver or copper ever come in, taliar, zlotyi, hrish or shelyah, never anything later or foreign to the Hetmanate.

## Did Prokip, the vorozhbyt

A grumpy old vorozhbyt now lives alone in the south-east forest, past the chumak bridge: a mossy khatka with herbs under the eave, a horse's skull on a stake and a raven on the ridge. Inside are his lit pich, his black cat and a bowl of water he reads (`HOUSE_RECTS.prokip`, `drawProkipKhatka`, `drawProkipInterior`). A footpath runs to him off the chumak road. Vesna is the one who tells you about him, so the quest log only shows him after you have met her (`systems/vorozhbyt.ts`, `dialogue/vorozhbyt.ts`, a "Did Prokip" quest in "life").

- **He makes a fool of you, kindly.** First he sends you to fetch water from the khutir's well in a sieve. You go, and it runs out. Forty years he has handed that sieve to everyone, and you are the first who went. Then he sends you to give Vesna his regards and ask, politely, whether it will rain on Kupala. It sounds like nothing; it is their old sore spot. Vesna, young as she is, was his apprentice as a girl: one Kupala night she said it would rain, he said it wouldn't, it poured, he never admitted it, and she went off to heal on her own (see `CHARACTERS.md`). She chases you off with her broom (out of her khata, or a good few steps from her outdoors) and stays cross: she won't talk to you, only sends you off again. Prokip laughs till he can't stand, tells you why, and sends you to apologize. Once he has, an "Apologize" topic appears with Vesna ("you're just a fool sent by an older fool… and it DID rain"), and all is well. Until you do, her tonics, lullaby and wreath are closed to you (a small "Vesna is cross" thread in the quest log tracks it).
- **Then the serious one.** A **perelesnyk**, the fiery serpent of Ukrainian belief that visits those who grieve too long, flies to the korchma every night in the shape of Odarka's Stepan (drawn in `render/spirits.ts`; it has its own night light). Prokip gives you blessed poppy seed. At the korchma door at night you choose: scatter it and sing, which drives the perelesnyk off and leaves Odarka weeping like a person again, or leave her the night, which she spends happy and a little paler. You can come back and choose again. Odarka and Prokip both have lines for either choice.
- **The reward is permanent.** Prokip spits in your ear, and from then on you understand the beasts. The dog, the geese, the cow (Krasulya) and the korchma's horse each have a few lines of gossip and hints, a sleepy line at night, and the horse remembers the fire. It shows as a keepsake on the Character sheet.
- His menu rebuilds as you ask, so each next errand appears without leaving the conversation.

## The Serpent's Cave and the tunnel under the river

More to find south of the river. Two new walk-in places (`data/houses.ts`: `zmiieva`, `lazna`; who and what is in them: `data/cave.ts`, rules and tests: `systems/cave.ts`):

- **The Serpent's Cave.** A grassy hill with a rocky face, east of the old oak, its black mouth to the south and a faint warm glimmer in it. Inside it is always dark (the night layer runs at full strength underground; the kobzar's little lamp lights a circle round him): a hall with a pool that glows blue-green, glowing mushrooms, stalagmites, two rock ledges, a monk's cell left empty years ago, and the serpent's lair in the north-west corner. Bats hang from the back wall and burst up in a flock when you come near; black-and-yellow cave salamanders scuttle round the pool.
- **Three people.** **Omelko**, a blind old kobzar in the east nook, who teaches the duma «Маруся Богуславка» (sad), tells you why the Zmiy likes only sad songs, and hears the draught from the crack. **Vohnyk**, a little wandering flame over the pool who forgets everything, himself included. And the **Zmiy**, old and sad: he carried off Maryna of Verbivka, she died in his cave, and he lies on her dowry.
- **A roof for Omelko.** Once the perelesnyk has been driven off Odarka's door for good, the empty khata (the pustka) can be made fit to live in, and the blind kobzar moves out of the damp cave into it. Stepping into the pustka now hints at it (the walls are sound; a mended roof and a fire could make it a home). Omelko says from the first meeting that he wants a home of his own (and again if asked), which points the player at the empty khata; Myroslav, whose say it is, gives leave. The work is physical: split six logs at the chopping block in the yard, cut four clumps of reeds on the pond's bank, bind the thatch over the hole (the exterior changes), stack the wood and light the pich (the interior changes). Each act is **Carpentry**, a new skill that feeds **STR** beside Smithing (STR = Smithing level + Carpentry level − 1; thresholds 0/5/12/22/36), and costs a little of the day; the woodpile holds six logs at most, and once the pich is lit it burns one log an hour from 21:00 (the rest is gone by dawn), so the block can be worked again each day, up to six swings, but the skill cannot be farmed without end (`burnLogs`). When everything is done Omelko moves in, the khata is whitewashed and lit at night, and Myroslav, Vesna, Radek, Odarka and Okhrim each have a word of thanks. While the work is on, every place that wants working next (the block until the six logs are in, each uncut reed clump, the ladder, the pich) wears a warm pulsing ring with rising motes, and a pool of light at night, so the way is easy to find (`workTargets`, `drawWorkGlint`; `systems/pustka.ts`, `dialogue/pustka.ts`, `data/pustka.ts`, `render/pustka.ts`).
- **Singing to the serpent.** His coil lies across the way to the back wall while he is awake. Ask what he would like to hear and pick a song: a **sad** one is his own mood, he weeps and sleeps and draws his coil back (Music +3); a **neutral** one he listens to and is unmoved; a **happy** one wakes him and sends the bats up. A wrong song costs nothing: he settles and you may try another. Once he sleeps you can take **her dowry** from under his tail (12 chervintsi, once). It is a small moral choice and nobody comments on it.
- **The hidden tunnel (лаз).** The crack in the lair's back wall, shown once he sleeps, leads into a long timbered tunnel the first men of Zalissya dug against the Tatars: candle niches, stacked boulders you wind between, and a smuggler's camp in the middle where the chumak **Sydir** sells nothing but teaches «Ой не ходи, Грицю» (happy). A sentry's bones lie in the lower lane with his purse (3 chervintsi, once). At the far end a ladder climbs to a **hatch under the rug in the kaplytsia**: the tunnel is a shortcut from the south forest to the heart of the khutir. Each way through fades to black and lands you at the other end; the hatch can be lifted once you know about it, and you can come the other way (up the ladder from the tunnel, then down the hatch) without ever meeting the serpent.
- **Hearing of it.** Myroslav tells you of the hill (it goes on the map as «Змієва печера»), and Okhrim of the hatch (a dashed line appears on the map from the cave to the kaplytsia). Walking into the cave also marks it.
- **No soft-locks (tested).** The coil is a movable solid and the crack and both tunnel ends are always usable, so you can't wall yourself in: from the tunnel you arrive in the lair, behind the coil, and may sing from there or go back. `systems/cave.test.ts` flood-fills the rooms to prove it, and that the tunnel can't be reached from outside.

**The pond, a swim, and the Bolotianyk's bog.** The khutir's pond is no longer an ellipse. Its shore wanders (`pondR` in `data/village.ts`): a bay to the north-east, a straighter bank on the west where people fish, a band of wet mud and sedge round it, paler shallows, clumps of reeds and cattails, more lilies, and no tree standing in the water (willows lean over it from the bank). The kobzar can **swim**. On the bank the prompt «Скупатися» takes him in, clothes left on the grass; he swims slowly about the pond, drawn in the water to the chest like the residents who bathe there, and «Вийти на берег» brings him out at the nearest dry place. The first swim of the day washes the road off: fresh until dawn, CHA +1 (`bathed`, one of the until-dawn flags). By night the water is black and warm, and the toast remembers the drowned girls of Gogol's May night. A save made in the water loads in the water. The **Bolotianyk** no longer sits in the khutir's pond, where he crowded the geese and the swimmers. He lives far off in a **boloto** of his own in the south-west forest past the river (`BOLOTO`, `BOLOTO_POOLS` in `data/land.ts`): black pools skinned with duckweed, tussocks, reeds, two dead birches standing in the water, and will-o'-the-wisps over it at night. A footpath leaves the south road past the bridge and peters out at its edge. His lines now speak of his bog, and of the khutir's pond as water that comes down to him in the end. Myroslav warns you off the bog over the river, Vesna says the pond is clean for swimming, and the geese have an opinion. The map shows both.

**Did Prokip moved, and his path is walkable.** The tunnel's ridge (`lazna`) went in on top of his first footprint and path, and tree trunks became solid, so his door opened into rock and the path was choked with trees. His khatka now stands just east of the ridge's end (`HOUSE_RECTS.prokip`), the path (`PROKIP_PATH` in `data/land.ts`) runs between the river and the ridge and round to his door from the south, no forest tree grows on it, and a small yard before the door is clear. `data/paths.test.ts` checks that nothing solid stands anywhere on the path. A save made at the old spot wakes inside the new hut.

**The fire is for songs; the pot moved to a kabytsia.** The fire on the maidan lost its tripod and cauldron: it is the place where the khutir gathers of an evening, Myroslav and Vesna on the two logs, and where the kobzar plays. The «Заграти на кобзі» prompt now answers from any side of the fire rather than from one spot east of it that Vesna was sitting on, and no cooking prompt competes with it. Cooking (a fish and a herb make kulish) moved to a **kabytsia**, a little whitewashed clay summer hearth painted with a red zigzag, embers in its mouth and a clay pot steaming on top. It stands across the road from Vesna's khata, on the path down to the pond where the fish come from (`KABYTSIA`, `COOK_SPOT` in `data/items.ts`; `drawKabytsia`). Vesna's lines and the quest log point there, and so does the map's quest star.

**Secret quests.** The small things of khutir life are no longer written in the quest log before you do them, the way the Serpent's Cave never was. That covers meeting the villagers, the herbs for Vesna, the first evening at the fire, the spirits and the dark ones, the Domovyk's bread, the forge, the first fish, kulish, the anvil, the tonic and the first walk to Lysa Hora. People in the khutir tell you of them; the log only remembers what you found. When one is done, a toast says «✦ Знайдено: …» and it appears in the log with its tick. The written story starts when the otaman tells you of Viy (the "look upon Viy" quest shows once you have talked to Myroslav). The sabbath is written down once you have climbed Lysa Hora. With the chalk in hand, the vigil is the objective by day and night alike. The side threads (the chumaky's fever, the otaman's pipe, Did Prokip, Vesna's anger, a sold soul) stay in the log as before. A new game starts with an empty book and the line «Залісся — твій дім. Вогонь теплий, а Вій досі спить». A note in the book says not everything is written down (`secret` in `systems/quests.ts`).

**The kobzar sits down to play.** The fire on the maidan has a third log on its near side, facing the khutir (`FIRE_SEAT` in `data/village.ts`): the kobzar's. When he plays of an evening he takes it, and for as long as the song and the khutir's answer last he is drawn seated, the kobza on his knees, the right hand strumming and three little notes drifting up and fading (the new `play` pose in `render/people.ts`, `drawKobzaPlayed`). Radek, who used to sit on that side, now sits a little apart to the east.

## The satchel is a list

The Character sheet's satchel used to be a paragraph of emoji and three buttons under the Stats and Skills tabs. It is now its own tab, **Satchel** (Торба), and an embroidered list (picked by the owner out of four mockups: a grid, this list, pockets on a drawn bag, and a quick wheel). The wheel stays on the list of ideas for eating and drinking from the world, if it is ever wanted.

- **The load is a stitched bar** (red and black cross-stitch, like a rushnyk) with «Несеш 9 / 10» beside it; it turns red at the limit, and the old "over the limit" note stays.
- **Four groups, only for what is in hand:** food and tonics, gathered things, iron, and the purse. A row you have none of is left out, so the list never spoils what you have not met yet; the last kulish eaten takes its row with it, and an empty satchel says so. Each row has an ink-line icon, what it weighs ("weight 1 · 2 in all", or "weighs nothing" for nichnyky, chervintsi, kulish and tonics) and its count.
- **Kulish and the two tonics have an Eat / Drink button** on the row (44 px tall, for thumbs). Bog iron says it is hauled in the arms for Radek, and drops out once he has it, the same way `carriedWeight` counts it.
- **Songs and keepsakes** are two folds under the list («Пісні · 4», «Пам'ятки · 5»), each opening as a list, one song or keepsake to a row.
- **One source for weights.** `UNIT_WEIGHT` in `systems/carry.ts` feeds both the carry limit and the list; `systems/satchel.ts` decides which rows exist (tested: the rows add up to `carriedWeight`), `ui/SatchelIcon.tsx` draws the icons, and App.tsx only lays them out. The tab row now wraps and its buttons are 44 px tall.

**The world rests behind the sheet.** With the Character sheet or the map open, the world is covered and its clock is stopped, but the frame loop kept repainting it every frame. On a phone that left the main thread so busy that taps on the sheet (Eat, Drink) landed late or seemed not to land: under a 4× CPU slowdown a frame took about 110 ms, and now takes 17. The loop paints the world once when a sheet or the map opens, then idles until it closes (and paints again if the screen is resized). The vigil is exempt.


## The underground gets its own band

The Serpent's Cave and the tunnel used to be rectangles standing on the surface: the cave's 760×460 hill and the tunnel's 1200×300 ridge took forest and steppe the player could not use, trees had to be cleared round them, the map special-cased them, and the ridge once sat on top of Did Prokip's path. Now they lie **below the open world, in the same coordinate space** (`UNDER_TOP`, y 2400 and down, `world/areas.ts`), side by side and off every map. The surface shows only what a hill would: a small rocky hill with the cave's black mouth (`CAVE_HILL`, a wall you cannot walk onto), and nothing at all for the tunnel. Both old footprints are free land again (forest and steppe).

- **The mouth is a spot, not a door.** In front of the hill the prompt says «Увійти до печери»; inside, at the foot of the hall, «Вийти на світло». Like the crack, the ladder and the hatch, each is a fade to black and an arrival (`caveMouth`, `caveExit`). It says nothing and teaches nothing; the cave's own entering line still plays.
- **The camera stays in the room underground** (centred when the room is smaller than the screen), and the dark around it is plain black.
- **The map** shows the kobzar at the cave's mouth while he is underground (a point on the line to the kaplytsia while he is in the tunnel).
- **Old saves** made inside the cave or the tunnel wake in the same spot of the new room. A save made after the move carries the `ugBand` flag, so someone standing where the old cave was, on the surface, stays on the surface. New games and resets set it too.
- **Tested:** no underground room touches the surface (or each other), the surface holds no underground wall, the hill is solid but its mouth is reachable, and the camera, map and migration helpers.

## Review sweep and cleanup (known open issue: gold)

The first review sweep (see `REVIEW.md`) found one player-visible bug (a render crash on Lysa Hora: the kabytsia's steam phase came from its screen x, so the draw list was cut short every frame there; fixed, with `render/offscreen.test.ts`) and a lot of drift, now cleaned up: one set of counter helpers in `systems/flags.ts`, shared dialogue and drawing helpers, the dead hut-map code gone, and two CI guards (`i18n/keys.test.ts`, `save/limits.test.ts`). Apart from that fix, nothing about play changed, except that the English text says "hut" throughout and Radek no longer promises a horseshoe with your initial. **Known open issue:** gold is unlimited. Forging a horseshoe costs no iron and the trade buys each one for a chervinets, so the Serpent's dowry (`HOARD_COINS`, `POUCH_COINS`) has no stake. It is left in on purpose and recorded in `REVIEW.md`, to be fixed before anything else is sold or bought for chervintsi.

**The road in.** A new game no longer starts in the middle of the khutir. The kobzar starts on the forest road at the south edge of the world (`ROAD_START` in `world/areas.ts`), with the line «Лісова дорога, кобза за плечима…». The khutir's south road now runs on through the forest to the edge, its trees cleared, and the landscape leads him north: the forest opens on the hollow oak and the bridge, then the river, the strip fields and the kitchen gardens. Signposts (`SIGNPOSTS` in `data/village.ts`, `drawSignpost`) stand where he might doubt the way. One stands at the forest road («Залісся» with an arrow up the road). One stands at the fork where the bog path leaves west («Залісся» ahead, «Болото» to the left). The last, «Хутір Залісся», stands where the fields end, opposite a wayside cross with a rushnyk and field flowers at its foot (`WAYSIDE_CROSS`). The objective line follows him: «Дорога веде на північ — до Залісся», then, once he comes up out of the fields into the khutir (flag `arrived`, with the toast «Залісся. Над хатами дим…»), «Пошукай отамана на майдані, біля каплиці», until he has spoken to Myroslav. Old saves are marked `arrived` on load. Signposts read their words from the locales (`sign.*`).
