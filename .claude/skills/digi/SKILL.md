---
name: digi
description: The router. User-invoked (/digi) when unsure which gate, user-invoked skill, or command fits the task at hand in Digi Tools. Maps the situation to the right tool and says why in one line. Zero context cost until invoked.
---

# /digi — route the task to the right tool

Given what the user is about to do (or just did), answer with the ONE tool
that fits, plus a one-line why. Do not run the tool; route to it.

## Routing table

| Situation | Route to |
|---|---|
| About to design a new tool page / visual surface | `/impeccable design` (docs/DESIGN_DIRECTION.md is canonical and outranks it) |
| UI built, needs polish / spacing / hierarchy pass | `/impeccable polish` |
| Copy sounds AI-written | the avoid-ai-writing pass (model-invoked; just start editing copy) |
| Built a new tool, changed catalogs, or substantial UI | the **integration-gate** agent, then save its ledger report |
| Touched session import/export, localStorage, downloads, or prompt rendering | the **security-gate** agent (plus `npm run check:security`) |
| Shipped a page or component with visual presence | the **design-gate** agent |
| Session produced notable decisions | the **sessions** agent (end of session) |
| Big architectural decision to lock in | `/grill-with-docs` |
| Codebase feels tangled / entropy creeping | `/improve-codebase-architecture` |
| Writing or editing a skill / agent spec | `/writing-great-skills` |
| Hard bug, fix attempts bouncing | the diagnosing-bugs discipline (model-invoked) |
| Logic that must not regress (catalog math, state machines) | tdd (model-invoked) |
| Changed roles.json | `npm run data:generate` (the drift gate fails otherwise) |
| Reviewing a diff before delivery | `/code-review` first (`/simplify` if it grew; `/security-review` when a trust boundary moved), then the judgment gates AGENTS.md requires |
| A decision that is hard to reverse, surprising, and a real trade-off | an ADR in `docs/adr/` (format in its README) |
| Structural or "board" work on the decks | read `docs/BOARD_VISION.md` first; it is captured direction, not a plan — start with the owner's clarifying interview |
| Unsure which rules apply to a file | `.claude/rules/*.md` load by path; open the matching one |
| "Which npm command?" | `data:validate` · `data:generate` · `check:standards` · `check:security` · `gate:sweep` · `amendments` · `skill:log` (see docs/SETUP.md) |

## Rules

- One route per answer; if two apply, order them (build-order, not alphabet).
- Gates are read-only auditors; the main agent applies fixes.
- When a skill materially drives the work, log it:
  `npm run skill:log -- <skill> "<surface>"`.
