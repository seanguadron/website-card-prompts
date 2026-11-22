"use client";

import { createDeckLibrary, type SavedDeckPrompt } from "@/lib/deck-library";
import type { PictureCardSystemState, PictureDraft } from "@/lib/picture-types";

export type SavedPicturePrompt = SavedDeckPrompt<PictureDraft, PictureCardSystemState>;

export const {
  list: listSavedPicturePrompts,
  save: saveToPictureLibrary,
  remove: deleteFromPictureLibrary,
} = createDeckLibrary<PictureDraft, PictureCardSystemState>("digitools.picture-deck.library-v1");
