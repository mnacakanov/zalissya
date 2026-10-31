#!/usr/bin/env python3
"""Make a ground texture tile seamlessly (ART_STYLE.md, Muse output).

Muse's "seamless" textures rarely join at the edges. This cross-fades a
band of OVERLAP pixels from each edge onto the opposite one, so the tile
wraps cleanly left/right and top/bottom. The tile shrinks by OVERLAP on
each axis. Ink lines inside the band may double faintly; keep the
overlap wide (300-400 px on a 2048 tile) so it reads as wash, not ghosts.

Usage:
    python3 tools/art_seamless.py IN.(png|webp) OUT.png [--overlap 360]
"""
import argparse

import numpy as np
from PIL import Image


def seam(a: np.ndarray, ov: int, axis: int) -> np.ndarray:
    a = np.moveaxis(a, axis, 0)
    m = a.shape[0] - ov
    t = np.linspace(0.0, 1.0, ov)
    w = (t * t * (3 - 2 * t))[:, None, None]  # smoothstep
    out = a[:m].copy()
    out[:ov] = (1 - w) * a[m : m + ov] + w * a[:ov]
    return np.moveaxis(out, 0, axis)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--overlap", type=int, default=360)
    a = ap.parse_args()
    img = np.asarray(Image.open(a.src).convert("RGB")).astype(np.float32)
    out = seam(seam(img, a.overlap, 1), a.overlap, 0)
    Image.fromarray(out.round().clip(0, 255).astype(np.uint8)).save(a.dst)
    print(f"{img.shape[1]}x{img.shape[0]} -> {out.shape[1]}x{out.shape[0]} seamless -> {a.dst}")


if __name__ == "__main__":
    main()
