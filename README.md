# Zalissya

A 2D top-down pixel-art action RPG set in a Ukrainian folklore village — built as a Muse web app. No classes, no XP pool: skills grow by doing (KCD-style), perks and unlocks come from milestones, and the six D&D stats (STR/DEX/CON/INT/WIS/CHA) all start at 1 and are derived from skill levels plus item bonuses.

## What's in the game

- **Zalissya village** — huts (two enterable, with interiors), a well, a forge, a campfire, a pond, a forest ring. Villagers: Starosta Myroslav, Vesna the znak harka, and Radek, a Polish smith visiting from a faraway village.
- **Spirits and monsters** — Domovyk (house spirit), Lisovyk (forest spirit), the Chort (a Dakhno-style devil who bargains for your soul — he takes your shadow too; fish buy it back), the Bolotianyk in the pond, and **Viy (Вій)** sleeping in a blighted hollow: the big boss, seeded but not yet fightable (no combat system yet, by design — non-combat features come first).
- **Lysa Hora (Bald Mountain)** — a second area east of the clearing: a sabbath summit with Beelzebub, the witches Solokha and Motrya, night-blooms (nichnyky), an offering stone, a dance, and the Moonstone keepsake.
- **Skills** — Herbalism, Fishing, Cooking, Smithing, Alchemy. Five gatherable herbs: Kropyva, Polyn, Kalendula, Zvirobij, Derevij.
- **Systems** — carry capacity from STR (bog iron is heavy), alchemy tiers gated by INT, stat checks (WIS 2 for Zvirobij, CHA rolls at the well, DEX tilts fishing), keepsake bonuses (horseshoe +1 STR, devil's gold +2 CHA, being soulless −1 WIS…), topic-based dialogue (you pick the questions; the Chort never re-offers a refused bargain), a Character sheet (Stats / Skills / Satchel), and a Quests log.
- **Controls** — hold-to-move D-pad in a cross layout; corner cells hold both neighbouring directions for diagonals; WASD/arrows on desktop. (A floating joystick was tried first — the host shell's pull-to-refresh kept stealing downward drags, so drag controls were removed entirely. Don't re-add them.)

## Naming rules (please keep)

- Ukrainian transliteration (S.T.A.L.K.E.R. 2 model) for **villages, people, spirits/monsters, and herbs**: Zalissya, Myroslav, Lisovyk, Domovyk, Viy, Kropyva.
- **Skill names stay English** (Herbalism, not Zillyaznavstvo). Common buildings are English too: **huts**, not khaty.
- Radek is the exception: a Polish name for a Polish character.

## Layout

- `client/src/App.tsx` — essentially the whole game (rendering, world, dialogue, systems)
- `client/src/api.ts`, `client/src/theme.css`, `client/src/main.tsx`
- `server/src/actions.ts` + `server/src/schema.ts` — the save system (getSave / saveProgress)
- `drizzle/` — database migrations for the save table

## Important: running it outside Muse

This was authored as a **Muse fullstack web artifact**. The client is plain TypeScript/React-style canvas code, but saving/loading goes through the server actions in `server/src/actions.ts`, backed by a database that Muse hosts (`app.db` is deliberately **not** in this repo — it contains personal save data).

To run it standalone (e.g. GitHub Pages), replace the save actions with `localStorage` equivalents — the client only depends on `getSave` / `saveProgress` shapes in `client/src/api.ts`, so the swap is small. Everything else (rendering, input, dialogue, game logic) is self-contained in the client.
