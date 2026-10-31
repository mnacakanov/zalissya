"""Pseudo-normal maps for the Pillars-lite style (issue #2).

python3 godot-demo/tools/normals.py godot-demo/styles/pillars/*.png

Writes <name>_n.png beside each image: a height field taken from the
colour's luminance (lighter = nearer the light, a fair guess for painted
plates), blurred, and turned into OpenGL-style normals (green = up), the
alpha kept from the colour. Godot's 2D lights then rake across the art.
Production art would render a true normal pass from Blender instead.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

STRENGTH = 3.0

for path in sys.argv[1:]:
    if path.endswith("_n.png"):
        continue
    im = Image.open(path).convert("RGBA")
    a = np.asarray(im).astype(np.float32) / 255.0
    lum = Image.fromarray((0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]) * 255).convert("L")
    h = np.asarray(lum.filter(ImageFilter.GaussianBlur(2.5))).astype(np.float32) / 255.0
    dx = np.zeros_like(h); dy = np.zeros_like(h)
    dx[:, 1:-1] = (h[:, 2:] - h[:, :-2]) / 2
    dy[1:-1, :] = (h[2:, :] - h[:-2, :]) / 2
    n = np.stack([-dx * STRENGTH, dy * STRENGTH, np.ones_like(h)], axis=-1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    rgb = ((n * 0.5 + 0.5) * 255).astype(np.uint8)
    out = np.dstack([rgb, (a[..., 3] * 255).astype(np.uint8)])
    dst = path[:-4] + "_n.png"
    Image.fromarray(out, "RGBA").save(dst)
    print(dst)
