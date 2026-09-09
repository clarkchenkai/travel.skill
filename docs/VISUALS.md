# Visuals: how the example images were made, and how to make yours

The template ships with no images. Each example adds a small set, all AI-generated for a fictional trip, all decorative. This page records the method so you can repeat it for your own trip with any image tool.

## What an image is allowed to do

- Set a mood on the cover, mark a day in the list, give the map page a sketch, add paper grain to cards.
- Never carry a fact. Times, prices, statuses and routes stay in the data and are rendered as text.

## The two grammars

**Cover — one scene.** A wide (21:9) illustration in a style that matches the theme: ink-and-wash for `field-notes`, mid-century rail poster for `timetable`, loose watercolor for `tide`. Leave open sky where the title will sit; on phones the title moves below the image, so the crop only has to work as a 4:3 window (`trip.cover.position`).

**Everything else — one paper poster.** Day thumbnails, the route sketch and the paper tile follow the "minimal zine" grammar: full-frame scanned paper, 70–85% empty, one small visual event (a photo fragment, a silhouette, a torn shape, a line), one saturated accent hue that matches the theme accent, print defects (risograph grain, misregistration), and **no text at all**. Thumbnails are generated square with the event centred so a 64 px crop still reads.

Per-example accents: moss green `#4f6b4a`, signal red `#d5232a`, coral `#f2745f`. Paper tones: warm ivory, cool grey-white, pale sand.

## Brief template (fill seven lines before generating)

```text
Use: cover / day thumbnail / route sketch / paper tile
Subject & mood: <one relation, e.g. "a torn photo of one mossy step and a line walking away">
Composition: <ratio; cluster size and position; where the title will go>
Material & color: <paper tone; the one accent hue as hex; carrier of that hue>
Output: <ratio, 2K; square for thumbnails>
Invariants: no words, no letters, no numbers, no logos, no brand items
Avoid: full-bleed scene, cinematic light, 3D, cartoon, multicolor
```

The exact prompts used for the shipped examples are in each example's `ASSETS.md`.

## Processing

`scripts/optimize-images.py <src.png> <dest.webp> --max 640 --square` (needs Pillow; maintainer tool). Budgets: cover ≤ 200 KB, thumbnail ≤ 40 KB, route ≤ 150 KB, paper tile ≤ 60 KB. `npm run build` only copies images the data references.

## Fonts

The three themes use system font stacks on purpose: no download, no licensing question, no blank text on slow networks. If you want a specific typeface, self-host a WOFF2 under `trip/assets/`, add an `@font-face` with `font-display: swap` in a theme block, list it in `trip.publishAssets`, and keep the license file next to it.
