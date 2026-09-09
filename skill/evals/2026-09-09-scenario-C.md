# Scenario C rehearsal — 2026-09-09

Agent: Codex native sub-agent `/root/blind_scenarios_ac`. The session model was inherited; a specific model/version identifier was not exposed by the spawn result.
Reviewer: parent Codex task, after the response artifact was written.
Evidence level: recorded blind proposed-response rehearsal. Not implementation, browser interaction, production or traveler adoption.

## Blinding and input

The agent received only skill/SKILL.md, needed linked references (excluding scenarios.md), and an input-only packet. Expected answers and existing evals were withheld. The input packets were extracted before delegation; the reviewer read the expected column only after all six response files existed. Each agent listed the files it read in its response.

Verbatim scenario input:

> Tapping "map" still scrolls into transport below; a five-icon bottom bar exists

Original response SHA-256: `25747ff293c9e6738226d4c5b079baa6c9cef62e1be298d32fc0f2d1aaed939a`.

## Score

| Criterion | Score | Evidence in the response |
| --- | --- | --- |
| Real destinations | 2 | Proposes showing only active-route content, rather than section scrolling. |
| Navigation state | 2 | Preserves page state, back/forward and direct links. |
| Acceptance path | 2 | Checks every icon and scrolls each destination to ensure other pages do not leak. |
| Evidence boundary | 2 | Does not claim source inspection or runtime success. |

Overall: **2/2**, actionable and correctly bounded under the scenario rubric. No critical criterion scored 0.

Skill change made: none; this response did not expose a below-2 skill outcome.

Reviewer note: the two clarification questions are unnecessary for this repository’s already-defined five-page contract. The proposed implementation and acceptance checks nevertheless meet the expected behavior; this result is not a claim of optimal response efficiency.

## Recorded response

Only the machine-specific repository path prefix was removed for portability; wording otherwise preserved.

# Proposed response — Scenario C: Fake paging

## Verbatim input

```text
# Scenario C Fake paging

Tapping "map" still scrolls into transport below; a five-icon bottom bar exists
```

## Relevant skill material read

- `skill/SKILL.md`
- `skill/references/module-contracts.md`

## Proposed response and action plan

The reported behavior does not satisfy the page-navigation contract: if “Map” is intended as a separate page, the map view must show only map content. Scrolling from it into Transport means the current interaction is section scrolling or mixed page content, not a complete Map page. I would not call the five-icon bar working merely because it is visible.

I would first confirm two product choices in one short batch:

1. Are the five icons meant to be five separate pages, and what are their exact labels and default destination?
2. Should repeat-tapping the currently selected icon return the page to its top or preserve its reading position?

Assuming the requested model is five separate pages, I would make these proposed changes:

1. Use one routing source for page IDs, labels, icons, selected states, browser history, and deep links. Hash routing, a router, or distinct server pages are all acceptable; I would select the repository’s existing pattern rather than introduce another routing system.
2. On the Map route, render only the map/route-overview and place-directory content. Transport, itinerary, and checklist content must be excluded or hidden as inactive pages so normal scrolling cannot reveal them.
3. Bind the five bottom-bar icons to those same page IDs, give each icon an `aria-label`, expose a visible focus state, and keep `aria-current` synchronized with the active route.
4. Reserve bottom padding for the bar, safe-area inset, and soft keyboard, so the final map/place item remains visible and tappable on small screens.
5. Preserve documented page state when moving away and back: itinerary expansions and checklist records should survive; the explicit repeat-tap behavior should match the agreed choice.

I would verify with this concrete acceptance pass:

1. Tap each icon, then scroll to the bottom of each resulting view; Map must never reveal Transport, Days, or Checklist.
2. Use browser back/forward and open a direct Map deep link; the matching icon and page content must agree.
3. Test the currently selected Map icon according to the agreed repeat-tap rule.
4. Test keyboard focus/activation and screen-reader names for all five controls.
5. On a small mobile viewport, ensure the bottom bar and keyboard do not cover the last actionable item; then check a desktop width without creating a second routing system.

These are proposed code and runtime checks only. I have not inspected the existing implementation, changed it, or performed a preview pass.
