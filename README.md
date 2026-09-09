# travel.skill

**Turn your travel materials into a personal, shareable travel website.**

<p align="center"><img src="docs/demo/demo.gif" width="300" alt="Walkthrough on a phone: home, daily plan, place map, flights, checklist"></p>

Bookings, screenshots, notes, links → one page you open on your phone during the trip and send to the people you travel with. Live examples: **https://clarkchenkai.github.io/travel.skill/**

- **The template** is a dependency-free static site (plain HTML, CSS, JavaScript): Home, Map, Days, Transport, Checklist; three themes; mobile and desktop layouts; works offline once opened; prints as a paper roadbook; share cards for chat apps.
- **The skill** is the procedure a coding agent (Claude Code, Codex CLI, anything that reads `AGENTS.md`) follows to read your materials, find what is missing, fill one data file, preview, and check before you publish. It never invents facts.

No account, no database, no paid service. Node.js 20+ is the only requirement, and the examples run without any AI.

[中文说明 →](README.zh-CN.md)


## The real Kumano roadbook

[Watch the 45-second walkthrough](https://clarkchenkai.github.io/travel.skill/#work) · [Open the full roadbook](https://kumano-roadbook.pages.dev/?v=hd35)

The paper-inspired gallery puts the author’s custom trip first, with a real screen recording of the opening scene, map, daily plan and transport. The three fictional trips below demonstrate the lighter starter template.

## Three ways to start

**1. Use this template on GitHub (nothing to install).** Click *Use this template* → create your repository → Settings → Pages → Source: *GitHub Actions*. The included workflow publishes a starter roadbook at `https://<you>.github.io/<repo>/` within a minute. Then edit `trip/travel-data.json` in the browser or locally; every push redeploys.

**2. Run locally.**

```bash
git clone https://github.com/clarkchenkai/travel.skill && cd travel.skill
npm run new -- europe-rail     # copy an example into trip/
npm run dev                    # http://localhost:4173/
```

**3. With a coding agent.** Put your materials in `input/`, open the repo in Claude Code or Codex, and paste:

```text
Build my travel roadbook with the travel skill.
Materials are in input/. Destination: <where>. Dates: <when>. Travelers: <who>.
Read the materials, fill trip/travel-data.json, then run the gap report and ask me the open questions in one batch.
Do not invent times, prices or booking status.
```

Answer the gap list, look at the preview, ask for changes. When you are ready: `npm run build && npm run check`, then publish `dist/` anywhere static ([docs/PUBLISHING.md](docs/PUBLISHING.md)).

## What it looks like

Three fictional examples ship with the repo. Nothing in them is booked; they exist to show the range.

| `japan-hiking` · theme `field-notes` · zh-CN | `europe-rail` · theme `timetable` · en | `family-island` · theme `tide` · en |
| --- | --- | --- |
| ![Kiso Valley example, desktop home](docs/screenshots/japan-hiking-desktop.png) | ![Four cities by rail, desktop home](docs/screenshots/europe-rail-desktop.png) | ![Mallorca family example, desktop home](docs/screenshots/family-island-desktop.png) |
| ![mobile days page](docs/screenshots/japan-hiking-mobile-days.png) | ![mobile transport page](docs/screenshots/europe-rail-mobile-transport.png) | ![mobile days page](docs/screenshots/family-island-mobile-days.png) |

Five-day valley walk; an eight-day rail loop that crosses the end of European summer time; a one-week family trip with a rental car. Different moods, same data shape. All photos are AI-generated for the fictional trips (GPT Image 2 via Lovart); see each example's `ASSETS.md` and [docs/VISUALS.md](docs/VISUALS.md).

## What is in the box

```
skill/          the agent skill: SKILL.md, references/, prompts/, evals/
template/       the site: index.html, styles.css, themes.css, app.js, core.mjs, i18n/
examples/       three fictional trips
scripts/        new · dev · validate · gaps · build · check · preview · site · shot · check:offline (Node only, no deps)
test/           node:test suites (npm test)
docs/           data reference, quick start, publishing, verification, visuals, demo recording
site/           the examples gallery page (built by npm run site, deployed by pages-demo.yml)
showcase/       the complete real Kumano Kodō 2026 roadbook this project grew out of (React + Three.js, 35 MB)
trip/           your trip (created by npm run new)
input/          your raw materials (git-ignored)
```

## What is tested, and how far that goes

`npm test` covers time-zone math, data validation, the release audit, and that every example validates, builds and stays small. The maintainers have also opened each example in a browser and exercised the map dialog, ticket marking, checklist persistence and hash routing on mobile and desktop sizes. What has **not** been done: publishing to a live host from this repo, and real strangers finishing a first roadbook. [docs/VERIFICATION.md](docs/VERIFICATION.md) keeps the honest list with evidence levels.

The stage-one goal of this project is simple: **ten strangers finish their first roadbook without asking the author for help.** If you try, tell us how it went with the "first roadbook" issue template — especially where you got stuck.

## Privacy

`dist/travel-data.json` is public once you publish it. The validator and the release audit reject booking references, passport-like fields, tokens and local machine paths, but they cannot read your free text for you. Before publishing, read your own data file once. Original materials in `input/` are never copied into the build.

## Contributing

Themes, country/region adaptations, modules and test cases are the four contribution tracks. See [CONTRIBUTING.md](CONTRIBUTING.md). Issue templates cover first-roadbook reports, bugs, theme proposals and country adaptations.

## Origins and license

The template descends from a self-hosted roadbook built for one real trip: the complete site, data and design notes are in [showcase/kumano-kodo](showcase/kumano-kodo/README.md), and a fictional-data cut of it was published earlier as [kumano-roadbook-template](https://github.com/clarkchenkai/kumano-roadbook-template). This repository rewrites it as a dependency-free, theme-neutral template, ports its motion layer, and adds the agent skill condensed from the working notes of that build.

MIT. See [LICENSE](LICENSE). Example data is fictional; place names are public landmarks used only to show the map feature.
