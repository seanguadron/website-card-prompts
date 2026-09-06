# State

The current-state snapshot. REWRITTEN in place at the end of every working
session (AGENTS.md, Session continuity; STANDARDS §3.5). Written for a reader
with zero prior context: if you have seen nothing but AGENTS.md (or CLAUDE.md
in a Claude Code session), this page tells you where the project stands, how
to run it, and what comes next. History and the why live in
`.ai/notes/SESSIONS.md`; this page is only what is true now.

Last rewritten: 2026-09-05 (the "stack v2 + board vision" session, Claude
Fable 5.1).

## Now

Branch **`main`**, **6 commits ahead of `origin/main`** (`93c1672` deck
art-queue mode → `9913dc8` Outcome Lab → `b741b11` outcome retune →
`54a8283` + `0895a96` close-out → `211f122` the SONIC Deck) **plus this
session's work UNCOMMITTED in the working tree** (governance and docs only;
no `src/` file changed; the one script touched is
`scripts/check-standards.mjs`). Nothing was committed because the owner did
not ask; the whole tree passed `check:standards`, `check:security`, `lint`,
`typecheck`, `data:validate`, and `npm test` (172) at close. Sean has not
said push either.

**This session (2026-09-05):**

- **Stack v2 adopted by adaptation**, not by running the upgrade bundle
  (`docs/adr/0001-stack-v2-adopted-by-adaptation.md`). Taken: path-scoped
  Claude Code rules in `.claude/rules/` (`ui`, `copy`, `nextjs`, `data`,
  `governance`; `check:standards` now walks them for gov:node markers);
  `docs/adr/` with ADR-0001 and ADR-0002; in AGENTS.md a stack-version
  line, the **Phases** table (0 Context → 4 Close), the **Documents — who
  updates what, when** table, rules 23–24, and the new resources;
  Claude Code built-ins named as the QA layer's first pass; a Stack
  changelog in `docs/AI_STACK.md`; `karpathy-guidelines` REMOVED from the
  Claude set and `avoid-ai-writing` PRUNED to `SKILL.md` + `LICENSE` there
  (both recorded in `SKILL_VERSIONS.md`; the Codex home is untouched);
  `CLAUDE.local.md` and `.impeccable/live/` gitignored. Not taken, with
  reasons in ADR-0001: root `DESIGN.md` replacing `docs/DESIGN_DIRECTION.md`
  (ADR-0002), gitignoring `.agents/`, the impeccable junction,
  `docs/CHANGELOG.md`, the AccessLint `.mcp.json`, skill refreshes.
