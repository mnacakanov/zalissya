# Zalissya in Godot: the maidan

(How buildings are made, from a 3D model to a painted, walkable place, and how to work on them in parallel: [`../PIPELINE.md`](../PIPELINE.md).)

The first piece of the khutir rebuilt in Godot, in the owner's chosen style,
**Pillars-lite**: the Pillars camera angle, with the art in the ink and
watercolour of [`ART_STYLE.md`](../../ART_STYLE.md). It is the Godot demo's
main scene, live at `https://mnacakanov.github.io/zalissya/godot-demo/`.
The style test is behind the "Тест стилів" button.

The light is Pillars-lite's own:
- by day, a sun rakes the normal-mapped art;
- by night (N, Y or "День / ніч"), the fire burns and flickers, and a lamp
  hangs by every khata's door;
- the pich and the room light up while the kobzar is in that hut.

The maidan is built entirely from **one data file, `maidan.json`**. You can
add, move or replace buildings there without touching code.

- `maidan.tscn` / `maidan.gd` is the script that builds the maidan.
- `maidan.json` is everything that stands on the maidan.
- The art is in `../styles/pillars/`, the chosen style's folder.

## Coordinates

Everything is placed in **metres on the ground**:
- `x` runs east and `y` runs south;
- `0, 0` is the fire (vatra) in the middle of the maidan;
- `at` is the centre of a thing's footprint.

As in the 2D game, the khutir is a horseshoe round the maidan, open to the
south. The road comes in from the south.

**Finding a spot.** Press F3 or "Контури" in the demo. It shows:
- a yellow grid every 5 m round the fire;
- the footprints in red and the walls in cyan;
- the maidan's edge in magenta;
- every building's name.

The HUD always shows where the kobzar stands, in metres. Walk to a spot and
read it off. Use − / + (or the mouse wheel) to zoom out over the whole
maidan.

## `maidan.json`

