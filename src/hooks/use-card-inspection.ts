import { useEffect, useId, useRef, useState } from "react";
import { getFloatingPanelPosition } from "@/lib/floating-panel-position";

export function useCardInspection() {
  const [preview, setPreview] = useState<{
    id: string;
    position: ReturnType<typeof getFloatingPanelPosition>;
  } | null>(null);
  const panelId = useId();
  const anchor = useRef<HTMLElement | null>(null);
  const timer = useRef<number | undefined>(undefined);

  function keepOpen() {
    window.clearTimeout(timer.current);
  }
  function dismiss() {
    keepOpen();
    setPreview(null);
  }
  function leave() {
    keepOpen();
    timer.current = window.setTimeout(() => {
      if (!document.getElementById(panelId)?.contains(document.activeElement)) setPreview(null);
    }, 250);
  }
  function show(id: string, element: HTMLElement) {
    keepOpen();
    anchor.current = element;
    setPreview({ id, position: getFloatingPanelPosition(element) });
  }
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (!preview) return;
    function inspect(event: KeyboardEvent) {
      const panel = document.getElementById(panelId);
      if (event.key === "Escape") {
        if (panel?.contains(document.activeElement)) anchor.current?.focus({ preventScroll: true });
        setPreview(null);
      } else if (event.key === "ArrowDown" && event.altKey && anchor.current === document.activeElement) {
        const action = panel?.querySelector<HTMLElement>("button, summary");
        if (action) {
          event.preventDefault();
          action.focus({ preventScroll: true });
        }
      }
    }
    window.addEventListener("keydown", inspect);
    return () => window.removeEventListener("keydown", inspect);
  }, [preview, panelId]);
  return {
    preview, show, leave, dismiss,
    panelEvents: { id: panelId, onMouseEnter: keepOpen, onMouseLeave: leave,
      onFocus: keepOpen, onBlur: leave },
  };
}
