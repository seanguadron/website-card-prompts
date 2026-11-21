"use client";

import { summarizeSlots } from "@/lib/hand-summary";
import type { ReactNode, RefObject } from "react";
import { DeckBoard, useBoardEntrance, type DeckBoardSpec } from "@/components/deck-board";
import { PromptCardWorkbench } from "@/components/prompt-card-workbench";
import type { ArtQueueApi } from "@/hooks/use-art-queue";
import { PromptRoleWorkbench } from "@/components/prompt-role-workbench";
import {
  CardIllustrationFrame,
  CraftCard,
  CraftDictationField,
  FieldHeading,
  type CraftDictationApi,
} from "@/components/prompt-builder-ui";
import type { DeckTheme } from "@/lib/deck-theme";
import { ART_PACK_OPTIONS, craftLetterArt, packArtFor } from "@/lib/art-pack";
import type { BoardMode } from "@/lib/board-prefs";
import { FORMAT_OPTIONS } from "@/lib/prompt-builder-options";
import {
  CRAFT_PARTS,
  isFieldComplete,
} from "@/lib/prompt-builder-state";
import type {
  CardSystemState,
  PromptDraft,
  PromptDraftTextField,
} from "@/lib/prompt-builder-state";
import { useRovingRadioGroup } from "@/hooks/use-roving-radio-group";
import { FLOW_PANEL_INDEX } from "@/lib/prompt-navigation";
import { craftCardEngine } from "@/lib/prompt-card-system";
import type { CardSection, TrackId } from "@/lib/prompt-card-system";
import type { PromptRole } from "@/lib/prompt-types";

type Panel = {
  key: string;
  node: ReactNode;
};

