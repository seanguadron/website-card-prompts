# CLAUDE.md

@AGENTS.md
@docs/STATE.md

<!--
Claude Code compatibility only. Codex reads AGENTS.md directly.

Add only Claude-Code-specific notes below. Do not duplicate AGENTS.md rules or
paste docs/AI_STACK.md content here.
-->

## Claude Code notes

- **Skills**: Claude Code discovers skills ONLY in `.claude/skills/` — the
  curated set bridged from `.agents/skills/` plus the `/digi` router
  (STANDARDS §3.4). The Codex set in `.agents/skills/` is invisible here;
  never install into it, prune it, or delete from it in a Claude Code session.
- **Path-scoped rules** live in `.claude/rules/` (`ui`, `copy`, `nextjs`,
  `data`, `governance`). They load only when you touch matching files and
  point at the canonical docs; do not duplicate them in AGENTS.md.
- **Agents**: the judgment gates + sessions agent live in `.claude/agents/`
  (integration-gate, security-gate, design-gate, sessions). Run them per
  AGENTS.md → Gates; save reports to the gate ledger.
- **Built-ins** are the QA layer's first pass: `/code-review`, `/simplify`,
  `/verify`, `/security-review`, `/run`. Prefer them over installing
  overlapping skills; they do not replace the judgment gates.
- **Design skill**: `/impeccable <command> [target]`. Its
  `node .agents/skills/impeccable/scripts/context.mjs` works here because
  `.agents/skills/impeccable` is the real Codex-home copy (no junction). It
  prints `PRODUCT.md`; `docs/DESIGN_DIRECTION.md` stays canonical and root
  `DESIGN.md` is a pointer (ADR-0002). Never run `/impeccable init`.
- **Dev server**: port 5100 (`npm run dev` / Start.bat). If one is
  already running, never start a second — verify in the running one (prefer
  the preview tools; the `.claude/launch.json` entry is `digitools`). Do not
  run `npm run build` while a dev server may be live; the two share `.next/`.
- **Governance commands**: `check:standards`, `check:security`, `gate:sweep`,
  `amendments`, `skill:log` (see `docs/SETUP.md`).
- **This is the card project.** Since 2026-09-05 (ADR-0003) the Architect
  Wizard, Image Editor, Vector Editor, and Skills wiki live in the sibling
  project `W:\Local Files\Codex\DigiEditors` (port 5200); never re-add them
  here. The decks' board-workspace direction is `docs/BOARD_VISION.md`.
- Personal overrides go in `CLAUDE.local.md` (gitignored), not here.
