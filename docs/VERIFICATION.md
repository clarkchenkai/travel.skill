# Verification record

What has actually been checked, at which evidence level, on which date. Levels, weakest to strongest: **structure** (files/schema) → **logic** (unit test) → **runtime** (opened in a browser, observed DOM) → **interaction** (a person or an automated pointer performed the action) → **production** (live URL) → **adoption** (a real traveler used it). Anything not listed here is unverified.

Date of this record: 2026-09-09. Environment: macOS, Node 25.9, Chrome 152 (headless and the Claude Code in-app browser).

## Automated (logic)

`npm test`: 43 tests, all passing (rerun 2026-09-09, Node 25.9.0).

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

## Ordered local optimization pass — 2026-09-09 (stopped at step 1)

Environment: macOS 26.6.2 (25G83), Node 25.9.0, npm 11.12.1; Xcode 27 beta 4 (27A5228h), selected per command with `DEVELOPER_DIR=/Applications/Xcode-27.0-Beta-4.app/Contents/Developer`. Device Hub (`com.apple.dt.Devices`) displayed an iPhone 17 Pro simulator running iOS 27.0 (24A5390f). Native coordinate taps and drags were injected into that simulator; this is interaction evidence on an emulated device, not physical-device testing or DOM-dispatched events.

`npm run build --trip examples/family-island` failed because npm did not forward the flag. `npm run build -- --trip examples/family-island` succeeded (22 files, 711,344 bytes), and `npm run check` passed. The build was served at `http://localhost:4195/` with `npm run preview -- --port 4195`. A temporary HTTP-header shim outside the repository blocked external frames and other external page resources with Content Security Policy, to honor the local-only requirement. The built files were unchanged. Consequently this run does not verify a working Google map embed; its blank state was expected.

| Check actually performed | Level | Result |
| --- | --- | --- |
| Home cover and family-island title render in Safari | runtime | Pass |
| Tap Days and Transport in the bottom navigation | interaction (simulator touch) | Pass for these two destinations only |
| Collapse and reopen day 1 by tapping its summary | interaction (simulator touch) | Pass |
| Tap the Palma de Mallorca Airport place chip | interaction (simulator touch) | Dialog opens with title, local name, address and controls; external map blocked as described above |
| Close the place dialog with one tap, then reopen it | interaction (simulator touch) | Pass; day content restored |
| Drag the flight rail horizontally | interaction (simulator touch) | Pass; outbound LHR→PMI changes to return PMI→LHR, with the active indicator changing |
| Swipe right from the left screen edge without Escape | interaction (attempted, unresolved) | Three attempts: two with the place dialog open and one on Transport. No return navigation or dialog dismissal was observed. A subsequent native Safari Back-button tap returned from Transport to Days, but that does not verify the gesture. Cause not isolated between input delivery, simulator Safari behavior and the page. No template defect established or fix applied. |

The pass stops here as requested when an ordered step cannot be completed. The remaining step-1 checks were not performed: all five navigation destinations by touch, checklist add/check/delete/undo and reload persistence, landscape rotation, largest accessibility text size, and Add to Home Screen/standalone launch. Steps 2–10 were not started; this is not evidence that Android or Windows is unavailable. Existing records above remain historical evidence, not results of this pass. Resume by establishing a working native edge-back gesture in simulator Safari and repeating it with the dialog open, then finish step 1 before advancing. No push, deployment or publication was performed.

## Not done

### Continuation of the local pass (2026-09-09)

The user subsequently authorized continuing past environment blockers without repeated confirmation. All following checks used local previews with external page resources blocked. `npm test` still passes all 43 tests after the accessibility fixes.

