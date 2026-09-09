# Evaluation: Hard Gates and Aesthetic Rubric

Scoring is a tool for finding problems, not proof the user will like the result. Before scoring, write the goal, version, real data, device, and the state you exercised. If you did not open or operate the page, write "not verified" — never substitute a guess.

## 1. Hard gates first

Any failure below cannot be offset by a high aesthetic score:

| Gate | Failing examples |
| --- | --- |
| Facts and relationships | Wrong time zone math, missing dates, wrong hotel, mismatched ticket type, generated art inventing a route |
| Core tasks | Entry does not open, dialog needs two closes, skip deadlocks, checklist records lost |
| Current user requirements | Long page after paging was requested; a rejected module or font reappears |
| Release scope | Originals, credentials, keys, or private notes reach public files; a private repo used as web access control |
| Readable and operable | Text hidden behind images or the bottom bar, controls too small, keyboard cannot leave a dialog |
| Honest evidence | Treating HTTP 200, a screenshot, or a module receipt as end-to-end proof; a proxied network reported as the reader's own |
| State consistency | Stale state after cancel, back, or refresh; an old animation callback overwriting the new final state |

Out-of-scope features can be marked not applicable with a reason. Not applicable is neither a failure nor a completion.

## 2. Aesthetic score: 0–4 per dimension

General meaning: 0 = blocking or clearly wrong; 1 = patched together; 2 = usable but visibly unfinished; 3 = consistent, clear, intentional; 4 = stable down to details and edge states. The table anchors 0/2/4; 1 and 3 sit between neighbors. Do not inflate with adjectives.

| Dimension | Weight | 0 | 2 | 4 |
| --- | ---: | --- | --- | --- |
| Task and navigation | 20 | No idea where to tap / wrong page | Entry findable but duplicated or roundabout | Every entry matches its target; back, deep links, selected state all clear |
| Type and text | 15 | Illegible, mojibake, missing glyphs | Body readable but some fonts wrong, weak hierarchy | Consistent fonts in every state; long place names, time zones, and input all clear |
| Imagery and art direction | 15 | Wrong place names, broken image, fake transparency, misleading facts | One good image but repetitive, badly cropped, or off-style | The set varies yet coheres; composition serves content; provenance is clear |
| Layout and responsiveness | 15 | Overflow, occlusion, unusable on one end | Usable on one end, mechanically scaled on the other | Same structure both ends, space well used, narrow and short screens stable |
| Controls and feedback | 10 | Taps do nothing, wrong state | Tappable but inconsistent size and feedback | Default, pressed, expanded, failed, and focus states complete; no touch misfires |
| Motion and continuity | 10 | Flashed frames, dead air, freeze, broken skip | Completes but abrupt or lingering | Continuous start to final state, intentional timing, interruptible without rebound |
| Information density | 10 | Important facts lost or first screen drowned | Complete but repetitive or all collapsed | Simple by default, necessary facts reachable in a natural place |
| Consistency and precision | 5 | Several versions mixed together | Locally polished but spacing and symbols drift | Icons, labels, spacing, and states match the site-wide decisions |

Total = Σ(score ÷ 4 × weight). A reasonable starting threshold is **85/100 with at least 3 on every dimension** — a **suggested starting point, not a law**; adjust it per project. A score never overrides an explicit user rejection.

For a static site with no motion requirement, mark that dimension not applicable and normalize over the remaining weights. Do not add animation to earn points.

## 3. Per-module review points

| Module | Look at | Typical rework signal |
| --- | --- | --- |
| Home | First impression, entry, hierarchy, process and final state | Beautiful final state but a lone layer appears first; the ritual blocks finding information |
| Navigation | Recognition, proportion, press, selection, safe area | Unbalanced icon sizes; a transparent icon showing map behind it; home builds a second menu |
| Map | Relation of image to directory, place-name legibility | A heavy bar covering the image; decorative lines read as roads; type scaled up blindly |
| Itinerary | Date/action/time hierarchy, variety across day covers | Two days with the same tower; times wrapping to many lines; a control lost in a bright image |
| Flights | City and time read first, details second | Texture over text; a note stretching the ticket; duplicate outbound/return copy |
| Stays and tickets | Real action entries, necessary reminders | Oversized hotel image breaking orientation; duplicate "booked" badges; overblown warning styling |
| Checklist | Input, density, sense of completion | A delight feature taking the main slot; type too small; a completion animation blocking taps |
| Desktop | Horizontal use, line length, module relationships | A centered mobile column; text stretched to one endless line; navigation covering the last item |

## 4. Review record template

