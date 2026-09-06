---
paths:
  - "AGENTS.md"
  - "CLAUDE.md"
  - "docs/STANDARDS.md"
  - "docs/STATE.md"
  - "docs/ARCHITECTURE.md"
  - "docs/AI_STACK.md"
  - "docs/SETUP.md"
  - "docs/AGENT_PRINCIPLES.md"
  - "docs/adr/**"
  - ".claude/agents/**"
  - ".claude/rules/**"
  - ".claude/skills/**"
  - ".ai/**"
  - "scripts/check-*.mjs"
  - "scripts/gate-sweep.mjs"
  - "scripts/pending-amendments.mjs"
---
<!-- gov:node id=rule-governance kind=rule title="Governance rules (path-scoped, Claude Code)" reads=docs/STANDARDS.md,docs/AGENT_PRINCIPLES.md,docs/adr/README.md -->

# Governance rules (loaded when the rulebook, agents, skills, or ledgers are touched)

## The consent gate

- `docs/STANDARDS.md` changes only with the owner's explicit consent.
  Agents PROPOSE by flagging a line in `.ai/notes/SESSIONS.md` that ends
  "(proposed amendment, needs the owner's consent)"; `npm run amendments`
  lists the open ones. When a rule lands, annotate the flag "→ landed in
  §X.Y". A rule that is no longer true is fixed with consent too, never
  silently.

## Snapshot versus history (STANDARDS §3.5)

- `docs/STATE.md` is rewritten in place by the MAIN agent at the end of
  every session, for a reader who has seen nothing but AGENTS.md. `.ai/notes/
  SESSIONS.md` is append-only history written by the `sessions` agent. Never
  merge the two. `docs/adr/` holds the individual decisions that pass the
  three-part test in `docs/adr/README.md`; SESSIONS.md links to them.

## The graph must be true (STANDARDS §3.3)

- Every governance file carries `<!-- gov:node id=… kind=… title=… reads=… -->`.
  Ids are unique; every `reads=` edge names a file that exists. A new
  governance doc, agent, or rule file gets a marker in the same change.
  `check:standards` scans `CLAUDE.md`, `AGENTS.md`, `docs/**`,
  `.claude/agents/**`, and `.claude/rules/**`.

## Ledgers

- Gate reports: `.ai/notes/gate-reports/YYYY-MM-DD-<gate>-<slug>.md` with
  frontmatter `gate`, `date`, `surface`, `result`, `findings`. `gate:sweep`
  reads file mtimes, so save the report the day the gate ran. Skipping a
  triggered gate is allowed only with the reason recorded in the nearest
  report.
- Skill pins: every skill directory in BOTH homes has a row in
  `.ai/notes/SKILL_VERSIONS.md`, updated in the same commit as any install,
  removal, refresh, or local modification (STANDARDS §3.1, §3.4).
- Skill usage: `npm run skill:log -- <skill> "<surface>"` when a skill
  materially drives the work.

## Two skill homes (STANDARDS §3.4)

- `.agents/skills/` is the Codex home; `.claude/skills/` is the curated
  Claude Code set. Never install into, prune, or delete from the Codex home
  in a Claude Code session; record any Claude-home change in the pin ledger.
- A third-party skill folder is executable instructions. Review its
  `SKILL.md` before relying on it, and keep only what the skill needs: prune
  bundled tests, editor rules, CI, and nested `CLAUDE.md` / `AGENTS.md` files
  at install (a nested `CLAUDE.md` shipped inside `avoid-ai-writing` until
  2026-09-05). Never clone a whole repository into a skill home.

## Agents

- Every `.claude/agents/*.md` conforms to `docs/AGENT_PRINCIPLES.md` and is
  read-only except `sessions` (which writes SESSIONS.md only). When an agent
  definition changes, run its fixture in `.ai/agent-evals/` and compare the
  report to the expected findings.

## The deterministic gates

- `check:standards` and `check:security` run on `prebuild`, the pre-commit
  hook, and CI. Never bypass with `--no-verify`; fix the finding or run the
  matching judgment gate. Changing a check script changes what the rulebook
  enforces, so say so in the sessions log.
