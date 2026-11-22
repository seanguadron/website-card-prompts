"use client";

import { useLayoutEffect, useRef, type ComponentPropsWithoutRef } from "react";
import { FLOATING_PANEL_MARGIN, FLOATING_PANEL_WIDTH } from "@/lib/floating-panel-position";

export function CardInspector({ style, besideId, ...props }: ComponentPropsWithoutRef<"aside"> & {
  besideId?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    const beside = besideId ? document.getElementById(besideId) : null;
    function fit() {
      if (!panel) return;
      if (beside && window.matchMedia("(max-width: 767.98px)").matches) {
        const rail = beside.getBoundingClientRect();
        const left = Math.ceil(rail.right);
        const top = Math.max(FLOATING_PANEL_MARGIN, rail.top);
        panel.style.left = left + "px";
        panel.style.top = top + "px";
        panel.style.width = Math.min(FLOATING_PANEL_WIDTH, window.innerWidth - left - 4) + "px";
        panel.style.maxHeight = (window.innerHeight - top - FLOATING_PANEL_MARGIN) + "px";
        panel.style.setProperty("--inspect-scale", "1");
        return;
      }
      panel.style.removeProperty("width");
      panel.style.maxHeight = "none";
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
    if (beside) observer.observe(beside);
    window.addEventListener("resize", fit);
    return () => { observer.disconnect(); window.removeEventListener("resize", fit); };
  }, [style, besideId]);
  return <aside {...props} ref={ref} data-inspectable style={{ ...style, maxHeight: "none" }} />;
}
