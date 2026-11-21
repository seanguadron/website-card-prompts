"use client";

import { framingDirections } from "@/lib/framing-board";
import { HandFork } from "./hand-fork";
import { HandWorkspace, useHandWorkspace } from "./hand-workspace";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ChangeEvent } from "react";
import { BoardArchetypeSocket } from "@/components/board-archetype-socket";
import { FlowNavDock } from "@/components/flow-nav-dock";
import { FlowStepStrip } from "@/components/flow-step-strip";
import { PictureArchetypeToolbar, PictureArchetypeDetails } from "@/components/picture-archetype-toolbar";
import { PictureDeckHeader } from "@/components/picture-deck-header";
import { PictureFlowPanels } from "@/components/picture-flow-panels";
import type { PictureDictationField } from "@/components/picture-flow-panels";
import type { DictationApi } from "@/components/prompt-builder-ui";
import { PromptLibraryPanel } from "@/components/prompt-library-panel";
import { PromptOutputDock } from "@/components/prompt-output-dock";
import {
  PromptProofLab,
  ProofScenarioStatus,
} from "@/components/prompt-proof-lab";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePictureDeckHistory } from "@/hooks/use-picture-deck-history";
import { usePictureDeckPersistence } from "@/hooks/use-picture-deck-persistence";
import { usePortalTarget } from "@/hooks/use-portal-target";
import { usePromptDictation } from "@/hooks/use-prompt-dictation";
import { useFlowNavigation } from "@/hooks/use-flow-navigation";
import { readBoardMode, writeBoardMode, type BoardMode } from "@/lib/board-prefs";
import { downloadTextFile, slugifyFilename } from "@/lib/browser-download";
import { PICTURE_ARCHETYPES } from "@/lib/picture-archetypes";
import { pictureArchetypeArtWithFallback } from "@/lib/picture-art-pack";
import {
  getEquippedFragments,
  pictureCardEngine,
  PICTURE_TRACK_IDS,
} from "@/lib/picture-card-system";
import {
  PICTURE_PROOF_BASE_DRAFT,
  PICTURE_PROOF_SCENARIOS,
} from "@/lib/picture-proof-scenarios";
import type { PictureProofScenario } from "@/lib/picture-proof-scenarios";
import {
  buildCustomPictureArchetype,
  deleteCustomPictureArchetype,
  isCustomPictureArchetype,
  listCustomPictureArchetypes,
  saveCustomPictureArchetype,
} from "@/lib/picture-custom-archetypes";
import {
  deleteFromPictureLibrary,
  listSavedPicturePrompts,
  saveToPictureLibrary,
} from "@/lib/picture-library";
import type { SavedPicturePrompt } from "@/lib/picture-library";
import {
  decodePictureSessionParam,
  encodePictureSessionParam,
  restorePictureSession,
  serializePictureSession,
} from "@/lib/picture-session";
import {
  restorePictureCardSystem,
  restorePictureDraft,
} from "@/lib/picture-deck-state";
import {
  applyTailPreset,
  clampTailValue,
  createPictureCardSystem,
  draftTail,
  EMPTY_PICTURE_DRAFT,
  EXAMPLE_PICTURE_DRAFT,
  isPictureFieldComplete,
  PICTURE_PARTS,
  PICTURE_REQUIRED_FIELDS,
  withPictureDraftText,
} from "@/lib/picture-deck-state";
import {
  getNextIncompletePicturePanel,
  getPictureStepIndexForPanel,
  getPictureStepPanel,
  PICTURE_PANEL_COUNT,
  PICTURE_PANEL_INDEX,
} from "@/lib/picture-navigation";
import {
  PICTURE_MERGE_ORDER,
  buildPicturePrompt,
  buildPictureSections,
  buildPictureHandSections,
  PICTURE_SECTIONS,
} from "@/lib/picture-prompt";
import type { PictureSection } from "@/lib/picture-prompt";
import type {
  PictureArchetype,
  PictureCardSystemState,
  PictureDraft,
  PictureDraftTextField,
  PictureTrackId,
} from "@/lib/picture-types";
import { PHONE_MEDIA_QUERY } from "@/lib/tool-registry";

