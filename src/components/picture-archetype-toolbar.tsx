"use client";

import { CardIllustrationFrame } from "@/components/prompt-builder-ui";
import { pictureArchetypeArtWithFallback } from "@/lib/picture-art-pack";
import { isCustomPictureArchetype } from "@/lib/picture-custom-archetypes";
import { picturePresetTailMode } from "@/lib/picture-prompt";
import type { PictureArchetype } from "@/lib/picture-types";

const INTENSITY_LABELS = ["Subtle", "Bold", "Extreme"];

function tailSummary(archetype: PictureArchetype) {
  const tail = archetype.mjTail;
  if (!tail) {
    return picturePresetTailMode(tail, isCustomPictureArchetype(archetype)) === "off"
      ? "off" : "keep current setting";
  }

  const parts = [
    tail.aspectRatio ? `--ar ${tail.aspectRatio}` : null,
    typeof tail.stylize === "number" ? `--stylize ${tail.stylize}` : null,
    typeof tail.chaos === "number" ? `--chaos ${tail.chaos}` : null,
    typeof tail.weird === "number" ? `--weird ${tail.weird}` : null,
    tail.negative ? "--no ..." : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : "on";
}

export function PictureArchetypeDetails({ archetype }: { archetype: PictureArchetype }) {
  const previewCardCount = Object.values(archetype.equipped ?? {}).reduce(
        (total, cardIds) => total + (cardIds?.length ?? 0),
        0,
      );
  const previewIntensity = (INTENSITY_LABELS[archetype.tracks.intensity] ?? "Bold");

  return (
    <>
      <CardIllustrationFrame
        className="floating-card-art"
        illustration={pictureArchetypeArtWithFallback(archetype.id)}
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
        Intensity: {previewIntensity}. Equipped cards:{" "}
        {previewCardCount}. Tail: {tailSummary(archetype)}.
      </code>
    </>
  );
}
