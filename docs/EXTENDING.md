# Templates, pages and modules

Existing examples are runnable starting points. An agent can modify them or generate a different layout and new code for the actual task.

```sh
npm run new -- business-trip --trip my-trip
npm run new -- --from my-trip --trip another-trip
npm run new -- --blank --trip a-new-plan
npm run template -- --trip my-trip
npm run dev -- --trip my-trip
npm run build -- --trip my-trip --out out-my-trip --manifest artifacts/my-trip.json
```

New trips receive a fresh browser-storage ID. Cloning an existing trip resets `booked` statuses to `needs-confirmation`; review inherited dates, business records and custom fields before treating it as a new journey. `--blank` invents no dates or bookings and deliberately cannot pass a production build until required facts are supplied.

`my-trip/template/` is an independent renderer. Its `manifest.json` lists published source files. Missing baseline files can fall back to the shared template, so a small theme/module overlay need not duplicate every file. New files must physically exist; paths and symlinks cannot escape the template root.

## A real generated module

`examples/business-trip` demonstrates a module, not just a configuration label:

```json
{"ui":{"modules":[{"id":"business","source":"modules/business.mjs"}]}}
```

The trip template declares `modules/business.mjs` in its manifest. The module exports `title` (locale-to-label mapping) and `render(context)`. Context supplies `element`, `data`, `locale`, `escapeHTML`, `formatMoney`, `sourceLinks`, `openMap`, and a trip/module-specific `storageKey`. It must render real UI, scope handlers to its element, treat its data as untrusted text, and handle empty data and storage failure.

The host creates the page, integrates its title/navigation/deep link, preserves hidden page state, and shows a failure state without removing the other pages if module initialization fails. No external/parent-relative module URL is accepted. The generator still has to test the module's semantics and interactions.

A template can declare `validation: "validate.mjs"`. This reviewed local source module exports `validate(data)` returning `{errors,warnings}` and optionally `gaps(data)`. It runs during validate/build; the CLI gap report includes its questions. Keep validation helpers local and copy them with the template. Validation is executable source, not an untrusted remote configuration.

## Language and direction

Provide `i18n/<locale>.json` with the same keys as the baseline, list it in the manifest, and set `trip.locale`. Build/preview automatically choose its declared language pack; `ui.localePack` is an optional explicit override. Set `trip.dir` to `rtl` when appropriate and verify mixed scripts, icons, wrapping and inputs. Merely setting `lang` is not a translation. The default fallback packs are English and Simplified Chinese.

## Relationship tests

Rental daily events use `rentalRef: "pickUp"` or `"dropOff"`; endpoint date/time/place are derived from `rental`. Do not copy those fields manually. The business module reads meetings from the same daily events rather than keeping another agenda copy. For other new modules, implement and test equivalent shared references.

After adding source files: validate → build → release audit → real browser entry/action/back/refresh → offline/phone checks as applicable. A new runtime framework needs its own explicit build and acceptance flow; do not assume the baseline builder understands arbitrary stacks.
