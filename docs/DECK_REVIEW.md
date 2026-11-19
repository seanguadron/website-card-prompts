# Three-deck reassessment, November 2026

Reviewed the local September split and board against the former published main (c45c821), then traced the current card catalogs, composers, persistence, navigation, and output controls. The review used Matt Pocock's standards and spec passes.

## Standards findings

- Library writes and deletions previously reported success when storage was full or blocked. The three libraries now return failure to their shared panel, which retains the entered name and offers a session download after a failed save.
- All three session importers accepted unsupported versions and truthy primitives as draft records. They now validate the envelope before applying state. Version-one CRAFT files may omit their legacy tool tag.
- Space intercepted native button activation inside the board. Bracket navigation could also move the camera away from keyboard focus. Space now acts as a pan modifier on the pasteboard, and a keyboard board change focuses the destination surface.

## Deck findings

| Deck | Keep | Change |
|---|---|---|
| CRAFT | Lead and supporting roles, graded tactics, format and audience choices. | Fourteen of 35 descriptions repeated every ability bullet. Use the short role summary with the steps once. Export those roles and card instructions as a workflow for a fresh brief. |
| PICTURE | Illustrated examples, graded visual direction, optional Midjourney parameters. | A saved custom hand with its parameter tail off could inherit an enabled tail. Restore the saved choice and show when a catalog preset preserves the existing setting. Reuse the visual direction with a new subject. |
| SONIC | Distinct sound sources, descriptor grades, ambience cap, separate layers. | The preset preview could claim ambience was off while preserving the current setting. Make inheritance explicit and store an explicit ambience choice for new custom hands. Reuse the sound direction for another source. |

## Product direction

Keep each hand as the source of two outputs. Prompt carries the current job or subject. Skill carries the hand's choices and a procedure for the next brief. Judge the result by trying the same hand on a second, different brief. The Outcome Lab's paid generation and additional SONIC artwork can wait until that workflow has been tried by makers.
