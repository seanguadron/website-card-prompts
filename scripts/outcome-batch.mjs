#!/usr/bin/env node
/**
 * Ask Claude every question the Outcome Lab wants answered, and land the
 * answers as static shards the deck can look up.
 *
 * One scenario at a time. For the scenario's fixed context + target, every
 * combination of up to three tactic cards (sliders at their defaults) becomes
 * ONE clean API query: a single user message holding nothing but the composed
 * prompt - no system prompt, no tools, no project context. That isolation is
 * the point: each answer reflects the prompt and only the prompt, so flipping
 * a card in the deck shows the card's real effect on the model.
 *
 * Sent through the Message Batches API (half price, runs server-side, usually
 * done within the hour). The flow is idempotent by construction: --submit
 * only submits combinations not already landed in public/proof-outcomes/, so
 * a partial landing, an errored request, or a second scenario later all heal
 * or extend by running the same commands again.
 *
 *   npm run outcomes:batch -- origin-universe            what would happen
 *   npm run outcomes:batch -- origin-universe --submit   submit missing combos
 *   npm run outcomes:batch -- origin-universe --wait     poll + land when done
 *   npm run outcomes:batch -- origin-universe --land     land a finished batch
 *
 * Needs ANTHROPIC_API_KEY in the environment or in .env.local (gitignored).
 * The key is read, never printed.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { projectRoot } from "./prompt-data-files.mjs";
import {
  OUTCOME_MAX_CARDS,
  OUTCOME_SCHEMA_VERSION,
  OUTCOME_SHARD_COUNT,
  composeOutcomePrompt,
  enumerateOutcomeCombos,
  outcomeComboKey,
  outcomeShard,
} from "../src/lib/outcome-lab.ts";

// The generation settings. Fixed on purpose: every cached answer in a
// scenario must be comparable to its neighbours, so these change only by
// regenerating a whole scenario. Effort medium keeps the reasoning spend
// proportionate to a general-audience explainer; sampling params are not
// sent (removed on this model family).
const MODEL = "claude-opus-5";
// Sized from the first run's wreckage: at effort medium, adaptive thinking
// spent ~1,000 tokens per question and starved a 1,200 cap - 58% of answers
// came back EMPTY. Effort low keeps thinking on but small (the documented
// fix; disabling it has its own failure modes), and 2,500 gives the longest
// natural answers (~600 text tokens typical, ~1,000+ for unconstrained ones)
// room to finish under whatever thinking remains.
const MAX_TOKENS = 2500;
const EFFORT = "low";
// Batch-discounted list prices per MTok, for the report only.
const PRICE_IN = 2.5;
const PRICE_OUT = 12.5;

const dataDir = path.join(projectRoot, "src", "data", "prompt-builder");
const outDirFor = (scenarioId) =>
  path.join(projectRoot, "public", "proof-outcomes", scenarioId);
const STATE_PATH = path.join(
  projectRoot,
  ".ai",
  "notes",
  "outcome-batch-state.json",
);

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function readJsonIfPresent(file) {
  try {
    return await readJson(file);
  } catch {
    return null;
  }
}

/** The scenario definitions - all three live in data; each runs when asked. */
async function loadScenario(scenarioId) {
  const catalog = await readJson(path.join(dataDir, "outcome-scenarios.json"));
  const scenario = catalog.scenarios.find((s) => s.id === scenarioId);
  if (!scenario) {
    const known = catalog.scenarios.map((s) => s.id).join(", ");
    throw new Error(`Unknown scenario "${scenarioId}". Known: ${known}`);
  }
  return scenario;
}

/** Every tactic card reduced to its default-grade instruction - the text the
 *  deck itself would contribute with the sliders untouched. */
async function loadCards() {
  const cards = await readJson(path.join(dataDir, "cards.json"));
  const tracks = await readJson(path.join(dataDir, "tracks.json"));
  const defaults = tracks.defaultValues;
  return cards.cards.map((card) => {
    const gradeIndex = Math.min(
      defaults[card.driver] ?? 0,
      card.grades.length - 1,
    );
    return {
      id: card.id,
      section: card.section,
      instruction: card.grades[gradeIndex].instruction,
    };
  });
}

/** What is already landed, as one map over every shard file. */
async function readLanded(scenarioId) {
  const entries = new Map();
  for (let shard = 0; shard < OUTCOME_SHARD_COUNT; shard++) {
    const file = path.join(
      outDirFor(scenarioId),
      `shard-${String(shard).padStart(2, "0")}.json`,
    );
    const parsed = await readJsonIfPresent(file);
    if (parsed?.entries) {
      for (const [key, entry] of Object.entries(parsed.entries)) {
        entries.set(key, entry);
      }
    }
  }
  return entries;
}

