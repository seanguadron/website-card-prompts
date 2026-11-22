"use client";

import { CardFaceThemeProvider } from "./card-face-theme";
import { DeckThemePicker } from "./deck-theme-picker";
import { useDeckTheme } from "@/hooks/use-deck-theme";
import { deckThemeAttributes } from "@/lib/deck-theme";
import { HandFork } from "./hand-fork";
import { HandWorkspace, useHandWorkspace } from "./hand-workspace";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ChangeEvent } from "react";
import { BoardArchetypeSocket } from "@/components/board-archetype-socket";
import { FlowNavDock } from "@/components/flow-nav-dock";
import { FlowStepStrip } from "@/components/flow-step-strip";
import { SoundArchetypeDetails } from "@/components/sound-archetype-toolbar";
import { soundFaceArt } from "@/lib/sound-card-art";
import { SoundDeckHeader } from "@/components/sound-deck-header";
import { SoundFlowPanels } from "@/components/sound-flow-panels";
import type { SoundDictationField } from "@/components/sound-flow-panels";
import type { DictationApi } from "@/components/prompt-builder-ui";
import { PromptLibraryPanel } from "@/components/prompt-library-panel";
import { PromptOutputDock } from "@/components/prompt-output-dock";
import {
  PromptProofLab,
  ProofScenarioStatus,
} from "@/components/prompt-proof-lab";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSoundDeckHistory } from "@/hooks/use-sound-deck-history";
import { useSoundDeckPersistence } from "@/hooks/use-sound-deck-persistence";
import { usePortalTarget } from "@/hooks/use-portal-target";
import { usePromptDictation } from "@/hooks/use-prompt-dictation";
import { useFlowNavigation } from "@/hooks/use-flow-navigation";
import { readBoardMode, writeBoardMode, type BoardMode } from "@/lib/board-prefs";
import { downloadTextFile, slugifyFilename } from "@/lib/browser-download";
import { SOUND_ARCHETYPES } from "@/lib/sound-archetypes";
import {
  getEquippedTerms,
  soundCardEngine,
  SOUND_TRACK_IDS,
} from "@/lib/sound-card-system";
import {
  SOUND_PROOF_BASE_DRAFT,
  SOUND_PROOF_SCENARIOS,
} from "@/lib/sound-proof-scenarios";
import type { SoundProofScenario } from "@/lib/sound-proof-scenarios";
import {
  buildCustomSoundArchetype,
  deleteCustomSoundArchetype,
  isCustomSoundArchetype,
  listCustomSoundArchetypes,
  saveCustomSoundArchetype,
} from "@/lib/sound-custom-archetypes";
import {
  deleteFromSoundLibrary,
  listSavedSoundPrompts,
  saveToSoundLibrary,
} from "@/lib/sound-library";
import type { SavedSoundPrompt } from "@/lib/sound-library";
import {
  decodeSoundSessionParam,
  encodeSoundSessionParam,
  restoreSoundSession,
  serializeSoundSession,
} from "@/lib/sound-session";
import {
  createSoundCardSystem,
  EMPTY_SOUND_DRAFT,
  EXAMPLE_SOUND_DRAFT,
  isSoundFieldComplete,
  makeSoundLayer,
  restoreSoundCardSystem,
  restoreSoundDraft,
  SOUND_PARTS,
  SOUND_REQUIRED_FIELDS,
  withoutSoundLayer,
  withSoundDraftText,
  withSoundLayer,
} from "@/lib/sound-deck-state";
import {
  getNextIncompleteSoundPanel,
  getSoundStepIndexForPanel,
  getSoundStepPanel,
  SOUND_PANEL_COUNT,
  SOUND_PANEL_INDEX,
} from "@/lib/sound-navigation";
import {
  SOUND_MERGE_ORDER, AMBIENCE_MERGE_ORDER,
  buildSoundPrompt,
  buildSoundSections,
  buildSoundSkillChoices,
  SOUND_SECTIONS,
} from "@/lib/sound-prompt";
import type { SoundSection } from "@/lib/sound-prompt";
import type {
  SoundArchetype,
  SoundCardSystemState,
  SoundDraft,
  SoundDraftTextField,
  SoundTrackId,
} from "@/lib/sound-types";
import { OVERLAY_RAIL_MEDIA_QUERY } from "@/lib/tool-registry";

