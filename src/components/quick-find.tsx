"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { ArrowRight } from "lucide-react";
import { parseHex } from "@/lib/color";

/** Number → plate; HEX → nearest colours; words → archive search. */
export function QuickFind({ size = "lg" }: { size?: "lg" | "md" }) {
  const router = useRouter();
  const id = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = value.trim();
    if (!v) {
      setError("Enter a number from 1 to 348, or a HEX value.");
      return;
    }
    if (/^\d{1,3}$/.test(v)) {
      const n = Number(v);
      if (n < 1 || n > 348) {
        setError("There are 348 combinations. Choose 1 to 348.");
        return;
      }
      router.push(`/combinations/${String(n).padStart(3, "0")}`);
      return;
    }
    const hex = parseHex(v);
    if (hex) {
      router.push(`/colours?hex=${hex.slice(1)}`);
      return;
    }
    router.push(`/combinations?q=${encodeURIComponent(v)}`);
  }

  return (
    <form onSubmit={submit} role="search" noValidate>
      <label htmlFor={id} className="mb-2 block text-sm text-sumi-soft">
        Number, HEX or colour name
      </label>
      <div className={`flex items-stretch border-b-2 border-sumi ${size === "lg" ? "text-2xl" : "text-lg"}`}>
        <input
          id={id}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          placeholder="e.g. 7, 295, #d96629"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          className="min-w-0 flex-1 bg-transparent py-2.5 font-display outline-none placeholder:font-display"
        />
        <button type="submit" className="grid w-12 place-items-center" aria-label="Find">
          <ArrowRight className="size-6" strokeWidth={1.4} />
        </button>
      </div>
      <p id={`${id}-err`} role="alert" className="mt-2 min-h-5 text-sm text-shu">
        {error}
      </p>
    </form>
  );
}
