# State

The current-state snapshot. REWRITTEN in place at the end of every working
session (AGENTS.md, Session continuity; STANDARDS §3.5). Written for a reader
with zero prior context: if you have seen nothing but AGENTS.md (or CLAUDE.md
in a Claude Code session), this page tells you where the project stands, how
to run it, and what comes next. History and the why live in
`.ai/notes/SESSIONS.md`; this page is only what is true now.

Last rewritten: 2026-09-05 (the split, mid-session, Claude Fable 5.1; the
board work that follows rewrites it again).

## Now

**This is the card project.** On the owner's instruction the repository was
split in two today (`docs/adr/0003-split-into-two-projects.md`): the three
decks (CRAFT, PICTURE, SONIC), the Card Studio, the card-art endpoint, the
art packs, and the generation pipeline stayed here; the Architect Wizard,
Image Editor, Vector Editor, and Skills wiki moved to the sibling project
**`W:\Local Files\Codex\DigiEditors`** (package `digi-editors`, port 5200,
its own git repository, no remote yet). The split was done by import closure
so nothing shared broke: `@xyflow/react` dropped here; the Architect, Image,
Vector, and Skills CSS zones cut from `globals.css` (9,819 → 6,202 lines);
`docs/ROADMAP.md` (the editors' program) moved with them. Verified after the
split: `typecheck`, `lint`, `test` (136), `data:validate`, `check:standards`,
`check:security`, and `next build` (9 routes) all pass.

**Pushed before the split:** `c45c821` (stack v2 adoption, the board vision,
the SONIC drift fixes) is on `origin/main`, so the pre-split tree is on
GitHub. The split commit itself is local until the owner pushes; a push
deploys a decks-only site.

**In flight: the board.** The owner asked for the vision in
`docs/BOARD_VISION.md` to be implemented "all the way" for the card system,
using best judgment: a Miro-like, zoomable, pannable board workspace per
deck, with an archetype socket, section boards reached "next board", and
2.5D cards. The split was the first step; the board build starts now. If
this page still says "starts now", the board work was interrupted: check
`git status` for `src/components/board*` and `src/lib/board*`.

**The SONIC Deck (`211f122`, 2026-09-01) still owes its paperwork**: the
integration, security, and design gates (never run; the sweep flags them), a
`docs/DESIGN_DIRECTION.md` section, CONTEXT.md vocabulary.

**⚠ PINNED (owner's direction): Outcome Lab data generation.** Unchanged:
first run wasted $80.64 on 58% empty answers (Opus 5, effort medium,
max_tokens 1200: adaptive thinking bills as output AND counts against the
cap); pipeline retuned to effort low / 2500 / `--limit N` probes. Blocked on
credits ($0), the owner's menu pick (~$7 singles+pairs on Opus / ~$25–35
Sonnet 5 full / ~$60–85 Opus 5 full), and a fresh API key (the one in
`.env.local` expired 2026-09-02; never commit or print it). Resume:
`npm run outcomes:batch -- origin-universe --submit --limit 40` → quote →
`--submit` → `--wait` → `--land`.

**Owed from Sean:** push the split · create the DigiEditors remote · the
Outcome Lab key + credits + pick · AccessLint `.mcp.json` yes/no · skill
refresh yes/no · whether the Codex home drops `karpathy-guidelines`.

## Runbook

- **Start:** `StartDigiTools.bat` or `npm run dev`, port 5100. Never start a
  second dev server if one is running; verify inside the running one (prefer
  the preview tools; `preview_start {name: "digitools"}` starts it if truly
  down). Never `npm run build` while a dev server may be live (shared
  `.next/`). **Routes:** `/tools/prompt-builder`, `/tools/picture-deck`,
  `/tools/sound-deck`; dev-only `/studio/cards`, `/studio/picture`.
- **Checks:** `npm run typecheck` · `lint` · `test` (136) ·
  `data:validate` · `check:standards && check:security`.
- **Claude Code specifics:** `.claude/rules/*.md` load by path; built-ins
  `/code-review`, `/simplify`, `/verify`, `/security-review`, `/run` are the
  first QA pass; the judgment gates in `.claude/agents/` still run where
  AGENTS.md requires. `/impeccable` works without a junction; never
  `/impeccable init` (ADR-0002).
- **Decisions:** hard to reverse + surprising + a real trade-off → an ADR in
  `docs/adr/`. Diary stays `SESSIONS.md`; rules stay `STANDARDS.md`.
- **Outcome Lab pipeline:** `npm run outcomes:batch -- <scenario-id>` (dry
  plan) · `--submit [--limit N]` · `--wait` · `--land`. Scenario ids:
  `origin-universe`, `dreams`, `evolution`. Probe with `--limit 40` and read
  measured tokens before any full submit.
- **Art queue:** the studio button or the CRAFT deck's dev-only "Queue art"
  mode fill `.ai/notes/art-queue.json`; `npm run art:queue [-- --prompts|--json]`
  resolves it (nano_banana_pro · 2k · 1:1). Batch generation (Higgsfield
  MCP): `generate_image_batch` max 12 requests, `jobs_wait` max 12 jobs /
  15s cap; submit 12 → 4-5 min timer → poll → land → next 12.
- **If CSS edits stop taking effect** (Turbopack stale stylesheet): append a
  real change, let it recompile, remove it, hard-reload — or
  `npm run dev:clean` when the server can restart.
- **Deploys (Vercel, git-integrated on `main`).** `public/card-art` (264MB)
  and `public/proof-outcomes/` are static assets; `outputFileTracingExcludes`
  keeps art out of the card-art function bundle (250MB ceiling).
- **Authoring:** `/studio/cards` (CRAFT) and `/studio/picture` (PICTURE),
  development-only, 404 in production, loopback Host + same-origin + intent
  header on writes. SONIC has no studio and no pack file yet.
- **Skills:** two homes (STANDARDS §3.4): `.agents/skills/` Codex (36),
  `.claude/skills/` Claude Code (15); never cross-install, never modify the
  Codex home from Claude Code.
- **Headless preview gotchas:** lazy card images; screenshots need the pane
  visible; 0×0 viewport (call resize_window; assert computed styles);
  navigate with the navigate tool.
- **Editing JSON catalogs programmatically:** node with `utf8`; PowerShell
  Get/Set-Content mangles non-ASCII. Repo files are CRLF (`core.autocrlf`
  true) — patch scripts must match `\r?\n`. Inline `node -e` scripts with
  apostrophes break bash quoting: write the script to a file and run it.

## Built

**Three decks** in `src/lib/tool-registry.ts`, plus two unregistered
authoring surfaces.

- **CRAFT Deck** (`prompt-builder`): C.R.A.F.T. prompts from card choices —
  35 roles, 32 lineages ×4 grades, 25 archetypes, library/share/sessions/
  dictation/proof lab, the world picker (3 illustrated worlds), the
  dev-only art-queue mode, and the Outcome Lab (dock Prompt|Outcome switch;
  answers pending generation). Credits Lawton Solutions.
- **PICTURE Deck** (`picture-deck`): P.I.C.T.U.R.E. image prompts — 100
  lineages ×3 grades, 18 archetypes, Midjourney tail, 426/426 gallery art.
  Credits Midjourney's documentation.
- **SONIC Deck** (`sound-deck`): S.O.N.I.C. sound-effect prompts for Adobe
  Firefly — 38 lineages ×3 grades, 12 archetypes, Emphasis dial, ambience
  mode, layer rack; comma-term prompts; no art yet. Credits Adobe Firefly's
  guidance. Gates owed (Now).
- **Card Studio** (`/studio/cards`, `/studio/picture`): facet tabs, art
  workflow + bio editor, "Generate more" queue button.

**The art-pack model** (`docs/ARCHITECTURE.md` §1): four packs complete —
sci-fi, fantasy, superhero (226 each), gallery (426) — 1,104 images.

**The outcome model**: catalog-independent; scenarios in data, combinations
composed and asked offline by `scripts/outcome-batch.mjs`, answers as static
shards under `public/proof-outcomes/`, the app a pure reader.

**The governance layer** (stack v2, adapted): AGENTS.md (phases, gates,
documents table, rules) → `docs/STANDARDS.md` (consent-gated) → judgment
gates in `.claude/agents/` + deterministic halves in `scripts/check-*.mjs`
→ ledgers in `.ai/notes/` → `docs/adr/` (0001 stack v2, 0002 design
direction, 0003 the split) → `.claude/rules/` for Claude Code.

## Backlog / in flight

- **The board** (in flight, above). Design intent is in `docs/BOARD_VISION.md`;
  decisions taken during the build get ADRs.
- **Push the split**; the owner's call (deploys a decks-only site).
- **SONIC paperwork owed** (Now).
- **Pinned: Outcome Lab generation** (Now).
- **Dead CSS**: the interleaved Welcome/primitives range of `globals.css`
  still carries no editor rules (the Skills block was cut), but the guide
  page rules and the shared primitives are intermixed; the next restyle
  sweeps it.
- **Pending amendments** (`npm run amendments`, owner consent): 31 flagged,
  including (n) skill-folder pruning, (o) `.claude/rules/` in §3.3,
  (p) stack bundles merged by hand.
- **Non-blocking, accepted:** art-pack.ts imports scripts/art-pack.mjs;
  first-paint flash for non-default pack/dock users; module-level
  active-pack singleton; proofDraft schema widening; `restoreDraft`
  degradation unit test; `npm run amendments` line-wrap fragility.

## Pointers

- Framework contract: `docs/ARCHITECTURE.md`. Rules: `docs/STANDARDS.md`.
  Operating rules and phases: `AGENTS.md`. History:
  `.ai/notes/SESSIONS.md` (newest-first). Decisions: `docs/adr/`. Gate
  ledger: `.ai/notes/gate-reports/`. Domain language: `CONTEXT.md`. The
  board direction: `docs/BOARD_VISION.md`.
- Stack: `docs/AI_STACK.md`, `docs/SETUP.md`, `.ai/notes/SKILL_VERSIONS.md`.
- Outcome Lab: `src/lib/outcome-lab.ts`, `scripts/outcome-batch.mjs`,
  `src/data/prompt-builder/outcome-scenarios.json`,
  `src/components/prompt-outcome-lab.tsx`.
- SONIC: `src/data/sound-deck/`, `src/lib/sound-prompt.ts`,
  `src/components/sound-deck.tsx`.
- Art briefs: `docs/CRAFT_ART_*.md` (3×226), `docs/PICTURE_ART_MANIFEST.md`
  (426).
- The sibling project: `W:\Local Files\Codex\DigiEditors` (its own STATE.md,
  SESSIONS.md, and ADR-0003 copy).
