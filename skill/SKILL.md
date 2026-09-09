---
name: travel
description: Turn a traveler's raw materials (bookings, notes, screenshots, links, chat messages) into a personal, shareable travel website ("roadbook") using the dependency-free template in this repo. Use when asked to build, import, update, check, or publish a trip roadbook / travel site / itinerary page from travel materials.
---

# travel.skill — compatibility entry

This command-oriented entry remains supported. The complete five-skill system is routed by [AGENTS.md](../AGENTS.md): planning, product development, design, template/module extension and travel verification. For new templates or features use [travel-template-studio](../skills/travel-template-studio/SKILL.md); for complex travel use [travel-verification](../skills/travel-verification/SKILL.md).

## From materials to a roadbook

**Promise:** the traveler drops their materials in, and leaves with a site they can open on their phone and share. You do the reading, structuring, gap-finding, previewing and release checks. You never invent facts.

**Success for the first version:** a stranger can finish their first roadbook with you and this repo, without asking the author anything.

## The pipeline

Run these in order. Each step has a command and an exit condition. Do not skip the gap step.

| Step | What you do | Command | Leave when |
| --- | --- | --- | --- |
| 0 Start | Copy an example into `trip/` if there is no `trip/travel-data.json` yet. Pick the example closest to the trip (hiking / rail / family+car). | `npm run new -- <example>` | `trip/travel-data.json` exists and `npm run dev` shows it |
| 1 Import | Read everything in `input/` (or wherever the user put materials). Extract facts into `trip/travel-data.json`. Keep the source of every fact in `sources` and `sourceRefs`. | — | Every fact you wrote can be traced to a file, a message, or "user said" |
| 2 Gaps | Run the validator and the gap report. Turn gaps into short questions. Ask them in one batch. | `npm run validate` · `npm run gaps` | Validator has 0 errors; each remaining gap is either answered or explicitly left "unknown" |
| 3 Generate | Fill the data with the answers. Choose `trip.theme`, `trip.locale`, `trip.map.provider`. Set `trip.demo` to `false` only when it is a real trip. | `npm run validate` | 0 errors; the user's answers are in the data, not in your notes |
| 4 Preview | Start the dev server and walk the five pages yourself: Home, Map, Days, Transport, Checklist. Open a map, mark a ticket, add a checklist item, reload. | `npm run dev` → `http://localhost:4173/` | You have actually looked at each page; issues are fixed in data or reported |
| 5 Publish | Build, audit, then hand over `dist/` with the publishing options. Do not upload anywhere without explicit permission. | `npm run build` · `npm run check` | Audit passes; the user knows what is public and how to update it |

Report at the end of every session in this shape:

~~~text
Done: <what the user can open now, with the URL or folder>
Not done: <gaps still open, checks not run>
Entry: <local preview / dist folder / live URL, and which data version>
Next: <one concrete action for the user>
~~~

## Rules that do not bend

1. **Facts come from materials or the user.** No invented departure minutes, prices, addresses, opening hours, or booking status. Unknown is `null`, `"unknown"`, or a gap — never a plausible guess.
2. **Status vocabulary is closed:** `unknown` · `needs-confirmation` · `booked` · `demo`. A trip description is not a booking. Do not write `booked` without a confirmation in the materials.
3. **Times carry offsets and IANA zones.** Flights use `2031-10-23T19:30:00-04:00` plus `origin.timeZone` / `destination.timeZone`. Durations are computed from absolute instants; the template already does this. Never subtract clock faces.
4. **Public data is public.** `travel-data.json` in `dist/` can be downloaded by anyone with the link. Passport numbers, booking references, PNRs, ticket numbers, payment details, private phone numbers and private addresses never go in. The validator rejects the obvious cases; you check the free text.
5. **Do not touch `input/`.** Original materials are read-only. Do not copy them into `trip/` or `dist/`.
6. **The look is a choice, not a default.** Three themes ship (`field-notes`, `timetable`, `tide`). None of them is "the" look; pick by mood and destination, or add a theme. Do not bake one country's symbols or transit habits into another trip.
7. **Evidence has levels.** "Validator passed" is a structure check. "I opened the page and clicked" is runtime observation. "The user opened it on their phone" is adoption. Say which one you have.
8. **Authority stops at the repo.** Building and previewing is yours. Creating accounts, pushing to a remote, deploying, buying anything, or sending messages needs the user's explicit go-ahead each time.

