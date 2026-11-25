"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Pipette } from "lucide-react";
import { copyText } from "./copy-button";
import { useTranslation } from "@/i18n/client";
import { hexToLab, inkOn, hexToRgb } from "@/lib/color";

/* ------------------------------------------------------------------ */
/* State: one flag shared by every toggle and the loupe layer.         */
/* ------------------------------------------------------------------ */

const listeners = new Set<() => void>();
let active = false;

function setActive(next: boolean) {
  if (next === active) return;
  active = next;
  const root = document.documentElement;
  if (active) root.dataset.eyedropper = "on";
  else delete root.dataset.eyedropper;
  listeners.forEach((l) => l());
}

export function toggleEyedropper() {
  setActive(!active);
}

function useEyedropper() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => active,
    () => false,
  );
}

/* ------------------------------------------------------------------ */
/* Sampling: read the colour painted under a point.                    */
/* ------------------------------------------------------------------ */

function cssToHex(css: string): string | null {
  // Let the browser normalise any CSS colour (oklch, color-mix, named…)
  // by painting it into a 1×1 canvas and reading the pixel back.
  const ctx = probe();
  if (!ctx) return null;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = "#000";
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  if (a === 0) return null;
  return rgbHex(r, g, b);
}

let probeCtx: CanvasRenderingContext2D | null | undefined;
function probe() {
  if (probeCtx === undefined) {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    probeCtx = c.getContext("2d", { willReadFrequently: true });
  }
  return probeCtx;
}

function rgbHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Alpha of a computed CSS colour: the 4th comma value of rgba(), or the value
 * after "/" in space syntax. Opaque colours (rgb(255, 242, 0)) report 1.
 */
function alphaOf(css: string): number {
  if (!css || css === "transparent" || css === "none") return 0;
  const m = css.match(/\/\s*([\d.]+)(%?)\s*\)$/) ?? css.match(/^rgba?\((?:[^,]*,){3}\s*([\d.]+)(%?)\s*\)$/);
  if (!m) return 1;
  const v = parseFloat(m[1]);
  return m[2] ? v / 100 : v;
}

/** Solid enough to be "the colour you see": faint tints (hover washes, overlays) are looked through. */
function isOpaque(css: string) {
  return alphaOf(css) >= 0.5;
}

function fromCanvas(el: HTMLCanvasElement, x: number, y: number): string | null {
  try {
    const ctx = el.getContext("2d");
    if (!ctx) return null;
    const r = el.getBoundingClientRect();
    const px = Math.floor(((x - r.left) / r.width) * el.width);
    const py = Math.floor(((y - r.top) / r.height) * el.height);
    const [R, G, B, A] = ctx.getImageData(px, py, 1, 1).data;
    return A === 0 ? null : rgbHex(R, G, B);
  } catch {
    return null; // tainted or not a 2D canvas
  }
}

/** The colour visible at a viewport point, or null when nothing opaque. */
function sampleAt(x: number, y: number, skip: Element | null): string | null {
  for (const el of document.elementsFromPoint(x, y)) {
    if (skip?.contains(el) || el.closest("[data-eyedropper-skip], .dojo-floor")) continue;
    if (el instanceof HTMLCanvasElement) {
      const hex = fromCanvas(el, x, y);
      if (hex) return hex;
      continue;
    }
    const style = getComputedStyle(el);
    if (el instanceof SVGElement && !(el instanceof SVGSVGElement)) {
      if (isOpaque(style.fill)) return cssToHex(style.fill);
      continue;
    }
    if (isOpaque(style.backgroundColor)) return cssToHex(style.backgroundColor);
  }
  return cssToHex(getComputedStyle(document.body).backgroundColor);
}

/* ------------------------------------------------------------------ */
/* Nearest Wada colour: loaded only once the picker is first used.     */
/* ------------------------------------------------------------------ */

type Nearest = (hex: string) => { name: string; id: string; exact: boolean } | null;
let nearestPromise: Promise<Nearest> | null = null;
function loadNearest() {
  nearestPromise ??= import("@/lib/dictionary").then(({ nearestColours }) => (hex: string) => {
    const hit = nearestColours(hexToLab(hex), 1)[0];
    return hit ? { name: hit.colour.name, id: hit.colour.id, exact: hit.distance < 0.5 } : null;
  });
  return nearestPromise;
}

/* ------------------------------------------------------------------ */
/* Toggle buttons                                                      */
/* ------------------------------------------------------------------ */

