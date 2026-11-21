"use client";

import { useEffect, useState } from "react";
import { isDeckTheme, type DeckTheme } from "@/lib/deck-theme";
import { readStored, writeStored } from "@/lib/prompt-storage";

// Retain the original CRAFT preference as the shared world across decks.
const STORAGE_KEY = "digitools.prompt-builder.art-pack-v1";

export function useDeckTheme(applyPack?: (theme: DeckTheme) => void, initial?: () => DeckTheme) {
  const [theme, setTheme] = useState<DeckTheme>(initial ?? "sci-fi");

  useEffect(() => {
    function restore() {
      const saved = readStored(STORAGE_KEY, null);
      const next = isDeckTheme(saved) ? saved : "sci-fi";
      applyPack?.(next);
      setTheme(next);
    }
    const timer = window.setTimeout(restore, 0);
    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY || event.key === null) restore();
    }
    window.addEventListener("storage", onStorage);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", onStorage);
    };
  }, [applyPack]);

  function selectTheme(next: DeckTheme) {
    applyPack?.(next);
    setTheme(next);
    writeStored(STORAGE_KEY, next);
  }

  return { theme, selectTheme };
}
