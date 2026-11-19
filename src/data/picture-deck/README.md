# PICTURE Deck Data

This directory is the editable source of truth for the PICTURE Deck catalog
(tool id `picture-deck`). Application behavior remains in `src/lib`; these
files contain only declarative content and configuration.

The seven section names, merge order, cards and archetypes belong to this project. The natural-language prompt describes visible content. The optional parameter tail follows [Midjourney's parameter syntax](https://docs.midjourney.com/hc/en-us/articles/32859204029709-Parameter-List).

## Files

- `cards.json` - lineages and their three intensity grades
- `tracks.json` - per-section tuning tracks, slot budgets, and defaults
- `archetypes.json` - preset P.I.C.T.U.R.E. loadouts
- `builder.json` - section labels, the empty and example drafts, and the
  Midjourney tail ranges (aspect ratios, stylize, chaos, weird)
- `proof-scenarios.json` - Proof Lab configurations
- `picture-catalog.schema.json` - the JSON Schema the validator enforces

## Art packs

Card art is NOT in these files. It lives in `art-themes/<pack>.json`, keyed by
entry (`lineages.watercolor`, `grades.watercolor[2]`), and carries a prompt,
alt text, an optional bio, and a status. A pack stores no path:
`scripts/art-pack.mjs` derives every path from the pack id plus the key. See
`docs/ARCHITECTURE.md` §1.

This deck has one pack, `gallery`, where each card's art demonstrates the
technique that card teaches - a watercolor card IS watercolor. Unlike the
CRAFT deck there is no pack switching, so the catalog is script-managed and
the Card Studio at `/studio/picture` has no Card tab.

## Editing

1. Keep existing IDs stable. Saved browser sessions refer to card IDs.
2. Use strict JSON. Comments and trailing commas are not supported.
3. Run `npm run data:validate` before committing.

`npm run build` runs the same validation automatically.
