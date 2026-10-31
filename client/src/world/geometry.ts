export type Rect = { x: number; y: number; w: number; h: number };

export function hash2(x: number, y: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function circleRectCollide(cx: number, cy: number, r: number, b: Rect): boolean {
  const nx = clamp(cx, b.x, b.x + b.w);
  const ny = clamp(cy, b.y, b.y + b.h);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}
// One axis of a camera that follows `p` inside a span [lo, hi] of the world:
// kept inside the span, or, when the span is smaller than the screen (a small
// cave on a big monitor), centred on it.
export function followAxis(p: number, view: number, lo: number, hi: number): number {
  if (hi - lo <= view) return lo + (hi - lo) / 2 - view / 2;
  return clamp(p - view / 2, lo, hi - view);
}
