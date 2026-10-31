# Zalissya

**Adding content?** Read [`CLAUDE.md`](CLAUDE.md) (rules and layout) and [`CONTENT_GUIDE.md`](CONTENT_GUIDE.md) (setting, voice, art style, step-by-step recipes).

A 2D top-down RPG, painted in a storybook style, on a Cossack khutir in Gogol's Ukraine. You are a wandering kobzar: you learn songs, play for the khutir by the evening fire, and sing a duma all night to keep Viy asleep. No classes, no XP pool: skills grow by doing (KCD-style), and the six D&D stats (STR/DEX/CON/INT/WIS/CHA) all start at 1 and are derived from skill levels plus keepsake bonuses.

The game is in **Ukrainian** (the default) and **English**; switch on the title screen. It plays with touch, keyboard, or a gamepad (Steam Deck included).

It runs in two places from one codebase:
- **Muse**, the original fullstack web app, which saves on the server.
- **GitHub Pages**, a static site that saves in the browser. It deploys automatically from `main`.

## What's in the game

- **Zalissya village**: huts (two enterable), a well, a forge, a campfire, a pond and a forest ring.
  - Otaman Myroslav (an old Zaporozhian), Vesna the znakharka, and Radek, a Polish smith who ran from his lord.
- **Spirits and monsters**:
  - the Domovyk, the house spirit;
  - the Lisovyk, the forest spirit;
  - the Chort, a Dakhno-style devil who bargains for your soul, and your shadow with it;
  - the Bolotianyk in the pond;
  - **Viy (Вій)**, asleep in a blighted hollow.
- **Viy's night**: once you have looked upon Viy, he stirs.
  - Myroslav teaches the old way (blessed chalk). Vesna can weave a wreath against his gaze, and Radek can forge an iron ward.
  - After dark, hold the chalk circle through one night. Ward off the nechyst, look away when Viy roars for his eyelids, and survive until the rooster crows.
- **Lysa Hora (Bald Mountain)**: a sabbath summit east of the clearing, with Beelzebub, the witches Solokha and Motrya, night-blooms (nichnyky), an offering stone, a dance, and the Moonstone keepsake.
- **Day and night**: a day passes in about ten minutes. Meals and tonics last until dawn, the village darkens at night, and you can sleep in the Domovyk's bed until morning or nightfall.
- **Skills**: Music (the kobza), Herbalism, Fishing, Cooking, Smithing, Alchemy. Five gatherable herbs: Kropyva, Polyn, Kalendula, Zvirobiy, Dereviy.
- **Systems**:
  - carry capacity from STR, and alchemy tiers gated by INT;
  - honest stat checks, and keepsake bonuses;
  - topic-based dialogue, a Character sheet (Stats / Skills / Satchel), and a quest log.
- **Controls**:
  - Hold-to-move D-pad, plus WASD/arrows. E or Space interacts.
  - On GitHub Pages, a floating joystick is available through the Pad/Stick toggle. Inside the Muse app, drag controls are deliberately absent, because Muse's pull-to-refresh steals downward drags.

## Naming rules (please keep)

- Ukrainian transliteration (S.T.A.L.K.E.R. 2 model) for **villages, people, spirits/monsters, and herbs**: Zalissya, Myroslav, Lisovyk, Domovyk, Viy, Kropyva.
- **Skill names stay English** (Herbalism, not Zillyaznavstvo). Common buildings are English too: **huts**, not khaty.
- Radek is the exception: a Polish name for a Polish character.

## Working on it

- **`CLAUDE.md`**: architecture, commands, recipes and rules. Read it first, whether you are a person or an AI session.
- **`CONTINUING.md`**: working from the Claude mobile app, bringing changes back into Muse, collaborator setup, and the one-time GitHub settings.
- **`DESIGN.md`**: the design record, one paragraph per build.
- **`PORTING.md`**: the route to native mobile and Steam Deck builds.
- **`client/src/content/README.md`**: editing the Ukrainian and English text.

To play locally:

```bash
cd pages && bun install && bun run dev
```

`app.db` (the Muse save database) is deliberately **not** in this repo. Never commit save data.
