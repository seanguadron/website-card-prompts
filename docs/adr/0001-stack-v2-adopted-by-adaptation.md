# Stack v2 was adopted by adaptation, not by running the upgrade bundle

Status: accepted · 2026-09-05

The Digi AI Stack v2 bundle (`UPGRADE_INSTRUCTIONS.md` + `stackv2upgrade.zip`,
built from the WebGamingPlatform project) replaces everything above a marker
in `AGENTS.md`, moves the design direction to root `PRODUCT.md`/`DESIGN.md`,
gitignores `.agents/`, installs a junction for impeccable, and adds Gates 0–4,
`docs/adr/`, `.claude/rules/`, and a documents table. This repository had
already gone further than v2 on the governance side (a consent-gated
`docs/STANDARDS.md`, three judgment gates with deterministic halves wired to
build/commit/CI, the sessions log, the gate ledger, two pinned skill homes),
so applying the bundle as written would have deleted those sections. We took
v2's genuine improvements and left the rest.

**Taken.** Path-scoped `.claude/rules/` (ui, copy, nextjs, plus data and
governance written for this repo); `docs/adr/`; the documents-ownership
table and a phases sequence in `AGENTS.md`; a stack changelog in
`docs/AI_STACK.md`; Claude Code built-ins as the QA layer's first pass;
`karpathy-guidelines` removed from the Claude Code set (it duplicated
AGENTS.md rules 5, 6, and 12); `avoid-ai-writing` pruned to `SKILL.md` +
`LICENSE` in the Claude home (upstream ships tests, cursor rules, CI, and a
nested `CLAUDE.md`); `CLAUDE.local.md` and `.impeccable/live/` gitignored;
`check:standards` now walks `.claude/rules/` for gov:node markers.

**Not taken, and why.** The bundle's replace-above-the-marker mechanism:
`AGENTS.md` still carries the v1 marker at its very end, so everything in
the file sits above it and would have been replaced. A future bundle is
merged by hand, not applied. `docs/DESIGN_DIRECTION.md` stays canonical
(ADR-0002). `.agents/` is NOT gitignored: here it is the committed Codex
skill home (STANDARDS §3.4), so no impeccable junction is needed either;
`.agents/skills/impeccable` is a real directory and its `context.mjs`
already runs. `karpathy-guidelines` and the unpruned `avoid-ai-writing` stay
in the Codex home, which Claude Code sessions do not modify. No
`docs/CHANGELOG.md`: git history plus `.ai/notes/SESSIONS.md` already serve,
and the app has no external release audience. The AccessLint `.mcp.json`,
new or refreshed skill installs, and the Playwright prerequisites are left
for the owner: they are persistent configuration or third-party code that
needs review.

**Consequences.** The v2 verify checklist (13 skills, junction, marker) does
not describe this repository; the Claude Code set is 15 skills and the pin
ledger's Claude-bridge section is the source of truth. A future stack
version is integrated the same way: diff it against what is here, take
improvements, record the decision.