export function CraftFlowPanels({
  activePanel,
  registerPanelHeading,
  flowViewportRef,
  layout = "flow",
  boardSetup,
  onActivatePanel,
  dealing,
  draft,
  formatCode,
  cardSystem,
  selectedRoles,
  roles,
  attentionTargetId,
  roleWorkbenchVersion,
  activeRoleCategory,
  roleSelectionMessage,
  dictation,
  artPackId,
  onSelectArtPack,
  navigateToCraftStep,
  onSelectOutputType,
  onUpdateDraft,
  onSetUseDefault,
  onChangeTrack,
  onToggleCard,
  onDropCard,
  onRemoveCard,
  onClearCards,
  onApplyRecommended,
  onSetRoleCategory,
  onToggleRole,
  onDropRole,
  onClearRoles,
  artQueue,
}: {
  activePanel: number;
  registerPanelHeading: (
    panelIndex: number,
    node: HTMLHeadingElement | null,
  ) => void;
  flowViewportRef: RefObject<HTMLDivElement | null>;
  /** Which container renders the panels: the horizontal flow or the board. */
  layout?: BoardMode;
  /** The seated archetype is visible on the Setup board and in the Flow guide. */
  boardSetup?: ReactNode;
  /** Board mode only: the board asks to make another panel active (a pip,
   *  focus moving into another board, the keyboard). */
  onActivatePanel?: (index: number) => void;
  /** Board mode only: an archetype just seated, deal the slot cards in. */
  dealing?: boolean;
  draft: PromptDraft;
  formatCode: string;
  cardSystem: CardSystemState;
  selectedRoles: PromptRole[];
  roles: PromptRole[];
  attentionTargetId: string | null;
  roleWorkbenchVersion: number;
  activeRoleCategory: string;
  roleSelectionMessage: string;
  dictation: CraftDictationApi;
  artPackId: string;
  onSelectArtPack: (id: DeckTheme) => void;
  navigateToCraftStep: (stepIndex: number) => void;
  onSelectOutputType: (value: string) => void;
  onUpdateDraft: (field: PromptDraftTextField, value: string) => void;
  onSetUseDefault: (
    field: "contextUseDefault" | "targetUseDefault",
    value: boolean,
  ) => void;
  onChangeTrack: (trackId: TrackId, value: number) => void;
  onToggleCard: (section: CardSection, lineageId: string) => void;
  onDropCard: (
    section: CardSection,
    slotIndex: number,
    lineageId: string,
  ) => void;
  onRemoveCard: (section: CardSection, slotIndex: number) => void;
  onClearCards: (section: CardSection) => void;
  onApplyRecommended: () => void;
  onSetRoleCategory: (category: string) => void;
  onToggleRole: (role: PromptRole) => void;
  onDropRole: (slotIndex: number, roleId: string) => void;
  onClearRoles: () => void;
  /** Development-only card authoring; undefined everywhere else. */
  artQueue?: ArtQueueApi;
}) {
  // Both output-type radio rows share the same options + selection, so one
  // active index feeds two roving groups (guide panel + format panel).
  const activeFormatIndex = FORMAT_OPTIONS.findIndex(
    (option) => option.value === draft.format,
  );
  const selectFormatAt = (index: number) => {
    const option = FORMAT_OPTIONS[index];
    if (option) onSelectOutputType(option.value);
  };
  const guideFormatGroup = useRovingRadioGroup(
    FORMAT_OPTIONS.length,
    activeFormatIndex,
    selectFormatAt,
  );
  const formatTabsGroup = useRovingRadioGroup(
    FORMAT_OPTIONS.length,
    activeFormatIndex,
    selectFormatAt,
  );
  // The world tier: one card per art pack so switching styles is a visible,
  // clickable thing rather than a control you have to find in the dock.
  const activeStyleIndex = ART_PACK_OPTIONS.findIndex(
    (option) => option.id === artPackId,
  );
  const styleGroup = useRovingRadioGroup(
    ART_PACK_OPTIONS.length,
    activeStyleIndex,
    (index) => {
      const option = ART_PACK_OPTIONS[index];
      if (option) onSelectArtPack(option.id);
    },
  );

  const contextComplete = isFieldComplete(draft, "context");
  const roleComplete = selectedRoles.length > 0;
  const actionComplete =
    isFieldComplete(draft, "action") ||
    cardSystem.equipped.action.some(Boolean);
  const formatComplete = isFieldComplete(draft, "format");
  const targetComplete = isFieldComplete(draft, "targetAudience");
  const board = layout === "board";
  const boardViewportRef = useBoardEntrance(activePanel, board);

  const guidePanel: Panel = {
    key: "guide",
    node: (
      <>
        {!board && boardSetup}
        <div className="craft-method" aria-labelledby="craft-method-title">
          <div className="craft-method-copy">
            <h2
              id="craft-method-title"
              tabIndex={-1}
              ref={(node) => {
                registerPanelHeading(FLOW_PANEL_INDEX.guide, node);
              }}
            >
              Build with C.R.A.F.T.
            </h2>
            <p className="craft-lede">
              Set the context, role, actions, format, and audience. Your
              prompt updates as you go.
            </p>
            {/* The framework is not ours. It is named on the page that
                teaches it, not buried in a repo file. */}
            <p className="craft-credit">
              Built around the C.R.A.F.T. prompting framework developed by{" "}
              {/* The name is one thing; it wraps as one thing, so the break
                  lands before it rather than inside it. */}
              <a
                className="craft-credit-name"
                href="https://www.youtube.com/watch?v=ABCqfaTjNd4"
                target="_blank"
                rel="noreferrer noopener"
              >
                Lawton Solutions / Lawton Learns
              </a>
              .
            </p>
          </div>
          <div className="craft-definition" role="list">
            {CRAFT_PARTS.map(({ letter, label, summary }, index) => (
              <button
                className="craft-definition-card"
                type="button"
                role="listitem"
                onClick={() => navigateToCraftStep(index)}
                key={letter}
              >
                <CardIllustrationFrame
                  className="craft-definition-art"
                  illustration={craftLetterArt(letter)}
                  fallback={letter}
                />
                <span className="craft-definition-word">
                  <b>{letter}</b>
                  <span>{label.slice(1)}</span>
                </span>
                <small>{summary}</small>
              </button>
            ))}
          </div>
          {/* The card style tier: the same Researcher in each world's art,
              so the whole-deck reskin is discoverable from the guide. */}
          <div
            className="craft-style-tier"
            role="radiogroup"
            aria-label="Card style"
          >
            <span className="craft-style-tier-label">Card style</span>
            <div className="craft-style-cards">
              {ART_PACK_OPTIONS.map((option, index) => {
                const selected = option.id === artPackId;
                return (
                  <button
                    className={
                      selected
                        ? "craft-style-card is-active"
                        : "craft-style-card"
                    }
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onSelectArtPack(option.id)}
                    key={option.id}
                    {...styleGroup.itemProps(index)}
                  >
                    <CardIllustrationFrame
                      className="craft-style-art"
                      illustration={packArtFor(
                        option.id,
                        "roles.researcher",
                      )}
                      fallback={option.name.slice(0, 1)}
                    />
                    <strong>{option.name}</strong>
                  </button>
                );
              })}
            </div>
          </div>
          <section
            className="output-type-setup"
            aria-labelledby="output-type-setup-title"
          >
            <div className="workbench-section-heading">
              <div>
                <strong id="output-type-setup-title">Output type</strong>
              </div>
              <small>{formatCode}</small>
            </div>
            <div className="output-type-card-row" role="radiogroup">
              {FORMAT_OPTIONS.map((option, index) => {
                const selected = draft.format === option.value;
                return (
                  <button
                    className={
                      selected
                        ? "output-type-card is-selected"
                        : "output-type-card"
                    }
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onSelectOutputType(option.value)}
                    key={option.code}
                    {...guideFormatGroup.itemProps(index)}
                  >
                    <span>{option.code}</span>
                    <strong>{option.name}</strong>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
        {/* Board mode: the archetype socket is the Setup board's master
            slot, so the deck builds itself out from here (BOARD_VISION). */}
        {board ? boardSetup : null}
      </>
    ),
  };

  const contextPanel: Panel = {
    key: "context",
    node: (
      <>
        <h2
          className="sr-only"
          tabIndex={-1}
          ref={(node) => {
            registerPanelHeading(FLOW_PANEL_INDEX.context, node);
          }}
        >
          Context
        </h2>

        <div className="flow-panel-card">
          <CraftCard letter="C" complete={contextComplete}>
            <div className="field craft-field">
              <FieldHeading
                field="context"
                label="Context modifiers"
                controlId="context-card-workbench"
                labelControl={false}
              />
              <div id="context-card-workbench">
                <PromptCardWorkbench
                  engine={craftCardEngine}
                  section="context"
                  vocabularyKey={formatCode}
                  values={cardSystem.tracks}
                  equippedIds={cardSystem.equipped.context}
                  suggestedId={cardSystem.suggested.context}
                  onTrackChange={onChangeTrack}
                  onToggleCard={(lineageId) =>
                    onToggleCard("context", lineageId)
                  }
                  onDropCard={(slotIndex, lineageId) =>
                    onDropCard("context", slotIndex, lineageId)
                  }
                  onRemoveCard={(slotIndex) =>
                    onRemoveCard("context", slotIndex)
                  }
                  onClearCards={() => onClearCards("context")}
                  artQueue={artQueue}
                />
              </div>
              <div className="workbench-text-row">
                <label
                  className="workbench-text-label"
                  htmlFor="prompt-context"
                >
                  Optional custom context
                </label>
                <label className="workbench-default-check">
                  <input
                    type="checkbox"
                    checked={draft.contextUseDefault}
                    onChange={(event) =>
                      onSetUseDefault(
                        "contextUseDefault",
                        event.target.checked,
                      )
                    }
                  />
                  Use default context
                </label>
              </div>
              <CraftDictationField
                id="prompt-context"
                field="context"
                label="Context"
                value={draft.context}
                placeholder="Describe the raw situation: goal, facts, source material, constraints, exclusions, uncertainty."
                rows={4}
                attention={attentionTargetId === "prompt-context"}
                onChange={(value) => onUpdateDraft("context", value)}
                dictation={dictation}
              />
            </div>
          </CraftCard>
        </div>
      </>
    ),
  };

  const rolePanel: Panel = {
    key: "role",
    node: (
      <>
        <h2
          className="sr-only"
          tabIndex={-1}
          ref={(node) => {
            registerPanelHeading(FLOW_PANEL_INDEX.role, node);
          }}
        >
          Roles
        </h2>

        <div className="flow-panel-card">
          <CraftCard letter="R" complete={roleComplete}>
            <div className="field craft-field role-loadout">
              <FieldHeading
                field="role"
                label="Role"
                controlId="role-loadout-target"
                labelControl={false}
              />

              <div
                id="role-loadout-target"
                tabIndex={-1}
                data-attention={
                  attentionTargetId === "role-loadout-target"
                    ? "true"
                    : undefined
                }
              >
                <PromptRoleWorkbench
                  key={roleWorkbenchVersion}
                  roles={roles}
                  selectedRoleIds={draft.roleIds}
                  activeCategory={activeRoleCategory}
                  selectionMessage={roleSelectionMessage}
                  onCategoryChange={onSetRoleCategory}
                  onToggleRole={onToggleRole}
                  onDropRole={onDropRole}
                  onClearRoles={onClearRoles}
                  artQueue={artQueue}
                />
              </div>
            </div>
          </CraftCard>
        </div>
      </>
    ),
  };

  const actionPanel: Panel = {
    key: "action",
    node: (
      <>
        <h2
          className="sr-only"
          tabIndex={-1}
          ref={(node) => {
            registerPanelHeading(FLOW_PANEL_INDEX.action, node);
          }}
        >
          Actions
        </h2>

        <div className="flow-panel-card">
          <CraftCard letter="A" complete={actionComplete}>
            <div className="field craft-field">
              <FieldHeading
                field="action"
                label="Action"
                controlId="prompt-action"
              />
              <PromptCardWorkbench
                engine={craftCardEngine}
                section="action"
                vocabularyKey={formatCode}
                values={cardSystem.tracks}
                equippedIds={cardSystem.equipped.action}
                suggestedId={cardSystem.suggested.action}
                onTrackChange={onChangeTrack}
                onToggleCard={(lineageId) => onToggleCard("action", lineageId)}
                onDropCard={(slotIndex, lineageId) =>
                  onDropCard("action", slotIndex, lineageId)
                }
                onRemoveCard={(slotIndex) => onRemoveCard("action", slotIndex)}
                onClearCards={() => onClearCards("action")}
                artQueue={artQueue}
              />
              <label className="workbench-text-label" htmlFor="prompt-action">
                Optional custom steps
              </label>
              <CraftDictationField
                id="prompt-action"
                field="action"
                label="Action"
                value={draft.action}
                placeholder="Add any steps the cards do not cover."
                rows={7}
                required
                attention={attentionTargetId === "prompt-action"}
                onChange={(value) => onUpdateDraft("action", value)}
                dictation={dictation}
              />
            </div>
          </CraftCard>
        </div>
      </>
    ),
  };

  const formatPanel: Panel = {
    key: "format",
    node: (
      <>
        <h2
          className="sr-only"
          tabIndex={-1}
          ref={(node) => {
            registerPanelHeading(FLOW_PANEL_INDEX.format, node);
          }}
        >
          Format
        </h2>

        <div className="flow-panel-card">
          <CraftCard letter="F" complete={formatComplete}>
            <div className="field craft-field">
              <FieldHeading
                field="format"
                label="Format"
                controlId="prompt-format-options"
                labelControl={false}
              />
              <PromptCardWorkbench
                engine={craftCardEngine}
                section="format"
                vocabularyKey={formatCode}
                values={cardSystem.tracks}
                equippedIds={cardSystem.equipped.format}
                suggestedId={cardSystem.suggested.format}
                onTrackChange={onChangeTrack}
                onToggleCard={(lineageId) => onToggleCard("format", lineageId)}
                onDropCard={(slotIndex, lineageId) =>
                  onDropCard("format", slotIndex, lineageId)
                }
                onRemoveCard={(slotIndex) => onRemoveCard("format", slotIndex)}
                onClearCards={() => onClearCards("format")}
                artQueue={artQueue}
              />

              <section
                className="format-filter-section"
                aria-labelledby="output-type-filter-label"
              >
                <div className="workbench-section-heading">
                  <strong id="output-type-filter-label">Output type</strong>
                  <small>{formatCode}</small>
                </div>
                <div
                  className="format-filter-tabs"
                  id="prompt-format-options"
                  role="radiogroup"
                  data-attention={
                    attentionTargetId === "prompt-format-options"
                      ? "true"
                      : undefined
                  }
                >
                  {FORMAT_OPTIONS.map((option, index) => {
                    const selected = draft.format === option.value;

                    return (
                      <button
                        className={
                          selected
                            ? "format-filter-tab is-active"
                            : "format-filter-tab"
                        }
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => onSelectOutputType(option.value)}
                        key={option.value}
                        {...formatTabsGroup.itemProps(index)}
                      >
                        <span>{option.code}</span>
                        <strong>{option.name}</strong>
                      </button>
                    );
                  })}
                </div>
              </section>

              {cardSystem.overrides.length > 0 ? (
                <div className="recommended-setup-notice">
                  <span>
                    {cardSystem.overrides.length} track{" "}
                    {cardSystem.overrides.length === 1
                      ? "override"
                      : "overrides"}
                  </span>
                  <button type="button" onClick={onApplyRecommended}>
                    Use recommended
                  </button>
                </div>
              ) : null}

              <div className="field">
                <label htmlFor="prompt-format-notes">
                  Optional format notes
                </label>
                <CraftDictationField
                  id="prompt-format-notes"
                  field="formatNotes"
                  label="Format requirements"
                  value={draft.formatNotes}
                  placeholder="Length, sections, citations, or other requirements."
                  rows={4}
                  onChange={(value) => onUpdateDraft("formatNotes", value)}
                  dictation={dictation}
                />
              </div>
            </div>
          </CraftCard>
        </div>
      </>
    ),
  };

  const targetPanel: Panel = {
    key: "target",
    node: (
      <>
        <h2
          className="sr-only"
          tabIndex={-1}
          ref={(node) => {
            registerPanelHeading(FLOW_PANEL_INDEX.target, node);
          }}
        >
          Target audience
        </h2>

        <div className="flow-panel-card">
          <CraftCard letter="T" complete={targetComplete}>
            <div className="field craft-field">
              <FieldHeading
                field="targetAudience"
                label="Audience modifiers"
                controlId="target-card-workbench"
                labelControl={false}
              />
              <div id="target-card-workbench">
                <PromptCardWorkbench
                  engine={craftCardEngine}
                  section="target"
                  vocabularyKey={formatCode}
                  values={cardSystem.tracks}
                  equippedIds={cardSystem.equipped.target}
                  suggestedId={cardSystem.suggested.target}
                  onTrackChange={onChangeTrack}
                  onToggleCard={(lineageId) =>
                    onToggleCard("target", lineageId)
                  }
                  onDropCard={(slotIndex, lineageId) =>
                    onDropCard("target", slotIndex, lineageId)
                  }
                  onRemoveCard={(slotIndex) =>
                    onRemoveCard("target", slotIndex)
                  }
                  onClearCards={() => onClearCards("target")}
                  artQueue={artQueue}
                />
              </div>
              <div className="workbench-text-row">
                <label
                  className="workbench-text-label"
                  htmlFor="prompt-target-audience"
                >
                  Optional custom audience
                </label>
                <label className="workbench-default-check">
                  <input
                    type="checkbox"
                    checked={draft.targetUseDefault}
                    onChange={(event) =>
                      onSetUseDefault(
                        "targetUseDefault",
                        event.target.checked,
                      )
                    }
                  />
                  Use default audience
                </label>
              </div>
              <CraftDictationField
                id="prompt-target-audience"
                field="targetAudience"
                label="Target audience"
                value={draft.targetAudience}
                placeholder="Describe the real reader: role, knowledge level, goal, constraints, and what they need to do next."
                rows={4}
                attention={attentionTargetId === "prompt-target-audience"}
                onChange={(value) => onUpdateDraft("targetAudience", value)}
                dictation={dictation}
              />
            </div>
          </CraftCard>
        </div>
      </>
    ),
  };

  // Panel order IS the FLOW_PANEL_INDEX order: guide, then C.R.A.F.T.
  const panels: Panel[] = [
    guidePanel,
    contextPanel,
    rolePanel,
    actionPanel,
    formatPanel,
    targetPanel,
  ];

  if (board) {
    const completes = [
      contextComplete,
      roleComplete,
      actionComplete,
      formatComplete,
      targetComplete,
    ];
    const sections = ["context", "role", "action", "format", "target"] as const;
    const boards: DeckBoardSpec[] = [
      { key: "guide", letter: "S", label: "Setup", complete: false },
      ...CRAFT_PARTS.map((part, index) => ({
        key: part.letter,
        letter: part.letter,
        summary: sections[index] === "role"
          ? summarizeSlots(draft.roleIds, 3)
          : summarizeSlots(cardSystem.equipped[sections[index]], craftCardEngine.slotBudgets[sections[index]]),
        label: part.label,
        complete: completes[index],
      })),
    ];

    return (
      <DeckBoard
        viewportRef={boardViewportRef}
        deck="craft"
        boards={boards}
        activeIndex={activePanel}
        onActivate={onActivatePanel ?? (() => undefined)}
        dealing={dealing}
        ariaLabel="C.R.A.F.T. board workspace"
      >
        {panels.map((panel, index) => (
          <div
            className={
              index === FLOW_PANEL_INDEX.guide
                ? "flow-panel flow-intro-panel"
                : "flow-panel"
            }
            key={panel.key}
          >
            {panel.node}
          </div>
        ))}
      </DeckBoard>
    );
  }

  return (
    <div className="flow-viewport" ref={flowViewportRef}>
      <div
        className="flow-track"
        style={{
          transform: `translate3d(-${activePanel * 100}%, 0, 0)`,
        }}
      >
        {panels.map((panel, index) => (
          <section
            className={
              index === FLOW_PANEL_INDEX.guide
                ? "flow-panel flow-intro-panel"
                : "flow-panel"
            }
            aria-hidden={activePanel !== index}
            inert={activePanel !== index}
            key={panel.key}
          >
            {panel.node}
          </section>
        ))}
      </div>
    </div>
  );
}
