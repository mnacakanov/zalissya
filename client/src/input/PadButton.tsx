// One cell of the hold-to-move pad. A real <button> so it has an
// accessible name; press-and-hold is driven by pointer events, and the
// click default is suppressed so a hold never also "taps" anything.
// Cardinal cells hold one direction; the four CORNER cells hold the
// two directions they sit between, so a thumb landing between two
// arrows — the natural way to ask for a diagonal on a cross pad —
// walks diagonally instead of hitting dead space. The arrow is one
// up-triangle path rotated to point where the cell walks.
export const PAD_ARROW_UP = "M12 5l7 9H5z";

export function PadButton(props: {
  dirs: string[];
  label: string;
  rotate: number;
  corner?: boolean;
  pressed: boolean;
  onDown: (dirs: string[]) => (e: React.PointerEvent) => void;
  onUp: (dirs: string[]) => () => void;
}) {
  const release = props.onUp(props.dirs);
  return (
    <button
      type="button"
      aria-label={props.label}
      aria-pressed={props.pressed}
      onPointerDown={props.onDown(props.dirs)}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => e.preventDefault()}
      className={`flex h-14 w-14 items-center justify-center rounded-2xl border shadow-lg backdrop-blur-[2px] ${
        props.pressed
          ? "border-[#f3e9d2] bg-[#d99a2b]/85"
          : props.corner
            ? "border-[#f3e9d2]/30 bg-[#1c1409]/40"
            : "border-[#f3e9d2]/45 bg-[#1c1409]/55"
      }`}
      style={{ touchAction: "none", WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none" }}
    >
      <svg width={props.corner ? 20 : 26} height={props.corner ? 20 : 26} viewBox="0 0 24 24" aria-hidden="true">
        <g transform={`rotate(${props.rotate} 12 12)`}>
          <path d={PAD_ARROW_UP} fill="#f3e9d2" fillOpacity={props.corner ? 0.75 : 1} />
        </g>
      </svg>
    </button>
  );
}