import { useEffect, useRef, useState } from "react";
import { t } from "../i18n";
import { drawWorldMap, type MapView } from "../render/map";

// The map overlay: the whole world on parchment, or a closer look around the
// kobzar. Opened from the HUD's Map button, the M key, or gamepad Y; the
// game is paused while it is open (App freezes walking like for the sheet).
export function MapOverlay(props: {
  player: { x: number; y: number };
  flags: ReadonlySet<string>;
  target: { x: number; y: number } | null;
  title: string;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState<MapView["zoom"]>("world");
  const { player, flags, target } = props;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let raf = 0;
    const frame = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawWorldMap(ctx, rect.width, rect.height, { zoom, player }, flags, target, now);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [zoom, player, flags, target]);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#16281a]/75 p-3" style={{ touchAction: "none" }}>
      <div data-pad-scope className="flex max-h-full w-full max-w-3xl flex-col rounded-2xl border border-[#d9c491]/60 bg-[#f3e9d2] p-3 shadow-2xl">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-serif text-lg font-bold text-[#33241a]">{props.title}</h2>
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-lg bg-[#7a4a2b] px-3 py-1.5 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d3a1f]"
          >
            {t("ui.misc.71")}
          </button>
        </div>
        <div className="mt-2 flex gap-1.5" role="group" aria-label={t("map.zoom")}>
          {(["world", "near"] as const).map((z) => (
            <button
              key={z}
              type="button"
              aria-pressed={zoom === z}
              onClick={() => setZoom(z)}
              className={`rounded-lg px-3 py-1.5 font-serif text-xs font-bold ${zoom === z ? "bg-[#7a4a2b] text-[#f3e9d2]" : "bg-[#e2d3ae] text-[#5d4630]"}`}
            >
              {t(z === "world" ? "map.zoom.world" : "map.zoom.near")}
            </button>
          ))}
        </div>
        <canvas
          ref={canvasRef}
          className="mt-2 w-full rounded-lg border border-[#c9b083]"
          style={{ aspectRatio: zoom === "world" ? "3980 / 2300" : "4 / 3", touchAction: "none" }}
          aria-label={t("map.aria")}
        />
        <p className="mt-2 text-[12px] italic text-[#7a6248]">{t("map.legend")}</p>
      </div>
    </div>
  );
}
