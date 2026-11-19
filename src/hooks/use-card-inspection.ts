import { useEffect, useRef, useState } from "react";
import { getFloatingPanelPosition } from "@/lib/floating-panel-position";

export function useCardInspection() {
  const [preview, setPreview] = useState<{
    id: string;
    position: ReturnType<typeof getFloatingPanelPosition>;
  } | null>(null);
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
    timer.current = window.setTimeout(() => setPreview(null), 250);
  }
  function show(id: string, element: HTMLElement) {
    keepOpen();
    setPreview({ id, position: getFloatingPanelPosition(element) });
  }
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (!preview) return;
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setPreview(null);
    }
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [preview]);
  return { preview, show, leave, dismiss, panelEvents: { onMouseEnter: keepOpen, onMouseLeave: leave } };
}
