export function insertIntoSlots(
  slots: readonly string[],
  targetIndex: number,
  itemId: string,
  slotCount: number,
) {
  const normalizedSlots = Array.from(
    { length: slotCount },
    (_, index) => slots[index] ?? "",
  );
  if (slotCount === 0 || !itemId) return normalizedSlots;
  const target = Math.max(0, Math.min(targetIndex, slotCount - 1));
  const source = normalizedSlots.indexOf(itemId);
  if (source !== -1) normalizedSlots[source] = normalizedSlots[target];
  normalizedSlots[target] = itemId;
  return normalizedSlots;
}
