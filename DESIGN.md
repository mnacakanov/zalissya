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
