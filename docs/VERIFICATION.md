# Verification record

What has actually been checked, at which evidence level, on which date. Levels, weakest to strongest: **structure** (files/schema) → **logic** (unit test) → **runtime** (opened in a browser, observed DOM) → **interaction** (a person or an automated pointer performed the action) → **production** (live URL) → **adoption** (a real traveler used it). Anything not listed here is unverified.

Date of this record: 2026-09-09. Environment: macOS, Node 25.9, Chrome 152 (headless and the Claude Code in-app browser).

## Suite and UI release candidate — 2026-09-10

- **Logic:** 82/82 tests pass. Four examples validate/build/audit; four ZIP variants pass extraction/CRC/content checks, and an extracted generic workspace builds independently. Five canonical skill files pass the official skill validator; canonical and discovery-wrapper Markdown links resolve.
- **Runtime:** final headless Chromium sweep: 84 page/width combinations (21 pages across four examples × 320/375/768/1280 px). All widths read back correctly; one matching active page; no document overflow or clipped pills, badges and cover text. Earlier in-app checks covered 63 layouts and a separate 15-layout long-content stress fixture.
- **Interaction:** actual in-app clicks open/close ticket and map dialogs; business receipt checkbox survives reload and is restored afterward. At 375 px the ticket dialog measures 375 px with no horizontal overflow. A generated French equipment module also preserves its returned state after reload; see [the independent scenario record](../evals/2026-09-10-suite.md).
- **Offline:** headless Chrome loads the built business example, activates its service worker with 13 cached entries, disables networking, then reloads successfully (5 day cards, loading state hidden). Unit tests separately cover scope isolation, stale-code refresh, unsuccessful responses and range requests. This does not make online maps or videos available offline.
- **Fixes:** the rail theme's red divider no longer collides with the wide cover backdrop; long names wrap within cards and controls; mobile controls have a 44 px minimum height; multi-page navigation can scroll; caches are isolated per roadbook path. Localized templates now select their declared pack automatically.
- **Evidence limits:** no new physical-phone touch, VoiceOver speech, WeChat or real traveler adoption claim. Current release production status is established separately by its merge/deployment checks.

## Automated (logic)

`npm test`: 52 tests, all passing (rerun 2026-09-09, Node 25.9.0).

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
| Print: Chrome print-to-PDF of the built site expands all pages and days; page breaks per section | runtime (PDF inspected) | Initial result was ≈10 MB. Superseded by the step-6 local pass below: 1,930,216 bytes, with text and rendered-page checks. |
| Share tags: `og:title/description/image`, twitter card injected at build; `og:image` absolute only when `trip.siteUrl` is set | structure | Pass |
| Gallery (`npm run site`): four roadbooks (three examples + Kumano showcase) built into one folder with a chooser page | runtime (screenshot) | Pass |
| Demo recording (`scripts/record-demo.mjs`): real headless walkthrough → `docs/demo/demo.gif` and `.mp4` | runtime | Recorded 87 frames on the family-island build |
| iOS Safari, iPhone 17 Pro simulator (iOS 27.0 beta, Xcode 27 beta 4), built family-island site over localhost: Home, Days, Transport, Checklist, Map all render; bottom nav clears Safari's toolbar via the safe-area inset; `theme-color` tints the status bar; photos and fonts load. Screenshots only, no touch input (the simulator was driven by `simctl`, which cannot tap). | runtime (real WebKit, emulated device) | Pass |
| Lighthouse 13.4 on the built family-island site (`npm run preview`, headless Chrome): mobile 98 / 100 / 100 / 100 (performance / accessibility / best practices / SEO), FCP 1.4 s, LCP 2.3 s, CLS 0.03, TBT 0 ms; desktop 100 / 100 / 100 / 100 after contrast fixes. The only remaining flags are back/forward cache (the local preview sends `no-store`; hosts do not) and the network dependency tree. | measured | Pass; numbers are from a local server, not a CDN |
| Motion layer (`motion.mjs`): day fold animates then lands on the correct native `open` state; dialog entrance does not interfere with close; press feedback | scripted | Pass (japan-hiking, after porting from the Kumano site) |
| Showcase `showcase/kumano-kodo`: `npm ci`, 8 core tests, `build:visuals`, `build.py --public-only --package` from its new location; 38 files, release audit passed | logic + structure | Pass |
| Cold-load payload, japan-hiking, uncompressed | measured | Template files 83 KB (HTML 4.4, CSS 23.8, JS 38, i18n 3.2, data 14; ≈25 KB gzipped) plus the cover photo ≈95 KB before first paint; day thumbnails (15–60 KB each), route photo and paper tile load lazily. No web fonts, no third-party scripts. |
| Weak network / throttled load | measured (local browser) | See step 5 and the final checkpoint below for explicit Slow 4G/3G settings and before/after FCP/LCP. No production-network performance claim. |
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

