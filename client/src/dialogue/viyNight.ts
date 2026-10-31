import { type DialogueTopic } from "./topics";
import { flagCount, flagHas } from "../systems/flags";
import { t } from "../i18n";

// --- Viy's night: the story that closes the first act ----------------------
// After you have looked upon Viy, he begins to stir. Myroslav remembers the
// old way — a ring of blessed chalk, eyes turned away when he calls for his
// lids, and a whole night held until the rooster crows (the shape of
// Gogol's tale, minus the poor seminarian's ending). Vesna and Radek can
// each make the night easier; the spirits all have an opinion. These
// topics are appended to the village conversations from App.tsx; a topic
// with `grant` hands over an item the moment it is asked (the lines are
// written for the state that will be true once it is given).


export type VigilContext = {
  flags: ReadonlySet<string>;
  talked: ReadonlySet<string>;
  wis: number;
  herbStock: number;
};

// Requirements, shared by the topic text and by App.tsx when it grants.
export const WREATH_HERBS = 3;
export const WREATH_WIS = 2;

export function canWeaveWreath(c: VigilContext): boolean {
  return c.herbStock >= WREATH_HERBS && c.wis >= WREATH_WIS;
}

export function canForgeWard(c: VigilContext): boolean {
  return flagCount(c.flags, "forged") >= 1;
}

