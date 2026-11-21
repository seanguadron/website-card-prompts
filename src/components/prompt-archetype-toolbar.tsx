"use client";

import { CardBio, CardIllustrationFrame } from "@/components/prompt-builder-ui";
import { archetypeArt, archetypeArtWithFallback } from "@/lib/art-pack";
import { FORMAT_OPTIONS } from "@/lib/prompt-builder-options";
import type { PromptArchetype } from "@/lib/prompt-archetypes";
import type { PromptRole } from "@/lib/prompt-types";


export function PromptArchetypeDetails({ archetype, roles }: { archetype: PromptArchetype; roles: readonly PromptRole[] }) {
  const previewFormat = FORMAT_OPTIONS.find((format) => format.code === archetype.formatCode);
  const previewRoles = archetype.roleIds
        .map((roleId) => roles.find((role) => role.id === roleId)?.name)
        .filter((name): name is string => Boolean(name));
  const previewCardCount = Object.values(archetype.equipped ?? {}).reduce(
        (total, cardIds) => total + (cardIds?.length ?? 0),
        0,
      );

  return (
    <>
      <CardIllustrationFrame
        className="floating-card-art"
        illustration={archetypeArtWithFallback(archetype.id)}
        fallback={archetype.code.slice(0, 1)}
      />
      <div className="floating-card-panel-identity">
        <span>Archetype / {archetype.code}</span>
        <strong>{archetype.name}</strong>
        <p>{archetype.description}</p>
      </div>
      <CardBio text={archetypeArt(archetype.id)?.bio} />
      <div className="ability-guidance">
        <span>What this preset changes</span>
        <ul>
          {archetype.effects.map((effect) => (
            <li key={effect}>{effect}</li>
          ))}
        </ul>
      </div>
      <code>
        Output: {previewFormat?.name ?? archetype.formatCode}.
        Roles: {previewRoles.join(", ") || "none"}. Equipped cards:{" "}
        {previewCardCount}.
      </code>
    </>
  );
}