## Continued local optimization pass

### Steps 1–4: devices and accessibility (2026-09-09)

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

### Step 5: local throttled measurements (2026-09-09)

Measured the built family-island site in fresh headless Chrome sessions through the Chrome DevTools Protocol, 390 × 844, DPR 2. HTTP cache disabled; service worker bypassed; no CPU throttle. Slow 4G here means 150 ms latency / 1,600 kbit/s download and upload; 3G means 400 ms / 400 kbit/s. These are explicit lab settings, not a carrier or production measurement. Each cell is one cold run, observed for 25 seconds with Paint Timing and Largest Contentful Paint observers.

| Profile | Before FCP / LCP | After FCP / LCP | Evidence level |
| --- | --- | --- | --- |
| Slow 4G | 1.092 s / 1.352 s | 0.776 s / 0.796 s | measured (local browser runtime) |
| 3G | 2.496 s / 5.140 s | 2.496 s / 2.668 s | measured (local browser runtime) |

In both before/after runs, the subtitle painted before the cover became the LCP element: the image did not block text first paint. The selected cover changed from `assets/cover.webp` (109,426 transferred bytes, including headers) to `assets/cover-900w.webp` (28,498 transferred bytes). The build now discovers the optimizer's 900/1800 px cover and 88/176 px thumbnail siblings, includes only discovered variants, and emits matching cover preload and image `srcset`/`sizes`. Derived `imageVariants` metadata is written only to built public data; source travel data is not changed. Existing trips without derivatives retain their original image fallback. All three examples have locally derived variants with full source/size/hash tables in their ASSETS.md files; no new image generation was used.

Validation: 45/45 `npm test` tests passed, including preload/render agreement, variant audit/cache inclusion, source-data preservation and no-variant fallback. `npm run check` passed for the 38-file family-island build (872,170 bytes). Raw measurements remain in ignored local `artifacts/local-pass-2026-09-09/network-before.json` and `network-after.json`.

### Step 6: print (2026-09-09)

**Runtime / measured:** Chrome 152 `--headless=new --no-pdf-header-footer --virtual-time-budget=8000 --print-to-pdf=… http://localhost:4195/` produced a 14-page, tagged Letter PDF of **1,930,216 bytes**, below 3 MB. The immediate baseline after responsive-image work was 4,803,425 bytes / 13 pages; the older ≈10 MB record above was not reproduced as the baseline of this pass.

The build selects existing small cover/day variants in print CSS and a locally resized 700 × 525 route photo. Print CSS disables shadows, filters, textures and animation transforms. Visual inspection found clipped place labels from the day-opening animation; disabling print transforms fixed them. Printing now includes every ground-transport category and every non-deleted checklist item, regardless of the current filter. Category headings stay with the next card.

