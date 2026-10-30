// Platform wiring for the MUSE build (the default). The GitHub Pages build
// swaps this whole module for ./target.pages.ts at bundle time
// (pages/build.ts) — keep the two export lists identical.
//
// Muse rule: no drag or joystick controls. The Muse app shell's
// pull-to-refresh claims downward drags before the page can use them.

export { SafeAreaTopScrim, spaceQueryClient as queryClient } from "@hatch/space-sdk/client";
export { museSave as save } from "../save/muse";

export const PLATFORM: "muse" | "pages" = "muse";
export const JOYSTICK_ALLOWED: boolean = false;

// Remembered control scheme. Muse only ever uses the pad.
export function loadControlPref(): "pad" | "stick" {
  return "pad";
}
export function storeControlPref(_pref: "pad" | "stick"): void {}