- **`docs/BOARD_VISION.md`** captures the owner's direction for the next
  major change, in his words, deliberately NOT designed: the decks (CRAFT,
  SONIC, PICTURE) stay here; the Vector Editor, Image Editor, Skills wiki,
  and Architect Wizard move to a separate project; the card project becomes
  a Miro-like, zoomable, pannable **board** with an archetype socket
  ("drop an archetype, it builds out everything"; sections reached "next
  board" rather than spread out), in a 2.5D space where cards flip and
  shuffle. Reference code: `W:\Local Files\ClaudeCode\WebGamingPlatform`
  (its spec canvas). Two owner inputs are still pending (a second
  inspiration codebase; card-system references), then the clarifying
  interview. Do not build from the vision doc until he starts that step.
- **Drift fixed**: README.md now lists the SONIC deck (seven tools) and
  credits Adobe Firefly; CONTEXT.md carries the S.O.N.I.C. attribution.

**The SONIC Deck (`211f122`, 2026-09-01), landed after that day's close-out
with NO paperwork.** Tool 03 in bar order (`sound-deck`): S.O.N.I.C.
(Source, Onset, Nature, Intensity, Context) built from Adobe Firefly's five
sound-effect prompting rules; 38 lineages × 3 grades, 12 archetypes, one
Emphasis dial, ambience mode (caps descriptors at two), a layer rack in place
of a parameter tail, a strict schema and validator wired into
`data:validate`, no art pack yet (letter/code fallbacks), tests 162 → 172.
**Owed:** the integration, security, and design gates (never run; the sweep
flags them), a `docs/DESIGN_DIRECTION.md` section, CONTEXT.md vocabulary.
Its session entry was reconstructed from the commit message only.

**⚠ PINNED (owner's direction): Outcome Lab data generation.** Unchanged
since 2026-09-01, so nobody re-learns it the expensive way:

- First run (Opus 5, effort **medium**, max_tokens **1200**): **$80.64 for
  58% empty answers** — adaptive thinking bills as output AND counts against
  max_tokens. Data wiped. Pipeline retuned (`b741b11`): effort **low**,
  max_tokens **2500**, `--submit --limit N` stride-samples a probe so the
  full cost is quoted from measured tokens first.
- **Blocked on:** credits (**$0**), Sean's pick from the quoted menu (~$7
  singles+pairs on Opus / ~$25–35 full redo on Sonnet 5 / ~$60–85 full redo
  on Opus 5), and **a fresh API key: the one in `.env.local` expired
  2026-09-02.** Replace the line; never commit or print it.
- Resume: `npm run outcomes:batch -- origin-universe --submit --limit 40`
  (probe) → quote → `--submit` (rest) → `--wait` → `--land`. Idempotent.

**Owed from Sean (decisions):** commit + push this tree · the Outcome Lab
key + credits + menu pick · AccessLint `.mcp.json` yes/no · whether to
refresh/pin skills (upstream renamed the AccessLint set; v2 uses `scan`) ·
whether the Codex home also drops `karpathy-guidelines` (a Codex session;
the Skills wiki entry in `src/data/skills.json` still lists it) · the board
vision's two pending inputs · feel the dock drag with a real mouse · PICTURE
deck art review · real-mic dictation spot-check.

## Runbook

- **Start:** `StartDigiTools.bat` or `npm run dev`, port 5100. Never start a
  second dev server if one is running; verify inside the running one (prefer
  the preview tools; `preview_start {name: "digitools"}` starts it if truly
  down). Never `npm run build` while a dev server may be live (shared
  `.next/`). **Routes:** `/tools/prompt-builder`, `/tools/picture-deck`,
  `/tools/sound-deck`, `/tools/architect-wizard`, `/tools/skills`,
  `/tools/image-editor`, `/tools/vector-editor`.
- **Checks:** `npm run typecheck` · `lint` · `test` (172) ·
  `data:validate` · `check:standards && check:security`.
- **Claude Code specifics:** `.claude/rules/*.md` load by path (they point at
  the canonical docs); built-ins `/code-review`, `/simplify`, `/verify`,
  `/security-review`, `/run` are the first QA pass; the judgment gates in
  `.claude/agents/` still run where AGENTS.md requires. `/impeccable` works
  without a junction (`.agents/skills/impeccable` is the real Codex copy);
  never `/impeccable init` (ADR-0002).
- **Decisions:** hard to reverse + surprising + a real trade-off → an ADR in
  `docs/adr/` (README has the format). Diary stays `SESSIONS.md`; rules stay
  `STANDARDS.md` (consent).
- **Outcome Lab pipeline:** `npm run outcomes:batch -- <scenario-id>`
  (dry plan) · `--submit [--limit N]` · `--wait` · `--land`. Scenario ids:
  `origin-universe`, `dreams`, `evolution`. Settings are constants in
  `scripts/outcome-batch.mjs`; change only by regenerating a whole scenario.
  Probe with `--limit 40` and read measured tokens before any full submit.
- **Art queue:** studio button or the CRAFT deck's dev-only "Queue art" mode
  fill `.ai/notes/art-queue.json`; `npm run art:queue [-- --prompts|--json]`
  resolves it (nano_banana_pro · 2k · 1:1). Batch generation (Higgsfield
  MCP): `generate_image_batch` max 12 requests, `jobs_wait` max 12 jobs /
  15s cap; loop is submit 12 → 4-5 min background timer → poll → land →
  next 12. Result URLs `hf_<YYYYMMDD>_<HHMMSS>_<job_id>.png`; the trailing
  underscore belongs to the prefix; land per-prefix.
- **If CSS edits stop taking effect** (Turbopack stale stylesheet): append a
  real change, let it recompile, remove it, hard-reload — or
  `npm run dev:clean` when the server can restart.
- **Deploys (Vercel, git-integrated on `main`).** `public/card-art` (264MB)
  and future `public/proof-outcomes/` are static assets;
  `next.config.ts` `outputFileTracingExcludes` keeps art out of the
  card-art function bundle (2026-08-20 deploy broke at 266MB vs the 250MB
  ceiling without it). If a deploy fails, `npx vercel inspect --logs <url>`.
- **Authoring:** `/studio/cards` (CRAFT) and `/studio/picture` (PICTURE),
  development-only, 404 in production, loopback Host + same-origin + intent
  header on writes. SONIC has no studio and no pack file yet.
- **Skills:** two homes (STANDARDS §3.4): `.agents/skills/` Codex (36),
  `.claude/skills/` Claude Code (15); never cross-install, never modify the
  Codex home from Claude Code. Refresh procedure: `SKILL_VERSIONS.md` → How
  to refresh a pin.
- **Headless preview gotchas:** lazy card images; screenshots need the pane
  visible; 0×0 viewport (call resize_window; assert computed styles,
  dispatch .click()); Next image `src` is URL-encoded; navigate with the
  navigate tool (location.href from an eval can land on `/`).
- **Editing JSON catalogs programmatically:** node with `utf8`; PowerShell
  Get/Set-Content mangles non-ASCII. Repo files are CRLF (`core.autocrlf`
  true) — patch scripts must match `\r?\n`. Long heredocs into bash break;
  use the Write tool for big files.

## Built

**Seven tools** in `src/lib/tool-registry.ts`, plus two unregistered
authoring surfaces.

- **CRAFT Deck** (`prompt-builder`): C.R.A.F.T. prompts from card choices —
  35 roles, 32 lineages ×4 grades, 25 archetypes, library/share/sessions/
  dictation/proof lab, the world picker (3 illustrated worlds), the
  dev-only art-queue mode, and the Outcome Lab (dock Prompt|Outcome switch;
  answers pending generation, above). Credits Lawton Solutions.
- **PICTURE Deck** (`picture-deck`): P.I.C.T.U.R.E. image prompts — 100
  lineages ×3 grades, 18 archetypes, Midjourney tail, 426/426 gallery art.
  Credits Midjourney's documentation.
- **SONIC Deck** (`sound-deck`): S.O.N.I.C. sound-effect prompts for Adobe
  Firefly — 38 lineages ×3 grades, 12 archetypes, Emphasis dial, ambience
  mode, layer rack; comma-term prompts (`sound, term, term`); no art yet.
  Credits Adobe Firefly's guidance. Gates owed (Now).
- **Architect Wizard** (React Flow canvas, "Arc"), **Image Editor**,
  **Vector Editor**, **Skills Wiki**: unchanged. Per the board vision, these
  four are the ones that would move to a separate project.
- **Card Studio** (`/studio/cards`, `/studio/picture`): facet tabs, art
  workflow + bio editor, "Generate more" queue button.

**The art-pack model** (`docs/ARCHITECTURE.md` §1): four packs complete —
sci-fi, fantasy, superhero (226 each), gallery (426) — 1,104 images. SONIC
will use the same model when its pack is authored.

**The outcome model**: catalog-independent. Scenarios (fixed context+target)
live in data; combinations are enumerated, composed, and asked offline by
`scripts/outcome-batch.mjs`; answers are static shards keyed by
sorted-lineage-id combo keys; the app is a pure reader.

**The governance layer** (stack v2, adapted): AGENTS.md (phases, gates,
documents table, rules) → `docs/STANDARDS.md` (consent-gated) → judgment
gates in `.claude/agents/` + deterministic halves in `scripts/check-*.mjs`
→ ledgers in `.ai/notes/` → `docs/adr/` for decisions → `.claude/rules/`
path-scoped reminders for Claude Code.

## Backlog / in flight

- **Commit this session's tree** (governance, docs, rules, ADRs, the vision
  doc, README/CONTEXT drift, two skill-folder changes) — Sean's call, then
  the push decision for all of `93c1672`..HEAD.
