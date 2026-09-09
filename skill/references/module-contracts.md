# Module Contracts (0→1)

Every module uses the same acceptance chain: **real input → default render → user action → state change → error/return → persistence boundary → mobile/desktop → post-release read-back.**

Not every trip needs every module. If one does not apply, write why. Never fill a gap with an empty shell, static copy, or fake bookings.

## 1. Title, home, and entry

**Input:** trip name, date range, audience, visual direction, whether an opening sequence is wanted.

| Feature | Implementation | Acceptance |
| --- | --- | --- |
| Site name | Initial HTML `title`, runtime `document.title`, and share title agree; add `og:` tags if needed | Check first load, after load, and the share card; do not promise a chat app will refresh a cached card |
| First screen | The first visible state is complete; do not start from a blank background that needs JS | Cold cache, slow network, and failed images still show how to get in |
| Entry gesture | Plain tap or a meaningful swipe; thresholds, bounce-back, and mouse/keyboard alternatives defined | Short swipes do not misfire, vertical scroll does not trigger it, keyboard works |
| Scene state machine | Stages, visible layers, timing, pause, completion event — one control source | Keyframes match the current order; no flashed frames, gaps, or dead air |
| Skip | If the opening delays the task, offer a skip the user accepts; a full-screen tap is fine | Skippable mid-stage; stale callbacks cannot pull it back; the overlay is removed |
| Final state | Title and navigation appear as agreed; decide explicitly whether returning home replays | Returning keeps the final state or replays by decision, never at random |
| Degradation | If images or a render engine fail, keep a static scene or a direct content entry | No WebGL, reduced motion, and page-hidden recovery all work |
| Menu reuse | The home final state reuses the main navigation | The DOM contains only the expected number of menus; no overlap, no blocked taps |

Narrative is not a global template. If the user only wants a practical itinerary, do not impose an opening animation, swipe ritual, or invented characters.

## 2. Pages and navigation

**Input:** applicable pages, default destination, home behavior, deep links, mobile/desktop layout.

| Feature | Implementation | Acceptance |
| --- | --- | --- |
| Page switching | Hash, router, or server pages all work; if the user wants separate pages, show only the target section | Scrolling the map page never reveals itinerary, transport, or checklist |
| Single navigation | One set of page IDs, labels, icons, and selected states | Clicks, browser back/forward, and deep links agree |
| Icon-only | Drop labels only when the user chose it and meaning is clear; keep `aria-label` | Screen-reader names correct, focus visible, icons carry the right background |
| Icon assets | Keep single images and sprites distinct; a transparent car must not inherit a map sprite's background | Check computed background/image and screenshots, not just class names |
| Repeat taps | Tapping the current page returns to the top or holds position, per project decision | An unchanged hash must not make the button feel dead |
| Page state | Keep content mounted or save state explicitly across page switches | Itinerary → map → itinerary keeps expansions; checklist records survive |
| Bottom safe area | Reserve space for the bar, device safe areas, and the soft keyboard | The last item is fully visible and tappable; inputs are not covered |
| Desktop | Floating bar, sidebar, or whatever was chosen; reflow content by width | No second routing system; touch-desktop and keyboard still work |

When removing a top bar, handle its placeholder, scroll offsets, and dependent nodes. Keeping a hidden node to avoid an init crash is acceptable debt if you say so — but "visually hidden" is never a way to hide private data.

## 3. Route overview and place directory

**Input:** main cities, real route order, place IDs, first actual visit dates, map provider.

| Feature | Implementation | Acceptance |
| --- | --- | --- |
| Overview | Accurate geographic map or stylized route art — the user chooses | Stylized art is never presented as real distance or navigation |
| Map image | Titles and place names may come from generated art; accurate navigation data lives separately | Inspect spelling, orientation, duplicate labels, misleading connecting lines |
| Place directory | Include the stations, hotels, and sights actually used, not just big cities | Every applicable place opens; the count follows the data |
| Date association | Link by real visit date; "confirm tomorrow's airport trip" is not a visit | Repeat visits follow a stated first/all rule, never guessed from strings |
| Expansion | Default open/closed and column count follow density and the user's choice | Shrinking type must not shrink the touch target |
| Image viewing | Add a zoom view only when it is genuinely needed | Keep the needed full-size view; closing returns in place |
| Offline fallback | The overview can render locally; place services may fail independently | A dead map provider does not take down the itinerary |

## 4. Place map dialog

**Input:** local-language name, address, coordinates or an explicit map target, public phone, sources, sharing scope.

