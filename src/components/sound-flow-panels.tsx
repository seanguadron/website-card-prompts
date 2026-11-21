"use client";

import { summarizeSlots } from "@/lib/hand-summary";
import { SoundEnvelope } from "./deck-diagrams";
import { useState } from "react";
import type { ReactNode, RefObject } from "react";
import { DeckBoard, type DeckBoardSpec } from "@/components/deck-board";
import { PromptCardWorkbench } from "@/components/prompt-card-workbench";
import {
  CardIllustrationFrame,
  CraftCard,
  CraftDictationField,
  FieldHeading,
  type DictationApi,
  type FieldGuidance,
} from "@/components/prompt-builder-ui";
import type { BoardMode } from "@/lib/board-prefs";
import { soundCardEngine } from "@/lib/sound-card-system";
import { SOUND_PARTS } from "@/lib/sound-deck-state";
import { SOUND_PANEL_INDEX } from "@/lib/sound-navigation";
import { SOUND_LAYER_LIMIT, SOUND_SECTIONS } from "@/lib/sound-prompt";
import type { SoundSection } from "@/lib/sound-prompt";
import type {
  SoundCardSystemState,
  SoundDraft,
  SoundDraftTextField,
  SoundTrackId,
} from "@/lib/sound-types";

export type SoundDictationField = "subject";

// Panel guidance, inline (the CRAFT keyed lookup stays CRAFT's). Written
// from Firefly's own five rules, so the deck teaches what the model rewards.
const PANEL_GUIDANCE: Record<SoundSection, FieldGuidance> = {
  source: {
    title: "Source help",
    body: "Describe the sound directly, noun first: what makes it and what it is doing.",
    points: [
      "\"lion roaring\" beats \"the sound of a lion roaring\" - the deck strips that lead-in anyway.",
      "One sound per prompt; a soundscape is several prompts layered on the rack.",
    ],
  },
  onset: {
    title: "Onset help",
    body: "Choose how the sound starts and moves through time.",
    points: [
      "One attack idea is enough - sharp and swelling fight each other.",
      "Slide Emphasis to go from a hint of the shape to the whole envelope.",
    ],
  },
  nature: {
    title: "Nature help",
    body: "Pick the material and texture the sound is made of.",
    points: [
      "Try an audible quality such as a metallic ring or a woody knock.",
      "Start with the texture you most want to hear.",
    ],
  },
  intensity: {
    title: "Intensity help",
    body: "Set loudness, weight, and distance.",
    points: [
      "\"Very loud explosion\" and \"soft explosion\" are different sounds.",
      "Use distance for listener position and loudness for level.",
    ],
  },
  context: {
    title: "Context help",
    body: "Place the sound in a world, a purpose, and a space.",
    points: [
      "Pair a genre cue with an audible detail, such as a springy pitch bend.",
      "Finish here, then stack extra sounds on the layer rack below.",
    ],
  },
};

const SECTION_LETTERS: Record<SoundSection, string> = {
  source: "S",
  onset: "O",
  nature: "N",
  intensity: "I",
  context: "C",
};

type Panel = {
  key: string;
  node: ReactNode;
};

