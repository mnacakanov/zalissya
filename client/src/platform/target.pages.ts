// Platform wiring for the GITHUB PAGES build. pages/build.ts resolves
// ./target to this file; it must export the same names as ./target.ts.
// No Muse SDK here: a plain QueryClient, no safe-area scrim, saves in
// localStorage, and the floating joystick is allowed (a plain browser
// honours the page's overscroll locks, so drags reach the game).

import { QueryClient } from "@tanstack/react-query";

export { localSave as save } from "../save/local";

export const queryClient = new QueryClient();

export function SafeAreaTopScrim(_props: { backgroundColor?: string }): null {
  return null;
}

export const PLATFORM: "muse" | "pages" = "pages";
export const JOYSTICK_ALLOWED: boolean = true;

const CONTROLS_KEY = "zalissya-controls";

export function loadControlPref(): "pad" | "stick" {
  try {
    return localStorage.getItem(CONTROLS_KEY) === "stick" ? "stick" : "pad";
  } catch {
    return "pad";
  }
}
export function storeControlPref(pref: "pad" | "stick"): void {
  try {
    localStorage.setItem(CONTROLS_KEY, pref);
  } catch {
    // preference just won't stick
  }
}