`pdftotext` comparison of the initial image-only print optimization preserved the baseline text apart from live countdown digits. On the final PDF, all 68 checked day/event titles and notes, ground-category/item titles and text, and checklist texts/details were present. Rendered all 14 pages with `pdftoppm`; inspected the layout, then re-rendered and rechecked the affected pages after fixing animation clipping and heading pagination. This is text extraction plus visual runtime evidence, not just a successful export.

**Scripted browser interaction:** with Beaches and Packing selected and a partially selected input draft, dispatched beforeprint twice and afterprint. During print, all five pages, all eight tasks and all ground categories were present. After print, the category content, filtered list, progress, current page, input draft, selection range and input focus were restored. `npm test` remains 45/45; the 39-file built site passed `npm run check` (901,178 bytes). Local PDF, extracted text, rendered pages and state checks are in ignored `artifacts/local-pass-2026-09-09/`.

Network boundary: page resources were restricted to localhost. An initial Chrome CLI startup emitted background-service error messages, so that run does not certify absence of browser-background traffic. Subsequent CLI runs also used `--no-proxy-server` and hostname rules blocking all non-local names; test browser processes were stopped afterward.

### Step 7: blind skill rehearsals and iframe regression (2026-09-09)

Recorded A, C, D, E, J and K with three independent native Codex sub-agents; expected answers were withheld until their response files existed. All six received 2/2 against the scenario rubric. See [skill/evals](../skill/evals/README.md) for criterion scores and complete responses. This proves bounded proposed responses to those inputs, not that an agent implemented or deployed a site. No SKILL.md change was warranted by a below-2 result.

The D scenario also prompted a **separate scripted browser regression** on an isolated local build with a same-origin iframe navigating from `frame-one.html` to `frame-two.html`. It exposed a regression in this pass's initial focus fix: the close button waited for history traversal and left the dialog open while the iframe went back to frame one. Fixed again: UI release is immediate; ordinary app history is reconciled separately. If iframe history grew, the app clears its own marker without guessing how many iframe entries to traverse. The History API cannot safely purge those unknown entries; no such purge is claimed.

Same iframe-navigation test after the final fix: one close released the dialog, removed the frame source, cleared the modal marker and restored focus to the place row. Native Safari's keyboard open/close path also restored the final place's focus. Two unit regressions exercise the production close functions for immediate release, repeat-close safety, iframe-history growth, and focus/scroll restoration. `npm test`: 47/47 passed. iOS edge-back gestures and cross-origin provider behavior remain unverified.

### Step 8: first-roadbook run (2026-09-09)

A native Codex sub-agent executed expanded P01 in a clean local clone of `8c416f9`, with two fictional input files, without human answers or external services. Validate, gaps, build and release audit completed. The parent reviewed the output, corrected a future `updatedAt` value through the agent, and independently checked source hashes and absence of the two private markers from trip/dist. Final output: 11 files / 99,865 bytes, 7 gaps and 9 recorded questions. See [AGENTS.md](AGENTS.md) for version, failures/recovery and final hashes. This is **structure + static audit and an agent-execution record**, not a new Codex CLI/model-service run or runtime website verification.

### Step 9: i18n coverage (2026-09-09)

**Logic:** new tests compare every nested English/Chinese leaf key and interpolation variable, check literal `t`/`plural` references and singular variants, and enumerate the dynamic page/status/checklist key families. New unclassified call syntax fails the scan instead of being silently ignored. Added the missing English single-day form and its Chinese counterpart. Navigation region labels, page labels and the skip link now follow the locale; built loading/no-JavaScript fallbacks are localized too. A Chinese-build regression verifies those prerendered strings. `npm test`: 51/51 passed. This is key/markup coverage, not a claim of complete linguistic review or Chinese screen-reader testing.

### Step 10: Windows availability (2026-09-09)

No local Windows execution environment was found: `prlctl`, `VBoxManage`, `vmrun`, `tart` and `qemu-system-aarch64` were absent from PATH; no Parallels, VMware, VirtualBox or UTM app was found in system/user Applications; the usual `~/Parallels` and `~/VirtualBox VMs` directories were absent. No Windows commands were run, and Windows compatibility remains unverified. No VM was installed or remote machine contacted.

