import assert from "node:assert/strict";
import test from "node:test";
import {
  getNextIncompleteSoundPanel,
  getSoundStepIndexForPanel,
  getSoundStepPanel,
  SOUND_PANEL_COUNT,
  SOUND_PANEL_INDEX,
} from "../src/lib/sound-navigation.ts";

test("the panel map covers guide plus the five steps", () => {
  assert.equal(SOUND_PANEL_COUNT, 6);
  assert.equal(SOUND_PANEL_INDEX.guide, 0);
  assert.equal(SOUND_PANEL_INDEX.context, 5);
});

test("step and panel indices round-trip", () => {
  for (let step = 0; step < 5; step += 1) {
    assert.equal(getSoundStepIndexForPanel(getSoundStepPanel(step)), step);
  }
  // The guide is not a step.
  assert.equal(getSoundStepIndexForPanel(SOUND_PANEL_INDEX.guide), -1);
  // Out-of-range steps land on the guide.
  assert.equal(getSoundStepPanel(99), SOUND_PANEL_INDEX.guide);
});

test("next-incomplete wraps forward from the active panel", () => {
  // On the Onset panel with only Nature incomplete: go to Nature.
  assert.equal(
    getNextIncompleteSoundPanel(SOUND_PANEL_INDEX.onset, [
      true,
      true,
      false,
      true,
      true,
    ]),
    SOUND_PANEL_INDEX.nature,
  );
  // On the last step with the first incomplete: wrap to Source.
  assert.equal(
    getNextIncompleteSoundPanel(SOUND_PANEL_INDEX.context, [
      false,
      true,
      true,
      true,
      true,
    ]),
    SOUND_PANEL_INDEX.source,
  );
  // Everything complete: nothing to go to.
  assert.equal(
    getNextIncompleteSoundPanel(SOUND_PANEL_INDEX.source, [
      true,
      true,
      true,
      true,
      true,
    ]),
    null,
  );
});
