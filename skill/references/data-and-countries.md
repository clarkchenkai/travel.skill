# Data, Privacy, and Cross-Country Fit

## 1. Three data layers, one set of facts

| Layer | Purpose | How it changes |
| --- | --- | --- |
| Originals and working facts | Orders, source material, user confirmations, conflicts, provenance | Originals are never edited; reconcile in your working notes |
| Audience-visible snapshot | What the site and the cloud build may read | Generated to an explicit public scope — not hidden with CSS |
| User interaction state | Checks, additions, deletions, current card, expansions | Keyed by stable IDs; never overwrites base trip facts |

If a JSON structure already exists, use it. Do not add a second source of truth or invent an ontology without need.

If CI cannot see private working data, commit a generated, reviewed public snapshot and let the clean build read only that. Whoever changes the facts regenerates the snapshot; a module task must not treat the stale public snapshot as its own source of truth. An open template ships fresh sample data and clean history — a private repository does not make a public website private.

## 2. A reusable relationship model

Minimal example; existing projects do not have to migrate:

~~~json
{
  "trip": {
    "id": "sample-trip",
    "title": "Sample Trip 2027",
    "startDate": "2027-03-27",
    "endDate": "2027-04-02",
    "locale": "en-US",
    "countries": ["FR", "GB"]
  },
  "places": [
    {
      "id": "station-a",
      "name": "Station display name",
      "localName": "Local-language station name",
      "timeZone": "Europe/Paris",
      "sourceRefs": ["operator-a"]
    }
  ],
  "days": [
    {
      "id": "day-a",
      "date": "2027-03-27",
      "timeZone": "Europe/Paris",
      "events": [
        {
          "id": "event-a",
          "timeLabel": "after arrival",
          "title": "Head to the apartment",
          "placeIds": ["station-a"],
          "ticketIds": [],
          "sourceRefs": ["operator-a"]
        }
      ]
    }
  ]
}
~~~

Dates, times, IDs, currencies, and country codes are stable machine fields; display text is separate. Do not silently translate letter case, real station names, fare-class names, or request fields.

Status is a fact too. Without an order or a user confirmation, use an explicit `unknown` / `null` / `needs-confirmation`. **Even in a draft JSON template, never pre-fill `confirmed`, `booked`, or `paid`.** A user describing a trip is not a user who has booked it.

Relationship checks: every `placeId`, `ticketId`, and `sourceRef` resolves; dates are complete; events are not duplicated; shared tickets are not double counted; stay nights match transfer days; private fields do not leak back in through notes or source links.

## 3. Global time rules

- Use ISO times with offsets for flights and scheduled services, and keep each endpoint's IANA time zone. Compute endpoints separately; never set one global time zone for the whole site.
- Durations are differences between absolute UTC instants; displayed times use each endpoint's local zone. The reader's device location does not change trip facts.
- Crossing the date line can produce an arrival "before" departure. Do not treat calendar order as proof a flight is invalid.
- DST creates repeated and non-existent wall-clock times. If you have only `01:30` and the zone transition is ambiguous, flag the gap and check the official source or the order — never pick one silently.
- "Which day of the trip" comes from the chosen trip calendar rules; it is not the reader's real location or real progress.
- An expired countdown reads zero or "past". Activities without a fixed time get no countdown.
- On days with a cross-border transfer, use per-event and per-endpoint time zones, not one zone for the day.
- Crossing midnight, a rental return cutoff, a boarding cutoff, and a hotel check-in window are different business concepts.

Test at least one cross-zone flight and one midnight boundary; add real cases for DST and the date line when they apply. Testing one country pair does not make the site globally correct.

## 4. Country differences, verified when relevant

| Dimension | What to check | Assumptions not to copy |
| --- | --- | --- |
| Maps and network | Whether your readers' region can reach the map, the external links, and the host | That any one map provider or host is reachable everywhere |
| Language | Display language vs local names, text direction, address format, font coverage | That every local script can be transliterated cleanly |
| Currency | ISO code, decimal places, tax and fees, reference vs paid amount | That a shared currency symbol means the same currency, or that all prices use two decimals |
| Public transport | Reservation, ticket checks, boarding, payment, service days, strikes and outages | That one country's fare classes or cash habits generalize |
| Driving | Driving side, documents, rental eligibility, coverage, fuel, one-way fees | That an international permit automatically makes renting legal |
| Hiking and weather | Season, sunset, trail closures, resupply, bail-out routes | That a forest photo proves a route is safe or easy |
| Comms and emergencies | Local service numbers, phone formats, connectivity | That one country's emergency number works globally |
| Booking policy | Time zone, cutoffs, changes and refunds, party size and age limits | That one confirmation covers every linked service |

Handle only what this trip actually needs. Check current official sources, record the verification date and the original entry point. If the user forbids network access, comply and mark time-sensitive facts as unverified.

## 5. Multilingual text and fonts

Local names are for searching and showing on the ground; the reader's language is for understanding. When a translation is uncertain, keep the original name and do not merge two similar station names.

Sample separately across the scripts you actually use — extended Latin, CJK, Arabic, and others: long names, wrapping, input, copy, and map search. For right-to-left scripts, check reading order and directional icons while keeping airport codes and times in readable order. A `font-family` string in CSS is not proof every glyph rendered in the intended face.

## 6. Public information boundary

Decide the access model first: public, link-accessible but unauthenticated, or genuinely restricted. These are three different things.

A public build normally must not contain:

- Passports or IDs, ticket numbers, PNRs, order numbers, PINs, payment details, private contact details, or keys.
- Original screenshots and PDFs, intranet or token-bearing links, filenames carrying sensitive information.
- Private information accidentally left in notes, HTML comments, JS objects, images, or source descriptions.

A hotel's public service line and a private host's mobile number are not the same class of data. Real hotels, exact dates, and a complete itinerary can themselves be sensitive — handle them by the user's sharing scope, not by deleting a field name and declaring safety.

Do not treat every name, amount, and phone number as secret. Anonymized display names, agreed forms of address, budgets and ticket prices, and a business's public contact number can stay when the audience allows it. Traveler identity, payment credentials, and private contact details need separate handling.

A check script can only spot structure and obvious markers. It cannot replace human review of free text and images. Never commit raw private data first and hope `.gitignore` cleans up history.

## 7. Add multi-user sync only when asked

`localStorage` cannot do multi-device sharing. If the user wants travel companions to share the checklist, first decide who may read, who may write, and whether accounts or a controlled join flow are needed. Minimum contract:

- Isolate by `tripId`; the server enforces membership, not a hidden front-end button.
- Separate base itinerary from member actions; every state row has a stable ID plus author, version, or update time.
- State the conflict rule (per-item last write, or version-conflict prompt). One client must never overwrite the whole list.
- Show "not synced" on network failure; retries are idempotent and duplicate submits do not create duplicate items.
- A publicly readable link is not a public write grant; removed members lose write access.
- Verify with two independent sessions: A edits → B sees → B edits back → A sees. Then test unauthorized writes, offline recovery, and cross-trip isolation.
- Without those checks, report local save or "sync incomplete" — never "everyone is in sync".

This branch needs a real backend and access model. Do not pre-build accounts, databases, or collaboration flows for a personal itinerary.

See also: [module contracts](module-contracts.md), [evaluation](evaluation.md), [release and access](release-and-access.md).
