// --- When Lysa Hora keeps its sabbath ----------------------------------------------
// The sabbath gathers as dusk falls and breaks up before the cocks crow.
// Outside those hours the summit is empty — cold ash, a trodden ring — and
// the witches, the warlocks and their devils are hidden about the
// countryside in places a sharp-eyed kobzar can find (data/hideouts.ts).
export const SABBATH_FROM = 20 * 60 + 30;
export const SABBATH_UNTIL = 4 * 60;

export function isSabbath(minute: number): boolean {
  const m = ((minute % 1440) + 1440) % 1440;
  return m >= SABBATH_FROM || m < SABBATH_UNTIL;
}
