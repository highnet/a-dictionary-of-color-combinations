"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { CopyValue } from "@/components/copy-button";
import { PALETTES } from "@/lib/dictionary";

export function CompareView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const ids = (params.get("ids") ?? "")
    .split(",")
    .map((s) => Number(s))
    .filter((n, i, a) => Number.isInteger(n) && n >= 1 && n <= 348 && a.indexOf(n) === i)
    .slice(0, 4);
  const [entry, setEntry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const palettes = ids.map((id) => PALETTES[id - 1]);

  const counts = new Map<string, number>();
  palettes.forEach((p) => p.colors.forEach((c) => counts.set(c.id, (counts.get(c.id) ?? 0) + 1)));

  function setIds(next: number[]) {
    router.replace(next.length ? `${pathname}?ids=${next.join(",")}` : pathname, { scroll: false });
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(entry.trim());
    if (!Number.isInteger(n) || n < 1 || n > 348) return setError("Choose a number from 1 to 348.");
    if (ids.includes(n)) return setError(`${String(n).padStart(3, "0")} is already here.`);
    if (ids.length >= 4) return setError("Four at most. Remove one first.");
    setError(null);
    setEntry("");
    setIds([...ids, n]);
  }

  return (
    <div>
      <form onSubmit={add} className="flex flex-wrap items-start gap-3">
        <label className="flex min-h-11 items-center gap-2 border-b border-sumi">
          <span className="sr-only">Combination number</span>
          <input
            inputMode="numeric"
            value={entry}
            onChange={(e) => {
              setEntry(e.target.value);
              setError(null);
            }}
            placeholder="Add by number"
            className="w-40 bg-transparent py-2 font-data outline-none"
            aria-describedby="cmp-err"
          />
        </label>
        <button type="submit" className="inline-flex min-h-11 items-center gap-2 border border-sumi px-4 text-sm" disabled={ids.length >= 4}>
          <Plus className="size-4" aria-hidden="true" /> Add
        </button>
        <p id="cmp-err" role="alert" className="min-h-5 self-center text-sm text-shu">{error}</p>
      </form>

      {palettes.length === 0 ? (
        <div className="py-24">
          <p className="font-display text-3xl">Nothing on the table.</p>
          <p className="mt-3 text-sumi-soft">
            Add two to four combinations by number, or pick them on the{" "}
            <Link href="/explore" className="link-quiet text-sumi">map</Link>.
          </p>
        </div>
      ) : (
        <div className="mt-12 grid gap-x-8 gap-y-16" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 16rem), 1fr))` }}>
          {palettes.map((p) => (
            <section key={p.id} aria-label={`Combination ${p.code}`}>
              <div className="flex items-start justify-between gap-3">
                <Link href={`/combinations/${p.code}`} className="cartouche text-base">{p.code}</Link>
                <button type="button" onClick={() => setIds(ids.filter((x) => x !== p.id))} className="grid size-10 place-items-center hover:bg-washi-deep" aria-label={`Remove ${p.code}`}>
                  <X className="size-4" />
                </button>
              </div>
              <div className="kento mt-4 flex h-64 flex-col">
                {p.colors.map((c) => (
                  <span key={c.id} className="flex-1" style={{ backgroundColor: c.hex }} />
                ))}
              </div>
              <ul className="mt-6 divide-y divide-rule border-y border-rule">
                {p.colors.map((c) => {
                  const shared = (counts.get(c.id) ?? 0) > 1;
                  return (
                    <li key={c.id} className="flex items-center gap-3 py-2">
                      <span className="size-6 shrink-0" style={{ backgroundColor: c.hex }} aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {c.name}
                        {shared ? <span className="ml-2 border-b border-sumi text-xs">shared</span> : null}
                      </span>
                      <CopyValue value={c.hex} display={c.hex.toUpperCase()} label={`${c.name} HEX`} />
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
