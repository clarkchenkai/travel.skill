# Visual Direction, Assets, and Motion

## 1. Lock the value before the style

Extract the user's current constraints: which tasks come first, what mood, what must stand out, what has already been rejected. When a new requirement changes a constraint, update the current version — do not let an old prototype keep deciding the page.

Reuse the method across countries, never the country's symbols. A mountain-trail journal, an island logbook, and a city transit handbook should look different. **Cedar leaves, brush calligraphy, aged paper, and any one country's transit rules are not global defaults.**

When the direction is clear, implement it. When it is unclear and worth comparing, build 2–3 substantially different local variants on the same real state. Once the user picks, remove the comparison switcher — a review UI must not ship.

## 2. Image brief

Write these seven lines before generating anything:

~~~text
Use: <home / day cover / map imagery / ticket paper / icon>
Subject and mood: <specific>
Composition: <subject position, negative space, aspect ratio, text-safe area>
Material and color: <confirmed direction>
Output: <solid background or true transparency, target size>
Fixed: <shapes, routes, or reference boundaries that must not change>
Exclude: <facts baked as text, unwanted watermarks, brands, extra elements>
~~~

When the user asks for generated images, actually generate them; a hasty SVG or CSS collage is not a substitute. Prefer reusing an existing asset over regenerating for volume. Before editing an existing image, look at it and say what must be preserved.

## 3. What text belongs in an image

- Calligraphic titles and non-functional decorative text can be image, with correct alt text and an accessible heading.
- Times, ticket numbers, amounts, place lookups, status, and countdowns render in the DOM so they can be edited, copied, zoomed, and localized.
- Verify every place name in an illustrated map character by character; the real place directory and navigation targets exist independently.
- A generated image never changes route facts. A landmark motif does not add a visit to the itinerary.
- Record provenance honestly: reference, AI-generated, AI-edited, real photograph. A photo existing is not permission to republish it, and generating an image does not prove no third-party rights exist.

## 4. Asset QA

For every image you actually ship, check:

1. Subject, text, people count, and orientation match the brief; no duplicated or extra limbs.
2. Transparent assets have real alpha, not a checkerboard or white fake transparency.
3. Real mobile and desktop crops keep the subject and the title-safe area.
4. Day covers in a set are distinguishable — not several near-identical towers or the same forest reused.
5. Sprite frame boundaries match real pixels; do not divide evenly when columns are uneven. Neighboring edges must not bleed in.
6. Transparent objects do not inherit another sprite's background; no ghosting on screen.
7. Large textures do not stretch; ticket paper is decoupled from variable-height body text.
8. Assets are saved into the project and found by the build; licenses and required attributions travel with the delivery.

Keep an asset list in your existing design notes: use, path, source or prompt, transparency and size, crop, adoption status. Rejected images do not join the release automatically.

## 5. Real font checks

- Pick the character first, then check glyph coverage, legibility, licensing, and download cost. If the user asked for a handwritten face, do not quietly revert to a "safer" sans.
- Global tokens are a start, not the end. Search for `font-family` and `font` shorthand across dialogs, times, prices, buttons, animation inline styles, and legacy components.
- In the browser, check font loading, the actual computed first font, and screenshots of representative glyphs. Fallback, not-yet-loaded, and cached are three different states.
- Rare place names typed in later still need a readable fallback. Subsetting requires a stated missing-glyph policy — do not cut to today's JSON and break tomorrow's input.
- Self-hosted fonts keep their licenses. Whether conversion, subsetting, and renaming are allowed depends on that license.
- Do not let a large font family block the first screen. Record font and first-screen script sizes and cold-load timing, adopt `font-display` or similar, and measure. A warm local cache is not a weak-network experience.

## 6. Animation state contract

Write this table before implementing:

