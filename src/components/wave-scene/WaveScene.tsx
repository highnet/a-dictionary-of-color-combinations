"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { INKS } from "./palette";
import { WavePoster } from "./poster";

/**
 * The Great Wave, after Hokusai, as a living print: a procedural wave, Verlet
 * foam, droplets, boats on spring buoyancy, all inked in Wada's colours.
 */
export function WaveScene() {
  const host = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(true);
  const [live, setLive] = useState(false);
  const control = useRef<{ setPlaying(p: boolean): void } | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const params = new URLSearchParams(window.location.search);
    const hold = Number(params.get("wave"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      await new Promise<void>((r) =>
        "requestIdleCallback" in window ? requestIdleCallback(() => r(), { timeout: 1200 }) : setTimeout(r, 200),
      );
      if (disposed) return;
      if (reduced) setPlaying(false);
      const probe = document.createElement("canvas").getContext("webgl2");
      if (!probe) return; // keep the poster
      const { createStage } = await import("./scene");
      if (disposed) return;
      const canvas = document.createElement("canvas");
      canvas.setAttribute("aria-hidden", "true");
      canvas.className = "absolute inset-0 size-full";
      el.appendChild(canvas);
      const stage = createStage(canvas, hold > 0 ? hold : reduced ? 4.6 : 0);
      let running = !reduced && !(hold > 0);
      let raf = 0;
      let last = performance.now();
      let onScreen = true;

      const resize = () => {
        if (el.clientWidth && el.clientHeight) stage.resize(el.clientWidth, el.clientHeight);
      };
      const loop = (now: number) => {
        raf = 0;
        const dt = Math.min((now - last) / 1000, 1 / 24);
        last = now;
        stage.render(dt, running);
        if (running && onScreen && !document.hidden) raf = requestAnimationFrame(loop);
      };
      const kick = () => {
        if (!raf && running) {
          last = performance.now();
          raf = requestAnimationFrame(loop);
        }
      };
      // The pointer is a breath of wind on the foam.
      let px: number | null = null;
      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (inside && px !== null) stage.setWind(Math.max(-1.5, Math.min(1.5, (e.clientX - px) * 0.08)));
        px = inside ? e.clientX : null;
      };
      const calm = setInterval(() => stage.setWind(0), 400);

      const ro = new ResizeObserver(resize);
      ro.observe(el);
      resize();
      const io = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) kick();
      });
      io.observe(el);
      const onVis = () => !document.hidden && kick();
      document.addEventListener("visibilitychange", onVis);
      window.addEventListener("pointermove", onMove, { passive: true });
      control.current = {
        setPlaying(p) {
          running = p && !reduced && !(hold > 0);
          kick();
        },
      };
      setLive(true);
      kick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        clearInterval(calm);
        ro.disconnect();
        io.disconnect();
        document.removeEventListener("visibilitychange", onVis);
        window.removeEventListener("pointermove", onMove);
        stage.dispose();
        canvas.remove();
        control.current = null;
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  useEffect(() => {
    control.current?.setPlaying(playing);
  }, [playing]);

  const inks = [INKS.body, INKS.mid, INKS.pale, INKS.foam, INKS.sky];

  return (
    <div className="relative flex h-full flex-col">
      <div className="kento relative min-h-0 flex-1">
        <div className="absolute inset-0 overflow-hidden bg-[#ebd3a2]" ref={host}>
          {!live ? <WavePoster className="absolute inset-0 [&>svg]:size-full" /> : null}
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-x-4 px-[var(--gutter)] lg:px-0">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-sumi-soft">After Hokusai, inked in Wada&rsquo;s colours</p>
          <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Colours used in the print">
            {inks.map((c) => (
              <li key={c.id}>
                <Link href={`/colours/${c.id}`} className="group flex items-center gap-2">
                  <span className="size-3.5 shrink-0 ring-1 ring-sumi/15" style={{ backgroundColor: c.hex }} aria-hidden="true" />
                  <span className="text-[0.78rem] leading-tight group-hover:underline">
                    <span className="sr-only sm:not-sr-only">{c.name}</span>
                    <span className="font-data text-xs text-sumi-soft uppercase sm:ml-1.5">{c.hex}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="grid size-11 shrink-0 place-items-center hover:bg-washi-deep"
          aria-label={playing ? "Pause the wave" : "Play the wave"}
          aria-pressed={!playing}
        >
          {playing ? <Pause className="size-4" strokeWidth={1.6} /> : <Play className="size-4" strokeWidth={1.6} />}
        </button>
      </div>
    </div>
  );
}
