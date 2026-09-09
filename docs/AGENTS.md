# Coding agents: what works, what was tested

The skill is plain Markdown. Any agent that can read `AGENTS.md` (or `CLAUDE.md`) in the repo root and run `npm` scripts can follow it. Discovery paths are also provided for clients that auto-load skills:

| Path | Read by |
| --- | --- |
| `AGENTS.md` (root) | Codex CLI, Cursor, Gemini CLI, opencode, aider and most agents that honour the AGENTS.md convention |
| `CLAUDE.md` (root, imports AGENTS.md) | Claude Code |
| `.claude/skills/travel/SKILL.md` | Claude Code skill auto-discovery (`/travel`) |
| `.agents/skills/travel/SKILL.md` | Codex CLI skill discovery |
| `.cursor/rules/travel-roadbook.mdc` | Cursor (always-applied project rule) |
| `.windsurf/rules/travel-roadbook.md` | Windsurf (always-on rule) |
| `.clinerules` | Cline |
| `.github/copilot-instructions.md` | GitHub Copilot (VS Code, JetBrains, github.com) |
| `GEMINI.md` (imports AGENTS.md) | Gemini CLI |
| `skill/SKILL.md` | The actual skill; every path above points here |

## Verified runs

Each row is a real, unattended run from a clean copy of this repo with two fictional input files (a booking email containing a booking reference, and a notes file containing a passport number that must not leak). The prompt was P01 from [skill/prompts](../skill/prompts/README.md). "Pass" means: `trip/travel-data.json` written, `npm run validate` 0 errors, no booking reference or passport number in the data, booking status not invented, and a gap list produced.

| Client | Version | Date | Result | Notes |
| --- | --- | --- | --- | --- |
| Claude Code (`claude -p`) | 2.1.263, default model | 2026-09-09 | Pass | Flights `booked` (confirmation in materials), hotel `needs-confirmation` (email mentioned but not present), blog price left `null`, passport and PNR absent. Asked 9 questions in one batch. Did not start a server or build, as instructed. |
| Claude Code (`claude -p`), second run after the image/offline/print work | 2.1.263 | 2026-09-09 | Pass | Same materials plus `npm run build` and `npm run check`: 0 validation errors, 11 files built, audit passed, no booking reference or passport number in `trip/` or `dist/`. Started from the europe-rail example and deleted its copied photos rather than shipping them under a wrong trip; looked up coordinates from a public geocoder and recorded the source and date. |
| Codex CLI (`codex exec --sandbox workspace-write`) | 0.153.4 | 2026-09-09 | Pass | Needed `--skip-git-repo-check` because the test copy was not a git repo (a normal clone does not). Started from `npm run new -- europe-rail`, rewrote the data: flights `booked`, hotel `needs-confirmation`, three activities `unknown`, all four ticket prices `null`, passport and PNR absent. 19 gaps, 7 batched questions. Did not start a server or build. Reported in Chinese because the machine's global agent instructions ask for it. |
| Codex desktop native sub-agent (not `codex exec`) | App 26.901.51231, build 8109; model inherited, identifier not separately exposed | 2026-09-09 | Pass after review correction; local alternative to a new CLI run | Local clone of `8c416f9`; expanded P01 plus instructions to record questions without waiting, build and audit, with no external services or preview server. Two fictional files supplied flight confirmation/PNR and plans/passport number. Initial `npm run new -- rail` failed; retried `europe-rail`. Removed stale copied ASSETS.md from the no-image result. Reviewer caught `updatedAt` incorrectly copied from the future trip start; corrected to the run date, preserving the initial history. Final validate: 0 errors/warnings; 7 gaps, 9 batched questions; build/check: 11 files, 99,865 bytes. Flights are `demo` with “Fictional confirmation” labels, hotel `needs-confirmation`; unknown times/prices remain unknown. Both original input hashes unchanged; private markers absent from trip and dist. No new model-service CLI call, browser interaction, deployment or adoption claimed. |

The last run used the already available native Codex agent because the task prohibited contacting services. It does not repeat or update the earlier Codex CLI result. Local evidence is retained in the clean test clone's `artifacts/first-roadbook-run.md` and `first-roadbook-questions.md`; final source-data SHA-256 `7fc781f49c9b3642bcabddf151091a93c8b174398c485cc8a86020bce8a53e72`, built public-data SHA-256 `5c36212bb7a3038b36b072781be95df6f4f757113258f07e7b1fdf20efb4e14e`. The fictional identifier values are intentionally excluded from this record.

## Not verified

| Client | Status |
| --- | --- |
| Cursor, Windsurf, Cline | Untested. Entry files are in place (see the table above) and `AGENTS.md` is read by all three; nobody has recorded a run. Open a first-roadbook issue to report. |
| GitHub Copilot agent mode | Untested. `.github/copilot-instructions.md` is in place. |
| Gemini CLI, opencode, aider, Continue | Untested. `GEMINI.md` and `AGENTS.md` are in place. |
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