| State | Enter when | Visible layers | Leave when | Interruptible behavior |
| --- | --- | --- | --- | --- |
| Initial | First entry | Complete static scene / entry | User action or the agreed auto-start | Content is reachable with no animation at all |
| Running | Start | Current stage assets | Animation completes, or effective playback time elapses | Pause / skip / off-screen |
| Transition | Previous stage ends | Old and new layers per the agreed overlap | Final state is ready | Skip completes it directly |
| Complete | Normal finish or skip | Title, navigation, content | Explicit replay or leave | Stale callbacks cannot reverse it |

Update the table every time you change "does it leave first or arrive first". Do not copy today's 0.4s exit or 1.1s stage as a default for every project.

Implementation notes:

- One control source per stage. Render, CSS, and timers must not each declare the stage finished.
- Use effective playback time; pause and correct the clock when off-screen or hidden so resuming does not jump.
- Cancel listeners, RAF, and stale requests. A skip callback may only transition from a currently valid state; a late flight-complete callback must not overwrite a finished state.
- Decode initial assets before showing the composite, so a single layer does not appear alone; a failure must still leave a way in.
- Stacked parent/child opacity animations on the same element cause flashes. Find the real trigger instead of adding delay.
- Unmount after the object leaves the frame so a tail is not cut off; positions stay continuous between frames.
- The final state stops running useless RAF. Even a light CSS sway respects reduced motion.
- Remove a full-screen skip overlay when it finishes so it cannot block the bottom bar; give the keyboard a reachable alternative.
- If you do not need depth or water effects, plain CSS and native animation are enough. Do not force WebGL on every module because one reference project used it.

Keyframes must cover at least: cold load, first frame, subject entry, layer hand-off, exit, final state, and a delayed read-back after skip. A screenshot of the final state proves nothing about the process.

## 7. Mobile and desktop are two layouts

Follow the user's page structure first; both ends share facts and state.

| Mobile | Desktop |
| --- | --- |
| Single-column reading, thumb-reachable entries, safe areas | Map and directory side by side, generous content width cap |
| Day cards expand in place, controls clearly visible | Two-column day cards, cross-column or master–detail expansion |
| Flight cards swipe with a peeking edge; long tickets stay readable | Tickets and transport guidance side by side, cards still switchable |
| Checklist input not covered by the keyboard | Two-column checklist keeping natural keyboard order |
| Small crops must not lose the subject | Do not stretch small images or center a narrow mobile column and call it done |

Choose breakpoints by whether the content fits. Sizes like 375/390 and 1024/1440 are useful acceptance sizes for one project, not the whole world — also check intermediate widths, short screens, and large type. Desktop text-safe areas and ticket padding usually need separate calibration.

## 8. Ablation comparison

After any significant design move, ask: if this were removed, what would the user lose in the same task?

Compare reversibly: with and without the duplicate return module, the title bar, menu labels, status badges, motion. Record screenshots, actions, and outcomes. When the user asks for a removal, just remove it — do not stall behind an experiment. And do not delete a critical entry point in the name of "cleaner".

## 9. Performance: the real critical path

Agree on an acceptable first-screen wait and a target network for this project. A single second count does not describe every reader's network. Record when each of these arrives: first HTML, critical CSS and fonts, first image, main script, interactive entry.

- The home page preloads only what it needs now; other pages' images come later. Do not mark every day image and the full motion bundle as highest priority.
- If the entry cannot appear until a large shared script loads, mount a static first screen or a light entry separately and load the optional 3D afterwards.
- A readable fallback font appears first; compressing or splitting a large family still needs a missing-glyph policy and license compliance.
- Choose image resolution and format by use. Keep originals, but do not ship every original PNG into the first screen.
- Every comparison states cache (cold/warm), network conditions, and device. Record render and interaction jank, not just smaller files.

A static check reporting a total asset size is not a statement about first-screen download, and passing an asset manifest is not a performance result. Keep the two separate.

See also: [module contracts](module-contracts.md), [evaluation](evaluation.md).
