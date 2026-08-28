#!/usr/bin/env node
/**
 * Read the Card Studio's generation queue and print what to generate.
 *
 * The studio cannot reach a model; pressing "Generate more" only records the
 * request in .ai/notes/art-queue.json. This is the other half: it resolves each
 * queued card to the exact prompt its pack would use — the pack's shared style
 * paragraph, then that card's own brief — so an agent can submit them and land
 * the results as new variants.
 *
 * The settings are not a choice made here. Every image in all four packs was
 * made with Nano Banana Pro at 2K, square, and a card generated with anything
 * else would not sit next to its siblings:
 *
 *     model nano_banana_pro · resolution 2k · aspect_ratio 1:1
 *
 * Usage:
 *   node scripts/art-queue.mjs            list the queue
 *   node scripts/art-queue.mjs --prompts  print each full prompt, ready to send
 *   node scripts/art-queue.mjs --json     machine-readable, for scripting
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { artPackEntry } from "./art-pack.mjs";
import { projectRoot } from "./prompt-data-files.mjs";

export const GENERATION_SETTINGS = {
  model: "nano_banana_pro",
  resolution: "2k",
  aspect_ratio: "1:1",
  use_unlim: false,
};

const PACK_FILE = {
  craft: (theme) =>
    path.join(projectRoot, "src", "data", "prompt-builder", "art-themes", `${theme}.json`),
  picture: (theme) =>
    path.join(projectRoot, "src", "data", "picture-deck", "art-themes", `${theme}.json`),
};

export async function readArtQueue() {
  const file = path.join(projectRoot, ".ai", "notes", "art-queue.json");
  try {
    const parsed = JSON.parse(await readFile(file, "utf8"));
    return Array.isArray(parsed?.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

/** Each queued card with the full prompt its pack implies. */
export async function resolveQueue() {
  const items = await readArtQueue();
  const packs = new Map();
  const resolved = [];

  for (const item of items) {
    const loader = PACK_FILE[item.deck];
    if (!loader) continue;
    const cacheKey = `${item.deck}:${item.theme}`;
    if (!packs.has(cacheKey)) {
      packs.set(cacheKey, JSON.parse(await readFile(loader(item.theme), "utf8")));
    }
    const pack = packs.get(cacheKey);
    const entry = artPackEntry(pack, item.key);
    if (!entry) continue;
    resolved.push({
      ...item,
      style: pack.theme.style,
      brief: entry.prompt,
      // The same shape every landed image in this repo was made from.
      prompt: `${pack.theme.style}\n\n${entry.prompt}`,
    });
  }
  return resolved;
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const resolved = await resolveQueue();
  const total = resolved.reduce((sum, item) => sum + item.count, 0);

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ settings: GENERATION_SETTINGS, items: resolved }, null, 2));
  } else if (!resolved.length) {
    console.log("The generation queue is empty.");
  } else {
    console.log(
      `${total} image${total === 1 ? "" : "s"} queued across ${resolved.length} card${resolved.length === 1 ? "" : "s"}`,
    );
    console.log(
      `settings: model ${GENERATION_SETTINGS.model} · ${GENERATION_SETTINGS.resolution} · ${GENERATION_SETTINGS.aspect_ratio}\n`,
    );
    for (const item of resolved) {
      console.log(`— ${item.deck}/${item.theme} ${item.key} · ${item.name} · ×${item.count}`);
      if (process.argv.includes("--prompts")) {
        console.log("\n" + item.prompt + "\n");
      }
    }
    if (!process.argv.includes("--prompts")) {
      console.log("\nRun with --prompts to print the full prompt for each.");
    }
  }
}
