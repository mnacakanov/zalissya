// Story flags + counters live in the save as plain strings: a flag is
// present or not, and a counter is stored as "name=n" (e.g. "fish=3").
//
// These are the ONLY helpers that read or rewrite a counter. Don't loop over
// the set with startsWith(`${name}=`) elsewhere: that is how five slightly
// different copies (one of which dropped "name=0", the rest kept it) grew up.
export function flagHas(flags: ReadonlySet<string>, name: string): boolean {
  return flags.has(name);
}

// The counter's value, or null when the save has no such counter at all
// (older saves lack the newer ones: the load-time migrations ask this).
export function counterValue(flags: ReadonlySet<string>, name: string): number | null {
  const prefix = `${name}=`;
  for (const f of flags) {
    if (f.startsWith(prefix)) {
      const n = Number(f.slice(prefix.length));
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

export function hasCounter(flags: ReadonlySet<string>, name: string): boolean {
  const prefix = `${name}=`;
  for (const f of flags) if (f.startsWith(prefix)) return true;
  return false;
}

// A missing counter reads as 0.
export function flagCount(flags: ReadonlySet<string>, name: string): number {
  return counterValue(flags, name) ?? 0;
}

// Replace the counter with `n`. A counter at 0 stays in the set as "name=0":
// the migrations tell "never had it" from "spent it" by its presence.
export function setCount(flags: Set<string>, name: string, n: number): void {
  const prefix = `${name}=`;
  for (const f of [...flags]) if (f.startsWith(prefix)) flags.delete(f);
  flags.add(`${prefix}${n}`);
}

// Add `by` (may be negative) and return the new value. Pure on the set: the
// game's own `bumpCount` in App.tsx wraps this and then syncs the HUD.
export function bumpCount(flags: Set<string>, name: string, by: number): number {
  const next = flagCount(flags, name) + by;
  setCount(flags, name, next);
  return next;
}
