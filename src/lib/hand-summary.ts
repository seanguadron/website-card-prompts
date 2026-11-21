export function summarizeSlots(slots: readonly string[], capacity = slots.length) {
  const equipped = slots.filter(Boolean).length;
  const empty = Math.max(0, capacity - equipped);
  return `${equipped} equipped · ${empty} empty ${empty === 1 ? "slot" : "slots"}`;
}
