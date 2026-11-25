"use client";

import Link from "@/i18n/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { PlateTile } from "@/components/plate";
import { searchPalettes, sortPalettes, type SortKey } from "@/lib/search";
import { useFavourites } from "@/lib/favourites";
import { useTranslation } from "@/i18n/client";
import { rich } from "@/i18n/rich";

type Count = "all" | "2" | "3" | "4";
type View = "expanded" | "compact";

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex border border-rule">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`relative min-h-10 px-3 text-sm transition-colors ${on ? "bg-sumi text-washi" : "hover:bg-washi-deep"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function ArchiveBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { ids: saved } = useFavourites();
  const { t } = useTranslation("combinations");

  const [query, setQuery] = useState(params.get("q") ?? "");
  const count = (["2", "3", "4"].includes(params.get("n") ?? "") ? params.get("n") : "all") as Count;
  const sort = (["hue", "value"].includes(params.get("sort") ?? "") ? params.get("sort") : "order") as SortKey;
  const view = (params.get("view") === "compact" ? "compact" : "expanded") as View;
  const savedOnly = params.get("saved") === "1";

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  // Keep the query in the URL without a history entry per keystroke.
  const deferred = useDeferredValue(query);
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((params.get("q") ?? "") !== deferred.trim()) setParam("q", deferred.trim() || null);
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferred]);

  const result = useMemo(() => searchPalettes(deferred), [deferred]);
  const list = useMemo(() => {
    let l = result.palettes;
    if (count !== "all") l = l.filter((p) => p.size === Number(count));
    if (savedOnly) l = l.filter((p) => saved.includes(p.id));
    return result.kind === "hex" ? l : sortPalettes(l, sort);
  }, [result, count, savedOnly, saved, sort]);

  const filtered = query.trim() !== "" || count !== "all" || savedOnly;

  return (
    <>
      <div className="sticky top-[var(--topbar-h)] z-30 -mx-[var(--gutter)] border-y border-rule bg-washi/95 px-[var(--gutter)] py-2.5 backdrop-blur-[2px] lg:top-0">
        <div className="flex flex-col gap-2.5 md:flex-row md:flex-wrap md:items-center md:gap-x-4 md:gap-y-3">
          <label className="flex min-h-10 min-w-0 items-center gap-2 border-b border-sumi md:flex-[1_1_16rem]">
            <Search className="size-4 shrink-0 text-sumi-soft" aria-hidden="true" />
            <span className="sr-only">{t("search.label")}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search.placeholder")}
              spellCheck={false}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent py-2 text-[0.95rem] outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} className="grid size-8 place-items-center" aria-label={t("search.clear")}>
                <X className="size-4" />
              </button>
            ) : null}
          </label>
          <div className="-mx-[var(--gutter)] flex shrink-0 items-center gap-3 overflow-x-auto px-[var(--gutter)] [scrollbar-width:none] md:mx-0 md:px-0 [&>*]:shrink-0">
          <Segmented<Count>
              label={t("count.label")}
              value={count}
              onChange={(v) => setParam("n", v === "all" ? null : v)}
              options={[
                { value: "all", label: t("count.all") },
                { value: "2", label: "2" },
                { value: "3", label: "3" },
                { value: "4", label: "4" },
              ]}
            />
            <label className="flex min-h-10 items-center gap-2 text-sm">
              <span className="text-sumi-soft">{t("sort.label")}</span>
              <select
                value={sort}
                onChange={(e) => setParam("sort", e.target.value === "order" ? null : e.target.value)}
                className="min-h-10 border border-rule bg-transparent px-2 text-sm"
                disabled={result.kind === "hex"}
              >
                <option value="order">{t("sort.order")}</option>
                <option value="hue">{t("sort.hue")}</option>
                <option value="value">{t("sort.value")}</option>
              </select>
            </label>
            <Segmented<View>
              label={t("view.label")}
              value={view}
              onChange={(v) => setParam("view", v === "expanded" ? null : v)}
              options={[
                { value: "expanded", label: t("view.expanded") },
                { value: "compact", label: t("view.compact") },
              ]}
            />
            <button
              type="button"
              aria-pressed={savedOnly}
              onClick={() => setParam("saved", savedOnly ? null : "1")}
              className={`min-h-10 border px-3 text-sm transition-colors ${savedOnly ? "border-sumi bg-sumi text-washi" : "border-rule hover:bg-washi-deep"}`}
            >
              {t("saved")} <span className="font-data text-xs">{saved.length}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-3 pt-8 pb-10" aria-live="polite">
        <p className="text-sm">
          {rich(t("results.count", { n: list.length }), {
            n: (c, k) => <span key={k} className="font-data">{c}</span>,
            soft: (c, k) => <span key={k} className="text-sumi-soft">{c}</span>,
          })}
          {result.kind === "hex" ? <span className="text-sumi-soft">{t("results.nearest")}</span> : null}
        </p>
        {result.matched.length > 0 ? (
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-sumi-soft">
            {result.matched.slice(0, 6).map(({ colour, distance }) => (
              <li key={colour.id} className="flex items-center gap-2">
                <span className="size-3 ring-1 ring-sumi/15" style={{ backgroundColor: colour.hex }} aria-hidden="true" />
                <Link className="link-quiet" href={`/colours/${colour.id}`}>{colour.name}</Link>
                {distance !== undefined ? <span className="font-data">ΔE {distance.toFixed(1)}</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <h2 className="sr-only">{t("results.heading")}</h2>
      {list.length === 0 ? (
        <div className="py-24">
          <p className="font-display text-3xl">{t("empty.title")}</p>
          <p className="mt-3 text-sumi-soft">
            {savedOnly && saved.length === 0
              ? t("empty.noneSaved")
              : t("empty.widen")}
          </p>
          {filtered ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                router.replace(pathname, { scroll: false });
              }}
              className="mt-6 min-h-11 border border-sumi px-4 text-sm"
            >
              {t("empty.clear")}
            </button>
          ) : null}
        </div>
      ) : view === "compact" ? (
        <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-5 md:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10">
          {list.map((p) => (
            <PlateTile key={p.id} palette={p} density="compact" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {list.map((p) => (
            <PlateTile key={p.id} palette={p} />
          ))}
        </div>
      )}
    </>
  );
}