## Reading materials well

- Read text first (PDF text, emails, chat exports, notes). Look at screenshots only when text is missing or contradictory.
- Distinguish **booked** (confirmation number exists — record the fact, not the number), **planned** (the user intends it), and **suggested** (a blog, a friend). Only the first two go into `days`; suggestions can become `groundTransport` notes or checklist items, marked as suggestions.
- Keep the local-language name of every place (`localName`) and an address the traveler can show to a driver. Add coordinates when you can verify them from a public source; otherwise use `mapQuery`.
- Conflicts (two different hotel names for one night, a flight that lands after the train leaves) are gaps, not decisions you make.

## Data shape

`trip/travel-data.json` — one file, validated by `scripts/lib/validate.mjs`. Full field reference: [docs/DATA.md](../docs/DATA.md). The parts you will touch most:

- `trip` — id, title, dates, `timeZone`, `locale` (`en` or `zh-CN` ship), `theme`, `people`, `map.provider` (`google` | `osm` | `none`), `demo`.
- `flightJourneys[]` — one card per journey, `segments[]` per leg.
- `places[]` — everything a reader might want on a map. `days[].events[].placeIds` point here.
- `accommodations[]` — one per stay, linked from `days[].accommodationId`.
- `days[]` — one entry per calendar day of the trip, `events[]` in order, `timeLabel` free text (`"09:00"` or `"Morning"`).
- `tickets[]`, `groundTransport.tabs[]`, `rental` (only when there is one), `checklist[]`, `sources[]`.

## Images (optional, do them last)

The roadbook works with no images. Add them only after the facts are right, in this order: cover (`trip.cover.image`, wide), one square thumbnail per day (`days[].cover`), a map-page photo (`routeOverview.image`), a paper tile (`trip.textures.paper`). Files live in `trip/assets/` and are referenced as `assets/...`; only referenced files are published.

- **The traveler's own photos first.** Ask for them. Resize before committing (cover ≤ 200 KB, thumbnails ≤ 60 KB; `scripts/optimize-images.py` if Pillow is available, otherwise any tool). Do not publish photos of other people without asking.
- **No photos?** If an image-generation tool is available in your environment, offer it and follow [docs/VISUALS.md](../docs/VISUALS.md): realistic photograph of one subject per day, no text, no faces, no logos; record the prompt and model in `trip/ASSETS.md`. If no tool is available, say so and ship without images; do not download stock photos of unknown license.
- Never let an image carry a fact. Times, prices, statuses stay in the data.
- For a share card, set `trip.siteUrl` to the final address so `og:image` is absolute.

Budget: the template itself is under 100 KB; a cover adds about 100 KB before first paint; everything else loads lazily.

## When to read the references

Read only what the current step needs.

- Imported materials and now structuring facts, time zones, currencies, what stays private → [data-and-countries.md](references/data-and-countries.md)
- Building or changing a page, or judging whether a module is "done" → [module-contracts.md](references/module-contracts.md)
- Choosing or tuning the look, images, fonts, motion, mobile vs desktop → [visual-and-motion.md](references/visual-and-motion.md)
- Reviewing before handover, scoring, regression list, evidence levels → [evaluation.md](references/evaluation.md)
- Publishing, caching, regional reachability, rollback → [release-and-access.md](references/release-and-access.md)
- Large trip or several people/agents working in parallel → [orchestration.md](references/orchestration.md)
- Rental car / vehicle in the trip, or building a coverage table → [coverage-and-rental.md](references/coverage-and-rental.md)
- Testing this skill's own judgement → [scenarios.md](references/scenarios.md)

Copy-ready prompts for the user side of each step are in [prompts/](prompts/README.md).

## Small changes

If the user asks for one specific change ("move the museum to Tuesday", "the hotel in Berlin is now booked"), edit the data, run `npm run validate`, reload the preview, and confirm the visible result. Do not re-run the whole pipeline or re-ask settled questions.

## What this skill does not do

- It does not book, pay, or contact vendors.
- It does not verify that a timetable is current; it records where a fact came from and asks the user to check time-sensitive items.
- It does not sync checklists between travelers. Reader checks live in each browser's local storage; if the user needs shared state, say so and stop — that is a different product.
