import { t } from "../i18n";
import type { Npc } from "./characters";
import { toWorld } from "./houses";

// --- The korchma on the chumak road -------------------------------------------
// Past the khutir, where the chumak road turns south to the river, stands
// the korchma (data/houses.ts KORCHMA_ROOM; drawn by render/khutir.ts and
// render/khataInterior.ts). Every road in the steppe has one, and every
// korchma has its keeper and its regular:
//   Odarka — the shynkarka, a widow behind the shynkvas. Her husband rode
//     to the Sich seven years ago. She has stopped saying "when he's back".
//   Okhrim — an old Zaporozhian, the last of his kurin, who drinks on
//     credit; Odarka chalks his debt on the counter and never collects.
// In the evening the kobzar can play here instead of at the campfire:
// the korchma has its own mood (systems/korchma.ts).

export const ODARKA: Npc = {
  id: "odarka", name: t("char.odarka.name"), pron: t("char.odarka.pron"), role: t("char.odarka.role"),
  ...toWorld("korchma", { x: 232, y: 64 }), tunic: "#7a2a3a", hair: "#3a2a1c", style: "shynkarka",
};
export const OKHRIM: Npc = {
  id: "okhrim", name: t("char.okhrim.name"), pron: t("char.okhrim.pron"), role: t("char.okhrim.role"),
  ...toWorld("korchma", { x: 108, y: 110 }), tunic: "#8a2a24", hair: "#d8d2c4", style: "kozak",
};

// Where the kobzar sits down to play for the korchma.
export const KORCHMA_PLAY = toWorld("korchma", { x: 175, y: 140 });
