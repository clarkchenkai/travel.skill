# Scenario D rehearsal — 2026-09-09

Agent: Codex native sub-agent `/root/blind_scenarios_de`. The session model was inherited; a specific model/version identifier was not exposed by the spawn result.
Reviewer: parent Codex task, after the response artifact was written.
Evidence level: recorded blind proposed-response rehearsal. Not implementation, browser interaction, production or traveler adoption.

## Blinding and input

The agent received only skill/SKILL.md, needed linked references (excluding scenarios.md), and an input-only packet. Expected answers and existing evals were withheld. The input packets were extracted before delegation; the reviewer read the expected column only after all six response files existed. Each agent listed the files it read in its response.

Verbatim scenario input:

> The map iframe navigated; close only calls `history.back()`, so users press twice

Original response SHA-256: `63fa49144cebf4e1d877d29c36bfa5f69f0ad3b9d312b774c46a6b6ff7e54789`.

## Score

| Criterion | Score | Evidence in the response |
| --- | --- | --- |
| Immediate local close | 2 | Explicitly decouples UI release from iframe history. |
| Repeated action | 2 | Requires idempotent close without leaving the page. |
| Acceptance path | 2 | Plans one press, repeat press, Escape and position/expansion restoration tests. |
| Evidence boundary | 2 | Calls this a proposed repair and does not claim it ran. |

Overall: **2/2**, actionable and correctly bounded under the scenario rubric. No critical criterion scored 0.

Skill change made: none; this response did not expose a below-2 skill outcome.

## Recorded response

Only the machine-specific repository path prefix was removed for portability; wording otherwise preserved.

# Scenario D — proposed response rehearsal

## Verbatim input

> # Scenario D Double close
>
> The map iframe navigated; close only calls `history.back()`, so users press twice

## Skill material read

- `skill/SKILL.md`
- `skill/references/module-contracts.md`
- `skill/references/evaluation.md`

## Proposed response and action plan

This is a core map-dialog failure: closing must not depend on the cross-origin map iframe's history. I would change the dialog close path so the first close action immediately closes the local dialog, unlocks page scroll, and restores the reader's prior itinerary position and expansion state. ESC, backdrop click, the close control, and browser Back should converge on that same idempotent local-close operation.

If opening the dialog creates an application history entry, I would define and implement an explicit history policy around that entry. The close button must clear the dialog state first; any resulting history reconciliation must not navigate the iframe and must not make a second press leave the current page. Repeated close calls after the dialog is already closed should be no-ops. On close, abort any unnecessary map request; reopening another place must reset the dialog title, address, and map target, with no stale callback changing it.

Proposed checks after the change:

1. Scroll into a long itinerary and expand a day; open a place, then press the close control once. Confirm the dialog releases, scroll unlocks, and the same reading position and expansion remain.
2. Repeat using ESC, backdrop, and browser Back. Verify each has the agreed result and none requires a second action.
3. Press close repeatedly after the first close. Confirm there is no page navigation or history escape.
4. Open a place, simulate a failed map load, and confirm close, copy-address, and map hand-off still work independently of map rendering.
5. Reopen a different place and check that its local name, address, and map target replace the previous place's values.
6. Perform the checks on a mobile-sized viewport and with keyboard navigation; keep the close control reachable.

Evidence boundary: this is a proposed repair and rehearsal only. I have not inspected implementation, changed code, opened a browser, or run any of these checks.

## Session-style handoff

Done: identified the required local-close behavior and a focused acceptance set.
Not done: implementation and runtime/interaction verification.
Entry: proposed response only; no preview or build was used.
Next: implement the single idempotent dialog-close path, then run the six checks above.
