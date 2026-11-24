"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { PlateTile } from "@/components/plate";
import { hexToLab, parseHex } from "@/lib/color";
import { nearestColours, palettesWithColour } from "@/lib/dictionary";

export function ColourSearch() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initial = parseHex(params.get("hex") ?? "") ?? "#d96629";
  const [text, setText] = useState(initial);
  const hex = parseHex(text);
  const [picked, setPicked] = useState(0);

  function commit(v: string) {
    setText(v);
    setPicked(0);
    const h = parseHex(v);
    if (h) router.replace(`${pathname}?hex=${h.slice(1)}`, { scroll: false });
  }

  const near = useMemo(() => (hex ? nearestColours(hexToLab(hex), 8) : []), [hex]);
  const chosen = near[picked]?.colour;
  const plates = chosen ? palettesWithColour(chosen) : [];

  return (
    <div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end">
        <div className="md:col-span-5">
          <label htmlFor="hex" className="mb-2 block text-sm text-sumi-soft">
            Your colour (HEX)
          </label>
          <div className="flex items-stretch gap-3 border-b-2 border-sumi">
            <input
              type="color"
              aria-label="Pick a colour"
              value={hex ?? "#000000"}
              onChange={(e) => commit(e.target.value)}
              className="my-2 size-12 shrink-0 cursor-pointer border-0 bg-transparent p-0 [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
            />
            <input
              id="hex"
              size={8}
              value={text}
              onChange={(e) => commit(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              aria-invalid={hex ? undefined : true}
              aria-describedby="hex-help"
              className="min-w-0 flex-1 bg-transparent font-data text-2xl uppercase outline-none"
            />
          </div>
          <p id="hex-help" role="status" className="mt-2 min-h-5 text-sm text-sumi-soft">
            {hex ? "Nearest by CIEDE2000. Under 2 is hard to tell apart." : <span className="font-medium text-sumi">That is not a HEX value. Try #1C4286.</span>}
          </p>
        </div>
        <div className="md:col-span-7">
          <p className="mb-3 text-sm text-sumi-soft">Nearest of Wada&rsquo;s colours</p>
          <div role="radiogroup" aria-label="Nearest colours" className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {near.map(({ colour, distance }, i) => (
              <button
                key={colour.id}
                type="button"
                role="radio"
                aria-checked={picked === i}
                onClick={() => setPicked(i)}
                className="group text-left"
                aria-label={`${colour.name}, ${colour.hex}, delta E ${distance.toFixed(1)}`}
              >
                <span
                  className={`block aspect-square transition-transform ${picked === i ? "-translate-y-1.5" : "group-hover:-translate-y-0.5"}`}
                  style={{ backgroundColor: colour.hex }}
                />
                <span className={`mt-2 block h-px bg-sumi transition-opacity ${picked === i ? "opacity-100" : "opacity-0"}`} />
                <span className="mt-1.5 block font-data text-xs text-sumi-soft">ΔE {distance.toFixed(1)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {chosen ? (
        <div className="mt-20">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-6">
            <h2 className="font-display text-[clamp(1.8rem,3.4vw,3rem)] leading-tight font-bold">
              {chosen.name}
              <span className="ml-4 font-data text-base font-normal text-sumi-soft uppercase">{chosen.hex}</span>
            </h2>
            <Link href={`/colours/${chosen.id}`} className="link-quiet inline-flex min-h-11 items-center text-sm">
              Every value for {chosen.name}
            </Link>
          </div>
          <p className="mt-6 text-sm text-sumi-soft">
            Serves in <span className="font-data text-sumi">{plates.length}</span> combinations.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {plates.map((p) => (
              <PlateTile key={p.id} palette={p} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
