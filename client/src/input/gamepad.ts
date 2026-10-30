// --- Gamepad (Steam Deck, Xbox/PlayStation pads, phone controllers) --------
// Standard-mapping gamepads through the browser Gamepad API, polled once a
// frame. Buttons only — no drags — so it is safe in every build.
//
//   left stick / d-pad   walk · move focus in dialogue and menus
//   A                    interact · next · pick the focused option · WARD
//   B                    close the sheet · end a conversation at its menu
//   LB / RB / LT / RT    hold to LOOK AWAY during Viy's vigil
//   Start                Character sheet      Back / Select   Quests
//
// A native port maps its own controller API onto the same PadState.

export type PadButtonName = "a" | "b" | "x" | "y" | "lb" | "rb" | "lt" | "rt" | "back" | "start" | "up" | "down" | "left" | "right";

export type PadState = {
  // movement vector, each axis -1…1 (stick with dead zone, plus d-pad)
  x: number;
  y: number;
  held: ReadonlySet<PadButtonName>;
  // held now, not held last poll
  pressed: ReadonlySet<PadButtonName>;
};

const STANDARD: Record<number, PadButtonName> = {
  0: "a", 1: "b", 2: "x", 3: "y", 4: "lb", 5: "rb", 6: "lt", 7: "rt",
  8: "back", 9: "start", 12: "up", 13: "down", 14: "left", 15: "right",
};
const DEAD_ZONE = 0.22;

export function lookAwayHeld(s: PadState | null): boolean {
  return !!s && (s.held.has("lb") || s.held.has("rb") || s.held.has("lt") || s.held.has("rt"));
}

// Returns a poller: call it once per frame; null while no pad is connected.
export function createGamepadReader(): () => PadState | null {
  let prev = new Set<PadButtonName>();
  return () => {
    const pads = typeof navigator !== "undefined" && navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = [...pads].find((p): p is Gamepad => !!p && p.connected);
    if (!pad) {
      prev = new Set();
      return null;
    }
    const held = new Set<PadButtonName>();
    pad.buttons.forEach((b, i) => {
      const name = STANDARD[i];
      if (name && (b.pressed || b.value > 0.5)) held.add(name);
    });
    const pressed = new Set([...held].filter((b) => !prev.has(b)));
    prev = held;
    const ax = pad.axes[0] ?? 0;
    const ay = pad.axes[1] ?? 0;
    const mag = Math.hypot(ax, ay);
    let x = mag > DEAD_ZONE ? ax : 0;
    let y = mag > DEAD_ZONE ? ay : 0;
    if (held.has("left")) x -= 1;
    if (held.has("right")) x += 1;
    if (held.has("up")) y -= 1;
    if (held.has("down")) y += 1;
    return { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)), held, pressed };
  };
}

// Move keyboard-style focus between the buttons of the open dialogue or
// sheet (the element marked data-pad-scope). Returns true if it moved.
export function moveFocus(scope: Element, dir: 1 | -1): boolean {
  const buttons = [...scope.querySelectorAll<HTMLButtonElement>("button:not([disabled])")];
  if (!buttons.length) return false;
  const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
  const next = at < 0 ? (dir > 0 ? 0 : buttons.length - 1) : (at + dir + buttons.length) % buttons.length;
  buttons[next]?.focus();
  return true;
}
