// --- Drawing helpers --------------------------------------------------------

// Where the camera is this frame (App sets it). Drawings get screen
// coordinates; anything that animates by place (a tree's sway, a spirit's
// bob) must take its phase from the WORLD position — x + CAM.x — or it
// speeds up and slows down as the camera scrolls past.
export const CAM = { x: 0, y: 0 };

export function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

// A colour scaled toward black ("#c8402e", 0.7 → "rgb(…)"). Anything that is
// not a #rrggbb string comes back unchanged.
export function darken(hex: string, f: number): string {
  if (!hex.startsWith("#") || hex.length < 7) return hex;
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgb(${Math.round((n >> 16) * f)},${Math.round(((n >> 8) & 255) * f)},${Math.round((n & 255) * f)})`;
}

// A flat colour that falls off to a darker edge toward the right: the
// storybook "shaded" fill used by every creature and figure.
export function paint(c: CanvasRenderingContext2D, col: string, x0: number, w: number): CanvasGradient {
  const g = c.createLinearGradient(x0, 0, x0 + w, 0);
  g.addColorStop(0, col); g.addColorStop(0.55, col); g.addColorStop(1, darken(col, 0.7));
  return g;
}

// The outline pen of one drawing module: `const ink = makeInk(INK)`, where
// INK is that module's own ink tint (they differ on purpose: warm for
// animals, cold for Lysa Hora, green-black for trees).
export function makeInk(color: string): (c: CanvasRenderingContext2D, w?: number) => void {
  return (c, w = 0.9) => { c.strokeStyle = color; c.lineWidth = w; c.stroke(); };
}
