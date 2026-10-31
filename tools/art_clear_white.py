#!/usr/bin/env python3
"""Clear white holes from a generated art asset (ART_STYLE.md, Muse output).

Muse removes the background around a subject but often leaves the holes
inside it (the gaps between a tree's branches, under an arch) as opaque
white. This makes every sizeable patch of near-white pixels transparent,
then softens the ink and paint along the new edges so no white halo is
left (the edge colour is "un-mixed" from white).

Usage:
    python3 tools/art_clear_white.py IN.png [OUT.png] [--min-area 400] [--white 245]

- --white: a pixel counts as white when all of R, G, B are at least this.
- --min-area: white patches smaller than this many pixels are kept, so
  small painted highlights survive. Raise it if highlights get punched out.

Whitewashed walls are cream (#EFE6D2), below the default threshold; still,
check a building after running this, and raise --white if a wall is hit.
"""
import argparse

import numpy as np
from PIL import Image
from scipy import ndimage


def clear_white(img: Image.Image, white: int = 245, min_area: int = 400) -> tuple[Image.Image, int]:
    rgba = np.asarray(img.convert("RGBA")).astype(np.float32)
    rgb, alpha = rgba[..., :3], rgba[..., 3]
    near_white = (rgb.min(axis=2) >= white) & (alpha > 0)
    labels, n = ndimage.label(near_white)
    sizes = ndimage.sum(near_white, labels, range(1, n + 1))
    keep = np.zeros(n + 1, dtype=bool)
    keep[1:] = sizes >= min_area
    hole = keep[labels]
    alpha[hole] = 0

    # Edge pixels within 2 px of a cleared hole were painted over white:
    # read how much white is in them, turn that into transparency, and
    # recover the colour underneath (c = a*paint + (1-a)*white).
    ring = ndimage.binary_dilation(hole, iterations=2) & ~hole & (alpha > 0)
    whiteness = np.clip((rgb.min(axis=2) - 150.0) / (255.0 - 150.0), 0.0, 1.0)
    a_new = np.clip(1.0 - whiteness, 0.05, 1.0)
    for ch in range(3):
        c = rgb[..., ch]
        un = (c - (1.0 - a_new) * 255.0) / a_new
        c[ring] = np.clip(un[ring], 0, 255)
    alpha[ring] = np.minimum(alpha[ring], a_new[ring] * 255.0)

    out = np.dstack([rgb, alpha]).round().astype(np.uint8)
    return Image.fromarray(out, "RGBA"), int(hole.sum())


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src")
    ap.add_argument("dst", nargs="?")
    ap.add_argument("--white", type=int, default=245)
    ap.add_argument("--min-area", type=int, default=400)
    a = ap.parse_args()
    out, cleared = clear_white(Image.open(a.src), a.white, a.min_area)
    dst = a.dst or a.src.rsplit(".", 1)[0] + "-clear.png"
    out.save(dst)
    print(f"cleared {cleared} px of white -> {dst}")


if __name__ == "__main__":
    main()
