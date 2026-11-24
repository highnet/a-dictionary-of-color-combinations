import { INKS } from "./palette";
import { fuji, layout, ribbon, seaY, tongues, type V2 } from "./geometry";
import { stateAt } from "./timeline";

/**
 * A static print of the scene (flat shapes, key-lines), from the same geometry
 * as the animation. Shown before WebGL starts and wherever it cannot.
 */
export function wavePosterSvg(aspect: number, t = 7.6) {
  const s = stateAt(t);
  const l = layout(aspect);
  const W = l.W;
  // stage → svg (viewBox in stage units, y flipped)
  const P = (p: V2) => `${(p[0] - l.L).toFixed(3)},${(5 - p[1]).toFixed(3)}`;
  const { main, small } = tongues(l);
  const tongue = (spec: typeof main) => {
    const r = ribbon(spec, s, 120);
    return `M${r.outer.map(P).join("L")}L${[...r.inner].reverse().map(P).join("L")}Z`;
  };
  const sea: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const x = l.L + (W * i) / 120;
    sea.push(P([x, seaY(l, s, x, t)]));
  }
  const f = fuji(l);
  const sw = 0.035;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W.toFixed(3)} 10" preserveAspectRatio="xMidYMid slice">
<rect width="${W}" height="10" fill="${INKS.sky.hex}"/>
<path d="M${f.body.map(P).join("L")}Z" fill="${INKS.body.hex}" stroke="${INKS.ink.hex}" stroke-width="${sw}"/>
<path d="M${f.snow.map(P).join("L")}Z" fill="${INKS.foam.hex}" stroke="${INKS.ink.hex}" stroke-width="${sw * 0.8}"/>
<defs><clipPath id="above-${Math.round(aspect * 1000)}"><path d="M${sea.join("L")}L${P([l.L + W, 6])}L${P([l.L, 6])}Z"/></clipPath></defs>
<path d="M${sea.join("L")}L${P([l.L + W, -5.5])}L${P([l.L, -5.5])}Z" fill="${INKS.body.hex}" stroke="${INKS.ink.hex}" stroke-width="${sw * 1.2}"/>
<g clip-path="url(#above-${Math.round(aspect * 1000)})">
<path d="${tongue(main)}" fill="${INKS.body.hex}" stroke="${INKS.ink.hex}" stroke-width="${sw * 1.4}" stroke-linejoin="round"/>
<path d="${tongue(small)}" fill="${INKS.body.hex}" stroke="${INKS.ink.hex}" stroke-width="${sw * 1.2}" stroke-linejoin="round"/>
</g>
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
