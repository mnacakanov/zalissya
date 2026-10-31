import { flagCount } from "./flags";

// --- Radek buys horseshoes ---------------------------------------------------
// Forged pieces used to pile up in the satchel: the iron ward takes one,
// and at 2 weight each the rest soon blocked every herb and fish. Radek
// buys them now, a chervinets (червінець, a gold ducat, the coin a Cossack
// meant by "gold") apiece: Cossacks don't stint on their horses, and he
// has more orders than hands.
// Chervintsi live in the "chervintsi=n" counter and ride in the purse,
// not the satchel: they weigh nothing (systems/carry.ts), so gold can
// never soft-lock you the way the horseshoes did.

export const PURSE = "chervintsi";
export const HORSESHOE_PRICE = 1;

export function purse(flags: ReadonlySet<string>): number {
  return flagCount(flags, PURSE);
}

function setCount(flags: Set<string>, name: string, n: number): void {
  for (const f of [...flags]) if (f.startsWith(`${name}=`)) flags.delete(f);
  if (n > 0) flags.add(`${name}=${n}`);
}

// Sell every forged piece to Radek. Returns how many were sold and what
// the purse holds after.
export function sellHorseshoes(flags: Set<string>): { sold: number; purse: number } {
  const sold = flagCount(flags, "forged");
  if (sold <= 0) return { sold: 0, purse: purse(flags) };
  const after = purse(flags) + sold * HORSESHOE_PRICE;
  setCount(flags, "forged", 0);
  setCount(flags, PURSE, after);
  return { sold, purse: after };
}