/** The full worklist, minus what is landed: the pending check. */
async function planScenario(scenarioId) {
  const scenario = await loadScenario(scenarioId);
  const cards = await loadCards();
  const byId = new Map(cards.map((card) => [card.id, card]));
  const combos = enumerateOutcomeCombos(cards.map((card) => card.id));
  const landed = await readLanded(scenarioId);
  const pending = combos
    .map((ids) => ({
      key: outcomeComboKey(ids),
      prompt: composeOutcomePrompt(
        scenario,
        ids.map((id) => byId.get(id)),
      ),
    }))
    .filter((item) => !landed.has(item.key));
  return { scenario, combos, landed, pending };
}

async function readApiKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  // .env.local is gitignored; a key kept there never enters the repo.
  const envFile = await readFile(
    path.join(projectRoot, ".env.local"),
    "utf8",
  ).catch(() => "");
  const match = envFile.match(/^ANTHROPIC_API_KEY=("?)(.+)\1\s*$/m);
  if (match) return match[2].trim();
  throw new Error(
    "No ANTHROPIC_API_KEY. Set the environment variable, or put ANTHROPIC_API_KEY=... in .env.local (gitignored).",
  );
}

async function makeClient() {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  return new Anthropic({ apiKey: await readApiKey() });
}

function requestFor(index, prompt) {
  return {
    // The custom_id charset cannot carry combo keys ("+"), so requests are
    // numbered and the state file records which key each number means.
    custom_id: `i${String(index).padStart(5, "0")}`,
    params: {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      output_config: { effort: EFFORT },
      messages: [{ role: "user", content: prompt }],
    },
  };
}

async function readState() {
  return (await readJsonIfPresent(STATE_PATH)) ?? {};
}

async function writeState(state) {
  await mkdir(path.dirname(STATE_PATH), { recursive: true });
  await writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function report(lines) {
  console.log(lines.filter(Boolean).join("\n"));
}

async function showPlan(scenarioId) {
  const { scenario, combos, landed, pending } = await planScenario(scenarioId);
  const chars = pending.reduce((sum, item) => sum + item.prompt.length, 0);
  const estIn = Math.round(chars / 4);
  const estOut = pending.length * 650;
  const estCost = (estIn / 1e6) * PRICE_IN + (estOut / 1e6) * PRICE_OUT;
  report([
    `${scenario.name} (${scenario.id})`,
    `combinations: ${combos.length} total, ${landed.size} landed, ${pending.length} pending`,
    pending.length
      ? `estimate for the pending set: ~${estIn.toLocaleString()} input + ~${estOut.toLocaleString()} output tokens = ~$${estCost.toFixed(2)} (batch rates, ${MODEL}, effort ${EFFORT}, max ${MAX_TOKENS})`
      : "nothing to do - the scenario is fully cached",
    pending.length
      ? `\nfirst pending prompt:\n---\n${pending[0].prompt}\n---`
      : "",
    pending.length ? "run with --submit to send the pending set." : "",
  ]);
}

async function submit(scenarioId, limit) {
  const state = await readState();
  if (state[scenarioId]?.batchId) {
    throw new Error(
      `A batch for ${scenarioId} is already tracked (${state[scenarioId].batchId}). Run --wait or --land first.`,
    );
  }
  const { scenario, pending: allPending } = await planScenario(scenarioId);
  let pending = allPending;
  if (limit && pending.length > limit) {
    // A probe: stride-sample so the subset spans the size spectrum
    // (singles, pairs, triples) in the same proportions as the full set,
    // making its token usage an honest basis for extrapolating the cost.
    const step = pending.length / limit;
    pending = Array.from(
      { length: limit },
      (_, i) => pending[Math.floor(i * step)],
    );
  }
  if (pending.length === 0) {
    report(["Nothing pending - the scenario is fully cached."]);
    return;
  }
  const client = await makeClient();
  const batch = await client.messages.batches.create({
    requests: pending.map((item, index) => requestFor(index, item.prompt)),
  });
  state[scenarioId] = {
    batchId: batch.id,
    submittedAt: new Date().toISOString(),
    keys: pending.map((item) => item.key),
  };
  await writeState(state);
  report([
    `Submitted ${pending.length} requests for ${scenario.name}.`,
    `batch: ${batch.id} (${batch.processing_status})`,
    `Poll with: npm run outcomes:batch -- ${scenarioId} --wait`,
  ]);
}

async function land(scenarioId, { wait = false } = {}) {
  const state = await readState();
  const tracked = state[scenarioId];
  if (!tracked?.batchId) {
    throw new Error(`No tracked batch for ${scenarioId}. Run --submit first.`);
  }
  const client = await makeClient();

  let batch = await client.messages.batches.retrieve(tracked.batchId);
  while (batch.processing_status !== "ended") {
    const counts = batch.request_counts;
    report([
      `${tracked.batchId}: ${batch.processing_status} - ${counts.succeeded} ok, ${counts.errored} errored, ${counts.processing} processing`,
    ]);
    if (!wait) return;
    await new Promise((resolve) => setTimeout(resolve, 60_000));
    batch = await client.messages.batches.retrieve(tracked.batchId);
  }

  // Ended: fold results into the shards. Results arrive in any order - the
  // custom_id indexes into the key list recorded at submit time.
  const { scenario } = await planScenario(scenarioId);
  const shards = new Map();
  const outDir = outDirFor(scenarioId);
  for (let shard = 0; shard < OUTCOME_SHARD_COUNT; shard++) {
    const name = `shard-${String(shard).padStart(2, "0")}.json`;
    const parsed = await readJsonIfPresent(path.join(outDir, name));
    shards.set(shard, parsed?.entries ?? {});
  }

  let succeeded = 0;
  let refused = 0;
  let truncated = 0;
  const failures = [];
  let inTokens = 0;
  let outTokens = 0;

  for await (const result of await client.messages.batches.results(
    tracked.batchId,
  )) {
    const index = Number(result.custom_id.slice(1));
    const key = tracked.keys[index];
    if (!key) {
      failures.push(`${result.custom_id}: no key recorded`);
      continue;
    }
    if (result.result.type !== "succeeded") {
      failures.push(`${key}: ${result.result.type}`);
      continue;
    }
    const message = result.result.message;
    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n\n")
      .trim();
    inTokens += message.usage.input_tokens;
    outTokens += message.usage.output_tokens;
    if (message.stop_reason === "refusal") refused += 1;
    if (message.stop_reason === "max_tokens") truncated += 1;
    shards.get(outcomeShard(key))[key] = {
      text,
      outputTokens: message.usage.output_tokens,
      stopReason: message.stop_reason,
    };
    succeeded += 1;
  }

  await mkdir(outDir, { recursive: true });
  for (const [shard, entries] of shards) {
    if (Object.keys(entries).length === 0) continue;
    const name = `shard-${String(shard).padStart(2, "0")}.json`;
    await writeFile(
      path.join(outDir, name),
      `${JSON.stringify(
        {
          schemaVersion: OUTCOME_SCHEMA_VERSION,
          scenario: scenarioId,
          entries,
        },
        null,
        1,
      )}\n`,
      "utf8",
    );
  }
  const landedNow = await readLanded(scenarioId);
  await writeFile(
    path.join(outDir, "meta.json"),
    `${JSON.stringify(
      {
        schemaVersion: OUTCOME_SCHEMA_VERSION,
        scenario,
        model: MODEL,
        effort: EFFORT,
        maxTokens: MAX_TOKENS,
        maxCards: OUTCOME_MAX_CARDS,
        count: landedNow.size,
        generatedAt: new Date().toISOString(),
      },
      null,
      1,
    )}\n`,
    "utf8",
  );

  delete state[scenarioId];
  await writeState(state);

  const cost = (inTokens / 1e6) * PRICE_IN + (outTokens / 1e6) * PRICE_OUT;
  report([
    `Landed ${succeeded} answers for ${scenario.name}; scenario now holds ${landedNow.size}.`,
    `usage: ${inTokens.toLocaleString()} in, ${outTokens.toLocaleString()} out = ~$${cost.toFixed(2)} at batch rates`,
    refused
      ? `refusals: ${refused} (recorded with stopReason "refusal")`
      : "",
    truncated
      ? `hit max_tokens: ${truncated} (stored as-is, stopReason "max_tokens")`
      : "",
    failures.length
      ? `failed: ${failures.length} - run --submit again to re-ask just those.\n  ${failures.slice(0, 5).join("\n  ")}`
      : "every request succeeded.",
  ]);
}

const [scenarioId, ...flags] = process.argv.slice(2);
if (!scenarioId) {
  console.error(
    "Usage: npm run outcomes:batch -- <scenario-id> [--submit | --wait | --land]",
  );
  process.exit(1);
}

try {
  if (flags.includes("--submit")) {
    const limitIndex = flags.indexOf("--limit");
    const limit =
      limitIndex >= 0 ? Number(flags[limitIndex + 1]) || 0 : 0;
    await submit(scenarioId, limit);
  } else if (flags.includes("--wait")) {
    await land(scenarioId, { wait: true });
  } else if (flags.includes("--land")) {
    await land(scenarioId);
  } else {
    await showPlan(scenarioId);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
