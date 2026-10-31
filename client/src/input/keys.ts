// --- Keyboard ---------------------------------------------------------------
// The game reads keys by their place on the keyboard (KeyboardEvent.code),
// not by the letter they type (KeyboardEvent.key). On a Ukrainian layout
// the W key types «ц», so reading `key` left WASD and E dead for exactly
// the players this game is written for. The names returned here are the
// ones the frame loop already asks for: "w", "arrowup", " ", "shift"…

export function keyName(e: { code: string; key: string }): string {
  const c = e.code;
  if (/^Key[A-Z]$/.test(c)) return c.slice(3).toLowerCase();
  if (c.startsWith("Arrow")) return c.toLowerCase();
  if (c === "Space") return " ";
  if (c === "ShiftLeft" || c === "ShiftRight") return "shift";
  // Some virtual keyboards and old browsers leave `code` empty.
  return e.key.toLowerCase();
}
