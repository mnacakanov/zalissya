// Muse target: saves go through the space's server actions
// (server/src/actions.ts), backed by the Muse-hosted database.
//
// `import type { Actions }` is type-only by design: the client bundle never
// pulls in any server runtime. With `verbatimModuleSyntax: true`, dropping
// `type` is a compile error.

import type { Actions } from "@space/server/actions";
import { createActionClient } from "@hatch/space-sdk/client";
import type { SaveAdapter } from "./types";

const rpc = createActionClient<typeof Actions>();

export const museSave: SaveAdapter = {
  load: () => rpc.getSave({}),
  async save(data) {
    await rpc.saveProgress(data);
  },
  async reset() {
    await rpc.resetSave({});
  },
};
