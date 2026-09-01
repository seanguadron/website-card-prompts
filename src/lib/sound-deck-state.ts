import builderData from "@/data/sound-deck/builder.json";
import { makeId } from "@/lib/prompt-storage";
import { soundCardEngine } from "@/lib/sound-card-system";
import { SOUND_LAYER_LIMIT } from "@/lib/sound-prompt";
import type {
  SoundBuilderCatalog,
  SoundCardSystemState,
  SoundDraft,
  SoundDraftTextField,
  SoundLayer,
} from "@/lib/sound-types";

const builderCatalog = builderData as SoundBuilderCatalog;

export const EMPTY_SOUND_DRAFT = builderCatalog.emptyDraft;
export const EXAMPLE_SOUND_DRAFT = builderCatalog.exampleDraft;
export const SOUND_PARTS = builderCatalog.soundParts;
export const SOUND_REQUIRED_FIELDS = builderCatalog.requiredFields;

export function createSoundCardSystem(): SoundCardSystemState {
  return soundCardEngine.createCardSystem();
}

export function withSoundDraftText(
  current: SoundDraft,
  field: SoundDraftTextField,
  value: string,
): SoundDraft {
  return { ...current, [field]: value };
}

export function isSoundFieldComplete(
  draft: SoundDraft,
  field: keyof SoundDraft,
) {
  const value = draft[field];
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== false;
}

/** One new rack line holding a finished one-sound prompt. */
export function makeSoundLayer(prompt: string): SoundLayer {
  return { id: makeId(), prompt };
}

/** Add a line; the cap keeps a stored draft a draft, not an archive. */
export function withSoundLayer(
  draft: SoundDraft,
  layer: SoundLayer,
): SoundDraft {
  return {
    ...draft,
    layers: [...draft.layers, layer].slice(0, SOUND_LAYER_LIMIT),
  };
}

export function withoutSoundLayer(draft: SoundDraft, id: string): SoundDraft {
  return { ...draft, layers: draft.layers.filter((layer) => layer.id !== id) };
}

function restoredString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function restoredBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

// Each restored rack line is shape-checked and length-capped: this path
// restores autosave, URL shares, imported session files, and library
// entries, so a tampered payload must degrade instead of smuggling junk.
function restoredLayers(value: unknown): SoundLayer[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (layer): layer is SoundLayer =>
        typeof layer === "object" &&
        layer !== null &&
        typeof (layer as SoundLayer).id === "string" &&
        typeof (layer as SoundLayer).prompt === "string",
    )
    .map((layer) => ({ id: layer.id, prompt: layer.prompt }))
    .slice(0, SOUND_LAYER_LIMIT);
}

// Coerce field-by-field; a literal JSON null degrades the same way instead
// of throwing on property access. Same discipline as the other decks.
export function restoreSoundDraft(value: string): SoundDraft {
  const raw = JSON.parse(value) as Partial<SoundDraft> | null;
  const parsed = typeof raw === "object" && raw !== null ? raw : {};

  return {
    subject: restoredString(parsed.subject, EMPTY_SOUND_DRAFT.subject),
    ambience: restoredBoolean(parsed.ambience, EMPTY_SOUND_DRAFT.ambience),
    layers: restoredLayers(parsed.layers),
  };
}

export function restoreSoundCardSystem(value: string): SoundCardSystemState {
  const raw = JSON.parse(value) as Partial<SoundCardSystemState> | null;
  const restored = typeof raw === "object" && raw !== null ? raw : {};

  // Sanitize against the current catalog so stale saves (removed cards,
  // out-of-range values) degrade gracefully instead of ghost-slotting.
  return soundCardEngine.sanitizeCardSystemShape({
    tracks: {
      ...soundCardEngine.defaultTrackValues,
      ...restored.tracks,
    },
    equipped: {
      ...soundCardEngine.createEmptyEquippedCards(),
      ...restored.equipped,
    },
    memory: soundCardEngine.createEmptySnapMemory(),
    overrides: Array.isArray(restored.overrides) ? restored.overrides : [],
    suggested: soundCardEngine.createEmptySuggestedCards(),
  });
}
