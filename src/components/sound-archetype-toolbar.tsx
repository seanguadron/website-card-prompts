"use client";

import { CardIllustrationFrame } from "@/components/prompt-builder-ui";
import type { SoundArchetype } from "@/lib/sound-types";
import { soundFaceArt } from "@/lib/sound-card-art";

const EMPHASIS_LABELS = ["Hint", "Present", "Dominant"];

export function SoundArchetypeDetails({ archetype }: { archetype: SoundArchetype }) {
  const previewCardCount = Object.values(archetype.equipped ?? {}).reduce(
        (total, cardIds) => total + (cardIds?.length ?? 0),
        0,
      );
  const previewEmphasis = (EMPHASIS_LABELS[archetype.tracks.emphasis] ?? "Present");

  return (
    <>
      <CardIllustrationFrame
        className="floating-card-art"
        illustration={soundFaceArt(archetype.id)}
        fallback={archetype.code.slice(0, 1)}
      />
      <div className="floating-card-panel-identity">
        <span>Archetype / {archetype.code}</span>
        <strong>{archetype.name}</strong>
        <p>{archetype.description}</p>
      </div>
      <div className="ability-guidance">
        <span>What this preset changes</span>
        <ul>
          {archetype.effects.map((effect) => (
            <li key={effect}>{effect}</li>
          ))}
        </ul>
      </div>
      <code>
        Emphasis: {previewEmphasis}. Equipped cards: {previewCardCount}.
        Ambience: {archetype.ambience === undefined ? "keep current setting" : archetype.ambience ? "on" : "off"}.
      </code>
    </>
  );
}
