/** Offline helpers for interpreting the retired Outcome Lab fixtures. */

export type OutcomeScenario = {
  id: string;
  name: string;
  context: string;
  target: string;
};

export type OutcomeCardSection = "context" | "action" | "format" | "target";

/** One equipped card, reduced to what the prompt needs. */
export type OutcomeCard = {
  id: string;
  section: OutcomeCardSection;
  instruction: string;
};

/** One cached answer. */
export type OutcomeEntry = {
  text: string;
  outputTokens: number;
  stopReason: string;
};

export type OutcomeShardFile = {
  schemaVersion: number;
  scenario: string;
  entries: Record<string, OutcomeEntry>;
};

export type OutcomeMeta = {
  schemaVersion: number;
  scenario: OutcomeScenario;
  model: string;
  effort: string;
  maxTokens: number;
  maxCards: number;
  count: number;
  generatedAt: string;
};

/** The cache covers combinations of up to this many cards. */
export const OUTCOME_MAX_CARDS = 3;

/** Entries per scenario are spread over this many files so a lookup fetches
 *  ~200KB, not the whole ~14MB scenario. */
export const OUTCOME_SHARD_COUNT = 64;

export const OUTCOME_SCHEMA_VERSION = 1;

/**
 * The canonical name of a combination: sorted ids joined with "+", so the
 * same cards in any equip order name the same cached answer. The empty
 * combination - just context and target - is "baseline".
 */
export function outcomeComboKey(lineageIds: readonly string[]): string {
  if (lineageIds.length === 0) return "baseline";
  return [...lineageIds].sort().join("+");
}

/** FNV-1a, chosen for being trivially identical in .ts and .mjs. */
export function outcomeShard(comboKey: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < comboKey.length; i++) {
    hash ^= comboKey.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % OUTCOME_SHARD_COUNT;
}

/** Static-asset paths, served from public/. */
export function outcomeShardPath(scenarioId: string, shard: number): string {
  return `/proof-outcomes/${scenarioId}/shard-${String(shard).padStart(2, "0")}.json`;
}

export function outcomeMetaPath(scenarioId: string): string {
  return `/proof-outcomes/${scenarioId}/meta.json`;
}

const SECTION_ORDER: readonly OutcomeCardSection[] = [
  "context",
  "action",
  "format",
  "target",
];

/**
 * The clean prompt for one scenario + one card combination.
 *
 * Deliberately shaped like the deck's own assembled prompt - CONTEXT, ACTION,
 * FORMAT, TARGET AUDIENCE - so a cached answer reads as "what this deck
 * produces", minus the role loadout (the lab has no roles; its baseline is
 * context and target alone, which the deck's composer refuses). ACTION and
 * FORMAT appear only when a card puts something in them. Cards render in
 * canonical id order, matching the combo key: the lab ignores equip order.
 */
export function composeOutcomePrompt(
  scenario: Pick<OutcomeScenario, "context" | "target">,
  cards: readonly OutcomeCard[],
): string {
  const bySection = new Map<OutcomeCardSection, string[]>();
  for (const card of [...cards].sort((a, b) => a.id.localeCompare(b.id))) {
    const list = bySection.get(card.section) ?? [];
    list.push(card.instruction);
    bySection.set(card.section, list);
  }

  const blocks: string[] = [];
  for (const section of SECTION_ORDER) {
    const lines = bySection.get(section) ?? [];
    if (section === "context") {
      blocks.push(`CONTEXT\n${[scenario.context, ...lines].join("\n")}`);
    } else if (section === "action") {
      if (lines.length > 0) {
        const numbered = lines
          .map((line, index) => `${index + 1}. ${line}`)
          .join("\n");
        blocks.push(`ACTION\n${numbered}`);
      }
    } else if (section === "format") {
      if (lines.length > 0) {
        blocks.push(`FORMAT\n${lines.join("\n")}`);
      }
    } else {
      blocks.push(
        `TARGET AUDIENCE\n${[scenario.target, ...lines].join("\n")}`,
      );
    }
  }
  return blocks.join("\n\n");
}

/**
 * Every combination the cache covers, in a deterministic order: sizes small
 * to large, ids lexicographic within each size. The batch script numbers
 * requests by position in this list, so the order IS the contract between
 * submitting and landing - both sides derive it from this one function.
 */
export function enumerateOutcomeCombos(
  lineageIds: readonly string[],
): string[][] {
  const ids = [...lineageIds].sort();
  const combos: string[][] = [[]];
  for (let i = 0; i < ids.length; i++) {
    combos.push([ids[i]]);
  }
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      combos.push([ids[i], ids[j]]);
    }
  }
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      for (let k = j + 1; k < ids.length; k++) {
        combos.push([ids[i], ids[j], ids[k]]);
      }
    }
  }
  return combos;
}
