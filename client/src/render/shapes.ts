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