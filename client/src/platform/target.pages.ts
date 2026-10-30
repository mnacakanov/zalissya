// Platform wiring for the GITHUB PAGES build. pages/build.ts resolves
// ./target to this file; it must export the same names as ./target.ts.
// No Muse SDK here: a plain QueryClient, no safe-area scrim, saves in
// localStorage, and the floating joystick replaces the D-pad (a plain browser honours
// the page's overscroll locks, so drags reach the game).

import { QueryClient } from "@tanstack/react-query";

export { localSave as save } from "../save/local";

export const queryClient = new QueryClient();

export function SafeAreaTopScrim(_props: { backgroundColor?: string }): null {
  return null;
}

export const PLATFORM: "muse" | "pages" = "pages";
export const JOYSTICK_ALLOWED: boolean = true;