- **SONIC deck paperwork owed:** run the integration, security, and design
  gates on `211f122`'s surface, save the three reports, add the deck's
  section to `docs/DESIGN_DIRECTION.md` and its vocabulary to `CONTEXT.md`,
  author its art pack (`src/data/sound-deck/art-themes/`, `theme.draft`
  until complete).
- **Pinned, top of the paid queue: Outcome Lab generation** (see Now — needs
  a fresh key, credits, and Sean's pick). Then commit the landed shards,
  spot-check quality, and later `dreams` / `evolution` by the same command.
- **The board vision** (`docs/BOARD_VISION.md`): waiting on the owner's two
  inputs; then the clarifying interview → design layer → ADRs for the
  split. Everything under "Next" below predates it and may be superseded.
- PICTURE deck artQueue wiring (the workbench seam already accepts it;
  ~5 lines) if Sean wants gallery cards queueable too.
- **Next (unchanged, pre-vision):** per-model output formatter; Pip-Decks-
  style restyle; the idea-making deck.
- **Pending amendments** (`npm run amendments`, owner consent): 28 flagged
  before this session; the sessions agent adds (n) skill-folder pruning,
  (o) `.claude/rules/` in §3.3's file set, (p) stack bundles merged by
  hand, never applied. (k) probe-gated paid generation, (l) DESIGN_DIRECTION
  coverage for the dock's second view / scenario switch / authoring mode,
  and (m) origin checks on write handlers are still open from 2026-09-01.
- **Non-blocking, accepted:** art-pack.ts imports scripts/art-pack.mjs;
  first-paint flash for non-default pack/dock users; module-level
  active-pack singleton; the Skills wiki still lists `karpathy-guidelines`
  (true for the Codex home).
- **Pre-existing, still open:** Filters/"Adjust" dialog onto EditorDialog;
  `.image-editor-title-input` focus pattern; statusbar portal idiom chip;
  agent-eval fixtures vs the gates; proofDraft schema widening;
  `restoreDraft` degradation unit test; vector "Later" list; `npm run
  amendments` line-wrap fragility (its output splits flags mid-sentence);
  `writeStoredOrThrow` for architect save.

## Pointers

- Framework contract: `docs/ARCHITECTURE.md`. Rules: `docs/STANDARDS.md`.
  Operating rules and phases: `AGENTS.md`. History:
  `.ai/notes/SESSIONS.md` (newest-first). Decisions: `docs/adr/`. Gate
  ledger: `.ai/notes/gate-reports/`. Domain language: `CONTEXT.md`. The
  next major change: `docs/BOARD_VISION.md`.
- Stack: `docs/AI_STACK.md` (catalog + Stack changelog), `docs/SETUP.md`
  (commands), `.ai/notes/SKILL_VERSIONS.md` (pins, both homes, the Claude
  set's local modifications and removals).
- Outcome Lab: `src/lib/outcome-lab.ts` (core), `scripts/outcome-batch.mjs`
  (pipeline), `src/data/prompt-builder/outcome-scenarios.json` (the three
  questions), `src/components/prompt-outcome-lab.tsx` (reader UI).
- SONIC: `src/data/sound-deck/` (catalog + README with the Firefly rules),
  `src/lib/sound-prompt.ts` (composer), `src/components/sound-deck.tsx`.
- Art briefs: `docs/CRAFT_ART_*.md` (3×226), `docs/PICTURE_ART_MANIFEST.md`
  (426).
- `npm run amendments` shows the consent queue; `npm run gate:sweep` stamps
  `.ai/notes/gate-status.json` and warns when this page goes stale.
