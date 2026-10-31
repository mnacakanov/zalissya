import type { SatchelItemId } from "../systems/satchel";

// Little ink-line icons for the satchel list, drawn to match the painted
// style: a thin warm-black outline over a soft wash of the thing's colour.
// Decorative only (the row's name is the label), so aria-hidden.
const WASH: Record<SatchelItemId, string> = {
  meals: "#e6c27a",
  potions: "#8db06a",
  strongPotions: "#8a63a8",
  fish: "#8fc3d4",
  herbStock: "#9bb85a",
  lysaFlower: "#b9a7e0",
  iron: "#a9adb4",
  forged: "#9aa3ad",
  chervintsi: "#d9a441",
};

function Shapes({ id }: { id: SatchelItemId }) {
  switch (id) {
    case "meals": // a bowl with steam
      return (
        <>
          <path d="M3 11h18c0 5-3.6 8.5-9 8.5S3 16 3 11z" />
          <path d="M8 20.8h8" fill="none" />
          <path d="M9 4.5c-1.2 1.2 1.2 2.2 0 3.5M14 4.5c-1.2 1.2 1.2 2.2 0 3.5" fill="none" />
        </>
      );
    case "potions":
    case "strongPotions": // a flask
      return (
        <>
          <path d="M9.5 3h5" fill="none" />
          <path d="M10.2 3v6.2L5.3 17.4a2.2 2.2 0 0 0 1.9 3.3h9.6a2.2 2.2 0 0 0 1.9-3.3L13.8 9.2V3" />
          <path d="M7.6 15h8.8" fill="none" />
        </>
      );
    case "fish":
      return (
        <>
          <path d="M2.5 12c2.6-4.2 7.2-5.6 11.2-3.2L19.5 6v12l-5.8-2.8C9.7 17.6 5.1 16.2 2.5 12z" />
          <circle cx="7.6" cy="11" r=".9" fill="currentColor" stroke="none" />
          <path d="M11 9.6c1 1.4 1 3.4 0 4.8" fill="none" />
        </>
      );
    case "herbStock":
      return (
        <>
          <path d="M12 21V10" fill="none" />
          <path d="M12 14c-4.4.2-6.6-2.4-6.8-6.2 4.2-.2 6.8 1.8 6.8 6.2z" />
          <path d="M12 10.5c4.2 0 6.6-2.6 6.8-6.3-4.2-.2-6.8 2-6.8 6.3z" />
        </>
      );
    case "lysaFlower": // a night-bloom
      return (
        <>
          <path d="M12 14v7" fill="none" />
          <path d="M12 21c0-2 2.5-3.2 5-3" fill="none" />
          <path d="M12 12c-3.2-.5-5-3-4.6-6 2.8.2 4.6 2.2 4.6 6z" />
          <path d="M12 12c3.2-.5 5-3 4.6-6-2.8.2-4.6 2.2-4.6 6z" />
          <path d="M12 12c-1.8-2.4-1.6-5.2 0-8 1.6 2.8 1.8 5.6 0 8z" />
        </>
      );
    case "iron": // a lump of bog iron
      return (
        <>
          <path d="M4.5 16.5l2-6.2L12 6.5l6 3.3 1.5 6.2-5 3.5H9z" />
          <path d="M6.5 10.3l5.5 3.4 6-3.9M12 13.7v6" fill="none" />
        </>
      );
    case "forged": // a horseshoe
      return (
        <>
          <path d="M6 20.5V11a6 6 0 0 1 12 0v9.5h-4V11a2 2 0 0 0-4 0v9.5z" />
          <path d="M7.9 16.5h.01M7.9 13.5h.01M16.1 16.5h.01M16.1 13.5h.01" fill="none" strokeWidth={2} />
        </>
      );
    case "chervintsi": // a ducat
      return (
        <>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4.6" fill="none" />
          <path d="M12 9.6v4.8M10 12h4" fill="none" />
        </>
      );
  }
}

export function SatchelIcon({ id, size = 28 }: { id: SatchelItemId; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      fill={WASH[id]}
      stroke="#2a1a10"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "#2a1a10", flex: "none" }}
    >
      <Shapes id={id} />
    </svg>
  );
}