export function SoundDeck() {
  const { theme, selectTheme } = useDeckTheme();
  const hand = useHandWorkspace("sonic", id => Boolean(soundCardEngine.getLineage(id)));
  const [draft, setDraft] = useState<SoundDraft>(EMPTY_SOUND_DRAFT);
  const [cardSystem, setCardSystem] = useState<SoundCardSystemState>(
    createSoundCardSystem,
  );
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const [activeArchetypeId, setActiveArchetypeId] = useState<string | null>(
    null,
  );
  const [customArchetypes, setCustomArchetypes] = useState<SoundArchetype[]>(
    [],
  );
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState<SavedSoundPrompt[]>([]);
  const [proofLabOpen, setProofLabOpen] = useState(false);
  const [socketTarget, setSocketTarget] = useState<HTMLDivElement | null>(null);
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
  const overlayRails = useMediaQuery(OVERLAY_RAIL_MEDIA_QUERY);
  const [outputExpandedChoice, setOutputExpanded] = useState<boolean | null>(
    null,
  );

  // Deferred restore of the view choice, like the CRAFT deck's art pack.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setViewMode(readBoardMode("sound-deck", "board"));
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
  const outputExpanded = outputExpandedChoice ?? !overlayRails;
  // The portal below renders on FIRST render, so the target must be resolved
  // after hydration (see use-portal-target).
  const portalTarget = usePortalTarget();
  const persistence = useSoundDeckPersistence({
    draft,
    cardSystem,
    setDraft,
    setCardSystem,
  });
  const history = useSoundDeckHistory({
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
  } = usePromptDictation<SoundDictationField>({
    draft,
    onApply: (field, value) => {
      history.checkpoint();
      setDraft((current) => withSoundDraftText(current, field, value));
      setCopyState("idle");
    },
  });

  const equippedTerms = useMemo(
    () => getEquippedTerms(cardSystem.equipped, cardSystem.tracks),
    [cardSystem.equipped, cardSystem.tracks],
  );
  const captureHand = useCallback(() => ({
    session: serializeSoundSession(draft, cardSystem),
    title: activePromptName,
    archetype: activeArchetypeId,
  }), [draft, cardSystem, activePromptName, activeArchetypeId]);

  const prompt = useMemo(
    () => buildSoundPrompt(draft.subject, equippedTerms, draft.ambience),
    [draft.subject, equippedTerms, draft.ambience],
  );
  const promptSections = useMemo(
    () => buildSoundSections(draft.subject, equippedTerms, draft.ambience),
    [draft.subject, equippedTerms, draft.ambience],
  );

  const missingFields = SOUND_REQUIRED_FIELDS.filter(
    ({ field }) => !isSoundFieldComplete(draft, field),
  );
  const missingItems = missingFields.map(({ field, label }) => ({
    field,
    label,
  }));
  const isComplete = missingFields.length === 0;
  // A step is "complete" when its panel contributes to the prompt: the sound
  // line (S), an equipped card for the middle panels, a card or a parked
  // rack layer for Context.
  const flowStepComplete = SOUND_SECTIONS.map((section) => {
    if (section === "source") {
      return (
        isSoundFieldComplete(draft, "subject") ||
        cardSystem.equipped.source.some(Boolean)
      );
    }
    if (section === "context") {
      return (
        cardSystem.equipped.context.some(Boolean) || draft.layers.length > 0
      );
    }

    return cardSystem.equipped[section].some(Boolean);
  });
  const completedStepCount = flowStepComplete.filter(Boolean).length;
  const nav = useFlowNavigation({ panelCount: SOUND_PANEL_COUNT });
  const nextIncompletePanel = getNextIncompleteSoundPanel(
    nav.activePanel,
    flowStepComplete,
  );
  const nextIncompleteStepIndex =
    nextIncompletePanel === null
      ? -1
      : getSoundStepIndexForPanel(nextIncompletePanel);
  const nextIncompletePart =
    nextIncompleteStepIndex < 0 ? null : SOUND_PARTS[nextIncompleteStepIndex];
  const activeStepIndex = getSoundStepIndexForPanel(nav.activePanel);
  const activeArchetype = useMemo(
    () =>
      activeArchetypeId
        ? ([...SOUND_ARCHETYPES, ...customArchetypes].find(
            (archetype) => archetype.id === activeArchetypeId,
          ) ?? null)
        : null,
    [activeArchetypeId, customArchetypes],
  );
  const activeProof = SOUND_PROOF_SCENARIOS.find(
    (scenario) => scenario.id === activeProofId,
  );
  // Best available name for exports: archetype, then the library name the
  // draft came from, then the sound line.
  const exportBase = slugifyFilename(
    activeArchetype?.name ?? activePromptName ?? draft.subject,
    "sound",
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
      setCustomArchetypes(listCustomSoundArchetypes());
      setSavedPrompts(listSavedSoundPrompts());
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
          decodeSoundSessionParam(shared);
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

  function navigateToSoundStep(stepIndex: number) {
    nav.navigateToPanel(getSoundStepPanel(stepIndex));
  }

  function focusMissingField(field: string) {
    if (field !== "subject") {
      return;
    }

    setOutputExpanded(false);
    nav.navigateToPanel(SOUND_PANEL_INDEX.source, "sound-subject");
  }

  function updateDraft(field: SoundDraftTextField, value: string) {
    history.checkpoint();
    setCopyState("idle");
    setDraft((current) => withSoundDraftText(current, field, value));
  }

  function setAmbience(value: boolean) {
    history.checkpoint();
    setActiveArchetypeId(null);
    setCopyState("idle");
    setDraft((current) => ({ ...current, ambience: value }));
  }

  function addLayerFromPrompt() {
    history.checkpoint();
    setCopyState("idle");
    setDraft((current) => withSoundLayer(current, makeSoundLayer(prompt)));
    setSpeechMessage("Prompt parked on the layer rack.");
  }

  function removeLayer(id: string) {
    history.checkpoint();
    setDraft((current) => withoutSoundLayer(current, id));
  }

  function clearLayers() {
    history.checkpoint();
    setDraft((current) => ({ ...current, layers: [] }));
    setSpeechMessage("Layer rack cleared.");
  }

  function changeTrack(
    _section: SoundSection,
    trackId: SoundTrackId,
    value: number,
  ) {
    history.checkpoint();
    setActiveArchetypeId(null);
    setCardSystem((current) =>
      soundCardEngine.setTrackValue(current, trackId, value),
    );
    setCopyState("idle");
  }

  function toggleWorkbenchCard(section: SoundSection, lineageId: string) {
    history.checkpoint();
    setActiveArchetypeId(null);
    setCardSystem((current) =>
      soundCardEngine.toggleEquippedCard(current, section, lineageId),
    );
    setCopyState("idle");
  }

  function dropWorkbenchCard(
    section: SoundSection,
    slotIndex: number,
    lineageId: string,
  ) {
    history.checkpoint();
    setActiveArchetypeId(null);
    setCardSystem((current) =>
      soundCardEngine.placeEquippedCard(current, section, slotIndex, lineageId),
    );
    setCopyState("idle");
  }

  function removeWorkbenchCard(section: SoundSection, slotIndex: number) {
    history.checkpoint();
    setActiveArchetypeId(null);
    setCardSystem((current) =>
      soundCardEngine.removeEquippedCard(current, section, slotIndex),
    );
    setCopyState("idle");
  }

  function clearWorkbenchCards(section: SoundSection) {
    history.checkpoint();
    setActiveArchetypeId(null);
    setCardSystem((current) =>
      soundCardEngine.clearEquippedCards(current, section),
    );
    setCopyState("idle");
  }

  function applySoundArchetype(archetype: SoundArchetype) {
    history.checkpoint();
    cancelDictation(true);
    // Sanitized so custom archetypes saved against an older catalog still
    // apply. An ambience preset switches the mode on; others leave the
    // user's choice alone (mirroring how PICTURE's tail presets only ever
    // add, never silently remove).
    setCardSystem(
      soundCardEngine.sanitizeCardSystemShape({
        tracks: { ...archetype.tracks },
        equipped: soundCardEngine.archetypeSlots(archetype.equipped, cardSystem.equipped, hand.locked),
        memory: soundCardEngine.createEmptySnapMemory(),
        overrides: [],
        suggested: soundCardEngine.createEmptySuggestedCards(),
      }),
    );
    if (archetype.ambience !== undefined) {
      const ambience = archetype.ambience;
      setDraft((current) => ({ ...current, ambience }));
    }
    setActiveArchetypeId(archetype.id);
    setActivePromptName(null);
    setActiveProofId(null);
    setProofLabOpen(false);
    setCopyState("idle");
    setSpeechMessage(
      `${archetype.name} archetype applied. Your sound line stayed in place.`,
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
    writeBoardMode("sound-deck", mode);
  }

  // The archetype hand on the Setup board: custom presets first, then the catalog.
  const boardArchetypes = [...customArchetypes, ...SOUND_ARCHETYPES].map(
    (archetype) => ({
      id: archetype.id,
      code: archetype.code,
      name: archetype.name,
      description: archetype.description,
      art: soundFaceArt(archetype.id),
      equipped: soundCardEngine.archetypeSlots(archetype.equipped, cardSystem.equipped, hand.locked),
      details: <SoundArchetypeDetails archetype={archetype} />,
      custom: isCustomSoundArchetype(archetype),
    }),
  );

  function applyArchetypeById(id: string) {
    const archetype = [...SOUND_ARCHETYPES, ...customArchetypes].find(
      (candidate) => candidate.id === id,
    );
    if (archetype) {
      applySoundArchetype(archetype);
      nav.setActivePanel(SOUND_PANEL_INDEX.guide);
    }
  }

  function unseatArchetype() {
    setActiveArchetypeId(null);
    setSpeechMessage("Archetype unseated. Your cards stay where they are.");
  }

  function saveCurrentAsPreset(name: string) {
    const archetype = buildCustomSoundArchetype(name, draft, cardSystem);
    const saved = saveCustomSoundArchetype(archetype);
    if (!saved) return false;
    setCustomArchetypes(saved);
    setActiveArchetypeId(archetype.id);
    setSpeechMessage(`Saved "${archetype.name}" as a preset.`);
    return true;
  }

  function removeCustomPreset(id: string) {
    const remaining = deleteCustomSoundArchetype(id);
    if (!remaining) return false;
    setCustomArchetypes(remaining);
    setActiveArchetypeId((current) => (current === id ? null : current));
    return true;
  }

  function downloadSession() {
    downloadTextFile(
      `${exportBase}-session.json`,
      serializeSoundSession(draft, cardSystem),
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
        restoreSoundSession(await file.text());
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
      setSpeechMessage("That file is not a valid S.O.N.I.C. session.");
    } finally {
      event.target.value = "";
    }
  }

  async function copyShareLink() {
    try {
      const param = encodeSoundSessionParam(draft, cardSystem);
      const url = `${window.location.origin}${window.location.pathname}?p=${param}`;
      await navigator.clipboard.writeText(url);
      setSpeechMessage("Share link copied to clipboard.");
    } catch {
      setSpeechMessage("Could not copy the share link.");
    }
  }

  function saveCurrentToLibrary(name: string) {
    const entries = saveToSoundLibrary(name, draft, cardSystem);
    if (!entries) return false;
    setSavedPrompts(entries);
    // Mirror saveToSoundLibrary's fallback so exports pick up the name.
    setActivePromptName(name.trim() || "Untitled prompt");
    setSpeechMessage("Saved to your prompt library.");
    return true;
  }

  function loadSavedPrompt(entry: SavedSoundPrompt) {
    // Restore through the same validators as autosave, URL shares, and
    // session imports: the library store is shape-filtered on read, but the
    // field types inside draft/cardSystem are still unchecked JSON — a
    // hand-edited entry must degrade to defaults, not crash. The try/catch
    // is defense in depth for the same reason.
    try {
      const nextDraft = restoreSoundDraft(JSON.stringify(entry.draft ?? {}));
      const nextCardSystem = restoreSoundCardSystem(
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
    const entries = deleteFromSoundLibrary(id);
    if (!entries) return false;
    setSavedPrompts(entries);
    return true;
  }

  function loadProofScenario(scenario: SoundProofScenario) {
    history.checkpoint();
    cancelDictation(true);
    setDraft({
      ...EMPTY_SOUND_DRAFT,
      ...SOUND_PROOF_BASE_DRAFT,
      ...scenario.draft,
    });
    setCardSystem({
      tracks: {
        ...soundCardEngine.defaultTrackValues,
        ...scenario.tracks,
      },
      equipped: soundCardEngine.createEquippedSlots(scenario.equipped),
      memory: soundCardEngine.createEmptySnapMemory(),
      overrides: SOUND_TRACK_IDS.filter(
        (trackId) => scenario.tracks?.[trackId] !== undefined,
      ),
      suggested: soundCardEngine.createEmptySuggestedCards(),
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
    setDraft(EMPTY_SOUND_DRAFT);
    setCardSystem(createSoundCardSystem());
    setActiveArchetypeId(null);
    setActivePromptName(null);
    setActiveProofId(null);
    nav.setActivePanel(SOUND_PANEL_INDEX.guide);
    setCopyState("idle");
    setSpeechMessage("");
  }

  function loadExample() {
    history.checkpoint();
    cancelDictation(true);
    setDraft(EXAMPLE_SOUND_DRAFT);
    setCardSystem({
      ...createSoundCardSystem(),
      equipped: soundCardEngine.createEquippedSlots({
        nature: ["wooden"],
        onset: ["slow-swell"],
        intensity: ["deep"],
        context: ["horror"],
      }),
    });
    setActiveArchetypeId(null);
    setActivePromptName(null);
    setActiveProofId(null);
    setCopyState("idle");
    setSpeechMessage("Example loaded: a castle door, four cards, one sound.");
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

    // The rack rides along in text downloads: each line is its own
    // one-sound prompt, ready to generate separately in Firefly.
    const rack =
      draft.layers.length > 0
        ? `\n\nLayers:\n${draft.layers
            .map((layer, index) => `${index + 1}. ${layer.prompt}`)
            .join("\n")}`
        : "";
    downloadTextFile(
      `${promptFileBase}.${format}`,
      `${prompt}${rack}\n`,
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

  const dictationApi: DictationApi<SoundDictationField> = {
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
    <CardFaceThemeProvider deck="sonic" theme={theme}>
    <HandWorkspace.Provider value={hand}>
    <div {...deckThemeAttributes("sonic", theme)} className="tool-page prompt-flow-page is-sound-flow">
      <SoundDeckHeader
        stepStrip={
          <FlowStepStrip
            parts={SOUND_PARTS}
            activeIndex={activeStepIndex}
            completion={flowStepComplete}
            guideActive={nav.activePanel === SOUND_PANEL_INDEX.guide}
            onGuide={() => nav.navigateToPanel(SOUND_PANEL_INDEX.guide)}
            onSelect={navigateToSoundStep}
            ariaLabel="S.O.N.I.C. builder steps"
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
        scenarios={SOUND_PROOF_SCENARIOS}
        id="sound-proof-lab"
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
          "builder-main-layout has-deck-rails",
          outputExpanded ? "" : "is-output-collapsed",
          viewMode === "board" ? "is-board-mode" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <BoardArchetypeSocket
          tool="sound-deck"
          items={boardArchetypes}
          activeId={activeArchetypeId}
          onApply={applyArchetypeById}
          onUnseat={unseatArchetype}
          socketTarget={socketTarget}
          saveFormOpen={archetypeSaveOpen}
          onSaveFormOpenChange={setArchetypeSaveOpen}
          onSaveCustom={saveCurrentAsPreset}
          onDeleteCustom={removeCustomPreset}
          hint="Drop an archetype here, or select one in the rail."
        />

        <div className="flow-workspace">
          <ProofScenarioStatus
            scenario={activeProof}
            onDismiss={() => setActiveProofId(null)}
          />
          <form
            className="builder-form flow-form"
            aria-label="S.O.N.I.C. sound prompt brief"
          >
            <SoundFlowPanels
              activePanel={nav.activePanel}
              registerPanelHeading={nav.registerPanelHeading}
              flowViewportRef={nav.flowViewportRef}
              layout={viewMode}
              dealing={dealing}
              onActivatePanel={nav.setActivePanel}
              boardSetup={<div ref={setSocketTarget} />}
              draft={draft}
              cardSystem={cardSystem}
              stepComplete={flowStepComplete}
              attentionTargetId={nav.attentionTargetId}
              dictation={dictationApi}
              promptReady={isComplete}
              navigateToSoundStep={navigateToSoundStep}
              onUpdateDraft={updateDraft}
              onSetAmbience={setAmbience}
              onAddLayer={addLayerFromPrompt}
              onRemoveLayer={removeLayer}
              onClearLayers={clearLayers}
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
                  <h1>S.O.N.I.C. sound prompt</h1>
                  <pre>{prompt}</pre>
                </div>,
                portalTarget,
              )
            : null}

          <FlowNavDock
            onBack={
              nav.activePanel > SOUND_PANEL_INDEX.guide
                ? () => nav.navigateToPanel(nav.activePanel - 1)
                : undefined
            }
            onNext={
              nav.activePanel === SOUND_PANEL_INDEX.context
                ? () => setOutputExpanded(true)
                : () => nav.navigateToPanel(nav.activePanel + 1)
            }
            nextLabel={
              nav.activePanel === SOUND_PANEL_INDEX.guide
                ? "Start"
                : nav.activePanel === SOUND_PANEL_INDEX.context
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
            <DeckThemePicker theme={theme} onSelect={selectTheme} />
          </FlowNavDock>
        </div>

        <PromptOutputDock
          mergeOrder={draft.ambience ? AMBIENCE_MERGE_ORDER : SOUND_MERGE_ORDER}
          cards={Object.values(cardSystem.equipped).flat().flatMap(id => {
            const card = soundCardEngine.getLineage(id);
            if (!card) return [];
            const grade = soundCardEngine.getCardGrade(card, cardSystem.tracks);
            return [{id, section: String(card.section), name:grade.name, text:grade.instruction}];
          })}
          onRevealCard={(panel, controlId) => {
            nav.navigateToPanel(panel, controlId);
            if (overlayRails) setOutputExpanded(false);
          }}
          fork={<HandFork deck="sound" prompt={prompt} ready={persistence.ready} capture={captureHand} restore={(saved, recordHistory) => {
            const next = restoreSoundSession(saved.session);
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
          skillDeck="sonic"
          skillHand={activePromptName ?? activeArchetype?.name ?? "hand"}
          skillChoices={buildSoundSkillChoices(equippedTerms, draft.ambience)}
          onDownload={downloadPrompt}
          onPrint={printPrompt}
        />
      </div>
    </div>
    </HandWorkspace.Provider>
    </CardFaceThemeProvider>
  );
}
