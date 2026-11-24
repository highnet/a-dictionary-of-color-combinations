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
function edge(base: number, amp: number, wavelength: number, phase: number, seed = 0) {
  const pts: [number, number][] = [];
  const k = (2 * Math.PI) / wavelength;
  const r = 0.82;
  for (let s = -Math.PI * 2; s <= W * k + Math.PI * 2; s += 0.08) {
    const x = (s - r * Math.sin(s)) / k + phase;
    // A slow swell modulates each crest so no two repeat exactly.
    const swell = 0.62 + 0.38 * Math.sin(x / 150 + seed * 1.9) * Math.sin(x / 61 + seed);
    const y = base - amp * swell * (Math.cos(s) * 0.5 + 0.5);
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
      pts: edge(base, amp, 210 - i * 22 + (i % 2) * 37, i * 83, i + 1),
      dark: luminance(hex) < 0.05,
    };
  });
  const front = bands[n - 1];
  // The front swell's highest crest: where the lip curls and the foam breaks.
  const [cx, cy] = front.pts
    .filter(([x]) => x > 140 && x < W - 160)
    .reduce((a, b) => (b[1] < a[1] ? b : a));
  const lip = front.dark ? PAPER : INK;
  // Back slope of the front crest, taken from the band's own edge.
  const slope = front.pts.filter(([x]) => x >= cx - 90 && x <= cx);
  const slopePath = slope.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
  const curl = `C${cx + 30},${cy - 46} ${cx + 84},${cy - 40} ${cx + 92},${cy - 8} C${cx + 98},${cy + 16} ${cx + 72},${cy + 26} ${cx + 60},${cy + 12} C${cx + 52},${cy + 2} ${cx + 62},${cy - 8} ${cx + 70},${cy - 2}`;
  const lipLine = `${slopePath}${curl}`;
  const lipBody = `${slopePath}${curl}C${cx + 50},${cy + 8} ${cx + 40},${cy + 30} ${cx + 34},${cy + 70}L${cx - 90},${cy + 70}Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
      {bands.map((b, i) => (
        <g key={`${b.hex}-${i}`}>
          <path d={`${toPath(b.pts)}L${W + 20},${H}L-20,${H}Z`} fill={b.hex} />
          {/* The line sits on its own band, so a dark band keeps a washi contour. */}
          <path d={keyLine(b.pts, b.base, b.amp, 2.4 + i * 0.5)} fill={b.dark ? PAPER : INK} />
        </g>
      ))}
      {/* The front swell's own crest curls forward: one filled shape that rises out
          of the band's back slope (same colour, so there is no seam), keyed only
          along its outer contour, with washi claws breaking off its edge. */}
      <path d={`${lipBody}`} fill={front.hex} />
      <path d={lipLine} fill="none" stroke={lip} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      {Array.from({ length: 9 }, (_, i) => {
        const t = i / 8;
        const x = cx + 58 + Math.cos(-1.2 + t * 2.3) * (40 + (i % 2) * 7);
        const y = cy - 6 + Math.sin(-1.2 + t * 2.3) * (34 + (i % 3) * 5);
        const r = 4.6 - (i % 3) * 1.1;
        return (
          <path
            key={i}
            d={`M${x - r},${y} Q${x - r * 0.2},${y - r * 1.6} ${x + r},${y - r * 0.4} Q${x + r * 0.4},${y + r * 0.9} ${x - r},${y} Z`}
            fill={PAPER}
            stroke={lip}
            strokeWidth="0.9"
          />
        );
      })}
    </svg>
  );
}
