"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";
import type { Colour } from "@/lib/dictionary";

/**
 * Four studies of the same colours at different weights. "Rotate" changes
 * which colour leads, so every colour gets its turn as the ground.
 */
export function Proportions({ colors }: { colors: Pick<Colour, "id" | "name" | "hex">[] }) {
  const [shift, setShift] = useState(0);
  const c = colors.map((_, i) => colors[(i + shift) % colors.length]);
  const n = c.length;
  const weights = n === 2 ? [70, 30] : n === 3 ? [60, 30, 10] : [50, 25, 15, 10];

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        {/* Ground and figure: the lead colour holds the field. */}
        <figure>
          <div className="relative aspect-[3/4]" style={{ backgroundColor: c[0].hex }}>
            {c.slice(1).map((col, i) => (
              <span
                key={col.id + i}
                className="absolute"
                style={{
                  backgroundColor: col.hex,
                  left: `${18 + i * 9}%`,
                  bottom: `${14 + i * 9}%`,
                  width: `${40 - i * 12}%`,
                  height: `${30 - i * 9}%`,
                }}
              />
            ))}
          </div>
          <figcaption className="mt-3 text-xs text-sumi-soft">Ground and figure</figcaption>
        </figure>
        {/* Weighted bands. */}
        <figure>
          <div className="flex aspect-[3/4] flex-col">
            {c.map((col, i) => (
              <span key={col.id + i} style={{ backgroundColor: col.hex, flexGrow: weights[i] }} />
            ))}
          </div>
          <figcaption className="mt-3 text-xs text-sumi-soft">
            Bands <span className="ml-1 font-data">{weights.join(" / ")}</span>
          </figcaption>
        </figure>
        {/* Nested fields. */}
        <figure>
          <div className="relative aspect-[3/4]" style={{ backgroundColor: c[0].hex }}>
            {c.slice(1).map((col, i) => {
              const inset = (i + 1) * (n === 2 ? 24 : 15);
              return (
                <span
                  key={col.id + i}
                  className="absolute"
                  style={{ backgroundColor: col.hex, inset: `${inset}% ${inset * 0.8}% ${inset * 0.6}%` }}
                />
              );
            })}
          </div>
          <figcaption className="mt-3 text-xs text-sumi-soft">Nested</figcaption>
        </figure>
        {/* A line of accent across a field. */}
        <figure>
          <div className="relative flex aspect-[3/4]" style={{ backgroundColor: c[0].hex }}>
            {c.slice(1).map((col, i) => (
              <span
                key={col.id + i}
                className="absolute inset-x-0"
                style={{ backgroundColor: col.hex, top: `${58 + i * 9}%`, height: i === 0 ? "7%" : "3%" }}
              />
            ))}
          </div>
          <figcaption className="mt-3 text-xs text-sumi-soft">Accent line</figcaption>
        </figure>
      </div>
      <button
        type="button"
        onClick={() => setShift((s) => (s + 1) % n)}
        className="mt-6 inline-flex min-h-11 items-center gap-2.5 border border-current/30 px-4 text-sm hover:border-current"
      >
        <RotateCw className="size-4" strokeWidth={1.6} aria-hidden="true" />
        Rotate the lead colour
        <span className="text-sumi-soft">· {c[0].name}</span>
      </button>
    </div>
  );
}
