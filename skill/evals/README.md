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

Recorded on 2026-09-09: [A](2026-09-09-scenario-A.md), [C](2026-09-09-scenario-C.md), [D](2026-09-09-scenario-D.md), [E](2026-09-09-scenario-E.md), [J](2026-09-09-scenario-J.md), [K](2026-09-09-scenario-K.md). Three independent Codex sub-agents received input-only packets, with expected answers withheld; the parent task reviewed their written responses afterward. Each scored 2/2 under the stated rubric. These are **proposed-response rehearsals**, not executed scenario implementations or adoption evidence. The records include criteria, full responses, and original response hashes. B, F, G, H, I and L remain unrun.

## 3. First-roadbook reports (the one that matters)

The stage-1 goal is ten strangers finishing a first roadbook without the author's help. Those reports come in through the "I tried to build my first roadbook" issue template, not from tests. Link them here as they arrive.
