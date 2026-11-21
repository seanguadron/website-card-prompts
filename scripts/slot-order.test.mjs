import assert from "node:assert/strict";
import test from "node:test";
import { insertIntoSlots } from "../src/lib/slot-order.ts";

test("moving an equipped card exchanges the two occupied slots", () => {
  assert.deepEqual(
    insertIntoSlots(["one", "two", "three", "four", ""], 0, "four", 5),
    ["four", "two", "three", "one", ""],
  );
});

test("moving into a gap preserves the requested slot", () => {
  assert.deepEqual(
    insertIntoSlots(["one", "", "three", "four", ""], 1, "four", 5),
    ["one", "four", "three", "", ""],
  );
});

test("adding a new card replaces only the targeted card", () => {
  assert.deepEqual(
    insertIntoSlots(["one", "two", "three"], 1, "new", 3),
    ["one", "new", "three"],
  );
});

test("dropping a card onto its current slot is stable", () => {
  assert.deepEqual(
    insertIntoSlots(["one", "two", "three"], 1, "two", 3),
    ["one", "two", "three"],
  );
});
