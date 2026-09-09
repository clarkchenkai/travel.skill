# Contributing

This is a dependency-free static template plus an agent skill. Node >= 20, no build step, no lockfile. Before opening a PR: `npm test` must pass, and `npm run validate` / `npm run check` must pass on any example or trip data you touched.

Keep PRs small and complete: one theme, one country adaptation, one module, or one test file per PR. Do not bundle unrelated changes.

## Evidence levels

When you claim something works, say which level you actually reached — do not conflate them:

structure check < logic test < runtime observation < interaction acceptance < production acceptance < user adoption

"The schema validates" is a structure check, not proof the page renders. "I ran it in a browser" is not proof it works for your reviewers unless you say what you clicked. See `skill/references/evaluation.md` section 7 for the full list.

## Privacy (read before your first PR)

- Never commit real bookings, PNRs, passport numbers, private addresses, or any material from `trip/`.
- Every example under `examples/` must be fictional: `trip.demo` is `true`, every flight segment number starts with `DEMO`, and every accommodation/ticket has `status: "demo"`. `test/examples.test.mjs` enforces this — it will fail your PR if it doesn't hold.
- If you're adding or editing an example, run `npm test` and read the diff yourself before pushing. A green test does not replace reading your own data file.

## No fake badges or metrics

Don't add build/coverage/stars badges, invented performance numbers, or "trusted by" claims. If you want to show a script's status, link to the actual CI workflow run.

---

## Track 1: Themes

A theme is a `[data-theme="name"]` block in `template/themes.css` — CSS custom-property tokens plus a few small surface tweaks (font weights, shadows, cover background). It must not:

- Hardcode a dark background as the default (the template ships light; see `--bg`, `--surface` in existing themes).
- Bake in country-specific symbols, flags, or motifs as the default look — a theme is a mood (paper, timetable, tide), not a nationality.

Steps:

1. Add your block to `template/themes.css`, following the pattern of the existing `field-notes` / `timetable` / `tide` blocks (tokens first, then 2-5 lines of surface overrides).
2. Add the theme name to the `THEMES` set in `scripts/lib/validate.mjs`.
3. Show it in use: either set `trip.theme` to your new name in one of the `examples/*/travel-data.json` files, or attach a screenshot to your PR (`npm run dev` and set `trip.theme` locally to preview).

Test that must pass: `npm test` (covers `test/validate.test.mjs` and, if you changed an example, `test/examples.test.mjs`).

## Track 2: Country/region adaptations

Local knowledge — transit conventions, currency, map provider reachability, language/script handling — belongs in three places:

- **Skill guidance**: add or edit a checklist row in `skill/references/data-and-countries.md`.
- **Example data**: add notes to an `examples/*/travel-data.json` (or its accompanying notes, if the example has one) showing the adaptation in a real fictional trip.
- **i18n packs**: add or edit a locale file in `template/i18n/` (e.g. `en.json`, `zh-CN.json`) for user-facing strings.

Rule: any factual claim (opening hours, typical transfer time, which map provider works in a region, currency symbol conventions) needs a public source URL recorded in the data's `sourceRefs` / `sources` field. Do not invent timetable minutes, prices, or "usually takes N minutes" figures without a citable source. If you can't source it, mark it as unverified in the checklist row instead of guessing.

Test that must pass: `npm test` (examples must still validate with `validateTravelData` and pass `test/examples.test.mjs`).

## Track 3: Modules

A module is: render logic in `template/app.js`, pure/testable logic in `template/core.mjs`, and a test in `test/`. The full contract — what "done" means for a module, the render → action → state → error → mobile/desktop chain — is in `skill/references/module-contracts.md`. Read it before writing the module, not after.

Every module must handle, and your test or PR description must say how it handles:

- **Empty data** — the relevant array/field is missing or `[]`. No crash, no broken layout, a real empty state.
- **Failure** — e.g. a map provider is blocked or an image 404s. The rest of the page keeps working.
- **Mobile and desktop** — same data, both viewport ranges. No second copy of the content, no horizontal overflow.

Steps:

1. Add pure logic (parsing, grouping, date math) to `template/core.mjs` — keep it framework-free so it's unit-testable without a DOM.
2. Add the render function to `template/app.js`, following existing module render functions for the pattern (read/write to the same public data shape, same page-switching convention).
3. Add a test in `test/` exercising the `core.mjs` logic directly, and, if practical, the empty/failure states.

Test that must pass: `npm test`, plus manual mobile/desktop check with `npm run dev` (structure check + runtime observation — see Evidence levels above; say which one you actually did).

## Track 4: Test cases

Two kinds:

- **Unit tests** — `test/*.test.mjs`, run with `npm test` (`node --test`). Cover `core.mjs` logic, `scripts/lib/validate.mjs`, and `scripts/lib/release.mjs` behavior.
- **Scenario rehearsals** — for the skill itself, not the template code. Add a case file under `skill/evals/`. A scenario rehearsal means: give an independent agent *only* the skill and the scenario input (no expected answer, no hints), ask what it would do next and what it considers done/unknown, then score 0/1/2 per item against `skill/references/scenarios.md`. A 0 on any critical item fails the scenario — record the actual artifacts the agent produced, not "it said it would comply."

If you're adding a new scenario, follow the table format in `skill/references/scenarios.md` (Scenario / Input / Expected behavior) and place the write-up in `skill/evals/`.

## Before you open the PR

- [ ] `npm test` passes
- [ ] `npm run validate` passes on any trip/example data you touched
- [ ] `npm run check` passes if you touched build or release logic
- [ ] No real bookings, PNRs, passports, or private addresses anywhere in the diff
- [ ] Examples still have `trip.demo: true`, `DEMO` flight numbers, `status: "demo"`
- [ ] No new badges, invented metrics, or unverified claims of "it works"
