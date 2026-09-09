# Orchestration

## The main task is not a relay

The main task owns: current decisions, shared boundaries, task baselines, the integration queue, conflict rulings, unified builds, release, and acceptance. Module tasks own their own implementation and evidence. **A receipt from a module task is not proof the site is live.**

If your agent supports git worktrees and subagents, parallelize. If it does not, run the same contract sequentially — the contract, not the tooling, is what matters. Do not fabricate agent or deploy receipts either way.

Single-file edits, small changes, and tightly coupled work are usually faster done locally. Parallelize only when an independent task is big enough to repay the cost of starting, communicating, syncing, and merging it.

## 1. Before opening tasks

1. Check the current project, git root, working-tree changes, remote, and the actual deployed version. Without git, confirm the user has authorized creating a repo.
2. Establish a runnable baseline. Isolate private originals, credentials, and working data first so the initial commit does not poison history.
3. Version only what has to be developed and built. A clean checkout must be able to build.
4. Name the owner of every shared object. By default the main task owns: the data source of truth, font tokens, navigation/routing, root HTML, the build allowlist, cache versions, and production release.
5. Read the code before splitting work. If all modules live in one `app.js`/`styles.css`, scope tasks by named function or selector. Split files only when it helps; do not pre-refactor for conflicts you have not seen.

## 2. Suggested task boundaries

| Task | Write scope | Acceptance question |
| --- | --- | --- |
| Deploy | Build, hosting config, release notes | Does the named commit actually reach the same production URL |
| Map | Overview, place directory, place dialog | Correct targets, survivable network failure, one-click close |
| Itinerary | Day expansion, events, stay text, day images | Times readable, facts preserved, return lands in place |
| Transport | Flight cards, plus rail/bus/driving submodules where applicable | Time zones, swipe, toggle state, real advisories |
| Checklist | Categories, add/edit/delete, check, persist | IME, counts, undo, refresh, failure handling |
| Home | Entry, scene, narrative motion | Stages, skip, loading, final state, menu |
| Navigation (split out if needed) | Menu DOM, scoped styles, page switching | One instance, right target, back, selected state |

Modules may be merged; fewer tasks is fine. Never let home and navigation each build their own menu, or let transport and map both edit the same dialog button.

## 3. Minimum task contract

~~~text
Task: <module and user goal>
Baseline: <project / branch / commit>
Current decisions: <confirmed behavior and style; list superseded requirements>
Scope: <allowed files/functions/selectors; owner of each shared object>
Data: <public snapshot / source of truth; facts that must not change>
Preview: <separate port or deployment; version marker goes in the receipt, not the product>
Done when: <real interactions plus screenshot or state evidence>
Return: exact SHA, diff, added/removed assets, tests, untested items.
Commit only in this worktree; the main task integrates and releases.
~~~

Use separate ports and distinct browser tabs. Do not let two tasks drive the same browser page; if a browser must be shared, say who holds it now and hand it back.

## 4. One lightweight dispatch table is enough

| Requirement / adopted version | Module task | Baseline | Impl commit | Status | Integration commit | Production version | Untested |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Explicit user change | Page owner | SHA | SHA | adopted / exploring / superseded / rejected | SHA or blank | Deploy or blank | One line |

- Implemented is not adopted. Explicitly requested small changes can be adopted directly; aesthetic explorations wait for the user's choice.
- When a new requirement supersedes an old one, update "current decisions", keep the history, but stop letting the old receipt drive implementation.
- "Push everything unpushed" means: filter to adopted-and-complete increments; exclude explorations, rejected versions, and temporary preview patches.
- Clear the "done but not merged" backlog early. Authorized work should not keep sliding into the next batch.

## 5. Receipts must be usable for integration

~~~text
Adopted requirement: <one line>
Commit: <exact SHA, parent dependency SHA>
Changes: <files and function/style scope>
Assets: <added, removed, replaced; license and origin>
Verified: <environment / size / action / result>
Not verified: <device, network, or other gaps>
Preview: <URL and version>
~~~

"Latest branch HEAD" is not a stable delivery — the author may have committed an exploration after it. Diff by exact SHA. With multiple dependency commits, process in order; if the parent chain contains abandoned approaches, take only the net official diff and record the mapping.

## 6. Integration steps

1. Re-read the user's decisions and the diff. Check nothing quietly restores an old font, title, long page, navigation, or dataset.
2. Confirm new assets actually exist and have been looked at; no reference or private images slipped in.
3. Cherry-pick independent commits. If the deploy branch is already on the remote mainline, preserve real ancestry instead of force-pushing.
4. On conflicts in shared bundled files, rule block by block. **Never take whole `ours`/`theirs`, and never treat "deleted the conflict markers" as resolution.** Two additive style blocks still need a check for duplicate selectors, specificity, dead rules, and same-name animations.
5. When hand-porting init fragments, keep the main task's current title, data source, pagination, and other initialization. Check for dangling references to removed elements.
6. Reconcile assets: images, fonts, licenses, CSS, scripts all belong in the right allowlist; replaced assets leave the output directory. A file sitting in a directory is not evidence it shipped.
7. Rebuild generated assets and cache versions together; retest affected modules and shared entries. A pure CSS tweak does not need the full suite; navigation, data, or state changes do.
8. Record `source SHA → integration SHA → build version`. A different SHA after a cherry-pick does not mean it was not merged, and a non-ancestor branch does not prove something is missing.

## 7. Stale previews cause repeat bug reports

Stale global CSS, pagination functions, fonts, and menus in a worktree make users re-report bugs you already fixed.

- Start each round by saying which commit and worktree the current URL is.
- Have module owners rebase onto the clean latest baseline, preserving uncommitted user changes.
- Record temporary preview-only syncs (fonts, navigation) and exclude the duplicates from the final commit.
- Review integrated work at the latest official URL; worktree previews are for new-module diffs only.
- "Queued to open" only proves a request was scheduled. Do not claim you browsed pages you never saw.

## 8. Release batches and message discipline

Ship logically complete, verified changes. Group related adopted increments into one release; fix user-reported blockers first. Do not trigger a full deploy for every status update.

A finished release needs four pieces of evidence:

1. Local integration HEAD matches the remote target branch.
2. The hosting service records a successful build for that commit.
3. The production URL returns the correct version or hash of the changed HTML and assets.
4. Affected features behave correctly on the production page.

Verify the whole checklist on the first release; afterwards check only changed assets and affected behavior. When production returns stale edge cache, distinguish "build not finished", "stale HTML", and "stale asset" — do not paper over it with random query strings.

Keep user-facing messages to results, blockers, open decisions, and next steps. Report once per round, not once per tool call.

See also: [module contracts](module-contracts.md), [evaluation](evaluation.md), [release and access](release-and-access.md).
