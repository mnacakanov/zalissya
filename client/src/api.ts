// The one storage boundary for game code. `save` is the platform's save
// adapter: Muse server actions in the Muse build (./save/muse.ts), browser
// localStorage in the GitHub Pages build (./save/local.ts). Which one is
// decided by ./platform/target — see that file.

export { save } from "./platform/target";
export type { SaveAdapter, SaveArea, SaveData, SaveInput } from "./save/types";
