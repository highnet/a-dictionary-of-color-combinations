"use client";

import Link from "@/i18n/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslation } from "@/i18n/client";
import { rich } from "@/i18n/rich";
import { PlateTile } from "@/components/plate";
import { hexToLab, parseHex } from "@/lib/color";
import { nearestColours, palettesWithColour } from "@/lib/dictionary";

export function ColourSearch() {
  const { t } = useTranslation("colours");
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
            {t("search.label")}
          </label>
          <div className="flex items-stretch gap-3 border-b-2 border-sumi">
            <input
              type="color"
              aria-label={t("search.pick")}
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
            {hex ? t("search.help") : <span className="font-medium text-sumi">{t("search.invalid")}</span>}
          </p>
        </div>
        <div className="md:col-span-7">
          <p className="mb-3 text-sm text-sumi-soft">{t("search.nearest")}</p>
          <div role="radiogroup" aria-label={t("search.nearestLabel")} className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {near.map(({ colour, distance }, i) => (
              <button
                key={colour.id}
                type="button"
                role="radio"
                aria-checked={picked === i}
                onClick={() => setPicked(i)}
                className="group text-left"
                aria-label={t("search.swatch", { name: colour.name, hex: colour.hex, distance: distance.toFixed(1) })}
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
              {t("search.everyValue", { name: chosen.name })}
            </Link>
          </div>
          <p className="mt-6 text-sm text-sumi-soft">
            {rich(t("search.serves", { n: plates.length }), {
              n: (c, k) => (
                <span key={k} className="font-data text-sumi">
                  {c}
                </span>
              ),
            })}
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
