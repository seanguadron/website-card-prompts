"use client";

import { makeId, readStored, writeStored } from "@/lib/prompt-storage";
import { SOUND_SECTIONS } from "@/lib/sound-prompt";
import type {
  SoundArchetype,
  SoundCardSystemState,
  SoundDraft,
} from "@/lib/sound-types";

const CUSTOM_KEY = "digitools.sound-deck.custom-archetypes-v1";
const CUSTOM_LIMIT = 24;

export const CUSTOM_ARCHETYPE_PREFIX = "custom-";

export function isCustomSoundArchetype(archetype: SoundArchetype): boolean {
  return archetype.id.startsWith(CUSTOM_ARCHETYPE_PREFIX);
}

// Shape-check each stored preset: localStorage is user-editable, and these
// entries feed rendering (name, code, effects) and the export filename
// chain. Tracks/equipped stay loosely typed here — applying a preset runs
// them through the engine's sanitizeCardSystemShape.
function isStoredArchetypeShape(entry: unknown): entry is SoundArchetype {
  if (typeof entry !== "object" || entry === null) {
    return false;
  }

  const candidate = entry as Partial<SoundArchetype>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.code === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.description === "string" &&
    typeof candidate.tracks === "object" &&
    candidate.tracks !== null &&
    (candidate.equipped === undefined ||
      (typeof candidate.equipped === "object" &&
        candidate.equipped !== null)) &&
    (candidate.ambience === undefined ||
      typeof candidate.ambience === "boolean") &&
    Array.isArray(candidate.effects) &&
    candidate.effects.every((effect) => typeof effect === "string")
  );
}

export function listCustomSoundArchetypes(): SoundArchetype[] {
  const entries = readStored<SoundArchetype[]>(CUSTOM_KEY, []);
  return Array.isArray(entries) ? entries.filter(isStoredArchetypeShape) : [];
}

const EMPHASIS_LABELS = ["Hint", "Present", "Dominant"];

export function buildCustomSoundArchetype(
  name: string,
  draft: SoundDraft,
  cardSystem: SoundCardSystemState,
): SoundArchetype {
  const equipped: Partial<Record<(typeof SOUND_SECTIONS)[number], string[]>> =
    {};
  let cardCount = 0;
  for (const section of SOUND_SECTIONS) {
    const ids = cardSystem.equipped[section].filter(Boolean);
    if (ids.length > 0) {
      equipped[section] = ids;
      cardCount += ids.length;
    }
  }

  const cleanName = name.trim() || "My preset";
  const code =
    cleanName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() || "MINE";
  const emphasisLabel =
    EMPHASIS_LABELS[cardSystem.tracks.emphasis] ?? "Present";

  return {
    id: `${CUSTOM_ARCHETYPE_PREFIX}${makeId()}`,
    code,
    name: cleanName,
    description: "Your saved cards, emphasis, and mode.",
    tracks: { ...cardSystem.tracks },
    equipped,
    ...(draft.ambience ? { ambience: true } : {}),
    effects: [
      `Loads ${cardCount} equipped ${cardCount === 1 ? "card" : "cards"} at ${emphasisLabel} emphasis.`,
      draft.ambience
        ? "Switches ambience mode on."
        : "Leaves ambience mode untouched.",
      "Preserves your sound line.",
    ],
  };
}

export function saveCustomSoundArchetype(
  archetype: SoundArchetype,
): SoundArchetype[] {
  const next = [archetype, ...listCustomSoundArchetypes()].slice(
    0,
    CUSTOM_LIMIT,
  );
  writeStored(CUSTOM_KEY, next);
  return next;
}

export function deleteCustomSoundArchetype(id: string): SoundArchetype[] {
  const next = listCustomSoundArchetypes().filter(
    (archetype) => archetype.id !== id,
  );
  writeStored(CUSTOM_KEY, next);
  return next;
}
