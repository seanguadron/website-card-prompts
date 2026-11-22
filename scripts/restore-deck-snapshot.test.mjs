import assert from "node:assert/strict";
import test from "node:test";
import { restoreDeckSnapshot } from "../src/lib/restore-deck-snapshot.ts";

const decoders = {
  draft: JSON.parse,
  cards: (raw, draft) => ({ hand: raw ? JSON.parse(raw) : [], format: draft?.format ?? "text" }),
};

test("a corrupt draft leaves the equipped hand available in the default format", () => {
  const snapshot = restoreDeckSnapshot("{", '["role"]', null, decoders);
  assert.equal(snapshot.draft, null);
  assert.deepEqual(snapshot.cardSystem, { hand: ["role"], format: "text" });
});

test("a damaged hand uses the restored draft format when rebuilding default cards", () => {
  const snapshot = restoreDeckSnapshot('{"format":"table"}', "{", null, decoders);
  assert.deepEqual(snapshot.draft, { format: "table" });
  assert.deepEqual(snapshot.cardSystem, { hand: [], format: "table" });
});

test("an invalid saved-at timestamp leaves the restored deck usable", () => {
  const snapshot = restoreDeckSnapshot('{"format":"table"}', '["role"]', "broken", decoders);
  assert.equal(snapshot.savedAt, null);
  assert.deepEqual(snapshot.cardSystem, { hand: ["role"], format: "table" });
});
