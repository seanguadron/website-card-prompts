"use client";

import { useLayoutEffect, useRef, type ComponentPropsWithoutRef } from "react";
import { FLOATING_PANEL_MARGIN } from "@/lib/floating-panel-position";

export function CardInspector({ style, ...props }: ComponentPropsWithoutRef<"aside">) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    function fit() {
      if (!panel) return;
      const available = window.innerHeight - 2 * FLOATING_PANEL_MARGIN;
      const scale = Math.min(1, available / Math.max(1, panel.offsetHeight));
      const top = Math.min(Number(style?.top ?? FLOATING_PANEL_MARGIN),
        window.innerHeight - panel.offsetHeight * scale - FLOATING_PANEL_MARGIN);
      panel.style.setProperty("--inspect-scale", String(scale));
      panel.style.top = Math.max(FLOATING_PANEL_MARGIN, top) + "px";
      const rightLimit = window.innerWidth - FLOATING_PANEL_MARGIN - panel.offsetWidth * scale;
      const left = Math.min(Number(style?.left ?? FLOATING_PANEL_MARGIN), rightLimit);
      panel.style.left = Math.max(FLOATING_PANEL_MARGIN, left) + "px";
    }
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(panel);
    window.addEventListener("resize", fit);
    return () => { observer.disconnect(); window.removeEventListener("resize", fit); };
  }, [style]);
  return <aside {...props} ref={ref} data-inspectable style={{ ...style, maxHeight: "none" }} />;
}