export function PictureDeck() {
  const hand = useHandWorkspace("picture", id => Boolean(pictureCardEngine.getLineage(id)));
  const [draft, setDraft] = useState<PictureDraft>(EMPTY_PICTURE_DRAFT);
  const [cardSystem, setCardSystem] = useState<PictureCardSystemState>(
    createPictureCardSystem,
  );
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const [activeArchetypeId, setActiveArchetypeId] = useState<string | null>(
    null,
  );
  const [customArchetypes, setCustomArchetypes] = useState<PictureArchetype[]>(
    [],
  );
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState<SavedPicturePrompt[]>([]);
  const [proofLabOpen, setProofLabOpen] = useState(false);
  const [archetypeSaveOpen, setArchetypeSaveOpen] = useState(false);
  const [activeProofId, setActiveProofId] = useState<string | null>(null);
  // The library name the current draft was loaded from or saved as; feeds the
  // download filename when no archetype is active.
  const [activePromptName, setActivePromptName] = useState<string | null>(
    null,
  );
  // Which container renders the panels: the board (the default, per
  // docs/BOARD_VISION.md) or the horizontal flow, one click away in the dock.
  const [viewMode, setViewMode] = useState<BoardMode>("board");
  // True for a moment after an archetype seats: the slot cards flip in.
  const [dealing, setDealing] = useState(false);
  const dealTimerRef = useRef<number | null>(null);
  // At phone widths the expanded dock overlays the whole workspace, so the
  // default is collapsed there and expanded everywhere else; any explicit
  // choice wins over the default.
  const phoneWidthDock = useMediaQuery(PHONE_MEDIA_QUERY);
  const [outputExpandedChoice, setOutputExpanded] = useState<boolean | null>(
    null,
  );
  const outputExpanded = outputExpandedChoice ?? !phoneWidthDock;
  // The portal below renders on FIRST render, so the target must be resolved
  // after hydration (see use-portal-target).
  const portalTarget = usePortalTarget();

  // Deferred restore of the view choice, like the CRAFT deck's art pack.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setViewMode(readBoardMode("picture-deck", "board"));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(
    () => () => {
      if (dealTimerRef.current !== null) {
        window.clearTimeout(dealTimerRef.current);
      }
    },
    [],
  );

  const persistence = usePictureDeckPersistence({
    draft,
    cardSystem,
    setDraft,
    setCardSystem,
  });
  const history = usePictureDeckHistory({
    enabled: persistence.ready,
    draft,
    cardSystem,
    setDraft,
    setCardSystem,
  });
  const {
    listeningField,
    phase: dictationPhase,
    transcript: dictationTranscript,
    message: speechMessage,
    setMessage: setSpeechMessage,
    waveformRef,
    start: startDictation,
    cancel: cancelDictation,
    stop: stopDictation,
    submit: submitDictation,
  } = usePromptDictation<PictureDictationField>({
    draft,
    onApply: (field, value) => {
      history.checkpoint();
      setDraft((current) => withPictureDraftText(current, field, value));
      setCopyState("idle");
    },
  });

  const equippedFragments = useMemo(
    () => {
      const fragments = getEquippedFragments(cardSystem.equipped, cardSystem.tracks);
      fragments.execution.push(...framingDirections(draft.framing, draft.mjTailEnabled ? undefined : draft.aspectRatio));
      return fragments;
    },
    [cardSystem.equipped, cardSystem.tracks, draft.framing, draft.mjTailEnabled, draft.aspectRatio],
  );
  const tail = useMemo(() => draftTail(draft), [draft]);
  const captureHand = useCallback(() => ({
    session: serializePictureSession(draft, cardSystem),
    title: activePromptName,
    archetype: activeArchetypeId,
  }), [draft, cardSystem, activePromptName, activeArchetypeId]);

  const prompt = useMemo(
    () => buildPicturePrompt(draft.subject, equippedFragments, tail),
    [draft.subject, equippedFragments, tail],
  );
  const promptSections = useMemo(
    () => buildPictureSections(draft.subject, equippedFragments, tail),
    [draft.subject, equippedFragments, tail],
  );

  const missingFields = PICTURE_REQUIRED_FIELDS.filter(
    ({ field }) => !isPictureFieldComplete(draft, field),
  );
  const missingItems = missingFields.map(({ field, label }) => ({
    field,
    label,
  }));
  const isComplete = missingFields.length === 0;
  // A step is "complete" when its panel contributes to the prompt: subject
  // text (or a protagonist card) for P, an equipped card for the middle
  // panels, a card or the enabled tail for Execution.
  const flowStepComplete = PICTURE_SECTIONS.map((section) => {
    if (section === "protagonist") {
      return (
        isPictureFieldComplete(draft, "subject") ||
        cardSystem.equipped.protagonist.some(Boolean)
      );
    }
    if (section === "execution") {
      return (
        cardSystem.equipped.execution.some(Boolean) || draft.mjTailEnabled
      );
    }

    return cardSystem.equipped[section].some(Boolean);
  });
  const completedStepCount = flowStepComplete.filter(Boolean).length;
  const nav = useFlowNavigation({ panelCount: PICTURE_PANEL_COUNT });
  const nextIncompletePanel = getNextIncompletePicturePanel(
    nav.activePanel,
    flowStepComplete,
  );
  const nextIncompleteStepIndex =
    nextIncompletePanel === null
      ? -1
      : getPictureStepIndexForPanel(nextIncompletePanel);
  const nextIncompletePart =
    nextIncompleteStepIndex < 0 ? null : PICTURE_PARTS[nextIncompleteStepIndex];
  const activeStepIndex = getPictureStepIndexForPanel(nav.activePanel);
  const activeArchetype = useMemo(
    () =>
      activeArchetypeId
        ? ([...PICTURE_ARCHETYPES, ...customArchetypes].find(
            (archetype) => archetype.id === activeArchetypeId,
          ) ?? null)
        : null,
    [activeArchetypeId, customArchetypes],
  );
  const activeProof = PICTURE_PROOF_SCENARIOS.find(
    (scenario) => scenario.id === activeProofId,
  );
  // Best available name for exports: archetype, then the library name the
  // draft came from, then the subject line.
  const exportBase = slugifyFilename(
    activeArchetype?.name ?? activePromptName ?? draft.subject,
    "picture",
  );
  const promptFileBase = exportBase.endsWith("prompt")
    ? exportBase
    : `${exportBase}-prompt`;

  useEffect(() => {
    function handleHistoryShortcut(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) {
        return;
      }

      const key = event.key.toLowerCase();
      const wantsUndo = key === "z" && !event.shiftKey;
      const wantsRedo = key === "y" || (key === "z" && event.shiftKey);

      if (!wantsUndo && !wantsRedo) {
        return;
      }

      event.preventDefault();
      const changed = wantsUndo ? history.undo() : history.redo();
      if (changed) {
        setCopyState("idle");
        setSpeechMessage(wantsUndo ? "Last change undone." : "Change restored.");
      }
    }

    window.addEventListener("keydown", handleHistoryShortcut);
    return () => window.removeEventListener("keydown", handleHistoryShortcut);
  }, [history, setSpeechMessage]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCustomArchetypes(listCustomPictureArchetypes());
      setSavedPrompts(listSavedPicturePrompts());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const shared = new URLSearchParams(window.location.search).get("p");
      if (!shared) {
        return;
      }

      try {
        const { draft: nextDraft, cardSystem: nextCardSystem } =
          decodePictureSessionParam(shared);
        setDraft(nextDraft);
        setCardSystem(nextCardSystem);
        setActiveArchetypeId(null);
        setActivePromptName(null);
        setSpeechMessage("Shared prompt loaded.");
      } catch {
        setSpeechMessage("That shared link could not be read.");
      } finally {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.hash}`,
        );
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [setSpeechMessage]);

  function navigateToPictureStep(stepIndex: number) {
    nav.navigateToPanel(getPictureStepPanel(stepIndex));
  }

  function focusMissingField(field: string) {
    if (field !== "subject") {
      return;
    }

    setOutputExpanded(false);
    nav.navigateToPanel(PICTURE_PANEL_INDEX.protagonist, "picture-subject");
  }

  function updateDraft(field: PictureDraftTextField, value: string) {
    history.checkpoint();
    // Editing the exclusion field diverges from an applied preset; the
    // subject line never belongs to a preset, so typing it keeps the badge.
    if (field === "negative") {
      setActiveArchetypeId(null);
    }
    setCopyState("idle");
    setDraft((current) => withPictureDraftText(current, field, value));
  }

  function setTailEnabled(value: boolean) {
    history.checkpoint();
    setActiveArchetypeId(null);
    setCopyState("idle");
    setDraft((current) => ({ ...current, mjTailEnabled: value }));
  }

  function selectAspectRatio(value: string) {
    history.checkpoint();
    setActiveArchetypeId(null);
    setCopyState("idle");
    setDraft((current) => ({ ...current, aspectRatio: value }));
  }

  function setTailNumber(
    field: "stylize" | "chaos" | "weird",
    value: number | null,
  ) {
    history.checkpoint();
    setActiveArchetypeId(null);
    setCopyState("idle");
    // Clamped here too, not just on restore, so the UI setter shares the
    // same enforcement point as every load path.
    setDraft((current) => ({ ...current, [field]: clampTailValue(field, value) }));
  }

  function changeTrack(
    _section: PictureSection,
    trackId: PictureTrackId,
    value: number,
  ) {
    history.checkpoint();
    setActiveArchetypeId(null);
    setCardSystem((current) =>
      pictureCardEngine.setTrackValue(current, trackId, value),
    );
    setCopyState("idle");
  }

  function toggleWorkbenchCard(section: PictureSection, lineageId: string) {
    history.checkpoint();
    setActiveArchetypeId(null);
    setCardSystem((current) =>
      pictureCardEngine.toggleEquippedCard(current, section, lineageId),
    );
    setCopyState("idle");
  }

  function dropWorkbenchCard(
    section: PictureSection,
    slotIndex: number,
    lineageId: string,
  ) {
    history.checkpoint();
    setActiveArchetypeId(null);
    setCardSystem((current) =>
      pictureCardEngine.placeEquippedCard(
        current,
        section,
        slotIndex,
        lineageId,
      ),
    );
    setCopyState("idle");
  }

  function removeWorkbenchCard(section: PictureSection, slotIndex: number) {
    history.checkpoint();
    setActiveArchetypeId(null);
    setCardSystem((current) =>
      pictureCardEngine.removeEquippedCard(current, section, slotIndex),
    );
    setCopyState("idle");
  }

  function clearWorkbenchCards(section: PictureSection) {
    history.checkpoint();
    setActiveArchetypeId(null);
    setCardSystem((current) =>
      pictureCardEngine.clearEquippedCards(current, section),
    );
    setCopyState("idle");
  }

  function applyPictureArchetype(archetype: PictureArchetype) {
    history.checkpoint();
    cancelDictation(true);
    // Sanitized so custom archetypes saved against an older catalog still
    // apply; the tail preset passes through the range clamps.
    setCardSystem(
      pictureCardEngine.sanitizeCardSystemShape({
        tracks: { ...archetype.tracks },
        equipped: pictureCardEngine.archetypeSlots(archetype.equipped, cardSystem.equipped, hand.locked),
        memory: pictureCardEngine.createEmptySnapMemory(),
        overrides: [],
        suggested: pictureCardEngine.createEmptySuggestedCards(),
      }),
    );
    setDraft((current) =>
      !archetype.mjTail
        ? { ...current, mjTailEnabled: false }
        : applyTailPreset(current, archetype.mjTail),
    );
    setActiveArchetypeId(archetype.id);
    setActivePromptName(null);
    setActiveProofId(null);
    setProofLabOpen(false);
    setCopyState("idle");
    setSpeechMessage(
      `${archetype.name} archetype applied. Your subject stayed in place.`,
    );
    // The deal: the boards' slot cards flip in for a beat.
    if (dealTimerRef.current !== null) {
      window.clearTimeout(dealTimerRef.current);
    }
    setDealing(true);
    dealTimerRef.current = window.setTimeout(() => {
      setDealing(false);
      dealTimerRef.current = null;
    }, 1100);
  }

  function switchViewMode(mode: BoardMode) {
    setViewMode(mode);
    writeBoardMode("picture-deck", mode);
  }

  // The archetype hand on the Setup board: custom presets first, then the
  // catalog, each with its gallery art (or the shared preset swatch).
  const boardArchetypes = [...customArchetypes, ...PICTURE_ARCHETYPES].map(
    (archetype) => ({
      id: archetype.id,
      code: archetype.code,
      name: archetype.name,
      description: archetype.description,
      equipped: pictureCardEngine.archetypeSlots(archetype.equipped, cardSystem.equipped, hand.locked),
      details: <PictureArchetypeDetails archetype={archetype} />,
      art: pictureArchetypeArtWithFallback(archetype.id),
      custom: isCustomPictureArchetype(archetype),
    }),
  );

  function applyArchetypeById(id: string) {
    const archetype = [...PICTURE_ARCHETYPES, ...customArchetypes].find(
      (candidate) => candidate.id === id,
    );
    if (archetype) {
      applyPictureArchetype(archetype);
      nav.setActivePanel(PICTURE_PANEL_INDEX.guide);
    }
  }

  function unseatArchetype() {
    setActiveArchetypeId(null);
    setSpeechMessage("Archetype unseated. Your cards stay where they are.");
  }

  function saveCurrentAsPreset(name: string) {
    const archetype = buildCustomPictureArchetype(name, draft, cardSystem);
    setCustomArchetypes(saveCustomPictureArchetype(archetype));
    setActiveArchetypeId(archetype.id);
    setSpeechMessage(`Saved "${archetype.name}" as a preset.`);
  }

  function removeCustomPreset(id: string) {
    setCustomArchetypes(deleteCustomPictureArchetype(id));
    setActiveArchetypeId((current) => (current === id ? null : current));
  }

  function downloadSession() {
    downloadTextFile(
      `${exportBase}-session.json`,
      serializePictureSession(draft, cardSystem),
      "application/json;charset=utf-8",
    );
    setSpeechMessage("Session exported as JSON.");
  }

  async function importSession(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const { draft: nextDraft, cardSystem: nextCardSystem } =
        restorePictureSession(await file.text());
      history.checkpoint();
      cancelDictation(true);
      setDraft(nextDraft);
      setCardSystem(nextCardSystem);
      setActiveArchetypeId(null);
      setActivePromptName(null);
      setActiveProofId(null);
      setCopyState("idle");
      setSpeechMessage("Session imported.");
    } catch {
      setSpeechMessage("That file is not a valid P.I.C.T.U.R.E. session.");
    } finally {
      event.target.value = "";
    }
  }

  async function copyShareLink() {
    try {
      const param = encodePictureSessionParam(draft, cardSystem);
      const url = `${window.location.origin}${window.location.pathname}?p=${param}`;
      await navigator.clipboard.writeText(url);
      setSpeechMessage("Share link copied to clipboard.");
    } catch {
      setSpeechMessage("Could not copy the share link.");
    }
  }

  function saveCurrentToLibrary(name: string) {
    const entries = saveToPictureLibrary(name, draft, cardSystem);
    if (!entries) return false;
    setSavedPrompts(entries);
    // Mirror saveToPictureLibrary's fallback so exports pick up the name.
    setActivePromptName(name.trim() || "Untitled prompt");
    setSpeechMessage("Saved to your prompt library.");
    return true;
  }

  function loadSavedPrompt(entry: SavedPicturePrompt) {
    // Restore through the same validators as autosave, URL shares, and
    // session imports: the library store is shape-filtered on read, but the
    // field types inside draft/cardSystem are still unchecked JSON — a
    // hand-edited entry must degrade to defaults, not crash. The try/catch
    // is defense in depth for the same reason.
    try {
      const nextDraft = restorePictureDraft(JSON.stringify(entry.draft ?? {}));
      const nextCardSystem = restorePictureCardSystem(
        JSON.stringify(entry.cardSystem ?? {}),
      );
      history.checkpoint();
      cancelDictation(true);
      setDraft(nextDraft);
      setCardSystem(nextCardSystem);
      setActiveArchetypeId(null);
      setActivePromptName(entry.name);
      setActiveProofId(null);
      setLibraryOpen(false);
      setCopyState("idle");
      setSpeechMessage(`Loaded "${entry.name}".`);
    } catch {
      setSpeechMessage(`"${entry.name}" could not be loaded.`);
    }
  }

  function removeSavedPrompt(id: string) {
    const entries = deleteFromPictureLibrary(id);
    if (!entries) return false;
    setSavedPrompts(entries);
    return true;
  }

  function loadProofScenario(scenario: PictureProofScenario) {
    history.checkpoint();
    cancelDictation(true);
    setDraft({
      ...EMPTY_PICTURE_DRAFT,
      ...PICTURE_PROOF_BASE_DRAFT,
      ...scenario.draft,
    });
    setCardSystem({
      tracks: {
        ...pictureCardEngine.defaultTrackValues,
        ...scenario.tracks,
      },
      equipped: pictureCardEngine.createEquippedSlots(scenario.equipped),
      memory: pictureCardEngine.createEmptySnapMemory(),
      overrides: PICTURE_TRACK_IDS.filter(
        (trackId) => scenario.tracks?.[trackId] !== undefined,
      ),
      suggested: pictureCardEngine.createEmptySuggestedCards(),
    });
    setActiveArchetypeId(null);
    setActivePromptName(null);
    setActiveProofId(scenario.id);
    setProofLabOpen(false);
    setOutputExpanded(true);
    setCopyState("idle");
    setSpeechMessage(
      `${scenario.name} proof loaded. Follow the verification checklist.`,
    );
    nav.navigateToPanel(scenario.panel);
  }

  function resetDeck() {
    history.checkpoint();
    cancelDictation(true);
    setDraft(EMPTY_PICTURE_DRAFT);
    setCardSystem(createPictureCardSystem());
    setActiveArchetypeId(null);
    setActivePromptName(null);
    setActiveProofId(null);
    nav.setActivePanel(PICTURE_PANEL_INDEX.guide);
    setCopyState("idle");
    setSpeechMessage("");
  }

  function loadExample() {
    history.checkpoint();
    cancelDictation(true);
    setDraft(EXAMPLE_PICTURE_DRAFT);
    setCardSystem({
      ...createPictureCardSystem(),
      equipped: pictureCardEngine.createEquippedSlots({
        illumination: ["golden-hour"],
        canvas: ["oil-painting"],
        tone: ["muted-palette"],
        universe: ["rainswept-city"],
        execution: ["wide-establishing"],
      }),
    });
    setActiveArchetypeId(null);
    setActivePromptName(null);
    setActiveProofId(null);
    setCopyState("idle");
    setSpeechMessage("Example loaded: a lighthouse keeper, five cards, tail on.");
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  function downloadPrompt(format: "md" | "txt" | "json") {
    if (format === "json") {
      const data = promptSections
        ? Object.fromEntries(
            promptSections.map((section) => [section.key, section.body]),
          )
        : {};
      downloadTextFile(
        `${promptFileBase}.json`,
        `${JSON.stringify(data, null, 2)}\n`,
        "application/json;charset=utf-8",
      );
      return;
    }

    downloadTextFile(
      `${promptFileBase}.${format}`,
      `${prompt}\n`,
      format === "txt"
        ? "text/plain;charset=utf-8"
        : "text/markdown;charset=utf-8",
    );
  }

  function printPrompt() {
    window.print();
  }

  function undoLastChange() {
    if (history.undo()) {
      setCopyState("idle");
      setSpeechMessage("Last change undone.");
    }
  }

  function redoLastChange() {
    if (history.redo()) {
      setCopyState("idle");
      setSpeechMessage("Change restored.");
    }
  }

  function continueBuilding() {
    if (nextIncompletePanel === null) {
      setOutputExpanded(true);
      return;
    }

    nav.navigateToPanel(nextIncompletePanel);
  }

  const dictationApi: DictationApi<PictureDictationField> = {
    activeField: listeningField,
    phase: dictationPhase,
    transcript: dictationTranscript,
    waveformRef,
    start: startDictation,
    cancel: () => cancelDictation(),
    stop: stopDictation,
    submit: submitDictation,
  };

  return (
    <HandWorkspace.Provider value={hand}>
    <div className={"tool-page prompt-flow-page is-picture-flow"}>
      <PictureDeckHeader
        stepStrip={
          <FlowStepStrip
            parts={PICTURE_PARTS}
            activeIndex={activeStepIndex}
            completion={flowStepComplete}
            guideActive={nav.activePanel === PICTURE_PANEL_INDEX.guide}
            onGuide={() => nav.navigateToPanel(PICTURE_PANEL_INDEX.guide)}
            onSelect={navigateToPictureStep}
            ariaLabel="P.I.C.T.U.R.E. builder steps"
          />
        }
        saveStatus={persistence.status}
        lastSavedAt={persistence.lastSavedAt}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        completedStepCount={completedStepCount}
        continueLabel={nextIncompletePart ? "Continue" : "Review output"}
        onUndo={undoLastChange}
        onRedo={redoLastChange}
        onContinue={continueBuilding}
        onExportSession={downloadSession}
        onImportSession={importSession}
        onLoadExample={loadExample}
        onOpenLibrary={() => setLibraryOpen(true)}
        onCopyShareLink={copyShareLink}
        proofLabOpen={proofLabOpen}
        onOpenProofLab={() => {
          setProofLabOpen(true);
          setOutputExpanded(false);
        }}
        onSaveArchetypePreset={() => setArchetypeSaveOpen(true)}
        onReset={resetDeck}
      />

      <PromptProofLab
        open={proofLabOpen}
        activeProofId={activeProofId}
        scenarios={PICTURE_PROOF_SCENARIOS}
        id="picture-proof-lab"
        onClose={() => setProofLabOpen(false)}
        onLoad={loadProofScenario}
      />

      <PromptLibraryPanel
        open={libraryOpen}
        savedPrompts={savedPrompts}
        onClose={() => setLibraryOpen(false)}
        onSave={saveCurrentToLibrary}
        onLoad={loadSavedPrompt}
        onDelete={removeSavedPrompt}
      />

      <div
        className={[
          "builder-main-layout",
          outputExpanded ? "" : "is-output-collapsed",
          viewMode === "board" ? "is-board-mode" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {viewMode === "board" && <aside id="board-archetype-tray" aria-label="Archetypes" />}
        <PictureArchetypeToolbar
          archetypes={PICTURE_ARCHETYPES}
          customArchetypes={customArchetypes}
          activeId={activeArchetypeId}
          saveFormOpen={archetypeSaveOpen}
          onSaveFormOpenChange={setArchetypeSaveOpen}
          onApply={applyPictureArchetype}
          onSaveCustom={saveCurrentAsPreset}
          onDeleteCustom={removeCustomPreset}
        />

        <div className="flow-workspace">
          <ProofScenarioStatus
            scenario={activeProof}
            onDismiss={() => setActiveProofId(null)}
          />
          <form
            className="builder-form flow-form"
            aria-label="P.I.C.T.U.R.E. image prompt brief"
          >
            <PictureFlowPanels
              activePanel={nav.activePanel}
              registerPanelHeading={nav.registerPanelHeading}
              flowViewportRef={nav.flowViewportRef}
              layout={viewMode}
              dealing={dealing}
              onActivatePanel={nav.setActivePanel}
              boardSetup={
                <BoardArchetypeSocket
                  items={boardArchetypes}
                  activeId={activeArchetypeId}
                  onApply={applyArchetypeById}
                  onUnseat={unseatArchetype}
                  hint="Drag an archetype from the tray onto the board, or select one to apply it."
                />
              }
              draft={draft}
              cardSystem={cardSystem}
              stepComplete={flowStepComplete}
              attentionTargetId={nav.attentionTargetId}
              dictation={dictationApi}
              navigateToPictureStep={navigateToPictureStep}
              onUpdateDraft={updateDraft}
              onSetTailEnabled={setTailEnabled}
              onSelectAspectRatio={selectAspectRatio}
              onSetTailNumber={setTailNumber}
              onChangeTrack={changeTrack}
              onToggleCard={toggleWorkbenchCard}
              onDropCard={dropWorkbenchCard}
              onRemoveCard={removeWorkbenchCard}
              onClearCards={clearWorkbenchCards}
            />

            {speechMessage ? (
              <p
                className="speech-status flow-speech-status"
                role="status"
                aria-live="polite"
              >
                {speechMessage}
              </p>
            ) : null}
          </form>

          {portalTarget
            ? createPortal(
                <div className="print-sheet" aria-hidden="true">
                  <h1>P.I.C.T.U.R.E. image prompt</h1>
                  <pre>{prompt}</pre>
                </div>,
                portalTarget,
              )
            : null}

          <FlowNavDock
            onBack={
              nav.activePanel > PICTURE_PANEL_INDEX.guide
                ? () => nav.navigateToPanel(nav.activePanel - 1)
                : undefined
            }
            onNext={
              nav.activePanel === PICTURE_PANEL_INDEX.execution
                ? () => setOutputExpanded(true)
                : () => nav.navigateToPanel(nav.activePanel + 1)
            }
            nextLabel={
              nav.activePanel === PICTURE_PANEL_INDEX.guide
                ? "Start"
                : nav.activePanel === PICTURE_PANEL_INDEX.execution
                  ? "Review"
                  : "Next"
            }
          >
            {/* The view switch: the board or the flow. Same state either
                way; the prompt never changes. */}
            <div
              className="board-mode-switch"
              role="group"
              aria-label="Workspace view"
            >
              <button
                type="button"
                className={
                  viewMode === "board"
                    ? "art-pack-switch-option is-active"
                    : "art-pack-switch-option"
                }
                aria-pressed={viewMode === "board"}
                onClick={() => switchViewMode("board")}
              >
                Board
              </button>
              <button
                type="button"
                className={
                  viewMode === "flow"
                    ? "art-pack-switch-option is-active"
                    : "art-pack-switch-option"
                }
                aria-pressed={viewMode === "flow"}
                onClick={() => switchViewMode("flow")}
              >
                Flow
              </button>
            </div>
          </FlowNavDock>
        </div>

        <PromptOutputDock
          mergeOrder={PICTURE_MERGE_ORDER}
          cards={Object.values(cardSystem.equipped).flat().flatMap(id => {
            const card = pictureCardEngine.getLineage(id);
            if (!card) return [];
            const grade = pictureCardEngine.getCardGrade(card, cardSystem.tracks);
            return [{id, section: String(card.section), name:grade.name, text:grade.instruction}];
          })}
          onRevealCard={(panel, controlId) => {
            nav.navigateToPanel(panel, controlId);
            if (phoneWidthDock) setOutputExpanded(false);
          }}
          fork={<HandFork deck="picture" prompt={prompt} ready={persistence.ready} capture={captureHand} restore={(saved, recordHistory) => {
            const next = restorePictureSession(saved.session);
            if (recordHistory) history.checkpoint();
            cancelDictation(true);
            setDraft(next.draft);
            setCardSystem(next.cardSystem);
            setActiveArchetypeId(saved.archetype);
            setActivePromptName(saved.title);
            setActiveProofId(null);
            setCopyState("idle");
            setSpeechMessage("Switched comparison hands.");
          }} />}
          expanded={outputExpanded}
          complete={isComplete}
          missingItems={missingItems}
          prompt={prompt}
          sections={promptSections}
          copyState={copyState}
          onToggle={() => setOutputExpanded(!outputExpanded)}
          onMissingSelect={focusMissingField}
          onCopy={copyPrompt}
          skillDeck="picture"
          skillHand={activePromptName ?? activeArchetype?.name ?? "hand"}
          skillChoices={buildPictureHandSections(equippedFragments, tail)}
          onDownload={downloadPrompt}
          onPrint={printPrompt}
        />
      </div>
    </div>
    </HandWorkspace.Provider>
  );
}
