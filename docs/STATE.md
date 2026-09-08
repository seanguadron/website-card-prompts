# State

The current-state snapshot. REWRITTEN in place at the end of every working
session (AGENTS.md, Session continuity; STANDARDS §3.5). Written for a reader
with zero prior context: if you have seen nothing but AGENTS.md (or CLAUDE.md
in a Claude Code session), this page tells you where the project stands, how
to run it, and what comes next. History and the why live in
`.ai/notes/SESSIONS.md`; this page is only what is true now.

Last rewritten: 2026-09-08 (the split-and-board session, Claude Fable 5.1;
work landed 2026-09-05, gates closed 2026-09-08 after a process restart).

## Now

**This is the card project, and every deck opens on a board.** Two things
happened on the owner's instruction ("split the project in two", "implement
the vision all the way, use your best judgment"):

- **The split** (`5686976`, `docs/adr/0003-split-into-two-projects.md`):
  the three decks (CRAFT, PICTURE, SONIC), the Card Studio, the card-art
  endpoint, the art packs, and the generation pipeline stayed here; the
  Architect Wizard, Image Editor, Vector Editor, and Skills wiki moved to the
  sibling project **`W:\Local Files\Codex\DigiEditors`** (package
  `digi-editors`, port 5200, its own repository with two commits, **no remote
  yet**). Done by import closure; `@xyflow/react` dropped here; the four
  tools' CSS zones cut (`globals.css` 9,819 → 6,202 lines before the board).
- **The board** (`9d4b205`, `docs/adr/0004-board-is-a-second-container.md`):
  every deck renders the same panels in one of two containers, switched from
  the nav dock and remembered per browser (`src/lib/board-prefs.ts`): the
  **flow** (the old slider) or the **board**, now the default. The board is a
  pasteboard with a camera over a row of surfaces: the Setup board (guide +
  the **archetype socket**, whose drop or click builds every board out with a
  deal-in flip) then one board per section letter (sockets and the tuning
  console on top, the hand fanned below, the free-text field at the bottom).
  Grammar: `docs/DESIGN_DIRECTION.md` → The board. Contract:
  `docs/ARCHITECTURE.md` → "Two containers, one deck". Status and what is
  deliberately NOT built (free card placement, minimap, connectors, camera
  persistence, shuffles, card backs): `docs/BOARD_VISION.md` §7.

**Gates on the board** (ledger: `.ai/notes/gate-reports/2026-09-0{5,8}-*-deck-board.md`):
security PASS; integration PASS (its one judgment note, screen-reader scoping,
resolved by writing the model down: boards are never inerted, the framed one
is `aria-current`); design FAIL 2 high / 2 medium / 1 low, every finding
fixed and verified the same day. **Still owed:** a screen-reader pass with
the `audit` skill on board mode.