export function SoundFlowPanels({
  activePanel,
  registerPanelHeading,
  flowViewportRef,
  layout = "flow",
  boardSetup,
  onActivatePanel,
  dealing,
  draft,
  cardSystem,
  stepComplete,
  attentionTargetId,
  dictation,
  promptReady,
  navigateToSoundStep,
  onUpdateDraft,
  onSetAmbience,
  onAddLayer,
  onRemoveLayer,
  onClearLayers,
  onChangeTrack,
  onToggleCard,
  onDropCard,
  onRemoveCard,
  onClearCards,
}: {
  activePanel: number;
  registerPanelHeading: (
    panelIndex: number,
    node: HTMLHeadingElement | null,
  ) => void;
  flowViewportRef: RefObject<HTMLDivElement | null>;
  /** Which container renders the panels: the horizontal flow or the board. */
  layout?: BoardMode;
  /** Board mode only: rendered on the Setup board under the guide. */
  boardSetup?: ReactNode;
  /** Board mode only: the board asks to make another panel active. */
  onActivatePanel?: (index: number) => void;
  /** Board mode only: an archetype just seated, deal the slot cards in. */
  dealing?: boolean;
  draft: SoundDraft;
  cardSystem: SoundCardSystemState;
  stepComplete: readonly boolean[];
  attentionTargetId: string | null;
  dictation: DictationApi<SoundDictationField>;
  // Whether the merged prompt is complete enough to park on the rack; the
  // deck root captures the prompt text itself when Add is pressed.
  promptReady: boolean;
  navigateToSoundStep: (stepIndex: number) => void;
  onUpdateDraft: (field: SoundDraftTextField, value: string) => void;
  onSetAmbience: (value: boolean) => void;
  onAddLayer: () => void;
  onRemoveLayer: (id: string) => void;
  onClearLayers: () => void;
  onChangeTrack: (
    section: SoundSection,
    trackId: SoundTrackId,
    value: number,
  ) => void;
  onToggleCard: (section: SoundSection, lineageId: string) => void;
  onDropCard: (
    section: SoundSection,
    slotIndex: number,
    lineageId: string,
  ) => void;
  onRemoveCard: (section: SoundSection, slotIndex: number) => void;
  onClearCards: (section: SoundSection) => void;
}) {
  const [copiedLayerId, setCopiedLayerId] = useState<string | null>(null);
  const board = layout === "board";

  async function copyLayer(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLayerId(id);
      window.setTimeout(() => {
        setCopiedLayerId((current) => (current === id ? null : current));
      }, 1200);
    } catch {
      setCopiedLayerId(null);
    }
  }

  function sectionWorkbench(section: SoundSection, controlId: string) {
    return (
      <div id={controlId}>
        <PromptCardWorkbench
          engine={soundCardEngine}
          section={section}
          vocabularyKey="SONIC"
          values={cardSystem.tracks}
          equippedIds={cardSystem.equipped[section]}
          suggestedId={cardSystem.suggested[section]}
          onTrackChange={(trackId, value) =>
            onChangeTrack(section, trackId, value)
          }
          onToggleCard={(lineageId) => onToggleCard(section, lineageId)}
          onDropCard={(slotIndex, lineageId) =>
            onDropCard(section, slotIndex, lineageId)
          }
          onRemoveCard={(slotIndex) => onRemoveCard(section, slotIndex)}
          onClearCards={() => onClearCards(section)}
        />
      </div>
    );
  }

  function cardPanel(section: SoundSection, children?: ReactNode): Panel {
    const panelIndex = SOUND_PANEL_INDEX[section];
    const stepIndex = panelIndex - 1;
    const part = SOUND_PARTS[stepIndex];

    return {
      key: section,
      node: (
        <>
          <h2
            className="sr-only"
            tabIndex={-1}
            ref={(node) => {
              registerPanelHeading(panelIndex, node);
            }}
          >
            {part.label}
          </h2>

          <div className="flow-panel-card">
            <CraftCard
              letter={SECTION_LETTERS[section]}
              complete={stepComplete[stepIndex]}
            >
              <div className="field craft-field">
                <FieldHeading
                  guidance={PANEL_GUIDANCE[section]}
                  label={`${part.label} cards`}
                  controlId={`sound-${section}-workbench`}
                  labelControl={false}
                />
                {children}
                {sectionWorkbench(section, `sound-${section}-workbench`)}
              </div>
            </CraftCard>
          </div>
        </>
      ),
    };
  }

  const guidePanel: Panel = {
    key: "guide",
    node: (
      <>
        <div className="craft-method" aria-labelledby="sound-method-title">
          <div className="craft-method-copy">
            <h2
              id="sound-method-title"
              tabIndex={-1}
              ref={(node) => {
                registerPanelHeading(SOUND_PANEL_INDEX.guide, node);
              }}
            >
              Build with S.O.N.I.C.
            </h2>
            {/* One sentence per line, as on the other guides. */}
            <p className="craft-lede craft-lede-sentences">
              <span>
                Name the sound, then stack attack, texture, dynamics, and
                world cards.
              </span>
              <span>
                Each prompt is one sound; layer several from the rack.
              </span>
            </p>
            {/* Same rule as the other guides: the framework's source is
                credited on the page that teaches it. */}
            <p className="craft-credit">
              Built from the sound-effect prompting guidance in{" "}
              <a
                className="craft-credit-name"
                href="https://helpx.adobe.com/firefly/web/work-with-audio-and-video/work-with-audio/writing-effective-text-prompts-for-sound-effects-generation.html"
                target="_blank"
                rel="noreferrer noopener"
              >
                Adobe Firefly&rsquo;s documentation
              </a>
              .
            </p>
          </div>
          <div className="craft-definition" role="list">
            {SOUND_PARTS.map(({ letter, label, summary }, index) => (
              <button
                className="craft-definition-card"
                type="button"
                role="listitem"
                onClick={() => navigateToSoundStep(index)}
                key={letter}
              >
                {/* No art pack yet: the frame renders its letter fallback
                    until this deck's pack is generated. */}
                <CardIllustrationFrame
                  className="craft-definition-art"
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
        </div>
        {board ? boardSetup : null}
      </>
    ),
  };

  const panels: Panel[] = [
    guidePanel,
    cardPanel(
      "source",
      <>
        <div className="field">
          <FieldHeading
            guidance={PANEL_GUIDANCE.source}
            label="Sound"
            hint="Name the source and what you hear it doing."
            controlId="sound-subject"
          />
          <CraftDictationField
            id="sound-subject"
            field="subject"
            label="Sound"
            value={draft.subject}
            placeholder="heavy rain on a metal roof"
            rows={3}
            required
            attention={attentionTargetId === "sound-subject"}
            onChange={(value) => onUpdateDraft("subject", value)}
            dictation={dictation}
          />
        </div>
        <label className="workbench-default-check sound-deck-ambience-toggle">
          <input
            type="checkbox"
            checked={draft.ambience}
            onChange={(event) => onSetAmbience(event.target.checked)}
          />
          <span>
            <strong>Ambience mode</strong>
            <small>
              For beds and room tone, describe the space first. Equip just the details you want to hear.
            </small>
          </span>
        </label>
      </>,
    ),
    cardPanel("onset", <SoundEnvelope onset={cardSystem.equipped.onset} emphasis={cardSystem.tracks.emphasis} />),
    cardPanel("nature"),
    cardPanel("intensity"),
    cardPanel(
      "context",
      <fieldset className="sound-deck-rack">
        <legend className="sr-only">Layer rack</legend>
        <div className="sound-deck-rack-heading">
          <span>
            <strong>Layer rack</strong>
            <small>
              Firefly generates one sound at a time. Park the current
              prompt here, build the next, then generate each and stack
              them on audio tracks.
            </small>
          </span>
          <button
            className="button button-secondary"
            type="button"
            disabled={!promptReady || draft.layers.length >= SOUND_LAYER_LIMIT}
            onClick={onAddLayer}
          >
            Add to rack
          </button>
        </div>
        {draft.layers.length > 0 ? (
          <ul className="sound-deck-rack-list">
            {draft.layers.map((layer, index) => (
              <li className="sound-deck-rack-line" key={layer.id}>
                <span className="sound-deck-rack-index" aria-hidden="true">
                  {index + 1}
                </span>
                <code>{layer.prompt}</code>
                <button
                  className="button button-quiet"
                  type="button"
                  onClick={() => copyLayer(layer.id, layer.prompt)}
                >
                  {copiedLayerId === layer.id ? "Copied" : "Copy"}
                </button>
                <button
                  className="button button-quiet"
                  type="button"
                  onClick={() => onRemoveLayer(layer.id)}
                  aria-label={`Remove layer ${index + 1}`}
                >
                  <span aria-hidden="true">x</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="sound-deck-rack-empty">
            Nothing parked yet. The current prompt is layer one; add it
            when it is ready and start the next sound.
          </p>
        )}
        {draft.layers.length > 1 ? (
          <button
            className="button button-quiet sound-deck-rack-clear"
            type="button"
            onClick={onClearLayers}
          >
            Clear rack
          </button>
        ) : null}
        <p className="sound-deck-voice-tip">
          Firefly tip: record a voice pass with your prompt - the
          generation follows your timing and energy.
        </p>
      </fieldset>,
    ),
  ];

  if (board) {
    const boards: DeckBoardSpec[] = [
      { key: "guide", letter: "S", label: "Setup", complete: false },
      ...SOUND_PARTS.map((part, index) => ({
        key: part.letter,
        letter: part.letter,
        summary: summarizeSlots(cardSystem.equipped[SOUND_SECTIONS[index]], soundCardEngine.slotBudgets[SOUND_SECTIONS[index]]),
        label: part.label,
        complete: Boolean(stepComplete[index]),
      })),
    ];

    return (
      <DeckBoard
        deck="sonic"
        boards={boards}
        activeIndex={activePanel}
        onActivate={onActivatePanel ?? (() => undefined)}
        dealing={dealing}
        ariaLabel="S.O.N.I.C. board workspace"
      >
        {panels.map((panel, index) => (
          <div
            className={
              index === SOUND_PANEL_INDEX.guide
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
              index === SOUND_PANEL_INDEX.guide
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
