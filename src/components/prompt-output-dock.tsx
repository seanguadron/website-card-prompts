"use client";

import { TracedPrompt } from "./hand-workspace";
import { RailToggle } from "./rail-toggle";
import { useState } from "react";

import { buildDeckSkill, skillFolder, type SkillDeck } from "@/lib/deck-skill";
import { downloadTextFile } from "@/lib/browser-download";

type CopyState = "idle" | "copied" | "error";

// Structural section shape so both decks' section types fit (their key
// unions differ; the dock only renders and copies them).
type PromptSection = {
  key: string;
  heading: string;
  label: string;
  body: string;
};

export type MissingPromptItem = {
  field: string;
  label: string;
};

export function PromptOutputDock({
  mergeOrder, cards,
  fork,
  fieldEditor,
  onRevealCard,
  expanded,
  complete,
  missingItems,
  prompt,
  sections,
  copyState,
  onToggle,
  onMissingSelect,
  onCopy,
  skillDeck,
  skillHand,
  skillChoices,
  onDownload,
  onPrint,
}: {
  mergeOrder?: readonly string[];
  cards: { id: string; section:string; text: string; name: string }[];
  fork: React.ReactNode;
  onRevealCard: (panel: number, controlId: string) => void;
  fieldEditor?: React.ReactNode;
  expanded: boolean;
  complete: boolean;
  missingItems: MissingPromptItem[];
  prompt: string;
  sections: PromptSection[] | null;
  copyState: CopyState;
  onToggle: () => void;
  onMissingSelect: (field: string) => void;
  onCopy: () => void;
  skillDeck: SkillDeck;
  skillHand: string;
  skillChoices: { label: string; body: string }[];
  onDownload: (format: "md" | "txt" | "json") => void;
  onPrint: () => void;
}) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [view, setView] = useState<"prompt" | "skill">("prompt");
  const skill = buildDeckSkill(skillDeck, skillHand, skillChoices);
  const skillReady = skillChoices.some((choice) => choice.body.trim());
  const ready = view === "skill" ? skillReady : complete;
  const wordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;
  const estimatedTokens = Math.ceil(prompt.length / 4);

  async function copySection(section: PromptSection) {
    try {
      await navigator.clipboard.writeText(`${section.heading}\n${section.body}`);
      setCopiedSection(section.key);
      window.setTimeout(() => {
        setCopiedSection((current) =>
          current === section.key ? null : current,
        );
      }, 1200);
    } catch {
      setCopiedSection(null);
    }
  }

  return (
    <aside
      id="prompt-output-dock"
      className={
        expanded ? "prompt-output-dock is-expanded" : "prompt-output-dock"
      }
      aria-labelledby="preview-title"
      data-component="Panel:PromptPreview"
    >
        <RailToggle side="right" title="Output" expanded={expanded} controls="prompt-output-content"
          count={ready ? "Ready" : view === "skill" ? "Hand" : missingItems.length} onToggle={onToggle} />

        <div
          className="output-dock-content"
          id="prompt-output-content"
          aria-hidden={!expanded}
          inert={!expanded}
        >
            <div
              className="output-view-switch"
              role="group"
              aria-label="Output view"
            >
              <button
                type="button"
                className={view === "prompt" ? "is-active" : ""}
                aria-pressed={view === "prompt"}
                onClick={() => setView("prompt")}
              >
                Prompt
              </button>
              <button
                type="button"
                className={view === "skill" ? "is-active" : ""}
                aria-pressed={view === "skill"}
                onClick={() => setView("skill")}
              >
                Skill
              </button>
            </div>

          <div className="preview-header">
            <div>
              <h2 id="preview-title">
                {view === "skill" ? "Reusable skill" : "Assembled prompt"}
              </h2>
            </div>
            <span className={ready ? "preview-state is-ready" : "preview-state"}>
              {ready ? "Ready" : view === "skill" ? "Empty hand" : `${missingItems.length} missing`}
            </span>
          </div>

          {view === "skill" && (
            <>
              <p className="skill-location">Save as <code>{skillFolder(skillDeck, skillHand)}/SKILL.md</code> in your skills directory.</p>
              <pre><code>{skillReady ? skill : "Equip a card to give this skill a direction."}</code></pre>
              {!skillReady && (
                <button type="button" className="button button-secondary" onClick={onToggle}>
                  Return to cards
                </button>
              )}
              <button
                type="button"
                className="button button-primary"
                disabled={!skillReady}
                onClick={() => downloadTextFile("SKILL.md", skill, "text/markdown;charset=utf-8")}
              >
                Download SKILL.md
              </button>
            </>
          )}

          {view === "prompt" ? (
          <>
          <pre aria-live="polite">
            <code><TracedPrompt prompt={prompt} cards={cards} sections={sections} mergeOrder={mergeOrder} onRevealCard={onRevealCard} /></code>
          </pre>

          {fieldEditor}

          <dl className="prompt-stats" aria-label="Prompt statistics">
            <div>
              <dt>Words</dt>
              <dd>{wordCount}</dd>
            </div>
            <div>
              <dt>Est. tokens</dt>
              <dd>{estimatedTokens}</dd>
            </div>
            <div>
              <dt>Characters</dt>
              <dd>{prompt.length}</dd>
            </div>
          </dl>

          <div className="preview-actions">
            <button
              className="button button-primary"
              type="button"
              onClick={onCopy}
              disabled={!complete}
            >
              {copyState === "copied" ? "Copied" : "Copy prompt"}
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={onPrint}
              disabled={!complete}
            >
              Print / PDF
            </button>
          </div>

          <div className="preview-export" role="group" aria-label="Download prompt">
            <span>Download</span>
            <button
              type="button"
              onClick={() => onDownload("md")}
              disabled={!complete}
            >
              .md
            </button>
            <button
              type="button"
              onClick={() => onDownload("txt")}
              disabled={!complete}
            >
              .txt
            </button>
            <button
              type="button"
              onClick={() => onDownload("json")}
              disabled={!complete}
            >
              .json
            </button>
          </div>

          {complete && sections ? (
            <div
              className="preview-section-copy"
              role="group"
              aria-label="Copy a single section"
            >
              <span>Copy section</span>
              {sections.map((section) => (
                <button
                  type="button"
                  onClick={() => copySection(section)}
                  key={section.key}
                >
                  {copiedSection === section.key ? "Copied" : section.label}
                </button>
              ))}
            </div>
          ) : null}

          {!complete ? (
            <div className="missing-fields">
              <span>Missing</span>
              <div className="missing-field-list">
                {missingItems.map((item) => (
                  <button
                    type="button"
                    onClick={() => onMissingSelect(item.field)}
                    key={item.field}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {copyState === "error" ? (
            <p className="inline-error" role="alert">
              Clipboard access was blocked. Download the file instead.
            </p>
          ) : null}
          </>
          ) : null}
          <div hidden={view !== "prompt"}>{fork}</div>
        </div>
    </aside>
  );
}
