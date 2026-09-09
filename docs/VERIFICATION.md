# Verification record

What has actually been checked, at which evidence level, on which date. Levels, weakest to strongest: **structure** (files/schema) → **logic** (unit test) → **runtime** (opened in a browser, observed DOM) → **interaction** (a person or an automated pointer performed the action) → **production** (live URL) → **adoption** (a real traveler used it). Anything not listed here is unverified.

Date of this record: 2026-09-09. Environment: macOS, Node 25.9, Chrome 152 (headless and the Claude Code in-app browser).

## Automated (logic)

`npm test`: 39 tests, all passing.

- Time zones: absolute-instant durations (SIN→NGO 6 h 20, VIE→JFK arriving at an earlier clock time = 8 h 35, Tokyo→Los Angeles 10 h), +1 day / same-day arrival markers, trip day counter in the trip's own zone, countdown never negative.
- Data: required fields, unknown references, offset-less times rejected, backwards arrivals rejected, unknown IANA zones, dates outside the trip, closed status vocabulary, private records, credential-like keys, token markers, gap report contents.
- Release audit: hash mismatch, undeclared and missing files, path traversal, symlink escape, `.env` and key files, nested private fields, secrets not echoed, local machine paths, invalid JSON, manifest inside the public dir.
- Examples: all three validate, build from a clean directory, pass the audit, are marked fictional (`demo` status, `DEMO` flight numbers), and each build stays under 1.5 MB with its photos.

## Runtime and scripted interaction (browser, three examples)

Performed in the in-app Chromium at 375 × 812 (mobile) and the pane's desktop width, plus headless Chrome at 390 × 844 and 1280 × 860 for screenshots. Interactions marked *scripted* were driven by DOM calls (`element.click()`, `form.requestSubmit()`, `KeyboardEvent`), not a physical pointer; the close-button click on the map dialog was a real pointer click.

| Check | Level | Result |
| --- | --- | --- |
| Hash routing: `#home #map #days #transport #checklist`; only the current section visible; nav `aria-current` follows | runtime | Pass on all three |
| Desktop layout ≥ 900 px: nav in flow under the header, two-column map, two-column days grid, flight cards side by side | runtime (screenshots) | Pass |
| Mobile layout: bottom nav with safe-area padding, single column, no horizontal overflow (`scrollWidth === clientWidth` at 375) | runtime | Pass |
| Map dialog opens with title, local name, address, copy button, external link; embed URL built from coordinates (Google) or bbox (OSM) | runtime | Pass |
| Map dialog closes with one click; history entry removed; iframe `src` cleared; body scroll restored | interaction (real click) | Pass |
| Map dialog closes on Escape and on browser Back | scripted | Pass after adding a document-level Escape handler; first attempt failed because the embed had taken focus. Focus is now returned to the close button on iframe load. |
| Map provider unreachable | runtime | In the sandboxed browser the Google embed rendered blank; status text switched to the "if blank, use the link" message and copy/external link stayed usable. A hard network failure (`onerror`) was not simulated. |
| Ticket dialog: price in ISO code (`JPY 5,000`, `CZK 330.00`), local text with copy, "Mark as bought" toggles, day summary updates from "1 to buy" to "Tickets marked" on both days sharing the ticket, persisted in localStorage | scripted | Pass |
| Flight rail: default card = next departure; prev/next buttons move the active dot; overnight flight shows `+1 day`; westbound return shows same date with correct duration | scripted + screenshot | Pass |
| Checklist: add, duplicate rejected with toast, check updates progress, delete with undo, group filter, reload keeps 6 items with 1 done | scripted + reload | Pass |
| Chinese input method composition guard on the checklist form | — | Not verified (needs a real IME) |
| Rental block renders pick-up, return-by, deposit, coverage, fuel policy | runtime | Pass (family-island) |
| Offline: built site served by `npm run preview`; headless Chrome registers `sw.js`, 20 entries precached, network set offline, reload renders title and 7 day cards (`npm run check:offline`) | interaction (scripted, headless) | Pass (family-island). Fails under Python's `http.server`, which is why `npm run preview` exists. The in-app Claude browser blocks service workers. |
| Print: Chrome print-to-PDF of the built site expands all pages and days; page breaks per section | runtime (PDF inspected) | Pass; PDF is large (≈10 MB) because photos print at full resolution |
| Share tags: `og:title/description/image`, twitter card injected at build; `og:image` absolute only when `trip.siteUrl` is set | structure | Pass |
| Gallery (`npm run site`): four roadbooks (three examples + Kumano showcase) built into one folder with a chooser page | runtime (screenshot) | Pass |
| Demo recording (`scripts/record-demo.mjs`): real headless walkthrough → `docs/demo/demo.gif` and `.mp4` | runtime | Recorded 87 frames on the family-island build |
| iOS Safari, iPhone 17 Pro simulator (iOS 27.0 beta, Xcode 27 beta 4), built family-island site over localhost: Home, Days, Transport, Checklist, Map all render; bottom nav clears Safari's toolbar via the safe-area inset; `theme-color` tints the status bar; photos and fonts load. Screenshots only, no touch input (the simulator was driven by `simctl`, which cannot tap). | runtime (real WebKit, emulated device) | Pass |
| Lighthouse 13.4 on the built family-island site (`npm run preview`, headless Chrome): mobile 98 / 100 / 100 / 100 (performance / accessibility / best practices / SEO), FCP 1.4 s, LCP 2.3 s, CLS 0.03, TBT 0 ms; desktop 100 / 100 / 100 / 100 after contrast fixes. The only remaining flags are back/forward cache (the local preview sends `no-store`; hosts do not) and the network dependency tree. | measured | Pass; numbers are from a local server, not a CDN |
| Motion layer (`motion.mjs`): day fold animates then lands on the correct native `open` state; dialog entrance does not interfere with close; press feedback | scripted | Pass (japan-hiking, after porting from the Kumano site) |
| Showcase `showcase/kumano-kodo`: `npm ci`, 8 core tests, `build:visuals`, `build.py --public-only --package` from its new location; 38 files, release audit passed | logic + structure | Pass |
| Cold-load payload, japan-hiking, uncompressed | measured | Template files 83 KB (HTML 4.4, CSS 23.8, JS 38, i18n 3.2, data 14; ≈25 KB gzipped) plus the cover photo ≈95 KB before first paint; day thumbnails (15–60 KB each), route photo and paper tile load lazily. No web fonts, no third-party scripts. |
| Weak network / throttled load | — | Not measured. Payload is small enough that first paint should be one round trip after HTML; not proven. |
| Reduced-motion preference | structure | CSS rule present; not observed. |

## Agent clients

See [AGENTS.md](AGENTS.md) for the recorded runs (Claude Code passed; Codex CLI: passed).

## Not done

- No deployment to a live host from this repository. `docs/PUBLISHING.md` routes are described, not walked.
- No real traveler has built a roadbook with it yet. The stage-one goal (ten strangers) has zero data points.
- No physical device yet. iOS Safari was checked in the simulator (real WebKit, no touch); Android Chrome not at all.
- No screen-reader pass beyond `aria-label`/`aria-current` attributes being present.
- No test of a self-hosted font. Images are exercised by the three examples (cover, day thumbnails, route photo, paper tile); each example builds under 1.5 MB and the audit passes.

Update this file when a row changes level. Do not summarise it into a badge.
