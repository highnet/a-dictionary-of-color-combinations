"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { tOutside, useTranslation } from "@/i18n/client";

export async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for browsers without async clipboard permission.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    if (!ok) {
      toast(tOutside("copy.failed"));
      return false;
    }
  }
  toast(tOutside("copy.copied", { label }));
  return true;
}

/** A value that copies itself. Shows the value; the icon confirms. */
export function CopyValue({
  value,
  label,
  className = "",
  display,
}: {
  value: string;
  label?: string;
  className?: string;
  display?: string;
}) {
  const [done, setDone] = useState(false);
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText(value, label ?? value)) {
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        }
      }}
      className={`group inline-flex min-h-9 items-center gap-2 text-left font-data text-[0.8rem] tracking-tight hover:underline hover:decoration-current/40 ${className}`}
      aria-label={t("copy.aria", { label: label ?? value })}
    >
      <span>{display ?? value}</span>
      {done ? (
        <Check className="size-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5 shrink-0 opacity-40 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true" />
      )}
    </button>
  );
}

/** Text-led action button in the proof-room style: hairline box, no fill. */
export function ActionButton({
  children,
  onClick,
  icon,
  className = "",
  pressed,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon?: React.ReactNode;
  className?: string;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`inline-flex min-h-11 items-center gap-2.5 border border-current/30 px-4 text-sm transition-colors hover:border-current hover:bg-current/[0.04] ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}
