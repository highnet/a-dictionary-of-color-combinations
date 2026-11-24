import { formatCmyk, formatRgb } from "./color";
import type { Colour, Palette } from "./dictionary";

const SITE = "A Dictionary of Color Combinations";

function varName(c: Colour): string {
  return c.id;
}

export function paletteHexList(p: Palette): string {
  return p.colors.map((c) => c.hex).join(" ");
}

export function paletteCss(p: Palette): string {
  const lines = p.colors.map(
    (c, i) => `  --wada-${p.code}-${i + 1}: ${c.hex}; /* ${c.name} · ${formatCmyk(c.cmyk)} */`,
  );
  const named = p.colors.map((c) => `  --${varName(c)}: ${c.hex};`);
  return `/* Sanzo Wada — combination ${p.code} */\n:root {\n${lines.join("\n")}\n\n${named.join("\n")}\n}\n`;
}

export function paletteJson(p: Palette, url: string): string {
  return JSON.stringify(
    {
      combination: p.code,
      source: `${SITE} — Sanzo Wada`,
      url,
      colors: p.colors.map((c) => ({
        name: c.name,
        hex: c.hex,
        rgb: c.rgb,
        cmyk: c.cmyk,
      })),
    },
    null,
    2,
  );
}

export function colourCss(c: Colour): string {
  return `--${varName(c)}: ${c.hex};`;
}

export function colourValues(c: Colour): string {
  return `${c.name}\n${c.hex}\n${formatRgb(c.rgb)}\n${formatCmyk(c.cmyk)}`;
}

/**
 * An SVG print of the combination: equal blocks in book order with names and
 * values set beneath. Self-contained (no external fonts).
 */
export function paletteSvg(p: Palette): string {
  const W = 1200;
  const block = W / p.size;
  const H = 820;
  const swatchH = 600;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const blocks = p.colors
    .map(
      (c, i) =>
        `<rect x="${i * block}" y="0" width="${block + 0.5}" height="${swatchH}" fill="${c.hex}"/>` +
        `<text x="${i * block + 24}" y="${swatchH + 56}" font-family="Georgia, serif" font-size="26" fill="#1f1c19">${esc(c.name)}</text>` +
        `<text x="${i * block + 24}" y="${swatchH + 92}" font-family="ui-monospace, monospace" font-size="20" fill="#4d4842">${c.hex.toUpperCase()}</text>` +
        `<text x="${i * block + 24}" y="${swatchH + 122}" font-family="ui-monospace, monospace" font-size="20" fill="#4d4842">${formatCmyk(c.cmyk)}</text>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><title>Sanzo Wada — combination ${p.code}</title><rect width="${W}" height="${H}" fill="#f6f3ec"/>${blocks}<text x="24" y="${H - 34}" font-family="ui-monospace, monospace" font-size="18" fill="#4d4842">No. ${p.code} · Sanzo Wada · ${esc(SITE)}</text></svg>`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Rasterise the SVG print to PNG at 2× via an offscreen canvas. */
export async function svgToPngBlob(svg: string, scale = 2): Promise<Blob> {
  const img = new Image();
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Could not render the image."));
    img.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable.");
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG encoding failed."))), "image/png"),
  );
}
