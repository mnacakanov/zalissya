# Kobzar walk — 4 directions (owner's Gemini sheet, v2, prepped by Harry)

Source: the owner's own Gemini generation (green-screen sheet, fixed v2 —
directions and instrument sling verified consistent frame-by-frame).
Original sheet: `godot-demo/styles/raw/gemini_kobzar_walk_sheet.webp`.
Local working copies: `~/workspace/zalissya-graphics-demo/kobzar-walk-4dir/`.

## Files

- `../kobzar_walk_4dir.png` — transparent sheet, 672×928, 6 cols × 4 rows,
  cell 112×232.
- This folder — the same 24 frames as individual PNGs alongside this
  README: `south_0..5`, `north_0..5`, `east_0..5`, `west_0..5`.

Rows top→bottom: **south** (front), **north** (back), **east** (faces
right), **west** (faces left). 6 frames per direction.

## Prep applied

- Chroma key on #00FF00 with un-premultiply + green despill (no fringe at 3×).
- Frames trimmed, then aligned in uniform cells: feet on a shared baseline,
  horizontally centred, relative scale preserved (no per-frame rescaling).
- Stray fragments from neighbouring rows (1–2 px bleed at cell borders)
  removed by largest-connected-component cleanup.

## Notes for integration

- The bandura sling is consistent in all 24 frames, over his **left**
  shoulder — this differs from the older kobzar art; don't mix sets.
- Known nit (owner-reviewed): the bandura reads differently in the two side
  rows — east shows only its dome behind his back, west shows it full-face
  with the soundhole. Noticeable only on direction change.
- Walk cycles are gentle — frames differ subtly, more a soft stride than a
  march.
- No idle or play frames in this set. The demo's current runtime set lives in
  `godot-demo/art/` (8-frame single-direction `kobzar_walk0..7` + idle at
  128×168); this set is 6 frames × 4 directions at 112×232 per frame.
