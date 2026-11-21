import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { DECK_THEMES, deckThemeAttributes, isDeckTheme } from "../src/lib/deck-theme.ts";

test("saved world choices accept only the three installed packs", () => {
  for (const { id } of DECK_THEMES) {
    assert.equal(isDeckTheme(id), true);
    const pack = JSON.parse(readFileSync(new URL(
      `../src/data/prompt-builder/art-themes/${id}.json`, import.meta.url,
    )));
    assert.equal(pack.theme.id, id);
  }
  for (const invalid of [null, "gallery", "Fantasy", {}, "../fantasy"]) {
    assert.equal(isDeckTheme(invalid), false);
  }
});

test("every deck uses one fixed WebP back for each world", () => {
  for (const deck of ["craft", "picture", "sonic"]) {
    for (const { id } of DECK_THEMES) {
      const path = `/card-backs/${deck}-${id}.webp`;
      const attrs = deckThemeAttributes(deck, id);
      assert.equal(attrs["data-deck-theme"], id);
      assert.equal(attrs.style["--card-back"], `url("${path}")`);
      const image = readFileSync(new URL(`../public${path}`, import.meta.url));
      assert.equal(image.toString("ascii", 0, 4), "RIFF");
      assert.equal(image.toString("ascii", 8, 12), "WEBP");
    }
  }
});
