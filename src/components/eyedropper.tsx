"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Copy, ExternalLink, Pipette, Search, Trash2, X } from "lucide-react";
import { copyText } from "./copy-button";
import { useHref, useTranslation } from "@/i18n/client";
import { formatCmyk, hexToLab, hexToRgb, inkOn } from "@/lib/color";

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

/**
 * From a toggle button: turn the picker on or off and let go of focus, so
 * Enter picks a colour instead of pressing the toggle again.
 */
function toggleFromButton(e: React.MouseEvent<HTMLButtonElement>) {
  toggleEyedropper();
  e.currentTarget.blur();
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

/** Let the browser normalise any CSS colour (oklch, color-mix…) by painting one pixel. */
function cssToHex(css: string): string | null {
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

/** The element whose text glyph (not just its box) sits under the point, if any. */
function textAt(x: number, y: number): Element | null {
  const doc = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  };
  let node: Node | null = null;
  let offset = 0;
  if (doc.caretPositionFromPoint) {
    const p = doc.caretPositionFromPoint(x, y);
    if (p) {
      node = p.offsetNode;
      offset = p.offset;
    }
  } else if (document.caretRangeFromPoint) {
    const r = document.caretRangeFromPoint(x, y);
    if (r) {
      node = r.startContainer;
      offset = r.startOffset;
    }
  }
  const text = node?.textContent ?? "";
  if (!node || node.nodeType !== Node.TEXT_NODE || !text.trim()) return null;
  // The caret lands beside the nearest character; check that character's box.
  const range = document.createRange();
  for (const start of [Math.max(0, offset - 1), Math.min(offset, text.length - 1)]) {
    range.setStart(node, start);
    range.setEnd(node, Math.min(start + 1, text.length));
    for (const b of range.getClientRects()) {
      if (x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) return node.parentElement;
    }
  }
  return null;
}

type Sampler = (x: number, y: number) => string | null;

/**
 * A sampler for one frame. Computed styles are cached per element, so the
 * magnifier's 121 points cost little more than one.
 */
/** A viewport rectangle the sampler will be asked about, so canvases can be read once. */
interface Region {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * Read a canvas over a viewport region in one getImageData call (one GPU
 * readback), and answer points inside it from that copy.
 */
function canvasReader(el: HTMLCanvasElement, region: Region) {
  try {
    const ctx = el.getContext("2d");
    if (!ctx) return null;
    const r = el.getBoundingClientRect();
    const sx = el.width / r.width;
    const sy = el.height / r.height;
    const px0 = Math.max(0, Math.floor((region.x0 - r.left) * sx));
    const py0 = Math.max(0, Math.floor((region.y0 - r.top) * sy));
    const px1 = Math.min(el.width, Math.ceil((region.x1 - r.left) * sx) + 1);
    const py1 = Math.min(el.height, Math.ceil((region.y1 - r.top) * sy) + 1);
    if (px1 <= px0 || py1 <= py0) return () => null;
    const data = ctx.getImageData(px0, py0, px1 - px0, py1 - py0);
    return (x: number, y: number): string | null => {
      const px = Math.floor((x - r.left) * sx) - px0;
      const py = Math.floor((y - r.top) * sy) - py0;
      if (px < 0 || py < 0 || px >= data.width || py >= data.height) return fromCanvas(el, x, y);
      const i = (py * data.width + px) * 4;
      return data.data[i + 3] === 0 ? null : rgbHex(data.data[i], data.data[i + 1], data.data[i + 2]);
    };
  } catch {
    return null; // tainted or not a 2D canvas
  }
}

function makeSampler(skip: (el: Element) => boolean, mode: "fill" | "text", region?: Region): Sampler {
  const cache = new Map<Element, string | null>();
  const canvases = new Map<HTMLCanvasElement, ((x: number, y: number) => string | null) | null>();
  const readCanvas = (el: HTMLCanvasElement, x: number, y: number) => {
    if (!region) return fromCanvas(el, x, y);
    if (!canvases.has(el)) canvases.set(el, canvasReader(el, region));
    const read = canvases.get(el);
    return read ? read(x, y) : null;
  };
  const fill = (el: Element) => {
    if (!cache.has(el)) {
      const style = getComputedStyle(el);
      const css = el instanceof SVGElement && !(el instanceof SVGSVGElement) ? style.fill : style.backgroundColor;
      cache.set(el, isOpaque(css) ? cssToHex(css) : null);
    }
    return cache.get(el) ?? null;
  };
  return (x, y) => {
    if (mode === "text") {
      const el = textAt(x, y);
      if (el && !skip(el)) return cssToHex(getComputedStyle(el).color);
    }
    for (const el of document.elementsFromPoint(x, y)) {
      if (skip(el)) continue;
      if (el instanceof HTMLCanvasElement) {
        const hex = readCanvas(el, x, y);
        if (hex) return hex;
        continue;
      }
      if (el instanceof SVGSVGElement) continue;
      const hex = fill(el);
      if (hex) return hex;
    }
    return fill(document.body);
  };
}

/* ------------------------------------------------------------------ */
/* Nearest Wada colour: loaded only once the picker is first used.     */
/* ------------------------------------------------------------------ */

interface Match {
  id: string;
  name: string;
  /** First Japanese name from the plates, for the 駒. */
  ja: string | null;
  hex: string;
  cmyk: readonly number[];
  distance: number;
  exact: boolean;
}
type Nearest = (hex: string) => Match | null;
let nearestPromise: Promise<Nearest> | null = null;
function loadNearest() {
  nearestPromise ??= Promise.all([import("@/lib/dictionary"), import("@/lib/plate-names")]).then(
    ([{ nearestColours }, { plateNameJa }]) =>
      (hex: string) => {
        const hit = nearestColours(hexToLab(hex), 1)[0];
        if (!hit) return null;
        return {
          id: hit.colour.id,
          name: hit.colour.name,
          ja: plateNameJa(hit.colour.id)?.name.split(/[、，,（(]/)[0] ?? null,
          hex: hit.colour.hex,
          cmyk: hit.colour.cmyk,
          distance: hit.distance,
          exact: hit.distance < 0.5,
        };
      },
  );
  return nearestPromise;
}

/* ------------------------------------------------------------------ */
/* Formats and the tray of recent picks                                */
/* ------------------------------------------------------------------ */

type Format = "hex" | "rgb" | "cmyk";
const FORMATS: Format[] = ["hex", "rgb", "cmyk"];
const FORMAT_KEY = "dcc:eyedropper-format";
const TRAY_KEY = "dcc:eyedropper-tray";
const TRAY_MAX = 8;

const nextFormat = (f: Format) => FORMATS[(FORMATS.indexOf(f) + 1) % FORMATS.length];

/** Naive sRGB → CMYK, for colours that are not one of Wada's printed inks. */
function rgbToCmyk([r, g, b]: readonly number[]) {
  const k = 1 - Math.max(r, g, b) / 255;
  if (k >= 1) return [0, 0, 0, 100];
  const f = (v: number) => Math.round(((1 - v / 255 - k) / (1 - k)) * 100);
  return [f(r), f(g), f(b), Math.round(k * 100)];
}

/**
 * The value in a format. CMYK uses the book's printed values when the colour
 * is exactly one of Wada's; otherwise it is a conversion, marked ≈.
 */
function formatValue(hex: string, format: Format, match: Match | null): string {
  const rgb = hexToRgb(hex);
  if (format === "rgb") return `rgb(${rgb.join(" ")})`;
  if (format === "cmyk") return match?.exact ? formatCmyk(match.cmyk) : `≈ ${formatCmyk(rgbToCmyk(rgb))}`;
  return hex.toUpperCase();
}

/** Copy a value; the ≈ mark is for reading, not for pasting. */
function copyValue(value: string, label = value) {
  return copyText(value.replace(/^≈ /, ""), label);
}

function readStore<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeStore(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
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
      onClick={toggleFromButton}
      aria-pressed={on}
      data-eyedropper-ignore
      title={t("eyedropper.title")}
      className={`sb-row flex items-center gap-3.5 px-[0.9rem] text-left text-sm transition-colors ${
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
      onClick={toggleFromButton}
      aria-pressed={on}
      data-eyedropper-ignore
      aria-label={t("eyedropper.label")}
      className={`grid size-11 place-items-center transition-colors ${on ? "bg-sumi text-washi" : ""}`}
    >
      <Pipette className="size-5" strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}

/** A small 駒 for the nearest Wada colour; markup only, so no data is bundled with it. */
function MiniKoma({ match }: { match: Match }) {
  const style = {
    "--koma-w": "1.9rem",
    "--koma-face": match.hex,
    "--koma-ink": inkOn(hexToRgb(match.hex)) === "ink" ? "#1f1c19" : "#f6f3ec",
    "--koma-chars": match.ja ? [...match.ja].length : 2,
  } as CSSProperties;
  return (
    <span className="koma koma-sm" style={style} aria-hidden="true">
      <span className="koma-edge" />
      <span className="koma-face">
        {match.ja ? (
          <span lang="ja" className="koma-kanji">
            {match.ja}
          </span>
        ) : null}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* The loupe, the slip and the tray                                    */
/* ------------------------------------------------------------------ */

const GRID = 11; // magnifier cells per side (odd, so there is one centre cell)
const STEP = 2; // CSS px between sampled points
const CELL = 9; // drawn size of one cell
const LOUPE = GRID * CELL; // 99px

type NativeDropper = new () => { open: () => Promise<{ sRGBHex: string }> };
const nativeDropper = (): NativeDropper | null =>
  typeof window !== "undefined" && "EyeDropper" in window ? (window as unknown as { EyeDropper: NativeDropper }).EyeDropper : null;

interface Pick {
  hex: string;
  at: number;
}

/** Mounted once in the layout. Follows the pointer while the picker is on. */
export function EyedropperLayer() {
  const on = useEyedropper();
  const { t } = useTranslation();
  const href = useHref();
  const layer = useRef<HTMLDivElement>(null);
  const tray = useRef<HTMLDivElement>(null);
  const loupe = useRef<HTMLCanvasElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number; touch: boolean } | null>(null);
  const [hex, setHex] = useState<string | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [mode, setMode] = useState<"fill" | "text">("fill");
  const [format, setFormat] = useState<Format>("hex");
  const [picks, setPicks] = useState<Pick[]>([]);
  const [native, setNative] = useState(false);
  const [view, setView] = useState({ w: 0, h: 0 });
  const nearest = useRef<Nearest | null>(null);
  // The same lookup as state, so the tray re-renders once the colour data loads.
  const [lookup, setLookup] = useState<Nearest | null>(null);
  const formatRef = useRef(format);

  const changeFormat = () =>
    setFormat((f) => {
      const next = nextFormat(f);
      formatRef.current = next;
      writeStore(FORMAT_KEY, next);
      return next;
    });

  // Keyboard: I toggles anywhere outside a text field; Esc leaves.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && active) {
        setActive(false);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.toLowerCase() !== "i") return;
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable='true']")) return;
      e.preventDefault();
      toggleEyedropper();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!on) return;
    let cancelled = false;

    // Per-viewer conveniences, restored when the picker opens (after this effect, not during it).
    const restoredFormat = readStore<Format>(FORMAT_KEY, "hex");
    const restoredPicks = readStore<Pick[]>(TRAY_KEY, []);
    queueMicrotask(() => {
      if (cancelled) return;
      const f = FORMATS.includes(restoredFormat) ? restoredFormat : "hex";
      formatRef.current = f;
      setFormat(f);
      setPicks(Array.isArray(restoredPicks) ? restoredPicks.slice(0, TRAY_MAX) : []);
      setNative(!!nativeDropper());
      setView({ w: window.innerWidth, h: window.innerHeight });
    });
    loadNearest().then((fn) => {
      if (cancelled) return;
      nearest.current = fn;
      setLookup(() => fn);
    });

    const skip = (el: Element) =>
      !!(layer.current?.contains(el) || tray.current?.contains(el) || el.closest("[data-eyedropper-skip], .dojo-floor"));

    let frame = 0;
    let last = { x: -1, y: -1, touch: false };
    let textMode = false;

    const draw = (sampler: Sampler, centre: string | null) => {
      const cv = loupe.current;
      const ctx = cv?.getContext("2d");
      if (!cv || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (cv.width !== LOUPE * dpr) cv.width = cv.height = LOUPE * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const half = (GRID - 1) / 2;
      for (let j = 0; j < GRID; j++) {
        for (let i = 0; i < GRID; i++) {
          ctx.fillStyle = sampler(last.x + (i - half) * STEP, last.y + (j - half) * STEP) ?? "#000";
          ctx.fillRect(i * CELL, j * CELL, CELL, CELL);
        }
      }
      if (centre) {
        ctx.fillStyle = centre;
        ctx.fillRect(half * CELL, half * CELL, CELL, CELL);
      }
      // A faint pixel grid, then the centre cell outlined in white and black.
      ctx.strokeStyle = "rgb(0 0 0 / 0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = 1; k < GRID; k++) {
        ctx.moveTo(k * CELL + 0.5, 0);
        ctx.lineTo(k * CELL + 0.5, LOUPE);
        ctx.moveTo(0, k * CELL + 0.5);
        ctx.lineTo(LOUPE, k * CELL + 0.5);
      }
      ctx.stroke();
      ctx.strokeStyle = "#fff";
      ctx.strokeRect(half * CELL - 0.5, half * CELL - 0.5, CELL + 1, CELL + 1);
      ctx.strokeStyle = "#000";
      ctx.strokeRect(half * CELL - 1.5, half * CELL - 1.5, CELL + 3, CELL + 3);
    };

    const sample = () => {
      frame = 0;
      if (last.x < 0) return;
      const reach = ((GRID - 1) / 2) * STEP;
      const fill = makeSampler(skip, "fill", {
        x0: last.x - reach,
        y0: last.y - reach,
        x1: last.x + reach,
        y1: last.y + reach,
      });
      const h = textMode ? makeSampler(skip, "text")(last.x, last.y) : fill(last.x, last.y);
      setPos(last);
      setHex(h);
      setMatch(h && nearest.current ? nearest.current(h) : null);
      // The magnifier always shows the page. Browsers report a character's box,
      // not its strokes, so in text mode only the centre cell takes the text colour.
      draw(fill, h);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sample);
    };

    const pick = (h: string) => {
      const m = nearest.current?.(h) ?? null;
      const value = formatValue(h, formatRef.current, m);
      copyValue(value, m?.exact ? `${value} · ${m.name}` : value);
      setPicks((prev) => {
        const next = [{ hex: h, at: Date.now() }, ...prev.filter((p) => p.hex !== h)].slice(0, TRAY_MAX);
        writeStore(TRAY_KEY, next);
        return next;
      });
    };

    const setText = (next: boolean) => {
      if (next === textMode) return;
      textMode = next;
      setMode(next ? "text" : "fill");
      schedule();
    };

    const onMove = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest?.("[data-eyedropper-ignore]")) return;
      last = { x: e.clientX, y: e.clientY, touch: e.pointerType === "touch" };
      setText(e.altKey);
      schedule();
    };
    // Swallow the click so links and buttons under the cursor don't fire, and pick instead.
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest("[data-eyedropper-ignore]")) return;
      e.preventDefault();
      e.stopPropagation();
      const h = makeSampler(skip, e.altKey ? "text" : "fill")(e.clientX, e.clientY);
      if (h) pick(h);
    };
    // The browser's own eyedropper reads real pixels anywhere on screen (Chromium only).
    const openNative = async () => {
      const Dropper = nativeDropper();
      if (!Dropper) return;
      try {
        const { sRGBHex } = await new Dropper().open();
        const h = sRGBHex.startsWith("#") ? sRGBHex.toLowerCase() : cssToHex(sRGBHex);
        if (!h) return;
        pick(h);
        setHex(h);
        setMatch(nearest.current?.(h) ?? null);
      } catch {
        // Cancelled with Esc.
      }
    };
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (e.key === "Alt") {
        e.preventDefault(); // keep Alt from opening the browser menu on Windows
        setText(true);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const step = e.shiftKey ? 10 : 1;
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      const move = moves[e.key];
      if (move) {
        e.preventDefault();
        if (last.x < 0) last = { x: window.innerWidth / 2, y: window.innerHeight / 2, touch: false };
        last = { ...last, x: last.x + move[0], y: last.y + move[1] };
        schedule();
      } else if (e.key === "Enter" && last.x >= 0 && !(el && tray.current?.contains(el))) {
        e.preventDefault();
        const h = makeSampler(skip, textMode ? "text" : "fill")(last.x, last.y);
        if (h) pick(h);
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        changeFormat();
      } else if (e.key.toLowerCase() === "p") {
        e.preventDefault();
        void openNative();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") setText(false);
    };
    const onLeave = () => setPos(null);
    const onResize = () => setView({ w: window.innerWidth, h: window.innerHeight });
    const onNative = () => void openNative();

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", schedule, { passive: true, capture: true });
    window.addEventListener("dcc:eyedropper-native", onNative);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("dcc:eyedropper-native", onNative);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      setPos(null);
      setHex(null);
      setMatch(null);
      setMode("fill");
    };
  }, [on]);

  if (!on) return null;

  const value = hex ? formatValue(hex, format, match) : "—";
  // On touch, lift the loupe above the finger so it stays visible.
  const lift = pos?.touch ? LOUPE + 28 : 0;
  // Keep the slip on screen near the right and bottom edges.
  const flipX = pos ? pos.x > view.w - 300 : false;
  const flipY = pos ? pos.y - lift > view.h - 220 : false;

  const removePick = (h: string) =>
    setPicks((prev) => {
      const next = prev.filter((p) => p.hex !== h);
      writeStore(TRAY_KEY, next);
      return next;
    });

  return (
    <>
      <div ref={layer} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60]">
        <div
          className="absolute"
          style={{
            transform: `translate(${pos?.x ?? -999}px, ${(pos?.y ?? -999) - lift}px)`,
            visibility: pos ? "visible" : "hidden",
          }}
        >
          {/* The magnifier: an 11 × 11 grid of the points around the cursor. */}
          <canvas
            ref={loupe}
            className="absolute rounded-full border-[3px] border-washi shadow-[0_0_0_1px_var(--sumi),0_8px_24px_-6px_rgb(0_0_0/0.45)]"
            style={{ width: LOUPE, height: LOUPE, left: -LOUPE / 2, top: -LOUPE / 2 }}
          />
          {/* The slip: the value, and the nearest of Wada's colours. */}
          <div
            className="absolute w-max max-w-[17rem] border border-rule bg-washi text-sumi shadow-[0_6px_18px_-8px_rgb(0_0_0/0.35)]"
            style={{
              left: flipX ? undefined : -LOUPE / 2,
              right: flipX ? -LOUPE / 2 : undefined,
              top: flipY ? undefined : LOUPE / 2 + 10,
              bottom: flipY ? LOUPE / 2 + 10 : undefined,
            }}
          >
            <div className="flex items-center gap-2 px-2.5 py-1.5">
              <span className="size-4 shrink-0 border border-rule" style={{ background: hex ?? "transparent" }} />
              <span className="font-data text-[0.75rem] tracking-tight">{value}</span>
              <span className="ml-auto pl-2 font-data text-[0.65rem] text-sumi-soft uppercase">
                {mode === "text" ? t("eyedropper.text") : format}
              </span>
            </div>
            {match ? (
              <div className="flex items-center gap-2.5 border-t border-rule px-2.5 py-2">
                <MiniKoma match={match} />
                <span className="min-w-0 text-xs leading-snug">
                  <span className="block truncate">{match.name}</span>
                  <span className="block text-sumi-soft">
                    {match.exact ? t("eyedropper.exact") : t("eyedropper.deltaE", { d: match.distance.toFixed(1) })}
                  </span>
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* The tray: recent picks, format and keys, bottom left, clear of the toasts in the centre. */}
      <div
        ref={tray}
        data-eyedropper-ignore
        role="region"
        aria-label={t("eyedropper.tray")}
        className="fixed right-4 bottom-4 left-4 z-[61] flex flex-col md:right-auto md:w-max md:max-w-[min(44rem,calc(100vw-2rem))] lg:left-[calc(var(--sb-w)+1rem)] gap-2 border border-rule bg-washi p-2.5 text-sumi shadow-[0_10px_30px_-12px_rgb(0_0_0/0.45)]"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-sumi-soft">
          <span className="hidden md:inline">{t("eyedropper.keys")}</span>
          <button
            type="button"
            onClick={changeFormat}
            className="min-h-8 border border-rule px-2 font-data text-[0.7rem] text-sumi uppercase hover:border-sumi"
            aria-label={t("eyedropper.formatLabel", { format: format.toUpperCase() })}
          >
            {format}
          </button>
          {native ? (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("dcc:eyedropper-native"))}
              className="min-h-8 border border-rule px-2 text-sumi hover:border-sumi"
            >
              {t("eyedropper.native")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setActive(false)}
            className="ml-auto grid size-8 place-items-center hover:text-sumi"
            aria-label={t("eyedropper.close")}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        {picks.length ? (
          <ul className="flex flex-wrap gap-1.5" aria-label={t("eyedropper.recent")}>
            {picks.map((p) => {
              const m = lookup?.(p.hex) ?? null;
              const v = formatValue(p.hex, format, m);
              const name = m ? ` · ${m.exact ? "" : "≈ "}${m.name}` : "";
              return (
                <li key={p.hex} className="group relative">
                  <button
                    type="button"
                    onClick={() => copyValue(v)}
                    className="block size-9 border border-rule"
                    style={{ background: p.hex }}
                    title={`${v}${name}`}
                    aria-label={t("copy.aria", { label: `${v}${name}` })}
                  />
                  {/* Actions on hover or keyboard focus. */}
                  <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 flex -translate-x-1/2 gap-0.5 border border-rule bg-washi p-0.5 opacity-0 transition-opacity group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100">
                    <button
                      type="button"
                      className="grid size-7 place-items-center hover:bg-washi-deep"
                      aria-label={t("copy.aria", { label: v })}
                      onClick={() => copyValue(v)}
                    >
                      <Copy className="size-3.5" aria-hidden="true" />
                    </button>
                    {m ? (
                      <a
                        className="grid size-7 place-items-center hover:bg-washi-deep"
                        href={href(`/colours/${m.id}`)}
                        aria-label={t("eyedropper.open", { name: m.name })}
                      >
                        <ExternalLink className="size-3.5" aria-hidden="true" />
                      </a>
                    ) : null}
                    <a
                      className="grid size-7 place-items-center hover:bg-washi-deep"
                      href={href(`/colours?hex=${p.hex.slice(1)}`)}
                      aria-label={t("eyedropper.search")}
                    >
                      <Search className="size-3.5" aria-hidden="true" />
                    </a>
                    <button
                      type="button"
                      className="grid size-7 place-items-center hover:bg-washi-deep"
                      aria-label={t("eyedropper.remove")}
                      onClick={() => removePick(p.hex)}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-sumi-soft">{t("eyedropper.empty")}</p>
        )}
      </div>
    </>
  );
}
