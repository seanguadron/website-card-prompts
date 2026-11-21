import path from "node:path";
import { pathToFileURL } from "node:url";
import Ajv from "ajv";
import {
  loadSoundCatalog,
  readSoundDataJson,
} from "./sound-data-files.mjs";

// The SONIC Deck's validator - the picture validator's shape minus art packs
// (the sound faces have a separate illustration index) and minus the
// Midjourney tail machinery (Firefly has no parameter tail).

const SECTIONS = ["source", "onset", "nature", "intensity", "context"];

// Firefly generates sound effects and ambience only - it refuses music and
// speech - so no card term may quietly steer prompts toward either. The
// composer separately strips a leading "the sound of" from the typed line;
// catalog text must never rely on the phrasing it exists to remove.
const FORBIDDEN_TERM_PATTERN =
  /\b(music|musical|melody|melodic|song|singing|sung|lyrics?|dialogue|speech|spoken|voice-?over|narration)\b|the sound of/i;

let schemaValidatorPromise;

export const loadCatalog = loadSoundCatalog;

function getSchemaValidator() {
  schemaValidatorPromise ??= readSoundDataJson(
    "sound-catalog.schema.json",
  ).then((schema) =>
    new Ajv({ allErrors: true, strict: true }).compile(schema),
  );

  return schemaValidatorPromise;
}

function schemaErrors(validationErrors = []) {
  return validationErrors.map(
    (error) =>
      `Schema ${error.instancePath || "/"} ${error.message ?? "failed"}`,
  );
}

function duplicateErrors(items, label, key = "id") {
  const seen = new Set();
  const errors = [];

  for (const item of items) {
    const value = item[key];
    if (seen.has(value)) {
      errors.push(`Duplicate ${label} ${key}: ${value}`);
    }
    seen.add(value);
  }

  return errors;
}

function createIndexes(catalog) {
  const cards = catalog.cards.cards;

  return {
    trackDefinitions: new Map(
      catalog.tracks.definitions.map((definition) => [
        definition.id,
        definition,
      ]),
    ),
    cardsById: new Map(cards.map((card) => [card.id, card])),
  };
}

function validateUniqueIds(catalog) {
  return [
    ...duplicateErrors(catalog.tracks.definitions, "track"),
    ...duplicateErrors(catalog.cards.cards, "card"),
    ...duplicateErrors(catalog.cards.cards, "card", "code"),
    ...duplicateErrors(catalog.archetypes.archetypes, "archetype"),
    ...duplicateErrors(catalog.archetypes.archetypes, "archetype", "code"),
    ...duplicateErrors(catalog.proofScenarios.scenarios, "proof scenario"),
  ];
}

function validateTrackValues(errors, values, owner, trackDefinitions) {
  for (const [trackId, value] of Object.entries(values ?? {})) {
    const definition = trackDefinitions.get(trackId);
    if (!definition) {
      errors.push(`${owner} references unknown track ${trackId}`);
    } else if (value >= definition.points.length) {
      errors.push(
        `${owner}.${trackId} uses snap ${value}, but the track ends at ${
          definition.points.length - 1
        }`,
      );
    }
  }
}

function validateTracks(catalog, indexes) {
  const errors = [];
  const { trackDefinitions } = indexes;

  for (const section of SECTIONS) {
    for (const trackId of catalog.tracks.sectionTracks[section]) {
      if (!trackDefinitions.has(trackId)) {
        errors.push(
          `sectionTracks.${section} references unknown track ${trackId}`,
        );
      }
    }
  }

  validateTrackValues(
    errors,
    catalog.tracks.defaultValues,
    "tracks.defaultValues",
    trackDefinitions,
  );

  return errors;
}

function validateCards(catalog, indexes) {
  const errors = [];
  const { trackDefinitions } = indexes;

  for (const card of catalog.cards.cards) {
    const sectionTrackIds = catalog.tracks.sectionTracks[card.section] ?? [];
    if (!sectionTrackIds.includes(card.driver)) {
      errors.push(
        `Card ${card.id} drives ${card.driver}, which is not a ${card.section} track`,
      );
    }

    const driver = trackDefinitions.get(card.driver);
    if (driver && card.grades.length !== driver.points.length) {
      errors.push(
        `Card ${card.id} has ${card.grades.length} grades for a ${driver.points.length}-point driver`,
      );
    }

    for (const [index, grade] of card.grades.entries()) {
      if (FORBIDDEN_TERM_PATTERN.test(grade.instruction)) {
        errors.push(
          `Card ${card.id} grade [${index}] term "${grade.instruction}" uses vocabulary Firefly refuses (music/speech) or the stripped "the sound of" phrasing`,
        );
      }
    }
  }

  return errors;
}

function validateEquippedMap(errors, equipped, owner, catalog, indexes) {
  const { cardsById } = indexes;

  for (const [section, ids] of Object.entries(equipped ?? {})) {
    const budget = catalog.tracks.slotBudgets[section];
    if (ids.length > budget) {
      errors.push(
        `${owner} equips ${ids.length} ${section} cards over the budget of ${budget}`,
      );
    }

    const seen = new Set();
    for (const id of ids) {
      if (seen.has(id)) {
        errors.push(`${owner} equips ${section} card ${id} twice`);
      }
      seen.add(id);

      const card = cardsById.get(id);
      if (!card) {
        errors.push(`${owner} equips unknown card ${id}`);
        continue;
      }
      if (card.section !== section) {
        errors.push(
          `${owner} equips ${id} into ${section}, but it is a ${card.section} card`,
        );
      }
    }
  }
}

function validateArchetypes(catalog, indexes) {
  const errors = [];

  for (const archetype of catalog.archetypes.archetypes) {
    validateTrackValues(
      errors,
      archetype.tracks,
      `Archetype ${archetype.id}`,
      indexes.trackDefinitions,
    );
    validateEquippedMap(
      errors,
      archetype.equipped,
      `Archetype ${archetype.id}`,
      catalog,
      indexes,
    );
  }

  return errors;
}

function validateScenarios(catalog, indexes) {
  const errors = [];

  for (const scenario of catalog.proofScenarios.scenarios) {
    validateTrackValues(
      errors,
      scenario.tracks ?? {},
      `Scenario ${scenario.id}`,
      indexes.trackDefinitions,
    );
    validateEquippedMap(
      errors,
      scenario.equipped,
      `Scenario ${scenario.id}`,
      catalog,
      indexes,
    );
  }

  return errors;
}

export async function validateCatalog(catalog) {
  const validateSchema = await getSchemaValidator();
  if (!validateSchema(catalog)) {
    throw new Error(
      `Sound data validation failed:\n- ${schemaErrors(
        validateSchema.errors,
      ).join("\n- ")}`,
    );
  }

  const indexes = createIndexes(catalog);
  const errors = [
    ...validateUniqueIds(catalog),
    ...validateTracks(catalog, indexes),
    ...validateCards(catalog, indexes),
    ...validateArchetypes(catalog, indexes),
    ...validateScenarios(catalog, indexes),
  ];

  if (errors.length > 0) {
    throw new Error(`Sound data validation failed:\n- ${errors.join("\n- ")}`);
  }
}

export async function validateSoundData() {
  await validateCatalog(await loadCatalog());
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  validateSoundData()
    .then(() => {
      console.log("Sound data is valid.");
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
