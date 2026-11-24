/**
 * Static woodblock wave: stacked flat bands with sumi key-lines. Used before
 * WebGL loads, when it is unavailable, and in small places.
 */
export function WavePrint({ colors, className = "" }: { colors: string[]; className?: string }) {
  const W = 800;
  const H = 400;
  const n = colors.length;
  // Bands from the deepest (bottom) upward; band i's top edge is a wave line.
  const edge = (i: number) => {
    const base = H - ((i + 1) / (n + 0.6)) * H;
    const amp = 26 - i * 4;
    const pts: string[] = [];
    for (let x = 0; x <= W; x += 20) {
      const y =
        base +
        Math.sin(x / 70 + i * 1.3) * amp +
        Math.sin(x / 23 + i * 2.1) * (amp * 0.28);
      pts.push(`${x},${y.toFixed(1)}`);
    }
    return pts;
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={className} aria-hidden="true">
      {colors.map((hex, i) => {
        const top = edge(n - 1 - i);
        return (
          <g key={`${hex}-${i}`}>
            <polygon points={`0,${H} ${top.join(" ")} ${W},${H}`} fill={hex} />
            <polyline points={top.join(" ")} fill="none" stroke="#1f1c19" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
          </g>
        );
      })}
    </svg>
  );
}
