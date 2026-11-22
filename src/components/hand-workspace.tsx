"use client";

import { createContext, useCallback, useContext, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import type { SkillDeck } from "@/lib/deck-skill";
import { promptTraces, type TraceCard } from "@/lib/prompt-traces";

export type Loadout = Partial<Record<string, readonly string[]>>;

type Shelves = { locked: string[]; reserve: string[] };

function readShelves(raw: string, knownCard: (id: string) => boolean): Shelves {
  const validIds = (ids: unknown): string[] => Array.isArray(ids)
    ? [...new Set(ids.filter((id): id is string => typeof id === "string" && knownCard(id)))]
    : [];
  try {
    const saved = JSON.parse(raw);
    return { locked: validIds(saved?.locked), reserve: validIds(saved?.reserve) };
  } catch {
    return { locked: [], reserve: [] };
  }
}

export function useHandWorkspace(deck: SkillDeck, knownCard: (id: string) => boolean) {
  const [highlight, setHighlight] = useState("");
  const [proposal, setProposal] = useState<Loadout | null>(null);
  const key = `cardprompts.shelves.${deck}`;
  const fallback = useRef<{ key: string; raw: string } | null>(null);
  const snapshot = useCallback(() => {
    if (fallback.current?.key === key) return fallback.current.raw;
    try { return window.localStorage.getItem(key) ?? "{}"; }
    catch { return "{}"; }
  }, [key]);
  const subscribe = useCallback((refresh: () => void) => {
    function changed(event: StorageEvent) {
      if (event.key === null || event.key === key) refresh();
    }
    window.addEventListener("storage", changed);
    window.addEventListener(key, refresh);
    return () => {
      window.removeEventListener("storage", changed);
      window.removeEventListener(key, refresh);
    };
  }, [key]);
  const raw = useSyncExternalStore(subscribe, snapshot, () => "{}");
  const { locked, reserve } = readShelves(raw, knownCard);

  function toggle(shelf: keyof Shelves, id: string) {
    if (!knownCard(id)) return;
    const next = readShelves(snapshot(), knownCard);
    const ids = next[shelf];
    next[shelf] = ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id];
    const encoded = JSON.stringify(next);
    try {
      window.localStorage.setItem(key, encoded);
      fallback.current = null;
    } catch {
      fallback.current = { key, raw: encoded };
    }
    window.dispatchEvent(new Event(key));
  }

  return { highlight, setHighlight, locked, reserve, proposal, setProposal,
    toggleLock: (id: string) => toggle("locked", id),
    toggleReserve: (id: string) => toggle("reserve", id),
  };
}
export const HandWorkspace = createContext<ReturnType<typeof useHandWorkspace> | null>(null);
export function useHandTools() {
  const value = useContext(HandWorkspace);
  if (!value) throw new Error("Hand workspace missing");
  return value;
}

function revealCard(id: string, onReveal?: (index: number, controlId: string) => void) {
  const selector = `[data-equipped-card="${CSS.escape(id)}"]`;
  const node = document.querySelector<HTMLElement>(selector);
  if (!node) return;
  const board = node.closest<HTMLElement>("[data-board-index]");
  const panel = node.closest<HTMLElement>(".flow-track > .flow-panel");
  const index = board ? Number(board.dataset.boardIndex)
    : panel?.parentElement ? Array.from(panel.parentElement.children).indexOf(panel) : -1;
  if (index >= 0 && onReveal) onReveal(index, node.id);
  else node.focus({ preventScroll: true });
}

export function TracedPrompt({ prompt, cards, sections, mergeOrder, onRevealCard }: {
  prompt: string;
  cards: TraceCard[];
  sections: {key:string; heading:string; body:string}[] | null;
  mergeOrder?: readonly string[];
  onRevealCard?: (panel: number, controlId: string) => void;
}) {
  const { highlight, setHighlight } = useHandTools();
  const parts: ReactNode[] = [];
  const matches = promptTraces(prompt, cards, sections, mergeOrder);
  let start = 0;
  for (const { card, at, text } of matches) {
    if (at < start) continue;
    parts.push(prompt.slice(start, at));
    parts.push(
      <button type="button" key={at} className="prompt-fragment" data-highlight={highlight === card.id}
        title={`Go to ${card.name}`}
        onMouseEnter={() => setHighlight(card.id)} onMouseLeave={() => setHighlight("")}
        onFocus={() => setHighlight(card.id)} onBlur={() => setHighlight("")}
        onClick={() => revealCard(card.id, onRevealCard)}>
        {text}
      </button>,
    );
    start = at + text.length;
  }
  parts.push(prompt.slice(start));
  return <>{parts}</>;
}
