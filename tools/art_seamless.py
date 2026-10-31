#!/usr/bin/env python3
"""Make a ground texture tile seamlessly (ART_STYLE.md, Muse output).

Muse's "seamless" textures rarely join at the edges. This cross-fades a
band of OVERLAP pixels from each edge onto the opposite one, so the tile
wraps cleanly left/right and top/bottom. The tile shrinks by OVERLAP on
each axis. Ink lines inside the band may double faintly; keep the
overlap wide (300-400 px on a 2048 tile) so it reads as wash, not ghosts.

A VARIANT of an accepted tile (--match BASE.png) is then fitted to the
base so the two can be laid side by side in any order: its colours are
matched to the base (per-channel mean and spread), any wash more
saturated than the base's is toned down, and its outer BAND pixels fade
into the base's own edges, so every tile shares the same borders.

Usage:
    python3 tools/art_seamless.py IN.(png|webp) OUT.png [--overlap 360]
    python3 tools/art_seamless.py IN.png OUT.png --match art/accepted/ground/grass.png [--band 260]
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


def match_to(b: np.ndarray, base_img: Image.Image, band: int) -> np.ndarray:
    a = np.asarray(base_img.convert("RGB")).astype(np.float32)
    if a.shape != b.shape:
        raise SystemExit(f"size mismatch: variant {b.shape[:2]} vs base {a.shape[:2]} (use the same --overlap)")
    b = (b - b.mean((0, 1))) / b.std((0, 1)) * a.std((0, 1)) + a.mean((0, 1))
    hsv = np.asarray(Image.fromarray(b.clip(0, 255).round().astype(np.uint8)).convert("HSV")).astype(np.float32)
    cap = np.percentile(np.asarray(base_img.convert("HSV"))[..., 1], 99)
    sat = hsv[..., 1]
    over = sat > cap
    sat[over] = cap + (sat[over] - cap) * 0.3
    b = np.asarray(Image.fromarray(hsv.round().astype(np.uint8), "HSV").convert("RGB")).astype(np.float32)
    h, w = a.shape[:2]
    ys, xs = np.arange(h)[:, None], np.arange(w)[None, :]
    d = np.minimum(np.minimum(xs, w - 1 - xs), np.minimum(ys, h - 1 - ys)).astype(np.float32)
    t = np.clip(d / band, 0, 1)
    wt = (t * t * (3 - 2 * t))[..., None]
    return wt * b + (1 - wt) * a


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--overlap", type=int, default=360)
    ap.add_argument("--match", help="base tile this one is a variant of")
    ap.add_argument("--band", type=int, default=260)
    a = ap.parse_args()
    img = np.asarray(Image.open(a.src).convert("RGB")).astype(np.float32)
    out = seam(seam(img, a.overlap, 1), a.overlap, 0)
    if a.match:
        out = match_to(out, Image.open(a.match), a.band)
    Image.fromarray(out.round().clip(0, 255).astype(np.uint8)).save(a.dst)
    print(f"{img.shape[1]}x{img.shape[0]} -> {out.shape[1]}x{out.shape[0]} seamless -> {a.dst}")


if __name__ == "__main__":
    main()
