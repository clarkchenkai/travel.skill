# Publishing

## What gets published

Only `dist/` — the output of `node scripts/build.mjs`. It contains the template files, your trip's public `travel-data.json` (private records and anything under `privateData` are stripped by the build), and only the assets your data actually references or that you listed in `trip.publishAssets`.

`trip/` — your raw materials, originals, working notes — is never published and is not part of any of the routes below. If you're not sure what's in your build, read `dist/travel-data.json` after building; it's plain JSON.

## Before publishing (any route)

- [ ] `npm run check` (runs `scripts/check-release.mjs` against your build) — passes
- [ ] Read your own `trip/travel-data.json` yourself: names, addresses, notes, anything you don't want public
- [ ] Set `trip.demo = false` only when this is your real trip, not a sample
- [ ] Check map provider reachability for the region your readers will actually be in — see `skill/references/release-and-access.md`, "Regional access." A working preview on your own network is not proof it works on theirs.
- [ ] After each deploy, re-check the *live* URL, not just your local build — CDNs and browsers cache aggressively; a passed local check does not mean the deployed page updated

`npm run check` is a static audit only. It does not verify the running site, images, fonts, or any particular network. See `skill/references/evaluation.md` section 7 for the difference between a structure check and production acceptance.

## Route 0: "Use this template" on GitHub (zero install)

1. On the repository page click **Use this template** → **Create a new repository**.
2. In your new repository: **Settings → Pages → Source: GitHub Actions**.
3. Open **Actions → Deploy to GitHub Pages → Run workflow** (or push any change under `trip/`).

If `trip/travel-data.json` does not exist yet, the workflow starts from the `europe-rail` example so you get a working site immediately. Replace it with your own trip and push; each push redeploys. The site address is `https://<user>.github.io/<repo>/`.

Verified 2026-09-09: a repository was created from the template with `gh repo create --template`, Pages set to GitHub Actions through the API, the workflow run manually; it completed in 40 s and the site served the starter roadbook (`<title>Four Cities by Rail</title>`). The test repository was deleted afterwards.

## Route A: any static host

Upload the contents of `dist/` to any static host: Netlify (drag-and-drop), Cloudflare Pages (direct upload), Vercel, an S3 bucket with static hosting, or a folder on your own server. The template itself needs no account — it's plain HTML/CSS/JS/JSON. The host you pick may require one.

Verified: not yet — no maintainer has walked this route end-to-end and recorded the result.

## Route B: GitHub Pages

Use the optional workflow at `.github/workflows/pages.yml`. It does nothing until you enable it:

1. Repo Settings -> Pages -> Source: GitHub Actions.
2. Push a change under `trip/**` or `template/**` to `main`, or trigger it manually from the Actions tab.

Once enabled, `dist/` is public at your repo's Pages URL on every matching push. See the comment block at the top of that workflow file before turning it on.

Verified 2026-09-09 as part of the Route 0 run above (same workflow). The upstream repository's own Pages site is published by `pages-demo.yml` (the examples gallery) at https://clarkchenkai.github.io/travel.skill/ ; the offline check (`npm run check:offline`) passed against that live URL with 38 precached entries.

## Route C: zip and open locally

Zip `dist/` and share it, or unzip it and open `index.html` through a local server (`npm run preview` serves `dist/`; any static server works, but Python's `http.server` will not register the offline service worker) — not by double-clicking the file. The template uses ES module scripts and `fetch()` to load `travel-data.json`; both are blocked under the `file://` protocol by browsers, so double-clicking `index.html` will not work.

Verified: not yet.

---

Routes 0 and B were verified on 2026-09-09 as described above. Routes A and C have not been walked by the maintainers. Treat "the build passes locally" and "readers can actually open the published site" as two separate claims until you have checked the live URL yourself.
