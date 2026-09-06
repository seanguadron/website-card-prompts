---
paths:
  - "src/app/**/page.tsx"
  - "src/data/**"
  - "src/lib/tool-registry.ts"
  - "README.md"
---
<!-- gov:node id=rule-copy kind=rule title="Copy rules (path-scoped, Claude Code)" reads=docs/DESIGN_DIRECTION.md,PRODUCT.md,CONTEXT.md -->

# Copy rules (loaded when product copy is touched)

Catalog strings are product copy: card names, descriptions, abilities, grade
instructions, taglines, and gate notes all render to the user.

## Voice

- Voice comes from `docs/DESIGN_DIRECTION.md` → Voice and `PRODUCT.md`:
  direct and specific; say what the tool does, where the data lives, and what
  an action produces. No inflated claims, no vague superlatives, no generic
  AI-product language, no account/team/cloud/sync language (the app has
  none of those).
- Run `avoid-ai-writing` on the changed copy only: `detect` to review, `edit`
  to fix in place. Never over the whole site for one change.
- Use the domain language in `CONTEXT.md` (Role Card, Tuning Track, Snap
  Point, Art Pack, Card Bio) and avoid the words it lists under _Avoid_.

## Attribution never drifts

- C.R.A.F.T. is Lawton Solutions / Lawton Learns' framework; P.I.C.T.U.R.E.
  comes from Midjourney's documentation; S.O.N.I.C. was built from Adobe
  Firefly's sound-effect prompting guidance. The decks, cards, and art are
  this project's; the frameworks are not. Two docs once claimed PICTURE as
  ours and the owner corrected it (2026-09-01). Keep the credit on the page
  that teaches the acronym.

## Copy inside prompts is instruction

- A card's grade instruction and a role's priorities are sent in the
  assembled prompt. Write them as instructions to a model, not as interface
  copy, and keep every grade recognizable as one lineage. SONIC grades are
  comma TERMS in Firefly's vocabulary, never sentences, and never music or
  speech words.

## Progressive disclosure

- One title per step. Do not repeat the explanation inside the card, the
  field label, and the workbench. Card faces show identity and state; full
  descriptions belong in the inspection panel. Empty slots use shape,
  numbering, and a plus mark, not repeated "drop here" text.

## Editing catalog copy

- IDs stay stable (saved sessions reference them). Strict JSON. Edit with
  node and `utf8`, never PowerShell `Get-Content`/`Set-Content` (it mangles
  non-ASCII). Files are CRLF. Run `npm run data:validate`; a change to
  `roles.json` also needs `npm run data:generate` or the drift gate fails.

## Read the rendered result

- Line breaks, widows, and overflow are copy problems too. When a paragraph
  wraps badly, fix the measure, not the wrap (the guide's 62ch measure inside
  an 1180px panel, 2026-09-01).
