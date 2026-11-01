# Models: buildings in 3D, rendered from the Pillars-lite camera

A picture generator can draw one room at the style's angle, but it can't
keep a long house with three rooms at that angle. So the buildings are
built here as simple 3D models in code. Each model is rendered from
**exactly the camera the Pillars-lite pictures are drawn from**, and then
painted over in the style.

The camera is orthographic, at about **94.6 px a metre**:
- it looks down about 21°;
- a metre east is (68.5, 21.3) px on the picture;
- a metre south is (−65.5, 26.7) px;
- a metre up is (0, −88) px.

It is measured from the style's own hut and the maidan's ground scale. The
renders therefore line up with the maidan with no fitting.

## What a render gives

`node render.cjs <model> <out>` writes these files into `<out>`.

**Pictures,** all on one canvas, with the building standing on its bottom
edge as the game expects:

| File | What it is |
|---|---|
| `exterior_color.png` | the house in flat colours, lit by the sun from the upper left (the game's sun) |
| `exterior_ink.png` | line art: the edges and the roof's courses, on a white silhouette |
| `exterior_depth.png` | depth, for a depth-guided generation |
| `exterior_normal.png` | view-space normals |
| `interior_*.png` | the same four for the cutaway, the way the game shows a room you have walked into: the roof gone, the near walls (south, east) and the partitions knee-high |

**The model:** `<model>.glb`, for Blender, Godot or anyone else's renders.

**The plan:** `plan.json`, the numbers the game needs, measured from the
model. Its `hut` block can be copied into the hut's `hut.json` as it is.
It holds:
- the footprint;
- the door's span;
- the pich;
- the partitions;
- the furniture as outlines on the floor (`polys`).

## Making the art from it

1. Paint over `exterior_color.png` and `interior_color.png` in the style of
   `ART_STYLE.md`, guided by the ink, depth and normal renders.
2. Keep the canvas, the camera and the outline exactly, so the plan's
   numbers stay true. Change the look, not the geometry: the door, the
   windows and the furniture stay where they are.
3. Save the results as `hut_exterior.png` and `hut_interior.png` in the
   hut's folder, for example `styles/pillars/huts/otaman/`.
4. Set its `hut.json` to the plan's `hut` block.

To change the house itself (a room wider, the door moved, more furniture),
edit the model (`otaman.js`), render again and paint again.

## Running it

```bash
cd godot-demo/tools/model && npm install
```

```bash
node render.cjs otaman ../../styles/pillars/huts/otaman/model
```

It needs Playwright with Chromium. Software GL is enough, but slow: about
a minute.

- `otaman.js` is the otaman's khata, following `DESIGN.md` ("The otaman's
  khata"). It faces south.
- `domovyk.js` is the Domovyk's khata, the kobzar's lodging. It faces east
  (door in the east wall), as the horseshoe's west arm does.
- `render.html` sets the camera and renders the passes.
- `render.cjs` drives it in a headless browser.

Nothing in this folder goes into the game's export.
