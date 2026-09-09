# Quick start

Two paths. Both need Node.js 20 or newer and nothing else.

## A. See it run in one minute

```bash
git clone <this repo> travel.skill
cd travel.skill
npm run new -- europe-rail
npm run dev
```

Open http://localhost:4173/ . Try: open a place on the Map page, mark a ticket on the Days page, add a checklist item, reload the page, resize the window under 900 px.

Other examples: `japan-hiking` (Chinese UI, hiking), `family-island` (rental car). Switch with `npm run new -- <name> --force`.

## B. Make your own

1. **Materials.** Create `input/` and drop everything in: PDFs, emails saved as text, screenshots, a notes file. It is git-ignored and never modified.
2. **Agent or by hand.**
   - With a coding agent: open the repo, paste the prompt from the [README](../README.md#with-a-coding-agent). The agent fills `trip/travel-data.json` and asks you what is missing.
   - By hand: start from the closest example (`npm run new -- <name>`) and edit `trip/travel-data.json` with [DATA.md](DATA.md) open.
3. **Check.** `npm run validate` must show 0 errors. `npm run gaps` lists what a reader would still ask; answer what you can, leave the rest `null` or `"unknown"`.
4. **Preview.** `npm run dev`. Walk all five pages on a phone-sized window and a desktop-sized one.
5. **Build and audit.** `npm run build` writes `dist/`; `npm run check` audits it. Read `dist/travel-data.json` once yourself.
6. **Publish.** Upload `dist/` anywhere static. Options and cautions: [PUBLISHING.md](PUBLISHING.md).

## Common problems

| Symptom | Cause | Fix |
| --- | --- | --- |
| Page says it cannot load `travel-data.json` | You opened `index.html` by double-clicking | Use `npm run dev` (or any HTTP server); module scripts and `fetch` need HTTP |
| `npm run dev` says there is no `travel-data.json` | No trip yet | `npm run new -- <example>` |
| Validator: `departure: ISO time with offset required` | A time without `+02:00` style offset | Write `2031-07-05T07:10:00+01:00`; the offset is the one in force at that place on that date |
| Validator: `unknown place "..."` | An event points to a place id that does not exist | Add the place to `places[]` or fix the id |
| Map dialog is blank | The map provider is unreachable on your network | The address, copy button and external link still work; set `trip.map.provider` to `osm` or `none` if this is your readers' normal network |
| Checklist does not persist | Private window or storage blocked | The page shows a warning; it is per-browser by design |
| Nothing changes after editing | Browser cache | The dev server sends `no-store`; hard-reload if a proxy caches |
