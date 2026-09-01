// Panel index map for the SONIC Deck's 6-panel slider (guide + the five
// S.O.N.I.C. steps). Proof scenarios address panels by these indices via
// their "panel" field.
//
// Kept free of path aliases and JSON imports so the scripts/*.test.mjs
// runner can load it directly.

export const SOUND_PANEL_INDEX = {
  guide: 0,
  source: 1,
  onset: 2,
  nature: 3,
  intensity: 4,
  context: 5,
} as const;

export type SoundPanelIndex =
  (typeof SOUND_PANEL_INDEX)[keyof typeof SOUND_PANEL_INDEX];

// One panel per S.O.N.I.C. step, in step order.
const SOUND_STEP_PANELS: readonly number[] = [
  SOUND_PANEL_INDEX.source,
  SOUND_PANEL_INDEX.onset,
  SOUND_PANEL_INDEX.nature,
  SOUND_PANEL_INDEX.intensity,
  SOUND_PANEL_INDEX.context,
];

export const SOUND_PANEL_COUNT = Object.keys(SOUND_PANEL_INDEX).length;

export function getSoundStepIndexForPanel(activePanel: number) {
  return SOUND_STEP_PANELS.indexOf(activePanel);
}

export function getSoundStepPanel(stepIndex: number) {
  return SOUND_STEP_PANELS[stepIndex] ?? SOUND_PANEL_INDEX.guide;
}

export function getNextIncompleteSoundPanel(
  activePanel: number,
  completeSteps: readonly boolean[],
) {
  if (completeSteps.every(Boolean)) {
    return null;
  }

  const activeStepIndex = getSoundStepIndexForPanel(activePanel);
  for (let offset = 1; offset <= completeSteps.length; offset += 1) {
    const stepIndex = (activeStepIndex + offset) % completeSteps.length;
    if (!completeSteps[stepIndex]) {
      return getSoundStepPanel(stepIndex);
    }
  }

  return null;
}
