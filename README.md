# travel.skill

**Turn your travel materials into a personal, shareable travel website.**

You have a folder of booking emails, screenshots, notes and links. You want one page you can open on your phone during the trip and send to the people you travel with. `travel.skill` is two things that work together:

- **A skill** for coding agents (Claude Code, Codex CLI, and any agent that reads `AGENTS.md`): the procedure for reading your materials, finding what is missing, filling one data file, previewing, and checking before you publish. It never invents facts.
- **A template**: a dependency-free static site (plain HTML, CSS and JavaScript) with five pages — Home, Map, Days, Transport, Checklist — three visual themes, mobile and desktop layouts, and reader state (ticket checks, checklist) kept in the browser.

No account, no database, no paid service, no build toolchain. Node.js 20+ is the only requirement, and the examples run without any AI at all.

[中文说明 →](README.zh-CN.md)

## What it looks like

Three fictional examples ship with the repo. Nothing in them is booked; they exist to show the range.

| `japan-hiking` · theme `field-notes` · zh-CN | `europe-rail` · theme `timetable` · en | `family-island` · theme `tide` · en |
| --- | --- | --- |
| ![Kiso Valley example, desktop home](docs/screenshots/japan-hiking-desktop.png) | ![Four cities by rail, desktop home](docs/screenshots/europe-rail-desktop.png) | ![Mallorca family example, desktop home](docs/screenshots/family-island-desktop.png) |
| ![mobile days page](docs/screenshots/japan-hiking-mobile-days.png) | ![mobile transport page](docs/screenshots/europe-rail-mobile-transport.png) | ![mobile days page](docs/screenshots/family-island-mobile-days.png) |

Five-day valley walk with a ferry-free rail return; an eight-day rail loop that crosses the end of European summer time; a one-week family trip with a rental car. Different moods, same data shape.

## Quick start (no AI needed)

```bash
git clone <this repo> travel.skill && cd travel.skill
npm run new -- europe-rail     # copies an example into trip/
npm run dev                    # http://localhost:4173/
```

Edit `trip/travel-data.json`, reload, repeat. When it is yours:

```bash
npm run validate   # structure, references, time zones, privacy markers
npm run gaps       # what a reader would still need to ask
npm run build      # dist/ + a hash manifest outside dist/
npm run check      # static release audit of dist/
```

Upload `dist/` to any static host. See [docs/PUBLISHING.md](docs/PUBLISHING.md).

## With a coding agent

1. Put your materials in `input/` (git-ignored; never modified).
2. Open the repo in your agent and paste:

   ```text
   Build my travel roadbook with the travel skill.
   Materials are in input/. Destination: <where>. Dates: <when>. Travelers: <who>.
   Read the materials, fill trip/travel-data.json, then run the gap report and ask me the open questions in one batch.
   Do not invent times, prices or booking status.
   ```

3. Answer the gap list. The agent validates, starts the preview, and walks the pages.
4. Say what you want changed. When you are ready: build, audit, publish — the agent shows you what will be public and waits for your go-ahead.

The full procedure the agent follows is [skill/SKILL.md](skill/SKILL.md). More prompts: [skill/prompts/](skill/prompts/README.md). Client-by-client notes and what has actually been tested: [docs/AGENTS.md](docs/AGENTS.md).

## What is in the box

```
skill/          the agent skill: SKILL.md, references/, prompts/, evals/
template/       the site: index.html, styles.css, themes.css, app.js, core.mjs, i18n/
examples/       three fictional trips
scripts/        new · dev · validate · gaps · build · check (Node only, no deps)
test/           node:test suites (npm test)
docs/           data reference, quick start, publishing, verification, demo script
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

The template descends from a self-hosted roadbook built for one real trip and later published with fictional data as [kumano-roadbook-template](https://github.com/clarkchenkai/kumano-roadbook-template); this repository rewrites it as a dependency-free, theme-neutral template and adds the agent skill. The skill condenses the working notes from that build.

MIT. See [LICENSE](LICENSE). Example data is fictional; place names are public landmarks used only to show the map feature.
