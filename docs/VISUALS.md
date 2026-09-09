# Visuals: how the example images were made, and how to make yours

The template ships with no images. Each example adds a small set, all AI-generated for a fictional trip, all decorative. This page records the method so you can repeat it for your own trip with any image tool.

## What an image is allowed to do

- Set a mood on the cover, mark a day in the list, give the map page a sketch, add paper grain to cards.
- Never carry a fact. Times, prices, statuses and routes stay in the data and are rendered as text.

## The two grammars

**Cover — one scene.** A wide (21:9) realistic photograph of the trip's defining landscape. Leave open sky where the title will sit (`trip.cover.copy` picks the corner on desktop); on phones the title moves below the image, so the crop only has to work as a 4:3 window (`trip.cover.position`).

**Everything else — one photograph, one subject.** Day thumbnails are square photographs of a single object or moment from that day (a plane window, a bus-stop pole, a mossy step, two tickets on a counter). The route image is a photo of a paper map on a table with its text out of focus. The paper tile is a flat scan of plain paper, shown at 16% opacity behind cards. All are generated at 2K with GPT Image 2 (low tier) through Lovart, then resized to WebP.

Shared constraints in every prompt: realistic photograph, natural light, 35 mm, no HDR, no illustration; no recognizable faces, no readable text, no signs, no logos.

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