| Field | Meaning |
|---|---|
| `style` | which style folder the art comes from (`pillars`) |
| `hut_size` | the khata's footprint in metres, `[along the door wall, deep]` |
| `bounds` | how far the grass goes: `[west, north, east, south]` |
| `start` | where the kobzar starts |
| `zoom` | how close the camera starts (1 = the art's own size, smaller = farther out) |
| `maidan` | the trodden earth: `center`, `radius` `[east-west, north-south]`, and `texture` (a ground tile in the style folder; it falls back to the road until `ground_maidan.png` exists) |
| `areas` | other ground, such as a pond's shore and water: `{"id", "texture", "color", "center", "radius", "wobble", "solid"}`, a rough oval in metres drawn with its own tile, or the plain `color` until that tile exists. A `solid` area (water) can't be walked into; you stop at its edge. |
| `roads` | `{"width", "points": [[x, y], …]}`, drawn with `ground_road` |
| `paths` | the same, drawn with `ground_path` |
| `buildings` | see below |
| `props` | small things: `{"file", "at", "metres"}` (its height); no collision |

### Buildings

Each building has an `id`, a `name` (Ukrainian, shown with F3) and a `kind`.

**`"kind": "khata"`** is the style's hut, which you can walk into. It uses:
- the hut and room art from `styles/pillars/`;
- the door, the pich and the furniture from `styles/pillars/layout.json`.

Only `at` is needed. **`facing`** says which way its door looks:
- the head of the horseshoe faces south, toward the maidan;
- the west arm faces east;
- the east arm faces west.

The art has to be drawn that way, because a picture can't be turned: the
door goes on the matching wall in the picture, and in the hut's `hut.json`
it is `"door": {"wall": "east", "t": [t0, t1]}` (a plain `[t0, t1]` means
the south wall).

A west-facing door is on the side turned away from the camera. You see that
house from behind, and when the kobzar walks round it to its door, it turns
see-through, as in BG2. Any building does that when it hides him.

Until a hut has its own art, it is the style's south-facing hut.

**Each khata can have its own art.** Put it in
`styles/pillars/huts/<id>/` (or name the folder with `"art"`):
- `hut_exterior.png` and `hut_interior.png`, made the way the style's hut
  is made;
- a `hut.json` shaped like the `hut` block of `styles/pillars/layout.json`.
  It holds the footprints, the door, the pich and the solids, plus:
  - `"size": [x, y]` in metres;
  - `"walls"` inside the room, as `[x1, y1, x2, y2]` in the room's pixels
    (for example the siny's partitions).

Until a hut has its own folder, it uses the style's one hut.

**Other cases:**
- **No `interior` yet:** the hut stands closed and solid.
- **Rooms as separate pictures:** for a long house, the interior can come
  as `"interior": {"parts": [...]}`. Each part has:
  - its own `file`, `footprint`, `pich`, `solids` and `walls`;
  - a `"span": [t0, t1]` along the door wall.

  Each part is laid onto its stretch of the house.

**`"kind": "placeholder"`** is a plain labelled block for something with no
art yet. It takes:
- `size` `[x, y]` in metres;
- `height` in metres;
- `solid` (default `true`).

**`"kind": "sprite"`** is a building with its own picture. It is solid, and
you can't walk into it. It takes:
- `file`: the PNG's name in the style folder, without `.png`;
- `size` `[x, y]`: its footprint on the ground, in metres;
- `footprint` `[[left], [front], [right]]`: the picture's ground corners, in
  pixels from the bottom centre of the PNG. These are the same numbers a
  style's `layout.json` uses:
  - left is the south-west corner;
  - front is the south-east corner;
  - right is the north-east corner.

To replace a placeholder with art, change its kind to `sprite` and add
`file` and `footprint`. Example:

```json
{"id": "kaplytsia", "name": "Каплиця", "kind": "sprite", "file": "kaplytsia",
 "at": [0, -6.5], "size": [3.5, 3], "footprint": [[-120, -60], [10, -5], [130, -70]]}
```

## Models

A building can also be built as a 3D model in code and rendered from the
style's exact camera (`../tools/model/`, see its README). The renders are
then painted over in the style. The model also gives the footprint, the
door, the pich, the partitions and the furniture outlines as numbers for
`hut.json`. The otaman's khata is the first: its renders are in
`../styles/pillars/huts/otaman/model/`.

## Art for the maidan

Read [`ART_STYLE.md`](../../ART_STYLE.md) first. Then:
- **Camera:** the camera of `styles/pillars/hut_exterior.png`. Ground lines
  running east go down to the right, and lines running north go up to the
  right. The south face (the door wall) is the lower-left face.
- **Scale:** 88 px per metre upright, the same as the hut. A 1.9 m door is
  about 165 px tall.
- **File:** a transparent PNG with the building standing on the bottom edge
  of the picture.
- **Normal map:** optional. `tools/normals.py` makes the `<name>_n.png`.

Still missing, in rough order:
- the kaplytsia;
- the well (krynytsia);
- the fire with the kobzar's log;
- Radek's forge;
- the otaman's long hut, built through the siny;
- a trodden-earth tile, `ground_maidan.png`, seamless;
- trees, fences, the people.

The kobzar, Prokip, the cow, the bench and the horod in `styles/pillars/`
are still in the old 3D-render look, except the kobzar's walk sheet
(`kobzar_walk_4dir.png`).

## Seeing your change

1. Push to `main`, or merge a PR into it.
2. CI exports the demo and publishes it in about a minute (`.github/workflows/godot.yml`).
3. Close the demo and open it again. If you still see the old build, close
   and reopen once more.

To run it locally, use Godot 4.7.2 and open `godot-demo/` (see
`../README.md`).

## Working in parallel

- `maidan.json` and the art are for collaborators to change freely.
- `maidan.gd` and the other scene code are shared by both Claude
  sessions, and new zones get scenes of their own. The rules for working
  on them side by side are in `../PIPELINE.md` ("Working in parallel").
- Pull before you edit `maidan.json`, and keep each change small, so that
  two people's edits don't collide.
- Follow the workflow in [`CLAUDE.md`](../../CLAUDE.md): work on a branch
  and open a PR.

## Editing the level by hand (editor.gd)

Open the game with **`?edit`** at the end of the address
(`https://mnacakanov.github.io/zalissya/godot-demo/?edit`), or run it from the
Godot editor. A **Редагувати** button appears top right (or press **Tab**).
In edit mode the game pauses and:

| Do | How |
|---|---|
| Look around | drag empty ground, or right-drag; WASD / arrows; wheel or − + to zoom |
| Select | click a building or a prop (a yellow frame shows it) |
| Move | drag it; it snaps to half a metre, hold **Shift** to place it freely |
| Copy / delete | **Ctrl+D** / **Del**, or the panel's buttons |
| Mirror | **F** (not for walk-in khaty: their art can't turn) |
| Bigger / smaller | **]** / **[** |
| Add | pick a picture in the palette, then click the ground (**Esc** to stop) |
| Undo / redo | **Ctrl+Z** / **Ctrl+Y** |

Every change is kept in your browser as you go, so a reload keeps it
(**Скинути мої зміни** throws your changes away). **Зберегти** writes
`zalissya/maidan.json` when run from the Godot editor; in a browser it
**downloads `maidan.json`**: put it on an issue (or ask the Claude session) to
commit it, or commit it into `godot-demo/zalissya/` yourself. **Копіювати**
copies the whole file instead.

Not editable yet: the forests (generated from their outline), the roads,
paths, areas and walks (edit their points in the file for now).
