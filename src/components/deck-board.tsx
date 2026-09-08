"use client";

import {
  Children,
  useRef,
  type CSSProperties,
  type FocusEvent,
  type ReactNode,
} from "react";
import { useBoardCamera } from "@/hooks/use-board-camera";
import { BOARD_GAP, BOARD_WIDTH, boardOrigin } from "@/lib/board-layout";

export type DeckBoardSpec = {
  key: string;
  /** The tile letter: the section's acronym letter, "S" for Setup. */
  letter: string;
  label: string;
  complete: boolean;
};

/**
 * The deck board: a pasteboard with a camera over a row of boards, one per
 * child. It is a CONTAINER for the same panels the flow renders - the deck
 * hands it the panel contents in order and says which board is active; the
 * camera follows. Pips, zoom, Fit, and All live in the screen-space bar at
 * the bottom-left. Keyboard: [ and ] move between boards, 0 fits the active
 * one, - and = zoom, arrows pan when the pasteboard itself is focused, and
 * Space + drag pans from anywhere. Focus moving into another board frames
 * it, so tabbing never leaves the user looking at the wrong board.
 */
export function DeckBoard({
  boards,
  activeIndex,
  onActivate,
  dealing,
  ariaLabel,
  children,
}: {
  boards: readonly DeckBoardSpec[];
  activeIndex: number;
  onActivate: (index: number) => void;
  /** True while an archetype is being dealt: slot cards flip in. */
  dealing?: boolean;
  ariaLabel: string;
  children: ReactNode;
}) {
  const nodes = Children.toArray(children);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const camera = useBoardCamera({
    viewportRef,
    boardCount: boards.length,
    activeIndex,
    onActivate,
  });
  const { view } = camera;
  const style = {
    "--board-scale": view.scale,
    "--board-tx": `${view.tx}px`,
    "--board-ty": `${view.ty}px`,
  } as CSSProperties;

  function followFocus(event: FocusEvent<HTMLDivElement>) {
    const surface = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-board-index]",
    );
    if (!surface) {
      return;
    }
    const index = Number(surface.dataset.boardIndex);
    if (Number.isInteger(index) && index !== activeIndex) {
      onActivate(index);
    }
  }

  return (
    <div
      className="deck-board"
      data-component="Board:Deck"
      ref={viewportRef}
      role="region"
      aria-label={ariaLabel}
      tabIndex={0}
      data-zoom={camera.tier}
      data-panning={camera.panning ? "true" : undefined}
      data-space={camera.spaceDown ? "true" : undefined}
      data-dealing={dealing ? "true" : undefined}
      data-ready={camera.ready ? "true" : undefined}
      style={style}
      onFocus={followFocus}
      {...camera.handlers}
    >
      <div
        className={
          camera.animating ? "deck-board-world is-animating" : "deck-board-world"
        }
        style={{
          transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`,
        }}
      >
        {boards.map((board, index) => {
          const origin = boardOrigin(index, BOARD_WIDTH, BOARD_GAP);
          return (
            <section
              className={
                index === activeIndex
                  ? "deck-board-surface is-active"
                  : "deck-board-surface"
              }
              data-board-index={index}
              ref={(node) => camera.registerBoard(index, node)}
              style={{ left: origin.x, top: origin.y, width: BOARD_WIDTH }}
              aria-label={`${board.label} board`}
              // Every board stays present and reachable (a long document of
              // labelled regions, not a slider); this marks the framed one.
              aria-current={index === activeIndex ? "true" : undefined}
              key={board.key}
            >
              <header className="deck-board-nameplate" aria-hidden="true">
                <b>{board.letter}</b>
                <span>{board.label}</span>
                {board.complete ? <i>Complete</i> : null}
              </header>
              {nodes[index] ?? null}
            </section>
          );
        })}
      </div>

      <div className="deck-board-bar" role="toolbar" aria-label="Board navigation">
        <div className="deck-board-pips" role="group" aria-label="Boards">
          {boards.map((board, index) => (
            <button
              className={[
                "deck-board-pip",
                index === activeIndex ? "is-active" : "",
                board.complete ? "is-complete" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              type="button"
              aria-current={index === activeIndex ? "true" : undefined}
              aria-label={`${board.label}${board.complete ? ", complete" : ""}`}
              title={board.label}
              onClick={() => onActivate(index)}
              key={board.key}
            >
              {board.letter}
            </button>
          ))}
        </div>
        <div className="deck-board-zoom">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => camera.zoomBy(1 / 1.25)}
          >
            <span aria-hidden="true">&minus;</span>
          </button>
          <output aria-label="Zoom level">{Math.round(view.scale * 100)}%</output>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => camera.zoomBy(1.25)}
          >
            <span aria-hidden="true">+</span>
          </button>
          <button
            type="button"
            onClick={() => camera.frameBoard(activeIndex, true)}
            title="Fit the active board (0)"
          >
            Fit
          </button>
          <button
            type="button"
            onClick={camera.frameAll}
            title="See every board"
          >
            All
          </button>
        </div>
      </div>
    </div>
  );
}
