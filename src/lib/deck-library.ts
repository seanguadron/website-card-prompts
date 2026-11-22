"use client";

import { makeId, readStored, writeStored } from "./prompt-storage";

export type SavedDeckPrompt<Draft, Cards> = {
  id: string;
  name: string;
  savedAt: string;
  draft: Draft;
  cardSystem: Cards;
};

// Deck-specific restorers validate the nested content when an entry is loaded.
function isSavedPrompt<Draft, Cards>(entry: unknown): entry is SavedDeckPrompt<Draft, Cards> {
  if (typeof entry !== "object" || entry === null) return false;
  const candidate = entry as Partial<SavedDeckPrompt<unknown, unknown>>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.savedAt === "string" &&
    typeof candidate.draft === "object" &&
    candidate.draft !== null &&
    typeof candidate.cardSystem === "object" &&
    candidate.cardSystem !== null
  );
}

export function createDeckLibrary<Draft, Cards>(key: string) {
  function list(): SavedDeckPrompt<Draft, Cards>[] {
    const entries = readStored(key, []);
    return Array.isArray(entries) ? entries.filter(isSavedPrompt<Draft, Cards>) : [];
  }

  function save(name: string, draft: Draft, cardSystem: Cards) {
    const entry = {
      id: makeId(),
      name: name.trim() || "Untitled prompt",
      savedAt: new Date().toISOString(),
      draft,
      cardSystem,
    };
    const next = [entry, ...list()].slice(0, 50);
    return writeStored(key, next) ? next : null;
  }

  function remove(id: string) {
    const next = list().filter(entry => entry.id !== id);
    return writeStored(key, next) ? next : null;
  }

  return { list, save, remove };
}
