# Coding agents: what works, what was tested

The skill is plain Markdown. Any agent that can read `AGENTS.md` (or `CLAUDE.md`) in the repo root and run `npm` scripts can follow it. Discovery paths are also provided for clients that auto-load skills:

| Path | Read by |
| --- | --- |
| `AGENTS.md` (root) | Codex CLI, Cursor, Gemini CLI, opencode, aider and most agents that honour the AGENTS.md convention |
| `CLAUDE.md` (root, imports AGENTS.md) | Claude Code |
| `.claude/skills/travel/SKILL.md` | Claude Code skill auto-discovery (`/travel`) |
| `.agents/skills/travel/SKILL.md` | Codex CLI skill discovery |
| `skill/SKILL.md` | The actual skill; the two paths above point here |

## Verified runs

Each row is a real, unattended run from a clean copy of this repo with two fictional input files (a booking email containing a booking reference, and a notes file containing a passport number that must not leak). The prompt was P01 from [skill/prompts](../skill/prompts/README.md). "Pass" means: `trip/travel-data.json` written, `npm run validate` 0 errors, no booking reference or passport number in the data, booking status not invented, and a gap list produced.

| Client | Version | Date | Result | Notes |
| --- | --- | --- | --- | --- |
| Claude Code (`claude -p`) | 2.1.263, default model | 2026-09-09 | Pass | Flights `booked` (confirmation in materials), hotel `needs-confirmation` (email mentioned but not present), blog price left `null`, passport and PNR absent. Asked 9 questions in one batch. Did not start a server or build, as instructed. |
| Codex CLI (`codex exec --sandbox workspace-write`) | 0.153.4 | 2026-09-09 | Pass | Needed `--skip-git-repo-check` because the test copy was not a git repo (a normal clone does not). Started from `npm run new -- europe-rail`, rewrote the data: flights `booked`, hotel `needs-confirmation`, three activities `unknown`, all four ticket prices `null`, passport and PNR absent. 19 gaps, 7 batched questions. Did not start a server or build. Reported in Chinese because the machine's global agent instructions ask for it. |

## Not verified

| Client | Status |
| --- | --- |
| Cursor, Windsurf, Cline, Continue | Untested. Should work via `AGENTS.md`; open a first-roadbook issue to report. |
| Gemini CLI, opencode, aider | Untested. |
| Claude Desktop / Cowork, ChatGPT desktop | Untested; these need a working directory with Node available. |
| Claude.ai web / ChatGPT web without a filesystem | Not applicable. The skill needs to write files and run scripts. |

An "untested" row is not a claim that it fails. It is a claim that nobody has recorded a run. Rows move up when a run is recorded with the client version, date and outcome.

## What a run needs from the client

- Read files in `input/` (text, Markdown; PDFs and images only if the client can read them).
- Write `trip/travel-data.json`.
- Run `npm run validate`, `npm run gaps`, `npm run dev`, `npm run build`, `npm run check`.
- Ideally open `http://localhost:4173/` in a browser it controls, so it can do the preview walk itself. Without a browser the agent must say the preview step is unverified.

## Without any agent

Everything runs by hand: copy an example, edit the JSON with [DATA.md](DATA.md) beside you, use the same scripts. The agent saves reading and typing; it does not add capabilities.