- On open, sync title, local name, address, map URL, copy payload, and sources. No residue from the previous place.
- An iframe `load` event can fire for an error page — it is not proof the map rendered. Close and copy-address must work independently of network load.
- Copy preserves the original address text; a "copied" toast must correspond to real success. On failure, leave selectable text.
- Map hand-off, copy, and source links belong to one action system. Test with long local names and long official titles.
- Close works on the first press: release the dialog, unlock scroll, restore reading position, then apply the history policy. Never stake closing on a cross-origin iframe's back event.
- Repeated close presses must not navigate elsewhere. ESC, backdrop, and browser back behave like the button.
- Reopening starts from a sane state; stale callbacks must not affect a new place; abort useless loads on close.
- Which map provider you use is a regional-availability decision. Local name, address, and coordinates are not tied to a provider.
- Desktop dialogs cap reading height; mobile dialogs scroll and keep close reachable. Do not lock heights so large type breaks.

**Minimum acceptance:** scroll into a long itinerary → open a place → close once → the same day and expansion remain → open another place → address and target agree → simulate network failure and confirm close/copy/hand-off still work.

## 5. Daily itinerary

**Input:** date, title, activities, real time ranges, fixed departure times, linked stays/transport/tickets/sources.

| Feature | Implementation | Acceptance |
| --- | --- | --- |
| Complete dates | Generate every day; handle the date line and local dates by real trip rules | No missing or duplicate days, no activities moved across midnight |
| Day summary | Date plus a short title; other status only when the user wants it | Do not repeat day number, date, route, and party size everywhere |
| Expand control | A visible plus/minus, arrow, or other unambiguous affordance | Visible over bright images; the hit area is not as thin as the icon |
| Ordering | Times may be exact or relative ("morning", "after arrival") — mark which | Never present a suggested minute as a scheduled departure |
| Time typography | Long ranges read in full; do not squeeze them into a narrow column | `07:15–08:25`, next-day `00:30`, and long local-language text wrap cleanly |
| Summary vs detail | Show the action summary by default; details and maps on demand | What is reduced is initial density, not useful facts |
| Day cover art | Matches the real country, city, and mood; six days do not need six near-identical towers | Generated art never adds an activity; titles reflect real transfers |
| Tickets | Ticket status appears on the matching event and is not double counted | Purchased / reverted / shared-across-days sync by `ticketId` |
| End-of-day collapse | Long days can collapse at the bottom and scroll back to the summary | Focus and scroll position stay sensible |
| State persistence | Page switches, dialog closes, and width changes do not reset user actions | State stable, record scope accurate |
| Animation | One meaningful entry/expand feedback | Avoid parent and child opacity animations that make stay blocks flash |
| Desktop | Two-column day cards, cross-column expansion, or master–detail; cap line length | Do not shred dozens of activities into tiny tiles; the count is unchanged |

Weather, season, opening hours, and closures need current official verification. Cover art is never evidence about scenery, roads, or weather.

## 6. Flights and cross-border legs

**Input:** the full journey and its legs, airport IATA codes, local names, terminals, departure/arrival times with time zones, booking status, advisories.

- One card is one complete journey: keep every leg and layover. Never invent a connection on a direct flight. Without booking evidence, neither the card nor the sample data says "confirmed" or "ticketed".
- Lead with city/airport, date, times, and time zone. Flight number and terminal are secondary but easy to find.
- A flight number (e.g. `XY123`) is not an e-ticket number, PNR, or booking reference. A public card does not show those by default, and must never invent or import private credentials to "look like a real boarding pass".
- Cards may use generated ticket paper and scenic stubs; **facts, amounts, times, status, and countdowns are DOM.**
- Countdowns use absolute instants; never subtract clock faces across time zones, DST, or midnight. Expired means zero or "past", never a negative number or a fake live status.
- The next flight may be selected by default. Keep past flights viewable; never auto-delete the itinerary.
- Swipe, prev/next, dots, card count, and `aria-current` stay in sync. A hidden container must not report the current card as index 0; restore on re-show and width change.
- A long note grows its own card height without stretching the paper texture, clipping neighbors, or looping `ResizeObserver`.
- If the user drops the collapse, remove the `details`/`summary` and its toggle dependencies — not just default it open.
- If the user picks one reference time zone, convert dates, times, and labels together; keep original values recoverable.
- Outbound and return advisories map to real activities; removing a redundant "ticketed" line does not mean deleting the status data. With a return flight already present, do not add a second return module while "wrapping up".

**Minimum acceptance:** default next flight → swipe to the return → change display time zone → expand/collapse notes → switch pages and back → the countdown is correct across the departure boundary; large type and small screens do not clip.

## 7. Ground transport and driving (as applicable)

