import { readStored, writeStored } from "@/lib/prompt-storage";

// Which container a deck renders its panels in: the board (the pasteboard
// with a camera over one board per section) or the flow (the horizontal
// panel slider). One key per deck, restored after mount like the art pack.
export type BoardMode = "board" | "flow";

const BOARD_MODES: readonly BoardMode[] = ["board", "flow"];

/** True only for a mode this build renders; localStorage is user-editable. */
export function isBoardMode(value: unknown): value is BoardMode {
  return (
    typeof value === "string" && (BOARD_MODES as readonly string[]).includes(value)
  );
}

function storageKey(deckId: string) {
  return `digitools.${deckId}.board-mode-v1`;
}

export function readBoardMode(deckId: string, fallback: BoardMode): BoardMode {
  const stored = readStored<unknown>(storageKey(deckId), null);
  return isBoardMode(stored) ? stored : fallback;
}

export function writeBoardMode(deckId: string, mode: BoardMode) {
  writeStored(storageKey(deckId), mode);
}
