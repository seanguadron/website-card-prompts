# SONIC Deck Data

This directory is the editable source of truth for the SONIC Deck catalog
(tool id `sound-deck`). Application behavior remains in `src/lib`; these
files contain only declarative content and configuration.

The S.O.N.I.C. framework these files implement — Source, Onset, Nature,
Intensity, Context — was built from the prompting guidance in Adobe's
Firefly documentation for sound-effects generation
(https://helpx.adobe.com/firefly/web/work-with-audio-and-video/work-with-audio/writing-effective-text-prompts-for-sound-effects-generation.html).
The five rules there shape the whole deck: describe the sound directly,
use adjectives and verbs, add comma-separated descriptions, describe one
sound at a time, and keep ambiences general. The acronym, the cards, and
the archetypes are this project's.

## Files

- `cards.json` - descriptor lineages and their three emphasis grades. A
  grade's `instruction` is a short comma TERM ("sharp attack"), not a
  sentence — the prompt is `sound, term, term, term`
- `tracks.json` - the Emphasis dial, per-section slot budgets, defaults
- `archetypes.json` - preset S.O.N.I.C. loadouts; `"ambience": true` marks
  a preset that switches ambience mode on when applied
- `builder.json` - the letters, the empty and example drafts, required
  fields
- `proof-scenarios.json` - Proof Lab configurations
- `sound-catalog.schema.json` - the JSON Schema the validator enforces

## Vocabulary anti-goals

Firefly generates sound effects and ambient sound only — it refuses music
and speech — so no card term may name musical or spoken content (melody,
song, singing, dialogue, lyrics, narration). The composer additionally
strips a leading "the sound of" from the typed line (Adobe's first don't),
so never rely on that phrasing in any term.

## Editing

1. Keep existing IDs stable. Saved browser sessions refer to card IDs.
2. Use strict JSON. Comments and trailing commas are not supported.
3. Run `npm run data:validate` before committing.

`npm run build` runs the same validation automatically. Card art is not
here and does not exist yet: the deck renders letter and code fallbacks
until a pack is generated (see `docs/ARCHITECTURE.md` §1 for the pack
model it will use).
