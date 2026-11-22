"use client";

import { createDeckLibrary, type SavedDeckPrompt } from "@/lib/deck-library";
import type { SoundCardSystemState, SoundDraft } from "@/lib/sound-types";

export type SavedSoundPrompt = SavedDeckPrompt<SoundDraft, SoundCardSystemState>;

export const {
  list: listSavedSoundPrompts,
  save: saveToSoundLibrary,
  remove: deleteFromSoundLibrary,
} = createDeckLibrary<SoundDraft, SoundCardSystemState>("digitools.sound-deck.library-v1");
