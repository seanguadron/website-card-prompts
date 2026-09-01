"use client";

import { makeId, readStored, writeStored } from "@/lib/prompt-storage";
import type { SoundCardSystemState, SoundDraft } from "@/lib/sound-types";

const LIBRARY_KEY = "digitools.sound-deck.library-v1";
const LIBRARY_LIMIT = 50;

export type SavedSoundPrompt = {
  id: string;
  name: string;
  savedAt: string;
  draft: SoundDraft;
  cardSystem: SoundCardSystemState;
};

// Shape-check each stored entry: localStorage is user-editable, so a
// malformed entry must drop out on read instead of crashing the panel or
// the load path. Field types inside draft/cardSystem are coerced separately
// by restoreSoundDraft/restoreSoundCardSystem when an entry is loaded.
function isSavedPromptShape(entry: unknown): entry is SavedSoundPrompt {
  if (typeof entry !== "object" || entry === null) {
    return false;
  }

  const candidate = entry as Partial<SavedSoundPrompt>;
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

export function listSavedSoundPrompts(): SavedSoundPrompt[] {
  const entries = readStored<SavedSoundPrompt[]>(LIBRARY_KEY, []);
  return Array.isArray(entries) ? entries.filter(isSavedPromptShape) : [];
}

export function saveToSoundLibrary(
  name: string,
  draft: SoundDraft,
  cardSystem: SoundCardSystemState,
): SavedSoundPrompt[] {
  const entry: SavedSoundPrompt = {
    id: makeId(),
    name: name.trim() || "Untitled prompt",
    savedAt: new Date().toISOString(),
    draft,
    cardSystem,
  };
  const next = [entry, ...listSavedSoundPrompts()].slice(0, LIBRARY_LIMIT);
  writeStored(LIBRARY_KEY, next);
  return next;
}

export function deleteFromSoundLibrary(id: string): SavedSoundPrompt[] {
  const next = listSavedSoundPrompts().filter((entry) => entry.id !== id);
  writeStored(LIBRARY_KEY, next);
  return next;
}
