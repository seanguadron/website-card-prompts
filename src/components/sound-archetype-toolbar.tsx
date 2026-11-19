"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CardIllustrationFrame } from "@/components/prompt-builder-ui";
import { usePortalTarget } from "@/hooks/use-portal-target";
import { getFloatingPanelPosition } from "@/lib/floating-panel-position";
import { isCustomSoundArchetype } from "@/lib/sound-custom-archetypes";
import { readStoredStringArray, writeStored } from "@/lib/prompt-storage";
import type { SoundArchetype } from "@/lib/sound-types";

const FAVORITES_KEY = "digitools.sound-deck.favorites-v1";
const EMPHASIS_LABELS = ["Hint", "Present", "Dominant"];

export function SoundArchetypeToolbar({
  archetypes,
  customArchetypes,
  activeId,
  saveFormOpen,
  onSaveFormOpenChange,
  onApply,
  onSaveCustom,
  onDeleteCustom,
}: {
  archetypes: readonly SoundArchetype[];
  customArchetypes: readonly SoundArchetype[];
  activeId: string | null;
  // The save-preset form is opened from the header's Tools menu, so the deck
  // root owns the flag; the toolbar just renders the inline form.
  saveFormOpen: boolean;
  onSaveFormOpenChange: (open: boolean) => void;
  onApply: (archetype: SoundArchetype) => void;
  onSaveCustom: (name: string) => void;
  onDeleteCustom: (id: string) => void;
}) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewAnchor, setPreviewAnchor] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [presetName, setPresetName] = useState("");
  const portalTarget = usePortalTarget();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFavorites(readStoredStringArray(FAVORITES_KEY));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const allArchetypes = [...customArchetypes, ...archetypes];
  const orderedArchetypes = [
    ...allArchetypes.filter((archetype) => favorites.includes(archetype.id)),
    ...allArchetypes.filter((archetype) => !favorites.includes(archetype.id)),
  ];

  const previewArchetype = allArchetypes.find(
    (archetype) => archetype.id === previewId,
  );
  const previewCardCount = previewArchetype
    ? Object.values(previewArchetype.equipped ?? {}).reduce(
        (total, cardIds) => total + (cardIds?.length ?? 0),
        0,
      )
    : 0;
  const previewEmphasis = previewArchetype
    ? (EMPHASIS_LABELS[previewArchetype.tracks.emphasis] ?? "Present")
    : "";

  function previewArchetypeCard(archetypeId: string, element: HTMLElement) {
    setPreviewId(archetypeId);
    setPreviewAnchor(getFloatingPanelPosition(element));
  }

  function clearPreview() {
    setPreviewId(null);
    setPreviewAnchor(null);
  }

  function toggleFavorite(id: string) {
    setFavorites((current) => {
      const next = current.includes(id)
        ? current.filter((favoriteId) => favoriteId !== id)
        : [...current, id];
      writeStored(FAVORITES_KEY, next);
      return next;
    });
  }

  function confirmSavePreset() {
    onSaveCustom(presetName);
    setPresetName("");
    onSaveFormOpenChange(false);
  }

  function cancelSavePreset() {
    onSaveFormOpenChange(false);
    setPresetName("");
  }

  return (
    <aside className="archetype-toolbar" aria-labelledby="archetype-title">
      <div className="archetype-toolbar-heading">
        <strong id="archetype-title">Archetypes</strong>
        {saveFormOpen ? (
          <div className="archetype-save-form">
            <input
              type="text"
              value={presetName}
              placeholder="Preset name"
              aria-label="Preset name"
              autoFocus
              onChange={(event) => setPresetName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  confirmSavePreset();
                }
                if (event.key === "Escape") {
                  cancelSavePreset();
                }
              }}
            />
            <button type="button" onClick={confirmSavePreset}>
              Save
            </button>
            <button type="button" onClick={cancelSavePreset}>
              Cancel
            </button>
          </div>
        ) : null}
      </div>
      <div className="archetype-toolbar-list">
        {orderedArchetypes.map((archetype) => {
          const active = activeId === archetype.id;
          const favorite = favorites.includes(archetype.id);
          const custom = isCustomSoundArchetype(archetype);

          return (
            <div className="archetype-item" key={archetype.id}>
              <button
                className={
                  active ? "archetype-button is-active" : "archetype-button"
                }
                type="button"
                onClick={() => onApply(archetype)}
                onMouseEnter={(event) =>
                  previewArchetypeCard(archetype.id, event.currentTarget)
                }
                onMouseLeave={clearPreview}
                onFocus={(event) =>
                  previewArchetypeCard(archetype.id, event.currentTarget)
                }
                onBlur={clearPreview}
                aria-pressed={active}
                aria-label={`Apply ${archetype.name} archetype. ${archetype.description}`}
              >
                <span className="archetype-glyph" aria-hidden="true">
                  {archetype.code}
                </span>
                <strong>{archetype.name}</strong>
                <small>{archetype.description}</small>
              </button>
              <button
                className={
                  favorite ? "archetype-star is-active" : "archetype-star"
                }
                type="button"
                onClick={() => toggleFavorite(archetype.id)}
                aria-pressed={favorite}
                aria-label={
                  favorite ? `Unpin ${archetype.name}` : `Pin ${archetype.name}`
                }
              >
                {favorite ? "★" : "☆"}
              </button>
              {custom ? (
                <button
                  className="archetype-delete"
                  type="button"
                  onClick={() => onDeleteCustom(archetype.id)}
                  aria-label={`Delete ${archetype.name} preset`}
                >
                  x
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      {portalTarget && previewArchetype && previewAnchor
        ? createPortal(
            <aside
              className="floating-card-panel floating-card-panel--archetype"
              style={previewAnchor}
              aria-live="polite"
            >
              <CardIllustrationFrame
                className="floating-card-art"
                fallback={previewArchetype.code.slice(0, 1)}
              />
              <div className="floating-card-panel-identity">
                <span>Archetype / {previewArchetype.code}</span>
                <strong>{previewArchetype.name}</strong>
                <p>{previewArchetype.description}</p>
              </div>
              <div className="ability-guidance">
                <span>What this preset changes</span>
                <ul>
                  {previewArchetype.effects.map((effect) => (
                    <li key={effect}>{effect}</li>
                  ))}
                </ul>
              </div>
              <code>
                Emphasis: {previewEmphasis}. Equipped cards: {previewCardCount}.
                Ambience: {previewArchetype.ambience === undefined ? "keep current setting" : previewArchetype.ambience ? "on" : "off"}.
              </code>
            </aside>,
            portalTarget,
          )
        : null}
    </aside>
  );
}
