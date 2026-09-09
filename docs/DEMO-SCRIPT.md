# 30-second demo script

For a screen recording or a live walkthrough. Real actions only; no pre-recorded effects.

| Time | On screen | Say |
| --- | --- | --- |
| 0–5 s | Terminal: `npm run new -- europe-rail` then `npm run dev` | "One folder of travel data, no dependencies." |
| 5–12 s | Browser, phone-width: Home → Days. Open a day, tap a place chip, map dialog opens with address and copy button; close it with one tap. | "Every place is one tap from the plan, and the address works even when the map does not load." |
| 12–18 s | Transport page: swipe between the two flights; point at "+1 day" and the duration. | "Times are computed from real instants, so overnight and westbound flights show what they should." |
| 18–24 s | Checklist: add "sunscreen", check it, reload the page — still there. | "Personal state stays in your browser." |
| 24–30 s | Terminal: `npm run build && npm run check` → `PASSED`, then the three example home pages side by side. | "Build, audit, publish anywhere static. Three looks, one data shape, and a skill that fills the data from your own materials." |

Recording notes: use a fresh browser profile so the checklist starts empty; the map embed may be blank on restricted networks — that is fine, show the copy button instead. Do not fake a live URL; if you have not deployed, end on the local build.

A recording has not been produced yet. When one exists, link it here and in the README; until then the README shows static screenshots only.
