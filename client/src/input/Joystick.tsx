import { useEffect, useRef, useState } from "react";
import { t } from "../i18n";

// Floating virtual joystick — GITHUB PAGES ONLY (gated by JOYSTICK_ALLOWED
// from platform/target). Touch anywhere on the open game view and the
// stick appears under your thumb; drag to walk, lift to stop. Buttons
// (HUD, interact) sit above this layer and keep their own touches.
//
// Never render it in the Muse build: the Muse app shell's pull-to-refresh
// claims downward drags before the page sees them; Muse keeps the D-pad.
//
// Writes a vector (each axis -1…1, length ≤ 1) into `stickRef`; the frame
// loop adds it to keyboard/gamepad input.

const RADIUS = 56; // px the knob may travel from where the thumb landed

type Stick = { ox: number; oy: number; dx: number; dy: number };

export function Joystick(props: { stickRef: { current: { x: number; y: number } } }) {
  const pointerRef = useRef<number | null>(null);
  const [stick, setStick] = useState<Stick | null>(null);
  const { stickRef } = props;
  // Unmounting mid-drag (a dialogue opens) must not leave the player walking.
  useEffect(() => () => {
    stickRef.current = { x: 0, y: 0 };
  }, [stickRef]);

  const update = (ox: number, oy: number, cx: number, cy: number) => {
    let dx = cx - ox;
    let dy = cy - oy;
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    // Small dead zone so a resting thumb does not creep.
    stickRef.current = Math.hypot(dx, dy) < 8 ? { x: 0, y: 0 } : { x: dx / RADIUS, y: dy / RADIUS };
    setStick({ ox, oy, dx, dy });
  };
  const release = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerRef.current !== e.pointerId) return;
    pointerRef.current = null;
    stickRef.current = { x: 0, y: 0 };
    setStick(null);
  };

  return (
    <div
      role="application"
      aria-label={t("input.Joystick.0")}
      className="absolute inset-0 z-[5]"
      style={{ touchAction: "none", WebkitUserSelect: "none", userSelect: "none" }}
      onPointerDown={(e) => {
        if (pointerRef.current != null) return;
        e.preventDefault();
        pointerRef.current = e.pointerId;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        const r = e.currentTarget.getBoundingClientRect();
        const ox = e.clientX - r.left;
        const oy = e.clientY - r.top;
        update(ox, oy, ox, oy);
      }}
      onPointerMove={(e) => {
        if (pointerRef.current !== e.pointerId || !stick) return;
        const r = e.currentTarget.getBoundingClientRect();
        update(stick.ox, stick.oy, e.clientX - r.left, e.clientY - r.top);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onContextMenu={(e) => e.preventDefault()}
    >
      {stick ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute h-32 w-32 rounded-full border border-[#f3e9d2]/40 bg-[#1c1409]/35 backdrop-blur-[1px]"
          style={{ left: stick.ox - 64, top: stick.oy - 64 }}
        >
          <div
            className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full border border-[#f3e9d2] bg-[#d99a2b]/85 shadow-lg"
            style={{ transform: `translate(calc(-50% + ${stick.dx}px), calc(-50% + ${stick.dy}px))` }}
          />
        </div>
      ) : (
        <p className="pointer-events-none absolute bottom-6 left-5 max-w-[45%] text-[11px] font-semibold leading-snug text-[#f3e9d2]/85 [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
          {t("input.Joystick.1")}
        </p>
      )}
    </div>
  );
}