/** Sidebar row, matching the Saved / Fold rows. */
export function EyedropperToggle() {
  const on = useEyedropper();
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={toggleEyedropper}
      aria-pressed={on}
      data-eyedropper-ignore
      title={t("eyedropper.title")}
      className={`flex h-11 items-center gap-3.5 px-[1.15rem] text-left text-sm transition-colors ${
        on ? "bg-sumi text-washi" : "text-sumi-soft hover:bg-washi-deep hover:text-sumi"
      }`}
    >
      <Pipette className="size-[1.15rem] shrink-0" strokeWidth={1.5} aria-hidden="true" />
      <span className="sb-label flex flex-1 justify-between">
        {t("eyedropper.label")} <kbd className="font-data text-xs opacity-60">I</kbd>
      </span>
    </button>
  );
}

/** Icon-only button for the mobile top bar. */
export function EyedropperIconToggle() {
  const on = useEyedropper();
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={toggleEyedropper}
      aria-pressed={on}
      data-eyedropper-ignore
      aria-label={t("eyedropper.label")}
      className={`grid size-11 place-items-center transition-colors ${on ? "bg-sumi text-washi" : ""}`}
    >
      <Pipette className="size-5" strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* The loupe                                                           */
/* ------------------------------------------------------------------ */

const LOUPE = 72;

/** Mounted once in the layout. Follows the pointer while the picker is on. */
export function EyedropperLayer() {
  const on = useEyedropper();
  const { t } = useTranslation();
  const layer = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number; touch: boolean } | null>(null);
  const [hex, setHex] = useState<string | null>(null);
  const [near, setNear] = useState<ReturnType<Nearest>>(null);
  const nearest = useRef<Nearest | null>(null);

  // Keyboard: I toggles anywhere outside a text field; Esc leaves.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && active) {
        setActive(false);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.toLowerCase() !== "i") return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable='true']")) return;
      e.preventDefault();
      toggleEyedropper();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!on) return;
    let cancelled = false;
    loadNearest().then((fn) => {
      if (!cancelled) nearest.current = fn;
    });

    let frame = 0;
    let last = { x: 0, y: 0, touch: false };
    const sample = () => {
      frame = 0;
      const h = sampleAt(last.x, last.y, layer.current);
      setPos(last);
      setHex(h);
      setNear(h && nearest.current ? nearest.current(h) : null);
    };
    const onMove = (e: PointerEvent) => {
      last = { x: e.clientX, y: e.clientY, touch: e.pointerType === "touch" };
      if (!frame) frame = requestAnimationFrame(sample);
    };
    // Swallow the click so links and buttons under the cursor don't fire,
    // and copy the sampled colour instead.
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (t?.closest("[data-eyedropper-ignore]")) return;
      e.preventDefault();
      e.stopPropagation();
      const h = sampleAt(e.clientX, e.clientY, layer.current);
      if (h) {
        const n = nearest.current?.(h);
        copyText(h.toUpperCase(), n?.exact ? `${h.toUpperCase()} · ${n.name}` : h.toUpperCase());
      }
    };
    const onLeave = () => setPos(null);
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(sample);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("click", onClick, true);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("scroll", onScroll, true);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      setPos(null);
      setHex(null);
      setNear(null);
    };
  }, [on]);

  if (!on) return null;

  const ink = hex ? (inkOn(hexToRgb(hex)) === "ink" ? "var(--sumi)" : "var(--washi)") : "var(--sumi)";
  // On touch, lift the loupe above the finger so it stays visible.
  const lift = pos?.touch ? LOUPE + 24 : 0;

  return (
    <div ref={layer} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60]">
      {pos && (
        <div
          className="absolute"
          style={{ transform: `translate(${pos.x}px, ${pos.y - lift}px)` }}
        >
          <div
            className="absolute rounded-full border-[3px] border-washi shadow-[0_0_0_1px_var(--sumi),0_8px_24px_-6px_rgb(0_0_0/0.45)]"
            style={{
              width: LOUPE,
              height: LOUPE,
              left: -LOUPE / 2,
              top: -LOUPE / 2,
              background: hex ?? "transparent",
            }}
          >
            <span
              className="absolute top-1/2 left-1/2 size-2 -translate-1/2 border"
              style={{ borderColor: ink }}
            />
          </div>
          <div
            className="absolute flex items-center gap-2 border border-rule bg-washi px-2.5 py-1.5 whitespace-nowrap text-sumi shadow-[0_6px_18px_-8px_rgb(0_0_0/0.35)]"
            style={{ left: -LOUPE / 2, top: LOUPE / 2 + 8 }}
          >
            <span className="size-3.5 border border-rule" style={{ background: hex ?? "transparent" }} />
            <span className="font-data text-[0.75rem] tracking-tight">{hex?.toUpperCase() ?? "—"}</span>
            {near && (
              <span className="text-xs text-sumi-soft">
                {near.exact ? "" : "≈ "}
                {near.name}
              </span>
            )}
          </div>
        </div>
      )}
      <p className="absolute top-4 left-1/2 hidden -translate-x-1/2 bg-sumi px-3 py-1.5 text-xs text-washi md:block">
        {t("eyedropper.hint")}
      </p>
    </div>
  );
}
