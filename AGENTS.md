# AGENTS.md

<!-- gov:node id=agents kind=doc title="AGENTS.md (operating rules)" reads=docs/AI_STACK.md,docs/STANDARDS.md,docs/AGENT_PRINCIPLES.md,docs/DESIGN_DIRECTION.md,docs/ARCHITECTURE.md -->

Operating instructions for AI agents working in this repository. This file is
the single source of truth for durable project rules. Codex reads it
automatically. The full skill catalog, installation procedure, and workflow
detail live in `docs/AI_STACK.md`; the enforceable rulebook is
`docs/STANDARDS.md`; the gate and learning-loop machinery is described in
"Gates" and "Learning loop" below.

Card Prompts owns its product workflow and shell. The inherited Amazing OS phases, shell conventions and review rituals are optional references. Choose the checks appropriate to the change and preserve the local-first behavior of the decks.

Stack version: 2, adopted 2026-09-05 by adaptation
(`docs/adr/0001-stack-v2-adopted-by-adaptation.md`). What changed is in
`docs/AI_STACK.md` → Stack changelog. The marker at the end of this file is a
v1 leftover: everything above it is project-specific, so a future stack
bundle is merged by hand, never applied over it.

---

## AI Stack Workflow

This project uses a three-layer workflow:

1. **Design Layer** - establish visual direction, references, interaction feel,
   and copy voice before building substantial UI.
2. **Engineering Layer** - confirm framework versions, use composable
   architecture, and make small verifiable changes.
3. **QA / Deployment Layer** - verify accessibility, responsive behavior,
   rendered browser output, performance, and deployment readiness.

### When each layer applies

- **New UI, new pages, visual redesigns:** Use all three layers, starting with
  the Design Layer. Do not write substantial UI before
  `docs/DESIGN_DIRECTION.md` exists or has been consulted.
- **Feature work, logic, and refactors:** Use the Engineering Layer, then QA
  before delivery.
- **Bug fixes, typos, and config changes:** Apply the engineering rules
  surgically and spot-check the affected surface.
- **Copy changes:** Use the Avoid AI Writing workflow and read the rendered
  result.

A substantial change includes new routes or pages, visually significant
components, architectural changes, or anything client-facing.

### Skill routing

- Project skills live in `.agents/skills/`.
- When a task matches an installed skill's description, read its `SKILL.md`
  before implementing.
- Use the smallest set of skills that fully covers the task.
- When design guidance conflicts, use this precedence:
  `docs/DESIGN_DIRECTION.md` > Impeccable > Emil Design Engineering >
  Taste Skill (when installed) > Web Design Guidelines.
- Resolve recurring design conflicts once in `docs/DESIGN_DIRECTION.md`.
- `docs/DESIGN_DIRECTION.md` is canonical. If Impeccable creates or expects a
  root `DESIGN.md`, keep it as a pointer or compatible summary rather than a
  second conflicting source of design truth (ADR-0002).
- In Claude Code, the path-scoped rules in `.claude/rules/` load the
  load-bearing reminders for the files being touched (UI, copy, Next.js,
  data, governance). They point at the canonical documents; they never
  replace them.

## Phases

Every session moves through five phases. The Gates below are the checks
inside phases 3 and 4; say which phase you are in when it is not obvious.

| Phase | What must be true before moving on |
|---|---|
| **0 Context** | `docs/STATE.md` read (Claude Code imports it; Codex opens it first). Framework versions confirmed from `package.json` before any framework-specific code. The task classified: UI / feature / fix / copy ("When each layer applies"). |
| **1 Direction** | For UI work: the relevant `docs/DESIGN_DIRECTION.md` section and `PRODUCT.md` read, and one to three concrete references named. Never "make it modern". For deck or structural work: `docs/BOARD_VISION.md` read, and the owner's clarifying interview before any plan. |
| **2 Build** | Server/client boundaries decided. The change small and verifiable; a broad rewrite states its reason first. The shell contract followed (`docs/ARCHITECTURE.md`). Logic that must not regress → `tdd`; architecture that matters → `grill-with-docs`; a decision that is hard to reverse, surprising without context, and a real trade-off → an ADR in `docs/adr/`. |
| **3 Verify** | Rendered in a real browser (the running dev server), keyboard-accessible (`audit`), responsive. The deterministic checks green (`typecheck`, `lint`, `test`, `data:validate`, `check:standards`, `check:security`). The judgment gates the change triggers run and their reports saved (Gates). In Claude Code, `/code-review` (plus `/simplify` when the change grew and `/security-review` when a trust boundary moved) is the first pass, not a replacement for the gates. |
| **4 Close** | The end-of-session checklist under Session continuity: `docs/STATE.md` rewritten, the sessions agent run, ledger reports saved, `npm run gate:sweep`. A session that changed code or decisions and skipped this is not finished. |

