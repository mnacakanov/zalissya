// Story flags + counters live in the save as plain strings: a flag is
// present or not, and a counter is stored as "name=n" (e.g. "fish=3").
export function flagHas(flags: ReadonlySet<string>, name: string): boolean {
  return flags.has(name);
}
export function flagCount(flags: ReadonlySet<string>, name: string): number {
  for (const f of flags) {
    if (f.startsWith(`${name}=`)) {
      const n = Number(f.slice(name.length + 1));
      return Number.isFinite(n) ? n : 0;
    }
  }
  return 0;
}