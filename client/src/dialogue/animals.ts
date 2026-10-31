import type { Npc } from "../data/characters";
import { t, type TextKey } from "../i18n";
import { type CritterKind } from "../systems/critters";
import { flagHas } from "../systems/flags";

// --- Animal speech (Did Prokip's reward: systems/vorozhbyt.ts) ----------------
// Once Prokip has spat in your ear ("zviryna"), the khutir's animals talk
// to you. They have been talking all along; nobody listened. Each has a
// few lines, a sleepy one for the night, and the horse at the korchma rail
// has watched the fire over the korchma every night.

const COUNT: Record<CritterKind, number> = { dog: 4, goose: 4, cow: 4, horse: 3 };

export function animalSpeaker(kind: CritterKind): Npc {
  return {
    id: `animal-${kind}`, name: t(`animal.${kind}.name` as TextKey), pron: "", role: t(`animal.${kind}.role` as TextKey),
    x: 0, y: 0, tunic: "#6e5136", hair: "#8a6f4d", style: "elder",
  };
}

// What the animal says now. `pick` is 0…1 (random), `asleep` whether it
// sleeps, `fire` whether the perelesnyk flies tonight.
export function animalLine(kind: CritterKind, flags: ReadonlySet<string>, asleep: boolean, fire: boolean, pick: number): string {
  if (kind === "horse") {
    if (fire) return t("animal.horse.fire");
    if (flagHas(flags, "perelesnykGone") && pick < 0.4) return t("animal.horse.calm");
  } else if (asleep) return t(`animal.${kind}.night` as TextKey);
  const n = Math.min(COUNT[kind] - 1, Math.floor(pick * COUNT[kind]));
  return t(`animal.${kind}.${n}` as TextKey);
}
