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
