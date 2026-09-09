# Coverage Checklist and Rental Details

Distilled from an atomic feature list. Keep the checking granularity; do not inherit a single-page layout, a palette, a fixed tab count, or one country's rules.

## Project coverage table

Maintain one table in your existing working notes when starting or heavily reworking a project. Reuse existing IDs; use the ones below only if you have none. Per row: why it applies, page or component, status, evidence, untested items. Status is todo / implemented / verified / not applicable. Adoption and release stay in the [dispatch table](orchestration.md).

| ID | Capability to check | Observable result |
| --- | --- | --- |
| ID01 | Title and share metadata | Initial, runtime, and share titles agree |
| NAV01 | Page entries | Every entry reaches the agreed page with correct state |
| NAV02 | Deep links and back | Refresh, forward/back, and repeat taps behave as agreed |
| HOME01 | Opening and degradation (if any) | Normal play, skip, and reduced motion all reach content |
| FL01 | Complete legs | Endpoints, connections, flight numbers, terminals, dates all match |
| FL02 | Times and cutoffs | Computed from absolute instants; cross-zone, cross-day, and expired are correct |
| FL03 | Multi-card state | Swipe, buttons, and pagination agree, including after re-show |
| MAP01 | Route overview | Spatial relationships and trip order are legible; art is not passed off as navigation |
| MAP02 | Place targets | Directory, local name, address, and map target correspond |
| MAP03 | Map close and failure | One tap closes and returns in place; failure still allows copy and exit |
| DAY01 | All dates and activities | Nothing missing, duplicated, or misassigned; exact times vs ranges distinguished |
| DAY02 | Expansion and reading context | State and focus stay sensible after expand, collapse, or returning from a map |
| STAY01 | Stays and food | Correct check-in dates; candidates differ from bookings; real entries work |
| TKT01 | Tickets and reservations | Personal checks reversible, shared tickets linked, no fake issuance evidence |
| COST01 | Costs | Name, currency, reference/paid/outstanding, and what is included are clear |
| MOVE01 | Ground transport | Applicable modes, ticketing, and transfers are actionable |
| PREP01 | Input and counts | Empty, duplicate, IME, add/check/delete/undo all correct |
| PREP02 | Persistence boundary | Survives refresh, reports storage failure, never claims multi-user sync |
| DATA01 | Single-source data change | Related pages and reminders update; no second hardcoded copy of the facts |
| SRC01 | Sources and public scope | Facts traceable; published files carry nothing that should stay private |
| UI01 | Mobile and desktop | Target sizes readable and operable; no occlusion or bad crops |
| REL01 | Production update | The right commit reaches the original URL; changed assets and features read back |
| REC01 | Recovery (risk-based) | An old artifact restores and user state stays compatible; undrilled means untested |

This is a checking index, not authorization to add features. A simple trip with no flights marks the FL rows not applicable. Add rows for identity, permissions, conflicts, and dual-session acceptance only when multi-user sync is actually required. Implementation detail stays in [module contracts](module-contracts.md).

## Rental: only when the trip needs it

Follow the actual order and the destination's official or supplier documentation. Cars, campers, and motorcycles share the model; do not transfer one vehicle type's attributes to another.

| ID | Data or capability | Acceptance |
| --- | --- | --- |
| RENT01 | Supplier and branch | Brand and the actual pickup/return branch are clear; a booking platform is not a branch |
| RENT02 | Model or product | Keep "or similar" wording; do not promise the sample model |
| RENT03 | Class and capacity | Seats and luggage match the order; unknown is not guessed |
| RENT04 | Required specification | Transmission, drivetrain, battery, or other attributes listed only with evidence |
| RENT05 | Mileage and usage area | Unlimited or capped, excess fees, cross-border limits not omitted |
| RENT06 | Pickup time | Date, local time zone, branch hours and late-pickup rules correspond |
| RENT07 | Pickup location | Address, branch's local name, airport shuttle or entrance findable |
| RENT08 | Return time | Latest date and time zone explicit, not mixed in with ordinary activities |
| RENT09 | Return location | One-way returns use the real branch, never the pickup address |
| RENT10 | Rental period pricing | Keep the order's billed days distinct from calendar days; do not restate the price yourself |
| RENT11 | Payment timing | Prepaid, pay at counter, and pre-authorization expressed separately |
| RENT12 | Amounts and currency | Base, included, outstanding, and reference prices are not merged |
| RENT13 | Deposit and payment instrument | Amount, card, and cardholder rules have a source; sensitive card data stays private |
| RENT14 | Extra fees | One-way fee, additional driver, child seat and similar taken from the order |
| RENT15 | Fuel or charging policy | Pickup and return requirements and top-up charges explicit; full-to-full is not a default |
| RENT16 | Changes, refunds, and late arrival | Cutoff time zone, fees, and no-show rules verified against the current order |
| RENT17 | Coverage names | Keep the official coverage name alongside a plain-language meaning; do not merge different coverages |
| RENT18 | Excess and exclusions | Excess, exclusions, and add-ons come from the terms; never infer "fully covered" |
| RENT19 | Eligibility documents | Licence, translation or permit, age, and driver rules verified against local law |
| RENT20 | Pickup inspection | Existing damage, photos, equipment, fuel/charge and odometer recorded |
| RENT21 | Return inspection | Location, time, photos, key handover, fuel/charge, and receipt are actionable |
| RENT22 | Breakdown and accident contacts | The supplier's published contact and procedure; never invent a local number |
| RENT23 | Local driving rules | Driving side, tolls, and parking match the destination; do not carry over another country's rules |
| RENT24 | Standalone return reminder | When wanted, show absolute cutoff, location, time zone, and its own countdown |
| RENT25 | Organization and state | Summary, inspection, coverage, and rules can be grouped; switching keeps records; three tabs are not mandatory |

A return countdown must not be faked from a static date. When the return branch or time changes, update the summary, reminder, map, and related itinerary together. Booking, buying, or changing an order still requires the user's authorization at that moment.
