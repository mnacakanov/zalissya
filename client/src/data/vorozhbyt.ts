import { t } from "../i18n";
import type { Npc } from "./characters";
import { doorOf, toWorld } from "./houses";

// --- Did Prokip and the perelesnyk (systems/vorozhbyt.ts) ----------------------
// Prokip never leaves his khatka: "I don't sleep. I think with my eyes
// shut." He stands between his pich and his table.
export const PROKIP: Npc = {
  id: "prokip", name: t("char.prokip.name"), pron: t("char.prokip.pron"), role: t("char.prokip.role"),
  ...toWorld("prokip", { x: 104, y: 92 }), tunic: "#5e5444", hair: "#e8e4da", style: "vorozhbyt",
};

// The perelesnyk at night: it hangs in the air over the korchma's door,
// and the kobzar meets it on the threshold.
const KORCHMA_DOOR = doorOf("korchma");
export const PERELESNYK_AT = { x: KORCHMA_DOOR.x, y: KORCHMA_DOOR.y + 30 };
export const PERELESNYK_NPC: Npc = {
  id: "perelesnyk", name: t("char.perelesnyk.name"), pron: t("char.perelesnyk.pron"), role: t("char.perelesnyk.role"),
  x: PERELESNYK_AT.x, y: PERELESNYK_AT.y, tunic: "#e0602a", hair: "#f0b040", style: "elder",
};
