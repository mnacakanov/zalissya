// --- Remembered questions ---------------------------------------------------
// A topic you have asked keeps its ✓ the next time you talk to that person,
// not just until Farewell. The save has a flag budget (250, save/types.ts),
// so each person gets ONE flag holding everything asked of them:
//   "asked:radek:k3f9a,1x0bq"
// Each entry is a short hash of the topic's id AND its label. The id alone
// is not enough: some ids mean a different question in another state
// (Radek's "home" before and after the forge is lit, the Chort's "dance"
// in the khutir and on Lysa Hora), and their labels differ. Switching the
// language changes the labels, so the ✓ marks start over then; nothing
// else depends on them.

const PREFIX = "asked:";
// Old entries (questions that no longer exist in that state) are dropped
// oldest first past this many per person.
export const ASKED_PER_NPC = 40;

export type TopicLike = { id: string; label: string };

// FNV-1a, 32-bit, in base 36: short, stable, collision-safe at this scale.
export function topicKey(topic: TopicLike): string {
  let h = 0x811c9dc5;
  const s = `${topic.id}\u0000${topic.label}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

function flagFor(flags: ReadonlySet<string>, npcId: string): string | undefined {
  const head = `${PREFIX}${npcId}:`;
  for (const f of flags) if (f.startsWith(head)) return f;
  return undefined;
}

export function askedKeys(flags: ReadonlySet<string>, npcId: string): string[] {
  const f = flagFor(flags, npcId);
  if (!f) return [];
  const body = f.slice(PREFIX.length + npcId.length + 1);
  return body ? body.split(",") : [];
}

// The ids of `topics` already asked of this person.
export function askedIds(flags: ReadonlySet<string>, npcId: string, topics: readonly TopicLike[]): string[] {
  const keys = new Set(askedKeys(flags, npcId));
  return topics.filter((tp) => keys.has(topicKey(tp))).map((tp) => tp.id);
}

// Remember that `topic` was asked. Returns whether the flags changed.
export function markAsked(flags: Set<string>, npcId: string, topic: TopicLike): boolean {
  const key = topicKey(topic);
  const keys = askedKeys(flags, npcId);
  if (keys.includes(key)) return false;
  const next = [...keys, key].slice(-ASKED_PER_NPC);
  const old = flagFor(flags, npcId);
  if (old) flags.delete(old);
  flags.add(`${PREFIX}${npcId}:${next.join(",")}`);
  return true;
}