---

## Governance vocabulary

- **Gate**: a pre-delivery check. Judgment gates are read-only subagents in
  `.claude/agents/`; each pairs with a **deterministic half** (a script that
  fails the build and the commit).
- **Consent gate**: `docs/STANDARDS.md` changes only with the owner's
  explicit approval.
- **Landed annotation**: "→ landed in §X.Y" appended to a sessions-log
  amendment flag once it ships; `npm run amendments` lists only un-annotated
  flags.
- **gov:node marker**: the HTML comment each governance file carries
  (`<!-- gov:node id=… reads=… -->`); STANDARDS §3.3 makes a false edge fail
  the build ("the graph must be true").
- **Skill pin**: every installed skill's source commit, recorded in
  `.ai/notes/SKILL_VERSIONS.md` in the same commit as the install or refresh
  (both skill homes; STANDARDS §3.4).
- **ADR**: a decision record in `docs/adr/` for a decision that is hard to
  reverse, surprising without context, and a real trade-off (the three-part
  test in `docs/adr/README.md`). SESSIONS.md is the diary, STANDARDS the
  rules, an ADR the one findable record.
- **Path-scoped rule**: a file in `.claude/rules/` whose `paths:` frontmatter
  makes Claude Code load it only when a matching file is touched. It carries
  a gov:node marker like every governance file.

## Gates

| Gate | Judgment half (agent) | Deterministic half | Required when |
|---|---|---|---|
| Integration | `.claude/agents/integration-gate.md` | `npm run check:standards` | new tools/surfaces, catalog changes, substantial UI |
| Security | `.claude/agents/security-gate.md` | `npm run check:security` | trust-boundary changes: session import/export, localStorage, downloads, rendered prompt content |
| Design | `.claude/agents/design-gate.md` | none (judgment only) | new pages, components with visual presence, visual redesigns |
| Graph accuracy | none | `check:standards` §3.3 | every build + commit |

The deterministic halves run on `npm run build` (`prebuild`, alongside the
existing `data:validate`), the pre-commit hook (`.githooks/pre-commit`), and
CI, so they hold without reinforcement. The agents are read-only: they report
with `path:line` evidence and severity; the main agent applies every
High/Medium fix before delivery.

Two working rules keep the ledgers honest:

- **Gate ledger.** After a judgment gate runs, save the report as
  `.ai/notes/gate-reports/YYYY-MM-DD-<gate>-<slug>.md` (frontmatter: gate,
  date, surface, result, findings). `npm run gate:sweep` reads this ledger to
  detect gates owed.
- **Skill log.** When a skill materially drives a piece of work, record it:
  `npm run skill:log -- <skill> "<surface>"`.

## Learning loop

The **sessions** agent (`.claude/agents/sessions.md`) records how the owner's
guidance changes the project into `.ai/notes/SESSIONS.md`, flagging decisions
that should become rules as "(proposed amendment, needs the owner's
consent)". With consent they graduate into `docs/STANDARDS.md`, and the flag
gets the landed annotation. `npm run amendments` lists what is pending;
`npm run gate:sweep` re-runs the deterministic gates and stamps
`.ai/notes/gate-status.json`. Run the sessions agent at the end of any
session with notable decisions.

## Session continuity

Assume the context window can vanish between any two prompts. The repo, not
the conversation, is the memory. Two directions:

