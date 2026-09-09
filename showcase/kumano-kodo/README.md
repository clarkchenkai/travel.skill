# 熊野古道 · 2026 — the real roadbook this project grew out of

This folder is the complete production site of a real six-day trip (Shenzhen → Osaka → Kumano Kodō → Tokyo → Shenzhen, 10–15 September 2026, four travelers), kept as a fixed public snapshot: data, dates, bookings as confirmed by the travelers, illustrations, hand-written font, opening animation, and the deployment notes. The skill in `skill/` is a condensation of how this site was made.

It is included as a **finished reference**, not as a starting template:

- The dependency-free template in `template/` is what `npm run new` copies. It has no React, no Three.js, no 8 MB font, and loads in one round trip.
- This site uses React 19 + Three.js for the opening scene and living-landscape effects, a self-hosted LXGW WenKai font, 25 AI illustrations, and a Python build with Pillow. Total published size ≈ 21 MB.
- Read it for the details that make a roadbook feel finished: the parachute opening and its skip guard, the layered forest parallax, the ticket-paper flight cards, the single glass bottom bar, the map dialog that closes in one tap, the day covers that differ per day. `DESIGN.md` records how each decision was reached and what was rejected; `TRIP.md` is the trip's fact sheet.

Live site (as deployed by the author): https://kumano-roadbook.pages.dev

Snapshot updated on 2026-09-09 to the verified `tokyo34` public version. See [SOURCE.md](SOURCE.md) for exact file hashes, the author-source comparison and update boundaries.

## Run it

Node 20+ and Python 3.10+ with Pillow.

```bash
cd showcase/kumano-kodo
python3 -m pip install -r requirements.txt
npm ci
npm test
npm run build:visuals
python3 build.py --public-only --package
python3 -m http.server 4180 --directory dist
```

`build.py --package` writes the allow-listed public files to `dist/` and a hash manifest plus zip to `artifacts/` (both git-ignored). `DEPLOYMENT.md` records the original Cloudflare Pages setup, whose output path was different.

## What is and is not in here

- All trip facts and dates are real and were already public on the live site. Flight numbers and hotel names are included; booking references, ticket numbers, ID documents and phone numbers were never in the data.
- The Cloudflare account identifier and the private source repository URL from the original deployment notes are omitted; everything else in `DEPLOYMENT.md` is as written.
- Licenses: code MIT; LXGW WenKai under SIL OFL 1.1 (`assets/LXGWWenKai-OFL.txt`); AI illustrations are decorative and carry no exclusivity claim; Natural Earth coastline data is public domain. See `third-party-notices.txt`.
