---
paths:
  - "src/data/**"
  - "scripts/**"
  - "docs/PROMPT_ROLES.md"
  - "docs/CRAFT_ART_*.md"
  - "docs/PICTURE_ART_MANIFEST.md"
---
<!-- gov:node id=rule-data kind=rule title="Data and scripts rules (path-scoped, Claude Code)" reads=docs/STANDARDS.md,docs/ARCHITECTURE.md -->

# Data and scripts rules (loaded when catalogs, packs, or scripts are touched)

## Catalogs (STANDARDS §2)

- Every JSON catalog under `src/data/` is validated by `npm run
  data:validate` (schema plus referential checks). A new catalog registers
  its validator and schema in the same change, with strict schemas; tests
  count-check in `scripts/*.test.mjs`.
- Generated docs never drift: `docs/PROMPT_ROLES.md`, `docs/CRAFT_ART_*.md`,
  and `docs/PICTURE_ART_MANIFEST.md` come from `npm run data:generate`, and
  `check:standards` fails when the committed file differs from the
  generator's output. Edit the JSON, regenerate, commit both.
- IDs stay stable: saved sessions, archetypes, and art packs reference them.

## Art packs (`docs/ARCHITECTURE.md` §1)

- A pack stores NO paths. Every path derives from the pack id plus the entry
  key. Per-entry `status` is honest (`planned` / `generated`); a pack with
  `theme.draft: true` is skipped by the generator and the coverage check.
- Live art is one webp per card under `public/card-art/` (committed).
  `card-art-source/` holds the full-resolution originals and is gitignored
  by the owner's decision. The queue files under `.ai/notes/` are transient.

## Editing mechanics

- Edit JSON with node and `utf8`, never PowerShell `Get-Content` /
  `Set-Content` (non-ASCII is mangled). Files are CRLF: patch scripts match
  `\r?\n`. Long heredocs into bash break; use the Write tool for big files.

## Scripts are app code for the security sweep

- `check:security` sweeps `scripts/` as well as `src/`: no `eval`, no
  `new Function`, no secret-looking strings. `scripts/card-art-store.mjs` and
  `scripts/art-pack.mjs` ARE the write endpoint's implementation.
- The API key lives in `.env.local` (gitignored). Never print it, log it,
  or commit it.
- Paid bulk generation (API batches, image runs) is probe-gated: run a
  stride-sampled probe (`--limit N`), measure real token or credit spend,
  quote the full run from measured numbers, then submit. On Opus 5,
  adaptive thinking bills as output AND counts against `max_tokens`; the
  first Outcome Lab run spent $80 on 58% empty answers (2026-09-01).

## Tests

- `npm test` runs `scripts/*.test.mjs` on the node test runner with
  `--experimental-strip-types`. Vector and `@/`-aliased modules cannot be
  imported there; author new pure logic alias-free so it stays testable.