| Submodule | Required content | Real actions and failure edges |
| --- | --- | --- |
| Rail | Station names, service or ticketing method, seat requirements, in-station transfers, fare classes | Open ticketing guidance, copy the local name, open the station map; do not pin unverified minutes |
| Bus | Boarding and alighting stops, direction, payment, reservation or queueing rules, service days | The operator's info is findable on the day; key text survives offline |
| Walking / hiking | Segments, distance and time basis, trailheads, resupply, weather limits | Connects to real transport and lodging; difficulty claims cite a source |
| Ferry / cable car / border crossing | Pier or entrance, boarding cutoff, operating limits, document requirements | Time zone, cancellation, and weather-sensitive items verified explicitly |
| Rental | Brand, model "or similar", pickup/return locations, cutoff, currency, fuel/mileage, coverage | Keep the order's original wording; the return countdown is its own clock; never invent eligibility |
| Driving | Driving side, documents and translations, roads/tolls/parking, return inspection | Verify from the current destination's official or supplier sources; do not carry over another country's rules |

When a rental applies, work through the [25-point rental checklist](coverage-and-rental.md). When it does not, do not generate an empty module.

Tab switching preserves each tab's expansions; keyboard left/right/Home/End matches the visible selected state. Ticketing links, advisories, maps, and official sources are not decoration — walk at least one complete path for real.

## 8. Tickets, reservations, and costs

**Input:** product name, applicable activity, recommended vs required reservation, where to buy, local-language display text, price and currency, status source.

- Keep a personal checkbox distinct from supplier confirmation. Ticking a box does not claim a booking system verified anything.
- Sync every appearance of the same `ticketId`; removing a "to buy" count must not break the underlying items.
- Large local-language text for showing or copying at a counter is a tool, not proof of purchase.
- Keep date, scope, party size, age rules, reference price, and amount actually paid distinct. Optional tickets must not be styled as mandatory.
- Unknown costs stay blank or "to confirm" — never `0`. Use ISO currency codes so identical symbols do not mislead.
- Paper textures and warning graphics still put legibility first; a red texture must not read as a danger alert.
- External links keep true semantics and targets. Purchasing, paying, or changing a booking happens only under the user's authorization at that moment.

## 9. Stays and food

Link stays to real check-in dates; keep after-midnight arrivals, multi-night stays, and checkout days distinct. Public names and addresses open a map; local-language names, entrances, arrival requirements, and phones can collapse.

- If the user does not want "booked" badges, remove the display but keep the fact.
- When removing a duplicate map name, replace it with a clear "Map" action and keep the full name accessible.
- Do not add hotel photos by default. If asked, say which are real and which are generated; a fictional lobby is not the hotel entrance.
- If a pickup was already cancelled by decision, do not regenerate a "contact hotel for pickup" to-do.
- Restaurant candidates, recommendations, reservations, and prepayments are different states. A photo is not a reservation.

## 10. Checklist and notes

**Input:** preset tasks and items, user additions, stable IDs, local persistence scope.

| Feature | Implementation | Acceptance |
| --- | --- | --- |
| Categories | All / to-do / items, or whatever grouping fits the trip | Categories and counts are defined consistently, not copied by rote |
| Input | Empty, duplicate, max length, IME composition state | Selecting a candidate with Enter does not submit; hints useful; focus stays |
| Checking | Actually changes state and counts | Add, check, uncheck, and refresh all agree |
| Delete / undo | Restore original category and checked state; focus lands on a sensible next item | Cross-category undo restores the original item and its completion record |
| Local storage | Stable keys and IDs; degrade sensibly on corrupt old data | Never wipe the user's browser to test; report storage failure honestly |
| Swipe categories | Only if asked: threshold, direction lock, multi-touch, edges, misfire suppression | Vertical scroll and typing are not intercepted; synthetic events are not device testing |
| Keyboard | Left/right/Home/End across categories; controls focusable | Basic tasks complete without a mouse |
| Small delights | Packing fills, light feedback — exploration is fine | Ship only after the user adopts them; keep explorations out of the release |
| Source notes | Original sources traceable, body text at a consistent scale | The footer is not micro-type or an abrupt color block; links survive |
| Desktop | Two columns are fine if reading and keyboard order hold | Do not split state into two copies or silently become a collaboration system |

## 11. Whole-site delivery check

Name consistent everywhere; each page shows only what belongs to it; every type size actually uses the chosen font; no 404 images, sprite bleed, or bad crops; theme or language switches never change trip facts; no leftover demo buttons, placeholder copy, or rejected approaches; the stated recording scope, access conditions, and source boundaries are accurate.

Anything you could not verify is written as "untested" or "incomplete". Feature exists, unit tests pass, module preview works, main page works, production release, and real-device access on the reader's own network are **different levels of evidence** — see [evaluation](evaluation.md).
