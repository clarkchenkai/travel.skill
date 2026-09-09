# Skill evaluations

Two kinds of checks, and they prove different things.

## 1. Automated (runs in `npm test`)

- `test/core.test.mjs` — time zones, countdowns, ticket sharing, state normalization, escaping.
- `test/validate.test.mjs` — data structure, references, status vocabulary, privacy markers, gap report.
- `test/release.test.mjs` — static release audit (hashes, boundary, secrets, local paths).
- `test/examples.test.mjs` — every shipped example validates, builds from clean, passes the audit, is marked fictional, stays under 1.5 MB with photos.

These are structure and logic checks. They do not prove the site looks right or that a traveler could finish.

## 2. Scenario rehearsals (manual, recorded here)

Take a scenario from [references/scenarios.md](../references/scenarios.md). Give an independent agent **only** `skill/SKILL.md`, the references it links, and the scenario input. Do not show it the expected behaviour. Score 0 / 1 / 2 per the table. Record the result as a dated file in this folder:

~~~text
evals/2031-01-15-scenario-A.md
Agent: <client + model>
Input: <verbatim scenario>
Output summary: <what it proposed>
Score: <0/1/2> — <why>
Skill change made: <none / link to commit>
~~~

No rehearsal has been recorded for this repository yet. Do not cite scenario results that are not in this folder.

## 3. First-roadbook reports (the one that matters)

The stage-1 goal is ten strangers finishing a first roadbook without the author's help. Those reports come in through the "I tried to build my first roadbook" issue template, not from tests. Link them here as they arrive.
