# State

The current-state snapshot. REWRITTEN in place at the end of every working
session (AGENTS.md, Session continuity; STANDARDS §3.5). Written for a reader
with zero prior context: if you have seen nothing but AGENTS.md (or CLAUDE.md
in a Claude Code session), this page tells you where the project stands, how
to run it, and what comes next. History and the why live in
`.ai/notes/SESSIONS.md`; this page is only what is true now.

Last rewritten: 2026-09-01 (the "Outcome Lab" session).

## Now

Branch **`main`**. Two commits are pushed (`b270f2d` guide line breaks,
`abd2a89` Midjourney attribution for PICTURE); **three are committed but NOT
pushed** — `93c1672` (deck art-queue mode), `9913dc8` (the Outcome Lab),
`b741b11` (outcome pipeline retune) — plus this close-out. **Sean has not
said push**; the Outcome Lab would deploy with honest "not generated yet"
states, which he may not want visible in production yet.

**New this session, working and verified:**

- **Attribution is now honest in both directions.** The CRAFT guide credits
  Lawton Solutions / Lawton Learns; the PICTURE guide, README, and CONTEXT.md
  now credit Midjourney's documentation as P.I.C.T.U.R.E.'s source — two docs
  previously claimed it as this project's own, which the owner corrected.
  `src/data/picture-deck/README.md` now exists (its CRAFT counterpart always
  had one).
- **The deck art-queue mode** (`93c1672`): "Queue art" in the CRAFT nav dock
  turns the deck into an authoring surface — a card's click asks for one more
  image of itself (badge counts, world-scoped: fantasy clicks queue fantasy
  art), landing in the same `.ai/notes/art-queue.json` the studio's button
  feeds. `npm run art:queue` resolves the queue to full prompts
  (nano_banana_pro · 2k · 1:1). Dev-only twice over: the control renders only
  when the loopback-guarded writer answers a probe. Verified live: 3 rapid
  clicks land 3, mode-off restores equipping exactly.
- **The Outcome Lab** (`9913dc8`): the output dock gained a Prompt|Outcome
  switch. Outcome shows Claude's PRECACHED answer for the current card
  combination under one of three fixed context+target scenarios (Origin of
  the Universe / Dreams / Evolution — definitions in
  `src/data/prompt-builder/outcome-scenarios.json`). Combinations of ≤3
  tactic cards, order-blind, sliders at defaults, roles not involved. Each
  answer was (will be) ONE clean standalone API query — a single user
  message holding only the composed prompt. One composer
  (`src/lib/outcome-lab.ts`) serves both the batch script and the app's
  "exact question asked" view. Answers land as 64 static shards per scenario
  under `public/proof-outcomes/` (fetched ~200KB at a time, zero bundle
  weight); every miss state names itself and its fix. PICTURE's dock passes
  no outcomeView and is unchanged.

