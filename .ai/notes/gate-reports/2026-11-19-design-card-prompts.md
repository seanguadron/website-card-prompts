---
gate: design
date: 2026-11-19
surface: Card Prompts three-deck skill export and local rebrand
result: pass
findings: 0
---

Initial review found that a long skill could obscure the download action and that the empty state lacked a route back to the cards. The shared dock now scrolls at short heights, its preview has its own scrolling area, and the empty Skill view has a Return to cards action. Source recheck passed.

Release browser check: exported SKILL.md from all three decks at 1040 by 600, compared the bytes with the preview, returned to Prompt, and checked the homepage width at 375 pixels. Bracket navigation focused the destination surface on each deck.
