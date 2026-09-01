import { readFile } from "node:fs/promises";
import path from "node:path";

// See prompt-data-files.mjs: dirname is undefined under a bundler, and the
// cwd fallback is verified there rather than assumed.
export { projectRoot } from "./prompt-data-files.mjs";
import { projectRoot } from "./prompt-data-files.mjs";

export const soundDataDir = path.join(projectRoot, "src", "data", "sound-deck");

export const catalogFiles = {
  tracks: "tracks.json",
  cards: "cards.json",
  archetypes: "archetypes.json",
  builder: "builder.json",
  proofScenarios: "proof-scenarios.json",
};

export async function readSoundDataJson(fileName) {
  try {
    return JSON.parse(
      await readFile(path.join(soundDataDir, fileName), "utf8"),
    );
  } catch (error) {
    throw new Error(`${fileName}: ${error.message}`);
  }
}

export async function loadSoundCatalog() {
  return Object.fromEntries(
    await Promise.all(
      Object.entries(catalogFiles).map(async ([key, fileName]) => [
        key,
        await readSoundDataJson(fileName),
      ]),
    ),
  );
}
