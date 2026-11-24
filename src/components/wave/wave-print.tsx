/**
 * Static woodblock wave, drawn as a carved key-block would be: trochoid swells
 * (sharp crests, broad troughs), one front swell with a hooked lip and a tier
 * of foam dots, and key-lines as tapered filled shapes that swell at the
 * crests. Lines turn washi where the band beneath is too dark to hold sumi.
 * Used before WebGL loads, when it is unavailable, and on software renderers.
 */

const W = 800;
const H = 420;
const INK = "#1f1c19";
const PAPER = "#eceee8";

function luminance(hex: string) {
  const v = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(v.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Trochoid edge: x = s − r·sin(s), y = −r·cos(s) gives cusped crests. */
function edge(base: number, amp: number, wavelength: number, phase: number) {
  const pts: [number, number][] = [];
  const k = (2 * Math.PI) / wavelength;
  const r = 0.82;
  for (let s = -Math.PI * 2; s <= W * k + Math.PI * 2; s += 0.08) {
    const x = (s - r * Math.sin(s)) / k + phase;
    const y = base - amp * Math.cos(s) * 0.5 - amp * 0.5;
    if (x >= -20 && x <= W + 20) pts.push([x, y]);
  }
  return pts;
}

function toPath(pts: [number, number][]) {
  return pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
}

/** A key-line as a filled sliver: thickest at the crests, tapering in troughs. */
function keyLine(pts: [number, number][], base: number, amp: number, weight: number) {
  const bottom = pts
    .map(([x, y]) => {
      const crest = Math.max(0, (base - y) / Math.max(amp, 1));
      return [x, y + weight * (0.3 + crest * 1.4)] as [number, number];
    })
    .reverse();
  return `${toPath(pts)}L${bottom.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L")}Z`;
}

export function WavePrint({ colors, className = "" }: { colors: string[]; className?: string }) {
  const n = colors.length;
  // Bands from the back (top of the sheet) to the front swell (bottom).
  const bands = colors.map((hex, i) => {
    const t = (i + 1) / (n + 0.4);
    const base = H * (0.1 + t * 0.74);
    const amp = 18 + i * (50 / Math.max(n - 1, 1));
    return {
      hex,
      base,
      amp,
      pts: edge(base, amp, 230 - i * 18, i * 57),
      dark: luminance(hex) < 0.05,
    };
  });
  const front = bands[n - 1];
  // The front swell's highest crest: where the lip curls and the foam breaks.
  const [cx, cy] = front.pts
    .filter(([x]) => x > 140 && x < W - 160)
    .reduce((a, b) => (b[1] < a[1] ? b : a));
  const lip = front.dark ? PAPER : INK;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
      {bands.map((b, i) => (
        <g key={`${b.hex}-${i}`}>
          <path d={`${toPath(b.pts)}L${W + 20},${H}L-20,${H}Z`} fill={b.hex} />
          {/* The line sits on its own band, so a dark band keeps a washi contour. */}
          <path d={keyLine(b.pts, b.base, b.amp, 2.4 + i * 0.5)} fill={b.dark ? PAPER : INK} />
        </g>
      ))}
      {/* Hooked lip over the front crest. */}
      <path
        d={`M${cx - 6},${cy + 3} C${cx + 24},${cy - 32} ${cx + 72},${cy - 20} ${cx + 68},${cy + 12} C${cx + 64},${cy + 32} ${cx + 40},${cy + 28} ${cx + 44},${cy + 13} C${cx + 48},${cy + 4} ${cx + 57},${cy + 8} ${cx + 55},${cy + 17}`}
        fill="none"
        stroke={lip}
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      {/* Foam: a tier of washi dots thrown off the crest. */}
      {Array.from({ length: 11 }, (_, i) => {
        const a = (i / 10) * Math.PI * 0.9 + 0.2;
        return (
          <circle
            key={i}
            cx={cx + 30 + Math.cos(a) * (48 + (i % 2) * 10)}
            cy={cy - 8 - Math.sin(a) * (30 + (i % 3) * 7)}
            r={3.4 - (i % 3) * 0.8}
            fill={PAPER}
            stroke={INK}
            strokeWidth="1"
          />
        );
      })}
    </svg>
  );
}