| Check | Level | Observed result |
| --- | --- | --- |
| iOS bottom navigation | interaction (simulator touch) | Home, Map and Checklist also tapped successfully, completing all five destinations. |
| iOS checklist | interaction (simulator touch) | Added `test`, checked it, deleted it, tapped Undo, then tapped Safari Reload. The item and its checked state survived the reload. |
| iOS landscape | runtime + interaction (simulator) | Rotated with Device Hub; Map rendered in landscape and the Days navigation tap worked. This was before the typography fix; not a complete landscape regression pass. |
| iOS largest Dynamic Type | runtime (simulator) | Set `accessibility-extra-extra-extra-large` using `simctl ui`. Original page text stayed small while Safari controls grew. After changing fixed pixel fonts to `rem` and using `-apple-system-body`, page text enlarged. Initial enlarged layout exposed a blocking sticky header; headers now scroll with content. Full enlarged-text touch navigation is still unverified. Restored the simulator's original `large` setting. |
| Enlarged-text layout | runtime (headless Chrome, local dev) | At 390 px with a 17 px root (16 px body) and a 53 px root (49.88 px body), all five pages had `scrollWidth === 390` after fixing home cards, rental details and the checklist heading. Navigation and transport tabs intentionally scroll horizontally at the enlarged size. This is browser font-size emulation, not iOS interaction evidence. |
| Add to Home Screen | interaction + structure (simulator) | Used Safari Share → More → Add to Home Screen → Add, with “Open as Web App” enabled. A local WebClip was created for `localhost:4195/#days` with `FullScreen=true`. Its icon was not located/launched through the available simulator controls, so standalone runtime is **not verified**. |
| Android availability | environment inventory | No `adb`/`emulator` on PATH, Android application in system/user Applications, `~/Library/Android`, or `~/.android` found. Android check skipped; no device run claimed. |
| Real CJK composition | attempted, unresolved | Enabled and selected Apple's built-in Pinyin via Carbon input-source APIs (selection returned 0), then sent individual `n i h a o` keys into Safari. Only plain letters appeared, with no observable candidate window. Cannot claim composition Enter behavior. Restored ABC and disabled the temporarily enabled Apple Pinyin sources. |
| Keyboard: Home, Map, Days, Transport, Checklist | interaction (native macOS Safari keyboard) | Used Option-Tab, Safari's all-controls keyboard traversal. Reached Home links; all 10 map places; all seven day summaries and the controls revealed by opening them; transport notes, rental map and category controls; checklist filters/input/add and all eight checkbox/delete pairs; bottom navigation. Activated day summaries and the Buses category with Enter. |
| Dialog focus after close | interaction (native Safari keyboard) | Before: opened the final map place with Enter, closed with Enter, then Option-Tab restarted at the first place. Fixed by releasing the dialog on history traversal and restoring opener focus after Safari's history work. Same path now returns focus to the final place, then Option-Tab reaches Back to top. |
| Contextual map button labels | runtime (Safari accessibility tree) | Stay buttons previously announced only “Map”. Added the stay name to their accessible labels; read back “Map: Example family apartment (Port de Sóller)” and “Map: Example beach hotel (Playa de Muro)” while traversing Days. The rental map button now also includes the place name; its new label has not yet been read back in Safari. |
| VoiceOver | attempted, unresolved | Started VoiceOver and its first-use tutorial; the VoiceOver process ran. The available app-targeted keyboard commands did not yield observable VoiceOver navigation or speech output. Safari's accessibility tree is recorded above, but this is **not** a completed screen-reader pass. Stopped the VoiceOver processes started for this check. |

- No deployment to a live host from this repository. `docs/PUBLISHING.md` routes are described, not walked.
- No real traveler has built a roadbook with it yet. The stage-one goal (ten strangers) has zero data points.
- No physical device yet. iOS Safari has runtime and partial simulator-touch evidence (see the dated pass above); the complete touch checklist is unfinished. Android Chrome has not been checked.
- No screen-reader pass beyond `aria-label`/`aria-current` attributes being present.
- No test of a self-hosted font. Images are exercised by the three examples (cover, day thumbnails, route photo, paper tile); each example builds under 1.5 MB and the audit passes.

Update this file when a row changes level. Do not summarise it into a badge.
