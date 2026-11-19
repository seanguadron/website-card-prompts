"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CardIllustrationFrame } from "@/components/prompt-builder-ui";
import { useCardDeckMotion } from "@/hooks/use-card-deck-motion";
import { usePortalTarget } from "@/hooks/use-portal-target";
import type { CardArtRef } from "@/lib/card-engine";

export type BoardArchetypeItem = {
  id: string;
  code: string;
  name: string;
  description: string;
  effects: readonly string[];
  art?: CardArtRef;
  custom?: boolean;
};

const SOCKET_ID = "archetype-socket";

function ArchetypeFace({ item }: { item: BoardArchetypeItem }) {
  return (
    <>
      <span className="board-archetype-topline">
        <span>{item.custom ? "Preset" : "Archetype"}</span>
        <span>{item.code}</span>
      </span>
      <CardIllustrationFrame
        className="board-archetype-art"
        illustration={item.art}
        fallback={item.code.slice(0, 1)}
      />
      <strong>{item.name}</strong>
      <small>{item.description}</small>
    </>
  );
}

function HandCard({
  item,
  active,
  onApply,
}: {
  item: BoardArchetypeItem;
  active: boolean;
  onApply: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `archetype:${item.id}`,
    data: { archetypeId: item.id },
  });

  return (
    <button
      ref={setNodeRef}
      className={[
        "board-archetype-card",
        active ? "is-active" : "",
        isDragging ? "is-dragging" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      type="button"
      data-motion-card
      onClick={onApply}
      aria-label={`Seat the ${item.name} archetype. ${item.description}`}
      {...listeners}
      {...attributes}
      aria-pressed={active}
    >
      <ArchetypeFace item={item} />
    </button>
  );
}

/**
 * The archetype socket: the Setup board's master slot. Drop (or click) an
 * archetype card from the hand beside it and the deck builds itself out -
 * roles, cards, and tracks across every section board. The seated card shows
 * which archetype is in play; editing any board unseats it (the deck's
 * existing rule), and the socket empties while the cards stay.
 */
export function BoardArchetypeSocket({
  items,
  activeId,
  onApply,
  onUnseat,
  hint,
}: {
  items: readonly BoardArchetypeItem[];
  activeId: string | null;
  onApply: (id: string) => void;
  onUnseat: () => void;
  hint: string;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const portalTarget = usePortalTarget();
  // The same pointer tilt the card grids have: cards near the pointer lean
  // toward it on fine pointers (DESIGN_DIRECTION, the CRAFT card system).
  const handMotion = useCardDeckMotion();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const seated = items.find((item) => item.id === activeId) ?? null;
  const dragging = items.find((item) => item.id === draggingId) ?? null;

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as { archetypeId?: string } | undefined;
    setDraggingId(data?.archetypeId ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const data = event.active.data.current as { archetypeId?: string } | undefined;
    setDraggingId(null);
    if (event.over?.id === SOCKET_ID && data?.archetypeId) {
      onApply(data.archetypeId);
    }
  }

  return (
    <DndContext
      id="board-archetypes"
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggingId(null)}
    >
      <section className="board-archetype" aria-labelledby="board-archetype-title">
        <div className="workbench-section-heading board-archetype-heading">
          <strong id="board-archetype-title">Archetype socket</strong>
          <small>{seated ? seated.code : `${items.length} in hand`}</small>
        </div>
        <Socket seated={seated} onUnseat={onUnseat} hint={hint} />
        <div
          className="board-archetype-hand"
          role="list"
          aria-label="Archetype cards"
          onPointerMove={handMotion.onPointerMove}
          onPointerLeave={handMotion.onPointerLeave}
        >
          {items.map((item) => (
            <div role="listitem" key={item.id}>
              <HandCard
                item={item}
                active={item.id === activeId}
                onApply={() => onApply(item.id)}
              />
            </div>
          ))}
        </div>
      </section>

      {portalTarget
        ? createPortal(
            <DragOverlay dropAnimation={null} zIndex={120}>
              {dragging ? (
                <div className="board-archetype-card card-drag-overlay is-active">
                  <ArchetypeFace item={dragging} />
                </div>
              ) : null}
            </DragOverlay>,
            portalTarget,
          )
        : null}
    </DndContext>
  );
}

function Socket({
  seated,
  onUnseat,
  hint,
}: {
  seated: BoardArchetypeItem | null;
  onUnseat: () => void;
  hint: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: SOCKET_ID });

  return (
    <div
      ref={setNodeRef}
      className={[
        "board-socket",
        seated ? "is-seated" : "",
        isOver ? "is-over" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="group"
      aria-label={seated ? `Socket: ${seated.name}` : "Socket: empty"}
    >
      <span>Socket</span>
      {seated ? (
        <>
          <div className="board-archetype-card board-socket-card is-active">
            <ArchetypeFace item={seated} />
          </div>
          <button
            className="board-socket-unseat"
            type="button"
            onClick={onUnseat}
            aria-label={`Unseat ${seated.name}. Your cards stay in place.`}
          >
            <span aria-hidden="true">x</span>
          </button>
        </>
      ) : (
        <div className="board-socket-empty">
          <strong aria-hidden="true">+</strong>
          <small>{hint}</small>
        </div>
      )}
    </div>
  );
}
