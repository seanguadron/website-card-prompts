import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { soundFaceArt } from "../src/lib/sound-card-art.ts";

function catalog(name) {
  return JSON.parse(readFileSync(new URL(`../src/data/sound-deck/${name}.json`, import.meta.url)));
}

test("every built-in SONIC card, archetype and guide resolves to a shipped portrait", () => {
  const ids = [
    ...catalog("cards").cards.map(({ id }) => id),
    ...catalog("archetypes").archetypes.map(({ id }) => id),
    ...catalog("builder").soundParts.map(({ letter }) => letter),
  ];
  for (const id of ids) {
    const portrait = soundFaceArt(id);
    assert.equal(portrait?.status, "generated", id);
    assert.ok(existsSync(new URL(`../public${portrait.src}`, import.meta.url)), portrait.src);
  }
  assert.equal(soundFaceArt("custom-preset"), undefined);
});
