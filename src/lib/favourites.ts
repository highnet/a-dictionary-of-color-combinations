"use client";

import { useSyncExternalStore } from "react";

const KEY = "dcc:favourites";
const EMPTY: number[] = [];
let cache: number[] | null = null;
const listeners = new Set<() => void>();

function read(): number[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed.filter((n) => Number.isInteger(n)) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: number[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Saved combinations, kept in this browser only. Empty during SSR. */
export function useFavourites() {
  const ids = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    ids,
    has: (id: number) => ids.includes(id),
    toggle: (id: number) => {
      const cur = read();
      write(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].sort((a, b) => a - b));
    },
  };
}