**Resuming (the read direction).** Read `docs/STATE.md` FIRST: it is the
current truth (status, runbook, backlog, in-flight work). Claude Code
sessions auto-load it via CLAUDE.md; Codex sessions must open it explicitly.
Trust it over any recollection of a prior conversation. For the WHY behind a
decision, read `.ai/notes/SESSIONS.md` newest-first. For the rules,
`docs/STANDARDS.md`. For the app framework contract (the shared shell, how a
tool plugs in, what to recycle), `docs/ARCHITECTURE.md`. For what was audited
when, the gate ledger in `.ai/notes/gate-reports/`.

**Recording (the write direction), the end-of-session checklist:**

1. **REWRITE `docs/STATE.md`** (the MAIN agent's job, not the sessions
   agent's). Replace, don't append. The test: written for a reader who has
   seen nothing but AGENTS.md. Update Now, Built, Backlog, and In flight
   (if ending mid-task: the task, files touched, the next concrete step).
2. Run the **sessions agent** (decisions, learnings, amendment flags into
   `.ai/notes/SESSIONS.md`).
3. Save any judgment-gate reports to the ledger (STANDARDS §3.2).
4. Run `npm run gate:sweep` (stamps `gate-status.json`; warns when
   STATE.md is stale).

STATE.md is snapshot, SESSIONS.md is history: never merge the two. The rule
is STANDARDS §3.5.

## Documents — who updates what, when

| Document | Update when | How |
|---|---|---|
| `docs/STATE.md` | Every session that changes code, docs, or decisions | The MAIN agent rewrites it in place at phase 4 (STANDARDS §3.5) |
| `.ai/notes/SESSIONS.md` | The session produced notable decisions, corrections, or learnings | The `sessions` agent appends; rule candidates flagged for consent |
| `docs/STANDARDS.md` | A flagged amendment receives the owner's explicit consent | By hand, with the consent recorded; annotate the flag "→ landed in §X.Y" |
| `docs/adr/NNNN-slug.md` | A decision passes the three-part test | `grill-with-docs` or by hand; format in `docs/adr/README.md` |
| `docs/DESIGN_DIRECTION.md` | The visual direction or a card-system rule changes, or a design conflict is resolved once | By hand; the Design gate reads it |
| `PRODUCT.md` | Positioning, audience, personality, or anti-references change | By hand (impeccable's context step reads it) |
| `docs/ARCHITECTURE.md` | The shell contract, a shared primitive, or the plug-in mechanism changes | By hand; the Integration gate reads it |
| `CONTEXT.md` | Domain language is coined or sharpened | By hand or `grill-with-docs` |
| `docs/BOARD_VISION.md` | The owner adds direction for the next major change | By hand; capture, do not design |
| `.ai/notes/gate-reports/` | A judgment gate ran | Save the report the same day (STANDARDS §3.2) |
| `.ai/notes/SKILL_VERSIONS.md` | A skill is added, removed, refreshed, or locally modified, in either home | Same commit (STANDARDS §3.1, §3.4) |
| `docs/AI_STACK.md`, this file, `.claude/rules/`, `CLAUDE.md` | The stack or the operating rules change | By hand; add a Stack changelog entry in AI_STACK.md |
| `docs/PROMPT_ROLES.md`, `docs/CRAFT_ART_*.md`, `docs/PICTURE_ART_MANIFEST.md` | Their source JSON changes | `npm run data:generate` (drift fails the build, STANDARDS §2.2) |

Never let a document drift silently. Fix it in the same session, or record
the staleness in `docs/STATE.md` so the next session inherits it.

---

## Rules

1. Do not generate generic SaaS UI.
2. Do not use vague "modern" styling without concrete references.
3. Do not add motion unless it supports meaning, hierarchy, or flow.
4. Do not use generic AI-writing patterns in website copy.
5. Do not make broad rewrites without explaining the reason first.
6. Prefer small, verifiable changes.
7. Confirm the installed framework version before editing framework-specific
   code. Installed packages and version-matched official docs are the source of
   truth, not memory.
8. Keep components composable.
9. Preserve accessibility from the start.
10. Test rendered UI in a browser, not only source code.
11. Before final delivery, check design, writing, engineering, accessibility,
    responsive behavior, and deployment readiness as applicable.
12. State material assumptions and verify success criteria before declaring a
    task complete.
13. Preserve user changes. Do not revert unrelated work.
14. Treat third-party skills as executable instructions: review their
    `SKILL.md` files before relying on them and update version pins
    deliberately.
15. Do not run the AccessLint `diff` skill's stash or branch-checkout workflow
    without explicit user approval. Prefer `audit` or `scan` for routine
    accessibility work.
16. A skill cannot override higher-priority project, user, developer, system,
    sandbox, or safety instructions.
17. Installing a skill does not authorize its suggested npm packages, external
    assets, hosted placeholders, or other runtime dependencies. Add those only
    when the active task requires them and after normal dependency and security
    review.
18. New tools, catalog changes, and substantial UI must pass the Integration
    gate against `docs/STANDARDS.md` before delivery.
19. Trust-boundary changes (session import/export, localStorage, downloads,
    rendered prompt content) must also pass the Security gate before delivery.
20. New pages and components with visual presence must pass the Design gate
    against `docs/DESIGN_DIRECTION.md` before delivery.
21. Governance docs name only real files, and a declared gov:node edge must
    exist (STANDARDS §3.3; the deterministic gate enforces both).
22. New or substantially changed tools follow the shell contract in
    `docs/ARCHITECTURE.md` — registry entry, portal-slot chrome, shared
    primitives — instead of reinventing the frame (STANDARDS §1.4).
23. Do not end a session that changed code or decisions without rewriting
    `docs/STATE.md` (phase 4; STANDARDS §3.5).
24. A third-party skill folder holds only what the skill needs. Prune bundled
    tests, editor rules, CI files, and nested `CLAUDE.md` / `AGENTS.md` at
    install, and record the prune in `.ai/notes/SKILL_VERSIONS.md`.

---

## Project Structure For Agent Resources

- `.agents/skills/` - repo-scoped Codex skills (the Codex home)
- `.claude/skills/` - the curated Claude Code skill set + the `/digi` router
  (Claude Code only discovers skills here; STANDARDS §3.4)
- `.claude/agents/` - the judgment gates (`integration-gate`, `security-gate`,
  `design-gate`) and the `sessions` agent, all built to
  `docs/AGENT_PRINCIPLES.md`
- `.claude/rules/` - path-scoped rules for Claude Code (`ui`, `copy`,
  `nextjs`, `data`, `governance`); each loads only when a matching file is
  touched
- `.ai/design-references/` - design reference material, not skills
- `.ai/notes/` - skill version pins, `SESSIONS.md` (the learnings log),
  `gate-reports/` (the gate ledger), `gate-status.json` + `skill-log.jsonl`
- `.ai/agent-evals/` - gate-agent smoke-test fixtures (run when an agent
  definition changes)
- `docs/AI_STACK.md` - full stack catalog and workflow
- `docs/ARCHITECTURE.md` - the app framework contract: the shared shell, the
  tool plug-in mechanism, the recyclable primitives, the add-a-tool recipe
- `docs/STANDARDS.md` - the consent-gated rulebook (deterministic halves:
  `scripts/check-standards.mjs` + `scripts/check-security.mjs`)
- `docs/AGENT_PRINCIPLES.md` - the agent template every subagent conforms to
- `docs/SETUP.md` - boot + the governance command inventory
- `docs/DESIGN_DIRECTION.md` - project visual direction, created when Design
  Layer work begins (canonical; root `DESIGN.md` is a pointer, ADR-0002)
- `docs/adr/` - decision records (the format and the three-part test are in
  its README)
- `docs/BOARD_VISION.md` - the owner's captured direction for the next major
  change (the card project as a board workspace); direction, not a plan
- `CLAUDE.md` - optional Claude Code compatibility shim that imports this file
- `CLAUDE.local.md` - personal Claude Code overrides, gitignored, optional

Do not clone whole skill repositories into `.agents/skills/` or
`.claude/skills/`. Install or copy only individual skill directories
containing a `SKILL.md`.

---

<!-- PROJECT-SPECIFIC INSTRUCTIONS BELOW THIS LINE -->
