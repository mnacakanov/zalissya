# Design notes

How the game grew, one build at a time. This was the header comment of the original single-file `App.tsx`, and it is kept here as the design record. Add a paragraph when a build changes how the game works.

Zalissya — a Ukrainian village clearing. Top-down pixel-art game on canvas. All names use Ukrainian romanization (the system S.T.A.L.K.E.R. 2 uses: Chornobyl, not Chernobyl) — г→h, х→kh, ч→ch, ш→sh, щ→shch, ц→ts, ж→zh, ю→yu, я→ya, є→ye, ї→yi, и→y.

## Movement

Hold-to-move direction pad (bottom-left), WASD / arrows on desktop. NOT a drag joystick: on the user's phone a downward drag is claimed by the host's pull-to-refresh before the page can use it, and two generations of page-level locks (overscroll-behavior, touch-action, non-passive touchmove prevention, scroller snapping) did not stop it — a stationary hold produces no refresh gesture at all.

## Skills grow by doing

Gathering any herb raises Herbalism.

## Naming rule

Villages, people, spirits/monsters and herbs keep Ukrainian names (Zalissya, Myroslav, Lisovyk; herbs: Kropyva, Polyn, Kalendula, Zvirobij, Derevij); skill names stay English (Herbalism).

Spirits are real presences, not just dialogue mentions: the Domovyk keeps to the hut by the pich, the Lisovyk walks the pine edge, a Chort (Чорт) lounges by the old millstone offering to buy your soul (a nod to the devil host of Dakhno's Cossacks cartoons and their mill sabbath), the Bolotianyk (болотяник) rises from the pond shallows, and Vij (Вій) — the game's big boss — sleeps in a hollow at the north-east forest edge, eyelids hanging to the ground. He is approachable and ominous, but the boss fight itself is not built yet: nobody wakes him. For now.

Houses are called huts in English (user direction — no "khata").

## Non-combat village life

Fishing at the pond with a bite-timing minigame (Fishing skill grows by catching), a crust of bread by the campfire that the Domovyk is waiting for (offer it at his hut's pich for a keepsake), the Chort's bargain as a REAL choice — sign and he takes your shadow, then buy your soul back with fish — a wishing well, bog iron in the pond mud for Radek's cold forge, chickens that scatter, and a satchel of keepsakes in the HUD. Quest state lives in save "flags" (plain names, plus "name=n" counters like "fish=3").

## Stats & skills

The classic six stats — STR, DEX, CON, INT, WIS, CHA — all start at 1, KCD-style: a stat's base IS the level of the skill that feeds it (Smithing→STR, Fishing→DEX, Cooking→CON, Alchemy→INT, Herbalism→WIS; CHA grows as you meet people). Skills grow only by doing. Keepsakes and tonics add bonuses on top, and the totals bite back into the world: DEX widens the fishing bite window, CON is walking pace, WIS finds double herbs, INT brews double tonics, and a silver tongue (CHA ≥ 4) talks the Chort's soul price down from 3 fish to 2. New work: cook karas soup at the campfire (1 fish + 1 herb), work Radek's lit forge, and brew tonics at Vesna's drying rack by the north-east hut (2 herbs). Spendable stocks live in flags too: "herbStock=n" herbs in hand, "fish=n" fish in hand, "fishTotal=n" lifetime catch (drives Fishing level), "cooked=n"/"meals=n", "smithed=n"/"forged=n", "brewed=n"/"potions=n".

## Stat-influenced activities

The totals now GATE and SHAPE the work itself. Carry capacity is 6 + 2×STR total (weights: bog iron 3, forged piece 2, fish 1, herb 1, nichnyky 0) — a full satchel blocks pickups with a toast naming the weight and your STR, and iron for Radek is hauled in your arms (it counts toward the load once dug, but the dig itself is checked against your satchel load so the forge quest can never soft-lock). Alchemy has tiers: at INT ≥ 3 the rack offers a recipe choice and Vesna's strong tonic unlocks (3 herbs; INT +2, WIS +2 drunk — "strongPotions=n" / "strongtonic"). Honest stat checks with visible failures that consume nothing: the deepest bog-iron lump takes a STR check (certain at STR 3, a gamble below), Zvirobij will not be known until WIS 2, the well's lucky pebble answers a CHA-scaled roll, and DEX tilts the catch table toward pike and perch and away from the boot.

## Lysa Hora

A second area — the Bald Mountain — reached by walking the east trail out of the clearing (and back the same way). A bare, rocky, moonlit summit where the Chort hosts a sabbath: witches dance around a great bonfire, Beelzebub presides, broomsticks lean on the standing stones. A non-combat chain lives there: gather nichnyky (night-blooms) on the slopes → lay them on the offering stone → join the dance → receive the Moonstone keepsake (WIS +1, CHA +1). The save now carries the current area alongside x/y, so a reload restores the player on whichever side of the trail they left.

## Branching dialogue

Conversations are topic-driven. Talking opens a short greeting (full introduction first time, brief welcome after), then a menu of questions the player picks in any order — answers are 1–3 lines, state-aware because they are dealt out of the same linesFor/linesForLysa scripts by subject, and asked topics stay available, marked ✓. The scripted beats stay scripted: Vij's narration, the well, the brew bench, the Chort's bargain (now a topic whose answer ends in the Sign / Keep my soul choice), the soul buy-back, and Beelzebub's blessing (a topic after the dance).

## Hut interiors

Two of the village huts have insides now — "hut0", the Domovyk's north-west hut (his pich lives there, and the bread offering + his gift of thanks happen at the pich INSIDE now), and "hut1", Vesna's south-east hut — the one she actually stands beside, by her garden (bed, work table, a cauldron corner, herb bundles overhead). The forge hut and the north-east hut stay facades — no prompt, no entry. Entering is walking into the door (the Lysa trail pattern) or the Step inside prompt at the door; leaving is walking out of the interior's south door or its prompt. Each interior is its own small area with its own spawn just inside the door, and the save's area round-trips it like Lysa Hora — the area column is plain text, so hut0/hut1 needed only the action enum widened, no migration. World geometry is interior-sized, so the camera follows the same clamp math with nothing special-cased.

## Slim HUD + quest log

The always-on overlay had grown to duplicate the Character sheet (skill levels, stat totals, carrying, keepsakes), so it now shows only what a player needs at a glance — where they are, the current objective, and two urgent warnings (soulless, over the carry limit). Everything else lives in the Character sheet. The single-line objective also hid the parallel threads (the Domovyk's bread, Radek's forge, the Lysa sabbath…), so a Quests menu joins Character in the same sheet: every thread with its progress, the current step marked, grouped as Story / Village life / Lysa Hora. Quest state is derived from the same flags and counters as everything else — no new storage.