## Production (2026-09-09)

| Check | Level | Result |
| --- | --- | --- |
| Repository public at https://github.com/clarkchenkai/travel.skill ; CI workflow green on push (`npm test` + build/audit of every example) | production | Pass (16 s) |
| Examples gallery deployed by `pages-demo.yml` to https://clarkchenkai.github.io/travel.skill/ ; `/`, the three examples and `kumano-kodo/` (including the 8 MB font and `story.js`) return 200 | production | Pass; Kumano showcase built on the runner with Pillow |
| `og:image` on the live site is absolute (`--site` passed by the workflow) | production | Pass |
| Offline check against the live family-island URL: service worker active, 38 entries precached, offline reload renders | production (headless Chrome) | Pass |
| "Use this template" → Pages (Actions) → `pages.yml`: starter roadbook served at the copy's Pages URL within a minute | production | Pass; the temporary test repository still exists until the maintainer deletes it |
| Real readers on real devices/networks | adoption | None yet |

## Remaining evidence gaps

- Other hosting routes in `docs/PUBLISHING.md` remain unverified; the GitHub Pages deployment is recorded above.
- No real traveler has built a roadbook with it yet. The stage-one goal (ten strangers) has zero data points.
- No physical device yet. iOS Safari has runtime and partial simulator-touch evidence (see the dated pass above); the complete touch checklist is unfinished. Android Chrome has not been checked.
- No completed VoiceOver speech/navigation pass; native Safari keyboard traversal and accessibility-tree inspection are recorded separately.
- Real CJK composition Enter behavior, iOS edge-back gesture, standalone launch and complete enlarged-text touch navigation remain unverified for the concrete tool/environment reasons above. No new service-backed Codex CLI run was made.
- No test of a self-hosted font. Images are exercised by the three examples (cover, day thumbnails, route photo, paper tile); each example builds under 1.5 MB and the audit passes.

Update this file when a row changes level. Do not summarise it into a badge.

## Final local checkpoint — 2026-09-09

Runtime source at `3de8903`: 52/52 tests passed; the final family-island build contains 39 files / 902,772 bytes and passes the release audit. A shared-image regression first failed when a day thumbnail replaced the cover's candidate list; the fix retains both size families and keeps tiny thumbnails out of cover selection.

Headless Chrome runtime checks on the final built site passed all five destinations at 390 and 1280 px: one active page, matching navigation state, seven day cards, no document-width overflow and no loading error. The selected cover was 900 px on the narrow viewport and 1800 px on the wide viewport (DPR 2). A final fresh 3G run with the same 400 ms / 400 kbit/s settings and service-worker bypass measured FCP **2.616 s**, LCP **2.716 s**, with the subtitle painting before the cover. This is a single local lab run, not a population statistic.

The simulator text size was read back as its original `large`; no VoiceOver process remained. No push or deployment was performed. Source changes and evidence records were committed locally; generated screenshots, PDFs, raw measurements and the fictional first-roadbook clone remain local-only.

## Production browser follow-up — 2026-09-10

Live source `c0f9974`: headless Chromium checked 21 example pages at a verified 375 px viewport. No horizontal overflow or clipped cover/control text occurred; the rail ticket dialog measured 375 px and was visually inspected after its animation. One early business-page route check ran before the dynamic module finished loading. Inspection confirmed the loading message was hidden before module loading and event binding completed.

The follow-up keeps loading visible until modules, core renderers, event bindings and the initial route are ready. A delayed-module regression failed against the old initializer and passes with the change; 83/83 tests and the business build/release audit pass. This is a loading-state correction, not a claim that arbitrary module code cannot stall.

Device enumeration found the physical iPhone unavailable and an iPhone simulator connected. Physical touch and mobile WeChat remain unverified; simulated device results must stay separate. The local proxy/network configuration was not changed.
