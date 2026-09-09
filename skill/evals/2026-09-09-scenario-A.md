# Scenario A rehearsal — 2026-09-09

Agent: Codex native sub-agent `/root/blind_scenarios_ac`. The session model was inherited; a specific model/version identifier was not exposed by the spawn result.
Reviewer: parent Codex task, after the response artifact was written.
Evidence level: recorded blind proposed-response rehearsal. Not implementation, browser interaction, production or traveler adoption.

## Blinding and input

The agent received only skill/SKILL.md, needed linked references (excluding scenarios.md), and an input-only packet. Expected answers and existing evals were withheld. The input packets were extracted before delegation; the reviewer read the expected column only after all six response files existed. Each agent listed the files it read in its response.

Verbatim scenario input:

> Paris → London; the order shows only `2027-03-28 02:30 Europe/Paris`; a return crosses the date line; the user wants everything in device time zone

Original response SHA-256: `7508b36b6ed1e2cf2faf8dd4be265ccc70e2658ad1a3935527a6c292db3605d8`.

## Score

| Criterion | Score | Evidence in the response |
| --- | --- | --- |
| Unresolved instant | 2 | Flags the Paris DST transition and refuses to invent a duration. |
| Original time retained | 2 | Keeps endpoint IANA zones and offset-bearing absolute instants. |
| Display conversion | 2 | Converts display labels without rewriting source times. |
| Evidence boundary | 2 | Batches missing primary details and labels the response as proposed checks. |

Overall: **2/2**, actionable and correctly bounded under the scenario rubric. No critical criterion scored 0.

Skill change made: none; this response did not expose a below-2 skill outcome.

## Recorded response

Only the machine-specific repository path prefix was removed for portability; wording otherwise preserved.

# Proposed response — Scenario A: Cross-border time

## Verbatim input

```text
# Scenario A Cross-border time

Paris → London; the order shows only `2027-03-28 02:30 Europe/Paris`; a return crosses the date line; the user wants everything in device time zone
```

## Relevant skill material read

- `skill/SKILL.md`
- `skill/references/data-and-countries.md`
- `skill/references/module-contracts.md`

## Proposed response and action plan

I can record the Paris-to-London leg as incomplete, but I would not turn the supplied `2027-03-28 02:30 Europe/Paris` value into a scheduled instant yet. That wall-clock time falls in the Europe/Paris daylight-saving transition window, so it may be a non-existent local time. The material also does not supply the transport mode, departure and arrival airports/stations, an arrival time, the return endpoints, or source evidence of booking. I would keep its status `needs-confirmation` (or `unknown` if no status is asserted), never `booked`.

I would ask in one batch:

1. Please share the order/official itinerary line for the outbound and return, with every endpoint, local departure and arrival time, and airport/station or flight/service number if shown. For the Paris time, please confirm the exact value from the issuer because `02:30 Europe/Paris` on 2027-03-28 needs resolution from the source.
2. For the return that crosses the date line, please share its local departure and arrival dates, times, and endpoint time zones. An arrival calendar date earlier than its departure date can be valid and will not be treated as an error.
3. Does “everything in device time zone” mean a display preference only? I would retain original local endpoint times and IANA zones as trip facts, then convert display dates, times, and labels together to the reader’s device zone when it is known; originals remain recoverable. If a fixed reference zone is preferred instead, please name it.
4. Is either journey actually confirmed by an order, or is it still planned? I will record the source and omit any confirmation number or booking reference from public data.

After receiving that evidence, I would:

1. Store scheduled service times as ISO timestamps with offsets and retain `Europe/Paris`, the London endpoint zone, and each return endpoint zone. I would calculate durations from absolute instants, never from the displayed clock values.
2. Keep the return’s date-line chronology as supplied and assign calendar days from the trip’s chosen calendar rules, rather than the reader device’s location.
3. Add source provenance without copying private order details into the public roadbook.
4. Run `npm run validate`, then test one cross-zone journey, the Paris DST case once the official source resolves it, the date-line return, and device-zone display conversion. I would check that countdowns use absolute instants and that page switching preserves the selected flight state.

No current timetable or booking claim would be inferred from this input. The proposed checks require the missing primary order details; they are not yet performed.
