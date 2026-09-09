# Downloadable agent workspaces

The gallery offers four ZIP files: full repository, Codex, Claude Code, and a generic-agent workspace. Each includes the portable core, five canonical skills, fictional examples, templates and tests. Agent-specific kits omit the author’s real trip; the full repository archive additionally includes its already-public showcase. Author working notes (`TRIP.md`), API keys, installed dependencies, original input and the local `trip/` folder are never bundled. Historical case links in the smaller kits point to the public source repository.

1. Download and extract the whole ZIP.
2. Open the extracted root in your agent. Codex starts from `AGENTS.md`; Claude Code from `CLAUDE.md`; other agents should read `AGENT.md` then `AGENTS.md`.
3. Run `npm run bundle:check` before editing to check the packaged source hashes.
4. Pick an example with `npm run new -- business-trip` (or another example), then use `npm run dev`.
5. To create new pages/features, run `npm run template -- --trip trip` and ask the agent to implement and test them in that trip's template.

Canonical skill content exists only in `skills/`. Agent-specific discovery files point to it; they are not a second maintained rule set. These are repository workspaces, not standalone folders to move independently into a global skill directory.

Build downloads locally: `npm run bundle`. `npm run site` also builds them into the published gallery's `downloads/`. Archives are generated artifacts, not committed binary duplicates. `downloads/index.json` records their version, size, entrypoint and SHA-256.

ZIP extraction alone does not install software, register accounts or publish a site. The core commands require Node.js 20+; the heavier historical Kumano showcase separately uses its documented Python/React build dependencies.
