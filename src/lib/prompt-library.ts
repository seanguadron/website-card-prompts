"use client";

import { createDeckLibrary, type SavedDeckPrompt } from "@/lib/deck-library";
import type { CardSystemState, PromptDraft } from "@/lib/prompt-builder-state";

export type SavedPrompt = SavedDeckPrompt<PromptDraft, CardSystemState>;

export const {
  list: listSavedPrompts,
  save: saveToLibrary,
  remove: deleteFromLibrary,
} = createDeckLibrary<PromptDraft, CardSystemState>("digitools.prompt-builder.library-v1");