**⚠ PINNED (owner's direction): Outcome Lab data generation.** The story so
far, so nobody re-learns it the expensive way:

- First run (Opus 5, effort **medium**, max_tokens **1200**, Batches API):
  5,489 requests, **$80.64 actual vs ~$46 estimated — and 58% of answers
  came back EMPTY, ~90% truncated.** Cause: adaptive thinking bills as
  output AND counts against max_tokens; at effort medium it spent ~1,000
  tokens/question before writing, starving the cap. The 545 complete answers
  were excellent. All data from that run was **wiped** (never committed).
- Pipeline retuned (`b741b11`): effort **low**, max_tokens **2500**, and
  `--submit --limit N` stride-samples a probe so the full cost can be quoted
  from measured tokens before any big spend.
- **Blocked on:** the API account balance is **$0** (the $80 run drained it)
  and Sean's pick from the quoted menu: ~$7 singles+pairs on Opus /
  ~$25–35 full redo on Sonnet 5 / ~$60–85 full redo on Opus 5 (probe-gated).
  Top up at console.anthropic.com → Plans & Billing, then run.
- **The key lives in `.env.local`** (gitignored, verified) and **expires
  2026-09-02**; after that, replace the line with a fresh key. Never commit
  or print it.
- Resume command when unblocked: `npm run outcomes:batch -- origin-universe
  --submit --limit 40` (probe) → quote → `--submit` (rest) → `--wait`.
  Idempotent: --submit only sends combos not already landed.

**Gates:** all three judgment gates ran on this session's two surfaces at
close-out — every one came back FAIL and every finding was fixed and
verified the same day (ledger: the three `2026-09-01-*-art-queue-outcome-lab.md`
reports). The one to know about: the card-art writer authenticated its
TARGET (Host) but never its CALLER — any webpage in the same browser could
blind-POST writes while the dev server ran. Now: a same-origin check plus a
required `x-card-art-intent` header on POST (403 without it, verified live).
Amendments (k) (l) (m) flagged in SESSIONS.md for consent.

**Owed from Sean:** the Outcome Lab decision + credits (above) · feel the
dock drag with a real mouse · PICTURE deck art review · real-mic dictation
spot-check.

## Runbook

- **Start:** `StartDigiTools.bat` or `npm run dev`, port 5100. Never start a
  second dev server if one is running; verify inside the running one (prefer
  the preview tools; `preview_start {name: "digitools"}` starts it if truly
  down). Never `npm run build` while a dev server may be live (shared
  `.next/`). **Routes are `/tools/prompt-builder` and `/tools/picture-deck`.**
- **Checks:** `npm run typecheck` · `lint` · `test` (162) ·
  `data:validate` · `check:standards && check:security`.
- **Outcome Lab pipeline:** `npm run outcomes:batch -- <scenario-id>`
  (dry plan) · `--submit [--limit N]` · `--wait` · `--land`. Scenario ids:
  `origin-universe`, `dreams`, `evolution`. **The sizing lesson: on Opus 5,
  adaptive thinking bills as output and counts against max_tokens — probe
  with `--limit 40` and read measured tokens before any full submit.**
  Settings are constants in `scripts/outcome-batch.mjs` (change only by
  regenerating a whole scenario; comparability depends on uniformity).
- **Art queue:** studio button or the deck's "Queue art" mode fill
  `.ai/notes/art-queue.json`; `npm run art:queue [-- --prompts|--json]`
  resolves it. Generation loop details: `docs/STATE.md` history →
  `.ai/notes/SESSIONS.md` 2026-08-19, or the Batch image generation notes
  below.
- **Batch image generation** (Higgsfield MCP): `generate_image_batch` max 12
  requests, `jobs_wait` max 12 jobs / 15s cap; loop is submit 12 → 4-5 min
  background timer → poll → land → next 12. Result URLs
  `hf_<YYYYMMDD>_<HHMMSS>_<job_id>.png` — the trailing underscore belongs to
  the prefix; land per-prefix. End a theme with the pending check.
- **If CSS edits stop taking effect** (Turbopack stale stylesheet): append a
  real change, let it recompile, remove it, hard-reload — or
  `npm run dev:clean` when the server can restart.
- **Deploys (Vercel, git-integrated on `main`).** `public/card-art` (264MB)
  and future `public/proof-outcomes/` are static assets;
  `next.config.ts` `outputFileTracingExcludes` keeps art out of the
  card-art function bundle (2026-08-20 deploy broke at 266MB vs 250MB
  ceiling without it). If a deploy fails, `npx vercel inspect --logs <url>`.
- **Authoring:** `/studio/cards` (CRAFT) and `/studio/picture` (PICTURE) —
  development-only, 404 in production, loopback Host required.
- **Skills:** two homes (STANDARDS §3.4): `.agents/skills/` Codex,
  `.claude/skills/` Claude Code; never cross-install.
- **Headless preview gotchas:** lazy card images; screenshots need the pane
  visible; 0×0 viewport (call resize_window; assert computed styles,
  dispatch .click()); Next image `src` is URL-encoded; **navigate with the
  navigate tool — location.href from an eval can land on `/`**.
- **Editing JSON catalogs programmatically:** node with `utf8`; PowerShell
  Get/Set-Content mangles non-ASCII. Repo files are CRLF — patch scripts must
  match `\r?\n`. Long heredocs into bash break — use the Write tool for big
  source files.

## Built

**Six tools** in `src/lib/tool-registry.ts`, plus two unregistered authoring
surfaces.

- **CRAFT Deck** (`prompt-builder`): C.R.A.F.T. prompts from card choices —
  35 roles, 32 lineages ×4 grades, 25 archetypes, library/share/sessions/
  dictation/proof lab, the world picker (3 illustrated worlds), **the
  dev-only art-queue mode**, and **the Outcome Lab** (dock Prompt|Outcome
  switch; answers pending generation, above). Credits Lawton Solutions.
- **PICTURE Deck** (`picture-deck`): P.I.C.T.U.R.E. image prompts — 100
  lineages ×3 grades, 18 archetypes, Midjourney tail, 426/426 gallery art.
  Credits Midjourney's documentation.
- **Architect Wizard**, **Image Editor**, **Vector Editor**, **Skills Wiki**:
  unchanged.
- **Card Studio** (`/studio/cards`, `/studio/picture`): facet tabs, art
  workflow + bio editor, "Generate more" queue button.

**The art-pack model** (`docs/ARCHITECTURE.md` §1): four packs complete —
sci-fi, fantasy, superhero (226 each), gallery (426) — 1,104 images.

**The outcome model** (new): catalog-independent. Scenarios (fixed
context+target) live in data; combinations are enumerated, composed, and
asked offline by `scripts/outcome-batch.mjs`; answers are static shards
keyed by sorted-lineage-id combo keys; the app is a pure reader.

## Backlog / in flight

- **Pinned, top of queue: Outcome Lab generation** (see Now — needs credits
  + Sean's pick; key expires 2026-09-02). Then: commit the landed shards,
  spot-check quality, and later `dreams` / `evolution` by the same command.
- **Push decision** for `93c1672`..HEAD is Sean's.
- PICTURE deck artQueue wiring (the workbench seam already accepts it;
  ~5 lines) if Sean wants gallery cards queueable too.
- **Sean's queue:** dock drag by hand; PICTURE art review; real-mic
  dictation check.
- **Next (unchanged):** per-model output formatter; Pip-Decks-style restyle;
  the idea-making deck.
- **Pending amendments** (`npm run amendments`, owner consent): 23 flagged
  pre-session; the sessions agent may add this session's (Outcome Lab
  DESIGN_DIRECTION coverage; the dock's second view; probe-before-bulk as
  a rule for paid batch generation).
- **Non-blocking, accepted:** art-pack.ts imports scripts/art-pack.mjs;
  first-paint flash for non-default pack/dock users; module-level
  active-pack singleton.
- **Pre-existing, still open:** Filters/"Adjust" dialog onto EditorDialog;
  `.image-editor-title-input` focus pattern; statusbar portal idiom chip;
  agent-eval fixtures vs the gates; proofDraft schema widening;
  `restoreDraft` degradation unit test; vector "Later" list; `npm run
  amendments` line-wrap fragility; `writeStoredOrThrow` for architect save.

## Pointers

- Framework contract: `docs/ARCHITECTURE.md`. Rules: `docs/STANDARDS.md`.
  History: `.ai/notes/SESSIONS.md` (newest-first). Gate ledger:
  `.ai/notes/gate-reports/`. Domain language: `CONTEXT.md`.
- Outcome Lab: `src/lib/outcome-lab.ts` (core), `scripts/outcome-batch.mjs`
  (pipeline), `src/data/prompt-builder/outcome-scenarios.json` (the three
  questions), `src/components/prompt-outcome-lab.tsx` (reader UI).
- Art briefs: `docs/CRAFT_ART_*.md` (3×226), `docs/PICTURE_ART_MANIFEST.md`
  (426).
- `npm run amendments` shows the consent queue; `npm run gate:sweep` stamps
  `.ai/notes/gate-status.json` and warns when this page goes stale.
