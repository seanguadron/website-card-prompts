# State

Last rewritten 2026-11-19.

## Now

Card Prompts opens directly in CRAFT. The left library offers archetypes, section cards and CRAFT roles. The CRAFT editorial proposal is in docs/CRAFT_CONTENT_PROPOSAL.md and awaits owner review before catalog or art changes. All three deck workspaces span the window. GitHub and origin point to seanguadron/website-card-prompts. The September split removed Architect, Image, Vector, and the Skills wiki. Existing browser storage keys remain compatible with saved hands. The shared Output dock offers a one-off prompt or SKILL.md. The skill applies reusable card choices to a new brief.

## Runbook

- **Start:** `Start.bat` or `npm run dev`, port 5100. Never start a
  second dev server if one is running; verify inside the running one (prefer
  the preview tools; `preview_start {name: "card-prompts"}` starts it if truly
  down). Never `npm run build` while a dev server may be live (shared
  `.next/`). **Routes:** `/tools/prompt-builder`, `/tools/picture-deck`,
  `/tools/sound-deck`; dev-only `/studio/cards`, `/studio/picture`.
- **Checks:** `npm run typecheck` · `lint` · `test` ·
  `data:validate` · `check:standards && check:security`.
- **The board, hands on:** drag an archetype from the left tray onto the board or click it;
  `]` / `[` next and previous board, `0` fit, `-` / `=` zoom, wheel zooms to the cursor, left-drag pans across board backgrounds, Space+drag or the middle button pans from
  anywhere, arrows pan when the pasteboard itself is focused; Fit and All in
  the bottom-left bar; the Board/Flow switch in the nav dock. Board world
  constants (`BOARD_WIDTH` 1280, `BOARD_GAP` 200, scale 0.08–2) live in
  `src/lib/board-layout.ts`.
- **Verifying the board in the Browser pane:** the pane scales a 1440×900
  emulation down, so clicks by ref can miss; drive interactions with
  dispatched DOM events and read state back (`.deck-board-world` transform,
  `data-zoom`, `.is-active` surface index). Lazy card images may not load in
  the pane. Reset with `resize_window` preset desktop when done.
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

- The owner authorized publishing the release on main. The production build passed, and the local browser downloaded each deck's skill and matched it to its preview. The release includes the September split and board. The setup hand uses native keyboard button activation and pointer dragging. The shared tray can collapse independently of Output. Select a section to drag individual cards to its slots. Hover or focus to inspect a card. On narrow screens it becomes a horizontal strip. Browser verification covered all three decks at 3840 by 2160, gray-surface panning, wheel zoom and drops from the tray while viewing a section.
- The board still owes a manual screen-reader pass. SONIC lacks an illustrated art pack and its original deck-wide design paperwork.
- Outcome Lab remains paused pending credits, a fresh key, and the owner's choice of generation budget. Keep the small probe before a full paid run.
- Review findings and deck-by-deck product recommendations are in docs/DECK_REVIEW.md.
- Prior decisions and outstanding amendment proposals are in the sessions ledger. Use the gate reports for the November review and fixes.
