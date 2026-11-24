"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/** Toasts set as small sumi slips at the foot of the page. */
const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="light"
    position="bottom-center"
    duration={1800}
    toastOptions={{
      unstyled: true,
      classNames: {
        toast:
          "flex items-center gap-3 bg-sumi px-4 py-3 text-sm text-washi shadow-[0_6px_24px_-8px_rgb(0_0_0/0.35)] font-sans",
        title: "font-medium",
        description: "text-washi/70",
      },
    }}
    {...props}
  />
);

export { Toaster };