export function vigilTopics(npcId: string, c: VigilContext): DialogueTopic[] {
  const f = c.flags;
  const seen = c.talked.has("viy");
  const chalk = flagHas(f, "chalk");
  const sealed = flagHas(f, "viySealed");
  const broken = flagCount(f, "vigilBroken");
  if (!seen) return [];

  switch (npcId) {
    case "myroslav":
      if (sealed) {
        return [{
          id: "vigil-after", label: t("viy.myroslav.vigil-after.label.0"), question: t("viy.myroslav.vigil-after.question.0"),
          lines: [
            t("viy.myroslav.vigil-after.0"),
            t("viy.myroslav.vigil-after.1"),
          ],
        }];
      }
      if (!chalk) {
        return [{
          id: "oldway", label: t("viy.myroslav.oldway.label.0"), question: t("viy.myroslav.oldway.question.0"),
          grant: "chalk",
          lines: [
            t("viy.myroslav.oldway.0"),
            t("viy.myroslav.oldway.1"),
            t("viy.myroslav.oldway.2"),
            t("viy.myroslav.oldway.3"),
          ],
        }];
      }
      return [{
        id: "vigil", label: t("viy.myroslav.vigil.label.0"), question: t("viy.myroslav.vigil.question.0"),
        lines: [
          t("viy.myroslav.vigil.0"),
          broken > 0
            ? t("viy.myroslav.vigil.1", { broken })
            : t("viy.myroslav.vigil.3"),
        ],
      }];

    case "vesna": {
      if (sealed) {
        return [{
          id: "vigil-after", label: t("viy.vesna.vigil-after.label.0"), question: t("viy.vesna.vigil-after.question.0"),
          lines: [t("viy.vesna.vigil-after.0")],
        }];
      }
      if (!chalk || flagHas(f, "wreath")) return [];
      const ok = canWeaveWreath(c);
      return [{
        id: "wreath", label: t("viy.vesna.wreath.label.0"), question: t("viy.vesna.wreath.question.0"),
        ...(ok ? { grant: "wreath" as const } : {}),
        lines: ok
          ? [
              t("viy.vesna.wreath.0"),
              t("viy.vesna.wreath.1"),
            ]
          : [
              t("viy.vesna.wreath.2"),
              c.wis < WREATH_WIS
                ? t("viy.vesna.wreath.3", { wis: c.wis, WREATH_WIS })
                : t("viy.vesna.wreath.4", { WREATH_HERBS, herbStock: c.herbStock }),
            ],
      }];
    }

    case "radek": {
      if (sealed) {
        return [{
          id: "vigil-after", label: t("viy.radek.vigil-after.label.0"), question: t("viy.radek.vigil-after.question.0"),
          lines: [t("viy.radek.vigil-after.0")],
        }];
      }
      if (!chalk || flagHas(f, "ironward")) return [];
      const ok = canForgeWard(c);
      return [{
        id: "ironward", label: t("viy.radek.ironward.label.0"), question: t("viy.radek.ironward.question.0"),
        ...(ok ? { grant: "ironward" as const } : {}),
        lines: ok
          ? [
              t("viy.radek.ironward.0"),
              t("viy.radek.ironward.1"),
            ]
          : flagHas(f, "horseshoe")
            ? [t("viy.radek.ironward.2")]
            : [t("viy.radek.ironward.3")],
      }];
    }

    case "domovyk":
      return sealed
        ? [{ id: "vigil-after", label: t("viy.domovyk.vigil-after.label.0"), question: t("viy.domovyk.vigil-after.question.0"), lines: [t("viy.domovyk.vigil-after.0")] }]
        : chalk
          ? [{ id: "vigil", label: t("viy.domovyk.vigil.label.0"), question: t("viy.domovyk.vigil.question.0"), lines: [t("viy.domovyk.vigil.0")] }]
          : [];

    case "lisovyk":
      return sealed
        ? [{ id: "vigil-after", label: t("viy.lisovyk.vigil-after.label.0"), question: t("viy.lisovyk.vigil-after.question.0"), lines: [t("viy.lisovyk.vigil-after.0")] }]
        : chalk
          ? [{ id: "vigil", label: t("viy.lisovyk.vigil.label.0"), question: t("viy.lisovyk.vigil.question.0"), lines: [t("viy.lisovyk.vigil.0")] }]
          : [];

    case "chort":
      return sealed
        ? [{ id: "vigil-after", label: t("viy.chort.vigil-after.label.0"), question: t("viy.chort.vigil-after.question.0"), lines: [t("viy.chort.vigil-after.0")] }]
        : chalk
          ? [{ id: "vigil", label: t("viy.chort.vigil.label.0"), question: t("viy.chort.vigil.question.0"), lines: [t("viy.chort.vigil.0")] }]
          : [];

    case "bolotianyk":
      return sealed
        ? [{ id: "vigil-after", label: t("viy.bolotianyk.vigil-after.label.0"), question: t("viy.bolotianyk.vigil-after.question.0"), lines: [t("viy.bolotianyk.vigil-after.0")] }]
        : chalk
          ? [{ id: "vigil", label: t("viy.bolotianyk.vigil.label.0"), question: t("viy.bolotianyk.vigil.question.0"), lines: [t("viy.bolotianyk.vigil.0")] }]
          : [];
  }
  return [];
}

// Viy himself, by state. Before the chalk he is narration only; with the
// chalk in hand the vigil begins from the prompt at his hollow (App.tsx).
export function viyNarration(f: ReadonlySet<string>, night: boolean): string[] | null {
  if (flagHas(f, "viySealed")) return null;
  if (flagHas(f, "chalk") && !night) {
    return [
      t("viy.viyNarration.0"),
    ];
  }
  if (!flagHas(f, "chalk") && night) {
    return [
      t("viy.viyNarration.1"),
      t("viy.viyNarration.2"),
    ];
  }
  return null;
}

export const VIGIL_INTRO_LINES: string[] = [
  t("viy.VIGIL_INTRO_LINES.0"),
  t("viy.VIGIL_INTRO_LINES.1"),
];

export const VIGIL_WON_LINES: string[] = [
  t("viy.VIGIL_WON_LINES.0"),
  t("viy.VIGIL_WON_LINES.1"),
  t("viy.VIGIL_WON_LINES.2"),
];

export const VIGIL_BROKEN_LINES: string[] = [
  t("viy.VIGIL_BROKEN_LINES.0"),
  t("viy.VIGIL_BROKEN_LINES.1"),
];
