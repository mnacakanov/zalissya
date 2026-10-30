import { useEffect, useRef, useState } from "react";

// Floating joystick — GITHUB PAGES ONLY (gated by JOYSTICK_ALLOWED from
// platform/target). Never render it in the Muse build: the Muse app shell's
// pull-to-refresh claims downward drags before the page sees them. In a
// plain browser the page's overscroll locks hold, so dragging works.
//
// Writes a vector (each axis -1…1, length ≤ 1) into `stickRef`; the frame
// loop adds it to keyboard/pad input. Releasing recentres to zero.

const RADIUS = 56; // px the knob may travel from centre

export function Joystick(props: { stickRef: { current: { x: number; y: number } } }) {
  const pointerRef = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0, active: false });
  const { stickRef } = props;
  // Unmounting mid-drag (a dialogue opens) must not leave the player walking.
  useEffect(() => () => {
    stickRef.current = { x: 0, y: 0 };
  }, [stickRef]);

  const update = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    // Small dead zone so a resting thumb does not creep.
    const dead = Math.hypot(dx, dy) < 8;
    props.stickRef.current = dead ? { x: 0, y: 0 } : { x: dx / RADIUS, y: dy / RADIUS };
    setKnob({ x: dx, y: dy, active: true });
  };
  const release = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerRef.current !== e.pointerId) return;
    pointerRef.current = null;
    props.stickRef.current = { x: 0, y: 0 };
    setKnob({ x: 0, y: 0, active: false });
  };

  return (
    <div className="flex flex-col items-center gap-1.5" style={{ touchAction: "none" }}>
      <div
        role="application"
        aria-label="Floating joystick — drag to walk"
        onPointerDown={(e) => {
          e.preventDefault();
          pointerRef.current = e.pointerId;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          update(e);
        }}
        onPointerMove={(e) => {
          if (pointerRef.current === e.pointerId) update(e);
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onContextMenu={(e) => e.preventDefault()}
        className="relative h-36 w-36 rounded-full border border-[#f3e9d2]/40 bg-[#1c1409]/45 shadow-lg backdrop-blur-[2px]"
        style={{ touchAction: "none", WebkitUserSelect: "none", userSelect: "none" }}
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute left-1/2 top-1/2 h-14 w-14 rounded-full border shadow-lg ${
            knob.active ? "border-[#f3e9d2] bg-[#d99a2b]/85" : "border-[#f3e9d2]/50 bg-[#f3e9d2]/25"
          }`}
          style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
        />
      </div>
      <p className="pointer-events-none text-[10px] font-semibold tracking-wide text-[#f3e9d2] [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
        Drag the stick to walk · WASD works too
      </p>
    </div>
  );
}
