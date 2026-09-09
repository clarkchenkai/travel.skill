# Build, Release, Access, and Maintenance

## Before release

Confirm the current goal: runs locally, shared preview, production launch, or open source. Authorization carries within a session, but "organize my trip" never implies signing up, purchasing, or publishing.

Pick hosting from the real readers and the real network. If your travel companions will open the link on a network where a given host or map provider is blocked, that is a requirement now — not an afterthought.

## Git and controlled output

1. Create or reuse a repo in the right project. Exclude originals, credentials, private JSON, and working notes that should not be public first.
2. Generate a public snapshot. Private working data must not enter CI, and a private source repo does not protect the resulting public website.
3. The build emits only the allowed HTML, JS, CSS, public JSON, images, and licenses.
4. A clean checkout can build; dependency versions and runtime are reproducible. Never depend on a machine-local absolute path or a file that is not in git.
5. New assets, desktop CSS, and font licenses enter the output manifest; removed assets leave it. Cleanup targets only generated directories — never original images or user material.
6. An open-source template gets fresh sample data and an audited history. Do not flip a real trip repository to public. Check licenses and asset provenance separately.

Hosting choice is a per-project decision made against current official documentation, not a default. Whatever you pick, verify the real access path for your real readers.

## Mainline release chain

~~~text
adopted requirement → integration commit → clean build → release manifest → push
→ deployment succeeds for that commit → read back version/assets at the production URL
→ exercise affected interactions
~~~

- Production uses an explicit controlled branch; worktree exploration must not overwrite the live site.
- Handle first-time account connection and app installation at the real authorization step, showing the specific account, repository, and permissions. Do not grant access to everything by default.
- If the deploy task pushed a config commit first, preserve ancestry when integrating. Do not force-push over a divergence.
- Keep the same URL across updates so old links keep working. If a domain must change, state the migration boundary for stored user state.

## Cache and versions

The HTML entry, styles, scripts, data, and new images can each be cached independently. Version query parameters or content hashes both work — pick the one the project can maintain.

Check:

- The title and version the page actually received.
- HTTP status and SHA-256 or another content identifier for each changed asset.
- That the network actually loaded the new asset, rather than 404ing and showing the old placeholder.
- CDN cache, browser cache, service worker, and stale worktree previews diagnosed separately.

Verify the full list on the first release; afterwards check only changed assets. Re-downloading an 8MB font set for a one-line change proves nothing. Source and build artifacts hash differently by nature — compare artifacts from the same build pipeline.

## Runnable release audit

The project ships a release audit script:

~~~sh
node scripts/check-release.mjs ./public --manifest ./release-manifest.json
~~~

The manifest is an object of `relative path → SHA-256`. Generate it after the build, writing the output **outside** the public directory. Generating a manifest is not the same as reviewing it.

The script is read-only: it does not modify the directory, upload anything, or make network calls. It:

- Rejects absolute paths, parent-directory escapes, and symlinks pointing outside the output directory.
- Checks that declared files exist, hashes match, and no undeclared extra files are present.
- Rejects common credential files and source-repository leftovers.
- Flags explicit `private`/`restricted` markers in JSON, high-confidence sensitive keys, and common secret patterns.

**Exit code 0 only means those static checks passed.** It does not inspect identities or order numbers in free text, does not read images, does not verify the running site, does not confirm licenses, and does not prove the site is reachable on any particular network. Different field conventions need human review; "no hits" is not a privacy guarantee.

## Regional access

Every access result records: date, URL, region and carrier, Wi-Fi or mobile, whether a proxy was in use, browser or in-app browser, and whether the first screen and the map worked separately.

- **If your readers are in a region where a map provider or a host is blocked, test on that network. A success through a proxy is not proof.** HTTP 200 is not proof that images, fonts, and maps all loaded.
- Host reachability and third-party map reachability are two different chains. Text and images can work while the map does not.
- A vendor document saying a service has no presence in some region does not prove every user there needs a VPN; an occasional direct connection does not prove stability.
- Diagnose in layers — DNS, TLS, HTTP, assets, interaction. Never change the user's system proxy or network settings to make a test pass.
- A custom domain may help but does not guarantee direct access. Solve regional availability with real testing on the target network and an appropriate host.
- With no access to the target environment, report it as untested and give the user the shortest real check to run. Do not fabricate probe nodes or screenshots.
- Share cards in messaging apps can cache an old title or image. Updating the page is not updating the card; keep them distinct.

Shortest user acceptance for a hard-to-reach region: turn off the VPN they chose to turn off → open the production URL on mobile data → wait for the first screen and body → open one map → record which layer failed.

## Lifetime and maintenance

No expiry setting does not mean the platform guarantees forever. Accounts, projects, domain renewals, hosting policy, access rights, and data retention each have their own lifecycle. The trip ending only affects planning status and countdowns; it should not delete the itinerary unless the user asks.

After the trip, keep a read-only keepsake version or remove sensitive details on request. Do not archive, delete, or expose more on the user's behalf by default.

## Completion receipt

~~~text
Production URL:
Production commit / deployment:
Read back this time:
Devices and networks verified:
Still unverified:
How future updates ship:
~~~

If another task takes the browser, say which steps succeeded and which one has no result. Never turn a visible bottom bar into "the click passed".

## Publishing without git

If the user does not want a repository, do not initialize one. Produce the same controlled static output. If they explicitly want to publish and the platform supports direct upload: check the current official upload capability → choose an existing account and project → upload only the public directory or a zip → record artifact hashes and the deployed version → open the production URL and verify. Future updates still build from the same data and source and go to the same project, and a manually uploaded rollback version must remain findable. With no usable upload capability or login authorization, stop at the real blocker and say so — a local zip is not a live site.

## Recovery drill

Keeping git history or an old zip means you have recovery material, not that recovery is verified. When a data, storage, or release change carries real risk, drill it in an isolated or authorized environment:

1. Pick a known-good commit and its artifact; record the current production version and the target version.
2. Preserve user state. Check whether the old code can read the current state and data structures; design compatibility or migration first rather than clearing state to hide the problem.
3. Restore through a traceable revert commit or the host's real rollback feature; avoid rewriting shared history. For direct-upload projects, use the verified older artifact.
4. Read back the production URL, the changed assets, the core entries, and personal records to confirm the old version really works.
5. Record how to return to the new version; restore the agreed environment afterwards.

If you did not drill, write "recovery procedure prepared, not drilled". Never promise automatic vendor rollback, reversible database migrations, or that cross-device records cannot be lost.

See also: [evaluation](evaluation.md), [data and countries](data-and-countries.md), [orchestration](orchestration.md).