**Push state.** `origin/main` is at `c45c821` (pushed 2026-09-05 before the
split, on the owner's "push first"). Local `main` is ahead by the split, the
board, and this close-out. **Pushing deploys a decks-only, board-first site
to the live URL; the owner decides.**

**The owner's next move decides the next round:** his reaction to the board,
plus the two inputs he mentioned (a second inspiration codebase and
card-system references). Nothing further is planned until then.

**The SONIC Deck (`211f122`, 2026-09-01) still owes its paperwork**: the
integration, security, and design gates, a `docs/DESIGN_DIRECTION.md`
section, CONTEXT.md vocabulary, an art pack.

**⚠ PINNED (owner's direction): Outcome Lab data generation.** Unchanged:
first run wasted $80.64 on 58% empty answers (Opus 5, effort medium,
max_tokens 1200: adaptive thinking bills as output AND counts against the
cap); pipeline retuned to effort low / 2500 / `--limit N` probes. Blocked on
credits ($0), the owner's menu pick (~$7 singles+pairs on Opus / ~$25–35
Sonnet 5 full / ~$60–85 Opus 5 full), and a fresh API key (the one in
`.env.local` expired 2026-09-02; never commit or print it). Resume:
`npm run outcomes:batch -- origin-universe --submit --limit 40` → quote →
`--submit` → `--wait` → `--land`.

**Owed from Sean:** react to the board · push (or not) · create the
DigiEditors remote (rename first if "Digi Editors" is not the name) · confirm
the two STANDARDS edits in DigiEditors (§2.1, §2.2) · the Outcome Lab key +
credits + pick · AccessLint `.mcp.json` yes/no · skill refresh yes/no ·
whether the Codex home drops `karpathy-guidelines`.

## Runbook

- **Start:** `StartDigiTools.bat` or `npm run dev`, port 5100. Never start a
  second dev server if one is running; verify inside the running one (prefer
  the preview tools; `preview_start {name: "digitools"}` starts it if truly
  down). Never `npm run build` while a dev server may be live (shared
  `.next/`). **Routes:** `/tools/prompt-builder`, `/tools/picture-deck`,
  `/tools/sound-deck`; dev-only `/studio/cards`, `/studio/picture`.
- **Checks:** `npm run typecheck` · `lint` · `test` (146) ·
  `data:validate` · `check:standards && check:security`.
- **The board, hands on:** seat an archetype from the Setup board's hand;
  `]` / `[` next and previous board, `0` fit, `-` / `=` zoom, wheel pans,
  ctrl+wheel zooms to the cursor, Space+drag or the middle button pans from
  anywhere, arrows pan when the pasteboard itself is focused; Fit and All in
  the bottom-left bar; the Board/Flow switch in the nav dock. Board world
  constants (`BOARD_WIDTH` 1280, `BOARD_GAP` 200, scale 0.08–2) live in
  `src/lib/board-layout.ts`.
- **Verifying the board in the Browser pane:** the pane scales a 1440×900
  emulation down, so clicks by ref can miss; drive interactions with
  dispatched DOM events and read state back (`.deck-board-world` transform,
  `data-zoom`, `.is-active` surface index). Lazy card images may not load in
  the pane. Reset with `resize_window` preset desktop when done.
- **Claude Code specifics:** `.claude/rules/*.md` load by path; built-ins
  `/code-review`, `/simplify`, `/verify`, `/security-review`, `/run` are the
  first QA pass; the judgment gates in `.claude/agents/` still run where
  AGENTS.md requires. Background agents die with the process and
  `SendMessage` is not available in this build: relaunch, do not resume.
  `/impeccable` works without a junction; never `/impeccable init` (ADR-0002).
- **Decisions:** hard to reverse + surprising + a real trade-off → an ADR in
  `docs/adr/` (0001 stack v2, 0002 design direction, 0003 the split, 0004
  the board). Diary stays `SESSIONS.md`; rules stay `STANDARDS.md`.
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
- **Editing files programmatically:** node with `utf8`; PowerShell
  Get/Set-Content mangles non-ASCII. Repo files are CRLF (`core.autocrlf`
  true) — patch scripts must match `\r?\n`. Inline `node -e` scripts with
  apostrophes break bash quoting: write the script to a file and run it.
  Robocopy exit code 1 means "files copied". After deleting routes, clear
  `.next` or `typecheck` fails on stale generated types.

## Built

**Three decks** in `src/lib/tool-registry.ts`, each with a board view and a
flow view, plus two unregistered authoring surfaces.

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
- **The board** (`src/components/deck-board.tsx`, `src/hooks/use-board-camera.ts`,
  `src/lib/board-layout.ts` with 10 tests, `src/components/board-archetype-socket.tsx`,
  `src/lib/board-prefs.ts`, the `/* ===== Deck Board ===== */` CSS zone):
  the container described in Now; the three `*-flow-panels.tsx` build their
  panels once and hand them to either container.
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
→ ledgers in `.ai/notes/` → `docs/adr/` → `.claude/rules/` for Claude Code.

## Backlog / in flight

- **The next round of the board** starts from the owner's reaction and his
  two inputs. Candidates he may pick from: free card placement on the board,
  shuffles and card backs, a minimap, camera persistence, per-board notes,
  the shell (three bars) rethought for a workspace.
- **Push**, then the DigiEditors remote; the owner's calls.
- **Owed:** the `audit` skill's screen-reader pass on board mode; the SONIC
  deck's three gates, DESIGN_DIRECTION section, CONTEXT vocabulary, art pack.
- **Pinned: Outcome Lab generation** (Now).
- **Pending amendments** (`npm run amendments`, owner consent): 31 before this
  session; this session's entry adds (q) "opacity or transform only"
  clarified for hover/active states, (r) a new layout mode joins every
  existing breakpoint in the same change, (s) the DigiEditors STANDARDS edits
  await confirmation.
- **Dead CSS**: the interleaved Welcome/primitives range of `globals.css`
  intermixes the guide-page rules and the shared primitives; the next restyle
  sweeps it.
- **Non-blocking, accepted:** art-pack.ts imports scripts/art-pack.mjs;
  first-paint flash for non-default pack/dock/view users; module-level
  active-pack singleton; proofDraft schema widening; `restoreDraft`
  degradation unit test; `npm run amendments` line-wrap fragility; the
  output dock at <1100px overlays the nav dock (pre-existing, both views).

## Pointers

- Framework contract: `docs/ARCHITECTURE.md`. Rules: `docs/STANDARDS.md`.
  Operating rules and phases: `AGENTS.md`. History:
  `.ai/notes/SESSIONS.md` (newest-first). Decisions: `docs/adr/`. Gate
  ledger: `.ai/notes/gate-reports/`. Domain language: `CONTEXT.md`. The
  board direction and status: `docs/BOARD_VISION.md`.
- Stack: `docs/AI_STACK.md`, `docs/SETUP.md`, `.ai/notes/SKILL_VERSIONS.md`.
- Outcome Lab: `src/lib/outcome-lab.ts`, `scripts/outcome-batch.mjs`,
  `src/data/prompt-builder/outcome-scenarios.json`,
  `src/components/prompt-outcome-lab.tsx`.
- SONIC: `src/data/sound-deck/`, `src/lib/sound-prompt.ts`,
  `src/components/sound-deck.tsx`.
- Art briefs: `docs/CRAFT_ART_*.md` (3×226), `docs/PICTURE_ART_MANIFEST.md`
  (426).
- The sibling project: `W:\Local Files\Codex\DigiEditors` (its own STATE.md,
  SESSIONS.md, ADR-0003 copy, `docs/ROADMAP.md` for the editors).
