"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  OUTCOME_MAX_CARDS,
  composeOutcomePrompt,
  outcomeComboKey,
  outcomeMetaPath,
  outcomeShard,
  outcomeShardPath,
  type OutcomeCard,
  type OutcomeEntry,
  type OutcomeMeta,
  type OutcomeShardFile,
} from "@/lib/outcome-lab";
import { OUTCOME_SCENARIOS } from "@/lib/outcome-scenarios";
import {
  DEFAULT_TRACK_VALUES,
  craftCardEngine,
} from "@/lib/prompt-card-system";

// A fetch either produced data or proved there is none; both are worth
// remembering so browsing combos never re-asks. "missing" is a real answer:
// for a meta it means the scenario was never generated, for a shard it means
// no combination hashing there has been cached yet.
type Fetched<T> = T | "missing";

/**
 * The Outcome Lab: the model's actual answer for the current card selection.
 *
 * The deck's other output view shows the prompt; this one shows what Claude
 * said back - precached by scripts/outcome-batch.mjs, which asked every
 * combination of up to three cards as a clean standalone query against a
 * fixed context + target. So this component is a reader: it names the
 * current combination, fetches the shard that would hold it, and renders
 * the answer or an honest miss. It never calls a model.
 */
export function PromptOutcomeLab({
  equippedIds,
  tracksAtDefaults,
}: {
  /** Every equipped tactic card, all sections, equip order irrelevant. */
  equippedIds: string[];
  /** The cache was generated at default sliders; when the deck's differ we
   *  say so rather than let the prompt view and this view silently diverge. */
  tracksAtDefaults: boolean;
}) {
  const [scenarioId, setScenarioId] = useState(OUTCOME_SCENARIOS[0].id);
  // Fetched data is render state, not a ref: the render below branches on it
  // (React Compiler forbids reading refs during render, and rightly - a ref
  // write would not re-render). The maps only grow, one small entry per
  // scenario or shard looked at, so copying on insert costs nothing.
  const [metas, setMetas] = useState<ReadonlyMap<string, Fetched<OutcomeMeta>>>(
    () => new Map(),
  );
  const [shards, setShards] = useState<
    ReadonlyMap<string, Fetched<OutcomeShardFile>>
  >(() => new Map());
  const inFlight = useRef(new Set<string>());

  const overBudget = equippedIds.length > OUTCOME_MAX_CARDS;
  const comboKey = overBudget ? null : outcomeComboKey(equippedIds);
  const shardKey =
    comboKey === null
      ? null
      : `${scenarioId}:${outcomeShard(comboKey)}`;

  useEffect(() => {
    // 404 means "never generated", which is an answer, not an error - the
    // lab renders it as such. A network failure stays unknown and is retried
    // the next time this combination is looked at.
    const remember = <T,>(
      setter: (
        update: (prev: ReadonlyMap<string, Fetched<T>>) => ReadonlyMap<string, Fetched<T>>,
      ) => void,
      key: string,
      value: Fetched<T>,
    ) => {
      setter((prev) => new Map(prev).set(key, value));
    };

    if (!metas.has(scenarioId) && !inFlight.current.has(`m:${scenarioId}`)) {
      inFlight.current.add(`m:${scenarioId}`);
      fetch(outcomeMetaPath(scenarioId), { cache: "no-store" })
        .then(async (response) => {
          if (response.status === 404) {
            remember(setMetas, scenarioId, "missing");
          } else if (response.ok) {
            remember(setMetas, scenarioId, (await response.json()) as OutcomeMeta);
          }
        })
        .catch(() => {})
        .finally(() => inFlight.current.delete(`m:${scenarioId}`));
    }
    if (shardKey && !shards.has(shardKey) && !inFlight.current.has(shardKey)) {
      inFlight.current.add(shardKey);
      const [scenario, shard] = shardKey.split(":");
      fetch(outcomeShardPath(scenario, Number(shard)), { cache: "no-store" })
        .then(async (response) => {
          if (response.status === 404) {
            remember(setShards, shardKey, "missing");
          } else if (response.ok) {
            remember(
              setShards,
              shardKey,
              (await response.json()) as OutcomeShardFile,
            );
          }
        })
        .catch(() => {})
        .finally(() => inFlight.current.delete(shardKey));
    }
  }, [scenarioId, shardKey, metas, shards]);

  const scenario = OUTCOME_SCENARIOS.find((s) => s.id === scenarioId)!;
  const meta = metas.get(scenarioId);
  const shardFile = shardKey ? shards.get(shardKey) : undefined;
  const entry: OutcomeEntry | undefined =
    comboKey && shardFile && shardFile !== "missing"
      ? shardFile.entries[comboKey]
      : undefined;

  // The exact question the cached answer replies to, rebuilt with the same
  // composer the batch script used - shown so a surprising answer can be
  // traced to its prompt instead of taken on faith.
  const sentPrompt = useMemo(() => {
    if (overBudget) return null;
    const cards: OutcomeCard[] = [];
    for (const id of equippedIds) {
      const lineage = craftCardEngine.getLineage(id);
      if (!lineage) continue;
      cards.push({
        id,
        section: lineage.section,
        instruction: craftCardEngine.getCardGrade(lineage, DEFAULT_TRACK_VALUES)
          .instruction,
      });
    }
    return composeOutcomePrompt(scenario, cards);
  }, [equippedIds, overBudget, scenario]);

  let body;
  if (meta === "missing") {
    body = (
      <p className="outcome-note">
        {scenario.name} has no cached answers yet. Generate them with{" "}
        <code>npm run outcomes:batch -- {scenario.id}</code>.
      </p>
    );
  } else if (overBudget) {
    body = (
      <p className="outcome-note">
        Answers are cached for up to {OUTCOME_MAX_CARDS} cards;{" "}
        {equippedIds.length} are equipped. Unequip down to{" "}
        {OUTCOME_MAX_CARDS} to compare outcomes.
      </p>
    );
  } else if (meta === undefined || shardFile === undefined) {
    body = (
      <p className="outcome-note" role="status">
        Looking up this combination&hellip;
      </p>
    );
  } else if (!entry) {
    body = (
      <p className="outcome-note">
        This combination is not in the cache. Re-run{" "}
        <code>npm run outcomes:batch -- {scenario.id}</code> to fill the gaps.
      </p>
    );
  } else {
    body = (
      <>
        <div className="outcome-answer">{entry.text}</div>
        <p className="outcome-meta">
          {meta.model} &middot; {entry.outputTokens} tokens
          {entry.stopReason !== "end_turn"
            ? ` · stopped: ${entry.stopReason}`
            : ""}
          {equippedIds.length === 0 ? " · baseline (no cards)" : ""}
        </p>
        {sentPrompt ? (
          <details className="outcome-prompt">
            <summary>The exact question asked</summary>
            <pre>
              <code>{sentPrompt}</code>
            </pre>
          </details>
        ) : null}
      </>
    );
  }

  return (
    <div className="outcome-lab">
      <div
        className="outcome-scenario-switch"
        role="group"
        aria-label="Outcome scenario"
      >
        {OUTCOME_SCENARIOS.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            className={
              candidate.id === scenarioId
                ? "outcome-scenario-option is-active"
                : "outcome-scenario-option"
            }
            aria-pressed={candidate.id === scenarioId}
            onClick={() => setScenarioId(candidate.id)}
          >
            {candidate.name}
          </button>
        ))}
      </div>
      <p className="outcome-context">{scenario.context}</p>
      {body}
      {!tracksAtDefaults ? (
        <p className="outcome-note outcome-note-quiet">
          Answers were cached with every slider at its default; the current
          slider positions do not change them.
        </p>
      ) : null}
    </div>
  );
}
