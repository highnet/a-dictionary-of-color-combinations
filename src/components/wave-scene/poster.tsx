import { INKS } from "./palette";
import { BANDS, bandY, layout, ribbon, tongues, type V2 } from "./geometry";
import { stateAt } from "./timeline";

/**
 * A static frame of the abstract wave (flat shapes), from the same geometry
 * as the animation. Shown before WebGL starts and wherever it cannot.
 */
export function wavePosterSvg(aspect: number, t = 4.6) {
  const s = stateAt(t);
  const l = layout(aspect);
  const W = l.W;
  const P = (p: V2) => `${(p[0] - l.L).toFixed(3)},${(5 - p[1]).toFixed(3)}`;
  const { main, small } = tongues(l);
  const tongue = (spec: typeof main, offset: number) => {
    const r = ribbon(spec, stateAt(t, offset), 120);
    return `M${r.outer.map(P).join("L")}L${[...r.inner].reverse().map(P).join("L")}Z`;
  };
  const band = (k: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 120; i++) {
      const x = l.L + (W * i) / 120;
      pts.push(P([x, bandY(l, s, k, x, t)]));
    }
    return `M${pts.join("L")}L${P([l.L + W, -5.5])}L${P([l.L, -5.5])}Z`;
  };
  const colors = [INKS.pale.hex, INKS.mid.hex, INKS.body.hex];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W.toFixed(3)} 10" preserveAspectRatio="xMidYMid slice">
<rect width="${W}" height="10" fill="${INKS.sky.hex}"/>
<path d="${band(0)}" fill="${colors[0]}"/>
<path d="${tongue(main, 0)}" fill="${INKS.body.hex}"/>
<path d="${tongue(small, 0.37)}" fill="${INKS.body.hex}"/>
${Array.from({ length: BANDS - 1 }, (_, i) => `<path d="${band(i + 1)}" fill="${colors[i + 1]}"/>`).join("")}
</svg>`;
}

export function WavePoster({ aspect = 0.85, className = "" }: { aspect?: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={className}
      // Generated from geometry, not user input.
      dangerouslySetInnerHTML={{ __html: wavePosterSvg(aspect) }}
    />
  );
}
