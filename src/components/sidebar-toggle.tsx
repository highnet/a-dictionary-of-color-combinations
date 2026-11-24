"use client";

import type { ReactNode } from "react";

export const SIDEBAR_KEY = "dcc:sidebar";

/** Runs before paint (inlined in <head>) so the rail never flashes open. */
export const sidebarBootScript = `try{if(localStorage.getItem("${SIDEBAR_KEY}")==="collapsed")document.documentElement.dataset.sidebar="collapsed"}catch(e){}`;

export function SidebarToggle({ children }: { children: ReactNode }) {
  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    const root = document.documentElement;
    const collapsed = root.dataset.sidebar !== "collapsed";
    if (collapsed) root.dataset.sidebar = "collapsed";
    else delete root.dataset.sidebar;
    e.currentTarget.setAttribute("aria-expanded", String(!collapsed));
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? "collapsed" : "open");
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-controls="sidebar"
      aria-label="Collapse or expand the sidebar"
      className="flex h-11 items-center gap-3.5 px-[1.15rem] text-left text-sm text-sumi-soft transition-colors hover:bg-washi-deep hover:text-sumi"
    >
      {children}
      <span className="sb-label">Fold the sidebar</span>
    </button>
  );
}
