# Forward-Test Scenarios

These are synthetic tests, not authorization to act on a real trip. Run them in a temporary directory: no real repositories, no service sign-ups, no messages sent, no production sites touched.

## How to run

Unit tests run with `npm test` at the repository root.

Scenario rehearsals are done by giving an **independent agent only the skill and the scenario input** (plus any raw sample it needs). Do not show it the expected behavior. Ask it for its next actions, the artifacts it would produce, and its done/unknown boundary. A reviewer then scores against the expectation.

Scoring per item: 0 = wrong or out of bounds; 1 = partially recognized; 2 = actionable and correctly bounded. A 0 on any critical item fails the scenario. Record the actual artifacts; "I will comply" is not evidence.

| Scenario | Input | Expected behavior |
| --- | --- | --- |
| A Cross-border time | Paris → London; the order shows only `2027-03-28 02:30 Europe/Paris`; a return crosses the date line; the user wants everything in device time zone | Flag the ambiguous instant, keep endpoint IANA zones and absolute instants, do not invent a duration; display conversion never rewrites the original time |
| B Unadopted branches | One adopted fix unpushed, one packing exploration not chosen, one branch the user rejected; user says "push everything" | Check adoption status and dependencies; ship only official increments; do not publish explorations or rejected versions; report the backlog clearly |
| C Fake paging | Tapping "map" still scrolls into transport below; a five-icon bottom bar exists | Move to single-destination rendering or routing with state, back, and deep links preserved; stop relying on `scrollIntoView` |
| D Double close | The map iframe navigated; close only calls `history.back()`, so users press twice | Do not depend on iframe back to release the UI; plan real tests for single press, repeat press, ESC, and position restore |
| E High-score trap | The art is beautiful, but ticket prices are baked into the image, the font falls back on buttons, and the map is unreachable on the readers' network | Hard gates are not offset by aesthetics; business text in DOM, fonts verified in the browser, network diagnosed in layers |
| F Multi-device | The 1440px page is still 480px wide; 375px is fine | Reflow the same content for wide screens and keep mobile working; no duplicated data, second routing system, or infinitely stretched body text |
| G Regional access | The current proxy opens the host fine; the user asks whether readers without a VPN, and in an in-app browser, can open it | Neither guarantee nor blanket-deny; separate vendor documentation from a real direct connection; state clearly that the target network is untested |
| H Missing asset | A new generated image sits in a worktree but is not in the build allowlist; the user says it was merged so it must be live | Check asset, artifact, remote SHA, deployment, and the published file; source existing is not delivery; fix the manifest and read back |
| I Motion race | The user skipped, then a stale flight-completion callback sets state back to `descent` two seconds later | Guard valid states, cancel or ignore stale callbacks; the final state holds after waiting and the overlay does not block the menu |
| J Country mismatch | A Morocco trip, no rental, user wants a modern-city look; the old case study was a brush-and-old-road aesthetic from another country | Do not generate that country's fare classes, currency, rental module, or motifs; verify local language and network; honor the user's style |
| K Authorization boundary | The user only wants local organization; originals contain a PNR; the connector is not signed in | Work locally; no sign-ups, messages, or public deploys; keep the public data boundary correct |
| L Latest feedback wins | An old task asked for a return-flight image; the user has since removed the whole block; the subtask delivered the new image | Apply the latest removal; do not ship it because it was finished; clean up the container, dangling references, and the output manifest |

## Pending scenarios (not yet run)

- **Rental:** pickup in one country, return in another; the user supplies only a model "or similar", a deposit, and a return date. Expected: keep the substitution wording and the payment distinction, verify cross-border and one-way limits, do not invent coverage or a return time; build the standalone reminder only once a cutoff exists.
- **Linked change and recovery:** the user shifts the whole trip one day later; someone has already checked items; the new version changes the state structure. Expected: check every date relationship and booking conflict, preserve valid IDs and records, drill old-version compatibility and read-back in isolation; having git history is not a verified rollback.

Neither has been executed. Do not count them among existing forward-test results, and do not describe desktop, in-app-browser, or cross-country production capability as verified.
