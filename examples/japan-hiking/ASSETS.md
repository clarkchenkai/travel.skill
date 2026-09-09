# Assets — japan-hiking

All images are AI-generated photorealistic pictures made for this fictional example (Lovart, GPT Image 2, 2K), then resized and converted to WebP with `scripts/optimize-images.py`. They are decorative: no image carries a fact (time, price, status, route). Licensed with the repository under MIT to the extent the publisher holds rights in AI output; no exclusivity is claimed.

| File | Used by | Kind | SHA-256 | Prompt |
| --- | --- | --- | --- | --- |
| `assets/cover.webp` | `trip.cover.image` | realistic photograph (GPT Image 2 via Lovart) | `91fd1d0c83026b9b…` | Wide 21:9 cinematic-ratio realistic photograph, 2K. Realistic photograph, natural light, shot on a full-frame camera with a 35mm lens, true-to-life colors, gentle film-like grain, no HDR, no illustration, no painting, no… |
| `assets/day-1.webp` | `days[day-1].cover` | realistic photograph (GPT Image 2 via Lovart) | `d73e280cf9b1483d…` | Square 1:1 realistic photograph. Realistic photograph, natural light, shot on a full-frame camera with a 35mm lens, true-to-life colors, gentle film-like grain, no HDR, no illustration, no painting, no cartoon. No people… |
| `assets/day-2.webp` | `days[day-2].cover` | realistic photograph (GPT Image 2 via Lovart) | `8243cd609f316cfa…` | Square 1:1 realistic photograph. Realistic photograph, natural light, shot on a full-frame camera with a 35mm lens, true-to-life colors, gentle film-like grain, no HDR, no illustration, no painting, no cartoon. No people… |
| `assets/day-3.webp` | `days[day-3].cover` | realistic photograph (GPT Image 2 via Lovart) | `d51c7022427e9c8a…` | Square 1:1 realistic photograph. Realistic photograph, natural light, shot on a full-frame camera with a 35mm lens, true-to-life colors, gentle film-like grain, no HDR, no illustration, no painting, no cartoon. No people… |
| `assets/day-4.webp` | `days[day-4].cover` | realistic photograph (GPT Image 2 via Lovart) | `a3980dd6fc515d87…` | Square 1:1 realistic photograph. Realistic photograph, natural light, shot on a full-frame camera with a 35mm lens, true-to-life colors, gentle film-like grain, no HDR, no illustration, no painting, no cartoon. No people… |
| `assets/day-5.webp` | `days[day-5].cover` | realistic photograph (GPT Image 2 via Lovart) | `4247b280b0bbe9bf…` | Square 1:1 realistic photograph. Realistic photograph, natural light, shot on a full-frame camera with a 35mm lens, true-to-life colors, gentle film-like grain, no HDR, no illustration, no painting, no cartoon. No people… |
| `assets/paper.webp` | `trip.textures.paper` | realistic photograph (GPT Image 2 via Lovart) | `c07c49bcf4b95d7c…` | Square 1:1 realistic photograph. Realistic photograph, natural light, shot on a full-frame camera with a 35mm lens, true-to-life colors, gentle film-like grain, no HDR, no illustration, no painting, no cartoon. No people… |
| `assets/route.webp` | `routeOverview.image` | realistic photograph (GPT Image 2 via Lovart) | `9d3fbef5b26a053e…` | Landscape 4:3 realistic photograph. Realistic photograph, natural light, shot on a full-frame camera with a 35mm lens, true-to-life colors, gentle film-like grain, no HDR, no illustration, no painting, no cartoon. No peo… |
| `assets/day-3.webp` | `days[day-3].cover` | realistic photograph (GPT Image 2 via Lovart) | `d51c7022427e9c8a…` | mossy stone step + contour line; see cover-zine.json in the generation log… |

## Local responsive derivatives (2026-09-09)

Generated from the existing WebP files above with `scripts/optimize-images.py --variants cover|thumbnail --quality 72`. No new image generation or outside source was used. Originals are unchanged. The build discovers these width-suffixed siblings, emits matching preload/`srcset`/`sizes`, and includes them in its release manifest and offline cache. Thumbnail widths cover 1×/2× at the largest 88 px display size.

| File | Local source | Pixels | Bytes | SHA-256 |
| --- | --- | --- | --- | --- |
| `assets/cover-900w.webp` | `assets/cover.webp` | 900 × 386 | 25,610 | `12ec009824c552e2973d3b8901545925752e0a5f54aa79a87415f30e2ad50119` |
| `assets/cover-1800w.webp` | `assets/cover.webp` | 1800 × 771 | 78,934 | `4c0f397f6ab37d437c6f5accdc8a01307b0e23566334b4e22d87aebf9508ee84` |
| `assets/day-1-88w.webp` | `assets/day-1.webp` | 88 × 88 | 966 | `3aef557ef2ce0e8062e2d501a447fed899ecd0643c3693317ce39b1a24e2b097` |
| `assets/day-1-176w.webp` | `assets/day-1.webp` | 176 × 176 | 2,080 | `629d9507900014f4b528694f18a99ce8f56a8fdd288941cf0fcdd06c662e9e30` |
| `assets/day-2-88w.webp` | `assets/day-2.webp` | 88 × 88 | 1,238 | `076771e012c45e32adf4fdb9464029e134635b2568493acbe251391e80da4714` |
| `assets/day-2-176w.webp` | `assets/day-2.webp` | 176 × 176 | 3,448 | `071c73d7ff73b0c0e6703229911922919584d1f1d717129d70a546998602eb66` |
| `assets/day-3-88w.webp` | `assets/day-3.webp` | 88 × 88 | 2,014 | `aaa218543b1a939591af62ac435c73e1bbe3937276ddaa92a4ecb5db522203f8` |
| `assets/day-3-176w.webp` | `assets/day-3.webp` | 176 × 176 | 6,060 | `c91e1b19d50c0bc1308469a28de60555ee3f4eeb7e63ab963e2b33ec804d8ee3` |
| `assets/day-4-88w.webp` | `assets/day-4.webp` | 88 × 88 | 1,724 | `147ad7133976f15f225f08a3fe9e3e6950b9854b684164ed66f5371f3a52f611` |
| `assets/day-4-176w.webp` | `assets/day-4.webp` | 176 × 176 | 4,012 | `7d5788a6ba4e1b54e332884b702725ad7aa851282b1f18d3a4b1ba9345e5b80e` |
| `assets/day-5-88w.webp` | `assets/day-5.webp` | 88 × 88 | 1,060 | `73d7755f7ef203da1e36e1492c22b8c5e83ab16b86e1dad1da83b5c20cb80e0b` |
| `assets/day-5-176w.webp` | `assets/day-5.webp` | 176 × 176 | 2,590 | `c87dcc1d628ed3e338b4074f893df674f4729e53be240385e1922343f4ed92ad` |
