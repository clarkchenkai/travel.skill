# Scenario E rehearsal — 2026-09-09

Agent: Codex native sub-agent `/root/blind_scenarios_de`. The session model was inherited; a specific model/version identifier was not exposed by the spawn result.
Reviewer: parent Codex task, after the response artifact was written.
Evidence level: recorded blind proposed-response rehearsal. Not implementation, browser interaction, production or traveler adoption.

## Blinding and input

The agent received only skill/SKILL.md, needed linked references (excluding scenarios.md), and an input-only packet. Expected answers and existing evals were withheld. The input packets were extracted before delegation; the reviewer read the expected column only after all six response files existed. Each agent listed the files it read in its response.

Verbatim scenario input:

> The art is beautiful, but ticket prices are baked into the image, the font falls back on buttons, and the map is unreachable on the readers' network

Original response SHA-256: `f8a8c261f9b2cbcb26d06ee687e38bf8634bed731863f9292f3528dc94a4155f`.

## Score

| Criterion | Score | Evidence in the response |
| --- | --- | --- |
| Hard gates | 2 | Rejects aesthetic scoring as compensation for core failures. |
| Data and font integrity | 2 | Moves factual prices into DOM and checks actual font/glyph loading. |
| Regional access | 2 | Separates proxy success from real reader-network tests and diagnoses DNS/TLS/HTTP/assets/interaction. |
| Evidence boundary | 2 | Clearly states no site, font or network checks were performed. |

Overall: **2/2**, actionable and correctly bounded under the scenario rubric. No critical criterion scored 0.

Skill change made: none; this response did not expose a below-2 skill outcome.

## Recorded response

Only the machine-specific repository path prefix was removed for portability; wording otherwise preserved.

# Scenario E — proposed response rehearsal

## Verbatim input

> # Scenario E High-score trap
>
> The art is beautiful, but ticket prices are baked into the image, the font falls back on buttons, and the map is unreachable on the readers' network

## Skill material read

- `skill/SKILL.md`
- `skill/references/module-contracts.md`
- `skill/references/visual-and-motion.md`
- `skill/references/evaluation.md`
- `skill/references/release-and-access.md`
- `skill/references/data-and-countries.md`

## Proposed response and action plan

The visual result cannot offset these failures. Ticket prices must be editable, copyable, zoomable, and localizable DOM data rather than text inside art; button font fallback means the typography has not passed a real font check; and an inaccessible map provider breaks a reader-facing core action on the target network.

I would take these concrete steps:

1. Remove ticket prices and any other functional facts (amounts, times, status, ticket identifiers, countdowns) from the image. Preserve the art only as decoration, then render the price from the sourced data in the ticket UI, with the ISO currency code and its correct scope. If a price has no source, leave it blank or mark it `unknown` / `needs-confirmation`; do not reproduce a plausible value.
2. Audit `font-family` and `font` declarations in button and other interactive states. In a browser, test actual font loading and the computed first font, including representative glyphs and a cold-load state. Correct the affected controls or provide a readable intentional fallback where coverage is unavailable; do not claim the requested face is applied from a CSS declaration alone.
3. Treat map availability as a regional requirement. Keep place local names, addresses, coordinates or `mapQuery`, copy-address, and map hand-off independent of the provider. Select or provide an accessible map path based on the readers' actual region and network; retain a local route overview so a failed provider does not remove the itinerary.
4. Test the production URL on the real reader network with no proxy: record date, URL, region/carrier, Wi-Fi or mobile, browser or in-app browser, and separately whether first screen and map work. Diagnose any failure by DNS, TLS, HTTP, assets, and interaction. A successful proxy test or HTTP 200 would remain insufficient evidence.
5. Recheck ticket legibility and all affected controls on mobile and desktop, including large type and keyboard operation. Review the production output for facts hidden inside images and preserve the provenance of retained artwork.

For review, these are hard-gate failures in readable/operable behavior, core tasks, and honest evidence. I would report the beauty of the art separately from readiness; no aesthetic score should be used to mark the site ready until all three issues are corrected and verified.

Evidence boundary: the scenario states these defects, but this is only a proposed remediation and verification plan. I have not inspected the site, source data, fonts, reader network, production URL, or map provider, and I have not run any checks.

## Session-style handoff

Done: identified the three blocking defects and the evidence required to clear them.
Not done: data/UI changes, font runtime observation, target-network map verification, and production read-back.
Entry: proposed response only; no preview, build, release, or network test was used.
Next: move factual ticket text into the data-driven DOM, fix and verify interactive font rendering, then test the chosen map path on a reader's actual network.