~~~text
Goal / state: <e.g. mobile transport page, return card, note expanded>
Version / device: <SHA, URL, viewport, browser, fonts loaded?>
Evidence: <screenshot paths, actions performed>
Hard gates: pass / fail / not tested (reason)
Scores: nav_ type_ imagery_ layout_ controls_ motion_ density_ consistency_
Problems: <locatable detail> → <task affected>
Fixing this round only: <a few problems sharing one cause>
Retest: <result in the same state>
Adoption: adopted / awaiting user / dropped
~~~

Do not stop at "lacks polish". Convert it: "the tear edge on the left covers the departure city; move the text area inward and retest at 375px."

## 5. Reversible ablation

Run one only when the value is unclear and worth comparing. An explicit removal request is just executed.

1. Fix the same version, data, device, state, and task.
2. A keeps the design; B removes or simplifies only that design — no incidental font, color, or content changes.
3. Perform the same task; observe tap count, misfires, time to read the information, user preference, and visual crowding.
4. Save both screenshots, the behavioral conclusion, and the adoption decision.
5. Delete the review controls afterwards; keep the evidence needed to reverse the change, but never publish the experiment to the trip's readers.

## 6. Minimal regression set

Select what the change affects; do not run all fourteen for every tweak.

1. Title and share name consistent; a deep link lands on the right page.
2. The current page shows only its own section; forward/back and the home entry work.
3. Home plays fully once, is skippable mid-play, survives a late stale callback, and holds after a page switch and back.
4. Cross-zone flight and departure boundary; swipe, buttons, and counters stay in sync.
5. Transport tabs keep their expansions; closing a map returns to the same item and position.
6. A failed map load still allows close and copy; one press closes.
7. All dates and linked activities present; long time ranges and local names readable.
8. Ticket check, revert, and shared items count consistently and never claim supplier verification.
9. Checklist empty/duplicate input, IME composition, add/check/delete/undo, refresh persistence.
10. Checklist gestures: horizontal, vertical, short swipe, multi-touch, edges, misfire suppression.
11. Images really load, crop correctly, transparent assets show no bleed; fonts actually apply.
12. Mobile and desktop key sizes, short screens, large type, keyboard, reduced motion.
13. No raw private information in the output; free text and images reviewed by a human.
14. The production domain serves the current version and changed assets; test on the target network separately.

Never run destructive tests against the user's real records. Use an independent source or browser profile, or a reversible test item you clean up.

## 7. Do not mix evidence levels

- **Structure check** — files exist, syntax/schema valid, static relationships hold.
- **Logic test** — fixed inputs and boundaries produce correct output.
- **Runtime observation** — real DOM, images, and fonts loaded.
- **Interaction acceptance** — after real actions, state, position, and page are correct.
- **Visual acceptance** — the specified device, states, and process keyframes were actually seen.
- **Production acceptance** — the named commit is served and operable at the production URL.
- **Target-environment acceptance** — verified on the readers' real devices and networks.
- **Adoption** — the user chose or used it. No technical result above implies adoption.

Skill forward tests are in [scenarios](scenarios.md). They test decisions, not production acceptance of a real travel site.

## 8. Linked acceptance for data changes

In an isolated sample or a reversible branch, change the source of truth **once**, rebuild, and check every affected surface. Do not hand-patch pages until the test passes. Record before/after values, linked items, artifact version, and the result.

| Change sample | Must be re-checked | Must not change |
| --- | --- | --- |
| Departure or arrival time changes | Dates and time zones at both ends, duration, countdown, next-flight selection, linked transport and itinerary | Existing ticket IDs and personal checks |
| Whole trip shifts dates | All day cards, stay dates, planning phases, applicable cutoffs, route directory dates | Do not assert hotels or flights were rebooked; leave the booking gap explicit |
| Change of stay or store | That day's name, local address, map, arrival or pickup reminders | Other days and unrelated places |
| New or changed return cutoff | Rental summary, its own countdown, latest time and return location | A flight countdown must not be reused as the return clock |
| Adjust a shared ticket | Every referencing location, visible counts, prompts | Do not duplicate the ticket or claim supplier issuance |
| Edit the base checklist | New initial items and category counts | Valid user-created and completed items; ID migration must be explicit |

Check locally first, then read back the corresponding change at the real published URL. A fixed-count sample test does not substitute for relationship correctness.

## 9. Source evidence marks

When distilling capabilities from a reference work, mark each one:

- **Direct observation** — the original screen, text, or a real interaction shows it.
- **Stated requirement** — a prompt or description asked for it, but it was not seen running.
- **Implementation receipt** — an author or agent claims it was done; not independently verified.
- **Added here** — introduced by this project for reliability, cross-country fit, or usability.

Record where it came from, what was distilled, the evidence class, and this project's implementation and verification status. "Requested in the source" must never be written as "verified in the original", and making it work here does not upgrade the original's evidence class. This is a recording method, not a form to fill for every small change.
